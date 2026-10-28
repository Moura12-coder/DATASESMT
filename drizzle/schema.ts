import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
  json,
  unique,
} from "drizzle-orm/mysql-core";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: text("passwordHash"), // For email/password login
  emailVerified: boolean("emailVerified").default(false),
  resetToken: varchar("resetToken", { length: 255 }), // For password reset
  resetTokenExpiry: timestamp("resetTokenExpiry"), // Expiry for reset token
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  registrationStatus: mysqlEnum("registrationStatus", [
    "pending",
    "approved",
    "rejected",
  ])
    .default("approved")
    .notNull(),
  rejectionReason: text("rejectionReason"),
  companyName: varchar("companyName", { length: 255 }),
  cnpj: varchar("cnpj", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  sessionVersion: int("sessionVersion").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── COMPANY UNITS ───────────────────────────────────────────────────────────
export const companyUnits = mysqlTable("company_units", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }),
  cnae: varchar("cnae", { length: 20 }),
  grauRisco: mysqlEnum("grauRisco", ["1", "2", "3", "4"]).default("1"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SECTORS / GHE ───────────────────────────────────────────────────────────
export const sectors = mysqlTable("sectors", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  responsible: varchar("responsible", { length: 255 }),
  riskLevel: mysqlEnum("riskLevel", [
    "Baixo",
    "Médio",
    "Alto",
    "Crítico",
  ]).default("Baixo"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  sectorId: int("sectorId"),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  rg: varchar("rg", { length: 20 }),
  role: varchar("role", { length: 255 }),
  department: varchar("department", { length: 255 }),
  admissionDate: date("admissionDate"),
  birthDate: date("birthDate"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["Ativo", "Afastado", "Férias", "Desligado"])
    .default("Ativo")
    .notNull(),
  esocialCategory: varchar("esocialCategory", { length: 10 }),
  pis: varchar("pis", { length: 20 }),
  ctps: varchar("ctps", { length: 30 }),
  bloodType: varchar("bloodType", { length: 5 }),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── LEAVE OF ABSENCE (AFASTAMENTOS) ─────────────────────────────────────────
export const leaveOfAbsence = mysqlTable("leave_of_absence", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  type: mysqlEnum("type", [
    "Acidente Trabalho",
    "Doença Ocupacional",
    "Doença Comum",
    "Maternidade",
    "Outro",
  ]).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  cid: varchar("cid", { length: 10 }),
  catNumber: varchar("catNumber", { length: 30 }),
  daysCount: int("daysCount"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── RISKS (PGR) ─────────────────────────────────────────────────────────────
export const risks = mysqlTable("risks", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  sectorId: int("sectorId"),
  type: mysqlEnum("type", [
    "Físico",
    "Químico",
    "Biológico",
    "Ergonômico",
    "Acidente",
    "Psicossocial",
  ]).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  source: varchar("source", { length: 255 }),
  ghe: varchar("ghe", { length: 255 }),
  probability: mysqlEnum("probability", ["1", "2", "3", "4", "5"]).default("1"),
  severity: mysqlEnum("severity", ["1", "2", "3", "4", "5"]).default("1"),
  riskLevel: mysqlEnum("riskLevel", [
    "Tolerável",
    "Moderado",
    "Substancial",
    "Intolerável",
  ]).default("Tolerável"),
  controlMeasures: text("controlMeasures"),
  existingControls: text("existingControls"),
  residualRisk: mysqlEnum("residualRisk", [
    "Tolerável",
    "Moderado",
    "Substancial",
    "Intolerável",
  ]).default("Tolerável"),
  responsible: varchar("responsible", { length: 255 }),
  deadline: date("deadline"),
  status: mysqlEnum("status", [
    "Identificado",
    "Em Controle",
    "Controlado",
  ]).default("Identificado"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── ACTION PLANS (5W2H) ─────────────────────────────────────────────────────
export const actionPlans = mysqlTable("action_plans", {
  id: int("id").autoincrement().primaryKey(),
  riskId: int("riskId"),
  incidentId: int("incidentId"),
  inspectionId: int("inspectionId"),
  what: varchar("what", { length: 500 }).notNull(),
  why: varchar("why", { length: 500 }),
  who: varchar("who", { length: 255 }).notNull(),
  where: varchar("where", { length: 255 }),
  when: date("when").notNull(),
  howMuch: decimal("howMuch", { precision: 10, scale: 2 }),
  how: text("how"),
  status: mysqlEnum("status", [
    "Pendente",
    "Em Andamento",
    "Concluída",
    "Cancelada",
  ])
    .default("Pendente")
    .notNull(),
  priority: mysqlEnum("priority", [
    "Baixa",
    "Média",
    "Alta",
    "Crítica",
  ]).default("Média"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── EXAMS (PCMSO) ───────────────────────────────────────────────────────────
export const exams = mysqlTable("exams", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  type: mysqlEnum("type", [
    "Admissional",
    "Periódico",
    "Demissional",
    "Retorno ao Trabalho",
    "Mudança de Função",
  ]).notNull(),
  examDate: date("examDate").notNull(),
  expirationDate: date("expirationDate"),
  doctor: varchar("doctor", { length: 255 }),
  crm: varchar("crm", { length: 20 }),
  result: mysqlEnum("result", [
    "Apto",
    "Apto com Restrições",
    "Inapto Temporário",
    "Inapto",
  ]).default("Apto"),
  restrictions: text("restrictions"),
  asoFileKey: varchar("asoFileKey", { length: 500 }),
  status: mysqlEnum("status", ["Válido", "A Vencer", "Vencido"]).default(
    "Válido"
  ),
  esocialSent: boolean("esocialSent").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── EPI ITEMS ───────────────────────────────────────────────────────────────
export const epiItems = mysqlTable("epi_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ca: varchar("ca", { length: 30 }),
  caExpiration: date("caExpiration"),
  manufacturer: varchar("manufacturer", { length: 255 }),
  type: varchar("type", { length: 100 }),
  stock: int("stock").default(0).notNull(),
  minStock: int("minStock").default(0).notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).default("0"),
  unit: varchar("unit", { length: 20 }).default("un"),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── EPI DELIVERIES ──────────────────────────────────────────────────────────
export const epiDeliveries = mysqlTable("epi_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  epiId: int("epiId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  deliveryDate: date("deliveryDate").notNull(),
  returnDate: date("returnDate"),
  reason: varchar("reason", { length: 255 }),
  signatureFileKey: varchar("signatureFileKey", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── TRAININGS ───────────────────────────────────────────────────────────────
export const trainings = mysqlTable("trainings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  nr: varchar("nr", { length: 20 }),
  type: mysqlEnum("type", [
    "Integração",
    "Periódico",
    "Específico",
    "Reciclagem",
    "Outro",
  ]).default("Periódico"),
  instructor: varchar("instructor", { length: 255 }),
  workload: int("workload"),
  validityMonths: int("validityMonths").default(12),
  targetRoles: json("targetRoles"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── TRAINING RECORDS ────────────────────────────────────────────────────────
export const trainingRecords = mysqlTable("training_records", {
  id: int("id").autoincrement().primaryKey(),
  trainingId: int("trainingId").notNull(),
  employeeId: int("employeeId").notNull(),
  completionDate: date("completionDate").notNull(),
  expiryDate: date("expiryDate"),
  status: mysqlEnum("status", ["Vigente", "A Vencer", "Vencido"]).default(
    "Vigente"
  ),
  score: decimal("score", { precision: 5, scale: 2 }),
  certificateFileKey: varchar("certificateFileKey", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── INCIDENTS ───────────────────────────────────────────────────────────────
export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  sectorId: int("sectorId"),
  employeeId: int("employeeId"),
  type: mysqlEnum("type", [
    "Acidente com Afastamento",
    "Acidente sem Afastamento",
    "Quase Acidente",
    "Doença Ocupacional",
    "Incidente Perigoso",
  ]).notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  bodyPart: varchar("bodyPart", { length: 255 }),
  injuryType: varchar("injuryType", { length: 255 }),
  daysLost: int("daysLost").default(0),
  catNumber: varchar("catNumber", { length: 30 }),
  catDate: date("catDate"),
  investigationMethod: mysqlEnum("investigationMethod", [
    "5 Porquês",
    "Árvore de Causas",
    "FMEA",
    "Outro",
  ]),
  rootCauses: json("rootCauses"),
  immediateActions: text("immediateActions"),
  status: mysqlEnum("status", [
    "Aberto",
    "Em Investigação",
    "Aguardando Ação",
    "Encerrado",
  ]).default("Aberto"),
  esocialSent: boolean("esocialSent").default(false),
  esocialProtocol: varchar("esocialProtocol", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── ESOCIAL EVENTS ──────────────────────────────────────────────────────────
export const esocialEvents = mysqlTable("esocial_events", {
  id: int("id").autoincrement().primaryKey(),
  code: mysqlEnum("code", ["S-2210", "S-2220", "S-2240", "S-2245"]).notNull(),
  employeeId: int("employeeId"),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 50 }),
  eventDate: timestamp("eventDate").notNull(),
  status: mysqlEnum("status", [
    "Pendente",
    "Enviado",
    "Sucesso",
    "Erro",
    "Retificado",
  ]).default("Pendente"),
  protocol: varchar("protocol", { length: 100 }),
  errorMessage: text("errorMessage"),
  payload: json("payload"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── CIPA MEMBERS ────────────────────────────────────────────────────────────
export const cipaMembers = mysqlTable("cipa_members", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  employeeId: int("employeeId").notNull(),
  role: mysqlEnum("role", [
    "Presidente",
    "Vice-Presidente",
    "Secretário",
    "Membro Efetivo",
    "Membro Suplente",
  ]).notNull(),
  origin: mysqlEnum("origin", ["Eleito", "Indicado"]).default("Eleito"),
  mandateStart: date("mandateStart"),
  mandateEnd: date("mandateEnd"),
  status: mysqlEnum("status", ["Ativo", "Inativo"]).default("Ativo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── CIPA MEETINGS ───────────────────────────────────────────────────────────
export const cipaMeetings = mysqlTable("cipa_meetings", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  date: timestamp("date").notNull(),
  type: mysqlEnum("type", ["Ordinária", "Extraordinária"]).default("Ordinária"),
  agenda: text("agenda"),
  minutes: text("minutes"),
  minutesFileKey: varchar("minutesFileKey", { length: 500 }),
  status: mysqlEnum("status", ["Agendada", "Realizada", "Cancelada"]).default(
    "Agendada"
  ),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── FIELD INSPECTIONS ───────────────────────────────────────────────────────
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  sectorId: int("sectorId"),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "Rotina",
    "Especial",
    "Auditoria",
    "Pós-Acidente",
  ]).default("Rotina"),
  inspector: varchar("inspector", { length: 255 }),
  inspectionDate: date("inspectionDate").notNull(),
  nr: varchar("nr", { length: 20 }),
  checklist: json("checklist"),
  nonConformities: int("nonConformities").default(0),
  conformities: int("conformities").default(0),
  score: decimal("score", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", [
    "Agendada",
    "Em Andamento",
    "Concluída",
  ]).default("Agendada"),
  notes: text("notes"),
  reportFileKey: varchar("reportFileKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId"),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "PGR",
    "PCMSO",
    "LTCAT",
    "PPP",
    "ASO",
    "CAT",
    "Laudo",
    "Certificado",
    "Procedimento",
    "Outro",
  ]).notNull(),
  revision: varchar("revision", { length: 20 }).default("Rev. 01"),
  status: mysqlEnum("status", ["Vigente", "Em Revisão", "Obsoleto"]).default(
    "Vigente"
  ),
  fileKey: varchar("fileKey", { length: 500 }),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileName: varchar("fileName", { length: 255 }),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  validFrom: date("validFrom"),
  validUntil: date("validUntil"),
  author: varchar("author", { length: 255 }),
  description: text("description"),
  tags: json("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── THIRD PARTIES ───────────────────────────────────────────────────────────
export const thirdParties = mysqlTable("third_parties", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId"),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  serviceType: varchar("serviceType", { length: 255 }),
  contractStart: date("contractStart"),
  contractEnd: date("contractEnd"),
  status: mysqlEnum("status", ["Ativo", "Inativo", "Suspenso"]).default(
    "Ativo"
  ),
  pgr: boolean("pgr").default(false),
  pcmso: boolean("pcmso").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── COSTS ───────────────────────────────────────────────────────────────────
export const costs = mysqlTable("costs", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId"),
  description: varchar("description", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "EPI",
    "Exame",
    "Treinamento",
    "Consultor",
    "Equipamento",
    "Outro",
  ]).notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  status: mysqlEnum("status", ["Pago", "Pendente", "Cancelado"]).default(
    "Pendente"
  ),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── AI CHAT HISTORY ─────────────────────────────────────────────────────────
export const aiChats = mysqlTable("ai_chats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  type: mysqlEnum("type", [
    "exam_expiry",
    "epi_stock",
    "training_expiry",
    "action_deadline",
    "incident",
    "general",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 50 }),
  read: boolean("read").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── RISK MAP AREAS ──────────────────────────────────────────────────────────
export const riskMapAreas = mysqlTable("risk_map_areas", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coordinates: json("coordinates"), // {x, y, width, height}
  riskLevel: mysqlEnum("riskLevel", [
    "Tolerável",
    "Moderado",
    "Substancial",
    "Intolerável",
  ]).default("Tolerável"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── GHE (Grupos Homogêneos de Exposição) ────────────────────────────────────
export const ghe = mysqlTable(
  "ghe",
  {
    id: int("id").autoincrement().primaryKey(),
    unitId: int("unitId").notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    location: varchar("location", { length: 255 }),
    responsible: varchar("responsible", { length: 255 }),
    status: mysqlEnum("status", ["Ativo", "Inativo", "Em Revisão"])
      .default("Ativo")
      .notNull(),
    notes: text("notes"),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    riskMapAreaId: int("riskMapAreaId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    uniqueCodePerUnit: unique().on(table.unitId, table.code),
  })
);

// ─── EMPLOYEE GHE MAPPING ────────────────────────────────────────────────────
export const employeeGhe = mysqlTable("employee_ghe", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  gheId: int("gheId").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── GHE EXPOSURE AGENTS ─────────────────────────────────────────────────────
export const gheExposureAgents = mysqlTable("ghe_exposure_agents", {
  id: int("id").autoincrement().primaryKey(),
  gheId: int("gheId").notNull(),
  agentType: mysqlEnum("agentType", [
    "Químico",
    "Físico",
    "Biológico",
    "Ergonômico",
    "Acidente",
  ]),
  agentName: varchar("agentName", { length: 255 }).notNull(),
  riskLevel: mysqlEnum("riskLevel", [
    "Tolerável",
    "Moderado",
    "Substancial",
    "Intolerável",
  ]),
  limiteTolerance: decimal("limiteTolerance", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── RISK MAP AREA HISTORY ──────────────────────────────────────────────────────
export const riskMapAreaHistory = mysqlTable("risk_map_area_history", {
  id: int("id").autoincrement().primaryKey(),
  areaId: int("areaId").notNull(),
  changeType: mysqlEnum("changeType", [
    "position_update",
    "name_update",
    "risk_update",
    "rollback",
  ]).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  changedBy: int("changedBy").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

// ─── RISK MAP ALERTS ────────────────────────────────────────────────────────────
export const riskMapAlerts = mysqlTable("risk_map_alerts", {
  id: int("id").autoincrement().primaryKey(),
  areaId: int("areaId").notNull(),
  unitId: int("unitId").notNull(),
  oldRiskLevel: varchar("oldRiskLevel", { length: 50 }),
  newRiskLevel: varchar("newRiskLevel", { length: 50 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).default("medium"),
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  acknowledgedBy: int("acknowledgedBy"),
});

// ─── RISK MAP COMPARISONS ──────────────────────────────────────────────────────
export const riskMapComparisons = mysqlTable("risk_map_comparisons", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  period1Start: date("period1Start").notNull(),
  period1End: date("period1End").notNull(),
  period2Start: date("period2Start").notNull(),
  period2End: date("period2End").notNull(),
  comparisonData: json("comparisonData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
});

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CompanyUnit = typeof companyUnits.$inferSelect;
export type InsertCompanyUnit = typeof companyUnits.$inferInsert;
export type Sector = typeof sectors.$inferSelect;
export type InsertSector = typeof sectors.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type Risk = typeof risks.$inferSelect;
export type InsertRisk = typeof risks.$inferInsert;
export type ActionPlan = typeof actionPlans.$inferSelect;
export type InsertActionPlan = typeof actionPlans.$inferInsert;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = typeof exams.$inferInsert;
export type EpiItem = typeof epiItems.$inferSelect;
export type InsertEpiItem = typeof epiItems.$inferInsert;
export type EpiDelivery = typeof epiDeliveries.$inferSelect;
export type InsertEpiDelivery = typeof epiDeliveries.$inferInsert;
export type Training = typeof trainings.$inferSelect;
export type InsertTraining = typeof trainings.$inferInsert;
export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertTrainingRecord = typeof trainingRecords.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;
export type EsocialEvent = typeof esocialEvents.$inferSelect;
export type InsertEsocialEvent = typeof esocialEvents.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Cost = typeof costs.$inferSelect;
export type InsertCost = typeof costs.$inferInsert;
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;
export type CipaMember = typeof cipaMembers.$inferSelect;
export type InsertCipaMember = typeof cipaMembers.$inferInsert;
export type CipaMeeting = typeof cipaMeetings.$inferSelect;
export type InsertCipaMeeting = typeof cipaMeetings.$inferInsert;
export type ThirdParty = typeof thirdParties.$inferSelect;
export type InsertThirdParty = typeof thirdParties.$inferInsert;
export type AiChat = typeof aiChats.$inferSelect;
export type InsertAiChat = typeof aiChats.$inferInsert;
export type LeaveOfAbsence = typeof leaveOfAbsence.$inferSelect;
export type InsertLeaveOfAbsence = typeof leaveOfAbsence.$inferInsert;
export type RiskMapArea = typeof riskMapAreas.$inferSelect;
export type InsertRiskMapArea = typeof riskMapAreas.$inferInsert;
export type GHE = typeof ghe.$inferSelect;
export type InsertGHE = typeof ghe.$inferInsert;
export type EmployeeGhe = typeof employeeGhe.$inferSelect;
export type InsertEmployeeGhe = typeof employeeGhe.$inferInsert;
export type GheExposureAgent = typeof gheExposureAgents.$inferSelect;
export type InsertGheExposureAgent = typeof gheExposureAgents.$inferInsert;

// ─── ENVIRONMENTAL ASSESSMENTS (NR-09) ────────────────────────────────────────
export const environmentalAssessments = mysqlTable(
  "environmental_assessments",
  {
    id: int("id").autoincrement().primaryKey(),
    unitId: int("unitId").notNull(),
    gheId: int("gheId").notNull(),
    agentType: mysqlEnum("agentType", [
      "Químico",
      "Físico",
      "Biológico",
      "Ergonômico",
    ]).notNull(),
    agentName: varchar("agentName", { length: 255 }).notNull(),
    measurementValue: decimal("measurementValue", {
      precision: 10,
      scale: 2,
    }).notNull(),
    unit: varchar("unit", { length: 50 }),
    limiteTolerance: decimal("limiteTolerance", { precision: 10, scale: 2 }),
    status: mysqlEnum("status", [
      "Conforme",
      "Não Conforme",
      "Atenção",
    ]).default("Conforme"),
    date: date("date").notNull(),
    responsible: varchar("responsible", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

// ─── TECHNICAL REPORTS (LAUDOS) ───────────────────────────────────────────────
export const technicalReports = mysqlTable("technical_reports", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  type: mysqlEnum("type", [
    "LTCAT",
    "PPP",
    "Laudo Ambiental",
    "Laudo Ergonômico",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  status: mysqlEnum("status", [
    "Rascunho",
    "Aguardando Aprovação",
    "Aprovado",
    "Vigente",
    "Expirado",
  ]).default("Rascunho"),
  validFrom: date("validFrom").notNull(),
  validUntil: date("validUntil").notNull(),
  content: text("content"),
  fileUrl: varchar("fileUrl", { length: 500 }),
  fileKey: varchar("fileKey", { length: 255 }),
  signature: text("signature"),
  signedBy: varchar("signedBy", { length: 255 }),
  signedAt: timestamp("signedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── TECHNICAL REPORTS HISTORY (VERSIONAMENTO) ────────────────────────────────
export const technicalReportsHistory = mysqlTable("technical_reports_history", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  version: int("version").notNull(),
  status: mysqlEnum("status", [
    "Rascunho",
    "Aguardando Aprovação",
    "Aprovado",
    "Vigente",
    "Expirado",
  ]).notNull(),
  approver: varchar("approver", { length: 255 }),
  approvedAt: timestamp("approvedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PDF REPORTS (RELATÓRIOS OBRIGATÓRIOS) ───────────────────────────────────
export const pdfReports = mysqlTable("pdf_reports", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  type: mysqlEnum("type", [
    "Acidentes",
    "PCMSO",
    "PPRA",
    "PGR",
    "CIPA",
    "Treinamentos",
    "Custos",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }),
  fileKey: varchar("fileKey", { length: 255 }),
  signature: text("signature"),
  signedBy: varchar("signedBy", { length: 255 }),
  signedAt: timestamp("signedAt"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── ESOCIAL S-2230 (AFASTAMENTOS) ───────────────────────────────────────────
export const esocialS2230 = mysqlTable("esocial_s2230", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  employeeId: int("employeeId").notNull(),
  absenceId: int("absenceId").notNull(),
  eventType: varchar("eventType", { length: 10 }).default("S-2230").notNull(),
  status: mysqlEnum("status", [
    "Rascunho",
    "Enviado",
    "Processado",
    "Rejeitado",
  ]).default("Rascunho"),
  esocialResponse: json("esocialResponse"),
  sentAt: timestamp("sentAt"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
export type EnvironmentalAssessment =
  typeof environmentalAssessments.$inferSelect;
export type InsertEnvironmentalAssessment =
  typeof environmentalAssessments.$inferInsert;
export type TechnicalReport = typeof technicalReports.$inferSelect;
export type InsertTechnicalReport = typeof technicalReports.$inferInsert;
export type TechnicalReportHistory =
  typeof technicalReportsHistory.$inferSelect;
export type InsertTechnicalReportHistory =
  typeof technicalReportsHistory.$inferInsert;
export type PdfReport = typeof pdfReports.$inferSelect;
export type InsertPdfReport = typeof pdfReports.$inferInsert;
export type EsocialS2230 = typeof esocialS2230.$inferSelect;
export type InsertEsocialS2230 = typeof esocialS2230.$inferInsert;

// ─── PORTAL DO COLABORADOR ────────────────────────────────────────────────────
export const employeeDocuments = mysqlTable("employee_documents", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  documentType: mysqlEnum("documentType", [
    "Contrato",
    "Exame",
    "Treinamento",
    "EPI",
    "Laudo",
    "Outro",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }),
  fileKey: varchar("fileKey", { length: 255 }),
  issueDate: date("issueDate"),
  expiryDate: date("expiryDate"),
  status: mysqlEnum("status", ["Ativo", "Expirado", "Arquivado"]).default(
    "Ativo"
  ),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const employeeTrainingAccess = mysqlTable("employee_training_access", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  trainingId: int("trainingId").notNull(),
  accessDate: timestamp("accessDate").defaultNow().notNull(),
  completionDate: timestamp("completionDate"),
  status: mysqlEnum("status", [
    "Pendente",
    "Em Progresso",
    "Concluído",
    "Expirado",
  ]).default("Pendente"),
  certificateUrl: varchar("certificateUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const employeeNotifications = mysqlTable("employee_notifications", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  type: mysqlEnum("type", [
    "Documento Expirado",
    "Treinamento Vencido",
    "EPI Necessário",
    "Não Conformidade",
    "Aviso",
    "Informação",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  relatedId: int("relatedId"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── GESTÃO DE EPC (EQUIPAMENTOS DE PROTEÇÃO COLETIVA) ──────────────────────
export const epcItems = mysqlTable("epc_items", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  sectorId: int("sectorId"),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "Proteção Respiratória",
    "Proteção Auditiva",
    "Proteção Visual",
    "Proteção de Extremidades",
    "Proteção de Corpo",
    "Proteção de Queda",
    "Outro",
  ]).notNull(),
  quantity: int("quantity").default(0),
  installationDate: date("installationDate"),
  lastMaintenanceDate: date("lastMaintenanceDate"),
  nextMaintenanceDate: date("nextMaintenanceDate"),
  maintenanceFrequency: varchar("maintenanceFrequency", { length: 50 }),
  status: mysqlEnum("status", [
    "Operacional",
    "Em Manutenção",
    "Danificado",
    "Descartado",
  ]).default("Operacional"),
  responsible: varchar("responsible", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const epcMaintenanceRecords = mysqlTable("epc_maintenance_records", {
  id: int("id").autoincrement().primaryKey(),
  epcItemId: int("epcItemId").notNull(),
  maintenanceDate: date("maintenanceDate").notNull(),
  type: mysqlEnum("type", [
    "Inspeção",
    "Limpeza",
    "Reparo",
    "Substituição",
    "Teste",
  ]).notNull(),
  responsible: varchar("responsible", { length: 255 }),
  notes: text("notes"),
  nextScheduledDate: date("nextScheduledDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── GESTÃO DE NÃO CONFORMIDADES ──────────────────────────────────────────────
export const nonConformities = mysqlTable("non_conformities", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  sectorId: int("sectorId"),
  type: mysqlEnum("type", [
    "NR Violada",
    "Procedimento Inadequado",
    "Equipamento Defeituoso",
    "Falta de Treinamento",
    "Outro",
  ]).notNull(),
  severity: mysqlEnum("severity", [
    "Baixa",
    "Média",
    "Alta",
    "Crítica",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  detectedDate: date("detectedDate").notNull(),
  detectedBy: varchar("detectedBy", { length: 255 }),
  status: mysqlEnum("status", [
    "Aberta",
    "Em Análise",
    "Plano de Ação",
    "Em Execução",
    "Fechada",
    "Cancelada",
  ]).default("Aberta"),
  dueDate: date("dueDate"),
  closedDate: date("closedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const nonConformityActions = mysqlTable("non_conformity_actions", {
  id: int("id").autoincrement().primaryKey(),
  nonConformityId: int("nonConformityId").notNull(),
  action: text("action").notNull(),
  responsible: varchar("responsible", { length: 255 }),
  dueDate: date("dueDate"),
  completionDate: date("completionDate"),
  status: mysqlEnum("status", [
    "Planejada",
    "Em Execução",
    "Concluída",
    "Atrasada",
  ]).default("Planejada"),
  evidence: text("evidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── AUDITORIA E RASTREABILIDADE ──────────────────────────────────────────────
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["Sucesso", "Erro", "Acesso Negado"]).default(
    "Sucesso"
  ),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const changeLog = mysqlTable("change_log", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId").notNull(),
  changeType: mysqlEnum("changeType", [
    "Criação",
    "Modificação",
    "Exclusão",
    "Aprovação",
    "Rejeição",
  ]).notNull(),
  changedBy: varchar("changedBy", { length: 255 }),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  reason: text("reason"),
  approvedBy: varchar("approvedBy", { length: 255 }),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dataIntegrityChecks = mysqlTable("data_integrity_checks", {
  id: int("id").autoincrement().primaryKey(),
  checkType: varchar("checkType", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  status: mysqlEnum("status", ["Passou", "Falhou", "Aviso"]).notNull(),
  description: text("description"),
  affectedRecords: int("affectedRecords").default(0),
  correctionApplied: boolean("correctionApplied").default(false),
  correctedBy: varchar("correctedBy", { length: 255 }),
  correctedAt: timestamp("correctedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type InsertEmployeeDocument = typeof employeeDocuments.$inferInsert;
export type EmployeeTrainingAccess = typeof employeeTrainingAccess.$inferSelect;
export type InsertEmployeeTrainingAccess =
  typeof employeeTrainingAccess.$inferInsert;
export type EmployeeNotification = typeof employeeNotifications.$inferSelect;
export type InsertEmployeeNotification =
  typeof employeeNotifications.$inferInsert;
export type EpcItem = typeof epcItems.$inferSelect;
export type InsertEpcItem = typeof epcItems.$inferInsert;
export type EpcMaintenanceRecord = typeof epcMaintenanceRecords.$inferSelect;
export type InsertEpcMaintenanceRecord =
  typeof epcMaintenanceRecords.$inferInsert;
export type NonConformity = typeof nonConformities.$inferSelect;
export type InsertNonConformity = typeof nonConformities.$inferInsert;
export type NonConformityAction = typeof nonConformityActions.$inferSelect;
export type InsertNonConformityAction =
  typeof nonConformityActions.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
export type ChangeLog = typeof changeLog.$inferSelect;
export type InsertChangeLog = typeof changeLog.$inferInsert;
export type DataIntegrityCheck = typeof dataIntegrityChecks.$inferSelect;
export type InsertDataIntegrityCheck = typeof dataIntegrityChecks.$inferInsert;

// ─── FLUXO DE APROVAÇÃO E WORKFLOWS ───────────────────────────────────────────
export const approvalWorkflows = mysqlTable("approval_workflows", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  steps: int("steps").default(1),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const approvalSteps = mysqlTable("approval_steps", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  approverRole: varchar("approverRole", { length: 100 }).notNull(),
  approverUserId: int("approverUserId"),
  description: text("description"),
  requiresComment: boolean("requiresComment").default(false),
  canReject: boolean("canReject").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const approvalRequests = mysqlTable("approval_requests", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId").notNull(),
  requestedBy: int("requestedBy").notNull(),
  currentStep: int("currentStep").default(1),
  status: mysqlEnum("status", [
    "Pendente",
    "Em Análise",
    "Aprovado",
    "Rejeitado",
    "Cancelado",
  ]).default("Pendente"),
  rejectionReason: text("rejectionReason"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const approvalHistory = mysqlTable("approval_history", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  approverUserId: int("approverUserId").notNull(),
  action: mysqlEnum("action", [
    "Aprovado",
    "Rejeitado",
    "Comentário",
    "Devolvido",
  ]).notNull(),
  comment: text("comment"),
  approvedAt: timestamp("approvedAt").defaultNow().notNull(),
});

// ─── DASHBOARDS E KPIs ────────────────────────────────────────────────────────
export const dashboards = mysqlTable("dashboards", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", [
    "Executivo",
    "Operacional",
    "Segurança",
    "Compliance",
    "Financeiro",
  ]).notNull(),
  layout: json("layout"),
  isPublic: boolean("isPublic").default(false),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const kpis = mysqlTable("kpis", {
  id: int("id").autoincrement().primaryKey(),
  dashboardId: int("dashboardId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  metric: varchar("metric", { length: 100 }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  target: decimal("target", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  status: mysqlEnum("status", ["Ótimo", "Bom", "Atenção", "Crítico"]).default(
    "Bom"
  ),
  trend: mysqlEnum("trend", ["Aumentando", "Estável", "Diminuindo"]).default(
    "Estável"
  ),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── BI E ANALYTICS ──────────────────────────────────────────────────────────
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  userId: int("userId"),
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const analyticsReports = mysqlTable("analytics_reports", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", [
    "Acidentes",
    "Treinamentos",
    "Conformidade",
    "Custos",
    "Indicadores",
  ]).notNull(),
  period: mysqlEnum("period", [
    "Diário",
    "Semanal",
    "Mensal",
    "Trimestral",
    "Anual",
  ]).notNull(),
  data: json("data"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── INTEGRAÇÃO COM SISTEMAS EXTERNOS ─────────────────────────────────────────
export const externalSystems = mysqlTable("external_systems", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["RH", "ERP", "eSocial", "Folha", "Outro"]).notNull(),
  endpoint: varchar("endpoint", { length: 500 }),
  apiKey: text("apiKey"),
  isActive: boolean("isActive").default(false),
  lastSync: timestamp("lastSync"),
  syncStatus: mysqlEnum("syncStatus", ["Sucesso", "Erro", "Pendente"]).default(
    "Pendente"
  ),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const syncLogs = mysqlTable("sync_logs", {
  id: int("id").autoincrement().primaryKey(),
  systemId: int("systemId").notNull(),
  syncType: varchar("syncType", { length: 100 }).notNull(),
  status: mysqlEnum("status", [
    "Iniciado",
    "Processando",
    "Sucesso",
    "Erro",
  ]).notNull(),
  recordsProcessed: int("recordsProcessed").default(0),
  recordsSuccessful: int("recordsSuccessful").default(0),
  recordsFailed: int("recordsFailed").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const syncMappings = mysqlTable("sync_mappings", {
  id: int("id").autoincrement().primaryKey(),
  systemId: int("systemId").notNull(),
  sourceField: varchar("sourceField", { length: 255 }).notNull(),
  targetField: varchar("targetField", { length: 255 }).notNull(),
  transformation: text("transformation"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── WEBHOOKS E NOTIFICAÇÕES ─────────────────────────────────────────────────
export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  event: varchar("event", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  isActive: boolean("isActive").default(true),
  retryCount: int("retryCount").default(0),
  lastTriggered: timestamp("lastTriggered"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const webhookLogs = mysqlTable("webhook_logs", {
  id: int("id").autoincrement().primaryKey(),
  webhookId: int("webhookId").notNull(),
  status: mysqlEnum("status", ["Enviado", "Falha", "Sucesso"]).notNull(),
  payload: json("payload"),
  response: text("response"),
  statusCode: int("statusCode"),
  triggeredAt: timestamp("triggeredAt").defaultNow().notNull(),
});

// ─── GHE AUDIT LOG ───────────────────────────────────────────────────────────
export const gheAuditLog = mysqlTable("ghe_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  gheId: int("gheId").notNull(),
  unitId: int("unitId").notNull(),
  action: mysqlEnum("action", ["CREATE", "UPDATE", "DELETE"]).notNull(),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  changes: json("changes"),
  oldValues: json("oldValues"),
  newValues: json("newValues"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ─── MULTI-TENANT & SUBSCRIPTIONS ─────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logo: varchar("logo", { length: 500 }),
  website: varchar("website", { length: 500 }),
  plan: mysqlEnum("plan", ["free", "pro", "enterprise"])
    .default("free")
    .notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive", "suspended"])
    .default("active")
    .notNull(),
  maxUsers: int("maxUsers").default(5),
  maxUnits: int("maxUnits").default(1),
  features: json("features"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tenantMembers = mysqlTable("tenant_members", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "manager", "user"])
    .default("user")
    .notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  joinedAt: timestamp("joinedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 255 }).notNull().unique(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  interval: mysqlEnum("interval", ["month", "year"]).default("month"),
  maxUsers: int("maxUsers").notNull(),
  maxUnits: int("maxUnits").notNull(),
  features: json("features"),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const subscriptionInvoices = mysqlTable("subscription_invoices", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 })
    .notNull()
    .unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: mysqlEnum("status", [
    "draft",
    "open",
    "paid",
    "void",
    "uncollectible",
  ]).default("draft"),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  issuedAt: timestamp("issuedAt"),
  dueAt: timestamp("dueAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SST DOCUMENTS (DOCUMENTOS DE SEGURANÇA E SAÚDE DO TRABALHO) ──────────────
export const sstDocuments = mysqlTable("sst_documents", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  type: mysqlEnum("type", [
    "PGR",
    "PCMSO",
    "LTCAT",
    "LTIP",
    "Ordem de Serviço",
    "Permissão de Trabalho",
    "APR",
    "ASO",
    "Ficha de Controle de EPI",
    "Avaliação Ergonômica Preliminar",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  author: varchar("author", { length: 255 }).notNull(),
  authorId: int("authorId").notNull(),
  status: mysqlEnum("status", [
    "Rascunho",
    "Aguardando Aprovação",
    "Aprovado",
    "Vigente",
    "Expirado",
    "Cancelado",
  ])
    .default("Rascunho")
    .notNull(),
  revision: varchar("revision", { length: 20 }).default("Rev. 01").notNull(),
  validFrom: date("validFrom"),
  validUntil: date("validUntil"),
  fileKey: varchar("fileKey", { length: 500 }),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileName: varchar("fileName", { length: 255 }),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  signature: text("signature"),
  signedBy: varchar("signedBy", { length: 255 }),
  signedById: int("signedById"),
  signedAt: timestamp("signedAt"),
  content: text("content"),
  metadata: json("metadata"),
  tags: json("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").notNull(),
  updatedBy: int("updatedBy"),
});

// ─── SST DOCUMENT VERSIONS (VERSIONAMENTO) ──────────────────────────────────
export const sstDocumentVersions = mysqlTable("sst_document_versions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  version: int("version").notNull(),
  revision: varchar("revision", { length: 20 }).notNull(),
  status: mysqlEnum("status", [
    "Rascunho",
    "Aguardando Aprovação",
    "Aprovado",
    "Vigente",
    "Expirado",
    "Cancelado",
  ]).notNull(),
  fileKey: varchar("fileKey", { length: 500 }),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  content: text("content"),
  changeNotes: text("changeNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
});

// ─── SST DOCUMENT APPROVALS (FLUXO DE APROVAÇÃO) ──────────────────────────────
export const sstDocumentApprovals = mysqlTable("sst_document_approvals", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  versionId: int("versionId"),
  approverRole: mysqlEnum("approverRole", [
    "Técnico de SST",
    "Gerente",
    "Diretor",
    "Médico do Trabalho",
    "Engenheiro de Segurança",
  ]).notNull(),
  approverName: varchar("approverName", { length: 255 }).notNull(),
  approverId: int("approverId").notNull(),
  status: mysqlEnum("status", [
    "Pendente",
    "Aprovado",
    "Rejeitado",
    "Revisão Solicitada",
  ])
    .default("Pendente")
    .notNull(),
  comments: text("comments"),
  approvedAt: timestamp("approvedAt"),
  signature: text("signature"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PGR (PROGRAMA DE GESTÃO DE RISCOS) ──────────────────────────────────────
export const pgrDocuments = mysqlTable("pgr_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  unitId: int("unitId").notNull(),
  inventoryOfRisks: text("inventoryOfRisks"),
  actionPlan: text("actionPlan"),
  responsibleTeam: varchar("responsibleTeam", { length: 500 }),
  implementationDeadline: date("implementationDeadline"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PCMSO (PROGRAMA DE CONTROLE MÉDICO E SAÚDE OCUPACIONAL) ─────────────────
export const pcmsoDocuments = mysqlTable("pcmso_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  unitId: int("unitId").notNull(),
  occupationalMedic: varchar("occupationalMedic", { length: 255 }).notNull(),
  occupationalMedicId: int("occupationalMedicId"),
  examsRequired: json("examsRequired"),
  riskFactorsIdentified: text("riskFactorsIdentified"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── LTCAT (LAUDO TÉCNICO DE CONDIÇÕES AMBIENTAIS DO TRABALHO) ────────────────
export const ltcatDocuments = mysqlTable("ltcat_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  unitId: int("unitId").notNull(),
  specialActivities: json("specialActivities"),
  exposureFactors: text("exposureFactors"),
  conclusionSpecialRetirement: boolean("conclusionSpecialRetirement").default(
    false
  ),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── LTIP (LAUDO TÉCNICO DE INSALUBRIDADE E PERICULOSIDADE) ──────────────────
export const ltipDocuments = mysqlTable("ltip_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  unitId: int("unitId").notNull(),
  insalubrityLevel: mysqlEnum("insalubrityLevel", [
    "Mínimo",
    "Médio",
    "Máximo",
    "Nenhum",
  ]).notNull(),
  insalubrityPercentage: decimal("insalubrityPercentage", {
    precision: 5,
    scale: 2,
  }),
  dangerLevel: mysqlEnum("dangerLevel", ["Presente", "Ausente"]).notNull(),
  dangerPercentage: decimal("dangerPercentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── ORDEM DE SERVIÇO ────────────────────────────────────────────────────────
export const workOrderDocuments = mysqlTable("work_order_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  unitId: int("unitId").notNull(),
  workDescription: text("workDescription").notNull(),
  responsibleEmployee: varchar("responsibleEmployee", {
    length: 255,
  }).notNull(),
  responsibleEmployeeId: int("responsibleEmployeeId"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  priority: mysqlEnum("priority", [
    "Baixa",
    "Média",
    "Alta",
    "Urgente",
  ]).default("Média"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PERMISSÃO DE TRABALHO (PT) ──────────────────────────────────────────────
export const workPermitDocuments = mysqlTable("work_permit_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  unitId: int("unitId").notNull(),
  workType: varchar("workType", { length: 255 }).notNull(),
  hazardsIdentified: text("hazardsIdentified"),
  controlMeasures: text("controlMeasures"),
  authorizedBy: varchar("authorizedBy", { length: 255 }).notNull(),
  authorizedById: int("authorizedById"),
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── APR (ANÁLISE PRELIMINAR DE RISCO) ───────────────────────────────────────
export const aprDocuments = mysqlTable("apr_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  unitId: int("unitId").notNull(),
  activityDescription: text("activityDescription").notNull(),
  hazardsIdentified: json("hazardsIdentified"),
  riskAssessment: json("riskAssessment"),
  recommendedActions: text("recommendedActions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── ASO (ATESTADO DE SAÚDE OCUPACIONAL) ────────────────────────────────────
export const asoDocuments = mysqlTable("aso_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  employeeId: int("employeeId").notNull(),
  occupationalMedic: varchar("occupationalMedic", { length: 255 }).notNull(),
  occupationalMedicId: int("occupationalMedicId"),
  examsPerformed: json("examsPerformed"),
  conclusion: mysqlEnum("conclusion", [
    "Apto",
    "Apto com Restrições",
    "Inapto",
    "Inapto Temporariamente",
  ]).notNull(),
  restrictionDetails: text("restrictionDetails"),
  examinationDate: date("examinationDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── FICHA DE CONTROLE DE EPI ───────────────────────────────────────────────
export const epiControlDocuments = mysqlTable("epi_control_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  employeeId: int("employeeId").notNull(),
  epiItems: json("epiItems"),
  deliveryDate: date("deliveryDate").notNull(),
  returnDate: date("returnDate"),
  condition: mysqlEnum("condition", [
    "Novo",
    "Usado",
    "Danificado",
    "Devolvido",
  ]).notNull(),
  employeeSignature: text("employeeSignature"),
  supervisorSignature: text("supervisorSignature"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── AVALIAÇÃO ERGONÔMICA PRELIMINAR ────────────────────────────────────────
export const ergonomicAssessmentDocuments = mysqlTable(
  "ergonomic_assessment_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").notNull(),
    unitId: int("unitId").notNull(),
    workstationDescription: text("workstationDescription"),
    postureAnalysis: text("postureAnalysis"),
    risksIdentified: json("risksIdentified"),
    recommendedImprovements: text("recommendedImprovements"),
    priorityLevel: mysqlEnum("priorityLevel", [
      "Baixa",
      "Média",
      "Alta",
      "Crítica",
    ]).default("Média"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

// ─── ENVIRONMENTAL ASSESSMENTS LINKED TO SST DOCUMENTS ─────────────
export const sstDocumentAssessmentLinks = mysqlTable(
  "sst_document_assessment_links",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").notNull(),
    assessmentId: int("assessmentId").notNull(),
    linkType: mysqlEnum("linkType", [
      "Fonte de Dados",
      "Referência",
      "Comprovação",
      "Histórico",
    ])
      .default("Fonte de Dados")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    createdBy: int("createdBy").notNull(),
  }
);

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type InsertApprovalWorkflow = typeof approvalWorkflows.$inferInsert;
export type ApprovalStep = typeof approvalSteps.$inferSelect;
export type InsertApprovalStep = typeof approvalSteps.$inferInsert;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = typeof approvalRequests.$inferInsert;
export type ApprovalHistory = typeof approvalHistory.$inferSelect;
export type InsertApprovalHistory = typeof approvalHistory.$inferInsert;
export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = typeof dashboards.$inferInsert;
export type Kpi = typeof kpis.$inferSelect;
export type InsertKpi = typeof kpis.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type AnalyticsReport = typeof analyticsReports.$inferSelect;
export type InsertAnalyticsReport = typeof analyticsReports.$inferInsert;
export type ExternalSystem = typeof externalSystems.$inferSelect;
export type InsertExternalSystem = typeof externalSystems.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;
export type SyncMapping = typeof syncMappings.$inferSelect;
export type InsertSyncMapping = typeof syncMappings.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;
