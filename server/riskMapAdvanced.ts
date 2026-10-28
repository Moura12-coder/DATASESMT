import { getDb } from "./db";
import {
  riskMapAreas,
  riskMapAreaHistory,
  riskMapAlerts,
  riskMapComparisons,
} from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * PHASE 1: Drag & Drop Support
 * Save area position changes with history
 */
export async function updateAreaPositionWithHistory(
  areaId: number,
  x: number,
  y: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current position for history
  const currentArea = await db.query.riskMapAreas.findFirst({
    where: eq(riskMapAreas.id, areaId),
  });

  if (!currentArea) {
    throw new Error("Area not found");
  }

  // Update area position
  await db
    .update(riskMapAreas)
    .set({
      coordinates: {
        ...((currentArea.coordinates || {}) as Record<string, unknown>),
        x,
        y,
      },
      updatedAt: new Date(),
    })
    .where(eq(riskMapAreas.id, areaId));

  // Record in history
  await db.insert(riskMapAreaHistory).values({
    areaId,
    changeType: "position_update",
    oldValue: JSON.stringify({
      x: (currentArea.coordinates as { x?: number } | null)?.x ?? 0,
      y: (currentArea.coordinates as { y?: number } | null)?.y ?? 0,
    }),
    newValue: JSON.stringify({ x, y }),
    changedBy: userId,
    changedAt: new Date(),
  });
}

/**
 * PHASE 2: Inline Editing
 * Edit area name with history
 */
export async function updateAreaNameWithHistory(
  areaId: number,
  newName: string,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current name for history
  const currentArea = await db.query.riskMapAreas.findFirst({
    where: eq(riskMapAreas.id, areaId),
  });

  if (!currentArea) {
    throw new Error("Area not found");
  }

  // Update area name
  await db
    .update(riskMapAreas)
    .set({
      name: newName,
      updatedAt: new Date(),
    })
    .where(eq(riskMapAreas.id, areaId));

  // Record in history
  await db.insert(riskMapAreaHistory).values({
    areaId,
    changeType: "name_update",
    oldValue: currentArea.name,
    newValue: newName,
    changedBy: userId,
    changedAt: new Date(),
  });
}

/**
 * PHASE 5: History & Rollback
 * Get area change history
 */
export async function getAreaChangeHistory(areaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const history = await db.query.riskMapAreaHistory.findMany({
    where: eq(riskMapAreaHistory.areaId, areaId),
    orderBy: desc(riskMapAreaHistory.changedAt),
  });

  return history;
}

/**
 * PHASE 4: Real-time Alerts
 * Create risk alert when risk level changes
 */
export async function createRiskAlert(
  areaId: number,
  riskLevel: "toleravel" | "moderado" | "substancial" | "intoleravel",
  message: string,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const area = await db.query.riskMapAreas.findFirst({
    where: eq(riskMapAreas.id, areaId),
  });

  if (!area) {
    throw new Error("Area not found");
  }

  const severity =
    riskLevel === "intoleravel"
      ? "high"
      : riskLevel === "substancial"
        ? "medium"
        : "low";

  const alert = await db.insert(riskMapAlerts).values({
    areaId,
    unitId: area.unitId,
    oldRiskLevel: area.riskLevel,
    newRiskLevel: riskLevel,
    severity,
    createdBy: userId,
    acknowledged: false,
    createdAt: new Date(),
  });

  return alert;
}

/**
 * Get unread alerts
 */
export async function getRiskAlerts(areaId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const alerts = await db.query.riskMapAlerts.findMany({
    where: areaId ? eq(riskMapAlerts.areaId, areaId) : undefined,
    orderBy: desc(riskMapAlerts.createdAt),
  });

  return alerts;
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(riskMapAlerts)
    .set({
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    })
    .where(eq(riskMapAlerts.id, alertId));
}

/**
 * PHASE 6: Rollback to Previous Version
 * Revert area to a previous state
 */
export async function rollbackToVersion(
  areaId: number,
  versionId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const history = await db.query.riskMapAreaHistory.findFirst({
    where: and(
      eq(riskMapAreaHistory.id, versionId),
      eq(riskMapAreaHistory.areaId, areaId)
    ),
  });

  if (!history) {
    throw new Error("Version not found");
  }

  const currentArea = await db.query.riskMapAreas.findFirst({
    where: eq(riskMapAreas.id, areaId),
  });

  if (!currentArea) {
    throw new Error("Area not found");
  }

  let oldValues: { name?: string; coordinates?: unknown };
  if (history.changeType === "name_update")
    oldValues = { name: history.oldValue || currentArea.name };
  else if (history.changeType === "position_update")
    oldValues = {
      coordinates: {
        ...((currentArea.coordinates || {}) as Record<string, unknown>),
        ...JSON.parse(history.oldValue || "{}"),
      },
    };
  else
    throw new Error("Este tipo de alteração não permite reversão automática");
  await db
    .update(riskMapAreas)
    .set({ ...oldValues, updatedAt: new Date() })
    .where(eq(riskMapAreas.id, areaId));

  // Record rollback in history
  await db.insert(riskMapAreaHistory).values({
    areaId,
    changeType: "rollback",
    oldValue: JSON.stringify(currentArea),
    newValue: JSON.stringify(oldValues),
    changedBy: userId,
    changedAt: new Date(),
  });
}

/**
 * PHASE 7: Period Comparison
 * Compare risk map between two time periods
 */
export async function compareRiskMapPeriods(
  startDate1: Date,
  endDate1: Date,
  startDate2: Date,
  endDate2: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const period1Changes = await db.query.riskMapAreaHistory.findMany({
    where: and(
      gte(riskMapAreaHistory.changedAt, startDate1),
      lte(riskMapAreaHistory.changedAt, endDate1)
    ),
    orderBy: desc(riskMapAreaHistory.changedAt),
  });

  const period2Changes = await db.query.riskMapAreaHistory.findMany({
    where: and(
      gte(riskMapAreaHistory.changedAt, startDate2),
      lte(riskMapAreaHistory.changedAt, endDate2)
    ),
    orderBy: desc(riskMapAreaHistory.changedAt),
  });

  return {
    period1: {
      start: startDate1,
      end: endDate1,
      totalChanges: period1Changes.length,
      changesByType: {
        position_update: period1Changes.filter(
          (h: any) => h.changeType === "position_update"
        ).length,
        name_update: period1Changes.filter(
          (h: any) => h.changeType === "name_update"
        ).length,
        risk_update: period1Changes.filter(
          (h: any) => h.changeType === "risk_update"
        ).length,
      },
    },
    period2: {
      start: startDate2,
      end: endDate2,
      totalChanges: period2Changes.length,
      changesByType: {
        position_update: period2Changes.filter(
          (h: any) => h.changeType === "position_update"
        ).length,
        name_update: period2Changes.filter(
          (h: any) => h.changeType === "name_update"
        ).length,
        risk_update: period2Changes.filter(
          (h: any) => h.changeType === "risk_update"
        ).length,
      },
    },
    differences: {
      totalChangesDifference: period2Changes.length - period1Changes.length,
      changesByTypeDifference: {
        position_update:
          period2Changes.filter((h: any) => h.changeType === "position_update")
            .length -
          period1Changes.filter((h: any) => h.changeType === "position_update")
            .length,
        name_update:
          period2Changes.filter((h: any) => h.changeType === "name_update")
            .length -
          period1Changes.filter((h: any) => h.changeType === "name_update")
            .length,
        risk_update:
          period2Changes.filter((h: any) => h.changeType === "risk_update")
            .length -
          period1Changes.filter((h: any) => h.changeType === "risk_update")
            .length,
      },
    },
  };
}

/**
 * Get comparison data for display
 */
export async function getRiskMapComparison(comparisonId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const comparison = await db.query.riskMapComparisons.findFirst({
    where: eq(riskMapComparisons.id, comparisonId),
  });

  return comparison;
}

/**
 * Save comparison for later reference
 */
export async function saveRiskMapComparison(
  period1Start: Date,
  period1End: Date,
  period2Start: Date,
  period2End: Date,
  comparisonData: unknown,
  unitId: number,
  createdBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(riskMapComparisons).values({
    period1Start,
    period1End,
    period2Start,
    period2End,
    unitId,
    createdBy,
    comparisonData,
    createdAt: new Date(),
  });

  return result;
}

/**
 * Placeholder for generating a risk analysis report.
 */
export async function generateRiskAnalysisReport(
  unitId: number,
  period1Start: Date,
  period1End: Date,
  period2Start: Date,
  period2End: Date
) {
  if (period1Start > period1End || period2Start > period2End)
    throw new Error("Período inválido");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const areas = await db
    .select()
    .from(riskMapAreas)
    .where(eq(riskMapAreas.unitId, unitId));
  const rows = await db
    .select({ history: riskMapAreaHistory })
    .from(riskMapAreaHistory)
    .innerJoin(riskMapAreas, eq(riskMapAreaHistory.areaId, riskMapAreas.id))
    .where(
      and(
        eq(riskMapAreas.unitId, unitId),
        gte(riskMapAreaHistory.changedAt, period1Start),
        lte(riskMapAreaHistory.changedAt, period1End)
      )
    );
  const changes = rows.map(row => row.history);
  return {
    unitId,
    period: { start: period1Start, end: period1End },
    totalAreas: areas.length,
    totalChanges: changes.length,
    changesByType: {
      position_update: changes.filter(h => h.changeType === "position_update")
        .length,
      name_update: changes.filter(h => h.changeType === "name_update").length,
      risk_update: changes.filter(h => h.changeType === "risk_update").length,
    },
    areas: areas.map(area => ({
      id: area.id,
      name: area.name,
      riskLevel: area.riskLevel,
      changes: changes.filter(h => h.areaId === area.id).length,
    })),
    generatedAt: new Date(),
  };
}

export async function getUnitAlerts(
  unitId: number,
  limit = 100,
  severity?: "low" | "medium" | "high"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(riskMapAlerts)
    .where(
      and(
        eq(riskMapAlerts.unitId, unitId),
        ...(severity ? [eq(riskMapAlerts.severity, severity)] : [])
      )
    )
    .orderBy(desc(riskMapAlerts.createdAt))
    .limit(limit);
}
