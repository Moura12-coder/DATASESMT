import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { riskMapAreas, ghe, gheExposureAgents } from "../drizzle/schema";

interface RiskCircle {
  id: string;
  type: 'Físico' | 'Químico' | 'Biológico' | 'Ergonômico' | 'Acidente';
  riskLevel: 'Tolerável' | 'Moderado' | 'Substancial' | 'Intolerável';
  count: number;
  x: number;
  y: number;
}

interface RiskMapAreaWithCircles {
  id: number;
  name: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  riskCircles: RiskCircle[];
  maxRiskLevel: 'Tolerável' | 'Moderado' | 'Substancial' | 'Intolerável';
}

/**
 * Obter áreas do mapa de riscos com círculos de risco em tempo real
 * Agrega dados de GHEs e agentes de exposição para cada área
 */
export async function getRiskMapAreasWithCircles(
  unitId: number
): Promise<RiskMapAreaWithCircles[]> {
  const db = await getDb();
  if (!db) return [];

  // Obter todas as áreas da unidade
  const areas = await db
    .select()
    .from(riskMapAreas)
    .where(eq(riskMapAreas.unitId, unitId));

  // Para cada área, agregar riscos dos GHEs vinculados
  const areasWithCircles: RiskMapAreaWithCircles[] = [];

  for (const area of areas) {
    // Obter GHEs vinculados a esta área
    const linkedGhes = await db
      .select()
      .from(ghe)
      .where(eq(ghe.riskMapAreaId, area.id));

    // Agregar agentes de exposição por tipo e nível de risco
    const riskMap = new Map<string, { type: string; riskLevel: string; count: number }>();

    for (const gheRecord of linkedGhes) {
      const agents = await db
        .select()
        .from(gheExposureAgents)
        .where(eq(gheExposureAgents.gheId, gheRecord.id));

      for (const agent of agents) {
        const key = `${agent.agentType}-${agent.riskLevel}`;
        const existing = riskMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          riskMap.set(key, {
            type: agent.agentType || 'Acidente',
            riskLevel: agent.riskLevel || 'Tolerável',
            count: 1,
          });
        }
      }
    }

    // Converter mapa para array de círculos de risco
    const riskCircles: RiskCircle[] = Array.from(riskMap.values()).map(
      (risk, idx) => ({
        id: `${area.id}-${idx}`,
        type: risk.type as any,
        riskLevel: risk.riskLevel as any,
        count: risk.count,
        x: (area.coordinates as any)?.x || 0,
        y: (area.coordinates as any)?.y || 0,
      })
    );

    // Calcular nível máximo de risco da área
    const riskLevels = ['Tolerável', 'Moderado', 'Substancial', 'Intolerável'];
    const maxRiskIndex = Math.max(
      ...riskCircles.map((c) => riskLevels.indexOf(c.riskLevel)),
      riskLevels.indexOf(area.riskLevel || 'Tolerável')
    );
    const maxRiskLevel = riskLevels[maxRiskIndex] as any;

    areasWithCircles.push({
      id: area.id,
      name: area.name,
      description: area.description || undefined,
      x: (area.coordinates as any)?.x || 0,
      y: (area.coordinates as any)?.y || 0,
      width: (area.coordinates as any)?.width || 100,
      height: (area.coordinates as any)?.height || 100,
      riskCircles,
      maxRiskLevel,
    });
  }

  return areasWithCircles;
}

/**
 * Vincular um GHE a uma área do mapa de riscos
 */
export async function linkGheToRiskMapArea(gheId: number, areaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(ghe)
    .set({ riskMapAreaId: areaId })
    .where(eq(ghe.id, gheId));

  return { success: true };
}

/**
 * Desvincular um GHE de uma área do mapa de riscos
 */
export async function unlinkGheFromRiskMapArea(gheId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(ghe)
    .set({ riskMapAreaId: null })
    .where(eq(ghe.id, gheId));

  return { success: true };
}

/**
 * Atualizar posição de uma área no mapa
 */
export async function updateRiskMapAreaPosition(
  id: number,
  x: number,
  y: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const area = await db
    .select()
    .from(riskMapAreas)
    .where(eq(riskMapAreas.id, id));

  if (!area || area.length === 0) {
    throw new Error("Area not found");
  }

  const currentCoords = area[0].coordinates as any || {};

  await db
    .update(riskMapAreas)
    .set({
      coordinates: {
        ...currentCoords,
        x,
        y,
      },
    })
    .where(eq(riskMapAreas.id, id));

  return { success: true };
}

/**
 * Calcular estatísticas de risco para um GHE
 */
export async function calculateGheRiskStatistics(gheId: number) {
  const db = await getDb();
  if (!db) return null;

  const agents = await db
    .select()
    .from(gheExposureAgents)
    .where(eq(gheExposureAgents.gheId, gheId));

  if (agents.length === 0) {
    return {
      totalAgents: 0,
      byType: {},
      byRiskLevel: {},
      maxRiskLevel: 'Tolerável',
    };
  }

  const byType: Record<string, number> = {};
  const byRiskLevel: Record<string, number> = {};
  const riskLevels = ['Tolerável', 'Moderado', 'Substancial', 'Intolerável'];
  let maxRiskIndex = 0;

  for (const agent of agents) {
    const type = agent.agentType || 'Acidente';
    const level = agent.riskLevel || 'Tolerável';

    byType[type] = (byType[type] || 0) + 1;
    byRiskLevel[level] = (byRiskLevel[level] || 0) + 1;

    const levelIndex = riskLevels.indexOf(level);
    if (levelIndex > maxRiskIndex) {
      maxRiskIndex = levelIndex;
    }
  }

  return {
    totalAgents: agents.length,
    byType,
    byRiskLevel,
    maxRiskLevel: riskLevels[maxRiskIndex],
  };
}

/**
 * Gerar SVG do mapa de riscos com círculos coloridos
 */
export async function generateRiskMapSVG(unitId: number): Promise<string> {
  const areas = await getRiskMapAreasWithCircles(unitId);

  const RISK_COLORS: Record<string, string> = {
    'Tolerável': '#10b981',
    'Moderado': '#f59e0b',
    'Substancial': '#f97316',
    'Intolerável': '#ef4444',
  };

  const getRiskRadius = (level: string): number => {
    switch (level) {
      case 'Tolerável':
        return 25;
      case 'Moderado':
        return 35;
      case 'Substancial':
        return 50;
      case 'Intolerável':
        return 70;
      default:
        return 20;
    }
  };

  let svg = `<svg width="1200" height="600" viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" stroke-width="0.5" />
      </pattern>
    </defs>
    <rect width="1200" height="600" fill="url(#grid)" />
  `;

  // Renderizar áreas
  for (const area of areas) {
    svg += `
    <g>
      <rect x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}" 
            fill="#ffffff" stroke="#d1d5db" stroke-width="2" rx="4" />
      <text x="${area.x + 5}" y="${area.y + 20}" font-size="12" font-weight="bold" fill="#1f2937">
        ${area.name}
      </text>
    `;

    // Renderizar círculos de risco
    for (let idx = 0; idx < area.riskCircles.length; idx++) {
      const circle = area.riskCircles[idx];
      const radius = getRiskRadius(circle.riskLevel);
      const circleX = area.x + area.width / 2 + (idx - area.riskCircles.length / 2) * 80;
      const circleY = area.y + area.height / 2;
      const color = RISK_COLORS[circle.riskLevel] || '#6b7280';

      svg += `
      <circle cx="${circleX}" cy="${circleY}" r="${radius}" fill="${color}" opacity="0.7" 
              stroke="${color}" stroke-width="2" />
      <text x="${circleX}" y="${circleY - 5}" font-size="10" font-weight="bold" fill="white" 
            text-anchor="middle">
        ${circle.type.substring(0, 3).toUpperCase()}
      </text>
      <text x="${circleX}" y="${circleY + 8}" font-size="12" font-weight="bold" fill="white" 
            text-anchor="middle">
        ${circle.count}
      </text>
      `;
    }

    svg += `</g>`;
  }

  // Adicionar legenda
  svg += `
    <g transform="translate(20, 20)">
      <text x="0" y="0" font-size="14" font-weight="bold" fill="#1f2937">Legenda</text>
      <rect x="0" y="10" width="150" height="120" fill="white" stroke="#d1d5db" stroke-width="1" rx="2" />
  `;

  const riskLevels = ['Tolerável', 'Moderado', 'Substancial', 'Intolerável'];
  for (let i = 0; i < riskLevels.length; i++) {
    const level = riskLevels[i];
    const color = RISK_COLORS[level];
    svg += `
      <circle cx="20" cy="${30 + i * 20}" r="6" fill="${color}" opacity="0.7" />
      <text x="35" y="${33 + i * 20}" font-size="12" fill="#1f2937">${level}</text>
    `;
  }

  svg += `</g></svg>`;

  return svg;
}
