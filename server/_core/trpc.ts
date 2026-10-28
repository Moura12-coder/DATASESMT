import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next, path } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  if (ctx.user.registrationStatus !== "approved") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cadastro não aprovado",
    });
  }
  const selfService = [
    "auth.logout",
    "registration.getRegistrationStatus",
    "rbac.getCurrentUserRole",
    "rbac.hasPermission",
    "rbac.isAdmin",
    "rbac.isManager",
    "ai.chat",
    "ai.ask",
    "ai.history",
    "ai.clearHistory",
    "notifications.list",
    "notifications.markRead",
    "notifications.markAllRead",
  ];
  if (ctx.user.role !== "admin" && !selfService.includes(path)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta operação exige acesso administrativo",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || ctx.user.role !== "admin")
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
