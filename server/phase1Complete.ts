/** Persistent SST services shared by the legacy phase1Complete routes. */
import { and, eq, gte, lte, inArray, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import * as dbService from "./db";
import * as core from "./phase1Features";
import { getGHEById } from "./gheUpdate";
import {
  ghe,
  environmentalAssessments,
  technicalReports,
  employees,
  sectors,
  leaveOfAbsence,
  incidents,
  risks,
  actionPlans,
  exams,
  trainingRecords,
  esocialEvents,
} from "../drizzle/schema";
async function database() {
  const db = await dbService.getDb();
  if (!db) throw new Error("Database not available");
  return db;
}
function period(start: Date, end: Date) {
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start > end
  )
    throw new TRPCError({ code: "BAD_REQUEST", message: "Período inválido" });
}
export async function createGHE(
  unitId: number,
  code: string,
  name: string,
  description?: string
) {
  const [record] = await core.createGHE({ unitId, code, name, description });
  return record;
}
export const listGHEByUnit = core.listGHE;
export const getGHEWithExposureAgents = getGHEById;
export async function recordEnvironmentalAssessment(
  gheId: number,
  agentType: string,
  agentName: string,
  measurementValue: number,
  limiteTolerance: number,
  unit: string,
  date: Date,
  responsible = ""
) {
  return core.createEnvironmentalAssessment({
    gheId,
    agentType,
    agentName,
    measurementValue,
    limiteTolerance,
    unit,
    date,
    responsible,
  });
}
export const getAssessmentsByGHE = core.listEnvironmentalAssessments;
export const generatePPRAReport = core.generatePPRAReport;
export async function createTechnicalReport(
  unitId: number,
  type: string,
  title: string,
  author: string,
  validFrom: Date,
  validUntil: Date
) {
  const allowed = [
    "LTCAT",
    "PPP",
    "Laudo Ambiental",
    "Laudo Ergonômico",
    "PGR",
    "PPRA",
  ] as const;
  const reportType = allowed.find(value => value === type);
  if (!reportType)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Tipo de laudo inválido",
    });
  return core.createTechnicalReport({
    unitId,
    type: reportType,
    title,
    author,
    validFrom,
    validUntil,
  });
}
export const approveTechnicalReport = core.approveTechnicalReport;
export const getTechnicalReportHistory = core.getTechnicalReportHistory;
export const listTechnicalReportsByUnit = core.listTechnicalReports;
export async function checkEmployeeCompatibility(
  employeeId: number,
  sectorId: number
) {
  const db = await database();
  const data = await core.getEmployeeCompatibility(employeeId);
  const [sector] = await db
    .select()
    .from(sectors)
    .where(eq(sectors.id, sectorId))
    .limit(1);
  if (!data || !sector)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Funcionário ou setor não encontrado",
    });
  if (data.employee.unitId !== sector.unitId)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Funcionário e setor pertencem a unidades diferentes",
    });
  const medicalExamValid = data.compatibility.examsUpToDate;
  const currentExam = data.exams
    .filter(exam => exam.expirationDate && exam.expirationDate >= new Date())
    .sort((a, b) => b.examDate.getTime() - a.examDate.getTime())[0];
  const noHealthRestrictions =
    currentExam?.result === "Apto" && !currentExam.restrictions;
  const trained = data.compatibility.trained,
    epiAvailable = data.compatibility.episAvailable;
  return {
    employeeId,
    sectorId,
    trained,
    medicalExamValid,
    epiAvailable,
    noHealthRestrictions,
    compatible:
      trained && medicalExamValid && epiAvailable && noHealthRestrictions,
    requiresProfessionalReview: true,
    alerts: [
      !trained && "Sem treinamento vigente registrado",
      !medicalExamValid && "Sem exame válido registrado",
      !epiAvailable && "Sem entrega de EPI ativa registrada",
      !noHealthRestrictions && "Revisar aptidão e restrições com o responsável",
    ].filter((item): item is string => !!item),
  };
}
export async function getEmployeeRiskMatrix(unitId: number) {
  const db = await database();
  const rows = await db
    .select()
    .from(employees)
    .where(eq(employees.unitId, unitId));
  const sectorRows = await db
    .select()
    .from(sectors)
    .where(eq(sectors.unitId, unitId));
  const matrix = await Promise.all(
    rows
      .filter(row => row.sectorId !== null)
      .map(row => checkEmployeeCompatibility(row.id, row.sectorId!))
  );
  return {
    unitId,
    employees: rows.length,
    sectors: sectorRows.length,
    compatibilityPercentage: matrix.length
      ? Math.round(
          (matrix.filter(item => item.compatible).length * 100) / matrix.length
        )
      : null,
    matrix,
  };
}
export async function recordAbsence(
  employeeId: number,
  type: "CAT" | "INSS" | "Licença" | "Suspensão",
  startDate: Date,
  endDate: Date,
  reason: string,
  catNumber?: string
) {
  period(startDate, endDate);
  const db = await database();
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);
  if (!employee)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Funcionário não encontrado",
    });
  const storedType = type === "CAT" ? "Acidente Trabalho" : "Outro";
  const daysCount =
    Math.floor(
      (Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate()
      ) -
        Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate()
        )) /
        86400000
    ) + 1;
  const [insert] = await db
    .insert(leaveOfAbsence)
    .values({
      employeeId,
      type: storedType,
      startDate,
      endDate,
      catNumber,
      daysCount,
      notes: JSON.stringify({ category: type, reason }),
    });
  const [record] = await db
    .select()
    .from(leaveOfAbsence)
    .where(eq(leaveOfAbsence.id, insert.insertId));
  return record;
}
export async function getAbsencesByEmployee(employeeId: number) {
  return (await database())
    .select()
    .from(leaveOfAbsence)
    .where(eq(leaveOfAbsence.employeeId, employeeId))
    .orderBy(desc(leaveOfAbsence.startDate));
}
/** Counts calendar days, clipping and merging overlapping absences per worker. */
export function absenceDays(
  rows: { employeeId: number; startDate: Date; endDate: Date | null }[],
  start: Date,
  end: Date
) {
  period(start, end);
  const day = (date: Date) =>
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
    86400000;
  const grouped = new Map<number, [number, number][]>();
  for (const row of rows) {
    const from = Math.max(day(start), day(row.startDate)),
      to = Math.min(day(end), day(row.endDate ?? end));
    if (from > to) continue;
    const intervals = grouped.get(row.employeeId) ?? [];
    intervals.push([from, to]);
    grouped.set(row.employeeId, intervals);
  }
  let total = 0;
  for (const intervals of grouped.values()) {
    intervals.sort((a, b) => a[0] - b[0]);
    let from = intervals[0][0],
      to = intervals[0][1];
    for (const next of intervals.slice(1)) {
      if (next[0] <= to + 1) to = Math.max(to, next[1]);
      else {
        total += to - from + 1;
        [from, to] = next;
      }
    }
    total += to - from + 1;
  }
  return total;
}
export async function calculateAbsenceImpact(
  unitId: number,
  startDate: Date,
  endDate: Date
) {
  period(startDate, endDate);
  const db = await database();
  const rows = await db
    .select({ absence: leaveOfAbsence })
    .from(leaveOfAbsence)
    .innerJoin(employees, eq(employees.id, leaveOfAbsence.employeeId))
    .where(eq(employees.unitId, unitId));
  const matching = rows
    .map(row => row.absence)
    .filter(
      row =>
        row.startDate <= endDate && (!row.endDate || row.endDate >= startDate)
    );
  return {
    unitId,
    period: { startDate, endDate },
    totalAbsences: matching.length,
    daysLost: absenceDays(matching, startDate, endDate),
    frequencyRate: null,
    severityRate: null,
    ratesUnavailableReason: "Horas efetivamente trabalhadas não informadas",
  };
}
async function reportData(unitId: number) {
  const db = await database();
  const [workers, riskRows, groups, assessments, accidents] = await Promise.all(
    [
      db.select().from(employees).where(eq(employees.unitId, unitId)),
      db.select().from(risks).where(eq(risks.unitId, unitId)),
      core.listGHE(unitId),
      db
        .select()
        .from(environmentalAssessments)
        .where(eq(environmentalAssessments.unitId, unitId)),
      db.select().from(incidents).where(eq(incidents.unitId, unitId)),
    ]
  );
  const ids = workers.map(worker => worker.id);
  const examRows = ids.length
    ? await db.select().from(exams).where(inArray(exams.employeeId, ids))
    : [];
  const trainingRows = ids.length
    ? await db
        .select()
        .from(trainingRecords)
        .where(inArray(trainingRecords.employeeId, ids))
    : [];
  return {
    workers,
    riskRows,
    groups,
    assessments,
    accidents,
    examRows,
    trainingRows,
  };
}
function draft(type: string, unitId: number, title: string, data: unknown) {
  return {
    type,
    unitId,
    title,
    generatedAt: new Date(),
    requiresProfessionalReview: true,
    content: JSON.stringify(data, null, 2),
  };
}
export async function generatePGRReport(unitId: number) {
  const data = await reportData(unitId);
  const db = await database();
  const riskIds = data.riskRows.map(row => row.id);
  const plans = riskIds.length
    ? await db
        .select()
        .from(actionPlans)
        .where(inArray(actionPlans.riskId, riskIds))
    : [];
  return draft("PGR", unitId, "Inventário de riscos e planos de ação", {
    risks: data.riskRows,
    actionPlans: plans,
  });
}
export async function generatePCMSOReport(unitId: number) {
  const data = await reportData(unitId);
  return draft("PCMSO", unitId, "Registros de exames ocupacionais", {
    employees: data.workers,
    exams: data.examRows,
  });
}
export async function generatePPRAReport2(unitId: number) {
  const data = await reportData(unitId);
  return draft("PPRA", unitId, "Avaliações ambientais registradas", {
    ghe: data.groups,
    assessments: data.assessments,
  });
}
export async function generateAccidentReport(
  unitId: number,
  startDate: Date,
  endDate: Date
) {
  period(startDate, endDate);
  const data = await reportData(unitId);
  const rows = data.accidents.filter(
    row => row.date >= startDate && row.date <= endDate
  );
  return {
    ...draft("Acidentes", unitId, "Ocorrências no período", rows),
    period: { startDate, endDate },
    totalAccidents: rows.length,
  };
}
export async function generateTrainingComplianceReport(unitId: number) {
  const data = await reportData(unitId);
  const now = new Date();
  const valid = new Set(
    data.trainingRows
      .filter(
        row =>
          row.completionDate <= now &&
          (!row.expiryDate || row.expiryDate >= now)
      )
      .map(row => row.employeeId)
  );
  const active = data.workers.filter(row => row.status === "Ativo");
  return {
    ...draft(
      "Treinamentos",
      unitId,
      "Cobertura de treinamentos registrados",
      data.trainingRows
    ),
    compliancePercentage: active.length
      ? Math.round(
          (100 * active.filter(row => valid.has(row.id)).length) / active.length
        )
      : null,
  };
}
export async function sendESocialEvent(
  eventType: "S-2210" | "S-2220" | "S-2240" | "S-2245",
  unitId: number,
  data: Record<string, unknown>
) {
  const db = await database();
  const [insert] = await db
    .insert(esocialEvents)
    .values({
      code: eventType,
      referenceType: "unit",
      referenceId: unitId,
      eventDate: new Date(),
      status: "Pendente",
      payload: data,
    });
  return {
    id: insert.insertId,
    unitId,
    eventType,
    status: "Pendente",
    transmitted: false,
    sentAt: null,
    responseCode: null,
    message: "Rascunho salvo. Transmissão oficial não configurada.",
  };
}
export async function getESocialEventStatus(eventId: number) {
  const db = await database();
  const [record] = await db
    .select()
    .from(esocialEvents)
    .where(eq(esocialEvents.id, eventId))
    .limit(1);
  if (!record)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Evento não encontrado",
    });
  return { ...record, eventType: record.code, responseCode: record.protocol };
}
export async function retryESocialEvent(eventId: number) {
  await getESocialEventStatus(eventId);
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "Nenhum evento reenviado: transmissor oficial não configurado",
  });
}
export async function getESocialTransmissionHistory(unitId: number) {
  return (await database())
    .select()
    .from(esocialEvents)
    .where(
      and(
        eq(esocialEvents.referenceType, "unit"),
        eq(esocialEvents.referenceId, unitId)
      )
    )
    .orderBy(desc(esocialEvents.createdAt));
}
export async function calculateSSTIndicators(
  unitId: number,
  startDate: Date,
  endDate: Date
) {
  period(startDate, endDate);
  const data = await reportData(unitId);
  const matching = data.accidents.filter(
    row => row.date >= startDate && row.date <= endDate
  );
  const last = data.accidents
    .filter(row => row.type.startsWith("Acidente") && row.date <= endDate)
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  return {
    unitId,
    period: { startDate, endDate },
    frequencyRate: null,
    severityRate: null,
    daysWithoutAccident: last
      ? Math.floor((endDate.getTime() - last.date.getTime()) / 86400000)
      : null,
    totalIncidents: matching.length,
    daysLost: matching.reduce((sum, row) => sum + (row.daysLost ?? 0), 0),
    complianceScore: null,
    trainingCompliance: (await generateTrainingComplianceReport(unitId))
      .compliancePercentage,
    medicalExamCompliance: null,
    epiCompliance: null,
  };
}
