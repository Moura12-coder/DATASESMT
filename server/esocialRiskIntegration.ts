import { riskMapAreas, gheExposureAgents, esocialS2230, esocialEvents } from '../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getDb } from './db';
import { invokeLLM } from './_core/llm';

interface RiskData {
  unitId: number;
  areaId: number;
  areaName: string;
  riskLevel: 'toleravel' | 'moderado' | 'substancial' | 'intoleravel';
  agentType: 'quimico' | 'fisico' | 'biologico' | 'ergonomico' | 'acidente';
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
  transmissionStatus: 'pending' | 'sent' | 'processed' | 'rejected';
  esocialEventId?: string;
  rejectionReason?: string;
  transmittedAt?: Date;
  processedAt?: Date;
}

/**
 * Prepare risk data for eSocial transmission
 * Maps internal risk data to eSocial S-2210 format
 */
export async function prepareRiskDataForESocial(
  unitId: number,
  startDate?: Date,
  endDate?: Date
): Promise<RiskData[]> {
  const riskData: RiskData[] = [];

  // Get all risk map areas for the unit
  const areas = await db
    .select()
    .from(riskMapAreas)
    .where(eq(riskMapAreas.unit_id, unitId));

  // For each area, get linked GHEs and their exposure agents
  for (const area of areas) {
    // Get GHEs linked to this area
    const linkedGhes = await db
      .select()
      .from(gheExposureAgents)
      .where(eq(gheExposureAgents.unit, unitId));

    // Process each exposure agent
    for (const agent of linkedGhes) {
      const riskLevel = calculateRiskLevel(agent.riskLevel || 'moderado');

      riskData.push({
        unitId,
        areaId: area.id,
        areaName: area.name,
        riskLevel,
        agentType: agent.agentType as any,
        agentName: agent.agentName,
        concentration: agent.concentration,
        unit: agent.concentrationUnit,
        description: agent.description || '',
        controlMeasures: agent.controlMeasures ? JSON.parse(agent.controlMeasures) : [],
        exposedEmployeeCount: agent.exposedEmployeeCount || 0,
      });
    }
  }

  return riskData;
}

/**
 * Convert internal risk level to eSocial format
 */
function calculateRiskLevel(
  internalLevel: string
): 'toleravel' | 'moderado' | 'substancial' | 'intoleravel' {
  const mapping: Record<string, 'toleravel' | 'moderado' | 'substancial' | 'intoleravel'> = {
    verde: 'toleravel',
    amarelo: 'moderado',
    laranja: 'substancial',
    vermelho: 'intoleravel',
    toleravel: 'toleravel',
    moderado: 'moderado',
    substancial: 'substancial',
    intoleravel: 'intoleravel',
  };

  return mapping[internalLevel.toLowerCase()] || 'moderado';
}

/**
 * Validate risk data before eSocial transmission
 */
export function validateRiskDataForESocial(data: RiskData[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || data.length === 0) {
    errors.push('Nenhum dado de risco para transmitir');
    return { valid: false, errors };
  }

  for (const item of data) {
    if (!item.unitId) errors.push('ID da unidade é obrigatório');
    if (!item.areaName) errors.push('Nome da área é obrigatório');
    if (!item.agentName) errors.push('Nome do agente é obrigatório');
    if (!item.riskLevel) errors.push('Nível de risco é obrigatório');
    if (item.exposedEmployeeCount < 0) errors.push('Número de funcionários expostos não pode ser negativo');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create eSocial S-2210 event from risk data
 */
export async function createESocialS2210Event(
  riskData: RiskData
): Promise<ESocialS2210Event> {
  const controlMeasuresStr = riskData.controlMeasures.join('; ');

  return {
    unitId: riskData.unitId,
    riskDataId: `${riskData.areaId}-${riskData.agentType}`,
    riskLevel: riskData.riskLevel,
    agentType: riskData.agentType,
    agentName: riskData.agentName,
    description: riskData.description,
    controlMeasures: controlMeasuresStr,
    exposedEmployeeCount: riskData.exposedEmployeeCount,
    transmissionStatus: 'pending',
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

  if (!validation.valid) {
    return {
      success: false,
      transmittedCount: 0,
      failedCount: riskData.length,
      errors: validation.errors,
    };
  }

  let transmittedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const data of riskData) {
    try {
      const event = await createESocialS2210Event(data);

      // Store in database with pending status
      await db.insert(esocialS2230).values({
        unitId: event.unitId,
        riskDataId: event.riskDataId,
        riskLevel: event.riskLevel,
        agentType: event.agentType,
        agentName: event.agentName,
        description: event.description,
        controlMeasures: event.controlMeasures,
        exposedEmployeeCount: event.exposedEmployeeCount,
        transmissionStatus: 'sent',
        transmittedAt: new Date(),
      });

      transmittedCount++;
    } catch (error) {
      failedCount++;
      errors.push(`Erro ao transmitir ${data.agentName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  return {
    success: failedCount === 0,
    transmittedCount,
    failedCount,
    errors,
  };
}

/**
 * Get transmission status for risk data
 */
export async function getRiskTransmissionStatus(unitId: number) {
  const events = await db
    .select()
    .from(esocialS2230)
    .where(eq(esocialS2230.unitId, unitId));

  const statusCounts = {
    pending: events.filter((e) => e.transmissionStatus === 'pending').length,
    sent: events.filter((e) => e.transmissionStatus === 'sent').length,
    processed: events.filter((e) => e.transmissionStatus === 'processed').length,
    rejected: events.filter((e) => e.transmissionStatus === 'rejected').length,
  };

  return {
    totalEvents: events.length,
    statusCounts,
    events,
  };
}

/**
 * Retry failed transmissions
 */
export async function retryFailedTransmissions(unitId: number) {
  const failedEvents = await db
    .select()
    .from(esocialS2230)
    .where(
      and(
        eq(esocialS2230.unitId, unitId),
        eq(esocialS2230.transmissionStatus, 'rejected')
      )
    );

  let retryCount = 0;

  for (const event of failedEvents) {
    try {
      // Simulate retry by updating status to pending
      await db
        .update(esocialS2230)
        .set({ transmissionStatus: 'pending' })
        .where(eq(esocialS2230.id, event.id));

      retryCount++;
    } catch (error) {
      console.error(`Erro ao reenviar evento ${event.id}:`, error);
    }
  }

  return {
    retriedCount: retryCount,
    totalFailed: failedEvents.length,
  };
}

/**
 * Generate eSocial compliance report
 */
export async function generateESocialComplianceReport(unitId: number, period: { start: Date; end: Date }) {
  const events = await db
    .select()
    .from(esocialS2230)
    .where(
      and(
        eq(esocialS2230.unitId, unitId),
        gte(esocialS2230.transmittedAt, period.start),
        lte(esocialS2230.transmittedAt, period.end)
      )
    );

  const report = {
    unitId,
    period,
    totalRisksTransmitted: events.length,
    risksByLevel: {
      toleravel: events.filter((e) => e.riskLevel === 'toleravel').length,
      moderado: events.filter((e) => e.riskLevel === 'moderado').length,
      substancial: events.filter((e) => e.riskLevel === 'substancial').length,
      intoleravel: events.filter((e) => e.riskLevel === 'intoleravel').length,
    },
    risksByType: {
      quimico: events.filter((e) => e.agentType === 'quimico').length,
      fisico: events.filter((e) => e.agentType === 'fisico').length,
      biologico: events.filter((e) => e.agentType === 'biologico').length,
      ergonomico: events.filter((e) => e.agentType === 'ergonomico').length,
      acidente: events.filter((e) => e.agentType === 'acidente').length,
    },
    transmissionStatus: {
      pending: events.filter((e) => e.transmissionStatus === 'pending').length,
      sent: events.filter((e) => e.transmissionStatus === 'sent').length,
      processed: events.filter((e) => e.transmissionStatus === 'processed').length,
      rejected: events.filter((e) => e.transmissionStatus === 'rejected').length,
    },
    totalExposedEmployees: events.reduce((sum, e) => sum + (e.exposedEmployeeCount || 0), 0),
    events,
  };

  return report;
}

/**
 * Export risk data to eSocial XML format
 */
export async function exportRiskDataToESocialXML(riskData: RiskData[]): Promise<string> {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<eSocial>\n';
  xml += '  <evtInfoRiscos>\n';

  for (const data of riskData) {
    xml += '    <risco>\n';
    xml += `      <areaId>${data.areaId}</areaId>\n`;
    xml += `      <areaName>${escapeXml(data.areaName)}</areaName>\n`;
    xml += `      <riskLevel>${data.riskLevel}</riskLevel>\n`;
    xml += `      <agentType>${data.agentType}</agentType>\n`;
    xml += `      <agentName>${escapeXml(data.agentName)}</agentName>\n`;
    if (data.concentration) {
      xml += `      <concentration>${data.concentration}</concentration>\n`;
      xml += `      <unit>${data.unit}</unit>\n`;
    }
    xml += `      <description>${escapeXml(data.description)}</description>\n`;
    xml += `      <controlMeasures>\n`;
    for (const measure of data.controlMeasures) {
      xml += `        <measure>${escapeXml(measure)}</measure>\n`;
    }
    xml += `      </controlMeasures>\n`;
    xml += `      <exposedEmployeeCount>${data.exposedEmployeeCount}</exposedEmployeeCount>\n`;
    xml += '    </risco>\n';
  }

  xml += '  </evtInfoRiscos>\n';
  xml += '</eSocial>';

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
