/**
 * Analytics Procedures
 * Handles compliance reporting and analytics
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

// ─── VALIDATION SCHEMAS ──────────────────────────────────────────────────────

const GetComplianceReportSchema = z.object({
  unitId: z.number().positive(),
  startDate: z.date(),
  endDate: z.date(),
});

const GetKPIsSchema = z.object({
  unitId: z.number().positive(),
});

const ExportReportSchema = z.object({
  reportId: z.string(),
  format: z.enum(["pdf", "excel", "csv"]),
});

// ─── PROCEDURES ──────────────────────────────────────────────────────────────

export const analyticsRouter = router({
  // Get compliance KPIs
  getComplianceKPIs: protectedProcedure
    .input(GetKPIsSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Mock data - in production, calculate from database
        return {
          complianceScore: 87.5,
          documentsCurrent: 12,
          documentsExpiring: 3,
          documentsExpired: 1,
          risksMitigated: 24,
          risksOpen: 8,
          incidentsThisMonth: 2,
          incidentsThisYear: 15,
          employeesTrainedThisMonth: 45,
          employeesTrainedThisYear: 280,
          lastUpdated: new Date(),
        };
      } catch (error) {
        console.error("Error getting compliance KPIs:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar KPIs de compliance",
        });
      }
    }),

  // Get compliance report for period
  getComplianceReport: protectedProcedure
    .input(GetComplianceReportSchema)
    .query(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores e gerentes podem acessar relatórios",
          });
        }

        const days = Math.ceil(
          (input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          reportId: `report_${input.unitId}_${Date.now()}`,
          period: {
            startDate: input.startDate,
            endDate: input.endDate,
            days,
          },
          complianceMetrics: {
            overall: 87.5,
            byNorm: {
              "NR-01": 95,
              "NR-05": 88,
              "NR-06": 92,
              "NR-07": 85,
              "NR-09": 78,
              "NR-12": 90,
              "NR-15": 88,
              "NR-17": 92,
              "NR-35": 85,
            },
          },
          incidents: {
            total: 3,
            byType: {
              "Acidente Leve": 2,
              "Acidente Grave": 1,
              "Quase-Acidente": 5,
            },
            trend: "decreasing",
          },
          documents: {
            current: 12,
            expiring: 3,
            expired: 1,
            pending_approval: 2,
          },
          risks: {
            total: 32,
            byLevel: {
              "Crítico": 2,
              "Alto": 6,
              "Médio": 12,
              "Baixo": 12,
            },
            mitigated: 24,
          },
          training: {
            completedThisPeriod: 45,
            pendingThisPeriod: 12,
            overdue: 3,
          },
          recommendations: [
            "Atualizar PGR conforme prazos regulatórios",
            "Revisar matriz de riscos para setor de produção",
            "Realizar treinamento de NR-35 para novos colaboradores",
            "Implementar medidas de controle para riscos críticos",
          ],
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error generating compliance report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar relatório de compliance",
        });
      }
    }),

  // Get compliance trend
  getComplianceTrend: protectedProcedure
    .input(z.object({ unitId: z.number().positive(), months: z.number().default(12) }))
    .query(async ({ input }) => {
      try {
        const data = [];
        for (let i = input.months - 1; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          data.push({
            month: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
            compliance: 75 + Math.random() * 20,
            incidents: Math.floor(Math.random() * 5),
            documents: Math.floor(10 + Math.random() * 5),
          });
        }
        return data;
      } catch (error) {
        console.error("Error getting compliance trend:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar tendência de compliance",
        });
      }
    }),

  // Get risk distribution
  getRiskDistribution: protectedProcedure
    .input(z.object({ unitId: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        return {
          byLevel: {
            "Crítico": 2,
            "Alto": 6,
            "Médio": 12,
            "Baixo": 12,
          },
          byArea: {
            "Produção": 15,
            "Administrativo": 8,
            "Logística": 10,
            "Manutenção": 7,
          },
          byType: {
            "Químico": 8,
            "Físico": 12,
            "Biológico": 4,
            "Ergonômico": 10,
            "Mecânico": 6,
          },
        };
      } catch (error) {
        console.error("Error getting risk distribution:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar distribuição de riscos",
        });
      }
    }),

  // Export report
  exportReport: protectedProcedure
    .input(ExportReportSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores e gerentes podem exportar relatórios",
          });
        }

        return {
          success: true,
          message: `Relatório exportado com sucesso em formato ${input.format.toUpperCase()}`,
          downloadUrl: `/reports/${input.reportId}.${input.format}`,
          fileName: `compliance_report_${new Date().getTime()}.${input.format}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error exporting report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao exportar relatório",
        });
      }
    }),

  // Get benchmark comparison
  getBenchmarkComparison: protectedProcedure
    .input(z.object({ unitId: z.number().positive(), sector: z.string().optional() }))
    .query(async ({ input }) => {
      try {
        return {
          yourCompany: {
            complianceScore: 87.5,
            incidentRate: 0.8,
            trainingCoverage: 92,
            documentCurrent: 94,
          },
          sectorBenchmark: {
            complianceScore: 82.3,
            incidentRate: 1.2,
            trainingCoverage: 85,
            documentCurrent: 88,
          },
          comparison: {
            complianceScore: "+5.2%",
            incidentRate: "-33%",
            trainingCoverage: "+7%",
            documentCurrent: "+6%",
          },
          ranking: "Top 15% do setor",
        };
      } catch (error) {
        console.error("Error getting benchmark comparison:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar comparação de benchmarks",
        });
      }
    }),
});
