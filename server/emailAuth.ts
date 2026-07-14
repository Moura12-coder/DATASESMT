/**
 * Email/Password Authentication Module
 * Handles user registration, login, password reset, and verification
 */

import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import * as db from "./db";
import crypto from "crypto";

// Password hashing using Node.js built-in crypto
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  if (!salt || !storedHash) return false;

  const newHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return newHash === storedHash;
}

// Generate password reset token
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// User registration with email/password
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ id: number; email: string; name: string | null }> {
  // Check if user already exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Create a unique openId for email-based users
  const openId = `email_${email}_${Date.now()}`;
  const passwordHash = hashPassword(password);

  // Upsert user
  await db.upsertUser({
    openId,
    email,
    name: name || null,
    loginMethod: "email",
    passwordHash,
    emailVerified: false,
    lastSignedIn: new Date(),
  } as any);

  const user = await db.getUserByEmail(email);
  if (!user) {
    throw new Error("Failed to create user");
  }

  return {
    id: user.id,
    email: user.email || "",
    name: user.name,
  };
}

// User login with email/password
export async function loginUser(
  email: string,
  password: string
): Promise<{ id: number; openId: string; email: string; name: string | null }> {
  const user = await db.getUserByEmail(email);

  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }

  // Update last signed in
  await db.upsertUser({
    openId: user.openId,
    lastSignedIn: new Date(),
  } as any);

  return {
    id: user.id,
    openId: user.openId,
    email: user.email || "",
    name: user.name,
  };
}

// Request password reset
export async function requestPasswordReset(email: string): Promise<string> {
  const user = await db.getUserByEmail(email);

  if (!user) {
    // Don't reveal if email exists for security
    return generateResetToken();
  }

  const resetToken = generateResetToken();
  const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store reset token and expiry in database
  await db.upsertUser({
    openId: user.openId,
    resetToken,
    resetTokenExpiry,
  } as any);

  return resetToken;
}

// Reset password with token
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  // Find user by reset token
  const dbInstance = await db.getDb();
  if (!dbInstance) throw new Error("Database not available");

  const result = await dbInstance
    .select()
    .from(users)
    .where(eq(users.resetToken, token))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Invalid or expired reset token");
  }

  const user = result[0];

  // Check if token is expired
  if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
    throw new Error("Reset token has expired");
  }

  // Update password and clear reset token
  const passwordHash = hashPassword(newPassword);
  await db.upsertUser({
    openId: user.openId,
    passwordHash,
    resetToken: null,
    resetTokenExpiry: null,
  } as any);
}

// Verify email
export async function verifyEmail(email: string): Promise<void> {
  const user = await db.getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  await db.upsertUser({
    openId: user.openId,
    emailVerified: true,
  } as any);
}
