import { getDb } from "./db";
import { ghe } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Atualizar GHE existente
 */
export async function updateGHE(gheId: number, data: {
  code?: string;
  name?: string;
  description?: string;
  responsible?: string;
  location?: string;
  status?: "Ativo" | "Inativo" | "Em Revisão";
  notes?: string;
}) {
  try {
    // Validações
    if (data.code && data.code.length < 3) {
      throw new Error("Código deve ter no mínimo 3 caracteres");
    }
    if (data.name && data.name.trim().length === 0) {
      throw new Error("Nome não pode estar vazio");
    }
    if (data.responsible && data.responsible.trim().length === 0) {
      throw new Error("Responsável não pode estar vazio");
    }
    if (data.location && data.location.trim().length === 0) {
      throw new Error("Localização não pode estar vazia");
    }

    // Verificar se GHE existe
    const existingGHE = await (await getDb()).query.ghe.findFirst({
      where: eq(ghe.id, gheId),
    });

    if (!existingGHE) {
      throw new Error(`GHE com ID ${gheId} não encontrado`);
    }

    // Verificar se código já existe (se estiver sendo alterado)
    if (data.code && data.code !== existingGHE.code) {
      const codeExists = await (await getDb()).query.ghe.findFirst({
        where: eq(ghe.code, data.code),
      });
      if (codeExists) {
        throw new Error(`Código ${data.code} já está em uso`);
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.responsible !== undefined) updateData.responsible = data.responsible;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    updateData.updatedAt = new Date();

    // Atualizar GHE
    const result = await db
      .update(ghe)
      .set(updateData)
      .where(eq(ghe.id, gheId))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao atualizar GHE:", error);
    throw error;
  }
}

/**
 * Obter GHE por ID com todos os dados
 */
export async function getGHEById(gheId: number) {
  try {
    const result = await (await getDb()).query.ghe.findFirst({
      where: eq(ghe.id, gheId),
    });

    if (!result) {
      throw new Error(`GHE com ID ${gheId} não encontrado`);
    }

    return result;
  } catch (error) {
    console.error("Erro ao obter GHE:", error);
    throw error;
  }
}

/**
 * Listar GHEs com filtros opcionais
 */
export async function listGHEsFiltered(unitId: number, filters?: {
  status?: "Ativo" | "Inativo" | "Em Revisão";
  searchTerm?: string;
}) {
  try {
    let query = (await getDb()).query.ghe.findMany({
      where: eq(ghe.unitId, unitId),
    });

    // Aplicar filtros se fornecidos
    // Nota: Drizzle ORM requer construção de query diferente para múltiplos filtros
    // Este é um exemplo simplificado

    return query;
  } catch (error) {
    console.error("Erro ao listar GHEs:", error);
    throw error;
  }
}

/**
 * Obter estatísticas de GHE
 */
export async function getGHEStats(gheId: number) {
  try {
    const gheData = await getGHEById(gheId);

    // Contar agentes de exposição
    const agentsCount = gheData.exposureAgents?.length || 0;

    // Contar funcionários
    const employeesCount = gheData.employees?.length || 0;

    return {
      gheId,
      gheCode: gheData.code,
      gheName: gheData.name,
      agentsCount,
      employeesCount,
      status: gheData.status || "Ativo",
      lastUpdated: gheData.updatedAt,
    };
  } catch (error) {
    console.error("Erro ao obter estatísticas de GHE:", error);
    throw error;
  }
}
