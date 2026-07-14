import { z } from "zod";
import { protectedProcedure } from "./phase1Routers";
import { updateGHE, getGHEById, getGHEStats } from "./gheUpdate";

/**
 * Procedure para atualizar GHE
 */
export const updateGHEProcedure = protectedProcedure
  .input(
    z.object({
      gheId: z.number().int().positive(),
      code: z.string().min(3).optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      responsible: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(["Ativo", "Inativo", "Em Revisão"]).optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const result = await updateGHE(input.gheId, {
        code: input.code,
        name: input.name,
        description: input.description,
        responsible: input.responsible,
        location: input.location,
        status: input.status,
        notes: input.notes,
      });

      return {
        success: true,
        message: "GHE atualizado com sucesso",
        data: result,
      };
    } catch (error: any) {
      throw new Error(`Erro ao atualizar GHE: ${error.message}`);
    }
  });

/**
 * Procedure para obter GHE por ID
 */
export const getGHEByIdProcedure = protectedProcedure
  .input(
    z.object({
      gheId: z.number().int().positive(),
    })
  )
  .query(async ({ input }) => {
    try {
      const result = await getGHEById(input.gheId);
      return result;
    } catch (error: any) {
      throw new Error(`Erro ao obter GHE: ${error.message}`);
    }
  });

/**
 * Procedure para obter estatísticas de GHE
 */
export const getGHEStatsProcedure = protectedProcedure
  .input(
    z.object({
      gheId: z.number().int().positive(),
    })
  )
  .query(async ({ input }) => {
    try {
      const result = await getGHEStats(input.gheId);
      return result;
    } catch (error: any) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }
  });
