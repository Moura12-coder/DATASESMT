import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  createGHE,
  updateGHE,
  deleteGHE,
  getGHEAuditLog,
} from "./phase1Features";
import { eq } from "drizzle-orm";
import { ghe, gheAuditLog } from "../drizzle/schema";

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "GHE Validation and Auditoria",
  () => {
    let db: any;
    const testUnitId = 1;

    beforeAll(async () => {
      db = await getDb();
    });

    describe("Validação de Duplicação de Código", () => {
      it("deve permitir criar GHE com código único", async () => {
        const result = await createGHE({
          unitId: testUnitId,
          code: `GHE-TEST-${Date.now()}`,
          name: "Teste Único",
          description: "GHE para teste de duplicação",
        });

        expect(result).toBeDefined();
        expect(result[0]).toHaveProperty("id");
      });

      it("deve impedir criar GHE com código duplicado na mesma unidade", async () => {
        const uniqueCode = `GHE-DUP-${Date.now()}`;

        // Criar primeiro GHE
        const first = await createGHE({
          unitId: testUnitId,
          code: uniqueCode,
          name: "Primeiro GHE",
          description: "Teste de duplicação",
        });

        expect(first).toBeDefined();

        // Tentar criar segundo GHE com mesmo código
        try {
          await createGHE({
            unitId: testUnitId,
            code: uniqueCode,
            name: "Segundo GHE",
            description: "Deve falhar",
          });
          // Se chegou aqui, o teste falhou (não deve permitir duplicação)
          expect(true).toBe(false);
        } catch (error: any) {
          // Esperado falhar
          expect(error).toBeDefined();
        }
      });

      it("deve permitir mesmo código em unidades diferentes", async () => {
        const sharedCode = `GHE-SHARED-${Date.now()}`;
        const unitId1 = 1;
        const unitId2 = 2;

        const first = await createGHE({
          unitId: unitId1,
          code: sharedCode,
          name: "GHE Unidade 1",
          description: "Teste",
        });

        const second = await createGHE({
          unitId: unitId2,
          code: sharedCode,
          name: "GHE Unidade 2",
          description: "Teste",
        });

        expect(first).toBeDefined();
        expect(second).toBeDefined();
        expect(first[0].id).not.toBe(second[0].id);
      });
    });

    describe("Histórico de Auditoria", () => {
      it("deve registrar auditoria ao criar GHE", async () => {
        const code = `GHE-AUDIT-CREATE-${Date.now()}`;
        const gheResult = await createGHE({
          unitId: testUnitId,
          code,
          name: "GHE para Auditoria",
          description: "Teste de auditoria de criação",
        });

        const gheId = gheResult[0].id;
        const auditLog = await getGHEAuditLog(gheId);

        expect(auditLog).toBeDefined();
        expect(auditLog.length).toBeGreaterThan(0);

        const createLog = auditLog.find((log: any) => log.action === "CREATE");
        expect(createLog).toBeDefined();
        expect(createLog?.action).toBe("CREATE");
      });

      it("deve registrar auditoria ao editar GHE", async () => {
        const code = `GHE-AUDIT-UPDATE-${Date.now()}`;
        const gheResult = await createGHE({
          unitId: testUnitId,
          code,
          name: "GHE Original",
          description: "Descrição original",
        });

        const gheId = gheResult[0].id;

        // Editar GHE
        await updateGHE(gheId, {
          name: "GHE Modificado",
          description: "Descrição modificada",
        });

        const auditLog = await getGHEAuditLog(gheId);
        const updateLog = auditLog.find((log: any) => log.action === "UPDATE");

        expect(updateLog).toBeDefined();
        expect(updateLog?.action).toBe("UPDATE");
        expect(updateLog?.oldValues).toBeDefined();
        expect(updateLog?.newValues).toBeDefined();
      });

      it("deve registrar auditoria ao deletar GHE", async () => {
        const code = `GHE-AUDIT-DELETE-${Date.now()}`;
        const gheResult = await createGHE({
          unitId: testUnitId,
          code,
          name: "GHE para Deletar",
          description: "Será deletado",
        });

        const gheId = gheResult[0].id;

        // Deletar GHE
        await deleteGHE(gheId);

        const auditLog = await getGHEAuditLog(gheId);
        const deleteLog = auditLog.find((log: any) => log.action === "DELETE");

        expect(deleteLog).toBeDefined();
        expect(deleteLog?.action).toBe("DELETE");
      });

      it("deve manter histórico completo de alterações", async () => {
        const code = `GHE-AUDIT-FULL-${Date.now()}`;
        const gheResult = await createGHE({
          unitId: testUnitId,
          code,
          name: "GHE Histórico Completo",
          description: "Teste de histórico",
        });

        const gheId = gheResult[0].id;

        // Fazer múltiplas edições
        await updateGHE(gheId, { name: "Primeira Edição" });
        await updateGHE(gheId, { name: "Segunda Edição" });
        await updateGHE(gheId, { description: "Nova descrição" });

        const auditLog = await getGHEAuditLog(gheId);

        // Deve ter CREATE + 3 UPDATEs
        expect(auditLog.length).toBeGreaterThanOrEqual(4);

        const createLogs = auditLog.filter(
          (log: any) => log.action === "CREATE"
        );
        const updateLogs = auditLog.filter(
          (log: any) => log.action === "UPDATE"
        );

        expect(createLogs.length).toBe(1);
        expect(updateLogs.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe("Bulk Operations", () => {
      it("deve permitir deletar múltiplos GHEs sequencialmente", async () => {
        const gheIds = [];

        // Criar 3 GHEs
        for (let i = 0; i < 3; i++) {
          const result = await createGHE({
            unitId: testUnitId,
            code: `GHE-BULK-${Date.now()}-${i}`,
            name: `GHE Bulk ${i}`,
            description: "Teste de bulk delete",
          });
          gheIds.push(result[0].id);
        }

        // Deletar todos
        for (const gheId of gheIds) {
          await deleteGHE(gheId);
        }

        // Verificar que foram deletados
        for (const gheId of gheIds) {
          const auditLog = await getGHEAuditLog(gheId);
          const deleteLog = auditLog.find(
            (log: any) => log.action === "DELETE"
          );
          expect(deleteLog).toBeDefined();
        }
      });

      it("deve registrar auditoria para cada GHE deletado em bulk", async () => {
        const gheIds = [];

        // Criar 2 GHEs
        for (let i = 0; i < 2; i++) {
          const result = await createGHE({
            unitId: testUnitId,
            code: `GHE-BULK-AUDIT-${Date.now()}-${i}`,
            name: `GHE Bulk Audit ${i}`,
            description: "Teste de auditoria em bulk",
          });
          gheIds.push(result[0].id);
        }

        // Deletar todos
        for (const gheId of gheIds) {
          await deleteGHE(gheId);
        }

        // Verificar auditoria para cada um
        for (const gheId of gheIds) {
          const auditLog = await getGHEAuditLog(gheId);
          expect(auditLog.length).toBeGreaterThanOrEqual(2); // CREATE + DELETE
        }
      });
    });
  }
);
