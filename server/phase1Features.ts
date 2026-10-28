/**
 * FASE 1 - Funcionalidades Críticas de SST
 * Gestão de GHE, Avaliações Ambientais, Laudos, Matriz de Compatibilidade
 */

import { eq, and, inArray, desc, sql, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import {
  companyUnits,
  riskMapAreas,
  ghe,
  environmentalAssessments,
  technicalReports,
  technicalReportsHistory,
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

  const [unit] = await db
    .select({ id: companyUnits.id })
    .from(companyUnits)
    .where(eq(companyUnits.id, data.unitId))
    .limit(1);
  if (!unit)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Unidade não encontrada",
    });
  if (data.riskMapAreaId) {
    const [area] = await db
      .select({ id: riskMapAreas.id })
      .from(riskMapAreas)
      .where(
        and(
          eq(riskMapAreas.id, data.riskMapAreaId),
          eq(riskMapAreas.unitId, data.unitId)
        )
      )
      .limit(1);
    if (!area)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Área não pertence à unidade informada",
      });
  }
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

  const [worker] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, data.employeeId))
    .limit(1);
  const [group] = await db
    .select()
    .from(ghe)
    .where(eq(ghe.id, data.gheId))
    .limit(1);
  if (!worker || !group)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Funcionário ou GHE não encontrado",
    });
  if (worker.unitId !== group.unitId)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Funcionário e GHE devem pertencer à mesma unidade",
    });
  if (data.endDate && data.endDate < data.startDate)
    throw new TRPCError({ code: "BAD_REQUEST", message: "Período inválido" });
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

  const [group] = await db
    .select({ id: ghe.id })
    .from(ghe)
    .where(eq(ghe.id, data.gheId))
    .limit(1);
  if (!group)
    throw new TRPCError({ code: "NOT_FOUND", message: "GHE não encontrado" });
  await db.insert(gheExposureAgents).values({
    gheId: data.gheId,
    agentType: data.agentType,
    agentName: data.agentName,
    riskLevel: data.riskLevel,
    limiteTolerance:
      data.limiteTolerance !== undefined
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
    .where(
      and(eq(employeeGhe.employeeId, employeeId), isNull(employeeGhe.endDate))
    );

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

  const now = new Date();
  const trained = trainings.some(
    record =>
      record.completionDate <= now &&
      (!record.expiryDate || record.expiryDate >= now)
  );
  const examsUpToDate = exams_.some(
    exam =>
      exam.expirationDate &&
      exam.expirationDate >= now &&
      (exam.result === "Apto" || exam.result === "Apto com Restrições")
  );
  const episAvailable = epis.some(
    delivery => !delivery.returnDate && delivery.deliveryDate <= now
  );
  return {
    employee: employee[0],
    ghe: gheAssignments,
    risks: gheRisks,
    exams: exams_,
    epis,
    trainings,
    compatibility: {
      trained,
      examsUpToDate,
      episAvailable,
      isApt: trained && examsUpToDate && episAvailable,
      requiresProfessionalReview: true,
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [group] = await db
    .select()
    .from(ghe)
    .where(eq(ghe.id, data.gheId))
    .limit(1);
  if (!group)
    throw new TRPCError({ code: "NOT_FOUND", message: "GHE não encontrado" });
  const agentTypes = ["Químico", "Físico", "Biológico", "Ergonômico"] as const;
  const agentType = agentTypes.find(type => type === data.agentType);
  if (
    !agentType ||
    !Number.isFinite(data.measurementValue) ||
    data.measurementValue < 0 ||
    !Number.isFinite(data.limiteTolerance) ||
    data.limiteTolerance <= 0
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Tipo de agente ou valores de medição inválidos",
    });
  const [insert] = await db
    .insert(environmentalAssessments)
    .values({
      ...data,
      unitId: group.unitId,
      agentType,
      measurementValue: String(data.measurementValue),
      limiteTolerance: String(data.limiteTolerance),
      status:
        data.measurementValue > data.limiteTolerance
          ? "Não Conforme"
          : "Conforme",
    });
  const [created] = await db
    .select()
    .from(environmentalAssessments)
    .where(eq(environmentalAssessments.id, insert.insertId));
  return created;
}

export async function listEnvironmentalAssessments(gheId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(environmentalAssessments)
    .where(eq(environmentalAssessments.gheId, gheId))
    .orderBy(desc(environmentalAssessments.date));
}
export async function generatePPRAReport(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const groups = await db.select().from(ghe).where(eq(ghe.unitId, unitId));
  const assessments = await db
    .select()
    .from(environmentalAssessments)
    .where(eq(environmentalAssessments.unitId, unitId));
  const nonConforming = assessments.filter(
    row => row.status === "Não Conforme"
  );
  return {
    unitId,
    date: new Date(),
    ghe: groups,
    assessments,
    gheCount: groups.length,
    assessmentCount: assessments.length,
    nonConformingCount: nonConforming.length,
    recommendations: nonConforming.map(
      row => `Revisar controles do agente ${row.agentName} no GHE ${row.gheId}`
    ),
    status: nonConforming.length
      ? "Requer Ação"
      : assessments.length
        ? "Sem excedências registradas"
        : "Sem avaliações",
  };
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.validUntil && data.validUntil < data.validFrom)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A validade deve terminar após a data inicial",
    });
  return db.transaction(async tx => {
    const [result] = await tx
      .insert(technicalReports)
      .values({
        ...data,
        validUntil: data.validUntil ?? null,
        status: "Rascunho",
      });
    await tx
      .insert(technicalReportsHistory)
      .values({
        reportId: result.insertId,
        version: 1,
        status: "Rascunho",
        notes: "Criação do laudo",
      });
    const [record] = await tx
      .select()
      .from(technicalReports)
      .where(eq(technicalReports.id, result.insertId));
    return { ...record, revision: 1 };
  });
}
export async function listTechnicalReports(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(technicalReports)
    .where(eq(technicalReports.unitId, unitId))
    .orderBy(desc(technicalReports.createdAt));
  if (!rows.length) return [];
  const versions = await db
    .select({
      reportId: technicalReportsHistory.reportId,
      revision: sql<number>`max(${technicalReportsHistory.version})`,
    })
    .from(technicalReportsHistory)
    .where(
      inArray(
        technicalReportsHistory.reportId,
        rows.map(row => row.id)
      )
    )
    .groupBy(technicalReportsHistory.reportId);
  return rows.map(row => ({
    ...row,
    revision: Number(
      versions.find(version => version.reportId === row.id)?.revision ?? 1
    ),
  }));
}
export async function approveTechnicalReport(
  reportId: number,
  approver: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.transaction(async tx => {
    const [report] = await tx
      .select()
      .from(technicalReports)
      .where(eq(technicalReports.id, reportId))
      .for("update");
    if (!report)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Laudo não encontrado",
      });
    if (report.status === "Aprovado" || report.status === "Vigente")
      throw new TRPCError({ code: "CONFLICT", message: "Laudo já aprovado" });
    const [last] = await tx
      .select({ version: technicalReportsHistory.version })
      .from(technicalReportsHistory)
      .where(eq(technicalReportsHistory.reportId, reportId))
      .orderBy(desc(technicalReportsHistory.version))
      .limit(1);
    const approvedAt = new Date();
    await tx
      .update(technicalReports)
      .set({ status: "Aprovado", signedBy: approver, updatedAt: approvedAt })
      .where(eq(technicalReports.id, reportId));
    await tx
      .insert(technicalReportsHistory)
      .values({
        reportId,
        version: (last?.version ?? 0) + 1,
        status: "Aprovado",
        approver,
        approvedAt,
        notes: "Aprovação administrativa; não constitui assinatura digital",
      });
    return {
      success: true,
      id: reportId,
      status: "Aprovado" as const,
      approver,
      approvedAt,
    };
  });
}
export async function getTechnicalReportHistory(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const records = await db
    .select()
    .from(technicalReportsHistory)
    .where(eq(technicalReportsHistory.reportId, reportId))
    .orderBy(desc(technicalReportsHistory.version));
  return records.map(row => ({
    ...row,
    revision: row.version,
    date: row.createdAt,
    author: row.approver,
  }));
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
