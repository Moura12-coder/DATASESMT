import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import * as db from './db';
import * as pdfGen from './pdfGenerator';
import * as digitalSig from './digitalSignature';
import * as esocial from './esocialIntegration';

/**
 * Procedures tRPC para Fase 1 - Funcionalidades Críticas
 */
// Verificar schema.ts para tipos corretos
export const phase1ProceduresRouter = router({
  // ─── ENVIRONMENTAL ASSESSMENTS ───────────────────────────────────────────
  environmentalAssessments: router({
    list: protectedProcedure
      .input(z.object({ gheId: z.number().optional(), unitId: z.number().optional() }).optional())
      .query(({ input }) => db.getEnvironmentalAssessments(input?.gheId, input?.unitId)),

    create: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        gheId: z.number(),
        agentType: z.enum(['Químico', 'Físico', 'Biológico', 'Ergonômico']),
        agentName: z.string().min(1),
        measurementValue: z.number(),
        unit: z.string().optional(),
        limiteTolerance: z.number().optional(),
        date: z.string(),
        responsible: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const status = input.limiteTolerance && input.measurementValue > input.limiteTolerance ? 'Não Conforme' : 'Conforme';
        return db.createEnvironmentalAssessment({
          unitId: input.unitId,
          gheId: input.gheId,
          agentType: input.agentType,
          agentName: input.agentName,
          measurementValue: input.measurementValue.toString(),
          unit: input.unit,
          limiteTolerance: input.limiteTolerance?.toString(),
          date: new Date(input.date),
          responsible: input.responsible,
          notes: input.notes,
          status: status as any,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.any(),
      }))
      .mutation(({ input }) => db.updateEnvironmentalAssessment(input.id, input.data)),
  }),

  // ─── TECHNICAL REPORTS ──────────────────────────────────────────────────
  technicalReports: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number().optional(), type: z.string().optional() }).optional())
      .query(({ input }) => db.getTechnicalReports(input?.unitId, input?.type)),

    create: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        type: z.enum(['LTCAT', 'PPP', 'Laudo Ambiental', 'Laudo Ergonômico']),
        title: z.string().min(1),
        author: z.string().min(1),
        validFrom: z.string(),
        validUntil: z.string(),
        content: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createTechnicalReport({
          unitId: input.unitId,
          type: input.type,
          title: input.title,
          author: input.author,
          status: 'Rascunho',
          validFrom: new Date(input.validFrom),
          validUntil: new Date(input.validUntil),
          content: input.content,
        });
      }),

    approve: protectedProcedure
      .input(z.object({
        id: z.number(),
        approverName: z.string(),
        approverRole: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const report = await db.getTechnicalReports();
        const current = report.find(r => r.id === input.id);

        if (!current) throw new Error('Relatório não encontrado');

        // Cria histórico de versão
        const history = await db.getTechnicalReportHistory(input.id);
        const version = history.length + 1;

        await db.createTechnicalReportHistory({
          reportId: input.id,
          version,
          status: 'Aprovado',
          approver: input.approverName,
          approvedAt: new Date(),
          notes: input.notes,
        });

        // Atualiza status do relatório
        return db.updateTechnicalReport(input.id, {
          status: 'Vigente',
          signedBy: input.approverName,
          signedAt: new Date(),
        });
      }),

    getHistory: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .query(({ input }) => db.getTechnicalReportHistory(input.reportId)),
  }),

  // ─── PDF REPORTS ────────────────────────────────────────────────────────
  pdfReports: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number().optional(), type: z.string().optional() }).optional())
      .query(({ input }) => db.getPdfReports(input?.unitId, input?.type)),

    generateAccidentReport: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        signerName: z.string(),
        signerRole: z.string(),
      }))
      .mutation(async ({ input }) => {
        const content = await pdfGen.generateAccidentReport(
          input.unitId,
          new Date(input.startDate),
          new Date(input.endDate)
        );

        const signature = digitalSig.createDigitalSignature(
          content,
          input.signerName,
          input.signerRole
        );

        const signedContent = content + digitalSig.formatSignatureBlock(signature);

        const report = await db.createPdfReport({
          unitId: input.unitId,
          type: 'Acidentes',
          title: `Relatório de Acidentes - ${new Date().getFullYear()}`,
          signature: JSON.stringify(signature),
          signedBy: input.signerName,
          signedAt: new Date(),
        });

        return {
          id: report,
          content: signedContent,
          signature,
        };
      }),

    generatePCMSOReport: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        signerName: z.string(),
        signerRole: z.string(),
      }))
      .mutation(async ({ input }) => {
        const content = await pdfGen.generatePCMSOReport(input.unitId);
        const signature = digitalSig.createDigitalSignature(content, input.signerName, input.signerRole);
        const signedContent = content + digitalSig.formatSignatureBlock(signature);

        await db.createPdfReport({
          unitId: input.unitId,
          type: 'PCMSO',
          title: `Relatório PCMSO - ${new Date().getFullYear()}`,
          signature: JSON.stringify(signature),
          signedBy: input.signerName,
          signedAt: new Date(),
        });

        return { content: signedContent, signature };
      }),

    generatePPRAReport: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        signerName: z.string(),
        signerRole: z.string(),
      }))
      .mutation(async ({ input }) => {
        const content = await pdfGen.generatePPRAReport(input.unitId);
        const signature = digitalSig.createDigitalSignature(content, input.signerName, input.signerRole);
        const signedContent = content + digitalSig.formatSignatureBlock(signature);

        await db.createPdfReport({
          unitId: input.unitId,
          type: 'PPRA',
          title: `Relatório PPRA - ${new Date().getFullYear()}`,
          signature: JSON.stringify(signature),
          signedBy: input.signerName,
          signedAt: new Date(),
        });

        return { content: signedContent, signature };
      }),

    generatePGRReport: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        signerName: z.string(),
        signerRole: z.string(),
      }))
      .mutation(async ({ input }) => {
        const content = await pdfGen.generatePGRReport(input.unitId);
        const signature = digitalSig.createDigitalSignature(content, input.signerName, input.signerRole);
        const signedContent = content + digitalSig.formatSignatureBlock(signature);

        await db.createPdfReport({
          unitId: input.unitId,
          type: 'PGR',
          title: `Relatório PGR - ${new Date().getFullYear()}`,
          signature: JSON.stringify(signature),
          signedBy: input.signerName,
          signedAt: new Date(),
        });

        return { content: signedContent, signature };
      }),
  }),

  // ─── ESOCIAL S-2230 ─────────────────────────────────────────────────────
  esocialS2230: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number().optional(), employeeId: z.number().optional() }).optional())
      .query(({ input }) => db.getEsocialS2230(input?.unitId, input?.employeeId)),

    sendAbsence: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        employeeId: z.number(),
        absenceId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return esocial.processAbsenceAndSendToESocial(
          input.unitId,
          input.employeeId,
          input.absenceId
        );
      }),

    checkStatus: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        absenceId: z.number(),
      }))
      .query(({ input }) => esocial.checkS2230Status(input.unitId, input.absenceId)),

    complianceReport: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) => esocial.generateESocialComplianceReport(input.unitId)),
  }),
});
