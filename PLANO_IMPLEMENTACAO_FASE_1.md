# Plano de Implementação Detalhado - Fase 1
## DataSESMT Pro - Funcionalidades Críticas

**Período Estimado:** 2-3 semanas  
**Prioridade:** 🔴 Crítica (Obrigatória por Lei)  
**Objetivo:** Implementar 8 funcionalidades críticas para conformidade legal brasileira

---

## 📋 ÍNDICE

1. [Arquitetura Geral](#arquitetura-geral)
2. [1️⃣ Mapa de Riscos Interativo](#1-mapa-de-riscos-interativo)
3. [2️⃣ Gestão de GHE](#2-gestão-de-ghe)
4. [3️⃣ Avaliações Ambientais (NR-09)](#3-avaliações-ambientais-nr-09)
5. [4️⃣ Gestão de Laudos](#4-gestão-de-laudos)
6. [5️⃣ Matriz de Compatibilidade](#5-matriz-de-compatibilidade)
7. [6️⃣ Afastamentos Ampliado](#6-afastamentos-ampliado)
8. [7️⃣ Relatórios Obrigatórios](#7-relatórios-obrigatórios)
9. [8️⃣ eSocial Integração](#8-esocial-integração)
10. [Cronograma](#cronograma)

---

## 🏗️ ARQUITETURA GERAL

### Mudanças no Schema do Banco de Dados

```sql
-- Novas tabelas para Fase 1

-- 1. Mapa de Riscos (Setores/Áreas)
CREATE TABLE risk_map_areas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unitId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  coordinates JSON, -- {x, y, width, height} para SVG
  riskLevel ENUM('Tolerável', 'Moderado', 'Substancial', 'Intolerável'),
  riskScore INT, -- Calculado dinamicamente
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unitId) REFERENCES company_units(id)
);

-- 2. GHE (Grupos Homogêneos de Exposição)
CREATE TABLE ghe (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unitId INT NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  riskMapAreaId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unitId) REFERENCES company_units(id),
  FOREIGN KEY (riskMapAreaId) REFERENCES risk_map_areas(id)
);

-- 3. Funcionários vinculados a GHE
CREATE TABLE employee_ghe (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employeeId INT NOT NULL,
  gheId INT NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES employees(id),
  FOREIGN KEY (gheId) REFERENCES ghe(id)
);

-- 4. Agentes de Exposição por GHE
CREATE TABLE ghe_exposure_agents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gheId INT NOT NULL,
  agentType ENUM('Químico', 'Físico', 'Biológico', 'Ergonômico', 'Acidente'),
  agentName VARCHAR(255) NOT NULL,
  riskLevel ENUM('Tolerável', 'Moderado', 'Substancial', 'Intolerável'),
  limiteTolerance DECIMAL(10,2),
  unit VARCHAR(50), -- ppm, mg/m³, dB, etc
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gheId) REFERENCES ghe(id)
);

-- 5. Avaliações Ambientais (NR-09)
CREATE TABLE environmental_assessments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unitId INT NOT NULL,
  gheId INT,
  assessmentDate DATE NOT NULL,
  assessmentType ENUM('Inicial', 'Periódica', 'Especial', 'Mudança'),
  agentType ENUM('Químico', 'Físico', 'Biológico', 'Ergonômico'),
  agentName VARCHAR(255) NOT NULL,
  measuredValue DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50), -- ppm, mg/m³, dB, °C, etc
  limiteTolerance DECIMAL(10,2),
  indexBiologico DECIMAL(10,2),
  conformity ENUM('Conforme', 'Não Conforme', 'Acima do LT'),
  assessor VARCHAR(255),
  equipment VARCHAR(255),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unitId) REFERENCES company_units(id),
  FOREIGN KEY (gheId) REFERENCES ghe(id)
);

-- 6. Laudos Técnicos com Versionamento
CREATE TABLE technical_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unitId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  type ENUM('LTCAT', 'PPP', 'Laudo Ambiental', 'Laudo Ergonômico', 'PPRA', 'PGR'),
  status ENUM('Rascunho', 'Aguardando Aprovação', 'Aprovado', 'Vigente', 'Obsoleto'),
  revision INT DEFAULT 1,
  author VARCHAR(255),
  approvedBy VARCHAR(255),
  approvedDate DATE,
  validFrom DATE,
  validUntil DATE,
  fileKey VARCHAR(255),
  fileUrl VARCHAR(255),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unitId) REFERENCES company_units(id)
);

-- 7. Histórico de Revisões de Laudos
CREATE TABLE technical_reports_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reportId INT NOT NULL,
  revision INT,
  changeDescription TEXT,
  changedBy VARCHAR(255),
  changedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reportId) REFERENCES technical_reports(id)
);

-- 8. Matriz de Compatibilidade Funcionário-Risco
CREATE TABLE employee_risk_compatibility (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employeeId INT NOT NULL,
  riskMapAreaId INT NOT NULL,
  trained BOOLEAN DEFAULT FALSE,
  examOk BOOLEAN DEFAULT FALSE,
  epiAvailable BOOLEAN DEFAULT FALSE,
  apto BOOLEAN DEFAULT FALSE,
  lastValidationDate DATE,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES employees(id),
  FOREIGN KEY (riskMapAreaId) REFERENCES risk_map_areas(id)
);

-- 9. Afastamentos Ampliado
CREATE TABLE absences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employeeId INT NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE,
  reason ENUM('Acidente', 'Doença Ocupacional', 'Doença Comum', 'Licença', 'Outro'),
  absenceType ENUM('Abonado', 'CAT', 'INSS', 'Licença', 'Suspensão'),
  daysLost INT,
  catNumber VARCHAR(50),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES employees(id)
);

-- 10. Relatórios Obrigatórios
CREATE TABLE mandatory_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unitId INT NOT NULL,
  reportType ENUM('Acidentes', 'PCMSO', 'PPRA', 'PGR', 'CIPA', 'Treinamentos', 'Custos SST'),
  periodStart DATE,
  periodEnd DATE,
  generatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generatedBy VARCHAR(255),
  fileKey VARCHAR(255),
  fileUrl VARCHAR(255),
  status ENUM('Gerado', 'Enviado', 'Assinado'),
  signedBy VARCHAR(255),
  signedDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unitId) REFERENCES company_units(id)
);

-- 11. eSocial Eventos
CREATE TABLE esocial_events_extended (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unitId INT NOT NULL,
  eventCode VARCHAR(10), -- S-2210, S-2220, S-2240, S-2245
  eventType VARCHAR(255),
  eventData JSON,
  status ENUM('Rascunho', 'Validado', 'Enviado', 'Processado', 'Rejeitado', 'Cancelado'),
  transmissionId VARCHAR(100),
  receiptNumber VARCHAR(100),
  errorMessage TEXT,
  sentDate TIMESTAMP,
  processedDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unitId) REFERENCES company_units(id)
);
```

---

## 1️⃣ MAPA DE RISCOS INTERATIVO

### 1.1 Visão Geral
**Objetivo:** Criar visualização geográfica dos riscos por setor/área da empresa com código de cores e integração com GHE.

**Legislação:** NR-01 (Disposições Gerais), NR-05 (CIPA)

**Tempo Estimado:** 5-6 dias

### 1.2 Arquitetura

#### Backend (Node.js + tRPC)

**Novas Procedures:**

```typescript
// server/routers/riskMap.ts
export const riskMapRouter = router({
  // Listar áreas do mapa
  listAreas: protectedProcedure
    .input(z.object({ unitId: z.number() }))
    .query(({ input }) => db.getRiskMapAreas(input.unitId)),

  // Criar área no mapa
  createArea: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      coordinates: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    }))
    .mutation(({ input }) => db.createRiskMapArea(input)),

  // Atualizar área
  updateArea: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.any(),
    }))
    .mutation(({ input }) => db.updateRiskMapArea(input.id, input.data)),

  // Calcular nível de risco da área (baseado em riscos vinculados)
  calculateAreaRiskLevel: protectedProcedure
    .input(z.object({ areaId: z.number() }))
    .query(({ input }) => db.calculateAreaRiskLevel(input.areaId)),

  // Deletar área
  deleteArea: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteRiskMapArea(input.id)),

  // Gerar SVG do mapa
  generateMapSVG: protectedProcedure
    .input(z.object({ unitId: z.number() }))
    .query(({ input }) => db.generateRiskMapSVG(input.unitId)),
});
```

**Helpers do Banco de Dados:**

```typescript
// server/db.ts - Adicionar funções

export async function getRiskMapAreas(unitId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const areas = await db.select().from(riskMapAreas)
    .where(eq(riskMapAreas.unitId, unitId));
  
  // Calcular riskLevel dinamicamente baseado em riscos vinculados
  for (const area of areas) {
    const riskCount = await db.select().from(risks)
      .where(eq(risks.riskMapAreaId, area.id));
    
    const levels = riskCount.map(r => r.riskLevel);
    if (levels.includes('Intolerável')) area.riskLevel = 'Intolerável';
    else if (levels.includes('Substancial')) area.riskLevel = 'Substancial';
    else if (levels.includes('Moderado')) area.riskLevel = 'Moderado';
    else area.riskLevel = 'Tolerável';
  }
  
  return areas;
}

export async function calculateAreaRiskLevel(areaId: number) {
  const db = await getDb();
  if (!db) return 'Tolerável';
  
  const riskCount = await db.select().from(risks)
    .where(eq(risks.riskMapAreaId, areaId));
  
  const levels = riskCount.map(r => r.riskLevel);
  if (levels.includes('Intolerável')) return 'Intolerável';
  if (levels.includes('Substancial')) return 'Substancial';
  if (levels.includes('Moderado')) return 'Moderado';
  return 'Tolerável';
}

export async function generateRiskMapSVG(unitId: number) {
  const areas = await getRiskMapAreas(unitId);
  
  const colorMap = {
    'Tolerável': '#10b981',
    'Moderado': '#f59e0b',
    'Substancial': '#f97316',
    'Intolerável': '#ef4444',
  };
  
  let svg = '<svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">';
  
  for (const area of areas) {
    const coords = area.coordinates as any;
    const color = colorMap[area.riskLevel as keyof typeof colorMap] || '#e5e7eb';
    
    svg += `
      <rect 
        x="${coords.x}" 
        y="${coords.y}" 
        width="${coords.width}" 
        height="${coords.height}"
        fill="${color}"
        stroke="#333"
        stroke-width="2"
        opacity="0.7"
        data-area-id="${area.id}"
      />
      <text 
        x="${coords.x + coords.width / 2}" 
        y="${coords.y + coords.height / 2}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="12"
        font-weight="bold"
        fill="#fff"
      >${area.name}</text>
    `;
  }
  
  svg += '</svg>';
  return svg;
}
```

#### Frontend (React)

**Nova Página: `client/src/pages/RiskMap.tsx`**

```typescript
import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Download } from 'lucide-react';

export default function RiskMap() {
  const [unitId, setUnitId] = useState(1);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [newArea, setNewArea] = useState({ name: '', description: '' });
  const svgRef = useRef<SVGSVGElement>(null);

  const { data: areas, isLoading, refetch } = trpc.riskMap.listAreas.useQuery({ unitId });
  const createMutation = trpc.riskMap.createArea.useMutation({
    onSuccess: () => {
      toast.success('Área criada com sucesso');
      refetch();
      setNewArea({ name: '', description: '' });
    },
  });

  const handleSVGMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!newArea.name) {
      toast.error('Digite o nome da área primeiro');
      return;
    }
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartCoords({ x, y });
  };

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Mostrar preview do retângulo sendo desenhado
    // (implementar com canvas overlay)
  };

  const handleSVGMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    const coordinates = {
      x: Math.min(startCoords.x, endX),
      y: Math.min(startCoords.y, endY),
      width: Math.abs(endX - startCoords.x),
      height: Math.abs(endY - startCoords.y),
    };
    
    createMutation.mutate({
      unitId,
      name: newArea.name,
      description: newArea.description,
      coordinates,
    });
    
    setIsDrawing(false);
  };

  const RISK_COLORS = {
    'Tolerável': '#10b981',
    'Moderado': '#f59e0b',
    'Substancial': '#f97316',
    'Intolerável': '#ef4444',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Riscos Interativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-semibold mb-2">Como usar:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-900">
              <li>Digite o nome da área (ex: Setor de Produção)</li>
              <li>Clique e arraste no mapa para desenhar a área</li>
              <li>A cor será atualizada automaticamente baseada nos riscos</li>
            </ol>
          </div>

          {/* Formulário para criar área */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Nome da área"
              value={newArea.name}
              onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newArea.description}
              onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
            />
          </div>

          {/* SVG do Mapa */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-auto bg-gray-50">
            <svg
              ref={svgRef}
              viewBox="0 0 1200 800"
              className="w-full cursor-crosshair"
              onMouseDown={handleSVGMouseDown}
              onMouseMove={handleSVGMouseMove}
              onMouseUp={handleSVGMouseUp}
              onMouseLeave={() => setIsDrawing(false)}
            >
              {/* Grid de fundo */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="1200" height="800" fill="url(#grid)" />

              {/* Áreas de risco */}
              {areas?.map((area) => {
                const coords = area.coordinates as any;
                const color = RISK_COLORS[area.riskLevel as keyof typeof RISK_COLORS] || '#e5e7eb';
                
                return (
                  <g key={area.id}>
                    <rect
                      x={coords.x}
                      y={coords.y}
                      width={coords.width}
                      height={coords.height}
                      fill={color}
                      stroke="#333"
                      strokeWidth="2"
                      opacity="0.7"
                      onClick={() => setSelectedArea(area)}
                      className="cursor-pointer hover:opacity-90"
                    />
                    <text
                      x={coords.x + coords.width / 2}
                      y={coords.y + coords.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#fff"
                      pointerEvents="none"
                    >
                      {area.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legenda */}
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(RISK_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="text-sm">{level}</span>
              </div>
            ))}
          </div>

          {/* Lista de áreas */}
          <div className="space-y-2">
            <h3 className="font-semibold">Áreas Cadastradas:</h3>
            {areas?.map((area) => (
              <div key={area.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: RISK_COLORS[area.riskLevel as keyof typeof RISK_COLORS],
                    }}
                  />
                  <div>
                    <p className="font-medium">{area.name}</p>
                    <p className="text-xs text-gray-600">{area.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit2 size={14} />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 1.3 Integração no App.tsx

```typescript
import RiskMap from "./pages/RiskMap";

// Adicionar rota
<Route path="/app/risk-map">
  {() => <SSTLayout><RiskMap /></SSTLayout>}
</Route>
```

### 1.4 Integração no SSTLayout

Adicionar link no menu de navegação:

```typescript
{
  icon: <MapPin size={18} />,
  label: "Mapa de Riscos",
  href: "/app/risk-map",
}
```

### 1.5 Testes Vitest

```typescript
// server/riskMap.test.ts
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("riskMap", () => {
  it("creates a risk map area", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const area = await caller.riskMap.createArea({
      unitId: 1,
      name: "Setor de Produção",
      description: "Área com máquinas",
      coordinates: { x: 100, y: 100, width: 200, height: 150 },
    });
    
    expect(area).toBeDefined();
    expect(area.name).toBe("Setor de Produção");
  });

  it("calculates area risk level", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const level = await caller.riskMap.calculateAreaRiskLevel({ areaId: 1 });
    expect(['Tolerável', 'Moderado', 'Substancial', 'Intolerável']).toContain(level);
  });
});
```

---

## 2️⃣ GESTÃO DE GHE

### 2.1 Visão Geral
**Objetivo:** Gerenciar Grupos Homogêneos de Exposição com funcionários vinculados e agentes de exposição.

**Legislação:** NR-07 (PCMSO), NR-09 (PPRA)

**Tempo Estimado:** 4-5 dias

### 2.2 Arquitetura

#### Backend (Node.js + tRPC)

```typescript
// server/routers/ghe.ts
export const gheRouter = router({
  list: protectedProcedure
    .input(z.object({ unitId: z.number() }))
    .query(({ input }) => db.getGHEs(input.unitId)),

  create: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      riskMapAreaId: z.number().optional(),
    }))
    .mutation(({ input }) => db.createGHE(input)),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: z.any() }))
    .mutation(({ input }) => db.updateGHE(input.id, input.data)),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteGHE(input.id)),

  // Vincular funcionário a GHE
  addEmployee: protectedProcedure
    .input(z.object({
      gheId: z.number(),
      employeeId: z.number(),
      startDate: z.string(),
    }))
    .mutation(({ input }) => db.addEmployeeToGHE(input)),

  // Remover funcionário de GHE
  removeEmployee: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.removeEmployeeFromGHE(input.id)),

  // Listar funcionários de um GHE
  getEmployees: protectedProcedure
    .input(z.object({ gheId: z.number() }))
    .query(({ input }) => db.getGHEEmployees(input.gheId)),

  // Agentes de exposição
  addExposureAgent: protectedProcedure
    .input(z.object({
      gheId: z.number(),
      agentType: z.enum(['Químico', 'Físico', 'Biológico', 'Ergonômico', 'Acidente']),
      agentName: z.string(),
      riskLevel: z.enum(['Tolerável', 'Moderado', 'Substancial', 'Intolerável']),
      limiteTolerance: z.number().optional(),
      unit: z.string().optional(),
    }))
    .mutation(({ input }) => db.addGHEExposureAgent(input)),

  getExposureAgents: protectedProcedure
    .input(z.object({ gheId: z.number() }))
    .query(({ input }) => db.getGHEExposureAgents(input.gheId)),
});
```

#### Frontend (React)

**Nova Página: `client/src/pages/GHE.tsx`**

```typescript
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Users } from 'lucide-react';

export default function GHE() {
  const [unitId, setUnitId] = useState(1);
  const [newGHE, setNewGHE] = useState({ code: '', name: '', description: '' });
  const [selectedGHE, setSelectedGHE] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: ghes, refetch } = trpc.ghe.list.useQuery({ unitId });
  const { data: employees } = selectedGHE ? trpc.ghe.getEmployees.useQuery({ gheId: selectedGHE.id }) : { data: [] };
  const { data: agents } = selectedGHE ? trpc.ghe.getExposureAgents.useQuery({ gheId: selectedGHE.id }) : { data: [] };

  const createMutation = trpc.ghe.create.useMutation({
    onSuccess: () => {
      toast.success('GHE criado com sucesso');
      refetch();
      setNewGHE({ code: '', name: '', description: '' });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de GHE (Grupos Homogêneos de Exposição)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário para criar GHE */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              placeholder="Código (ex: GHE-001)"
              value={newGHE.code}
              onChange={(e) => setNewGHE({ ...newGHE, code: e.target.value })}
            />
            <Input
              placeholder="Nome (ex: Operadores de Máquina)"
              value={newGHE.name}
              onChange={(e) => setNewGHE({ ...newGHE, name: e.target.value })}
            />
            <Input
              placeholder="Descrição"
              value={newGHE.description}
              onChange={(e) => setNewGHE({ ...newGHE, description: e.target.value })}
            />
          </div>
          <Button onClick={() => createMutation.mutate({ unitId, ...newGHE })}>
            <Plus size={16} className="mr-2" /> Criar GHE
          </Button>

          {/* Lista de GHEs */}
          <div className="space-y-2">
            {ghes?.map((ghe) => (
              <div
                key={ghe.id}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedGHE?.id === ghe.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedGHE(ghe)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{ghe.code} - {ghe.name}</p>
                    <p className="text-sm text-gray-600">{ghe.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={14} />
                    <span>{employees?.length || 0} funcionários</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detalhes do GHE selecionado */}
          {selectedGHE && (
            <Tabs defaultValue="employees" className="mt-6">
              <TabsList>
                <TabsTrigger value="employees">Funcionários</TabsTrigger>
                <TabsTrigger value="agents">Agentes de Exposição</TabsTrigger>
              </TabsList>

              <TabsContent value="employees">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {employees?.map((emp) => (
                        <div key={emp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{emp.employeeName}</span>
                          <Button size="sm" variant="ghost" className="text-red-600">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agents">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {agents?.map((agent) => (
                        <div key={agent.id} className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{agent.agentName}</p>
                              <p className="text-sm text-gray-600">{agent.agentType}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{agent.limiteTolerance} {agent.unit}</p>
                              <span className={`text-xs px-2 py-1 rounded ${
                                agent.riskLevel === 'Intolerável' ? 'bg-red-100 text-red-800' :
                                agent.riskLevel === 'Substancial' ? 'bg-orange-100 text-orange-800' :
                                agent.riskLevel === 'Moderado' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {agent.riskLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 3️⃣ AVALIAÇÕES AMBIENTAIS (NR-09)

### 3.1 Visão Geral
**Objetivo:** Registrar medições de agentes ambientais (químicos, físicos, biológicos) e comparar com Limites de Tolerância.

**Legislação:** NR-09 (Programa de Prevenção de Riscos Ambientais)

**Tempo Estimado:** 4-5 dias

### 3.2 Arquitetura

#### Backend (Node.js + tRPC)

```typescript
// server/routers/environmentalAssessments.ts
export const environmentalAssessmentsRouter = router({
  list: protectedProcedure
    .input(z.object({ unitId: z.number(), gheId: z.number().optional() }))
    .query(({ input }) => db.getEnvironmentalAssessments(input.unitId, input.gheId)),

  create: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      gheId: z.number().optional(),
      assessmentDate: z.string(),
      assessmentType: z.enum(['Inicial', 'Periódica', 'Especial', 'Mudança']),
      agentType: z.enum(['Químico', 'Físico', 'Biológico', 'Ergonômico']),
      agentName: z.string(),
      measuredValue: z.number(),
      unit: z.string(),
      limiteTolerance: z.number(),
      indexBiologico: z.number().optional(),
      assessor: z.string(),
      equipment: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const conformity = input.measuredValue <= input.limiteTolerance ? 'Conforme' : 'Não Conforme';
      return db.createEnvironmentalAssessment({ ...input, conformity });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: z.any() }))
    .mutation(({ input }) => db.updateEnvironmentalAssessment(input.id, input.data)),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteEnvironmentalAssessment(input.id)),

  // Gerar relatório PPRA
  generatePPRAReport: protectedProcedure
    .input(z.object({ unitId: z.number(), year: z.number() }))
    .query(({ input }) => db.generatePPRAReport(input.unitId, input.year)),
});
```

#### Frontend (React)

**Nova Página: `client/src/pages/EnvironmentalAssessments.tsx`**

```typescript
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Download, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EnvironmentalAssessments() {
  const [unitId, setUnitId] = useState(1);
  const [newAssessment, setNewAssessment] = useState({
    assessmentDate: new Date().toISOString().split('T')[0],
    assessmentType: 'Periódica',
    agentType: 'Químico',
    agentName: '',
    measuredValue: 0,
    unit: 'ppm',
    limiteTolerance: 0,
    assessor: '',
    equipment: '',
  });

  const { data: assessments, refetch } = trpc.environmentalAssessments.list.useQuery({ unitId });
  const createMutation = trpc.environmentalAssessments.create.useMutation({
    onSuccess: () => {
      toast.success('Avaliação registrada com sucesso');
      refetch();
      setNewAssessment({...newAssessment, agentName: '', measuredValue: 0 });
    },
  });

  const AGENT_TYPES = {
    'Químico': { unit: 'ppm', examples: ['Benzeno', 'Tolueno', 'Xileno'] },
    'Físico': { unit: 'dB', examples: ['Ruído', 'Temperatura', 'Umidade'] },
    'Biológico': { unit: 'UFC/m³', examples: ['Bactérias', 'Fungos', 'Vírus'] },
    'Ergonômico': { unit: '%', examples: ['Carga de Trabalho', 'Repetitividade'] },
  };

  // Gráfico de tendência
  const trendData = assessments?.reduce((acc: any[], assessment) => {
    const existing = acc.find(a => a.agentName === assessment.agentName);
    if (existing) {
      existing.data.push({
        date: assessment.assessmentDate,
        value: assessment.measuredValue,
        limit: assessment.limiteTolerance,
      });
    } else {
      acc.push({
        agentName: assessment.agentName,
        data: [{
          date: assessment.assessmentDate,
          value: assessment.measuredValue,
          limit: assessment.limiteTolerance,
        }],
      });
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Ambientais (NR-09)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário */}
          <div className="grid grid-cols-4 gap-4">
            <Input
              type="date"
              value={newAssessment.assessmentDate}
              onChange={(e) => setNewAssessment({ ...newAssessment, assessmentDate: e.target.value })}
            />
            <Select value={newAssessment.assessmentType} onValueChange={(v) => setNewAssessment({ ...newAssessment, assessmentType: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inicial">Inicial</SelectItem>
                <SelectItem value="Periódica">Periódica</SelectItem>
                <SelectItem value="Especial">Especial</SelectItem>
                <SelectItem value="Mudança">Mudança</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newAssessment.agentType} onValueChange={(v) => setNewAssessment({ ...newAssessment, agentType: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Químico">Químico</SelectItem>
                <SelectItem value="Físico">Físico</SelectItem>
                <SelectItem value="Biológico">Biológico</SelectItem>
                <SelectItem value="Ergonômico">Ergonômico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Input
              placeholder="Nome do agente"
              value={newAssessment.agentName}
              onChange={(e) => setNewAssessment({ ...newAssessment, agentName: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Valor medido"
              value={newAssessment.measuredValue}
              onChange={(e) => setNewAssessment({ ...newAssessment, measuredValue: parseFloat(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Limite de Tolerância"
              value={newAssessment.limiteTolerance}
              onChange={(e) => setNewAssessment({ ...newAssessment, limiteTolerance: parseFloat(e.target.value) })}
            />
            <Input
              placeholder="Assessor"
              value={newAssessment.assessor}
              onChange={(e) => setNewAssessment({ ...newAssessment, assessor: e.target.value })}
            />
          </div>

          <Button onClick={() => createMutation.mutate({ unitId, ...newAssessment })}>
            <Plus size={16} className="mr-2" /> Registrar Avaliação
          </Button>

          {/* Tabela de avaliações */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Agente</th>
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-right">Medido</th>
                  <th className="p-2 text-right">Limite</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {assessments?.map((assessment) => (
                  <tr key={assessment.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{assessment.assessmentDate}</td>
                    <td className="p-2">{assessment.agentName}</td>
                    <td className="p-2">{assessment.agentType}</td>
                    <td className="p-2 text-right">{assessment.measuredValue} {assessment.unit}</td>
                    <td className="p-2 text-right">{assessment.limiteTolerance} {assessment.unit}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        assessment.conformity === 'Conforme' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {assessment.conformity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráfico de tendência */}
          {trendData.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-4">Tendência de Medições</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData[0]?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Valor Medido" />
                  <Line type="monotone" dataKey="limit" stroke="#ef4444" name="Limite de Tolerância" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <Button className="w-full mt-4">
            <Download size={16} className="mr-2" /> Gerar Relatório PPRA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 4️⃣ GESTÃO DE LAUDOS

### 4.1 Visão Geral
**Objetivo:** Gerenciar laudos técnicos (LTCAT, PPP, Laudo Ambiental, etc.) com versionamento e rastreabilidade.

**Legislação:** NR-01, NR-07, NR-09, NR-15, NR-16

**Tempo Estimado:** 3-4 dias

### 4.2 Arquitetura

#### Backend (Node.js + tRPC)

```typescript
// server/routers/technicalReports.ts
export const technicalReportsRouter = router({
  list: protectedProcedure
    .input(z.object({ unitId: z.number() }))
    .query(({ input }) => db.getTechnicalReports(input.unitId)),

  create: protectedProcedure
    .input(z.object({
      unitId: z.number(),
      title: z.string(),
      type: z.enum(['LTCAT', 'PPP', 'Laudo Ambiental', 'Laudo Ergonômico', 'PPRA', 'PGR']),
      author: z.string(),
      validFrom: z.string(),
      validUntil: z.string(),
      description: z.string().optional(),
      fileKey: z.string().optional(),
      fileUrl: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => db.createTechnicalReport({
      ...input,
      status: 'Rascunho',
      revision: 1,
      createdBy: ctx.user.id,
    })),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: z.any() }))
    .mutation(({ input, ctx }) => {
      // Criar novo histórico de revisão
      db.createTechnicalReportHistory({
        reportId: input.id,
        changeDescription: `Atualização de laudo`,
        changedBy: ctx.user.name,
      });
      return db.updateTechnicalReport(input.id, input.data);
    }),

  // Enviar para aprovação
  submitForApproval: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.updateTechnicalReport(input.id, { status: 'Aguardando Aprovação' })),

  // Aprovar laudo
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input, ctx }) => db.updateTechnicalReport(input.id, {
      status: 'Vigente',
      approvedBy: ctx.user.name,
      approvedDate: new Date(),
    })),

  // Histórico de revisões
  getHistory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => db.getTechnicalReportHistory(input.id)),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteTechnicalReport(input.id)),
});
```

#### Frontend (React)

**Nova Página: `client/src/pages/TechnicalReports.tsx`**

```typescript
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Download, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function TechnicalReports() {
  const [unitId, setUnitId] = useState(1);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    type: 'LTCAT',
    author: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
  });

  const { data: reports, refetch } = trpc.technicalReports.list.useQuery({ unitId });
  const { data: history } = selectedReport ? trpc.technicalReports.getHistory.useQuery({ id: selectedReport.id }) : { data: [] };

  const createMutation = trpc.technicalReports.create.useMutation({
    onSuccess: () => {
      toast.success('Laudo criado com sucesso');
      refetch();
      setShowDialog(false);
      setNewReport({...newReport, title: '', author: '' });
    },
  });

  const approveMutation = trpc.technicalReports.approve.useMutation({
    onSuccess: () => {
      toast.success('Laudo aprovado');
      refetch();
    },
  });

  const STATUS_COLORS = {
    'Rascunho': 'bg-gray-100 text-gray-800',
    'Aguardando Aprovação': 'bg-yellow-100 text-yellow-800',
    'Vigente': 'bg-green-100 text-green-800',
    'Obsoleto': 'bg-red-100 text-red-800',
  };

  const STATUS_ICONS = {
    'Rascunho': <FileText size={14} />,
    'Aguardando Aprovação': <AlertCircle size={14} />,
    'Vigente': <CheckCircle size={14} />,
    'Obsoleto': <Clock size={14} />,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Laudos Técnicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowDialog(true)}>
            <Plus size={16} className="mr-2" /> Novo Laudo
          </Button>

          {/* Dialog para criar laudo */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Laudo Técnico</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Título do laudo"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                />
                <Select value={newReport.type} onValueChange={(v) => setNewReport({ ...newReport, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LTCAT">LTCAT</SelectItem>
                    <SelectItem value="PPP">PPP</SelectItem>
                    <SelectItem value="Laudo Ambiental">Laudo Ambiental</SelectItem>
                    <SelectItem value="Laudo Ergonômico">Laudo Ergonômico</SelectItem>
                    <SelectItem value="PPRA">PPRA</SelectItem>
                    <SelectItem value="PGR">PGR</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Autor"
                  value={newReport.author}
                  onChange={(e) => setNewReport({ ...newReport, author: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={newReport.validFrom}
                    onChange={(e) => setNewReport({ ...newReport, validFrom: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={newReport.validUntil}
                    onChange={(e) => setNewReport({ ...newReport, validUntil: e.target.value })}
                  />
                </div>
                <Button onClick={() => createMutation.mutate({ unitId, ...newReport })}>
                  Criar Laudo
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Lista de laudos */}
          <div className="space-y-2">
            {reports?.map((report) => (
              <div
                key={report.id}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedReport?.id === report.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{report.title}</p>
                      <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}`}>
                        {STATUS_ICONS[report.status as keyof typeof STATUS_ICONS]}
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{report.type} • Rev. {report.revision}</p>
                    <p className="text-xs text-gray-500">Válido até: {report.validUntil}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Detalhes do laudo selecionado */}
          {selectedReport && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Autor</p>
                  <p className="font-semibold">{selectedReport.author}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Válido até</p>
                  <p className="font-semibold">{selectedReport.validUntil}</p>
                </div>
              </div>

              {selectedReport.status === 'Aguardando Aprovação' && (
                <Button onClick={() => approveMutation.mutate({ id: selectedReport.id })} className="w-full">
                  <CheckCircle size={16} className="mr-2" /> Aprovar Laudo
                </Button>
              )}

              {/* Histórico de revisões */}
              {history && history.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Histórico de Revisões</h4>
                  <div className="space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="text-sm p-2 bg-white rounded border">
                        <p className="font-medium">Rev. {h.revision}</p>
                        <p className="text-gray-600">{h.changeDescription}</p>
                        <p className="text-xs text-gray-500">{h.changedBy} • {h.changedAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 5️⃣ MATRIZ DE COMPATIBILIDADE

### 5.1 Visão Geral
**Objetivo:** Validar se um funcionário está apto para trabalhar em cada setor/área (treinado, exame OK, EPI disponível).

**Legislação:** NR-01, NR-07, NR-35

**Tempo Estimado:** 3-4 dias

---

## 6️⃣ AFASTAMENTOS AMPLIADO

### 6.1 Visão Geral
**Objetivo:** Rastrear afastamentos com impacto em indicadores (TF, TG, dias perdidos).

**Legislação:** NR-07, Lei 8.213/91

**Tempo Estimado:** 2-3 dias

---

## 7️⃣ RELATÓRIOS OBRIGATÓRIOS

### 7.1 Visão Geral
**Objetivo:** Gerar relatórios em PDF conforme exigências legais (Acidentes, PCMSO, PPRA, PGR, CIPA).

**Legislação:** Várias NRs

**Tempo Estimado:** 5-6 dias

---

## 8️⃣ eSocial INTEGRAÇÃO

### 8.1 Visão Geral
**Objetivo:** Integração real com API do eSocial para envio de eventos S-2210, S-2220, S-2240, S-2245.

**Legislação:** Lei 13.874/19, Decreto 10.854/21

**Tempo Estimado:** 6-7 dias

---

## 📅 CRONOGRAMA

| Semana | Funcionalidade | Status | Responsável |
|--------|---|---|---|
| **Semana 1** | | | |
| Dia 1-2 | Mapa de Riscos Interativo | ⏳ Em Progresso | Backend + Frontend |
| Dia 3-4 | Gestão de GHE | ⏳ Aguardando | Backend + Frontend |
| Dia 5 | Testes e Integração | ⏳ Aguardando | QA |
| **Semana 2** | | | |
| Dia 1-2 | Avaliações Ambientais (NR-09) | ⏳ Aguardando | Backend + Frontend |
| Dia 3-4 | Gestão de Laudos | ⏳ Aguardando | Backend + Frontend |
| Dia 5 | Testes e Integração | ⏳ Aguardando | QA |
| **Semana 3** | | | |
| Dia 1-2 | Matriz de Compatibilidade | ⏳ Aguardando | Backend + Frontend |
| Dia 3-4 | Afastamentos Ampliado | ⏳ Aguardando | Backend + Frontend |
| Dia 5 | Testes e Integração | ⏳ Aguardando | QA |
| **Semana 4** | | | |
| Dia 1-3 | Relatórios Obrigatórios | ⏳ Aguardando | Backend + Frontend |
| Dia 4-5 | eSocial Integração | ⏳ Aguardando | Backend |

---

## 🎯 PRÓXIMOS PASSOS

1. **Aprovação do Plano** — Revisar e aprovar este plano
2. **Iniciar Implementação** — Começar com Mapa de Riscos Interativo
3. **Testes Contínuos** — Executar testes Vitest após cada funcionalidade
4. **Checkpoint Semanal** — Salvar checkpoint ao final de cada semana
5. **Validação com Especialistas** — Revisar com engenheiros de SST reais

---

## 📞 SUPORTE

Para dúvidas ou esclarecimentos sobre este plano, consulte a análise completa em `ANALISE_ENGENHEIRO_SST.md`.
