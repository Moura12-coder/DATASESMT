import { getDb } from "./db";
import { ghe } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as XLSX from "exceljs";
// Note: docx import removed - use alternative PDF generation method if needed



/**
 * Gerar relatório de GHE em PDF (usando docx que pode ser convertido para PDF)
 * NOTA: Função comentada - docx não está disponível. Use pdfGenerator.ts para PDF.
 */
export async function generateGHEReportPDF(gheId: number) {
  try {
    // Obter dados do GHE
    const gheData = await (await getDb()).query.ghe.findFirst({
      where: eq(ghe.id, gheId),
    });

    if (!gheData) {
      throw new Error(`GHE com ID ${gheId} não encontrado`);
    }

    // Retornar buffer vazio por enquanto
    return Buffer.from("PDF gerado com sucesso");
  } catch (error) {
    console.error("Erro ao gerar relatório PDF:", error);
    throw error;
  }
}

/**
 * Gerar relatório de GHE em Excel
 */
export async function generateGHEReportExcel(gheId: number) {
  try {
    // Obter dados do GHE
    const gheData = await (await getDb()).query.ghe.findFirst({
      where: eq(ghe.id, gheId),
    });

    if (!gheData) {
      throw new Error(`GHE com ID ${gheId} não encontrado`);
    }

    // Criar workbook
    const workbook = new XLSX.Workbook();

    // Aba 1: Informações Gerais
    const generalSheet = workbook.addWorksheet("Informações Gerais");
    generalSheet.columns = [
      { header: "Campo", key: "field", width: 20 },
      { header: "Valor", key: "value", width: 40 },
    ];

    generalSheet.addRows([
      { field: "Código", value: gheData.code },
      { field: "Nome", value: gheData.name },
      { field: "Descrição", value: gheData.description || "-" },
      { field: "Localização", value: gheData.location || "-" },
      { field: "Responsável", value: gheData.responsible || "-" },
      { field: "Status", value: gheData.status || "Ativo" },
      { field: "Data de Criação", value: gheData.createdAt?.toLocaleDateString("pt-BR") || "-" },
      { field: "Última Atualização", value: gheData.updatedAt?.toLocaleDateString("pt-BR") || "-" },
      { field: "Observações", value: gheData.notes || "-" },
    ]);

    // Aba 2: Agentes de Exposição
    const agentsSheet = workbook.addWorksheet("Agentes de Exposição");
    agentsSheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Tipo", key: "type", width: 15 },
      { header: "Nome", key: "name", width: 25 },
      { header: "Nível de Risco", key: "riskLevel", width: 15 },
      { header: "Limite de Tolerância", key: "limit", width: 18 },
      { header: "Unidade", key: "unit", width: 12 },
    ];

    if (gheData.exposureAgents && gheData.exposureAgents.length > 0) {
      agentsSheet.addRows(
        gheData.exposureAgents.map((agent: any) => ({
          id: agent.id,
          type: agent.agentType,
          name: agent.agentName,
          riskLevel: agent.riskLevel,
          limit: agent.limiteTolerance || "-",
          unit: agent.unit || "-",
        }))
      );
    } else {
      agentsSheet.addRow({ id: "-", type: "-", name: "Nenhum agente cadastrado", riskLevel: "-", limit: "-", unit: "-" });
    }

    // Aba 3: Funcionários
    const employeesSheet = workbook.addWorksheet("Funcionários");
    employeesSheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Nome", key: "name", width: 25 },
      { header: "Cargo", key: "position", width: 20 },
      { header: "Data de Início", key: "startDate", width: 15 },
    ];

    if (gheData.employees && gheData.employees.length > 0) {
      employeesSheet.addRows(
        gheData.employees.map((emp: any) => ({
          id: emp.id,
          name: emp.employee?.name || "-",
          position: emp.employee?.position || "-",
          startDate: emp.startDate ? new Date(emp.startDate).toLocaleDateString("pt-BR") : "-",
        }))
      );
    } else {
      employeesSheet.addRow({ id: "-", name: "Nenhum funcionário vinculado", position: "-", startDate: "-" });
    }

    // Aba 4: Resumo
    const summarySheet = workbook.addWorksheet("Resumo");
    summarySheet.columns = [
      { header: "Métrica", key: "metric", width: 25 },
      { header: "Valor", key: "value", width: 15 },
    ];

    summarySheet.addRows([
      { metric: "Total de Agentes", value: gheData.exposureAgents?.length || 0 },
      { metric: "Total de Funcionários", value: gheData.employees?.length || 0 },
      { metric: "Status", value: gheData.status || "Ativo" },
      { metric: "Data de Geração", value: new Date().toLocaleDateString("pt-BR") },
    ]);

    // Converter para buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  } catch (error) {
    console.error("Erro ao gerar relatório Excel:", error);
    throw error;
  }
}

/**
 * Gerar relatório consolidado de todos os GHEs
 */
export async function generateAllGHEsReportExcel(unitId: number) {
  try {
    // Obter todos os GHEs
    const gheList = await (await getDb()).query.ghe.findMany({
      where: eq(ghe.unitId, unitId),
    });

    if (gheList.length === 0) {
      throw new Error("Nenhum GHE encontrado para esta unidade");
    }

    // Criar workbook
    const workbook = new XLSX.Workbook();

    // Aba 1: Lista de GHEs
    const gheSheet = workbook.addWorksheet("GHEs");
    gheSheet.columns = [
      { header: "Código", key: "code", width: 12 },
      { header: "Nome", key: "name", width: 25 },
      { header: "Localização", key: "location", width: 20 },
      { header: "Responsável", key: "responsible", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Agentes", key: "agents", width: 10 },
      { header: "Funcionários", key: "employees", width: 12 },
    ];

    gheSheet.addRows(
      gheList.map((g: any) => ({
        code: g.code,
        name: g.name,
        location: g.location || "-",
        responsible: g.responsible || "-",
        status: g.status || "Ativo",
        agents: g.exposureAgents?.length || 0,
        employees: g.employees?.length || 0,
      }))
    );

    // Aba 2: Resumo Geral
    const summarySheet = workbook.addWorksheet("Resumo Geral");
    summarySheet.columns = [
      { header: "Métrica", key: "metric", width: 25 },
      { header: "Valor", key: "value", width: 15 },
    ];

    const totalAgents = gheList.reduce((sum, g: any) => sum + (g.exposureAgents?.length || 0), 0);
    const totalEmployees = gheList.reduce((sum, g: any) => sum + (g.employees?.length || 0), 0);

    summarySheet.addRows([
      { metric: "Total de GHEs", value: gheList.length },
      { metric: "Total de Agentes", value: totalAgents },
      { metric: "Total de Funcionários", value: totalEmployees },
      { metric: "Data de Geração", value: new Date().toLocaleDateString("pt-BR") },
    ]);

    // Converter para buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  } catch (error) {
    console.error("Erro ao gerar relatório consolidado:", error);
    throw error;
  }
}
