import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as phase1 from "./phase1Features";

export const phase1Router = router({
  // ─── GESTÃO DE GHE ─────────────────────────────────────────────────────────
  ghe: router({
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          code: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional(),
          riskMapAreaId: z.number().optional(),
        })
      )
      .mutation(({ input }) => phase1.createGHE(input)),

    list: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) => phase1.listGHE(input.unitId)),

    addEmployee: protectedProcedure
      .input(
        z.object({
          employeeId: z.number(),
          gheId: z.number(),
          startDate: z.date(),
          endDate: z.date().optional(),
        })
      )
      .mutation(({ input }) => phase1.addEmployeeToGHE(input)),

    getEmployees: protectedProcedure
      .input(z.object({ gheId: z.number() }))
      .query(({ input }) => phase1.getEmployeesInGHE(input.gheId)),

    addExposureAgent: protectedProcedure
      .input(
        z.object({
          gheId: z.number(),
          agentType: z.enum([
            "Químico",
            "Físico",
            "Biológico",
            "Ergonômico",
            "Acidente",
          ]),
          agentName: z.string().min(1),
          riskLevel: z.enum([
            "Tolerável",
            "Moderado",
            "Substancial",
            "Intolerável",
          ]),
          limiteTolerance: z.number().optional(),
          unit: z.string().optional(),
        })
      )
      .mutation(({ input }) => phase1.addExposureAgent(input)),

    getExposureAgents: protectedProcedure
      .input(z.object({ gheId: z.number() }))
      .query(({ input }) => phase1.getExposureAgents(input.gheId)),

    update: protectedProcedure
      .input(z.object({
        gheId: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        responsible: z.string().optional(),
        status: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { gheId, ...data } = input;
        return phase1.updateGHE(gheId, data);
      }),

    delete: protectedProcedure
      .input(z.object({ gheId: z.number() }))
      .mutation(({ input }) => phase1.deleteGHE(input.gheId)),

    deleteExposureAgent: protectedProcedure
      .input(z.object({ agentId: z.number() }))
      .mutation(({ input }) => phase1.deleteExposureAgent(input.agentId)),

    getAuditLog: protectedProcedure
      .input(z.object({ gheId: z.number() }))
      .query(({ input }) => phase1.getGHEAuditLog(input.gheId)),
  }),

  // ─── MATRIZ DE COMPATIBILIDADE ─────────────────────────────────────────────
  compatibility: router({
    getEmployeeCompatibility: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(({ input }) => phase1.getEmployeeCompatibility(input.employeeId)),

    getMatrix: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) => phase1.getCompatibilityMatrix(input.unitId)),
  }),

  // ─── AVALIAÇÕES AMBIENTAIS (NR-09) ──────────────────────────────────────────
  environmentalAssessments: router({
    create: protectedProcedure
      .input(
        z.object({
          gheId: z.number(),
          agentType: z.string(),
          agentName: z.string(),
          measurementValue: z.number(),
          unit: z.string(),
          limiteTolerance: z.number(),
          date: z.date(),
          responsible: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        phase1.createEnvironmentalAssessment(input)
      ),

    generatePPRA: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) => phase1.generatePPRAReport(input.unitId)),
  }),

  // ─── GESTÃO DE LAUDOS ───────────────────────────────────────────────────────
  technicalReports: router({
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          type: z.enum([
            "LTCAT",
            "PPP",
            "Laudo Ambiental",
            "Laudo Ergonômico",
            "PPRA",
            "PGR",
          ]),
          title: z.string().min(1),
          author: z.string().min(1),
          validFrom: z.date(),
          validUntil: z.date().optional(),
          fileUrl: z.string().optional(),
        })
      )
      .mutation(({ input }) => phase1.createTechnicalReport(input)),

    approve: protectedProcedure
      .input(
        z.object({
          reportId: z.number(),
          approver: z.string(),
        })
      )
      .mutation(({ input }) =>
        phase1.approveTechnicalReport(input.reportId, input.approver)
      ),

    getHistory: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .query(({ input }) => phase1.getTechnicalReportHistory(input.reportId)),
  }),
});
