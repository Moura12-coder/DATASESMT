import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, and } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import { getDb } from "./db";
import * as core from "./phase1Features";
import * as complete from "./phase1Complete";
import { registerUser, loginUser, resetPassword } from "./emailAuth";
import {
  companyUnits,
  employees,
  sectors,
  ghe,
  environmentalAssessments,
  technicalReports,
  technicalReportsHistory,
  leaveOfAbsence,
  esocialEvents,
  users,
} from "../drizzle/schema";

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "Persistent SST workflows",
  () => {
    let unitId: number, workerId: number, groupId: number, reportId: number;
    const email = `integration-${randomUUID()}@example.test`;
    beforeAll(async () => {
      const db = (await getDb())!;
      const [unit] = await db
        .insert(companyUnits)
        .values({ name: "Isolated persistence fixture" });
      unitId = unit.insertId;
      const [worker] = await db
        .insert(employees)
        .values({ unitId, name: "Isolated Worker" });
      workerId = worker.insertId;
      const group = await complete.createGHE(
        unitId,
        `PERSIST-${randomUUID().slice(0, 8)}`,
        "Isolated Group"
      );
      groupId = group.id;
    });
    afterAll(async () => {
      const db = (await getDb())!;
      await db.delete(users).where(eq(users.email, email));
      if (reportId) {
        await db
          .delete(technicalReportsHistory)
          .where(eq(technicalReportsHistory.reportId, reportId));
        await db
          .delete(technicalReports)
          .where(eq(technicalReports.id, reportId));
      }
      await db
        .delete(environmentalAssessments)
        .where(eq(environmentalAssessments.unitId, unitId));
      await db
        .delete(leaveOfAbsence)
        .where(eq(leaveOfAbsence.employeeId, workerId));
      await db
        .delete(esocialEvents)
        .where(
          and(
            eq(esocialEvents.referenceType, "unit"),
            eq(esocialEvents.referenceId, unitId)
          )
        );
      await core.deleteGHE(groupId);
      await db.delete(employees).where(eq(employees.id, workerId));
      await db.delete(companyUnits).where(eq(companyUnits.id, unitId));
    });
    it("persists environmental measurements in the GHE's actual unit", async () => {
      const created = await complete.recordEnvironmentalAssessment(
        groupId,
        "Físico",
        "Noise",
        92,
        85,
        "dB",
        new Date(),
        "Integration Author"
      );
      expect(created.id).toBeGreaterThan(0);
      expect(created.unitId).toBe(unitId);
      expect(created.status).toBe("Não Conforme");
      expect(
        (await core.listEnvironmentalAssessments(groupId)).some(
          row => row.id === created.id
        )
      ).toBe(true);
      expect(
        (await complete.generatePPRAReport(unitId)).nonConformingCount
      ).toBe(1);
    });
    it("rejects an environmental measurement for a nonexistent group", async () => {
      await expect(
        complete.recordEnvironmentalAssessment(
          2147483647,
          "Físico",
          "Noise",
          92,
          85,
          "dB",
          new Date()
        )
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
    it("persists a report and its initial version", async () => {
      const record = await core.createTechnicalReport({
        unitId,
        type: "PGR",
        title: "Persistent report",
        author: "Author",
        validFrom: new Date(),
      });
      reportId = record.id;
      expect(record.revision).toBe(1);
      expect(record.validUntil).toBeNull();
      expect(
        (await core.listTechnicalReports(unitId)).some(
          row => row.id === record.id
        )
      ).toBe(true);
      expect((await core.getTechnicalReportHistory(reportId))[0].revision).toBe(
        1
      );
    });
    it("approves once and persists the next revision atomically", async () => {
      const result = await core.approveTechnicalReport(
        reportId,
        "Authorized reviewer"
      );
      expect(result.status).toBe("Aprovado");
      const history = await core.getTechnicalReportHistory(reportId);
      expect(history.map(row => row.revision)).toEqual([2, 1]);
      expect(history[0].approver).toBe("Authorized reviewer");
      await expect(
        core.approveTechnicalReport(reportId, "Another reviewer")
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect((await core.getTechnicalReportHistory(reportId)).length).toBe(2);
    });
    it("persists absences and clips overlapping calendar days", async () => {
      await complete.recordAbsence(
        workerId,
        "CAT",
        new Date("2026-01-01"),
        new Date("2026-01-10"),
        "First absence"
      );
      await complete.recordAbsence(
        workerId,
        "Licença",
        new Date("2026-01-05"),
        new Date("2026-01-12"),
        "Overlapping absence"
      );
      const result = await complete.calculateAbsenceImpact(
        unitId,
        new Date("2026-01-04"),
        new Date("2026-01-08")
      );
      expect(result.totalAbsences).toBe(2);
      expect(result.daysLost).toBe(5);
      expect(result.frequencyRate).toBeNull();
    });
    it("saves eSocial drafts without inventing a receipt or transmission", async () => {
      const event = await complete.sendESocialEvent("S-2240", unitId, {
        workerId,
      });
      expect(event.transmitted).toBe(false);
      const saved = await complete.getESocialEventStatus(event.id);
      expect(saved.status).toBe("Pendente");
      expect(saved.sentAt).toBeNull();
      expect(saved.protocol).toBeNull();
      expect(
        (await complete.getESocialTransmissionHistory(unitId)).some(
          row => row.id === event.id
        )
      ).toBe(true);
    });
    it("does not leak workers from other units into generated report data", async () => {
      const report = await complete.generatePCMSOReport(unitId);
      const data = JSON.parse(report.content);
      expect(data.employees.map((row: { id: number }) => row.id)).toEqual([
        workerId,
      ]);
      expect(report.requiresProfessionalReview).toBe(true);
    });
    it("requires approval and consumes a real reset token once", async () => {
      const account = await registerUser(
        email,
        "initial-password-123",
        "Integration User"
      );
      await expect(
        loginUser(email, "initial-password-123")
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      const db = (await getDb())!;
      const token = "a".repeat(64);
      await db
        .update(users)
        .set({
          registrationStatus: "approved",
          resetToken: createHash("sha256").update(token).digest("hex"),
          resetTokenExpiry: new Date(Date.now() + 60000),
        })
        .where(eq(users.id, account.id));
      await resetPassword(token, "replacement-password-123");
      expect((await loginUser(email, "replacement-password-123")).id).toBe(
        account.id
      );
      await expect(
        resetPassword(token, "second-replacement-123")
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      const [saved] = await db
        .select()
        .from(users)
        .where(eq(users.id, account.id));
      expect(saved.sessionVersion).toBe(1);
      expect(saved.resetToken).toBeNull();
    });
  }
);
