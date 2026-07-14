import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import * as db from './db';

/**
 * Procedures tRPC para Fase 2 - Funcionalidades Importantes
 */
export const phase2ProceduresRouter = router({
  // ─── PORTAL DO COLABORADOR ───────────────────────────────────────────────
  employeePortal: router({
    documents: router({
      list: protectedProcedure
        .input(z.object({ employeeId: z.number() }))
        .query(({ input }) => db.getEmployeeDocuments(input.employeeId)),

      create: protectedProcedure
        .input(z.object({
          employeeId: z.number(),
          documentType: z.enum(['Contrato', 'Exame', 'Treinamento', 'EPI', 'Laudo', 'Outro']),
          title: z.string().min(1),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
          issueDate: z.string().optional(),
          expiryDate: z.string().optional(),
          description: z.string().optional(),
        }))
        .mutation(({ input }) => db.createEmployeeDocument({
          ...input,
          issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
        } as any)),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.any(),
        }))
        .mutation(({ input }) => db.updateEmployeeDocument(input.id, input.data)),
    }),

    trainings: router({
      list: protectedProcedure
        .input(z.object({ employeeId: z.number() }))
        .query(({ input }) => db.getEmployeeTrainingAccess(input.employeeId)),

      enroll: protectedProcedure
        .input(z.object({
          employeeId: z.number(),
          trainingId: z.number(),
        }))
        .mutation(({ input }) => db.createEmployeeTrainingAccess({
          employeeId: input.employeeId,
          trainingId: input.trainingId,
          status: 'Pendente',
        } as any)),

      complete: protectedProcedure
        .input(z.object({
          id: z.number(),
          certificateUrl: z.string().optional(),
        }))
        .mutation(({ input }) => db.updateEmployeeTrainingAccess(input.id, {
          status: 'Concluído',
          completionDate: new Date(),
          certificateUrl: input.certificateUrl,
        } as any)),
    }),

    notifications: router({
      list: protectedProcedure
        .input(z.object({ employeeId: z.number() }))
        .query(({ input }) => db.getEmployeeNotifications(input.employeeId)),

      markAsRead: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => db.markEmployeeNotificationAsRead(input.id)),
    }),
  }),

  // ─── GESTÃO DE EPC ───────────────────────────────────────────────────────
  epc: router({
    items: router({
      list: protectedProcedure
        .input(z.object({ unitId: z.number().optional(), sectorId: z.number().optional() }).optional())
        .query(({ input }) => db.getEpcItems(input?.unitId, input?.sectorId)),

      create: protectedProcedure
        .input(z.object({
          unitId: z.number(),
          sectorId: z.number().optional(),
          name: z.string().min(1),
          type: z.enum(['Proteção Respiratória', 'Proteção Auditiva', 'Proteção Visual', 'Proteção de Extremidades', 'Proteção de Corpo', 'Proteção de Queda', 'Outro']),
          quantity: z.number().optional(),
          installationDate: z.string().optional(),
          maintenanceFrequency: z.string().optional(),
          responsible: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(({ input }) => db.createEpcItem({
          ...input,
          installationDate: input.installationDate ? new Date(input.installationDate) : undefined,
          status: 'Operacional',
        } as any)),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.any(),
        }))
        .mutation(({ input }) => db.updateEpcItem(input.id, input.data)),
    }),

    maintenance: router({
      list: protectedProcedure
        .input(z.object({ epcItemId: z.number() }))
        .query(({ input }) => db.getEpcMaintenanceRecords(input.epcItemId)),

      record: protectedProcedure
        .input(z.object({
          epcItemId: z.number(),
          maintenanceDate: z.string(),
          type: z.enum(['Inspeção', 'Limpeza', 'Reparo', 'Substituição', 'Teste']),
          responsible: z.string().optional(),
          notes: z.string().optional(),
          nextScheduledDate: z.string().optional(),
        }))
        .mutation(({ input }) => db.createEpcMaintenanceRecord({
          epcItemId: input.epcItemId,
          maintenanceDate: new Date(input.maintenanceDate),
          type: input.type,
          responsible: input.responsible,
          notes: input.notes,
          nextScheduledDate: input.nextScheduledDate ? new Date(input.nextScheduledDate) : undefined,
        } as any)),
    }),
  }),

  // ─── NÃO CONFORMIDADES ──────────────────────────────────────────────────
  nonConformities: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number().optional(), sectorId: z.number().optional(), status: z.string().optional() }).optional())
      .query(({ input }) => db.getNonConformities(input?.unitId, input?.sectorId, input?.status)),

    create: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        sectorId: z.number().optional(),
        type: z.enum(['NR Violada', 'Procedimento Inadequado', 'Equipamento Defeituoso', 'Falta de Treinamento', 'Outro']),
        severity: z.enum(['Baixa', 'Média', 'Alta', 'Crítica']),
        title: z.string().min(1),
        description: z.string().optional(),
        detectedDate: z.string(),
        detectedBy: z.string().optional(),
        dueDate: z.string().optional(),
      }))
      .mutation(({ input }) => db.createNonConformity({
        ...input,
        detectedDate: new Date(input.detectedDate),
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        status: 'Aberta',
      } as any)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.any(),
      }))
      .mutation(({ input }) => db.updateNonConformity(input.id, input.data)),

    actions: router({
      list: protectedProcedure
        .input(z.object({ nonConformityId: z.number() }))
        .query(({ input }) => db.getNonConformityActions(input.nonConformityId)),

      create: protectedProcedure
        .input(z.object({
          nonConformityId: z.number(),
          action: z.string().min(1),
          responsible: z.string().optional(),
          dueDate: z.string().optional(),
        }))
        .mutation(({ input }) => db.createNonConformityAction({
          nonConformityId: input.nonConformityId,
          action: input.action,
          responsible: input.responsible,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          status: 'Planejada',
        } as any)),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.any(),
        }))
        .mutation(({ input }) => db.updateNonConformityAction(input.id, input.data)),
    }),
  }),

  // ─── AUDITORIA E RASTREABILIDADE ────────────────────────────────────────
  audit: router({
    log: protectedProcedure
      .input(z.object({ userId: z.number().optional(), entityType: z.string().optional() }).optional())
      .query(({ input }) => db.getAuditLog(input?.userId, input?.entityType)),

    recordAction: protectedProcedure
      .input(z.object({
        action: z.string(),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        oldValue: z.string().optional(),
        newValue: z.string().optional(),
        ipAddress: z.string().optional(),
      }))
      .mutation(({ input, ctx }) => db.createAuditLog({
        userId: ctx.user.id,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValue: input.oldValue,
        newValue: input.newValue,
        ipAddress: input.ipAddress,
        status: 'Sucesso',
      } as any)),
  }),

  changeLog: router({
    list: protectedProcedure
      .input(z.object({ entityType: z.string().optional(), entityId: z.number().optional() }).optional())
      .query(({ input }) => db.getChangeLog(input?.entityType, input?.entityId)),

    record: protectedProcedure
      .input(z.object({
        entityType: z.string(),
        entityId: z.number(),
        changeType: z.enum(['Criação', 'Modificação', 'Exclusão', 'Aprovação', 'Rejeição']),
        oldValue: z.string().optional(),
        newValue: z.string().optional(),
        reason: z.string().optional(),
      }))
      .mutation(({ input, ctx }) => db.createChangeLog({
        entityType: input.entityType,
        entityId: input.entityId,
        changeType: input.changeType,
        changedBy: ctx.user.name || 'Sistema',
        oldValue: input.oldValue,
        newValue: input.newValue,
        reason: input.reason,
      } as any)),
  }),

  dataIntegrity: router({
    checks: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(({ input }) => db.getDataIntegrityChecks(input?.status)),

    recordCheck: protectedProcedure
      .input(z.object({
        checkType: z.string(),
        entityType: z.string().optional(),
        status: z.enum(['Passou', 'Falhou', 'Aviso']),
        description: z.string().optional(),
        affectedRecords: z.number().optional(),
      }))
      .mutation(({ input }) => db.createDataIntegrityCheck({
        checkType: input.checkType,
        entityType: input.entityType,
        status: input.status,
        description: input.description,
        affectedRecords: input.affectedRecords,
        correctionApplied: false,
      } as any)),
  }),
});
