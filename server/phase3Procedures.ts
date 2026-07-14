import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import * as db from './db';

/**
 * Procedures tRPC para Fase 3 - Fluxo de Aprovação, Dashboards e Integração
 */
export const phase3ProceduresRouter = router({
  // ─── FLUXO DE APROVAÇÃO ──────────────────────────────────────────────────
  approvals: router({
    workflows: router({
      list: protectedProcedure
        .input(z.object({ entityType: z.string().optional() }).optional())
        .query(({ input }) => db.getApprovalWorkflows(input?.entityType)),

      create: protectedProcedure
        .input(z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          entityType: z.string().min(1),
          steps: z.number().min(1),
        }))
        .mutation(({ input }) => db.createApprovalWorkflow(input as any)),
    }),

    steps: router({
      list: protectedProcedure
        .input(z.object({ workflowId: z.number() }))
        .query(({ input }) => db.getApprovalSteps(input.workflowId)),

      create: protectedProcedure
        .input(z.object({
          workflowId: z.number(),
          stepNumber: z.number().min(1),
          approverRole: z.string().min(1),
          approverUserId: z.number().optional(),
          description: z.string().optional(),
          requiresComment: z.boolean().optional(),
          canReject: z.boolean().optional(),
        }))
        .mutation(({ input }) => db.createApprovalStep(input as any)),
    }),

    requests: router({
      list: protectedProcedure
        .input(z.object({ workflowId: z.number().optional(), status: z.string().optional() }).optional())
        .query(({ input }) => db.getApprovalRequests(input?.workflowId, input?.status)),

      create: protectedProcedure
        .input(z.object({
          workflowId: z.number(),
          entityType: z.string().min(1),
          entityId: z.number(),
        }))
        .mutation(({ input, ctx }) => db.createApprovalRequest({
          ...input,
          requestedBy: ctx.user.id,
          status: 'Pendente',
        } as any)),

      approve: protectedProcedure
        .input(z.object({
          requestId: z.number(),
          stepNumber: z.number(),
          comment: z.string().optional(),
        }))
        .mutation(({ input, ctx }) => {
          return Promise.all([
            db.createApprovalHistory({
              requestId: input.requestId,
              stepNumber: input.stepNumber,
              approverUserId: ctx.user.id,
              action: 'Aprovado',
              comment: input.comment,
            } as any),
            db.updateApprovalRequest(input.requestId, {
              currentStep: input.stepNumber + 1,
              status: 'Em Análise',
            } as any),
          ]);
        }),

      reject: protectedProcedure
        .input(z.object({
          requestId: z.number(),
          stepNumber: z.number(),
          reason: z.string(),
          comment: z.string().optional(),
        }))
        .mutation(({ input, ctx }) => {
          return Promise.all([
            db.createApprovalHistory({
              requestId: input.requestId,
              stepNumber: input.stepNumber,
              approverUserId: ctx.user.id,
              action: 'Rejeitado',
              comment: input.comment,
            } as any),
            db.updateApprovalRequest(input.requestId, {
              status: 'Rejeitado',
              rejectionReason: input.reason,
            } as any),
          ]);
        }),
    }),
  }),

  // ─── DASHBOARDS ──────────────────────────────────────────────────────────
  dashboards: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) => db.getDashboards(input.unitId)),

    create: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['Executivo', 'Operacional', 'Segurança', 'Compliance', 'Financeiro']),
        layout: z.any().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(({ input, ctx }) => db.createDashboard({
        ...input,
        createdBy: ctx.user.id,
      } as any)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.any(),
      }))
      .mutation(({ input }) => db.updateDashboard(input.id, input.data)),

    kpis: router({
      list: protectedProcedure
        .input(z.object({ dashboardId: z.number() }))
        .query(({ input }) => db.getKpis(input.dashboardId)),

      create: protectedProcedure
        .input(z.object({
          dashboardId: z.number(),
          name: z.string().min(1),
          metric: z.string().min(1),
          value: z.number().optional(),
          target: z.number().optional(),
          unit: z.string().optional(),
          status: z.enum(['Ótimo', 'Bom', 'Atenção', 'Crítico']).optional(),
          trend: z.enum(['Aumentando', 'Estável', 'Diminuindo']).optional(),
        }))
        .mutation(({ input }) => db.createKpi(input as any)),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.any(),
        }))
        .mutation(({ input }) => db.updateKpi(input.id, input.data)),
    }),
  }),

  // ─── BI E ANALYTICS ──────────────────────────────────────────────────────
  analytics: router({
    events: router({
      list: protectedProcedure
        .input(z.object({ unitId: z.number(), eventType: z.string().optional() }).optional())
        .query(({ input }) => db.getAnalyticsEvents(input?.unitId || 0, input?.eventType)),

      track: protectedProcedure
        .input(z.object({
          unitId: z.number(),
          eventType: z.string(),
          entityType: z.string().optional(),
          entityId: z.number().optional(),
          metadata: z.any().optional(),
        }))
        .mutation(({ input, ctx }) => db.createAnalyticsEvent({
          ...input,
          userId: ctx.user.id,
        } as any)),
    }),

    reports: router({
      list: protectedProcedure
        .input(z.object({ unitId: z.number(), type: z.string().optional() }).optional())
        .query(({ input }) => db.getAnalyticsReports(input?.unitId || 0, input?.type)),

      generate: protectedProcedure
        .input(z.object({
          unitId: z.number(),
          name: z.string().min(1),
          type: z.enum(['Acidentes', 'Treinamentos', 'Conformidade', 'Custos', 'Indicadores']),
          period: z.enum(['Diário', 'Semanal', 'Mensal', 'Trimestral', 'Anual']),
          data: z.any(),
        }))
        .mutation(({ input }) => db.createAnalyticsReport(input as any)),
    }),
  }),

  // ─── INTEGRAÇÃO COM SISTEMAS EXTERNOS ─────────────────────────────────────
  integrations: router({
    systems: router({
      list: protectedProcedure
        .input(z.object({ unitId: z.number() }))
        .query(({ input }) => db.getExternalSystems(input.unitId)),

      create: protectedProcedure
        .input(z.object({
          unitId: z.number(),
          name: z.string().min(1),
          type: z.enum(['RH', 'ERP', 'eSocial', 'Folha', 'Outro']),
          endpoint: z.string().optional(),
          apiKey: z.string().optional(),
        }))
        .mutation(({ input }) => db.createExternalSystem({
          ...input,
          isActive: false,
        } as any)),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.any(),
        }))
        .mutation(({ input }) => db.updateExternalSystem(input.id, input.data)),

      sync: protectedProcedure
        .input(z.object({
          systemId: z.number(),
          syncType: z.string(),
        }))
        .mutation(({ input }) => {
          const startLog = {
            systemId: input.systemId,
            syncType: input.syncType,
            status: 'Iniciado' as const,
          };
          return db.createSyncLog(startLog as any);
        }),
    }),

    syncLogs: router({
      list: protectedProcedure
        .input(z.object({ systemId: z.number() }))
        .query(({ input }) => db.getSyncLogs(input.systemId)),
    }),

    mappings: router({
      list: protectedProcedure
        .input(z.object({ systemId: z.number() }))
        .query(({ input }) => db.getSyncMappings(input.systemId)),

      create: protectedProcedure
        .input(z.object({
          systemId: z.number(),
          sourceField: z.string().min(1),
          targetField: z.string().min(1),
          transformation: z.string().optional(),
        }))
        .mutation(({ input }) => db.createSyncMapping(input as any)),
    }),
  }),

  // ─── WEBHOOKS E NOTIFICAÇÕES ─────────────────────────────────────────────
  webhooks: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) => db.getWebhooks(input.unitId)),

    create: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        event: z.string().min(1),
        url: z.string().url(),
      }))
      .mutation(({ input }) => db.createWebhook({
        ...input,
        isActive: true,
      } as any)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.any(),
      }))
      .mutation(({ input }) => db.updateWebhook(input.id, input.data)),

    logs: router({
      list: protectedProcedure
        .input(z.object({ webhookId: z.number() }))
        .query(({ input }) => db.getWebhookLogs(input.webhookId)),
    }),
  }),
});
