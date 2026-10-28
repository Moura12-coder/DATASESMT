import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import { hashPassword, verifyPassword } from "./passwords";
import { normalizeWrite } from "./normalizeWrite";
import { employees, epiItems } from "../drizzle/schema";
import { appRouter } from "./routers";
import { publicUser } from "./publicUser";
import { protectedProcedure, router } from "./_core/trpc";
import { createAuthRateLimiter } from "./_core/httpSecurity";
import { getSessionCookieOptions } from "./_core/cookies";
import { sendToESocial } from "./esocialIntegration";
import { transmitRiskToESocial } from "./esocialRiskIntegration";
const now = new Date();
const user = {
  id: 1,
  openId: "test",
  role: "user",
  registrationStatus: "approved",
  sessionVersion: 0,
  name: "",
  email: "test@example.com",
  passwordHash: "private",
  resetToken: "private-token",
  resetTokenExpiry: now,
  createdAt: now,
  updatedAt: now,
  lastSignedIn: now,
} as any;
describe("password security", () => {
  it("uses independently salted hashes and rejects invalid credentials", async () => {
    const first = await hashPassword("Example password!");
    const second = await hashPassword("Example password!");
    expect(first).not.toBe(second);
    expect(first).toMatch(/^scrypt:/);
    expect(await verifyPassword("Example password!", first)).toBe(true);
    expect(await verifyPassword("wrong", first)).toBe(false);
    expect(await verifyPassword("plaintext", "plaintext")).toBe(false);
    expect(await verifyPassword("wrong", "scrypt:bad:bad")).toBe(false);
  });
  it("accepts legacy PBKDF2 credentials for login migration", async () => {
    const salt = "a".repeat(32);
    const hash = crypto
      .pbkdf2Sync("legacy", salt, 1000, 64, "sha512")
      .toString("hex");
    expect(await verifyPassword("legacy", `${salt}:${hash}`)).toBe(true);
    expect(await verifyPassword("wrong", `${salt}:${hash}`)).toBe(false);
  });
  it("never exposes credentials through the user DTO", () => {
    const dto = publicUser(user);
    expect(dto).not.toHaveProperty("passwordHash");
    expect(dto).not.toHaveProperty("resetToken");
    expect(dto).not.toHaveProperty("resetTokenExpiry");
    expect(publicUser(null)).toBeNull();
  });
});
describe("access isolation", () => {
  const api = router({
    employees: router({ list: protectedProcedure.query(() => ["sensitive"]) }),
    auth: router({
      logout: protectedProcedure.mutation(() => ({ success: true })),
    }),
  });
  const context = (overrides: object = {}) => ({
    user: { ...user, ...overrides },
    req: {} as any,
    res: {} as any,
  });
  it("blocks ordinary users from all operational data", async () => {
    await expect(
      api.createCaller(context()).employees.list()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("allows approved administrators", async () => {
    expect(
      await api.createCaller(context({ role: "admin" })).employees.list()
    ).toEqual(["sensitive"]);
  });
  it("rejects pending and anonymous accounts", async () => {
    await expect(
      api
        .createCaller(context({ role: "admin", registrationStatus: "pending" }))
        .employees.list()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api.createCaller({ ...context(), user: null }).employees.list()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("keeps self-service logout available", async () => {
    expect(await api.createCaller(context()).auth.logout()).toEqual({
      success: true,
    });
  });
});
describe("HTTP protections", () => {
  it("allows secure first-party cookies and HTTP development", () => {
    expect(getSessionCookieOptions({ protocol: "http" } as any)).toMatchObject({
      sameSite: "lax",
      httpOnly: true,
      secure: false,
    });
    expect(getSessionCookieOptions({ protocol: "https" } as any).secure).toBe(
      true
    );
  });
  it("limits login and registration even inside a batched request", () => {
    const limit = createAuthRateLimiter(2);
    const next = vi.fn();
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      sendStatus: vi.fn(),
    };
    const req = {
      path: "/auth.me,auth.login",
      headers: {},
      ip: "127.0.0.1",
      socket: {},
    } as any;
    limit(req, res as any, next);
    limit(req, res as any, next);
    limit(req, res as any, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Retry-After",
      expect.any(Number)
    );
  });
});
describe("truthful integration status", () => {
  it("never manufactures a government receipt", async () => {
    const result = await sendToESocial({
      dtIniAfastamento: "2026-01-01",
      codMotAfast: "01",
    } as any);
    expect(result.success).toBe(false);
    expect(result.protocolNumber).toBeUndefined();
  });
  it("never counts untransmitted risk data as sent", async () => {
    const result = await transmitRiskToESocial(
      [
        {
          unitId: 1,
          areaId: 1,
          areaName: "Area",
          riskLevel: "moderado",
          agentType: "fisico",
          agentName: "Ruído",
          description: "",
          controlMeasures: [],
          exposedEmployeeCount: 3,
        },
      ],
      1
    );
    expect(result.success).toBe(false);
    expect(result.transmittedCount).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("production router regression", () => {
  const context = { user, req: {} as any, res: {} as any };
  it("denies real employee reads and deletes before database access", async () => {
    const api = appRouter.createCaller(context);
    await expect(api.employees.list({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(api.employees.delete({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(api.exams.list({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("auth.me never leaks stored secrets", async () => {
    const dto = await appRouter.createCaller(context).auth.me();
    expect(dto?.id).toBe(user.id);
    expect(dto).not.toHaveProperty("passwordHash");
    expect(dto).not.toHaveProperty("resetToken");
  });
  it("rejects primary-key and unknown-field injection on update", async () => {
    const api = appRouter.createCaller({
      ...context,
      user: { ...user, role: "admin" },
    });
    await expect(
      api.employees.update({ id: 1, data: { id: 2 } } as any)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
describe("database write normalization", () => {
  it("converts date-only inputs to valid driver Dates and rejects impossible dates", () => {
    expect(
      normalizeWrite(employees, { admissionDate: "2026-02-01" }).admissionDate
    ).toBeInstanceOf(Date);
    expect(() =>
      normalizeWrite(employees, { admissionDate: "2026-02-30" })
    ).toThrow("Data inválida");
    expect(
      normalizeWrite(employees, { admissionDate: "" }).admissionDate
    ).toBeNull();
  });
  it("converts monetary decimal numbers to driver strings", () => {
    expect(normalizeWrite(epiItems, { unitCost: 12.5 }).unitCost).toBe("12.5");
    expect(() => normalizeWrite(epiItems, { unitCost: Infinity })).toThrow(
      "Número inválido"
    );
  });
});
