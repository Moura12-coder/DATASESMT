/**
 * Risk Map Service - Versão Melhorada
 * 
 * Funcionalidades:
 * - Suporte a círculos de risco por tipo de agente
 * - Cálculo dinâmico de nível de risco
 * - Integração com GHE e agentes de exposição
 * - Visualização profissional com cores por tipo de risco
 */

// Serviço de Mapa de Risco - Sem dependências de DB (em memória para testes)

// ============================================================================
// TIPOS
// ============================================================================

export interface RiskCircle {
  id: string;
  areaId: number;
  agentType: 'Químico' | 'Físico' | 'Biológico' | 'Ergonômico' | 'Acidente';
  centerX: number;
  centerY: number;
  radius: number;
  riskLevel: 'Tolerável' | 'Moderado' | 'Substancial' | 'Intolerável';
  agentName: string;
  intensity: number; // 0-100
}

export interface RiskMapArea {
  id: number;
  unitId: number;
  name: string;
  description?: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  riskLevel: 'Tolerável' | 'Moderado' | 'Substancial' | 'Intolerável';
  riskCircles: RiskCircle[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// RISK MAP SERVICE
// ============================================================================

export class RiskMapService {
  private riskCircles: Map<string, RiskCircle> = new Map();
  private riskAreas: Map<number, RiskMapArea> = new Map();

  // Cores por tipo de risco
  private RISK_COLORS = {
    'Químico': '#ef4444',      // Vermelho
    'Físico': '#f97316',       // Laranja
    'Biológico': '#f59e0b',    // Âmbar
    'Ergonômico': '#eab308',   // Amarelo
    'Acidente': '#8b5cf6',     // Roxo
  };

  private RISK_LEVEL_COLORS = {
    'Tolerável': '#10b981',    // Verde
    'Moderado': '#f59e0b',     // Âmbar
    'Substancial': '#f97316',  // Laranja
    'Intolerável': '#ef4444',  // Vermelho
  };

  /**
   * Criar área de risco
   */
  async createArea(
    unitId: number,
    name: string,
    description: string,
    coordinates: { x: number; y: number; width: number; height: number }
  ): Promise<RiskMapArea> {
    const area: RiskMapArea = {
      id: Date.now(),
      unitId,
      name,
      description,
      coordinates,
      riskLevel: 'Tolerável',
      riskCircles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.riskAreas.set(area.id, area);
    return area;
  }

  /**
   * Adicionar círculo de risco a uma área
   */
  addRiskCircle(
    areaId: number,
    agentType: RiskCircle['agentType'],
    agentName: string,
    centerX: number,
    centerY: number,
    radius: number,
    riskLevel: RiskCircle['riskLevel'],
    intensity: number = 50
  ): RiskCircle {
    const area = this.riskAreas.get(areaId);
    if (!area) throw new Error(`Área ${areaId} não encontrada`);

    const circle: RiskCircle = {
      id: `circle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      areaId,
      agentType,
      agentName,
      centerX,
      centerY,
      radius,
      riskLevel,
      intensity,
    };

    this.riskCircles.set(circle.id, circle);
    area.riskCircles.push(circle);

    // Recalcular nível de risco da área
    this.updateAreaRiskLevel(areaId);

    return circle;
  }

  /**
   * Remover círculo de risco
   */
  removeRiskCircle(circleId: string): boolean {
    const circle = this.riskCircles.get(circleId);
    if (!circle) return false;

    const area = this.riskAreas.get(circle.areaId);
    if (area) {
      area.riskCircles = area.riskCircles.filter(c => c.id !== circleId);
      this.updateAreaRiskLevel(circle.areaId);
    }

    this.riskCircles.delete(circleId);
    return true;
  }

  /**
   * Atualizar nível de risco da área baseado nos círculos
   */
  private updateAreaRiskLevel(areaId: number): void {
    const area = this.riskAreas.get(areaId);
    if (!area) return;

    if (area.riskCircles.length === 0) {
      area.riskLevel = 'Tolerável';
      return;
    }

    // Encontrar o nível mais alto
    const levels = ['Tolerável', 'Moderado', 'Substancial', 'Intolerável'];
    let maxLevel = 0;

    area.riskCircles.forEach(circle => {
      const levelIndex = levels.indexOf(circle.riskLevel);
      maxLevel = Math.max(maxLevel, levelIndex);
    });

    area.riskLevel = levels[maxLevel] as any;
    area.updatedAt = new Date();
  }

  /**
   * Obter todas as áreas
   */
  getAreas(unitId: number): RiskMapArea[] {
    return Array.from(this.riskAreas.values()).filter(a => a.unitId === unitId);
  }

  /**
   * Obter área por ID
   */
  getArea(areaId: number): RiskMapArea | undefined {
    return this.riskAreas.get(areaId);
  }

  /**
   * Deletar área
   */
  deleteArea(areaId: number): boolean {
    const area = this.riskAreas.get(areaId);
    if (!area) return false;

    // Remover todos os círculos da área
    area.riskCircles.forEach(circle => {
      this.riskCircles.delete(circle.id);
    });

    this.riskAreas.delete(areaId);
    return true;
  }

  /**
   * Gerar SVG com círculos de risco
   */
  generateRiskMapSVG(unitId: number): string {
    const areas = this.getAreas(unitId);

    let svg = `
      <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid #ddd;">
        <!-- Grid de fundo -->
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="1200" height="800" fill="url(#grid)" />
    `;

    // Desenhar áreas e círculos
    areas.forEach(area => {
      const coords = area.coordinates;
      const areaColor = this.RISK_LEVEL_COLORS[area.riskLevel];

      // Desenhar retângulo da área
      svg += `
        <rect
          x="${coords.x}"
          y="${coords.y}"
          width="${coords.width}"
          height="${coords.height}"
          fill="${areaColor}"
          stroke="#333"
          stroke-width="2"
          opacity="0.3"
        />
        <text
          x="${coords.x + coords.width / 2}"
          y="${coords.y + 20}"
          text-anchor="middle"
          font-size="14"
          font-weight="bold"
          fill="#333"
        >
          ${area.name}
        </text>
      `;

      // Desenhar círculos de risco
      area.riskCircles.forEach((circle, index) => {
        const circleColor = this.RISK_COLORS[circle.agentType];
        const opacity = 0.3 + (circle.intensity / 100) * 0.7;

        svg += `
          <circle
            cx="${circle.centerX}"
            cy="${circle.centerY}"
            r="${circle.radius}"
            fill="${circleColor}"
            stroke="${circleColor}"
            stroke-width="2"
            opacity="${opacity}"
          />
          <text
            x="${circle.centerX}"
            y="${circle.centerY}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="11"
            font-weight="bold"
            fill="#fff"
            pointer-events="none"
          >
            ${circle.agentName.substring(0, 8)}
          </text>
        `;
      });
    });

    svg += '</svg>';
    return svg;
  }

  /**
   * Gerar JSON com dados de risco para visualização
   */
  generateRiskMapJSON(unitId: number) {
    const areas = this.getAreas(unitId);

    return {
      unitId,
      areas: areas.map(area => ({
        id: area.id,
        name: area.name,
        description: area.description,
        coordinates: area.coordinates,
        riskLevel: area.riskLevel,
        color: this.RISK_LEVEL_COLORS[area.riskLevel],
        circles: area.riskCircles.map(circle => ({
          id: circle.id,
          agentType: circle.agentType,
          agentName: circle.agentName,
          centerX: circle.centerX,
          centerY: circle.centerY,
          radius: circle.radius,
          riskLevel: circle.riskLevel,
          color: this.RISK_COLORS[circle.agentType],
          intensity: circle.intensity,
        })),
      })),
      legend: {
        riskLevels: this.RISK_LEVEL_COLORS,
        agentTypes: this.RISK_COLORS,
      },
    };
  }

  /**
   * Calcular estatísticas de risco
   */
  calculateRiskStatistics(unitId: number) {
    const areas = this.getAreas(unitId);
    const allCircles = areas.flatMap(a => a.riskCircles);

    const byType = {
      'Químico': allCircles.filter(c => c.agentType === 'Químico').length,
      'Físico': allCircles.filter(c => c.agentType === 'Físico').length,
      'Biológico': allCircles.filter(c => c.agentType === 'Biológico').length,
      'Ergonômico': allCircles.filter(c => c.agentType === 'Ergonômico').length,
      'Acidente': allCircles.filter(c => c.agentType === 'Acidente').length,
    };

    const byLevel = {
      'Tolerável': allCircles.filter(c => c.riskLevel === 'Tolerável').length,
      'Moderado': allCircles.filter(c => c.riskLevel === 'Moderado').length,
      'Substancial': allCircles.filter(c => c.riskLevel === 'Substancial').length,
      'Intolerável': allCircles.filter(c => c.riskLevel === 'Intolerável').length,
    };

    const criticalAreas = areas.filter(a => a.riskLevel === 'Intolerável');
    const avgIntensity = allCircles.length > 0
      ? (allCircles.reduce((sum, c) => sum + c.intensity, 0) / allCircles.length).toFixed(1)
      : 0;

    return {
      totalAreas: areas.length,
      totalRisks: allCircles.length,
      byType,
      byLevel,
      criticalAreas: criticalAreas.length,
      avgIntensity,
    };
  }

  /**
   * Exportar mapa de risco para PDF
   */
  exportToPDF(unitId: number): string {
    const stats = this.calculateRiskStatistics(unitId);
    const areas = this.getAreas(unitId);

    let pdfContent = `
MAPA DE RISCOS - RELATÓRIO COMPLETO
Data: ${new Date().toLocaleDateString('pt-BR')}
Unidade: ${unitId}

RESUMO EXECUTIVO
================
Total de Áreas: ${stats.totalAreas}
Total de Riscos Identificados: ${stats.totalRisks}
Áreas Críticas (Intolerável): ${stats.criticalAreas}
Intensidade Média: ${stats.avgIntensity}%

RISCOS POR TIPO
===============
Químicos: ${stats.byType['Químico']}
Físicos: ${stats.byType['Físico']}
Biológicos: ${stats.byType['Biológico']}
Ergonômicos: ${stats.byType['Ergonômico']}
Acidentes: ${stats.byType['Acidente']}

RISCOS POR NÍVEL
================
Tolerável: ${stats.byLevel['Tolerável']}
Moderado: ${stats.byLevel['Moderado']}
Substancial: ${stats.byLevel['Substancial']}
Intolerável: ${stats.byLevel['Intolerável']}

DETALHES POR ÁREA
=================
    `;

    areas.forEach(area => {
      pdfContent += `
${area.name}
${'-'.repeat(50)}
Descrição: ${area.description || 'N/A'}
Nível de Risco: ${area.riskLevel}
Localização: X=${area.coordinates.x}, Y=${area.coordinates.y}
Dimensões: ${area.coordinates.width}x${area.coordinates.height}

Riscos Identificados:
      `;

      area.riskCircles.forEach(circle => {
        pdfContent += `
  • ${circle.agentName} (${circle.agentType})
    Nível: ${circle.riskLevel}
    Intensidade: ${circle.intensity}%
    Localização: Centro (${circle.centerX}, ${circle.centerY}), Raio: ${circle.radius}
        `;
      });

      pdfContent += '\n';
    });

    return pdfContent;
  }

  /**
   * Importar dados de GHE para mapa de risco
   */
  async importFromGHE(unitId: number, gheId: number): Promise<void> {
    // Simular importação de dados de GHE
    // Em produção, isso consultaria o banco de dados
    console.log(`Importando dados de GHE ${gheId} para unidade ${unitId}`);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const riskMapService = new RiskMapService();

export default riskMapService;
