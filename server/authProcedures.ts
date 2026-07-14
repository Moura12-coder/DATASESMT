import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import * as emailAuth from "./emailAuth";

export const authProcedures = {
  // Email/Password Login
  login: publicProcedure
    .input(z.object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      rememberMe: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify email/password
        const user = await emailAuth.loginUser(input.email, input.password);

        // Create session token
        const expiresInMs = input.rememberMe ? ONE_YEAR_MS : 24 * 60 * 60 * 1000; // 1 year or 24 hours
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs,
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: expiresInMs });

        return {
          success: true,
          user: {
            id: user.id,
            openId: user.openId,
            email: user.email,
            name: user.name,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        throw new Error(message);
      }
    }),

  // Email/Password Registration
  register: publicProcedure
    .input(z.object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      name: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Register user
        const newUser = await emailAuth.registerUser(input.email, input.password, input.name);

        // Create session token
        const sessionToken = await sdk.createSessionToken(`email_${input.email}_${Date.now()}`, {
          name: input.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Registration failed";
        throw new Error(message);
      }
    }),

  // Request Password Reset
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email("Invalid email format"),
    }))
    .mutation(async ({ input }) => {
      try {
        await emailAuth.requestPasswordReset(input.email);
        // Don't reveal if email exists
        return {
          success: true,
          message: "If this email exists, a password reset link will be sent",
        };
      } catch (error) {
        return {
          success: true,
          message: "If this email exists, a password reset link will be sent",
        };
      }
    }),

  // Reset Password with Token
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
    }))
    .mutation(async ({ input }) => {
      try {
        await emailAuth.resetPassword(input.token, input.newPassword);
        return {
          success: true,
          message: "Password reset successfully",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Password reset failed";
        throw new Error(message);
      }
    }),
};
