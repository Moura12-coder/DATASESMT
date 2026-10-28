import { normalizeWrite } from "./normalizeWrite";
import * as schema from "../drizzle/schema";
import { phase1CompleteRouter } from "./phase1CompleteRouters";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import * as emailAuth from "./emailAuth";
import * as riskMapDb from "./riskMap";
import * as riskMapRealtimeDb from "./riskMapRealtime";
import * as riskMapAdvancedDb from "./riskMapAdvanced";
import * as esocialRiskDb from "./esocialRiskIntegration";
import { phase1Router } from "./phase1Routers";
import { sstDocumentsRouter } from "./routers/sstDocuments";
import { assessmentIntegrationRouter } from "./routers/assessmentIntegration";
import { registrationRouter } from "./registrationProcedures";
import { rbacRouter } from "./rbacProcedures";
import { documentGenerationRouter } from "./documentGenerationProcedures";
import { analyticsRouter } from "./analyticsProcedures";
import { authProcedures } from "./authProcedures";
import { publicUser } from "./publicUser";

export const appRouter = router({
  phase1Complete: phase1CompleteRouter,
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => publicUser(opts.ctx.user)),
    logout: protectedProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, {
        ...cookieOptions,
        maxAge: -1,
        path: "/",
      });
      ctx.res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      return { success: true, message: "Logged out successfully" } as const;
    }),
    login: authProcedures.login,
    register: authProcedures.register,
    requestPasswordReset: authProcedures.requestPasswordReset,
    resetPassword: authProcedures.resetPassword,
  }),

  // ─── COMPANY UNITS ─────────────────────────────────────────────────────────
  units: router({
    list: protectedProcedure.query(() => db.getCompanyUnits()),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          cnpj: z.string().optional(),
          cnae: z.string().optional(),
          grauRisco: z.enum(["1", "2", "3", "4"]).optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createCompanyUnit(input)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              name: z.string().min(1),
              cnpj: z.string().optional(),
              cnae: z.string().optional(),
              grauRisco: z.enum(["1", "2", "3", "4"]).optional(),
              address: z.string().optional(),
              city: z.string().optional(),
              state: z.string().optional(),
              phone: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateCompanyUnit(
          input.id,
          normalizeWrite(schema.companyUnits, input.data)
        )
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteCompanyUnit(input.id)),
  }),

  // ─── SECTORS ───────────────────────────────────────────────────────────────
  sectors: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number().optional() }).optional())
      .query(({ input }) => db.getSectors(input?.unitId)),
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          name: z.string().min(1),
          responsible: z.string().optional(),
          riskLevel: z.enum(["Baixo", "Médio", "Alto", "Crítico"]).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createSector(input)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              unitId: z.number(),
              name: z.string().min(1),
              responsible: z.string().optional(),
              riskLevel: z
                .enum(["Baixo", "Médio", "Alto", "Crítico"])
                .optional(),
              description: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateSector(input.id, normalizeWrite(schema.sectors, input.data))
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteSector(input.id)),
  }),

  // ─── EMPLOYEES ─────────────────────────────────────────────────────────────
  employees: router({
    list: protectedProcedure
      .input(
        z
          .object({
            unitId: z.number().optional(),
            sectorId: z.number().optional(),
            status: z.string().optional(),
          })
          .optional()
      )
      .query(({ input }) =>
        db.getEmployees(input?.unitId, input?.sectorId, input?.status)
      ),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getEmployeeById(input.id)),
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          sectorId: z.number().optional(),
          name: z.string().min(1),
          cpf: z.string().optional(),
          rg: z.string().optional(),
          role: z.string().optional(),
          department: z.string().optional(),
          admissionDate: z.string().optional(),
          birthDate: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          status: z
            .enum(["Ativo", "Afastado", "Férias", "Desligado"])
            .optional(),
          esocialCategory: z.string().optional(),
          pis: z.string().optional(),
          ctps: z.string().optional(),
          bloodType: z.string().optional(),
          emergencyContact: z.string().optional(),
          emergencyPhone: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createEmployee(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              unitId: z.number(),
              sectorId: z.number().optional(),
              name: z.string().min(1),
              cpf: z.string().optional(),
              rg: z.string().optional(),
              role: z.string().optional(),
              department: z.string().optional(),
              admissionDate: z.string().optional(),
              birthDate: z.string().optional(),
              phone: z.string().optional(),
              email: z.string().optional(),
              status: z
                .enum(["Ativo", "Afastado", "Férias", "Desligado"])
                .optional(),
              esocialCategory: z.string().optional(),
              pis: z.string().optional(),
              ctps: z.string().optional(),
              bloodType: z.string().optional(),
              emergencyContact: z.string().optional(),
              emergencyPhone: z.string().optional(),
              notes: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateEmployee(
          input.id,
          normalizeWrite(schema.employees, input.data)
        )
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteEmployee(input.id)),
    leaves: router({
      list: protectedProcedure
        .input(z.object({ employeeId: z.number().optional() }).optional())
        .query(({ input }) => db.getLeaveOfAbsence(input?.employeeId)),
      create: protectedProcedure
        .input(
          z.object({
            employeeId: z.number(),
            type: z.enum([
              "Acidente Trabalho",
              "Doença Ocupacional",
              "Doença Comum",
              "Maternidade",
              "Outro",
            ]),
            startDate: z.string(),
            endDate: z.string().optional(),
            cid: z.string().optional(),
            catNumber: z.string().optional(),
            daysCount: z.number().optional(),
            notes: z.string().optional(),
          })
        )
        .mutation(({ input }) => db.createLeaveOfAbsence(input as any)),
    }),
  }),

  // ─── RISKS (PGR) ───────────────────────────────────────────────────────────
  risks: router({
    list: protectedProcedure
      .input(
        z
          .object({
            unitId: z.number().optional(),
            sectorId: z.number().optional(),
          })
          .optional()
      )
      .query(({ input }) => db.getRisks(input?.unitId, input?.sectorId)),
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          sectorId: z.number().optional(),
          type: z.enum([
            "Físico",
            "Químico",
            "Biológico",
            "Ergonômico",
            "Acidente",
            "Psicossocial",
          ]),
          description: z.string().min(1),
          source: z.string().optional(),
          ghe: z.string().optional(),
          probability: z.enum(["1", "2", "3", "4", "5"]).optional(),
          severity: z.enum(["1", "2", "3", "4", "5"]).optional(),
          riskLevel: z
            .enum(["Tolerável", "Moderado", "Substancial", "Intolerável"])
            .optional(),
          controlMeasures: z.string().optional(),
          existingControls: z.string().optional(),
          residualRisk: z
            .enum(["Tolerável", "Moderado", "Substancial", "Intolerável"])
            .optional(),
          responsible: z.string().optional(),
          deadline: z.string().optional(),
          status: z
            .enum(["Identificado", "Em Controle", "Controlado"])
            .optional(),
        })
      )
      .mutation(({ input }) => db.createRisk(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              unitId: z.number(),
              sectorId: z.number().optional(),
              type: z.enum([
                "Físico",
                "Químico",
                "Biológico",
                "Ergonômico",
                "Acidente",
                "Psicossocial",
              ]),
              description: z.string().min(1),
              source: z.string().optional(),
              ghe: z.string().optional(),
              probability: z.enum(["1", "2", "3", "4", "5"]).optional(),
              severity: z.enum(["1", "2", "3", "4", "5"]).optional(),
              riskLevel: z
                .enum(["Tolerável", "Moderado", "Substancial", "Intolerável"])
                .optional(),
              controlMeasures: z.string().optional(),
              existingControls: z.string().optional(),
              residualRisk: z
                .enum(["Tolerável", "Moderado", "Substancial", "Intolerável"])
                .optional(),
              responsible: z.string().optional(),
              deadline: z.string().optional(),
              status: z
                .enum(["Identificado", "Em Controle", "Controlado"])
                .optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateRisk(input.id, normalizeWrite(schema.risks, input.data))
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteRisk(input.id)),
  }),

  // ─── ACTION PLANS ──────────────────────────────────────────────────────────
  actionPlans: router({
    list: protectedProcedure
      .input(
        z
          .object({
            riskId: z.number().optional(),
            incidentId: z.number().optional(),
          })
          .optional()
      )
      .query(({ input }) =>
        db.getActionPlans(input?.riskId, input?.incidentId)
      ),
    create: protectedProcedure
      .input(
        z.object({
          riskId: z.number().optional(),
          incidentId: z.number().optional(),
          inspectionId: z.number().optional(),
          what: z.string().min(1),
          why: z.string().optional(),
          who: z.string().min(1),
          where: z.string().optional(),
          when: z.string(),
          howMuch: z.number().optional(),
          how: z.string().optional(),
          status: z
            .enum(["Pendente", "Em Andamento", "Concluída", "Cancelada"])
            .optional(),
          priority: z.enum(["Baixa", "Média", "Alta", "Crítica"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createActionPlan(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              riskId: z.number().optional(),
              incidentId: z.number().optional(),
              inspectionId: z.number().optional(),
              what: z.string().min(1),
              why: z.string().optional(),
              who: z.string().min(1),
              where: z.string().optional(),
              when: z.string(),
              howMuch: z.number().optional(),
              how: z.string().optional(),
              status: z
                .enum(["Pendente", "Em Andamento", "Concluída", "Cancelada"])
                .optional(),
              priority: z
                .enum(["Baixa", "Média", "Alta", "Crítica"])
                .optional(),
              notes: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateActionPlan(
          input.id,
          normalizeWrite(schema.actionPlans, input.data)
        )
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteActionPlan(input.id)),
  }),

  // ─── EXAMS (PCMSO) ─────────────────────────────────────────────────────────
  exams: router({
    list: protectedProcedure
      .input(z.object({ employeeId: z.number().optional() }).optional())
      .query(({ input }) => db.getExams(input?.employeeId)),
    expiring: protectedProcedure
      .input(z.object({ days: z.number().optional() }).optional())
      .query(({ input }) => db.getExpiringExams(input?.days)),
    create: protectedProcedure
      .input(
        z.object({
          employeeId: z.number(),
          type: z.enum([
            "Admissional",
            "Periódico",
            "Demissional",
            "Retorno ao Trabalho",
            "Mudança de Função",
          ]),
          examDate: z.string(),
          expirationDate: z.string().optional(),
          doctor: z.string().optional(),
          crm: z.string().optional(),
          result: z
            .enum([
              "Apto",
              "Apto com Restrições",
              "Inapto Temporário",
              "Inapto",
            ])
            .optional(),
          restrictions: z.string().optional(),
          status: z.enum(["Válido", "A Vencer", "Vencido"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createExam(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              employeeId: z.number(),
              type: z.enum([
                "Admissional",
                "Periódico",
                "Demissional",
                "Retorno ao Trabalho",
                "Mudança de Função",
              ]),
              examDate: z.string(),
              expirationDate: z.string().optional(),
              doctor: z.string().optional(),
              crm: z.string().optional(),
              result: z
                .enum([
                  "Apto",
                  "Apto com Restrições",
                  "Inapto Temporário",
                  "Inapto",
                ])
                .optional(),
              restrictions: z.string().optional(),
              status: z.enum(["Válido", "A Vencer", "Vencido"]).optional(),
              notes: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateExam(input.id, normalizeWrite(schema.exams, input.data))
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteExam(input.id)),
  }),

  // ─── EPI ───────────────────────────────────────────────────────────────────
  epi: router({
    list: protectedProcedure.query(() => db.getEpiItems()),
    lowStock: protectedProcedure.query(() => db.getLowStockEpis()),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          ca: z.string().optional(),
          caExpiration: z.string().optional(),
          manufacturer: z.string().optional(),
          type: z.string().optional(),
          stock: z.number().optional(),
          minStock: z.number().optional(),
          unitCost: z.number().optional(),
          unit: z.string().optional(),
          location: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createEpiItem(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              name: z.string().min(1),
              ca: z.string().optional(),
              caExpiration: z.string().optional(),
              manufacturer: z.string().optional(),
              type: z.string().optional(),
              stock: z.number().optional(),
              minStock: z.number().optional(),
              unitCost: z.number().optional(),
              unit: z.string().optional(),
              location: z.string().optional(),
              notes: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateEpiItem(input.id, normalizeWrite(schema.epiItems, input.data))
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteEpiItem(input.id)),
    deliveries: router({
      list: protectedProcedure
        .input(
          z
            .object({
              employeeId: z.number().optional(),
              epiId: z.number().optional(),
            })
            .optional()
        )
        .query(({ input }) =>
          db.getEpiDeliveries(input?.employeeId, input?.epiId)
        ),
      create: protectedProcedure
        .input(
          z.object({
            employeeId: z.number(),
            epiId: z.number(),
            quantity: z.number().min(1),
            deliveryDate: z.string(),
            returnDate: z.string().optional(),
            reason: z.string().optional(),
            notes: z.string().optional(),
          })
        )
        .mutation(({ input }) => db.createEpiDelivery(input as any)),
    }),
  }),

  // ─── TRAININGS ─────────────────────────────────────────────────────────────
  trainings: router({
    list: protectedProcedure.query(() => db.getTrainings()),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          nr: z.string().optional(),
          type: z
            .enum([
              "Integração",
              "Periódico",
              "Específico",
              "Reciclagem",
              "Outro",
            ])
            .optional(),
          instructor: z.string().optional(),
          workload: z.number().optional(),
          validityMonths: z.number().optional(),
          targetRoles: z.any().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createTraining(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              title: z.string().min(1),
              nr: z.string().optional(),
              type: z
                .enum([
                  "Integração",
                  "Periódico",
                  "Específico",
                  "Reciclagem",
                  "Outro",
                ])
                .optional(),
              instructor: z.string().optional(),
              workload: z.number().optional(),
              validityMonths: z.number().optional(),
              targetRoles: z.any().optional(),
              description: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateTraining(
          input.id,
          normalizeWrite(schema.trainings, input.data)
        )
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteTraining(input.id)),
    records: router({
      list: protectedProcedure
        .input(
          z
            .object({
              employeeId: z.number().optional(),
              trainingId: z.number().optional(),
            })
            .optional()
        )
        .query(({ input }) =>
          db.getTrainingRecords(input?.employeeId, input?.trainingId)
        ),
      create: protectedProcedure
        .input(
          z.object({
            trainingId: z.number(),
            employeeId: z.number(),
            completionDate: z.string(),
            expiryDate: z.string().optional(),
            status: z.enum(["Vigente", "A Vencer", "Vencido"]).optional(),
            score: z.number().optional(),
            notes: z.string().optional(),
          })
        )
        .mutation(({ input }) => db.createTrainingRecord(input as any)),
      update: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            data: z
              .object({
                trainingId: z.number(),
                employeeId: z.number(),
                completionDate: z.string(),
                expiryDate: z.string().optional(),
                status: z.enum(["Vigente", "A Vencer", "Vencido"]).optional(),
                score: z.number().optional(),
                notes: z.string().optional(),
              })
              .partial()
              .strict(),
          })
        )
        .mutation(({ input }) =>
          db.updateTrainingRecord(
            input.id,
            normalizeWrite(schema.trainingRecords, input.data)
          )
        ),
    }),
    expiring: protectedProcedure
      .input(z.object({ days: z.number().optional() }).optional())
      .query(({ input }) => db.getExpiredTrainings(input?.days)),
  }),

  // ─── INCIDENTS ─────────────────────────────────────────────────────────────
  incidents: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number().optional() }).optional())
      .query(({ input }) => db.getIncidents(input?.unitId)),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getIncidentById(input.id)),
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          sectorId: z.number().optional(),
          employeeId: z.number().optional(),
          type: z.enum([
            "Acidente com Afastamento",
            "Acidente sem Afastamento",
            "Quase Acidente",
            "Doença Ocupacional",
            "Incidente Perigoso",
          ]),
          date: z.string(),
          description: z.string().min(1),
          location: z.string().optional(),
          bodyPart: z.string().optional(),
          injuryType: z.string().optional(),
          daysLost: z.number().optional(),
          catNumber: z.string().optional(),
          catDate: z.string().optional(),
          investigationMethod: z
            .enum(["5 Porquês", "Árvore de Causas", "FMEA", "Outro"])
            .optional(),
          rootCauses: z.any().optional(),
          immediateActions: z.string().optional(),
          status: z
            .enum(["Aberto", "Em Investigação", "Aguardando Ação", "Encerrado"])
            .optional(),
        })
      )
      .mutation(({ input }) => db.createIncident(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              unitId: z.number(),
              sectorId: z.number().optional(),
              employeeId: z.number().optional(),
              type: z.enum([
                "Acidente com Afastamento",
                "Acidente sem Afastamento",
                "Quase Acidente",
                "Doença Ocupacional",
                "Incidente Perigoso",
              ]),
              date: z.string(),
              description: z.string().min(1),
              location: z.string().optional(),
              bodyPart: z.string().optional(),
              injuryType: z.string().optional(),
              daysLost: z.number().optional(),
              catNumber: z.string().optional(),
              catDate: z.string().optional(),
              investigationMethod: z
                .enum(["5 Porquês", "Árvore de Causas", "FMEA", "Outro"])
                .optional(),
              rootCauses: z.any().optional(),
              immediateActions: z.string().optional(),
              status: z
                .enum([
                  "Aberto",
                  "Em Investigação",
                  "Aguardando Ação",
                  "Encerrado",
                ])
                .optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateIncident(
          input.id,
          normalizeWrite(schema.incidents, input.data)
        )
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteIncident(input.id)),
  }),

  // ─── ESOCIAL ───────────────────────────────────────────────────────────────
  esocial: router({
    list: protectedProcedure
      .input(z.object({ code: z.string().optional() }).optional())
      .query(({ input }) => db.getEsocialEvents(input?.code)),
    create: protectedProcedure
      .input(
        z.object({
          code: z.enum(["S-2210", "S-2220", "S-2240", "S-2245"]),
          employeeId: z.number().optional(),
          referenceId: z.number().optional(),
          referenceType: z.string().optional(),
          eventDate: z.string(),
          status: z
            .enum(["Pendente", "Enviado", "Sucesso", "Erro", "Retificado"])
            .optional(),
          protocol: z.string().optional(),
          payload: z.any().optional(),
        })
      )
      .mutation(({ input }) => db.createEsocialEvent(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              code: z.enum(["S-2210", "S-2220", "S-2240", "S-2245"]),
              employeeId: z.number().optional(),
              referenceId: z.number().optional(),
              referenceType: z.string().optional(),
              eventDate: z.string(),
              status: z
                .enum(["Pendente", "Enviado", "Sucesso", "Erro", "Retificado"])
                .optional(),
              protocol: z.string().optional(),
              payload: z.any().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateEsocialEvent(
          input.id,
          normalizeWrite(schema.esocialEvents, input.data)
        )
      ),
  }),

  // ─── DOCUMENTS ─────────────────────────────────────────────────────────────
  documents: router({
    list: protectedProcedure
      .input(
        z
          .object({
            unitId: z.number().optional(),
            type: z.string().optional(),
          })
          .optional()
      )
      .query(({ input }) => db.getDocuments(input?.unitId, input?.type)),
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number().optional(),
          title: z.string().min(1),
          type: z.enum([
            "PGR",
            "PCMSO",
            "LTCAT",
            "PPP",
            "ASO",
            "CAT",
            "Laudo",
            "Certificado",
            "Procedimento",
            "Outro",
          ]),
          revision: z.string().optional(),
          status: z.enum(["Vigente", "Em Revisão", "Obsoleto"]).optional(),
          fileKey: z.string().optional(),
          fileUrl: z.string().optional(),
          fileName: z.string().optional(),
          fileSize: z.number().optional(),
          mimeType: z.string().optional(),
          validFrom: z.string().optional(),
          validUntil: z.string().optional(),
          author: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createDocument(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              unitId: z.number().optional(),
              title: z.string().min(1),
              type: z.enum([
                "PGR",
                "PCMSO",
                "LTCAT",
                "PPP",
                "ASO",
                "CAT",
                "Laudo",
                "Certificado",
                "Procedimento",
                "Outro",
              ]),
              revision: z.string().optional(),
              status: z.enum(["Vigente", "Em Revisão", "Obsoleto"]).optional(),
              fileKey: z.string().optional(),
              fileUrl: z.string().optional(),
              fileName: z.string().optional(),
              fileSize: z.number().optional(),
              mimeType: z.string().optional(),
              validFrom: z.string().optional(),
              validUntil: z.string().optional(),
              author: z.string().optional(),
              description: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateDocument(
          input.id,
          normalizeWrite(schema.documents, input.data)
        )
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteDocument(input.id)),
    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          mimeType: z.string(),
          base64: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `documents/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { key, url };
      }),
  }),

  // ─── INSPECTIONS ───────────────────────────────────────────────────────────
  inspections: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number().optional() }).optional())
      .query(({ input }) => db.getInspections(input?.unitId)),
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          sectorId: z.number().optional(),
          title: z.string().min(1),
          type: z
            .enum(["Rotina", "Especial", "Auditoria", "Pós-Acidente"])
            .optional(),
          inspector: z.string().optional(),
          inspectionDate: z.string(),
          nr: z.string().optional(),
          checklist: z.any().optional(),
          nonConformities: z.number().optional(),
          conformities: z.number().optional(),
          score: z.number().optional(),
          status: z.enum(["Agendada", "Em Andamento", "Concluída"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createInspection(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              unitId: z.number(),
              sectorId: z.number().optional(),
              title: z.string().min(1),
              type: z
                .enum(["Rotina", "Especial", "Auditoria", "Pós-Acidente"])
                .optional(),
              inspector: z.string().optional(),
              inspectionDate: z.string(),
              nr: z.string().optional(),
              checklist: z.any().optional(),
              nonConformities: z.number().optional(),
              conformities: z.number().optional(),
              score: z.number().optional(),
              status: z
                .enum(["Agendada", "Em Andamento", "Concluída"])
                .optional(),
              notes: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateInspection(
          input.id,
          normalizeWrite(schema.inspections, input.data)
        )
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteInspection(input.id)),
  }),

  // ─── CIPA ──────────────────────────────────────────────────────────────────
  cipa: router({
    members: router({
      list: protectedProcedure
        .input(z.object({ unitId: z.number().optional() }).optional())
        .query(({ input }) => db.getCipaMembers(input?.unitId)),
      create: protectedProcedure
        .input(
          z.object({
            unitId: z.number(),
            employeeId: z.number(),
            role: z.enum([
              "Presidente",
              "Vice-Presidente",
              "Secretário",
              "Membro Efetivo",
              "Membro Suplente",
            ]),
            origin: z.enum(["Eleito", "Indicado"]).optional(),
            mandateStart: z.string().optional(),
            mandateEnd: z.string().optional(),
            status: z.enum(["Ativo", "Inativo"]).optional(),
          })
        )
        .mutation(({ input }) => db.createCipaMember(input as any)),
      update: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            data: z
              .object({
                unitId: z.number(),
                employeeId: z.number(),
                role: z.enum([
                  "Presidente",
                  "Vice-Presidente",
                  "Secretário",
                  "Membro Efetivo",
                  "Membro Suplente",
                ]),
                origin: z.enum(["Eleito", "Indicado"]).optional(),
                mandateStart: z.string().optional(),
                mandateEnd: z.string().optional(),
                status: z.enum(["Ativo", "Inativo"]).optional(),
              })
              .partial()
              .strict(),
          })
        )
        .mutation(({ input }) =>
          db.updateCipaMember(
            input.id,
            normalizeWrite(schema.cipaMembers, input.data)
          )
        ),
      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => db.deleteCipaMember(input.id)),
    }),
    meetings: router({
      list: protectedProcedure
        .input(z.object({ unitId: z.number().optional() }).optional())
        .query(({ input }) => db.getCipaMeetings(input?.unitId)),
      create: protectedProcedure
        .input(
          z.object({
            unitId: z.number(),
            date: z.string(),
            type: z.enum(["Ordinária", "Extraordinária"]).optional(),
            agenda: z.string().optional(),
            minutes: z.string().optional(),
            status: z.enum(["Agendada", "Realizada", "Cancelada"]).optional(),
          })
        )
        .mutation(({ input }) => db.createCipaMeeting(input as any)),
      update: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            data: z
              .object({
                unitId: z.number(),
                date: z.string(),
                type: z.enum(["Ordinária", "Extraordinária"]).optional(),
                agenda: z.string().optional(),
                minutes: z.string().optional(),
                status: z
                  .enum(["Agendada", "Realizada", "Cancelada"])
                  .optional(),
              })
              .partial()
              .strict(),
          })
        )
        .mutation(({ input }) =>
          db.updateCipaMeeting(
            input.id,
            normalizeWrite(schema.cipaMeetings, input.data)
          )
        ),
    }),
  }),

  // ─── THIRD PARTIES ─────────────────────────────────────────────────────────
  thirdParties: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number().optional() }).optional())
      .query(({ input }) => db.getThirdParties(input?.unitId)),
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number().optional(),
          companyName: z.string().min(1),
          cnpj: z.string().optional(),
          contact: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          serviceType: z.string().optional(),
          contractStart: z.string().optional(),
          contractEnd: z.string().optional(),
          status: z.enum(["Ativo", "Inativo", "Suspenso"]).optional(),
          pgr: z.boolean().optional(),
          pcmso: z.boolean().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createThirdParty(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              unitId: z.number().optional(),
              companyName: z.string().min(1),
              cnpj: z.string().optional(),
              contact: z.string().optional(),
              phone: z.string().optional(),
              email: z.string().optional(),
              serviceType: z.string().optional(),
              contractStart: z.string().optional(),
              contractEnd: z.string().optional(),
              status: z.enum(["Ativo", "Inativo", "Suspenso"]).optional(),
              pgr: z.boolean().optional(),
              pcmso: z.boolean().optional(),
              notes: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateThirdParty(
          input.id,
          normalizeWrite(schema.thirdParties, input.data)
        )
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteThirdParty(input.id)),
  }),

  // ─── COSTS ─────────────────────────────────────────────────────────────────
  costs: router({
    list: protectedProcedure
      .input(z.object({ unitId: z.number().optional() }).optional())
      .query(({ input }) => db.getCosts(input?.unitId)),
    create: protectedProcedure
      .input(
        z.object({
          unitId: z.number().optional(),
          description: z.string().min(1),
          category: z.enum([
            "EPI",
            "Exame",
            "Treinamento",
            "Consultor",
            "Equipamento",
            "Outro",
          ]),
          value: z.number(),
          date: z.string(),
          status: z.enum(["Pago", "Pendente", "Cancelado"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createCost(input as any)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          data: z
            .object({
              unitId: z.number().optional(),
              description: z.string().min(1),
              category: z.enum([
                "EPI",
                "Exame",
                "Treinamento",
                "Consultor",
                "Equipamento",
                "Outro",
              ]),
              value: z.number(),
              date: z.string(),
              status: z.enum(["Pago", "Pendente", "Cancelado"]).optional(),
              notes: z.string().optional(),
            })
            .partial()
            .strict(),
        })
      )
      .mutation(({ input }) =>
        db.updateCost(input.id, normalizeWrite(schema.costs, input.data))
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteCost(input.id)),
  }),

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getNotifications(ctx.user.id)
    ),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input, ctx }) =>
        db.markNotificationRead(input.id, ctx.user.id)
      ),
    markAllRead: protectedProcedure.mutation(({ ctx }) =>
      db.markAllNotificationsRead(ctx.user.id)
    ),
  }),

  // ─── DASHBOARD ─────────────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure
      .input(z.object({ unitId: z.number().optional() }).optional())
      .query(({ input }) => db.getDashboardStats(input?.unitId)),
  }),

  // ─── AI ASSISTANT ──────────────────────────────────────────────────────────
  ai: router({
    chat: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1),
          context: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Save user message
        await db.saveAiMessage({
          userId: ctx.user.id,
          role: "user",
          content: input.message,
        });

        // Get chat history
        const history = await db.getAiChats(ctx.user.id);
        const messages = history
          .slice(-10)
          .map(h => ({
            role: h.role as "user" | "assistant",
            content: h.content,
          }));

        const systemPrompt = `Você é o Assistente IA do DataSESMT Pro, um sistema especializado em Saúde e Segurança do Trabalho (SST) brasileiro.
Você tem profundo conhecimento em:
- Normas Regulamentadoras (NRs) brasileiras, especialmente NR-01, NR-05, NR-06, NR-07, NR-09, NR-15, NR-17, NR-35
- eSocial SST (eventos S-2210, S-2220, S-2240, S-2245)
- PGR (Programa de Gerenciamento de Riscos)
- PCMSO (Programa de Controle Médico de Saúde Ocupacional)
- CIPA (Comissão Interna de Prevenção de Acidentes)
- Gestão de EPIs, treinamentos, incidentes e documentos SST
- Legislação trabalhista brasileira relacionada à SST
- Indicadores de segurança (Taxa de Frequência, Taxa de Gravidade, etc.)

Responda sempre em português brasileiro. Seja preciso, profissional e baseie suas respostas na legislação vigente.
${input.context ? `\nContexto atual do sistema: ${input.context}` : ""}`;

        const chatMsgs: Array<{
          role: "system" | "user" | "assistant";
          content: string;
        }> = [
          { role: "system", content: systemPrompt },
          ...messages,
          { role: "user", content: input.message },
        ];
        const response = await invokeLLM({ messages: chatMsgs });
        const rawContent = response.choices[0]?.message?.content;
        const assistantMessage =
          typeof rawContent === "string"
            ? rawContent
            : "Desculpe, não consegui processar sua solicitação.";
        // Save assistant message
        await db.saveAiMessage({
          userId: ctx.user.id,
          role: "assistant",
          content: assistantMessage,
        });
        return { message: assistantMessage };
      }),
    history: protectedProcedure.query(({ ctx }) => db.getAiChats(ctx.user.id)),
    clearHistory: protectedProcedure.mutation(({ ctx }) =>
      db.clearAiChats(ctx.user.id)
    ),
    ask: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1),
          context: z.string().optional(),
          history: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const systemPrompt = `Você é o Assistente IA do DataSESMT Pro, especializado em Saúde e Segurança do Trabalho (SST) brasileiro.
Conhecimentos: NRs (NR-01, NR-05, NR-06, NR-07, NR-09, NR-15, NR-17, NR-35), eSocial SST (S-2210, S-2220, S-2240, S-2245), PGR, PCMSO, CIPA, EPI, CAT, LTCAT, PPP, indicadores de segurança (TF, TG, dias sem acidente), legislação trabalhista brasileira.
Responda sempre em português brasileiro. Seja preciso, profissional e cite as NRs aplicáveis quando relevante.${input.context ? `\n\nContexto atual do sistema: ${input.context}` : ""}`;
        const msgs: Array<{
          role: "system" | "user" | "assistant";
          content: string;
        }> = [
          { role: "system", content: systemPrompt },
          ...(input.history || []).map(h => ({
            role: h.role as "user" | "assistant",
            content: h.content,
          })),
          { role: "user", content: input.message },
        ];
        const response = await invokeLLM({ messages: msgs });
        return {
          response:
            response.choices[0]?.message?.content ||
            "Desculpe, não consegui processar sua solicitação.",
        };
      }),
  }),

  riskMap: router({
    getUnitAlerts: protectedProcedure
      .input(
        z.object({
          unitId: z.number().int().positive(),
          limit: z.number().int().min(1).max(100).default(100),
        })
      )
      .query(({ input }) =>
        riskMapAdvancedDb.getUnitAlerts(input.unitId, input.limit)
      ),
    getAlertsBySeverity: protectedProcedure
      .input(
        z.object({
          unitId: z.number().int().positive(),
          severity: z.enum(["low", "medium", "high"]),
        })
      )
      .query(({ input }) =>
        riskMapAdvancedDb.getUnitAlerts(input.unitId, 100, input.severity)
      ),

    listAreas: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) => riskMapDb.getRiskMapAreas(input.unitId)),

    createArea: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          name: z.string().min(1),
          description: z.string().optional(),
          coordinates: z.object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number(),
          }),
        })
      )
      .mutation(({ input }) => riskMapDb.createRiskMapArea(input)),

    updateArea: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          coordinates: z
            .object({
              x: z.number(),
              y: z.number(),
              width: z.number(),
              height: z.number(),
            })
            .optional(),
        })
      )
      .mutation(({ input }) => riskMapDb.updateRiskMapArea(input.id, input)),

    deleteArea: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => riskMapDb.deleteRiskMapArea(input.id)),

    calculateAreaRiskLevel: protectedProcedure
      .input(z.object({ areaId: z.number() }))
      .query(({ input }) => riskMapDb.calculateAreaRiskLevel(input.areaId)),

    generateMapSVG: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) => riskMapDb.generateRiskMapSVG(input.unitId)),

    listAreasWithCircles: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) =>
        riskMapRealtimeDb.getRiskMapAreasWithCircles(input.unitId)
      ),

    linkGheToArea: protectedProcedure
      .input(z.object({ gheId: z.number(), areaId: z.number() }))
      .mutation(({ input }) =>
        riskMapRealtimeDb.linkGheToRiskMapArea(input.gheId, input.areaId)
      ),

    unlinkGheFromArea: protectedProcedure
      .input(z.object({ gheId: z.number() }))
      .mutation(({ input }) =>
        riskMapRealtimeDb.unlinkGheFromRiskMapArea(input.gheId)
      ),

    updateAreaPosition: protectedProcedure
      .input(z.object({ id: z.number(), x: z.number(), y: z.number() }))
      .mutation(({ input }) =>
        riskMapRealtimeDb.updateRiskMapAreaPosition(input.id, input.x, input.y)
      ),

    calculateGheRiskStats: protectedProcedure
      .input(z.object({ gheId: z.number() }))
      .query(({ input }) =>
        riskMapRealtimeDb.calculateGheRiskStatistics(input.gheId)
      ),

    generateRealtimeMapSVG: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) => riskMapRealtimeDb.generateRiskMapSVG(input.unitId)),

    // Advanced Features
    updatePositionWithHistory: protectedProcedure
      .input(z.object({ areaId: z.number(), x: z.number(), y: z.number() }))
      .mutation(({ input, ctx }) =>
        riskMapAdvancedDb.updateAreaPositionWithHistory(
          input.areaId,
          input.x,
          input.y,
          ctx.user.id
        )
      ),

    updateNameWithHistory: protectedProcedure
      .input(z.object({ areaId: z.number(), newName: z.string() }))
      .mutation(({ input, ctx }) =>
        riskMapAdvancedDb.updateAreaNameWithHistory(
          input.areaId,
          input.newName,
          ctx.user.id
        )
      ),

    generateRiskAnalysisReport: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          period1Start: z.date(),
          period1End: z.date(),
          period2Start: z.date(),
          period2End: z.date(),
        })
      )
      .query(({ input }) =>
        riskMapAdvancedDb.generateRiskAnalysisReport(
          input.unitId,
          input.period1Start,
          input.period1End,
          input.period2Start,
          input.period2End
        )
      ),

    getAreaChangeHistory: protectedProcedure
      .input(z.object({ areaId: z.number() }))
      .query(({ input }) =>
        riskMapAdvancedDb.getAreaChangeHistory(input.areaId)
      ),

    rollbackToVersion: protectedProcedure
      .input(z.object({ areaId: z.number(), versionId: z.number() }))
      .mutation(({ input, ctx }) =>
        riskMapAdvancedDb.rollbackToVersion(
          input.areaId,
          input.versionId,
          ctx.user.id
        )
      ),

    compareRiskMapPeriods: protectedProcedure
      .input(
        z.object({
          startDate1: z.date(),
          endDate1: z.date(),
          startDate2: z.date(),
          endDate2: z.date(),
        })
      )
      .query(({ input }) =>
        riskMapAdvancedDb.compareRiskMapPeriods(
          input.startDate1,
          input.endDate1,
          input.startDate2,
          input.endDate2
        )
      ),

    getRiskAlerts: protectedProcedure
      .input(z.object({ areaId: z.number().optional() }))
      .query(({ input }) => riskMapAdvancedDb.getRiskAlerts(input.areaId)),

    markAlertAsRead: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(({ input, ctx }) =>
        riskMapAdvancedDb.markAlertAsRead(input.alertId, ctx.user.id)
      ),

    // eSocial Risk Integration
    prepareRiskDataForESocial: protectedProcedure
      .input(
        z.object({ unitId: z.number(), startDate: z.date(), endDate: z.date() })
      )
      .query(({ input }) =>
        esocialRiskDb.prepareRiskDataForESocial(
          input.unitId,
          input.startDate,
          input.endDate
        )
      ),

    validateRiskDataForESocial: protectedProcedure
      .input(z.object({ data: z.any() }))
      .mutation(({ input }) =>
        esocialRiskDb.validateRiskDataForESocial(input.data)
      ),

    transmitRiskToESocial: protectedProcedure
      .input(z.object({ unitId: z.number(), riskData: z.any() }))
      .mutation(({ input }) =>
        esocialRiskDb.transmitRiskToESocial(input.riskData, input.unitId)
      ),

    getRiskTransmissionStatus: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(({ input }) =>
        esocialRiskDb.getRiskTransmissionStatus(input.unitId)
      ),

    retryFailedTransmissions: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .mutation(({ input }) =>
        esocialRiskDb.retryFailedTransmissions(input.unitId)
      ),

    generateESocialComplianceReport: protectedProcedure
      .input(
        z.object({
          unitId: z.number(),
          period: z.object({ start: z.date(), end: z.date() }),
        })
      )
      .query(({ input }) =>
        esocialRiskDb.generateESocialComplianceReport(
          input.unitId,
          input.period
        )
      ),

    exportRiskDataToESocialXML: protectedProcedure
      .input(z.object({ riskData: z.any() }))
      .mutation(({ input }) =>
        esocialRiskDb.exportRiskDataToESocialXML(input.riskData)
      ),
  }),
  sstDocuments: sstDocumentsRouter,
  assessmentIntegration: assessmentIntegrationRouter,
  registration: registrationRouter,
  rbac: rbacRouter,
  documentGeneration: documentGenerationRouter,
  analytics: analyticsRouter,
  phase1: phase1Router,
});
export type AppRouter = typeof appRouter;
