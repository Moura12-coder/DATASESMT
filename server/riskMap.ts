import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { riskMapAreas, risks, ghe, gheExposureAgents, riskMapAreaHistory, riskMapAlerts } from "../drizzle/schema";

/**
 * Obter todas as áreas do mapa de riscos de uma unidade
 */
export async function getRiskMapAreas(unitId: number) {
  const db = await getDb();
  if (!db) return [];

  const areas = await db
    .select()
    .from(riskMapAreas)
    .where(eq(riskMapAreas.unitId, unitId));

  // Calcular riskLevel dinamicamente baseado em riscos vinculados
  for (const area of areas) {
    // Riscos são vinculados via sectorId, não diretamente à área
    // Por enquanto, manter o nível de risco como está no banco
    // Isso será atualizado quando houver integração com setores
  }

  return areas;
}

/**
 * Criar nova área no mapa de riscos
 */
export async function createRiskMapArea(data: {
  unitId: number;
  name: string;
  description?: string;
  coordinates: { x: number; y: number; width: number; height: number };
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(riskMapAreas).values({
    unitId: data.unitId,
    name: data.name,
    description: data.description,
    coordinates: data.coordinates as any,
    riskLevel: "Tolerável",
  });

  const areaId = result[0].insertId;
  return db.select().from(riskMapAreas).where(eq(riskMapAreas.id, areaId));
}

/**
 * Atualizar área do mapa de riscos
 */
export async function updateRiskMapArea(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    coordinates: { x: number; y: number; width: number; height: number };
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(riskMapAreas).set(data).where(eq(riskMapAreas.id, id));

  return db.select().from(riskMapAreas).where(eq(riskMapAreas.id, id));
}

/**
 * Deletar área do mapa de riscos
 */
export async function deleteRiskMapArea(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    console.log(`[deleteRiskMapArea] Starting deletion for area ID: ${id}`);

    // Step 1: Remove all GHEs linked to this area
    console.log(`[deleteRiskMapArea] Unlinking GHEs from area ${id}`);
    await db.update(ghe).set({ riskMapAreaId: null }).where(eq(ghe.riskMapAreaId, id));

    // Step 2: Delete area history records
    console.log(`[deleteRiskMapArea] Deleting history records for area ${id}`);
    await db.delete(riskMapAreaHistory).where(eq(riskMapAreaHistory.areaId, id));

    // Step 3: Delete area alerts
    console.log(`[deleteRiskMapArea] Deleting alert records for area ${id}`);
    await db.delete(riskMapAlerts).where(eq(riskMapAlerts.areaId, id));

    // Step 4: Delete the area itself
    console.log(`[deleteRiskMapArea] Deleting area ${id}`);
    await db.delete(riskMapAreas).where(eq(riskMapAreas.id, id));

    console.log(`[deleteRiskMapArea] Successfully deleted area ${id}`);
    return { success: true, message: `Area ${id} deleted successfully` };
  } catch (error) {
    console.error(`[deleteRiskMapArea] Error deleting area ${id}:`, error);
    throw error;
  }
}

/**
 * Calcular nível de risco de uma área baseado em riscos vinculados
 */
export async function calculateAreaRiskLevel(areaId: number) {
  const db = await getDb();
  if (!db) return "Tolerável";

  // Obter a área
  const area = await db.select().from(riskMapAreas).where(eq(riskMapAreas.id, areaId));
  if (!area || area.length === 0) return "Tolerável";

  // Retornar o nível de risco armazenado
  return area[0].riskLevel || "Tolerável";
}

/**
 * Gerar SVG do mapa de riscos
 */
export async function generateRiskMapSVG(unitId: number) {
  const areas = await getRiskMapAreas(unitId);

  const colorMap: Record<string, string> = {
    Tolerável: "#10b981",
    Moderado: "#f59e0b",
    Substancial: "#f97316",
    Intolerável: "#ef4444",
  };

  let svg = '<svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">';

  // Grid de fundo
  svg += `
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" stroke-width="0.5" />
      </pattern>
    </defs>
    <rect width="1200" height="800" fill="url(#grid)" />
  `;

  // Áreas de risco
  for (const area of areas) {
    const coords = area.coordinates as any;
    const color = colorMap[area.riskLevel || "Tolerável"] || "#e5e7eb";

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

  svg += "</svg>";
  return svg;
}
