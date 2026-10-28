import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
  companyUnits,
  documents,
  risks,
  incidents,
  sectors,
} from "../drizzle/schema";
import { getDb } from "./db";
const unitInput = z.object({ unitId: z.number().int().positive() });
const periodInput = unitInput
  .extend({ startDate: z.date(), endDate: z.date() })
  .refine(input => input.startDate <= input.endDate, {
    message: "Período inválido",
  });
async function loadUnit(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [unit] = await db
    .select()
    .from(companyUnits)
    .where(eq(companyUnits.id, unitId))
    .limit(1);
  if (!unit)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Unidade não encontrada",
    });
  const [docs, riskList, incidentList, sectorList] = await Promise.all([
    db.select().from(documents).where(eq(documents.unitId, unitId)),
    db.select().from(risks).where(eq(risks.unitId, unitId)),
    db.select().from(incidents).where(eq(incidents.unitId, unitId)),
    db.select().from(sectors).where(eq(sectors.unitId, unitId)),
  ]);
  return { unit, docs, riskList, incidentList, sectorList };
}
async function report(input: z.infer<typeof periodInput>) {
  const data = await loadUnit(input.unitId);
  const now = new Date();
  const expiring = new Date(now.getTime() + 30 * 86400000);
  const currentDocs = data.docs.filter(
    doc =>
      doc.status === "Vigente" && (!doc.validUntil || doc.validUntil >= now)
  );
  return {
    reportId: `report_${input.unitId}_${input.startDate.getTime()}_${input.endDate.getTime()}`,
    unit: data.unit.name,
    period: { start: input.startDate, end: input.endDate },
    generatedAt: now,
    documents: {
      total: data.docs.length,
      current: currentDocs.length,
      expired: data.docs.filter(doc => doc.validUntil && doc.validUntil < now)
        .length,
      expiring: currentDocs.filter(
        doc => doc.validUntil && doc.validUntil <= expiring
      ).length,
    },
    risks: {
      total: data.riskList.length,
      open: data.riskList.filter(risk => risk.status !== "Controlado").length,
      controlled: data.riskList.filter(risk => risk.status === "Controlado")
        .length,
    },
    incidentsInPeriod: data.incidentList.filter(
      incident =>
        incident.date >= input.startDate && incident.date <= input.endDate
    ).length,
    source: "database" as const,
  };
}
export const analyticsRouter = router({
  getComplianceKPIs: protectedProcedure
    .input(unitInput)
    .query(({ input }) =>
      report({
        ...input,
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(),
      })
    ),
  getComplianceReport: protectedProcedure
    .input(periodInput)
    .query(({ input }) => report(input)),
  getRiskDistribution: protectedProcedure
    .input(unitInput)
    .query(async ({ input }) => {
      const data = await loadUnit(input.unitId);
      const byLevel: Record<string, number> = {},
        byType: Record<string, number> = {},
        byArea: Record<string, number> = {};
      for (const risk of data.riskList) {
        const level = risk.riskLevel || "Não classificado";
        const area =
          data.sectorList.find(sector => sector.id === risk.sectorId)?.name ||
          "Sem setor";
        byLevel[level] = (byLevel[level] || 0) + 1;
        byType[risk.type] = (byType[risk.type] || 0) + 1;
        byArea[area] = (byArea[area] || 0) + 1;
      }
      return { byLevel, byType, byArea };
    }),
  getComplianceTrend: protectedProcedure
    .input(
      unitInput.extend({ months: z.number().int().min(1).max(24).default(12) })
    )
    .query(async ({ input }) => {
      const data = await loadUnit(input.unitId);
      return Array.from({ length: input.months }, (_, index) => {
        const start = new Date(
          new Date().getFullYear(),
          new Date().getMonth() - input.months + index + 1,
          1
        );
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        const rows = data.incidentList.filter(
          incident => incident.date >= start && incident.date < end
        );
        return {
          month: start.toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit",
          }),
          incidents: rows.length,
        };
      });
    }),
  getBenchmarkComparison: protectedProcedure
    .input(unitInput)
    .query(() => ({
      available: false,
      reason: "Nenhuma base externa de comparação foi configurada.",
    })),
  exportReport: protectedProcedure
    .input(periodInput)
    .mutation(async ({ input }) => {
      const data = await report(input);
      const rows = [
        ["Unidade", data.unit],
        ["Início", input.startDate.toISOString()],
        ["Fim", input.endDate.toISOString()],
        ["Documentos", data.documents.total],
        ["Documentos vigentes", data.documents.current],
        ["Documentos vencidos", data.documents.expired],
        ["Riscos", data.risks.total],
        ["Riscos em aberto", data.risks.open],
        ["Incidentes no período", data.incidentsInPeriod],
      ];
      const cell = (value: unknown) =>
        `"${String(value)
          .replace(/^[=+@-]/, "'$&")
          .replaceAll('"', '""')}"`;
      return {
        content:
          "\uFEFF" + rows.map(row => row.map(cell).join(";")).join("\r\n"),
        fileName: `datasesmt-unidade-${input.unitId}.csv`,
      };
    }),
});
