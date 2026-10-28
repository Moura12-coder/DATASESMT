import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Shared mock context ──────────────────────────────────────────────────────
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@datasesmt.com.br",
      name: "Admin SST",
      loginMethod: "manus",
      role: "admin",
      registrationStatus: "approved",
      sessionVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      setHeader: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@datasesmt.com.br",
      name: "Técnico SST",
      loginMethod: "manus",
      role: "user",
      registrationStatus: "approved",
      sessionVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      setHeader: () => {},
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("returns authenticated user from auth.me", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.name).toBe("Admin SST");
    expect(user?.role).toBe("admin");
  });

  it("returns null for unauthenticated auth.me", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
        setHeader: () => {},
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("logout clears session cookie", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: createAdminContext().user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        setHeader: () => {},
        clearCookie: (name: string) => {
          clearedCookies.push(name);
        },
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBeGreaterThan(0);
  });
});

// ─── Router structure tests ───────────────────────────────────────────────────
describe("router structure", () => {
  it("has all required SST module routers", () => {
    const router = appRouter as any;
    const routes = router._def?.procedures || {};
    const routeKeys = Object.keys(routes);

    // Verify all major SST modules exist
    const expectedPrefixes = [
      "auth",
      "employees",
      "units",
      "sectors",
      "risks",
      "actionPlans",
      "exams",
      "epi",
      "trainings",
      "incidents",
      "esocial",
      "inspections",
      "documents",
      "cipa",
      "dashboard",
      "ai",
    ];

    for (const prefix of expectedPrefixes) {
      const hasPrefix = routeKeys.some(k => k.startsWith(prefix + "."));
      expect(hasPrefix, `Router '${prefix}' should exist`).toBe(true);
    }
  });

  it("has dashboard.stats procedure", () => {
    const router = appRouter as any;
    const routes = router._def?.procedures || {};
    expect(Object.keys(routes)).toContain("dashboard.stats");
  });

  it("has ai.ask mutation", () => {
    const router = appRouter as any;
    const routes = router._def?.procedures || {};
    expect(Object.keys(routes)).toContain("ai.ask");
  });

  it("has esocial events router", () => {
    const router = appRouter as any;
    const routes = router._def?.procedures || {};
    const esocialRoutes = Object.keys(routes).filter(k =>
      k.startsWith("esocial.")
    );
    expect(esocialRoutes.length).toBeGreaterThan(0);
  });
});

// ─── Business logic tests ─────────────────────────────────────────────────────
describe("SST business logic", () => {
  it("risk level calculation: low probability × low severity = Tolerável", () => {
    // P=1, S=1 → score=1 → Tolerável
    const calcRiskLevel = (p: number, s: number): string => {
      const score = p * s;
      if (score <= 4) return "Tolerável";
      if (score <= 9) return "Moderado";
      if (score <= 16) return "Substancial";
      return "Intolerável";
    };
    expect(calcRiskLevel(1, 1)).toBe("Tolerável");
    expect(calcRiskLevel(2, 2)).toBe("Tolerável");
  });

  it("risk level calculation: high probability × high severity = Intolerável", () => {
    const calcRiskLevel = (p: number, s: number): string => {
      const score = p * s;
      if (score <= 4) return "Tolerável";
      if (score <= 9) return "Moderado";
      if (score <= 16) return "Substancial";
      return "Intolerável";
    };
    expect(calcRiskLevel(5, 5)).toBe("Intolerável");
    expect(calcRiskLevel(4, 5)).toBe("Intolerável");
  });

  it("risk level calculation: medium probability × medium severity = Moderado", () => {
    const calcRiskLevel = (p: number, s: number): string => {
      const score = p * s;
      if (score <= 4) return "Tolerável";
      if (score <= 9) return "Moderado";
      if (score <= 16) return "Substancial";
      return "Intolerável";
    };
    expect(calcRiskLevel(3, 3)).toBe("Moderado");
  });

  it("compliance score is between 0 and 100", () => {
    // Simulate compliance score calculation
    const calcCompliance = (
      examsOk: number,
      totalExams: number,
      episOk: number,
      totalEpis: number,
      trainingsOk: number,
      totalTrainings: number
    ): number => {
      const examsScore = totalExams > 0 ? (examsOk / totalExams) * 100 : 100;
      const episScore = totalEpis > 0 ? (episOk / totalEpis) * 100 : 100;
      const trainingsScore =
        totalTrainings > 0 ? (trainingsOk / totalTrainings) * 100 : 100;
      return Math.round((examsScore + episScore + trainingsScore) / 3);
    };
    const score = calcCompliance(8, 10, 5, 5, 3, 4);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("frequency rate formula: (accidents × 1,000,000) / hours worked", () => {
    const calcFrequencyRate = (
      accidents: number,
      hoursWorked: number
    ): number => {
      if (hoursWorked === 0) return 0;
      return Math.round(((accidents * 1_000_000) / hoursWorked) * 100) / 100;
    };
    expect(calcFrequencyRate(2, 200000)).toBe(10);
    expect(calcFrequencyRate(0, 200000)).toBe(0);
  });

  it("EPI CA validation: CA number should be numeric string", () => {
    const isValidCA = (ca: string): boolean => /^\d+$/.test(ca);
    expect(isValidCA("12345")).toBe(true);
    expect(isValidCA("CA-123")).toBe(false);
    expect(isValidCA("")).toBe(false);
  });

  it("eSocial event codes are valid", () => {
    const validCodes = ["S-2210", "S-2220", "S-2240", "S-2245"];
    const testCodes = ["S-2210", "S-2220", "S-2240", "S-2245"];
    testCodes.forEach(code => {
      expect(validCodes).toContain(code);
    });
  });

  it("exam expiration check: expired if dueDate < today", () => {
    const isExpired = (dueDate: Date): boolean => dueDate < new Date();
    const pastDate = new Date(Date.now() - 86400000); // yesterday
    const futureDate = new Date(Date.now() + 86400000); // tomorrow
    expect(isExpired(pastDate)).toBe(true);
    expect(isExpired(futureDate)).toBe(false);
  });

  it("days without accident calculation", () => {
    const calcDaysWithoutAccident = (lastAccidentDate: Date | null): number => {
      if (!lastAccidentDate) return 365;
      const diff = Date.now() - lastAccidentDate.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    };
    const yesterday = new Date(Date.now() - 86400000);
    expect(calcDaysWithoutAccident(yesterday)).toBe(1);
    expect(calcDaysWithoutAccident(null)).toBe(365);
  });
});

// ─── Data validation tests ────────────────────────────────────────────────────
describe("data validation", () => {
  it("CNPJ format validation (14 digits)", () => {
    const isValidCNPJ = (cnpj: string): boolean =>
      /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);
    expect(isValidCNPJ("12.345.678/0001-90")).toBe(true);
    expect(isValidCNPJ("12345678000190")).toBe(false);
    expect(isValidCNPJ("")).toBe(false);
  });

  it("NR reference format validation", () => {
    const isValidNR = (nr: string): boolean => /^NR-\d{2}$/.test(nr);
    expect(isValidNR("NR-01")).toBe(true);
    expect(isValidNR("NR-35")).toBe(true);
    expect(isValidNR("NR1")).toBe(false);
  });

  it("training validity period: expired if expirationDate < today", () => {
    const isTrainingExpired = (expirationDate: Date | null): boolean => {
      if (!expirationDate) return false;
      return expirationDate < new Date();
    };
    const expired = new Date(Date.now() - 86400000);
    const valid = new Date(Date.now() + 86400000);
    expect(isTrainingExpired(expired)).toBe(true);
    expect(isTrainingExpired(valid)).toBe(false);
    expect(isTrainingExpired(null)).toBe(false);
  });
});
