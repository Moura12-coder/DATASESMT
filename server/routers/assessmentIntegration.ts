/**
 * tRPC Router for Assessment Integration with SST Documents
 * Handles linking assessments and generating document data
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAssessmentsByUnit,
  getAssessmentsByAgentType,
  getAssessmentsByDateRange,
  getAssessmentsByStatus,
  linkAssessmentToDocument,
  unlinkAssessmentFromDocument,
  getLinkedAssessmentsForDocument,
  getDocumentsLinkedToAssessment,
  getAssessmentSummaryForDocument,
  generatePgrDataFromAssessments,
  generatePcmsoDataFromAssessments,
  generateLtcatDataFromAssessments,
  generateLtipDataFromAssessments,
} from "../assessmentIntegration";

// ─── VALIDATION SCHEMAS ──────────────────────────────────────────────────────

const LinkAssessmentSchema = z.object({
  documentId: z.number().positive(),
  assessmentId: z.number().positive(),
  linkType: z.enum(["Fonte de Dados", "Referência", "Comprovação", "Histórico"]),
  notes: z.string().optional(),
});

const UnlinkAssessmentSchema = z.object({
  documentId: z.number().positive(),
  assessmentId: z.number().positive(),
});

const GetAssessmentsByUnitSchema = z.object({
  unitId: z.number().positive(),
});

const GetAssessmentsByAgentTypeSchema = z.object({
  unitId: z.number().positive(),
  agentType: z.enum(["Químico", "Físico", "Biológico", "Ergonômico"]),
});

const GetAssessmentsByDateRangeSchema = z.object({
  unitId: z.number().positive(),
  startDate: z.date(),
  endDate: z.date(),
});

const GetAssessmentsByStatusSchema = z.object({
  unitId: z.number().positive(),
  status: z.enum(["Conforme", "Não Conforme", "Atenção"]),
});

// ─── ROUTER ──────────────────────────────────────────────────────────────────

export const assessmentIntegrationRouter = router({
  // Get all assessments for a unit
  getAssessmentsByUnit: protectedProcedure
    .input(GetAssessmentsByUnitSchema)
    .query(async ({ input }) => {
      try {
        const assessments = await getAssessmentsByUnit(input.unitId);
        return assessments;
      } catch (error) {
        console.error("[Assessment Integration] Get assessments error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao buscar avaliações",
        });
      }
    }),

  // Get assessments by agent type
  getAssessmentsByAgentType: protectedProcedure
    .input(GetAssessmentsByAgentTypeSchema)
    .query(async ({ input }) => {
      try {
        const assessments = await getAssessmentsByAgentType(
          input.unitId,
          input.agentType
        );
        return assessments;
      } catch (error) {
        console.error(
          "[Assessment Integration] Get assessments by type error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao buscar avaliações por tipo",
        });
      }
    }),

  // Get assessments by date range
  getAssessmentsByDateRange: protectedProcedure
    .input(GetAssessmentsByDateRangeSchema)
    .query(async ({ input }) => {
      try {
        const assessments = await getAssessmentsByDateRange(
          input.unitId,
          input.startDate,
          input.endDate
        );
        return assessments;
      } catch (error) {
        console.error(
          "[Assessment Integration] Get assessments by date range error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao buscar avaliações por período",
        });
      }
    }),

  // Get assessments by status
  getAssessmentsByStatus: protectedProcedure
    .input(GetAssessmentsByStatusSchema)
    .query(async ({ input }) => {
      try {
        const assessments = await getAssessmentsByStatus(
          input.unitId,
          input.status
        );
        return assessments;
      } catch (error) {
        console.error(
          "[Assessment Integration] Get assessments by status error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao buscar avaliações por status",
        });
      }
    }),

  // Link assessment to document
  linkAssessmentToDocument: protectedProcedure
    .input(LinkAssessmentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await linkAssessmentToDocument(
          input.documentId,
          input.assessmentId,
          input.linkType,
          input.notes,
          ctx.user.id
        );

        return {
          success: true,
          message: "Avaliação vinculada com sucesso",
        };
      } catch (error) {
        console.error(
          "[Assessment Integration] Link assessment error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao vincular avaliação",
        });
      }
    }),

  // Unlink assessment from document
  unlinkAssessmentFromDocument: protectedProcedure
    .input(UnlinkAssessmentSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await unlinkAssessmentFromDocument(
          input.documentId,
          input.assessmentId
        );

        return {
          success: true,
          message: "Avaliação desvinculada com sucesso",
        };
      } catch (error) {
        console.error(
          "[Assessment Integration] Unlink assessment error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao desvincullar avaliação",
        });
      }
    }),

  // Get linked assessments for document
  getLinkedAssessmentsForDocument: protectedProcedure
    .input(z.object({ documentId: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        const assessments = await getLinkedAssessmentsForDocument(
          input.documentId
        );
        return assessments;
      } catch (error) {
        console.error(
          "[Assessment Integration] Get linked assessments error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao buscar avaliações vinculadas",
        });
      }
    }),

  // Get documents linked to assessment
  getDocumentsLinkedToAssessment: protectedProcedure
    .input(z.object({ assessmentId: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        const documents = await getDocumentsLinkedToAssessment(
          input.assessmentId
        );
        return documents;
      } catch (error) {
        console.error(
          "[Assessment Integration] Get linked documents error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao buscar documentos vinculados",
        });
      }
    }),

  // Get assessment summary for document generation
  getAssessmentSummary: protectedProcedure
    .input(z.object({ unitId: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        const summary = await getAssessmentSummaryForDocument(input.unitId);
        return summary;
      } catch (error) {
        console.error(
          "[Assessment Integration] Get assessment summary error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao gerar resumo de avaliações",
        });
      }
    }),

  // Generate PGR data from assessments
  generatePgrData: protectedProcedure
    .input(z.object({ unitId: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        const pgrData = await generatePgrDataFromAssessments(input.unitId);
        return pgrData;
      } catch (error) {
        console.error(
          "[Assessment Integration] Generate PGR data error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao gerar dados do PGR",
        });
      }
    }),

  // Generate PCMSO data from assessments
  generatePcmsoData: protectedProcedure
    .input(z.object({ unitId: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        const pcmsoData = await generatePcmsoDataFromAssessments(input.unitId);
        return pcmsoData;
      } catch (error) {
        console.error(
          "[Assessment Integration] Generate PCMSO data error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao gerar dados do PCMSO",
        });
      }
    }),

  // Generate LTCAT data from assessments
  generateLtcatData: protectedProcedure
    .input(z.object({ unitId: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        const ltcatData = await generateLtcatDataFromAssessments(input.unitId);
        return ltcatData;
      } catch (error) {
        console.error(
          "[Assessment Integration] Generate LTCAT data error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao gerar dados do LTCAT",
        });
      }
    }),

  // Generate LTIP data from assessments
  generateLtipData: protectedProcedure
    .input(z.object({ unitId: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        const ltipData = await generateLtipDataFromAssessments(input.unitId);
        return ltipData;
      } catch (error) {
        console.error(
          "[Assessment Integration] Generate LTIP data error:",
          error
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao gerar dados do LTIP",
        });
      }
    }),
});
