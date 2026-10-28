import {
  eq,
  desc,
  asc,
  and,
  gte,
  lte,
  lt,
  sql,
  like,
  or,
  isNull,
} from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { normalizeWrite } from "./normalizeWrite";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import {
  users,
  companyUnits,
  sectors,
  employees,
  risks,
  actionPlans,
  exams,
  epiItems,
  epiDeliveries,
  trainings,
  trainingRecords,
  incidents,
  esocialEvents,
  documents,
  notifications,
  costs,
  inspections,
  cipaMembers,
  cipaMeetings,
  thirdParties,
  aiChats,
  leaveOfAbsence,
  environmentalAssessments,
  technicalReports,
  technicalReportsHistory,
  pdfReports,
  esocialS2230,
  employeeDocuments,
  employeeTrainingAccess,
  employeeNotifications,
  epcItems,
  epcMaintenanceRecords,
  nonConformities,
  nonConformityActions,
  auditLog,
  changeLog,
  dataIntegrityChecks,
  approvalWorkflows,
  approvalSteps,
  approvalRequests,
  approvalHistory,
  dashboards,
  kpis,
  analyticsEvents,
  analyticsReports,
  externalSystems,
  syncLogs,
  syncMappings,
  webhooks,
  webhookLogs,
  InsertUser,
  InsertCompanyUnit,
  InsertSector,
  InsertEmployee,
  InsertRisk,
  InsertActionPlan,
  InsertExam,
  InsertEpiItem,
  InsertEpiDelivery,
  InsertTraining,
  InsertTrainingRecord,
  InsertIncident,
  InsertEsocialEvent,
  InsertDocument,
  InsertNotification,
  InsertCost,
  InsertInspection,
  InsertCipaMember,
  InsertCipaMeeting,
  InsertThirdParty,
  InsertAiChat,
  InsertLeaveOfAbsence,
  InsertEnvironmentalAssessment,
  InsertTechnicalReport,
  InsertTechnicalReportHistory,
  InsertPdfReport,
  InsertEsocialS2230,
  InsertEmployeeDocument,
  InsertEmployeeTrainingAccess,
  InsertEmployeeNotification,
  InsertEpcItem,
  InsertEpcMaintenanceRecord,
  InsertNonConformity,
  InsertNonConformityAction,
  InsertAuditLog,
  InsertChangeLog,
  InsertDataIntegrityCheck,
  InsertApprovalWorkflow,
  InsertApprovalStep,
  InsertApprovalRequest,
  InsertApprovalHistory,
  InsertDashboard,
  InsertKpi,
  InsertAnalyticsEvent,
  InsertAnalyticsReport,
  InsertExternalSystem,
  InsertSyncLog,
  InsertSyncMapping,
  InsertWebhook,
  InsertWebhookLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: MySql2Database<typeof schema> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = [
      "name",
      "email",
      "loginMethod",
      "passwordHash",
      "companyName",
      "cnpj",
      "phone",
      "rejectionReason",
    ] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.registrationStatus !== undefined) {
      values.registrationStatus = user.registrationStatus;
      updateSet.registrationStatus = user.registrationStatus;
    }
    if (user.sessionVersion !== undefined) {
      values.sessionVersion = user.sessionVersion;
      updateSet.sessionVersion = user.sessionVersion;
    }
    if (user.emailVerified !== undefined) {
      values.emailVerified = user.emailVerified;
      updateSet.emailVerified = user.emailVerified;
    }
    if (user.resetToken !== undefined) {
      values.resetToken = user.resetToken;
      updateSet.resetToken = user.resetToken;
    }
    if (user.resetTokenExpiry !== undefined) {
      values.resetTokenExpiry = user.resetTokenExpiry;
      updateSet.resetTokenExpiry = user.resetTokenExpiry;
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0)
      updateSet.lastSignedIn = new Date();
    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── COMPANY UNITS ───────────────────────────────────────────────────────────
export async function getCompanyUnits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyUnits).orderBy(asc(companyUnits.name));
}
export async function createCompanyUnit(data: InsertCompanyUnit) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(companyUnits)
    .values(normalizeWrite(companyUnits, data));
  return result;
}
export async function updateCompanyUnit(
  id: number,
  data: Partial<InsertCompanyUnit>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(companyUnits)
    .set(normalizeWrite(companyUnits, data))
    .where(eq(companyUnits.id, id));
}
export async function deleteCompanyUnit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(companyUnits).where(eq(companyUnits.id, id));
}

// ─── SECTORS ─────────────────────────────────────────────────────────────────
export async function getSectors(unitId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (unitId)
    return db
      .select()
      .from(sectors)
      .where(eq(sectors.unitId, unitId))
      .orderBy(asc(sectors.name));
  return db.select().from(sectors).orderBy(asc(sectors.name));
}
export async function createSector(data: InsertSector) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(sectors)
    .values(normalizeWrite(sectors, data));
  return result;
}
export async function updateSector(id: number, data: Partial<InsertSector>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(sectors)
    .set(normalizeWrite(sectors, data))
    .where(eq(sectors.id, id));
}
export async function deleteSector(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(sectors).where(eq(sectors.id, id));
}

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
export async function getEmployees(
  unitId?: number,
  sectorId?: number,
  status?: string
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (unitId) conditions.push(eq(employees.unitId, unitId));
  if (sectorId) conditions.push(eq(employees.sectorId, sectorId));
  if (status) conditions.push(eq(employees.status, status as any));
  if (conditions.length > 0)
    return db
      .select()
      .from(employees)
      .where(and(...conditions))
      .orderBy(asc(employees.name));
  return db.select().from(employees).orderBy(asc(employees.name));
}
export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1);
  return result[0];
}
export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(employees)
    .values(normalizeWrite(employees, data));
  return result;
}
export async function updateEmployee(
  id: number,
  data: Partial<InsertEmployee>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(employees)
    .set({ ...normalizeWrite(employees, data), updatedAt: new Date() })
    .where(eq(employees.id, id));
}
export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(employees).where(eq(employees.id, id));
}
export async function getLeaveOfAbsence(employeeId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (employeeId)
    return db
      .select()
      .from(leaveOfAbsence)
      .where(eq(leaveOfAbsence.employeeId, employeeId))
      .orderBy(desc(leaveOfAbsence.startDate));
  return db
    .select()
    .from(leaveOfAbsence)
    .orderBy(desc(leaveOfAbsence.startDate));
}
export async function createLeaveOfAbsence(data: InsertLeaveOfAbsence) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(leaveOfAbsence)
    .values(normalizeWrite(leaveOfAbsence, data));
  return result;
}

// ─── RISKS ───────────────────────────────────────────────────────────────────
export async function getRisks(unitId?: number, sectorId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (unitId) conditions.push(eq(risks.unitId, unitId));
  if (sectorId) conditions.push(eq(risks.sectorId, sectorId));
  if (conditions.length > 0)
    return db
      .select()
      .from(risks)
      .where(and(...conditions))
      .orderBy(desc(risks.createdAt));
  return db.select().from(risks).orderBy(desc(risks.createdAt));
}
export async function createRisk(data: InsertRisk) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(risks).values(normalizeWrite(risks, data));
  return result;
}
export async function updateRisk(id: number, data: Partial<InsertRisk>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(risks)
    .set({ ...normalizeWrite(risks, data), updatedAt: new Date() })
    .where(eq(risks.id, id));
}
export async function deleteRisk(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(risks).where(eq(risks.id, id));
}

// ─── ACTION PLANS ────────────────────────────────────────────────────────────
export async function getActionPlans(riskId?: number, incidentId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (riskId)
    return db
      .select()
      .from(actionPlans)
      .where(eq(actionPlans.riskId, riskId))
      .orderBy(desc(actionPlans.createdAt));
  if (incidentId)
    return db
      .select()
      .from(actionPlans)
      .where(eq(actionPlans.incidentId, incidentId))
      .orderBy(desc(actionPlans.createdAt));
  return db.select().from(actionPlans).orderBy(desc(actionPlans.createdAt));
}
export async function createActionPlan(data: InsertActionPlan) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(actionPlans)
    .values(normalizeWrite(actionPlans, data));
  return result;
}
export async function updateActionPlan(
  id: number,
  data: Partial<InsertActionPlan>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(actionPlans)
    .set({ ...normalizeWrite(actionPlans, data), updatedAt: new Date() })
    .where(eq(actionPlans.id, id));
}
export async function deleteActionPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(actionPlans).where(eq(actionPlans.id, id));
}

// ─── EXAMS ───────────────────────────────────────────────────────────────────
export async function getExams(employeeId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (employeeId)
    return db
      .select()
      .from(exams)
      .where(eq(exams.employeeId, employeeId))
      .orderBy(desc(exams.examDate));
  return db.select().from(exams).orderBy(desc(exams.examDate));
}
export async function getExpiringExams(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return db
    .select()
    .from(exams)
    .where(
      and(
        lte(
          exams.expirationDate,
          futureDate.toISOString().split("T")[0] as any
        ),
        gte(exams.expirationDate, new Date().toISOString().split("T")[0] as any)
      )
    )
    .orderBy(asc(exams.expirationDate));
}
export async function createExam(data: InsertExam) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(exams).values(normalizeWrite(exams, data));
  return result;
}
export async function updateExam(id: number, data: Partial<InsertExam>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(exams)
    .set(normalizeWrite(exams, data))
    .where(eq(exams.id, id));
}
export async function deleteExam(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(exams).where(eq(exams.id, id));
}

// ─── EPI ITEMS ───────────────────────────────────────────────────────────────
export async function getEpiItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(epiItems).orderBy(asc(epiItems.name));
}
export async function getLowStockEpis() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(epiItems)
    .where(sql`${epiItems.stock} <= ${epiItems.minStock}`);
}
export async function createEpiItem(data: InsertEpiItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(epiItems)
    .values(normalizeWrite(epiItems, data));
  return result;
}
export async function updateEpiItem(id: number, data: Partial<InsertEpiItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(epiItems)
    .set({ ...normalizeWrite(epiItems, data), updatedAt: new Date() })
    .where(eq(epiItems.id, id));
}
export async function deleteEpiItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(epiItems).where(eq(epiItems.id, id));
}
export async function getEpiDeliveries(employeeId?: number, epiId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (employeeId) conditions.push(eq(epiDeliveries.employeeId, employeeId));
  if (epiId) conditions.push(eq(epiDeliveries.epiId, epiId));
  if (conditions.length > 0)
    return db
      .select()
      .from(epiDeliveries)
      .where(and(...conditions))
      .orderBy(desc(epiDeliveries.deliveryDate));
  return db
    .select()
    .from(epiDeliveries)
    .orderBy(desc(epiDeliveries.deliveryDate));
}
export async function createEpiDelivery(data: InsertEpiDelivery) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(epiDeliveries)
    .values(normalizeWrite(epiDeliveries, data));
  // Update stock
  await db
    .update(epiItems)
    .set({ stock: sql`${epiItems.stock} - ${data.quantity}` })
    .where(eq(epiItems.id, data.epiId));
  return result;
}

// ─── TRAININGS ───────────────────────────────────────────────────────────────
export async function getTrainings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trainings).orderBy(asc(trainings.title));
}
export async function createTraining(data: InsertTraining) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(trainings)
    .values(normalizeWrite(trainings, data));
  return result;
}
export async function updateTraining(
  id: number,
  data: Partial<InsertTraining>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(trainings)
    .set(normalizeWrite(trainings, data))
    .where(eq(trainings.id, id));
}
export async function deleteTraining(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(trainings).where(eq(trainings.id, id));
}
export async function getTrainingRecords(
  employeeId?: number,
  trainingId?: number
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (employeeId) conditions.push(eq(trainingRecords.employeeId, employeeId));
  if (trainingId) conditions.push(eq(trainingRecords.trainingId, trainingId));
  if (conditions.length > 0)
    return db
      .select()
      .from(trainingRecords)
      .where(and(...conditions))
      .orderBy(desc(trainingRecords.completionDate));
  return db
    .select()
    .from(trainingRecords)
    .orderBy(desc(trainingRecords.completionDate));
}
export async function createTrainingRecord(data: InsertTrainingRecord) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(trainingRecords)
    .values(normalizeWrite(trainingRecords, data));
  return result;
}
export async function updateTrainingRecord(
  id: number,
  data: Partial<InsertTrainingRecord>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(trainingRecords)
    .set(normalizeWrite(trainingRecords, data))
    .where(eq(trainingRecords.id, id));
}
export async function getExpiredTrainings(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return db
    .select()
    .from(trainingRecords)
    .where(
      and(
        lte(
          trainingRecords.expiryDate,
          futureDate.toISOString().split("T")[0] as any
        )
      )
    )
    .orderBy(asc(trainingRecords.expiryDate));
}

// ─── INCIDENTS ───────────────────────────────────────────────────────────────
export async function getIncidents(unitId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (unitId)
    return db
      .select()
      .from(incidents)
      .where(eq(incidents.unitId, unitId))
      .orderBy(desc(incidents.date));
  return db.select().from(incidents).orderBy(desc(incidents.date));
}
export async function getIncidentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, id))
    .limit(1);
  return result[0];
}
export async function createIncident(data: InsertIncident) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(incidents)
    .values(normalizeWrite(incidents, data));
  return result;
}
export async function updateIncident(
  id: number,
  data: Partial<InsertIncident>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(incidents)
    .set({ ...normalizeWrite(incidents, data), updatedAt: new Date() })
    .where(eq(incidents.id, id));
}
export async function deleteIncident(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(incidents).where(eq(incidents.id, id));
}

// ─── ESOCIAL ─────────────────────────────────────────────────────────────────
export async function getEsocialEvents(code?: string) {
  const db = await getDb();
  if (!db) return [];
  if (code)
    return db
      .select()
      .from(esocialEvents)
      .where(eq(esocialEvents.code, code as any))
      .orderBy(desc(esocialEvents.eventDate));
  return db.select().from(esocialEvents).orderBy(desc(esocialEvents.eventDate));
}
export async function createEsocialEvent(data: InsertEsocialEvent) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(esocialEvents)
    .values(normalizeWrite(esocialEvents, data));
  return result;
}
export async function updateEsocialEvent(
  id: number,
  data: Partial<InsertEsocialEvent>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(esocialEvents)
    .set(normalizeWrite(esocialEvents, data))
    .where(eq(esocialEvents.id, id));
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export async function getDocuments(unitId?: number, type?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (unitId) conditions.push(eq(documents.unitId, unitId));
  if (type) conditions.push(eq(documents.type, type as any));
  if (conditions.length > 0)
    return db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.createdAt));
  return db.select().from(documents).orderBy(desc(documents.createdAt));
}
export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(documents)
    .values(normalizeWrite(documents, data));
  return result;
}
export async function updateDocument(
  id: number,
  data: Partial<InsertDocument>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(documents)
    .set({ ...normalizeWrite(documents, data), updatedAt: new Date() })
    .where(eq(documents.id, id));
}
export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(documents).where(eq(documents.id, id));
}

// ─── INSPECTIONS ─────────────────────────────────────────────────────────────
export async function getInspections(unitId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (unitId)
    return db
      .select()
      .from(inspections)
      .where(eq(inspections.unitId, unitId))
      .orderBy(desc(inspections.inspectionDate));
  return db
    .select()
    .from(inspections)
    .orderBy(desc(inspections.inspectionDate));
}
export async function createInspection(data: InsertInspection) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(inspections)
    .values(normalizeWrite(inspections, data));
  return result;
}
export async function updateInspection(
  id: number,
  data: Partial<InsertInspection>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(inspections)
    .set(normalizeWrite(inspections, data))
    .where(eq(inspections.id, id));
}
export async function deleteInspection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(inspections).where(eq(inspections.id, id));
}

// ─── CIPA ────────────────────────────────────────────────────────────────────
export async function getCipaMembers(unitId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (unitId)
    return db
      .select()
      .from(cipaMembers)
      .where(eq(cipaMembers.unitId, unitId))
      .orderBy(asc(cipaMembers.role));
  return db.select().from(cipaMembers).orderBy(asc(cipaMembers.role));
}
export async function createCipaMember(data: InsertCipaMember) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(cipaMembers)
    .values(normalizeWrite(cipaMembers, data));
  return result;
}
export async function updateCipaMember(
  id: number,
  data: Partial<InsertCipaMember>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(cipaMembers)
    .set(normalizeWrite(cipaMembers, data))
    .where(eq(cipaMembers.id, id));
}
export async function deleteCipaMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(cipaMembers).where(eq(cipaMembers.id, id));
}
export async function getCipaMeetings(unitId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (unitId)
    return db
      .select()
      .from(cipaMeetings)
      .where(eq(cipaMeetings.unitId, unitId))
      .orderBy(desc(cipaMeetings.date));
  return db.select().from(cipaMeetings).orderBy(desc(cipaMeetings.date));
}
export async function createCipaMeeting(data: InsertCipaMeeting) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(cipaMeetings)
    .values(normalizeWrite(cipaMeetings, data));
  return result;
}
export async function updateCipaMeeting(
  id: number,
  data: Partial<InsertCipaMeeting>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(cipaMeetings)
    .set(normalizeWrite(cipaMeetings, data))
    .where(eq(cipaMeetings.id, id));
}

// ─── THIRD PARTIES ───────────────────────────────────────────────────────────
export async function getThirdParties(unitId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (unitId)
    return db
      .select()
      .from(thirdParties)
      .where(eq(thirdParties.unitId, unitId))
      .orderBy(asc(thirdParties.companyName));
  return db.select().from(thirdParties).orderBy(asc(thirdParties.companyName));
}
export async function createThirdParty(data: InsertThirdParty) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(thirdParties)
    .values(normalizeWrite(thirdParties, data));
  return result;
}
export async function updateThirdParty(
  id: number,
  data: Partial<InsertThirdParty>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(thirdParties)
    .set(normalizeWrite(thirdParties, data))
    .where(eq(thirdParties.id, id));
}
export async function deleteThirdParty(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(thirdParties).where(eq(thirdParties.id, id));
}

// ─── COSTS ───────────────────────────────────────────────────────────────────
export async function getCosts(unitId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (unitId)
    return db
      .select()
      .from(costs)
      .where(eq(costs.unitId, unitId))
      .orderBy(desc(costs.date));
  return db.select().from(costs).orderBy(desc(costs.date));
}
export async function createCost(data: InsertCost) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(costs).values(normalizeWrite(costs, data));
  return result;
}
export async function updateCost(id: number, data: Partial<InsertCost>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(costs)
    .set(normalizeWrite(costs, data))
    .where(eq(costs.id, id));
}
export async function deleteCost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(costs).where(eq(costs.id, id));
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export async function getNotifications(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (userId)
    return db
      .select()
      .from(notifications)
      .where(or(eq(notifications.userId, userId), isNull(notifications.userId)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  return db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(normalizeWrite(notifications, data));
}
export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}
export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId));
}

// ─── AI CHATS ────────────────────────────────────────────────────────────────
export async function getAiChats(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(aiChats)
    .where(eq(aiChats.userId, userId))
    .orderBy(asc(aiChats.createdAt))
    .limit(100);
}
export async function saveAiMessage(data: InsertAiChat) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiChats).values(normalizeWrite(aiChats, data));
}
export async function clearAiChats(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(aiChats).where(eq(aiChats.userId, userId));
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
export async function getDashboardStats(unitId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(now.getDate() + 30);
  const nowStr = now.toISOString().split("T")[0];
  const thirtyStr = thirtyDaysLater.toISOString().split("T")[0];

  const empConditions = unitId ? [eq(employees.unitId, unitId)] : [];
  const riskConditions = unitId ? [eq(risks.unitId, unitId)] : [];
  const incidentConditions = unitId ? [eq(incidents.unitId, unitId)] : [];

  const [
    empList,
    riskList,
    incidentList,
    actionList,
    lowStockList,
    expiringExamsList,
    expiredTrainingsList,
  ] = await Promise.all([
    db
      .select()
      .from(employees)
      .where(empConditions.length > 0 ? and(...empConditions) : undefined),
    db
      .select()
      .from(risks)
      .where(riskConditions.length > 0 ? and(...riskConditions) : undefined),
    db
      .select()
      .from(incidents)
      .where(
        incidentConditions.length > 0 ? and(...incidentConditions) : undefined
      ),
    db
      .select()
      .from(actionPlans)
      .where(
        or(
          eq(actionPlans.status, "Pendente"),
          eq(actionPlans.status, "Em Andamento")
        )
      ),
    db
      .select()
      .from(epiItems)
      .where(sql`${epiItems.stock} <= ${epiItems.minStock}`),
    db
      .select()
      .from(exams)
      .where(
        and(
          lte(exams.expirationDate, thirtyStr as any),
          gte(exams.expirationDate, nowStr as any)
        )
      ),
    db
      .select()
      .from(trainingRecords)
      .where(lte(trainingRecords.expiryDate, thirtyStr as any)),
  ]);

  const activeEmployees = empList.filter(e => e.status === "Ativo").length;
  const highRisks = riskList.filter(
    r => r.riskLevel === "Intolerável" || r.riskLevel === "Substancial"
  ).length;
  const lostTimeAccidents = incidentList.filter(
    i => i.type === "Acidente com Afastamento"
  ).length;
  const totalHoursWorked = activeEmployees * 200 * 12;
  const freqRate =
    totalHoursWorked > 0 ? (lostTimeAccidents * 1000000) / totalHoursWorked : 0;
  const totalDaysLost = incidentList.reduce(
    (acc, i) => acc + (i.daysLost || 0),
    0
  );
  const gravRate =
    totalHoursWorked > 0 ? (totalDaysLost * 1000000) / totalHoursWorked : 0;

  // Days without accident
  const lastAccident = incidentList
    .filter(i => i.type === "Acidente com Afastamento")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const daysWithoutAccident = lastAccident
    ? Math.floor(
        (now.getTime() - new Date(lastAccident.date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Basic recorded exam coverage, not a legal compliance certification.
  const allExams = await db.select().from(exams);
  const coveredEmployees = new Set(
    allExams
      .filter(
        exam =>
          exam.expirationDate &&
          exam.expirationDate >= now &&
          (exam.result === "Apto" || exam.result === "Apto com Restrições")
      )
      .map(exam => exam.employeeId)
  );
  const activeList = empList.filter(employee => employee.status === "Ativo");
  const complianceScore = activeList.length
    ? Math.round(
        (100 *
          activeList.filter(employee => coveredEmployees.has(employee.id))
            .length) /
          activeList.length
      )
    : 0;

  return {
    totalEmployees: empList.length,
    activeEmployees,
    highRisks,
    openActions: actionList.length,
    lowStockEpis: lowStockList.length,
    expiringExams: expiringExamsList.length,
    expiredTrainings: expiredTrainingsList.length,
    frequencyRate: Number(freqRate.toFixed(2)),
    gravityRate: Number(gravRate.toFixed(2)),
    daysWithoutAccident,
    complianceScore,
    totalIncidents: incidentList.length,
    risksByLevel: {
      toleravel: riskList.filter(r => r.riskLevel === "Tolerável").length,
      moderado: riskList.filter(r => r.riskLevel === "Moderado").length,
      substancial: riskList.filter(r => r.riskLevel === "Substancial").length,
      intoleravel: riskList.filter(r => r.riskLevel === "Intolerável").length,
    },
  };
}

// ─── ENVIRONMENTAL ASSESSMENTS ───────────────────────────────────────────────
export async function getEnvironmentalAssessments(
  gheId?: number,
  unitId?: number
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (gheId) conditions.push(eq(environmentalAssessments.gheId, gheId));
  if (unitId) conditions.push(eq(environmentalAssessments.unitId, unitId));
  if (conditions.length > 0)
    return db
      .select()
      .from(environmentalAssessments)
      .where(and(...conditions))
      .orderBy(desc(environmentalAssessments.date));
  return db
    .select()
    .from(environmentalAssessments)
    .orderBy(desc(environmentalAssessments.date));
}
export async function createEnvironmentalAssessment(
  data: InsertEnvironmentalAssessment
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(environmentalAssessments)
    .values(normalizeWrite(environmentalAssessments, data));
  return result;
}
export async function updateEnvironmentalAssessment(
  id: number,
  data: Partial<InsertEnvironmentalAssessment>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(environmentalAssessments)
    .set({
      ...normalizeWrite(environmentalAssessments, data),
      updatedAt: new Date(),
    })
    .where(eq(environmentalAssessments.id, id));
}

// ─── TECHNICAL REPORTS ──────────────────────────────────────────────────────
export async function getTechnicalReports(unitId?: number, type?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (unitId) conditions.push(eq(technicalReports.unitId, unitId));
  if (type) conditions.push(eq(technicalReports.type, type as any));
  if (conditions.length > 0)
    return db
      .select()
      .from(technicalReports)
      .where(and(...conditions))
      .orderBy(desc(technicalReports.createdAt));
  return db
    .select()
    .from(technicalReports)
    .orderBy(desc(technicalReports.createdAt));
}
export async function createTechnicalReport(data: InsertTechnicalReport) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(technicalReports)
    .values(normalizeWrite(technicalReports, data));
  return result;
}
export async function updateTechnicalReport(
  id: number,
  data: Partial<InsertTechnicalReport>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(technicalReports)
    .set({ ...normalizeWrite(technicalReports, data), updatedAt: new Date() })
    .where(eq(technicalReports.id, id));
}
export async function getTechnicalReportHistory(reportId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(technicalReportsHistory)
    .where(eq(technicalReportsHistory.reportId, reportId))
    .orderBy(desc(technicalReportsHistory.version));
}
export async function createTechnicalReportHistory(
  data: InsertTechnicalReportHistory
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(technicalReportsHistory)
    .values(normalizeWrite(technicalReportsHistory, data));
  return result;
}

// ─── PDF REPORTS ────────────────────────────────────────────────────────────
export async function getPdfReports(unitId?: number, type?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (unitId) conditions.push(eq(pdfReports.unitId, unitId));
  if (type) conditions.push(eq(pdfReports.type, type as any));
  if (conditions.length > 0)
    return db
      .select()
      .from(pdfReports)
      .where(and(...conditions))
      .orderBy(desc(pdfReports.generatedAt));
  return db.select().from(pdfReports).orderBy(desc(pdfReports.generatedAt));
}
export async function createPdfReport(data: InsertPdfReport) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(pdfReports)
    .values(normalizeWrite(pdfReports, data));
  return result;
}
export async function updatePdfReport(
  id: number,
  data: Partial<InsertPdfReport>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(pdfReports)
    .set(normalizeWrite(pdfReports, data))
    .where(eq(pdfReports.id, id));
}

// ─── ESOCIAL S-2230 ─────────────────────────────────────────────────────────
export async function getEsocialS2230(unitId?: number, employeeId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (unitId) conditions.push(eq(esocialS2230.unitId, unitId));
  if (employeeId) conditions.push(eq(esocialS2230.employeeId, employeeId));
  if (conditions.length > 0)
    return db
      .select()
      .from(esocialS2230)
      .where(and(...conditions))
      .orderBy(desc(esocialS2230.createdAt));
  return db.select().from(esocialS2230).orderBy(desc(esocialS2230.createdAt));
}
export async function createEsocialS2230(data: InsertEsocialS2230) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(esocialS2230)
    .values(normalizeWrite(esocialS2230, data));
  return result;
}
export async function updateEsocialS2230(
  id: number,
  data: Partial<InsertEsocialS2230>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(esocialS2230)
    .set({ ...normalizeWrite(esocialS2230, data), updatedAt: new Date() })
    .where(eq(esocialS2230.id, id));
}

// ─── PORTAL DO COLABORADOR - EMPLOYEE DOCUMENTS ──────────────────────────────
export async function getEmployeeDocuments(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(employeeDocuments)
    .where(eq(employeeDocuments.employeeId, employeeId))
    .orderBy(desc(employeeDocuments.createdAt));
}
export async function createEmployeeDocument(data: InsertEmployeeDocument) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(employeeDocuments)
    .values(normalizeWrite(employeeDocuments, data));
  return result;
}
export async function updateEmployeeDocument(
  id: number,
  data: Partial<InsertEmployeeDocument>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(employeeDocuments)
    .set(normalizeWrite(employeeDocuments, data))
    .where(eq(employeeDocuments.id, id));
}

// ─── PORTAL DO COLABORADOR - TRAINING ACCESS ─────────────────────────────────
export async function getEmployeeTrainingAccess(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(employeeTrainingAccess)
    .where(eq(employeeTrainingAccess.employeeId, employeeId))
    .orderBy(desc(employeeTrainingAccess.accessDate));
}
export async function createEmployeeTrainingAccess(
  data: InsertEmployeeTrainingAccess
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(employeeTrainingAccess)
    .values(normalizeWrite(employeeTrainingAccess, data));
  return result;
}
export async function updateEmployeeTrainingAccess(
  id: number,
  data: Partial<InsertEmployeeTrainingAccess>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(employeeTrainingAccess)
    .set(normalizeWrite(employeeTrainingAccess, data))
    .where(eq(employeeTrainingAccess.id, id));
}

// ─── PORTAL DO COLABORADOR - NOTIFICATIONS ───────────────────────────────────
export async function getEmployeeNotifications(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(employeeNotifications)
    .where(eq(employeeNotifications.employeeId, employeeId))
    .orderBy(desc(employeeNotifications.createdAt));
}
export async function createEmployeeNotification(
  data: InsertEmployeeNotification
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(employeeNotifications)
    .values(normalizeWrite(employeeNotifications, data));
  return result;
}
export async function markEmployeeNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(employeeNotifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(employeeNotifications.id, id));
}

// ─── GESTÃO DE EPC - ITEMS ────────────────────────────────────────────────────
export async function getEpcItems(unitId?: number, sectorId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (unitId) conditions.push(eq(epcItems.unitId, unitId));
  if (sectorId) conditions.push(eq(epcItems.sectorId, sectorId));
  if (conditions.length > 0)
    return db
      .select()
      .from(epcItems)
      .where(and(...conditions))
      .orderBy(desc(epcItems.createdAt));
  return db.select().from(epcItems).orderBy(desc(epcItems.createdAt));
}
export async function createEpcItem(data: InsertEpcItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(epcItems)
    .values(normalizeWrite(epcItems, data));
  return result;
}
export async function updateEpcItem(id: number, data: Partial<InsertEpcItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(epcItems)
    .set(normalizeWrite(epcItems, data))
    .where(eq(epcItems.id, id));
}

// ─── GESTÃO DE EPC - MAINTENANCE RECORDS ──────────────────────────────────────
export async function getEpcMaintenanceRecords(epcItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(epcMaintenanceRecords)
    .where(eq(epcMaintenanceRecords.epcItemId, epcItemId))
    .orderBy(desc(epcMaintenanceRecords.maintenanceDate));
}
export async function createEpcMaintenanceRecord(
  data: InsertEpcMaintenanceRecord
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(epcMaintenanceRecords)
    .values(normalizeWrite(epcMaintenanceRecords, data));
  return result;
}

// ─── NÃO CONFORMIDADES ────────────────────────────────────────────────────────
export async function getNonConformities(
  unitId?: number,
  sectorId?: number,
  status?: string
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (unitId) conditions.push(eq(nonConformities.unitId, unitId));
  if (sectorId) conditions.push(eq(nonConformities.sectorId, sectorId));
  if (status) conditions.push(eq(nonConformities.status, status as any));
  if (conditions.length > 0)
    return db
      .select()
      .from(nonConformities)
      .where(and(...conditions))
      .orderBy(desc(nonConformities.createdAt));
  return db
    .select()
    .from(nonConformities)
    .orderBy(desc(nonConformities.createdAt));
}
export async function createNonConformity(data: InsertNonConformity) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(nonConformities)
    .values(normalizeWrite(nonConformities, data));
  return result;
}
export async function updateNonConformity(
  id: number,
  data: Partial<InsertNonConformity>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(nonConformities)
    .set(normalizeWrite(nonConformities, data))
    .where(eq(nonConformities.id, id));
}

// ─── NÃO CONFORMIDADES - ACTIONS ──────────────────────────────────────────────
export async function getNonConformityActions(nonConformityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(nonConformityActions)
    .where(eq(nonConformityActions.nonConformityId, nonConformityId))
    .orderBy(desc(nonConformityActions.createdAt));
}
export async function createNonConformityAction(
  data: InsertNonConformityAction
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(nonConformityActions)
    .values(normalizeWrite(nonConformityActions, data));
  return result;
}
export async function updateNonConformityAction(
  id: number,
  data: Partial<InsertNonConformityAction>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(nonConformityActions)
    .set(normalizeWrite(nonConformityActions, data))
    .where(eq(nonConformityActions.id, id));
}

// ─── AUDITORIA - AUDIT LOG ────────────────────────────────────────────────────
export async function getAuditLog(
  userId?: number,
  entityType?: string,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (userId) conditions.push(eq(auditLog.userId, userId));
  if (entityType) conditions.push(eq(auditLog.entityType, entityType));
  if (conditions.length > 0)
    return db
      .select()
      .from(auditLog)
      .where(and(...conditions))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);
  return db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(auditLog)
    .values(normalizeWrite(auditLog, data));
  return result;
}

// ─── RASTREABILIDADE - CHANGE LOG ─────────────────────────────────────────────
export async function getChangeLog(
  entityType?: string,
  entityId?: number,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (entityType) conditions.push(eq(changeLog.entityType, entityType));
  if (entityId) conditions.push(eq(changeLog.entityId, entityId));
  if (conditions.length > 0)
    return db
      .select()
      .from(changeLog)
      .where(and(...conditions))
      .orderBy(desc(changeLog.createdAt))
      .limit(limit);
  return db
    .select()
    .from(changeLog)
    .orderBy(desc(changeLog.createdAt))
    .limit(limit);
}
export async function createChangeLog(data: InsertChangeLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(changeLog)
    .values(normalizeWrite(changeLog, data));
  return result;
}

// ─── INTEGRIDADE DE DADOS ─────────────────────────────────────────────────────
export async function getDataIntegrityChecks(
  status?: string,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) return [];
  if (status)
    return db
      .select()
      .from(dataIntegrityChecks)
      .where(eq(dataIntegrityChecks.status, status as any))
      .orderBy(desc(dataIntegrityChecks.createdAt))
      .limit(limit);
  return db
    .select()
    .from(dataIntegrityChecks)
    .orderBy(desc(dataIntegrityChecks.createdAt))
    .limit(limit);
}
export async function createDataIntegrityCheck(data: InsertDataIntegrityCheck) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(dataIntegrityChecks)
    .values(normalizeWrite(dataIntegrityChecks, data));
  return result;
}

// ─── FLUXO DE APROVAÇÃO - WORKFLOWS ──────────────────────────────────────────
export async function getApprovalWorkflows(entityType?: string) {
  const db = await getDb();
  if (!db) return [];
  if (entityType)
    return db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.entityType, entityType));
  return db
    .select()
    .from(approvalWorkflows)
    .orderBy(desc(approvalWorkflows.createdAt));
}
export async function createApprovalWorkflow(data: InsertApprovalWorkflow) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(approvalWorkflows)
    .values(normalizeWrite(approvalWorkflows, data));
  return result;
}

// ─── FLUXO DE APROVAÇÃO - STEPS ──────────────────────────────────────────────
export async function getApprovalSteps(workflowId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(approvalSteps)
    .where(eq(approvalSteps.workflowId, workflowId))
    .orderBy(asc(approvalSteps.stepNumber));
}
export async function createApprovalStep(data: InsertApprovalStep) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(approvalSteps)
    .values(normalizeWrite(approvalSteps, data));
  return result;
}

// ─── FLUXO DE APROVAÇÃO - REQUESTS ──────────────────────────────────────────
export async function getApprovalRequests(
  workflowId?: number,
  status?: string
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (workflowId) conditions.push(eq(approvalRequests.workflowId, workflowId));
  if (status) conditions.push(eq(approvalRequests.status, status as any));
  if (conditions.length > 0)
    return db
      .select()
      .from(approvalRequests)
      .where(and(...conditions))
      .orderBy(desc(approvalRequests.createdAt));
  return db
    .select()
    .from(approvalRequests)
    .orderBy(desc(approvalRequests.createdAt));
}
export async function createApprovalRequest(data: InsertApprovalRequest) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(approvalRequests)
    .values(normalizeWrite(approvalRequests, data));
  return result;
}
export async function updateApprovalRequest(
  id: number,
  data: Partial<InsertApprovalRequest>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(approvalRequests)
    .set(normalizeWrite(approvalRequests, data))
    .where(eq(approvalRequests.id, id));
}

// ─── FLUXO DE APROVAÇÃO - HISTORY ───────────────────────────────────────────
export async function getApprovalHistory(requestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(approvalHistory)
    .where(eq(approvalHistory.requestId, requestId))
    .orderBy(asc(approvalHistory.stepNumber));
}
export async function createApprovalHistory(data: InsertApprovalHistory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(approvalHistory)
    .values(normalizeWrite(approvalHistory, data));
  return result;
}

// ─── DASHBOARDS ─────────────────────────────────────────────────────────────
export async function getDashboards(unitId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(dashboards)
    .where(eq(dashboards.unitId, unitId))
    .orderBy(desc(dashboards.createdAt));
}
export async function createDashboard(data: InsertDashboard) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(dashboards)
    .values(normalizeWrite(dashboards, data));
  return result;
}
export async function updateDashboard(
  id: number,
  data: Partial<InsertDashboard>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(dashboards)
    .set(normalizeWrite(dashboards, data))
    .where(eq(dashboards.id, id));
}

// ─── KPIs ───────────────────────────────────────────────────────────────────
export async function getKpis(dashboardId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(kpis)
    .where(eq(kpis.dashboardId, dashboardId))
    .orderBy(desc(kpis.createdAt));
}
export async function createKpi(data: InsertKpi) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(kpis).values(normalizeWrite(kpis, data));
  return result;
}
export async function updateKpi(id: number, data: Partial<InsertKpi>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(kpis).set(normalizeWrite(kpis, data)).where(eq(kpis.id, id));
}

// ─── ANALYTICS EVENTS ────────────────────────────────────────────────────────
export async function getAnalyticsEvents(
  unitId: number,
  eventType?: string,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(analyticsEvents.unitId, unitId)];
  if (eventType) conditions.push(eq(analyticsEvents.eventType, eventType));
  return db
    .select()
    .from(analyticsEvents)
    .where(and(...conditions))
    .orderBy(desc(analyticsEvents.timestamp))
    .limit(limit);
}
export async function createAnalyticsEvent(data: InsertAnalyticsEvent) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(analyticsEvents)
    .values(normalizeWrite(analyticsEvents, data));
  return result;
}

// ─── ANALYTICS REPORTS ───────────────────────────────────────────────────────
export async function getAnalyticsReports(unitId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(analyticsReports.unitId, unitId)];
  if (type) conditions.push(eq(analyticsReports.type, type as any));
  return db
    .select()
    .from(analyticsReports)
    .where(and(...conditions))
    .orderBy(desc(analyticsReports.generatedAt));
}
export async function createAnalyticsReport(data: InsertAnalyticsReport) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(analyticsReports)
    .values(normalizeWrite(analyticsReports, data));
  return result;
}

// ─── EXTERNAL SYSTEMS ────────────────────────────────────────────────────────
export async function getExternalSystems(unitId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(externalSystems)
    .where(eq(externalSystems.unitId, unitId))
    .orderBy(desc(externalSystems.createdAt));
}
export async function createExternalSystem(data: InsertExternalSystem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(externalSystems)
    .values(normalizeWrite(externalSystems, data));
  return result;
}
export async function updateExternalSystem(
  id: number,
  data: Partial<InsertExternalSystem>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(externalSystems)
    .set(normalizeWrite(externalSystems, data))
    .where(eq(externalSystems.id, id));
}

// ─── SYNC LOGS ───────────────────────────────────────────────────────────────
export async function getSyncLogs(systemId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(syncLogs)
    .where(eq(syncLogs.systemId, systemId))
    .orderBy(desc(syncLogs.startedAt))
    .limit(limit);
}
export async function createSyncLog(data: InsertSyncLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(syncLogs)
    .values(normalizeWrite(syncLogs, data));
  return result;
}
export async function updateSyncLog(id: number, data: Partial<InsertSyncLog>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(syncLogs)
    .set(normalizeWrite(syncLogs, data))
    .where(eq(syncLogs.id, id));
}

// ─── SYNC MAPPINGS ──────────────────────────────────────────────────────────
export async function getSyncMappings(systemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(syncMappings)
    .where(eq(syncMappings.systemId, systemId))
    .orderBy(asc(syncMappings.createdAt));
}
export async function createSyncMapping(data: InsertSyncMapping) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(syncMappings)
    .values(normalizeWrite(syncMappings, data));
  return result;
}

// ─── WEBHOOKS ───────────────────────────────────────────────────────────────
export async function getWebhooks(unitId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(webhooks)
    .where(eq(webhooks.unitId, unitId))
    .orderBy(desc(webhooks.createdAt));
}
export async function createWebhook(data: InsertWebhook) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(webhooks)
    .values(normalizeWrite(webhooks, data));
  return result;
}
export async function updateWebhook(id: number, data: Partial<InsertWebhook>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db
    .update(webhooks)
    .set(normalizeWrite(webhooks, data))
    .where(eq(webhooks.id, id));
}

// ─── WEBHOOK LOGS ────────────────────────────────────────────────────────────
export async function getWebhookLogs(webhookId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(webhookLogs)
    .where(eq(webhookLogs.webhookId, webhookId))
    .orderBy(desc(webhookLogs.triggeredAt))
    .limit(limit);
}
export async function createWebhookLog(data: InsertWebhookLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db
    .insert(webhookLogs)
    .values(normalizeWrite(webhookLogs, data));
  return result;
}
