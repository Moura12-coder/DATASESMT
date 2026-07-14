import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Phase 1 - Funcionalidades Críticas", () => {
  // ─── GESTÃO DE GHE ─────────────────────────────────────────────────────────
  describe("GHE (Grupos Homogêneos de Exposição)", () => {
    it("creates a GHE", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const uniqueCode = `GHE-${Date.now()}`;
      const result = await caller.phase1.ghe.create({
        unitId: 1,
        code: uniqueCode,
        name: "Setor de Soldagem",
        description: "Soldadores e auxiliares",
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].code).toBe(uniqueCode);
        expect(result[0].name).toBe("Setor de Soldagem");
      }
    });

    it("lists GHEs", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.phase1.ghe.list({ unitId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("adds exposure agent to GHE", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Criar GHE primeiro
      const ghe = await caller.phase1.ghe.create({
        unitId: 1,
        code: `GHE-${Date.now()}`,
        name: "Setor Químico",
      });

      if (ghe.length > 0) {
        const result = await caller.phase1.ghe.addExposureAgent({
          gheId: ghe[0].id,
          agentType: "Químico",
          agentName: "Solvente Orgânico",
          riskLevel: "Substancial",
          limiteTolerance: 50,
          unit: "ppm",
        });

        expect(result.success).toBe(true);
      }
    });
  });

  // ─── MATRIZ DE COMPATIBILIDADE ─────────────────────────────────────────────
  describe("Matriz de Compatibilidade", () => {
    it("gets employee compatibility", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.phase1.compatibility.getEmployeeCompatibility({
        employeeId: 1,
      });

      if (result) {
        expect(result).toHaveProperty("employee");
        expect(result).toHaveProperty("compatibility");
        expect(result.compatibility).toHaveProperty("trained");
        expect(result.compatibility).toHaveProperty("examsUpToDate");
        expect(result.compatibility).toHaveProperty("episAvailable");
        expect(result.compatibility).toHaveProperty("isApt");
      }
    });

    it("gets compatibility matrix for unit", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.phase1.compatibility.getMatrix({
        unitId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── AVALIAÇÕES AMBIENTAIS ─────────────────────────────────────────────────
  describe("Avaliações Ambientais (NR-09)", () => {
    it("creates environmental assessment", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.phase1.environmentalAssessments.create({
        gheId: 1,
        agentType: "Químico",
        agentName: "Benzeno",
        measurementValue: 0.5,
        unit: "ppm",
        limiteTolerance: 1.0,
        date: new Date(),
        responsible: "Engenheiro SST",
        notes: "Medição em área de produção",
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("Conforme");
    });

    it("generates PPRA report", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.phase1.environmentalAssessments.generatePPRA({
        unitId: 1,
      });

      expect(result).toBeDefined();
      expect(result?.unitId).toBe(1);
      expect(result?.status).toBe("Vigente");
    });
  });

  // ─── GESTÃO DE LAUDOS ───────────────────────────────────────────────────────
  describe("Gestão de Laudos Técnicos", () => {
    it("creates technical report", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.phase1.technicalReports.create({
        unitId: 1,
        type: "LTCAT",
        title: "Laudo Técnico de Condições Ambientais do Trabalho",
        author: "Engenheiro SST",
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      expect(result).toBeDefined();
      expect(result.type).toBe("LTCAT");
      expect(result.status).toBe("Rascunho");
      expect(result.revision).toBe(1);
    });

    it("approves technical report", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.phase1.technicalReports.approve({
        reportId: 1,
        approver: "Gerente de SST",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("Aprovado");
    });

    it("gets technical report history", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.phase1.technicalReports.getHistory({
        reportId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
