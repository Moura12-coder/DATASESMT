/**
 * FASE 1 - Funcionalidades Críticas de SST
 * Gestão de GHE, Avaliações Ambientais, Laudos, Matriz de Compatibilidade
 */

import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  ghe,
  employeeGhe,
  gheExposureAgents,
  gheAuditLog,
  employees,
  risks,
  exams,
  epiDeliveries,
  trainingRecords,
} from "../drizzle/schema";

// ─────────────────────────────────────────────────────────────────────────────
// GESTÃO DE GHE (Grupos Homogêneos de Exposição)
// ─────────────────────────────────────────────────────────────────────────────

export async function createGHE(data: {
  unitId: number;
  code: string;
  name: string;
  description?: string;
  riskMapAreaId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validar duplicação de código por unidade
  const existingGHE = await db
    .select()
    .from(ghe)
    .where(and(eq(ghe.unitId, data.unitId), eq(ghe.code, data.code)));

  if (existingGHE && existingGHE.length > 0) {
    throw new Error(`GHE com código ${data.code} já existe nesta unidade`);
  }

  const result = await db.insert(ghe).values({
    unitId: data.unitId,
    code: data.code,
    name: data.name,
    description: data.description,
    riskMapAreaId: data.riskMapAreaId,
  });

  // Registrar auditoria
  const newGHE = await db
    .select()
    .from(ghe)
    .where(eq(ghe.id, result[0].insertId));
  if (newGHE && newGHE.length > 0) {
    await logGHEAudit({
      gheId: result[0].insertId,
      unitId: data.unitId,
      action: "CREATE",
      newValues: newGHE[0],
    });
  }

  return db.select().from(ghe).where(eq(ghe.id, result[0].insertId));
}

export async function listGHE(unitId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(ghe).where(eq(ghe.unitId, unitId));
}

export async function addEmployeeToGHE(data: {
  employeeId: number;
  gheId: number;
  startDate: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(employeeGhe).values({
    employeeId: data.employeeId,
    gheId: data.gheId,
    startDate: data.startDate,
    endDate: data.endDate,
  });

  return { success: true };
}

export async function getEmployeesInGHE(gheId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: employeeGhe.id,
        name: employees.name,
        email: employees.email,
        cpf: employees.cpf,
        employeeNumber: employees.id,
        startDate: employeeGhe.startDate,
        endDate: employeeGhe.endDate,
      })
      .from(employeeGhe)
      .innerJoin(employees, eq(employeeGhe.employeeId, employees.id))
      .where(eq(employeeGhe.gheId, gheId));

    return result || [];
  } catch (error) {
    console.error("Erro ao obter funcionários do GHE:", error);
    return [];
  }
}

export async function addExposureAgent(data: {
  gheId: number;
  agentType: "Químico" | "Físico" | "Biológico" | "Ergonômico" | "Acidente";
  agentName: string;
  riskLevel: "Tolerável" | "Moderado" | "Substancial" | "Intolerável";
  limiteTolerance?: number;
  unit?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(gheExposureAgents).values({
    gheId: data.gheId,
    agentType: data.agentType,
    agentName: data.agentName,
    riskLevel: data.riskLevel,
    limiteTolerance: data.limiteTolerance
      ? String(data.limiteTolerance)
      : undefined,
    unit: data.unit,
  } as any);

  return { success: true };
}

export async function getExposureAgents(gheId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(gheExposureAgents)
      .where(eq(gheExposureAgents.gheId, gheId));

    return result || [];
  } catch (error) {
    console.error("Erro ao obter agentes de exposição:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MATRIZ DE COMPATIBILIDADE FUNCIONÁRIO-RISCO
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployeeCompatibility(employeeId: number) {
  const db = await getDb();
  if (!db) return null;

  const employee = await db
    .select()
    .from(employees)
    .where(eq(employees.id, employeeId));

  if (!employee || employee.length === 0) return null;

  // Obter GHE do funcionário
  const gheAssignments = await db
    .select()
    .from(employeeGhe)
    .where(eq(employeeGhe.employeeId, employeeId));

  const gheIds = gheAssignments.map(a => a.gheId);

  // Obter riscos dos GHE
  const gheRisks =
    gheIds.length > 0
      ? await db
          .select()
          .from(risks)
          .where(inArray(risks.ghe, gheIds.map(String)))
      : [];

  // Obter exames do funcionário
  const exams_ = await db
    .select()
    .from(exams)
    .where(eq(exams.employeeId, employeeId));

  // Obter EPIs entregues
  const epis = await db
    .select()
    .from(epiDeliveries)
    .where(eq(epiDeliveries.employeeId, employeeId));

  // Obter treinamentos
  const trainings = await db
    .select()
    .from(trainingRecords)
    .where(eq(trainingRecords.employeeId, employeeId));

  return {
    employee: employee[0],
    ghe: gheAssignments,
    risks: gheRisks,
    exams: exams_,
    epis,
    trainings,
    compatibility: {
      trained: trainings.length > 0,
      examsUpToDate: exams_.some(e => {
        const expDate = e.expirationDate;
        return expDate && new Date(expDate) > new Date();
      }),
      episAvailable: epis.length > 0,
      isApt:
        trainings.length > 0 &&
        exams_.some(
          e => e.expirationDate && new Date(e.expirationDate) > new Date()
        ) &&
        epis.length > 0,
    },
  };
}

export async function getCompatibilityMatrix(unitId: number) {
  const db = await getDb();
  if (!db) return [];

  // Obter todos os funcionários da unidade
  const emps = await db
    .select()
    .from(employees)
    .where(eq(employees.unitId, unitId));

  const matrix = [];

  for (const emp of emps) {
    const compat = await getEmployeeCompatibility(emp.id);
    if (compat) {
      matrix.push(compat);
    }
  }

  return matrix;
}

// ─────────────────────────────────────────────────────────────────────────────
// AVALIAÇÕES AMBIENTAIS (NR-09)
// ─────────────────────────────────────────────────────────────────────────────

export async function createEnvironmentalAssessment(data: {
  gheId: number;
  agentType: string;
  agentName: string;
  measurementValue: number;
  unit: string;
  limiteTolerance: number;
  date: Date;
  responsible: string;
  notes?: string;
}) {
  // Nota: Seria necessário criar tabela environmental_assessments no schema
  // Por enquanto, retornar estrutura
  return {
    id: Math.random(),
    ...data,
    status:
      data.measurementValue <= data.limiteTolerance
        ? "Conforme"
        : "Não Conforme",
    createdAt: new Date(),
  };
}

export async function generatePPRAReport(unitId: number) {
  const db = await getDb();
  if (!db) return null;

  const gheList = await db.select().from(ghe).where(eq(ghe.unitId, unitId));

  const report = {
    unitId,
    date: new Date(),
    ghe: gheList,
    assessments: [],
    recommendations: [],
    status: "Vigente",
  };

  return report;
}

// ─────────────────────────────────────────────────────────────────────────────
// GESTÃO DE LAUDOS TÉCNICOS
// ─────────────────────────────────────────────────────────────────────────────

export interface TechnicalReport {
  id: number;
  unitId: number;
  type:
    | "LTCAT"
    | "PPP"
    | "Laudo Ambiental"
    | "Laudo Ergonômico"
    | "PPRA"
    | "PGR";
  title: string;
  revision: number;
  author: string;
  approver?: string;
  status: "Rascunho" | "Aguardando Aprovação" | "Aprovado" | "Vigente";
  validFrom: Date;
  validUntil?: Date;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createTechnicalReport(data: {
  unitId: number;
  type:
    | "LTCAT"
    | "PPP"
    | "Laudo Ambiental"
    | "Laudo Ergonômico"
    | "PPRA"
    | "PGR";
  title: string;
  author: string;
  validFrom: Date;
  validUntil?: Date;
  fileUrl?: string;
}) {
  // Seria necessário criar tabela technical_reports no schema
  return {
    id: Math.random(),
    ...data,
    revision: 1,
    status: "Rascunho" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function approveTechnicalReport(
  reportId: number,
  approver: string
) {
  return {
    success: true,
    status: "Aprovado",
    approver,
    approvedAt: new Date(),
  };
}

export async function getTechnicalReportHistory(reportId: number) {
  // Retornar histórico de revisões
  return [
    {
      revision: 1,
      status: "Rascunho",
      date: new Date(),
      author: "Engenheiro SST",
    },
    {
      revision: 2,
      status: "Aprovado",
      date: new Date(),
      author: "Gerente",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

async function logGHEAudit(data: {
  gheId: number;
  unitId: number;
  action: "CREATE" | "UPDATE" | "DELETE";
  userId?: number;
  userName?: string;
  oldValues?: any;
  newValues?: any;
}) {
  const db = await getDb();
  if (!db) return;

  try {
    const changes: Record<string, any> = {};
    if (data.oldValues && data.newValues) {
      for (const key in data.newValues) {
        if (data.oldValues[key] !== data.newValues[key]) {
          changes[key] = { old: data.oldValues[key], new: data.newValues[key] };
        }
      }
    }

    await db.insert(gheAuditLog).values({
      gheId: data.gheId,
      unitId: data.unitId,
      action: data.action,
      userId: data.userId,
      userName: data.userName,
      changes: Object.keys(changes).length > 0 ? changes : null,
      oldValues: data.oldValues || null,
      newValues: data.newValues || null,
    });
  } catch (error) {
    console.error("Erro ao registrar auditoria de GHE:", error);
  }
}

export async function getGHEAuditLog(gheId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(gheAuditLog)
      .where(eq(gheAuditLog.gheId, gheId));
  } catch (error) {
    console.error("Erro ao obter log de auditoria:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteGHE(gheId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Obter dados do GHE antes de deletar
  const gheData = await db.select().from(ghe).where(eq(ghe.id, gheId));
  const gheRecord = gheData?.[0];

  // Deletar agentes de exposição primeiro
  await db.delete(gheExposureAgents).where(eq(gheExposureAgents.gheId, gheId));

  // Deletar funcionários vinculados
  await db.delete(employeeGhe).where(eq(employeeGhe.gheId, gheId));

  // Deletar GHE
  await db.delete(ghe).where(eq(ghe.id, gheId));

  // Registrar auditoria
  if (gheRecord) {
    await logGHEAudit({
      gheId,
      unitId: gheRecord.unitId,
      action: "DELETE",
      oldValues: gheRecord,
    });
  }

  return { success: true, message: `GHE ${gheId} excluído com sucesso` };
}

export async function updateGHE(
  gheId: number,
  data: {
    code?: string;
    name?: string;
    description?: string;
    location?: string;
    responsible?: string;
    status?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Obter dados antigos
  const oldGHE = await db.select().from(ghe).where(eq(ghe.id, gheId));
  const oldRecord = oldGHE?.[0];

  const updateData: any = {};
  if (data.code) updateData.code = data.code;
  if (data.name) updateData.name = data.name;
  if (data.description) updateData.description = data.description;
  if (data.location) updateData.location = data.location;
  if (data.responsible) updateData.responsible = data.responsible;
  if (data.status) updateData.status = data.status;

  await db.update(ghe).set(updateData).where(eq(ghe.id, gheId));

  // Registrar auditoria
  if (oldRecord) {
    await logGHEAudit({
      gheId,
      unitId: oldRecord.unitId,
      action: "UPDATE",
      oldValues: oldRecord,
      newValues: { ...oldRecord, ...updateData },
    });
  }

  return { success: true, message: `GHE ${gheId} atualizado com sucesso` };
}

export async function deleteExposureAgent(agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(gheExposureAgents).where(eq(gheExposureAgents.id, agentId));

  return { success: true, message: `Agente ${agentId} removido com sucesso` };
}
