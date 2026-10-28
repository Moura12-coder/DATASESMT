import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
}));
vi.mock("./db", () => mocks);
vi.mock("./_core/env", () => ({
  ENV: {
    appId: "session-test",
    cookieSecret: "test-secret-at-least-32-characters-long",
    oAuthServerUrl: "",
    ownerOpenId: "",
  },
}));
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
beforeEach(() => {
  vi.clearAllMocks();
});
describe("session integrity", () => {
  const sign = (version = 0, expiresInMs = 60000) =>
    sdk.signSession(
      {
        openId: "email_test",
        name: "",
        appId: "session-test",
        sessionVersion: version,
      },
      { expiresInMs }
    );
  it("accepts empty optional names and binds the token to this application", async () => {
    expect(await sdk.verifySession(await sign())).toMatchObject({
      openId: "email_test",
      name: "",
      sessionVersion: 0,
    });
    const otherApp = await sdk.signSession({
      openId: "email_test",
      name: "Name",
      appId: "other-app",
    });
    expect(await sdk.verifySession(otherApp)).toBeNull();
  });
  it("rejects expired and tampered cookies", async () => {
    expect(await sdk.verifySession(await sign(0, -60000))).toBeNull();
    expect(await sdk.verifySession((await sign()) + "tampered")).toBeNull();
  });
  it("revokes previously issued cookies after the account version changes", async () => {
    const cookie = await sign(0);
    mocks.getUserByOpenId.mockResolvedValue({
      id: 1,
      openId: "email_test",
      registrationStatus: "approved",
      sessionVersion: 1,
    });
    await expect(
      sdk.authenticateRequest({
        headers: { cookie: `${COOKIE_NAME}=${cookie}` },
      } as any)
    ).rejects.toThrow("Session revoked");
    expect(mocks.upsertUser).not.toHaveBeenCalled();
  });
  it("rejects unapproved accounts even with a valid signed cookie", async () => {
    const cookie = await sign(0);
    mocks.getUserByOpenId.mockResolvedValue({
      id: 1,
      openId: "email_test",
      registrationStatus: "pending",
      sessionVersion: 0,
    });
    await expect(
      sdk.authenticateRequest({
        headers: { cookie: `${COOKIE_NAME}=${cookie}` },
      } as any)
    ).rejects.toThrow("Session revoked");
  });
});
