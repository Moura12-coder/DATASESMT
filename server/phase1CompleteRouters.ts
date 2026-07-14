/**
 * Phase 1 Complete Routers - tRPC procedures para todas as 7 funcionalidades críticas
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as phase1 from "./phase1Complete";

export const phase1CompleteRouter = router({
  // ========================================================================
  // 1. GHE (Grupos Homogêneos de Exposição)
  // ========================================================================
  ghe: router({
    create: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        code: z.string(),
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await phase1.createGHE(input.unitId, input.code, input.name, input.description);
      }),

    list: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.listGHEByUnit(input.unitId);
      }),

    getWithAgents: protectedProcedure
      .input(z.object({ gheId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.getGHEWithExposureAgents(input.gheId);
      }),
  }),

  // ========================================================================
  // 2. AVALIAÇÕES AMBIENTAIS (NR-09)
  // ========================================================================
  environmentalAssessments: router({
    record: protectedProcedure
      .input(z.object({
        gheId: z.number(),
        agentType: z.string(),
        agentName: z.string(),
        measurementValue: z.number(),
        limiteTolerance: z.number(),
        unit: z.string(),
        date: z.date(),
      }))
      .mutation(async ({ input }) => {
        return await phase1.recordEnvironmentalAssessment(
          input.gheId,
          input.agentType,
          input.agentName,
          input.measurementValue,
          input.limiteTolerance,
          input.unit,
          input.date
        );
      }),

    getByGHE: protectedProcedure
      .input(z.object({ gheId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.getAssessmentsByGHE(input.gheId);
      }),

    generatePPRA: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.generatePPRAReport(input.unitId);
      }),
  }),

  // ========================================================================
  // 3. GESTÃO DE LAUDOS TÉCNICOS
  // ========================================================================
  technicalReports: router({
    create: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        type: z.enum(["LTCAT", "PPP", "PPRA", "PGR", "Laudo Ergonômico", "Laudo Ambiental"]),
        title: z.string(),
        author: z.string(),
        validFrom: z.date(),
        validUntil: z.date(),
      }))
      .mutation(async ({ input }) => {
        return await phase1.createTechnicalReport(
          input.unitId,
          input.type,
          input.title,
          input.author,
          input.validFrom,
          input.validUntil
        );
      }),

    approve: protectedProcedure
      .input(z.object({
        reportId: z.number(),
        approver: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await phase1.approveTechnicalReport(input.reportId, input.approver);
      }),

    getHistory: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.getTechnicalReportHistory(input.reportId);
      }),

    list: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.listTechnicalReportsByUnit(input.unitId);
      }),
  }),

  // ========================================================================
  // 4. MATRIZ DE COMPATIBILIDADE
  // ========================================================================
  compatibility: router({
    checkEmployee: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        sectorId: z.number(),
      }))
      .query(async ({ input }) => {
        return await phase1.checkEmployeeCompatibility(input.employeeId, input.sectorId);
      }),

    getMatrix: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.getEmployeeRiskMatrix(input.unitId);
      }),
  }),

  // ========================================================================
  // 5. GESTÃO DE AFASTAMENTOS
  // ========================================================================
  absences: router({
    record: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        type: z.enum(["CAT", "INSS", "Licença", "Suspensão"]),
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string(),
        catNumber: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await phase1.recordAbsence(
          input.employeeId,
          input.type,
          input.startDate,
          input.endDate,
          input.reason,
          input.catNumber
        );
      }),

    getByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.getAbsencesByEmployee(input.employeeId);
      }),

    calculateImpact: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await phase1.calculateAbsenceImpact(input.unitId, input.startDate, input.endDate);
      }),
  }),

  // ========================================================================
  // 6. RELATÓRIOS OBRIGATÓRIOS
  // ========================================================================
  reports: router({
    generatePGR: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.generatePGRReport(input.unitId);
      }),

    generatePCMSO: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.generatePCMSOReport(input.unitId);
      }),

    generatePPRA: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.generatePPRAReport2(input.unitId);
      }),

    generateAccidents: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await phase1.generateAccidentReport(input.unitId, input.startDate, input.endDate);
      }),

    generateTrainingCompliance: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.generateTrainingComplianceReport(input.unitId);
      }),
  }),

  // ========================================================================
  // 7. eSocial INTEGRAÇÃO
  // ========================================================================
  esocial: router({
    sendEvent: protectedProcedure
      .input(z.object({
        eventType: z.enum(["S-2210", "S-2220", "S-2240", "S-2245"]),
        unitId: z.number(),
        data: z.record(z.string(), z.unknown()),
      }))
      .mutation(async ({ input }) => {
        return await phase1.sendESocialEvent(input.eventType, input.unitId, input.data);
      }),

    getStatus: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.getESocialEventStatus(input.eventId);
      }),

    retry: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input }) => {
        return await phase1.retryESocialEvent(input.eventId);
      }),

    getHistory: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        return await phase1.getESocialTransmissionHistory(input.unitId);
      }),
  }),

  // ========================================================================
  // INDICADORES SST
  // ========================================================================
  indicators: router({
    calculate: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await phase1.calculateSSTIndicators(input.unitId, input.startDate, input.endDate);
      }),
  }),
});
