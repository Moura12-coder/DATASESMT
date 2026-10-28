import { z } from "zod";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { registerUser } from "./emailAuth";
export enum RegistrationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}
export const registrationRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().trim().email().max(320),
        password: z.string().min(8).max(128),
        name: z.string().trim().min(2).max(255),
        companyName: z.string().trim().min(2).max(255),
        cnpj: z.string().max(20).optional(),
        phone: z.string().max(20).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await registerUser(input.email, input.password, input.name, {
        companyName: input.companyName,
        cnpj: input.cnpj,
        phone: input.phone,
      });
      return {
        success: true,
        message: "Cadastro recebido. Aguarde aprovação do administrador.",
      };
    }),
  getPendingRegistrations: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(10),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const pending = eq(users.registrationStatus, "pending");
      const [count] = await db
        .select({ total: sql<number>`count(*)` })
        .from(users)
        .where(pending);
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          companyName: users.companyName,
          cnpj: users.cnpj,
          phone: users.phone,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(pending)
        .orderBy(users.createdAt, users.id)
        .limit(input.limit)
        .offset(input.offset);
      return { total: Number(count.total), users: rows };
    }),
  approveRegistration: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        approved: z.boolean(),
        rejectionReason: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é permitido alterar sua própria aprovação",
        });
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db
        .update(users)
        .set({
          registrationStatus: input.approved ? "approved" : "rejected",
          rejectionReason: input.approved
            ? null
            : input.rejectionReason || null,
          sessionVersion: sql`${users.sessionVersion} + 1`,
        })
        .where(
          and(
            eq(users.id, input.userId),
            eq(users.registrationStatus, "pending")
          )
        );
      if (!result.affectedRows)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cadastro pendente não encontrado",
        });
      return {
        success: true,
        message: input.approved ? "Cadastro aprovado" : "Cadastro rejeitado",
      };
    }),
  getRegistrationStatus: protectedProcedure.query(({ ctx }) => ({
    status: ctx.user.registrationStatus,
    rejectionReason: ctx.user.rejectionReason,
  })),
});
