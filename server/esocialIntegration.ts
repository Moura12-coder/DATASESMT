import {
  getDb,
  getEsocialS2230,
  createEsocialS2230,
  updateEsocialS2230,
} from "./db";
import { leaveOfAbsence, employees } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Interface para evento S-2230 (Afastamento Temporário)
 */
export interface S2230Event {
  unitId: number;
  employeeId: number;
  absenceId: number;
  dtIniAfastamento: string; // YYYY-MM-DD
  dtFimAfastamento?: string; // YYYY-MM-DD
  codMotAfast: string; // Código do motivo do afastamento
  dscMotAfast?: string; // Descrição do motivo
  codCID?: string; // Código CID
  indCatAfastamento?: string; // Indicador de categoria
}

/**
 * Mapeamento de tipos de afastamento para códigos eSocial
 */
const AFASTAMENTO_CODES: Record<string, string> = {
  "Acidente Trabalho": "01",
  "Doença Ocupacional": "02",
  "Doença Comum": "03",
  Maternidade: "04",
  Outro: "99",
};

/**
 * Constrói evento S-2230 para envio ao eSocial
 */
export function buildS2230Event(
  unitId: number,
  employeeId: number,
  absenceId: number,
  absence: {
    type: string;
    startDate: Date;
    endDate?: Date;
    cid?: string;
  }
): S2230Event {
  return {
    unitId,
    employeeId,
    absenceId,
    dtIniAfastamento: absence.startDate.toISOString().split("T")[0],
    dtFimAfastamento: absence.endDate
      ? absence.endDate.toISOString().split("T")[0]
      : undefined,
    codMotAfast: AFASTAMENTO_CODES[absence.type] || "99",
    dscMotAfast: absence.type,
    codCID: absence.cid,
  };
}

/**
 * Formata evento S-2230 para XML (padrão eSocial)
 */
export function formatS2230ToXml(event: S2230Event): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial>
  <evtAfastTemp>
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>02.05.00</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${event.unitId}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>00000000000</cpfTrab>
      <nrMatric>0</nrMatric>
    </ideVinculo>
    <infoAfastamento>
      <dtIniAfastamento>${event.dtIniAfastamento}</dtIniAfastamento>
      ${event.dtFimAfastamento ? `<dtFimAfastamento>${event.dtFimAfastamento}</dtFimAfastamento>` : ""}
      <codMotAfast>${event.codMotAfast}</codMotAfast>
      ${event.codCID ? `<codCID>${event.codCID}</codCID>` : ""}
    </infoAfastamento>
  </evtAfastTemp>
</eSocial>`;
}

/**
 * Simula envio para eSocial (em produção, seria integração real com API)
 */
export async function sendToESocial(event: S2230Event): Promise<{
  success: boolean;
  protocolNumber?: string;
  errorMessage?: string;
  timestamp: Date;
}> {
  try {
    // Validações básicas
    if (!event.dtIniAfastamento) {
      throw new Error("Data de início do afastamento é obrigatória");
    }

    if (!event.codMotAfast) {
      throw new Error("Código do motivo do afastamento é obrigatório");
    }

    return {
      success: false,
      errorMessage:
        "Integração eSocial não habilitada. Nenhum evento foi transmitido.",
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date(),
    };
  }
}

/**
 * Registra envio de evento S-2230 no banco de dados
 */
export async function recordS2230Submission(
  unitId: number,
  employeeId: number,
  absenceId: number,
  response: Awaited<ReturnType<typeof sendToESocial>>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await createEsocialS2230({
    unitId,
    employeeId,
    absenceId,
    eventType: "S-2230",
    status: response.success ? "Enviado" : "Rejeitado",
    esocialResponse: response as any,
    sentAt: new Date(),
  });
}

/**
 * Processa afastamento e envia para eSocial
 */
export async function processAbsenceAndSendToESocial(
  unitId: number,
  employeeId: number,
  absenceId: number
): Promise<{
  success: boolean;
  protocolNumber?: string;
  errorMessage?: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Busca dados do afastamento
    const absence = await db
      .select()
      .from(leaveOfAbsence)
      .where(eq(leaveOfAbsence.id, absenceId))
      .limit(1);

    if (absence.length === 0) {
      throw new Error("Afastamento não encontrado");
    }

    const absenceData = absence[0];

    // Constrói evento S-2230
    const event = buildS2230Event(unitId, employeeId, absenceId, {
      type: absenceData.type,
      startDate: absenceData.startDate,
      endDate: absenceData.endDate || undefined,
      cid: absenceData.cid || undefined,
    });

    // Envia para eSocial
    const response = await sendToESocial(event);

    // Registra no banco de dados
    await recordS2230Submission(unitId, employeeId, absenceId, response);

    return {
      success: response.success,
      protocolNumber: response.protocolNumber,
      errorMessage: response.errorMessage,
    };
  } catch (error) {
    return {
      success: false,
      errorMessage:
        error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Consulta status de envio S-2230
 */
export async function checkS2230Status(
  unitId: number,
  absenceId: number
): Promise<{
  status: "Rascunho" | "Enviado" | "Processado" | "Rejeitado";
  protocolNumber?: string;
  sentAt?: Date;
  processedAt?: Date;
  response?: any;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const records = await getEsocialS2230(unitId);
  const record = records.find(r => r.absenceId === absenceId);

  if (!record) {
    return { status: "Rascunho" };
  }

  return {
    status: (record.status || "Rascunho") as
      | "Rascunho"
      | "Enviado"
      | "Processado"
      | "Rejeitado",
    protocolNumber: (record.esocialResponse as any)?.protocolNumber,
    sentAt: record.sentAt || undefined,
    processedAt: record.processedAt || undefined,
    response: record.esocialResponse,
  };
}

/**
 * Gera relatório de conformidade eSocial
 */
export async function generateESocialComplianceReport(
  unitId: number
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const records = await getEsocialS2230(unitId);

  const totalEvents = records.length;
  const sentEvents = records.filter(r => r.status === "Enviado").length;
  const processedEvents = records.filter(r => r.status === "Processado").length;
  const rejectedEvents = records.filter(r => r.status === "Rejeitado").length;
  const draftEvents = records.filter(r => r.status === "Rascunho").length;

  const complianceRate =
    totalEvents > 0
      ? Math.round(((sentEvents + processedEvents) / totalEvents) * 100)
      : 0;

  return `
RELATÓRIO DE CONFORMIDADE eSocial - S-2230
Unidade: ${unitId}
Data de Geração: ${new Date().toLocaleDateString("pt-BR")}

RESUMO:
- Total de Eventos: ${totalEvents}
- Enviados: ${sentEvents}
- Processados: ${processedEvents}
- Rejeitados: ${rejectedEvents}
- Rascunhos: ${draftEvents}
- Taxa de Conformidade: ${complianceRate}%

DETALHES DOS EVENTOS:
${records
  .slice(0, 10)
  .map(
    (r, idx) => `
${idx + 1}. ID: ${r.id}
   Funcionário: ${r.employeeId}
   Status: ${r.status}
   Enviado em: ${r.sentAt ? new Date(r.sentAt).toLocaleString("pt-BR") : "Não enviado"}
   Processado em: ${r.processedAt ? new Date(r.processedAt).toLocaleString("pt-BR") : "Não processado"}
`
  )
  .join("\n")}

RECOMENDAÇÕES:
1. Revisar eventos rejeitados e corrigir dados
2. Acompanhar processamento de eventos enviados
3. Manter registros de conformidade atualizados
4. Realizar auditorias periódicas

Relatório gerado automaticamente pelo sistema.
`;
}
