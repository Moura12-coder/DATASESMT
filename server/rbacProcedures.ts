/**
 * Role-Based Access Control (RBAC) Procedures
 * Handles role management and permission checking
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { eq, sql } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";

// ─── ROLE DEFINITIONS ────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
  VIEWER = "viewer",
  USER = "user",
}

export const RoleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.EMPLOYEE]: 2,
  [UserRole.VIEWER]: 1,
  [UserRole.USER]: 0,
};

// ─── PERMISSIONS BY ROLE ─────────────────────────────────────────────────────

export const RolePermissions: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    "manage_users",
    "manage_roles",
    "manage_tenants",
    "view_all_documents",
    "create_documents",
    "approve_documents",
    "delete_documents",
    "manage_settings",
    "view_analytics",
    "export_data",
  ],
  [UserRole.MANAGER]: [
    "view_all_documents",
    "create_documents",
    "approve_documents",
    "manage_employees",
    "view_analytics",
    "export_data",
  ],
  [UserRole.EMPLOYEE]: [
    "view_own_documents",
    "create_documents",
    "view_analytics",
  ],
  [UserRole.VIEWER]: ["view_own_documents", "view_analytics"],
  [UserRole.USER]: ["view_own_documents"],
};

// ─── VALIDATION SCHEMAS ──────────────────────────────────────────────────────

const UpdateUserRoleSchema = z.object({
  userId: z.number().positive(),
  newRole: z.enum(["admin", "user"]),
});

const CheckPermissionSchema = z.object({
  permission: z.string(),
});

// ─── PROCEDURES ──────────────────────────────────────────────────────────────

export const rbacRouter = router({
  // Get current user's role and permissions
  getCurrentUserRole: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado",
        });
      }

      const userRole = (ctx.user.role || "user") as UserRole;
      const permissions = RolePermissions[userRole] || [];

      return {
        role: userRole,
        permissions,
        hierarchy: RoleHierarchy[userRole],
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar role do usuário",
      });
    }
  }),

  // Check if user has specific permission
  hasPermission: protectedProcedure
    .input(CheckPermissionSchema)
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          return false;
        }

        const userRole = (ctx.user.role || "user") as UserRole;
        const permissions = RolePermissions[userRole] || [];

        return permissions.includes(input.permission);
      } catch (error) {
        console.error("Error checking permission:", error);
        return false;
      }
    }),

  // Get all available roles
  getAvailableRoles: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem visualizar roles",
        });
      }

      return Object.entries(RolePermissions)
        .filter(([role]) => role === "admin" || role === "user")
        .map(([role, permissions]) => ({
          role,
          permissions,
          hierarchy: RoleHierarchy[role as UserRole],
        }));
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar roles disponíveis",
      });
    }
  }),

  // Update user role (admin only)
  updateUserRole: protectedProcedure
    .input(UpdateUserRoleSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem alterar roles",
          });
        }

        if (input.userId === ctx.user.id)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é permitido alterar seu próprio perfil",
          });
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const [result] = await db
          .update(users)
          .set({
            role: input.newRole,
            sessionVersion: sql`${users.sessionVersion} + 1`,
          })
          .where(eq(users.id, input.userId));
        if (!result.affectedRows)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Usuário não encontrado",
          });
        return {
          success: true,
          message: `Role do usuário atualizado para ${input.newRole}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating user role:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar role do usuário",
        });
      }
    }),

  // Check if user is admin
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user?.role === "admin";
  }),

  // Check if user is manager or higher
  isManager: protectedProcedure.query(async ({ ctx }) => {
    const userRole = (ctx.user?.role || "user") as UserRole;
    return RoleHierarchy[userRole] >= RoleHierarchy[UserRole.MANAGER];
  }),
});
