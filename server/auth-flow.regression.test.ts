import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  sendResetEmail: vi.fn(),
  requireMailConfiguration: vi.fn(),
}));
vi.mock("./db", () => mocks);
vi.mock("./mailService", () => mocks);
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
} from "./emailAuth";
import { hashPassword, verifyPassword } from "./passwords";
import { authProcedures } from "./authProcedures";
import { router } from "./_core/trpc";
const now = new Date();
beforeEach(() => {
  vi.clearAllMocks();
});
describe("registration and account approval", () => {
  it("stores a hash and a pending account with a stable short identifier", async () => {
    const values = vi.fn().mockResolvedValue({});
    mocks.getDb.mockResolvedValue({ insert: () => ({ values }) });
    mocks.getUserByEmail.mockResolvedValue(undefined);
    mocks.getUserByOpenId.mockImplementation(async (openId: string) => ({
      id: 9,
      openId,
      name: "Test",
      email: "test@example.com",
    }));
    const result = await registerUser(
      "TEST@example.com",
      "example password",
      "Test"
    );
    const stored = values.mock.calls[0][0];
    expect(stored.email).toBe("test@example.com");
    expect(stored.registrationStatus).toBe("pending");
    expect(stored.passwordHash).not.toBe("example password");
    expect(await verifyPassword("example password", stored.passwordHash)).toBe(
      true
    );
    expect(result.openId).toBe(stored.openId);
    expect(stored.openId.length).toBeLessThanOrEqual(64);
  });
  it("does not create a cookie while registration is pending", async () => {
    mocks.getDb.mockResolvedValue({
      insert: () => ({ values: vi.fn().mockResolvedValue({}) }),
    });
    mocks.getUserByEmail.mockResolvedValue(undefined);
    mocks.getUserByOpenId.mockImplementation(async (openId: string) => ({
      id: 9,
      openId,
      name: "Test",
      email: "test@example.com",
    }));
    const cookie = vi.fn();
    const api = router({ register: authProcedures.register });
    const caller = api.createCaller({
      user: null,
      req: {} as any,
      res: { cookie } as any,
    });
    expect(
      (
        await caller.register({
          email: "test@example.com",
          password: "example password",
          name: "Test",
        })
      ).success
    ).toBe(true);
    expect(cookie).not.toHaveBeenCalled();
  });
  it("blocks pending accounts even with the correct password", async () => {
    mocks.getUserByEmail.mockResolvedValue({
      passwordHash: await hashPassword("example password"),
      registrationStatus: "pending",
    });
    await expect(
      loginUser("test@example.com", "example password")
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.upsertUser).not.toHaveBeenCalled();
  });
  it("requires a database instead of pretending registration succeeded", async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(
      registerUser("test@example.com", "example password")
    ).rejects.toThrow("Database not available");
  });
});
describe("password recovery", () => {
  it("sends the token only by email and persists its digest", async () => {
    mocks.getUserByEmail.mockResolvedValue({
      openId: "email_test",
      email: "test@example.com",
    });
    await requestPasswordReset("test@example.com");
    const token = mocks.sendResetEmail.mock.calls[0][1];
    const persisted = mocks.upsertUser.mock.calls[0][0];
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(persisted.resetToken).not.toBe(token);
    expect(persisted.resetTokenExpiry.getTime()).toBeGreaterThan(Date.now());
  });
  it("uses one conditional update to consume the token and revoke sessions", async () => {
    const where = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const set = vi.fn().mockReturnValue({ where });
    mocks.getDb.mockResolvedValue({ update: () => ({ set }) });
    await resetPassword("a".repeat(64), "new password");
    expect(where).toHaveBeenCalledTimes(1);
    const changes = set.mock.calls[0][0];
    expect(changes.resetToken).toBeNull();
    expect(changes.sessionVersion).toBeDefined();
    expect(await verifyPassword("new password", changes.passwordHash)).toBe(
      true
    );
  });
  it("rejects expired, reused and unknown tokens", async () => {
    mocks.getDb.mockResolvedValue({
      update: () => ({
        set: () => ({ where: async () => [{ affectedRows: 0 }] }),
      }),
    });
    await expect(
      resetPassword("a".repeat(64), "new password")
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
