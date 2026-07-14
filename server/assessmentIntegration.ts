/**
 * Assessment Integration Module
 * Handles linking and retrieving environmental assessments for SST documents
 */

import { getDb } from "./db";
import { eq, and } from "drizzle-orm";
import {
  sstDocumentAssessmentLinks,
  environmentalAssessments,
  sstDocuments,
} from "../drizzle/schema";

// ─── GET ASSESSMENTS BY UNIT ──────────────────────────────────────────────────
export async function getAssessmentsByUnit(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const assessments = await db
    .select()
    .from(environmentalAssessments)
    .where(eq(environmentalAssessments.unitId, unitId));

  return assessments;
}

// ─── GET ASSESSMENTS BY AGENT TYPE ───────────────────────────────────────────
export async function getAssessmentsByAgentType(unitId: number, agentType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const assessments = await db
    .select()
    .from(environmentalAssessments)
    .where(
      and(
        eq(environmentalAssessments.unitId, unitId),
        eq(environmentalAssessments.agentType, agentType)
      )
    );

  return assessments;
}

// ─── GET ASSESSMENTS BY DATE RANGE ───────────────────────────────────────────
export async function getAssessmentsByDateRange(
  unitId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const assessments = await db
    .select()
    .from(environmentalAssessments)
    .where(
      and(
        eq(environmentalAssessments.unitId, unitId),
        // @ts-ignore - Date comparison in Drizzle
        environmentalAssessments.date >= startDate,
        // @ts-ignore - Date comparison in Drizzle
        environmentalAssessments.date <= endDate
      )
    );

  return assessments;
}

// ─── GET ASSESSMENTS BY STATUS ───────────────────────────────────────────────
export async function getAssessmentsByStatus(unitId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const assessments = await db
    .select()
    .from(environmentalAssessments)
    .where(
      and(
        eq(environmentalAssessments.unitId, unitId),
        eq(environmentalAssessments.status, status)
      )
    );

  return assessments;
}

// ─── LINK ASSESSMENT TO DOCUMENT ─────────────────────────────────────────────
export async function linkAssessmentToDocument(
  documentId: number,
  assessmentId: number,
  linkType: "Fonte de Dados" | "Referência" | "Comprovação" | "Histórico",
  notes?: string,
  userId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db.insert(sstDocumentAssessmentLinks).values({
    documentId,
    assessmentId,
    linkType,
    notes: notes || null,
    createdBy: userId || 0,
  });

  return result;
}

// ─── UNLINK ASSESSMENT FROM DOCUMENT ─────────────────────────────────────────
export async function unlinkAssessmentFromDocument(
  documentId: number,
  assessmentId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .delete(sstDocumentAssessmentLinks)
    .where(
      and(
        eq(sstDocumentAssessmentLinks.documentId, documentId),
        eq(sstDocumentAssessmentLinks.assessmentId, assessmentId)
      )
    );

  return result;
}

// ─── GET LINKED ASSESSMENTS FOR DOCUMENT ─────────────────────────────────────
export async function getLinkedAssessmentsForDocument(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const links = await db
    .select()
    .from(sstDocumentAssessmentLinks)
    .where(eq(sstDocumentAssessmentLinks.documentId, documentId));

  // Fetch full assessment data for each link
  const assessmentsWithData = await Promise.all(
    links.map(async (link) => {
      const assessment = await db
        .select()
        .from(environmentalAssessments)
        .where(eq(environmentalAssessments.id, link.assessmentId))
        .limit(1);

      return {
        link,
        assessment: assessment[0],
      };
    })
  );

  return assessmentsWithData;
}

// ─── GET DOCUMENTS LINKED TO ASSESSMENT ──────────────────────────────────────
export async function getDocumentsLinkedToAssessment(assessmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const links = await db
    .select()
    .from(sstDocumentAssessmentLinks)
    .where(eq(sstDocumentAssessmentLinks.assessmentId, assessmentId));

  // Fetch full document data for each link
  const documentsWithData = await Promise.all(
    links.map(async (link) => {
      const document = await db
        .select()
        .from(sstDocuments)
        .where(eq(sstDocuments.id, link.documentId))
        .limit(1);

      return {
        link,
        document: document[0],
      };
    })
  );

  return documentsWithData;
}

// ─── GET ASSESSMENT SUMMARY FOR DOCUMENT GENERATION ──────────────────────────
export async function getAssessmentSummaryForDocument(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Group assessments by agent type and get latest measurements
  const assessments = await db
    .select()
    .from(environmentalAssessments)
    .where(eq(environmentalAssessments.unitId, unitId));

  // Group by agent type
  const grouped = assessments.reduce(
    (acc, assessment) => {
      if (!acc[assessment.agentType]) {
        acc[assessment.agentType] = [];
      }
      acc[assessment.agentType].push(assessment);
      return acc;
    },
    {} as Record<string, typeof assessments>
  );

  // Get latest for each agent
  const summary = Object.entries(grouped).map(([agentType, items]) => {
    const latest = items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    const conformCount = items.filter((i) => i.status === "Conforme").length;
    const nonConformCount = items.filter((i) => i.status === "Não Conforme")
      .length;
    const attentionCount = items.filter((i) => i.status === "Atenção").length;

    return {
      agentType,
      latestAssessment: latest,
      totalMeasurements: items.length,
      conformCount,
      nonConformCount,
      attentionCount,
      riskLevel:
        nonConformCount > 0 ? "Alto" : attentionCount > 0 ? "Médio" : "Baixo",
    };
  });

  return summary;
}

// ─── GENERATE PGR DATA FROM ASSESSMENTS ──────────────────────────────────────
export async function generatePgrDataFromAssessments(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const assessments = await getAssessmentsByUnit(unitId);
  const summary = await getAssessmentSummaryForDocument(unitId);

  // Build inventory of risks from assessments
  const inventoryOfRisks = summary
    .map(
      (item) =>
        `${item.agentType}: ${item.latestAssessment?.agentName || "N/A"} - Status: ${item.latestAssessment?.status || "N/A"} - Medição: ${item.latestAssessment?.measurementValue} ${item.latestAssessment?.unit || ""}`
    )
    .join("\n");

  // Build action plan based on non-conformities
  const nonConformAssessments = assessments.filter(
    (a) => a.status === "Não Conforme"
  );
  const actionPlan =
    nonConformAssessments.length > 0
      ? `Implementar medidas de controle para os seguintes agentes:\n${nonConformAssessments.map((a) => `- ${a.agentName}: ${a.notes || "Sem notas"}`).join("\n")}`
      : "Todas as avaliações estão conformes. Manter monitoramento periódico.";

  return {
    inventoryOfRisks,
    actionPlan,
    assessmentCount: assessments.length,
    lastAssessmentDate: assessments.length > 0 ? assessments[0].date : null,
  };
}

// ─── GENERATE PCMSO DATA FROM ASSESSMENTS ────────────────────────────────────
export async function generatePcmsoDataFromAssessments(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const assessments = await getAssessmentsByUnit(unitId);
  const summary = await getAssessmentSummaryForDocument(unitId);

  // Identify risk factors
  const riskFactors = summary
    .filter((item) => item.riskLevel !== "Baixo")
    .map((item) => item.agentType)
    .join(", ");

  // Recommend exams based on risk factors
  const examsRequired: string[] = [];
  if (riskFactors.includes("Químico")) {
    examsRequired.push("Espirometria", "Audiometria");
  }
  if (riskFactors.includes("Físico")) {
    examsRequired.push("Audiometria", "Oftalmologia");
  }
  if (riskFactors.includes("Biológico")) {
    examsRequired.push("Sorologia", "Hemograma");
  }
  if (riskFactors.includes("Ergonômico")) {
    examsRequired.push("Avaliação Postural", "Ressonância Magnética");
  }

  return {
    riskFactorsIdentified: riskFactors || "Nenhum fator de risco identificado",
    examsRequired: examsRequired.length > 0 ? examsRequired : ["Exame Clínico"],
    assessmentCount: assessments.length,
  };
}

// ─── GENERATE LTCAT DATA FROM ASSESSMENTS ───────────────────────────────────
export async function generateLtcatDataFromAssessments(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const assessments = await getAssessmentsByUnit(unitId);
  const summary = await getAssessmentSummaryForDocument(unitId);

  // Identify special activities
  const specialActivities = summary
    .filter((item) => item.riskLevel !== "Baixo")
    .map((item) => item.agentType)
    .filter((type) => ["Químico", "Biológico", "Físico"].includes(type));

  // Identify exposure factors
  const exposureFactors = assessments
    .map((a) => `${a.agentName}: ${a.measurementValue} ${a.unit}`)
    .join("; ");

  // Determine if special retirement is needed
  const conclusionSpecialRetirement = assessments.some(
    (a) => a.status === "Não Conforme"
  );

  return {
    specialActivities: specialActivities.length > 0 ? specialActivities : [],
    exposureFactors: exposureFactors || "Sem exposição identificada",
    conclusionSpecialRetirement,
    assessmentCount: assessments.length,
  };
}

// ─── GENERATE LTIP DATA FROM ASSESSMENTS ────────────────────────────────────
export async function generateLtipDataFromAssessments(unitId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const assessments = await getAssessmentsByUnit(unitId);

  // Calculate insalubrity level
  const nonConformCount = assessments.filter(
    (a) => a.status === "Não Conforme"
  ).length;
  const attentionCount = assessments.filter((a) => a.status === "Atenção").length;

  let insalubrityLevel = "Nenhum";
  let insalubrityPercentage = 0;

  if (nonConformCount > 0) {
    insalubrityLevel = "Máximo";
    insalubrityPercentage = 40;
  } else if (attentionCount > 0) {
    insalubrityLevel = "Médio";
    insalubrityPercentage = 20;
  }

  // Check for danger (periculosidade)
  const dangerPresent = assessments.some(
    (a) => a.agentType === "Físico" && a.status === "Não Conforme"
  );

  return {
    insalubrityLevel,
    insalubrityPercentage,
    dangerLevel: dangerPresent ? "Presente" : "Ausente",
    dangerPercentage: dangerPresent ? 30 : 0,
    assessmentCount: assessments.length,
  };
}
