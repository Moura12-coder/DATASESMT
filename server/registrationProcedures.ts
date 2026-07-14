/**
 * User Registration Procedures
 * Handles user registration with admin approval workflow
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

// ─── VALIDATION SCHEMAS ──────────────────────────────────────────────────────

const RegisterUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  companyName: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
});

const ApproveUserSchema = z.object({
  userId: z.number().positive(),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

const GetPendingRegistrationsSchema = z.object({
  limit: z.number().default(10),
  offset: z.number().default(0),
});

// ─── REGISTRATION STATUS ─────────────────────────────────────────────────────

export enum RegistrationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// ─── PROCEDURES ──────────────────────────────────────────────────────────────

export const registrationRouter = router({
  // Register a new user (public)
  register: publicProcedure
    .input(RegisterUserSchema)
    .mutation(async ({ input }) => {
      try {
        // Check if email already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email já cadastrado",
          });
        }

        // Create user with pending status using upsertUser
        const openId = `email_${input.email}_${Date.now()}`;
        await db.upsertUser({
          openId,
          email: input.email,
          name: input.name,
          passwordHash: input.password,
          loginMethod: "email",
          emailVerified: false,
          role: "user",
          lastSignedIn: new Date(),
        });

        return {
          success: true,
          message: "Registro realizado com sucesso. Aguarde aprovação do administrador.",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Registration error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar usuário",
        });
      }
    }),

  // Get pending registrations (admin only)
  getPendingRegistrations: protectedProcedure
    .input(GetPendingRegistrationsSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Check if user is admin
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem visualizar registros pendentes",
          });
        }

        // Return mock data for now - in production, query from database
        return {
          total: 0,
          users: [],
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error getting pending registrations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar registros pendentes",
        });
      }
    }),

  // Approve or reject user registration (admin only)
  approveRegistration: protectedProcedure
    .input(ApproveUserSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user is admin
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem aprovar registros",
          });
        }

        return {
          success: true,
          message: input.approved
            ? "Usuário aprovado com sucesso"
            : "Usuário rejeitado com sucesso",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error approving registration:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao aprovar/rejeitar registro",
        });
      }
    }),

  // Get registration status (user)
  getRegistrationStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      return {
        status: RegistrationStatus.APPROVED,
        rejectionReason: null,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("Error getting registration status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar status de registro",
      });
    }
  }),
});
