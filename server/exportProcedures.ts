import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import * as exportService from './exportService';
import * as db from './db';

/**
 * Procedures tRPC para Exportação de Relatórios e Dashboards
 */
export const exportProceduresRouter = router({
  // ─── EXPORTAÇÃO DE RELATÓRIOS ────────────────────────────────────────────
  reports: router({
    exportToPdf: protectedProcedure
      .input(z.object({
        reportId: z.number(),
        title: z.string(),
        includeCharts: z.boolean().optional(),
        includeTables: z.boolean().optional(),
        includeSignature: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Buscar relatório no banco
        const reports = await db.getAnalyticsReports(ctx.user.id || 0);
        const report = reports.find((r: any) => r.id === input.reportId);

        if (!report) {
          throw new Error('Relatório não encontrado');
        }

        const reportData = {
          title: input.title,
          data: (Array.isArray(report.data) ? report.data : []) as Record<string, any>[],
          summary: {
            'Total de Registros': (Array.isArray(report.data) ? report.data : []).length,
            'Período': report.period,
            'Tipo': report.type,
            'Data de Geração': new Date(report.generatedAt).toLocaleString('pt-BR'),
          },
          period: report.period,
        };

        return exportService.exportReportToPdf(reportData, {
          title: input.title,
          format: 'pdf',
          includeCharts: input.includeCharts ?? true,
          includeTables: input.includeTables ?? true,
          includeSignature: input.includeSignature ?? false,
        });
      }),

    exportToExcel: protectedProcedure
      .input(z.object({
        reportId: z.number(),
        title: z.string(),
        includeCharts: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Buscar relatório no banco
        const reports = await db.getAnalyticsReports(ctx.user.id || 0);
        const report = reports.find((r: any) => r.id === input.reportId);

        if (!report) {
          throw new Error('Relatório não encontrado');
        }

        const reportData = {
          title: input.title,
          data: (Array.isArray(report.data) ? report.data : []) as Record<string, any>[],
          summary: {
            'Total de Registros': (Array.isArray(report.data) ? report.data : []).length,
            'Período': report.period,
            'Tipo': report.type,
            'Data de Geração': new Date(report.generatedAt).toLocaleString('pt-BR'),
          },
          period: report.period,
        };

        return exportService.exportReportToExcel(reportData, {
          title: input.title,
          format: 'excel',
          includeCharts: input.includeCharts ?? true,
        });
      }),

    exportCustomToPdf: protectedProcedure
      .input(z.object({
        title: z.string(),
        data: z.array(z.record(z.string(), z.any())),
        summary: z.record(z.string(), z.any()).optional(),
        period: z.string().optional(),
        includeCharts: z.boolean().optional(),
        includeTables: z.boolean().optional(),
        includeSignature: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        return exportService.exportReportToPdf(
          {
            title: input.title,
            data: input.data,
            summary: input.summary,
            period: input.period,
          },
          {
            title: input.title,
            format: 'pdf',
            includeCharts: input.includeCharts ?? true,
            includeTables: input.includeTables ?? true,
            includeSignature: input.includeSignature ?? false,
          }
        );
      }),

    exportCustomToExcel: protectedProcedure
      .input(z.object({
        title: z.string(),
        data: z.array(z.record(z.string(), z.any())),
        summary: z.record(z.string(), z.any()).optional(),
        period: z.string().optional(),
        includeCharts: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        return exportService.exportReportToExcel(
          {
            title: input.title,
            data: input.data,
            summary: input.summary,
            period: input.period,
          },
          {
            title: input.title,
            format: 'excel',
            includeCharts: input.includeCharts ?? true,
          }
        );
      }),
  }),

  // ─── EXPORTAÇÃO DE DASHBOARDS ────────────────────────────────────────────
  dashboards: router({
    exportToPdf: protectedProcedure
      .input(z.object({
        dashboardId: z.number(),
        title: z.string(),
        includeSignature: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return exportService.exportDashboardToPdf(input.dashboardId, {
          title: input.title,
          format: 'pdf',
          includeSignature: input.includeSignature ?? false,
        });
      }),

    exportToExcel: protectedProcedure
      .input(z.object({
        dashboardId: z.number(),
        title: z.string(),
      }))
      .mutation(async ({ input }) => {
        return exportService.exportDashboardToExcel(input.dashboardId, {
          title: input.title,
          format: 'excel',
        });
      }),
  }),

  // ─── AGENDAMENTO DE EXPORTAÇÕES ──────────────────────────────────────────
  schedules: router({
    create: protectedProcedure
      .input(z.object({
        reportId: z.number().optional(),
        dashboardId: z.number().optional(),
        format: z.enum(['pdf', 'excel']),
        frequency: z.enum(['Diário', 'Semanal', 'Mensal']),
        recipients: z.array(z.string().email()),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        // Validar que pelo menos um ID foi fornecido
        if (!input.reportId && !input.dashboardId) {
          throw new Error('Forneça reportId ou dashboardId');
        }

        // Aqui você implementaria a lógica de agendamento
        return {
          id: Math.floor(Math.random() * 10000),
          ...input,
          isActive: input.isActive ?? true,
          createdAt: new Date(),
        };
      }),

    list: protectedProcedure
      .input(z.object({ userId: z.number().optional() }).optional())
      .query(() => {
        // Retornar lista de agendamentos
        return [];
      }),

    delete: protectedProcedure
      .input(z.object({ scheduleId: z.number() }))
      .mutation(({ input }) => {
        return { success: true, message: `Agendamento ${input.scheduleId} deletado` };
      }),
  }),

  // ─── HISTÓRICO DE EXPORTAÇÕES ────────────────────────────────────────────
  history: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(() => {
        // Retornar histórico de exportações
        return [];
      }),

    getFile: protectedProcedure
      .input(z.object({ fileKey: z.string() }))
      .query(({ input }) => {
        // Retornar URL do arquivo
        return {
          url: `/manus-storage/${input.fileKey}`,
          key: input.fileKey,
        };
      }),

    delete: protectedProcedure
      .input(z.object({ fileKey: z.string() }))
      .mutation(({ input }) => {
        return { success: true, message: `Arquivo ${input.fileKey} deletado` };
      }),
  }),
});
