import {
  riskMapAreas,
  ghe,
  employeeGhe,
  gheExposureAgents,
  esocialEvents,
} from "../drizzle/schema";
import { eq, and, gte, lte, isNull, countDistinct } from "drizzle-orm";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

interface RiskData {
  unitId: number;
  areaId: number;
  areaName: string;
  riskLevel: "toleravel" | "moderado" | "substancial" | "intoleravel";
  agentType: "quimico" | "fisico" | "biologico" | "ergonomico" | "acidente";
  agentName: string;
  concentration?: number;
  unit?: string;
  description: string;
  controlMeasures: string[];
  exposedEmployeeCount: number;
}

interface ESocialS2210Event {
  unitId: number;
  riskDataId: string;
  riskLevel: string;
  agentType: string;
  agentName: string;
  description: string;
  controlMeasures: string;
  exposedEmployeeCount: number;
  transmissionStatus: "pending" | "sent" | "processed" | "rejected";
  esocialEventId?: string;
  rejectionReason?: string;
  transmittedAt?: Date;
  processedAt?: Date;
}

/**
 * Prepare risk data for eSocial transmission
 * Prepares internal risk data for review; this is not an official event
 */
export async function prepareRiskDataForESocial(
  unitId: number,
  startDate?: Date,
  endDate?: Date
): Promise<RiskData[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (startDate && endDate && startDate > endDate)
    throw new Error("Período inválido");
  const rows = await db
    .select({ area: riskMapAreas, agent: gheExposureAgents, gheId: ghe.id })
    .from(riskMapAreas)
    .innerJoin(
      ghe,
      and(eq(ghe.riskMapAreaId, riskMapAreas.id), eq(ghe.unitId, unitId))
    )
    .innerJoin(gheExposureAgents, eq(gheExposureAgents.gheId, ghe.id))
    .where(
      and(
        eq(riskMapAreas.unitId, unitId),
        ...(startDate ? [gte(gheExposureAgents.createdAt, startDate)] : []),
        ...(endDate ? [lte(gheExposureAgents.createdAt, endDate)] : [])
      )
    );
  const riskData: RiskData[] = [];
  for (const row of rows) {
    if (!row.agent.agentType || !row.agent.riskLevel) continue;
    const [exposure] = await db
      .select({ total: countDistinct(employeeGhe.employeeId) })
      .from(employeeGhe)
      .where(
        and(eq(employeeGhe.gheId, row.gheId), isNull(employeeGhe.endDate))
      );
    riskData.push({
      unitId,
      areaId: row.area.id,
      areaName: row.area.name,
      riskLevel: calculateRiskLevel(row.agent.riskLevel),
      agentType: row.agent.agentType
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() as RiskData["agentType"],
      agentName: row.agent.agentName,
      unit: row.agent.unit ?? undefined,
      description: row.area.description ?? "",
      controlMeasures: [],
      exposedEmployeeCount: Number(exposure.total),
    });
  }
  return riskData;
}

/**
 * Convert internal risk level to eSocial format
 */
function calculateRiskLevel(
  internalLevel: string
): "toleravel" | "moderado" | "substancial" | "intoleravel" {
  const mapping: Record<
    string,
    "toleravel" | "moderado" | "substancial" | "intoleravel"
  > = {
    verde: "toleravel",
    amarelo: "moderado",
    laranja: "substancial",
    vermelho: "intoleravel",
    toleravel: "toleravel",
    moderado: "moderado",
    substancial: "substancial",
    intoleravel: "intoleravel",
  };

  return (
    mapping[
      internalLevel
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    ] || "moderado"
  );
}

/**
 * Validate risk data before eSocial transmission
 */
export function validateRiskDataForESocial(data: RiskData[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    errors.push("Nenhum dado de risco para transmitir");
    return { valid: false, errors };
  }

  for (const item of data) {
    if (!item.unitId) errors.push("ID da unidade é obrigatório");
    if (!item.areaName) errors.push("Nome da área é obrigatório");
    if (!item.agentName) errors.push("Nome do agente é obrigatório");
    if (!item.riskLevel) errors.push("Nível de risco é obrigatório");
    if (item.exposedEmployeeCount < 0)
      errors.push("Número de funcionários expostos não pode ser negativo");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create an internal draft (legacy function name; no official event is generated)
 */
export async function createESocialS2210Event(
  riskData: RiskData
): Promise<ESocialS2210Event> {
  const controlMeasuresStr = riskData.controlMeasures.join("; ");

  return {
    unitId: riskData.unitId,
    riskDataId: `${riskData.areaId}-${riskData.agentType}`,
    riskLevel: riskData.riskLevel,
    agentType: riskData.agentType,
    agentName: riskData.agentName,
    description: riskData.description,
    controlMeasures: controlMeasuresStr,
    exposedEmployeeCount: riskData.exposedEmployeeCount,
    transmissionStatus: "pending",
  };
}

/**
 * Transmit risk data to eSocial
 */
export async function transmitRiskToESocial(
  riskData: RiskData[],
  unitId: number
): Promise<{
  success: boolean;
  transmittedCount: number;
  failedCount: number;
  errors: string[];
}> {
  const validation = validateRiskDataForESocial(riskData);
  const errors = [...validation.errors];
  if (riskData.some(data => data.unitId !== unitId))
    errors.push("Dados de outra unidade não podem ser enviados");
  if (!errors.length)
    errors.push(
      "Integração eSocial não habilitada: dados agregados do mapa não constituem um evento oficial. É necessário gerar o evento por trabalhador, validar o leiaute e assinar com certificado digital."
    );
  return {
    success: false,
    transmittedCount: 0,
    failedCount: riskData.length,
    errors,
  };
}

export async function getRiskTransmissionStatus(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const events = await db
    .select()
    .from(esocialEvents)
    .where(
      and(
        eq(esocialEvents.code, "S-2240"),
        eq(esocialEvents.referenceType, "riskMap"),
        eq(esocialEvents.referenceId, unitId)
      )
    );
  return {
    integrationConfigured: false,
    totalEvents: events.length,
    events,
    statusCounts: {
      pending: events.filter(e => e.status === "Pendente").length,
      sent: events.filter(e => e.status === "Enviado").length,
      processed: events.filter(e => e.status === "Sucesso").length,
      rejected: events.filter(e => e.status === "Erro").length,
    },
  };
}
export async function retryFailedTransmissions(unitId: number) {
  const status = await getRiskTransmissionStatus(unitId);
  return {
    retriedCount: 0,
    totalFailed: status.statusCounts.rejected,
    message: "Integração eSocial não habilitada",
  };
}
export async function generateESocialComplianceReport(
  unitId: number,
  period: { start: Date; end: Date }
) {
  if (period.start > period.end) throw new Error("Período inválido");
  const status = await getRiskTransmissionStatus(unitId);
  const events = status.events.filter(
    e => e.sentAt && e.sentAt >= period.start && e.sentAt <= period.end
  );
  return {
    unitId,
    period,
    integrationConfigured: false,
    totalRisksTransmitted: events.length,
    events,
    transmissionStatus: {
      pending: events.filter(e => e.status === "Pendente").length,
      sent: events.filter(e => e.status === "Enviado").length,
      processed: events.filter(e => e.status === "Sucesso").length,
      rejected: events.filter(e => e.status === "Erro").length,
    },
  };
}

/**
 * Export risk data to eSocial XML format
 */
export async function exportRiskDataToESocialXML(
  riskData: RiskData[]
): Promise<string> {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += "<eSocial>\n";
  xml += "  <evtInfoRiscos>\n";

  for (const data of riskData) {
    xml += "    <risco>\n";
    xml += `      <areaId>${data.areaId}</areaId>\n`;
    xml += `      <areaName>${escapeXml(data.areaName)}</areaName>\n`;
    xml += `      <riskLevel>${data.riskLevel}</riskLevel>\n`;
    xml += `      <agentType>${data.agentType}</agentType>\n`;
    xml += `      <agentName>${escapeXml(data.agentName)}</agentName>\n`;
    if (data.concentration !== undefined) {
      xml += `      <concentration>${data.concentration}</concentration>\n`;
      xml += `      <unit>${escapeXml(data.unit ?? "")}</unit>\n`;
    }
    xml += `      <description>${escapeXml(data.description)}</description>\n`;
    xml += `      <controlMeasures>\n`;
    for (const measure of data.controlMeasures) {
      xml += `        <measure>${escapeXml(measure)}</measure>\n`;
    }
    xml += `      </controlMeasures>\n`;
    xml += `      <exposedEmployeeCount>${data.exposedEmployeeCount}</exposedEmployeeCount>\n`;
    xml += "    </risco>\n";
  }

  xml += "  </evtInfoRiscos>\n";
  xml += "</eSocial>";

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
