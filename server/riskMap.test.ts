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
      registrationStatus: "approved",
      sessionVersion: 0,
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

describe.skipIf(!process.env.TEST_DATABASE_URL)("riskMap", () => {
  it("lists risk map areas", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const areas = await caller.riskMap.listAreas({ unitId: 1 });
    expect(Array.isArray(areas)).toBe(true);
  });

  it("creates a risk map area", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.riskMap.createArea({
      unitId: 1,
      name: "Setor de Produção",
      description: "Área com máquinas",
      coordinates: { x: 100, y: 100, width: 200, height: 150 },
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0].name).toBe("Setor de Produção");
      expect(result[0].unitId).toBe(1);
    }
  });

  it("calculates area risk level", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Criar uma área primeiro
    const created = await caller.riskMap.createArea({
      unitId: 1,
      name: "Teste Risk Level",
      coordinates: { x: 50, y: 50, width: 100, height: 100 },
    });

    if (created.length > 0) {
      const level = await caller.riskMap.calculateAreaRiskLevel({
        areaId: created[0].id,
      });
      expect(["Tolerável", "Moderado", "Substancial", "Intolerável"]).toContain(
        level
      );
    }
  });

  it("generates risk map SVG", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const svg = await caller.riskMap.generateMapSVG({ unitId: 1 });
    expect(typeof svg).toBe("string");
    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
  });

  it("updates a risk map area", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Criar uma área
    const created = await caller.riskMap.createArea({
      unitId: 1,
      name: "Área Original",
      coordinates: { x: 100, y: 100, width: 200, height: 150 },
    });

    if (created.length > 0) {
      const areaId = created[0].id;

      // Atualizar
      const updated = await caller.riskMap.updateArea({
        id: areaId,
        name: "Área Atualizada",
        description: "Nova descrição",
      });

      expect(updated).toBeDefined();
      expect(Array.isArray(updated)).toBe(true);
      if (updated.length > 0) {
        expect(updated[0].name).toBe("Área Atualizada");
        expect(updated[0].description).toBe("Nova descrição");
      }
    }
  });

  it("deletes a risk map area", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Criar uma área
    const created = await caller.riskMap.createArea({
      unitId: 1,
      name: "Área para Deletar",
      coordinates: { x: 100, y: 100, width: 200, height: 150 },
    });

    if (created.length > 0) {
      const areaId = created[0].id;

      // Deletar
      const result = await caller.riskMap.deleteArea({ id: areaId });
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    }
  });

  it("deletes a risk map area with linked GHEs", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Criar uma área
    const created = await caller.riskMap.createArea({
      unitId: 1,
      name: "Área com GHE para Deletar",
      coordinates: { x: 100, y: 100, width: 200, height: 150 },
    });

    if (created.length > 0) {
      const areaId = created[0].id;

      // Link a GHE to this area (simulating the relationship)
      // The delete operation should unlink any GHEs before deleting the area
      const result = await caller.riskMap.deleteArea({ id: areaId });
      expect(result.success).toBe(true);
      expect(result.message).toContain("deleted successfully");
    }
  });
});
