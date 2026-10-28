import { and, eq, gt, sql } from "drizzle-orm";
import { users } from "../drizzle/schema";
import * as db from "./db";
import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "./passwords";
import { requireMailConfiguration, sendResetEmail } from "./mailService";
export { hashPassword, verifyPassword } from "./passwords";
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const generateResetToken = () => crypto.randomBytes(32).toString("hex");
const digestToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function registerUser(
  email: string,
  password: string,
  name?: string,
  company?: { companyName?: string; cnpj?: string; phone?: string }
) {
  email = normalizeEmail(email);
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  if (await db.getUserByEmail(email))
    throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
  const openId = `email_${crypto.randomUUID()}`;
  try {
    await database
      .insert(users)
      .values({
        openId,
        email,
        name: name?.trim() || null,
        passwordHash: await hashPassword(password),
        loginMethod: "email",
        registrationStatus: "pending",
        role: "user",
        ...company,
      });
  } catch (error) {
    const cause = error as { cause?: { code?: string }; code?: string };
    if (cause.code === "ER_DUP_ENTRY" || cause.cause?.code === "ER_DUP_ENTRY")
      throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
    throw error;
  }
  const user = await db.getUserByOpenId(openId);
  if (!user) throw new Error("Failed to create user");
  return {
    id: user.id,
    openId: user.openId,
    email: user.email!,
    name: user.name,
  };
}
export async function loginUser(email: string, password: string) {
  const user = await db.getUserByEmail(normalizeEmail(email));
  if (
    !user?.passwordHash ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Email ou senha inválidos",
    });
  }
  if (user.registrationStatus !== "approved")
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cadastro pendente ou rejeitado. Contate o administrador.",
    });
  await db.upsertUser({
    openId: user.openId,
    lastSignedIn: new Date(),
    ...(user.passwordHash.startsWith("scrypt:")
      ? {}
      : { passwordHash: await hashPassword(password) }),
  });
  return {
    id: user.id,
    openId: user.openId,
    email: user.email!,
    name: user.name,
  };
}
export async function requestPasswordReset(email: string): Promise<void> {
  requireMailConfiguration();
  const user = await db.getUserByEmail(normalizeEmail(email));
  if (!user) return;
  const token = generateResetToken();
  const tokenHash = digestToken(token);
  await db.upsertUser({
    openId: user.openId,
    resetToken: tokenHash,
    resetTokenExpiry: new Date(Date.now() + 3600000),
  });
  try {
    await sendResetEmail(user.email!, token);
  } catch {
    // Preserve account privacy; log only an operational signal, never credentials.
    console.error("Password reset email delivery failed");
    const database = await db.getDb();
    if (database)
      await database
        .update(users)
        .set({ resetToken: null, resetTokenExpiry: null })
        .where(and(eq(users.id, user.id), eq(users.resetToken, tokenHash)));
  }
}
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const database = await db.getDb();
  if (!database) throw new Error("Database not available");
  const [result] = await database
    .update(users)
    .set({
      passwordHash: await hashPassword(newPassword),
      resetToken: null,
      resetTokenExpiry: null,
      sessionVersion: sql`${users.sessionVersion} + 1`,
    })
    .where(
      and(
        eq(users.resetToken, digestToken(token)),
        gt(users.resetTokenExpiry, new Date())
      )
    );
  if (result.affectedRows !== 1)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Link inválido ou expirado",
    });
}
