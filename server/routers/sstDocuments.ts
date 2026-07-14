/**
 * tRPC Router for SST Documents
 * Handles creation, retrieval, update, and deletion of SST documents
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

// ─── VALIDATION SCHEMAS ──────────────────────────────────────────────────────

const CreateSSTDocumentSchema = z.object({
  unitId: z.number().positive(),
  type: z.enum(["PGR", "PCMSO", "LTCAT", "LTIP", "Ordem de Serviço", "Permissão de Trabalho", "APR", "ASO", "Ficha de Controle de EPI", "Avaliação Ergonômica Preliminar"]),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  content: z.string().optional(),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  metadata: z.any().optional(),
  tags: z.array(z.string()).optional(),
});

const UpdateSSTDocumentSchema = z.object({
  documentId: z.number().positive(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["Rascunho", "Aguardando Aprovação", "Aprovado", "Vigente", "Expirado", "Cancelado"]).optional(),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  metadata: z.any().optional(),
  tags: z.array(z.string()).optional(),
});

const GetSSTDocumentSchema = z.object({
  documentId: z.number().positive(),
});

const ListSSTDocumentsSchema = z.object({
  unitId: z.number().positive(),
  type: z.enum(["PGR", "PCMSO", "LTCAT", "LTIP", "Ordem de Serviço", "Permissão de Trabalho", "APR", "ASO", "Ficha de Controle de EPI", "Avaliação Ergonômica Preliminar"]).optional(),
  status: z.enum(["Rascunho", "Aguardando Aprovação", "Aprovado", "Vigente", "Expirado", "Cancelado"]).optional(),
});

const DeleteSSTDocumentSchema = z.object({
  documentId: z.number().positive(),
});

// ─── ROUTER ──────────────────────────────────────────────────────────────────

export const sstDocumentsRouter = router({
  // Create a new SST document
  create: protectedProcedure
    .input(CreateSSTDocumentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const documentData = {
          unitId: input.unitId,
          type: input.type,
          title: input.title,
          description: input.description,
          content: input.content,
          author: ctx.user?.name || "Unknown",
          authorId: ctx.user?.id || 0,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
          metadata: input.metadata,
          tags: input.tags,
          createdBy: ctx.user?.id || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const result = await db.createDocument(documentData as any);
        const documentId = (result as any).insertId || (result as any).id || 1;

        return {
          documentId,
          message: "Documento criado com sucesso",
        };
      } catch (error) {
        console.error("Error creating document:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar documento SST",
        });
      }
    }),

  // Get a specific SST document
  get: protectedProcedure
    .input(GetSSTDocumentSchema)
    .query(async ({ input }) => {
      try {
        const documents = await db.getDocuments();
        const document = documents.find(d => d.id === input.documentId);
        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Documento não encontrado",
          });
        }
        return document;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar documento",
        });
      }
    }),

  // List SST documents by unit
  list: protectedProcedure
    .input(ListSSTDocumentsSchema)
    .query(async ({ input }) => {
      try {
        const documents = await db.getDocuments(input.unitId, input.type as any);
        return documents || [];
      } catch (error) {
        console.error("Error listing documents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar documentos",
        });
      }
    }),

  // Update an SST document
  update: protectedProcedure
    .input(UpdateSSTDocumentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await db.updateDocument(input.documentId, {
          title: input.title,
          description: input.description,
          content: input.content,
          status: input.status,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
          metadata: input.metadata,
          tags: input.tags,
          updatedBy: ctx.user?.id,
          updatedAt: new Date(),
        } as any);

        return {
          documentId: input.documentId,
          message: "Documento atualizado com sucesso",
        };
      } catch (error) {
        console.error("Error updating document:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar documento",
        });
      }
    }),

  // Delete an SST document (soft delete)
  delete: protectedProcedure
    .input(DeleteSSTDocumentSchema)
    .mutation(async ({ input }) => {
      try {
        await db.deleteDocument(input.documentId);
        return { message: "Documento deletado com sucesso" };
      } catch (error) {
        console.error("Error deleting document:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar documento",
        });
      }
    }),

  // Get pending approvals
  getPendingApprovals: protectedProcedure
    .query(async () => {
      try {
        const documents = await db.getDocuments();
        return documents.filter(d => d.status === "Aguardando Aprovação") || [];
      } catch (error) {
        console.error("Error getting pending approvals:", error);
        return [];
      }
    }),
});
