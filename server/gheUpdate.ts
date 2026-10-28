import { getDb } from "./db";
import {
  ghe,
  gheExposureAgents,
  employeeGhe,
  employees,
} from "../drizzle/schema";
import { eq, and, like, or } from "drizzle-orm";
export async function getGHEById(gheId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [record] = await db
    .select()
    .from(ghe)
    .where(eq(ghe.id, gheId))
    .limit(1);
  if (!record) throw new Error(`GHE com ID ${gheId} não encontrado`);
  const agents = await db
    .select()
    .from(gheExposureAgents)
    .where(eq(gheExposureAgents.gheId, gheId));
  const members = await db
    .select({
      id: employeeGhe.id,
      startDate: employeeGhe.startDate,
      endDate: employeeGhe.endDate,
      employee: employees,
    })
    .from(employeeGhe)
    .innerJoin(employees, eq(employees.id, employeeGhe.employeeId))
    .where(eq(employeeGhe.gheId, gheId));
  return { ...record, exposureAgents: agents, employees: members };
}
export async function updateGHE(
  gheId: number,
  data: {
    code?: string;
    name?: string;
    description?: string;
    responsible?: string;
    location?: string;
    status?: "Ativo" | "Inativo" | "Em Revisão";
    notes?: string;
  }
) {
  if (data.code && data.code.trim().length < 3)
    throw new Error("Código deve ter no mínimo 3 caracteres");
  for (const key of ["name", "responsible", "location"] as const)
    if (data[key] !== undefined && !data[key]?.trim())
      throw new Error(`${key} não pode estar vazio`);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getGHEById(gheId);
  if (data.code && data.code !== existing.code) {
    const [duplicate] = await db
      .select({ id: ghe.id })
      .from(ghe)
      .where(and(eq(ghe.code, data.code), eq(ghe.unitId, existing.unitId)))
      .limit(1);
    if (duplicate)
      throw new Error(`Código ${data.code} já está em uso nesta unidade`);
  }
  await db
    .update(ghe)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(ghe.id, gheId));
  return getGHEById(gheId);
}
export async function listGHEsFiltered(
  unitId: number,
  filters?: { status?: "Ativo" | "Inativo" | "Em Revisão"; searchTerm?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(ghe.unitId, unitId)];
  if (filters?.status) conditions.push(eq(ghe.status, filters.status));
  if (filters?.searchTerm)
    conditions.push(
      or(
        like(ghe.code, `%${filters.searchTerm}%`),
        like(ghe.name, `%${filters.searchTerm}%`)
      )!
    );
  return db
    .select()
    .from(ghe)
    .where(and(...conditions))
    .orderBy(ghe.code);
}
export async function getGHEStats(gheId: number) {
  const data = await getGHEById(gheId);
  return {
    gheId,
    gheCode: data.code,
    gheName: data.name,
    agentsCount: data.exposureAgents.length,
    employeesCount: data.employees.filter(member => !member.endDate).length,
    status: data.status,
    lastUpdated: data.updatedAt,
  };
}
