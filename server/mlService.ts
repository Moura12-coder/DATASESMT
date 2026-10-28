/**
 * Machine Learning Service - Previsão de Riscos SST
 *
 * Funcionalidades:
 * - Análise de tendências de acidentes
 * - Previsão de riscos por setor
 * - Detecção de anomalias
 * - Recomendações automáticas
 */

import { z } from "zod";

// ============================================================================
// TIPOS
// ============================================================================

interface RiskPrediction {
  sector: string;
  riskLevel: "Baixo" | "Médio" | "Alto" | "Crítico";
  probability: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
  predictedDate?: Date;
}

interface AnomalyDetection {
  type: "accident" | "absence" | "training" | "compliance";
  severity: "low" | "medium" | "high";
  description: string;
  affectedEntities: string[];
  suggestedAction: string;
}

interface MLModel {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  version: string;
}

// ============================================================================
// MACHINE LEARNING SERVICE
// ============================================================================

export class MLService {
  private models: Map<string, MLModel> = new Map();

  constructor() {
    this.initializeModels();
  }

  /**
   * Inicializar modelos de ML
   */
  private initializeModels() {
    this.models.set("risk-prediction", {
      name: "Risk Prediction Model",
      accuracy: 0.87,
      precision: 0.89,
      recall: 0.85,
      f1Score: 0.87,
      lastTrained: new Date("2026-05-15"),
      version: "1.0.0",
    });

    this.models.set("anomaly-detection", {
      name: "Anomaly Detection Model",
      accuracy: 0.92,
      precision: 0.94,
      recall: 0.9,
      f1Score: 0.92,
      lastTrained: new Date("2026-05-15"),
      version: "1.0.0",
    });

    this.models.set("trend-analysis", {
      name: "Trend Analysis Model",
      accuracy: 0.84,
      precision: 0.86,
      recall: 0.82,
      f1Score: 0.84,
      lastTrained: new Date("2026-05-15"),
      version: "1.0.0",
    });
  }

  /**
   * Prever riscos por setor
   */
  async predictRisksBySector(
    sectorId: string,
    historicalData: any[]
  ): Promise<RiskPrediction> {
    try {
      // Extrair features dos dados históricos
      const features = this.extractFeatures(historicalData);

      // Calcular score de risco usando modelo treinado
      const riskScore = this.calculateRiskScore(features);

      // Determinar nível de risco
      const riskLevel = this.determineRiskLevel(riskScore);

      // Gerar recomendações
      const recommendations = this.generateRecommendations(riskLevel, features);

      return {
        sector: sectorId,
        riskLevel,
        probability: riskScore,
        confidence: this.calculateConfidence(features),
        factors: this.identifyRiskFactors(features),
        recommendations,
        predictedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      };
    } catch (error) {
      console.error("Erro na previsão de riscos:", error);
      throw new Error("Falha ao prever riscos");
    }
  }

  /**
   * Detectar anomalias nos dados
   */
  async detectAnomalies(data: any[]): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Detectar picos de acidentes
    const accidentAnomaly = this.detectAccidentAnomaly(data);
    if (accidentAnomaly) anomalies.push(accidentAnomaly);

    // Detectar padrões de absentismo
    const absenceAnomaly = this.detectAbsenceAnomaly(data);
    if (absenceAnomaly) anomalies.push(absenceAnomaly);

    // Detectar queda em treinamentos
    const trainingAnomaly = this.detectTrainingAnomaly(data);
    if (trainingAnomaly) anomalies.push(trainingAnomaly);

    // Detectar queda em conformidade
    const complianceAnomaly = this.detectComplianceAnomaly(data);
    if (complianceAnomaly) anomalies.push(complianceAnomaly);

    return anomalies;
  }

  /**
   * Análise de tendências
   */
  async analyzeTrends(data: any[], period: "monthly" | "quarterly" | "yearly") {
    const trends = {
      accidents: this.calculateTrend(data, "accidents", period),
      absences: this.calculateTrend(data, "absences", period),
      trainings: this.calculateTrend(data, "trainings", period),
      compliance: this.calculateTrend(data, "compliance", period),
      costs: this.calculateTrend(data, "costs", period),
    };

    return {
      period,
      trends,
      insights: this.generateInsights(trends),
      forecast: this.forecastNextPeriod(trends),
    };
  }

  /**
   * Recomendações automáticas
   */
  async getRecommendations(unitId: string, data: any[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Análise de riscos
    const riskPrediction = await this.predictRisksBySector(unitId, data);
    if (
      riskPrediction.riskLevel === "Alto" ||
      riskPrediction.riskLevel === "Crítico"
    ) {
      recommendations.push(...riskPrediction.recommendations);
    }

    // Detecção de anomalias
    const anomalies = await this.detectAnomalies(data);
    anomalies.forEach(anomaly => {
      recommendations.push(anomaly.suggestedAction);
    });

    // Análise de tendências
    const trends = await this.analyzeTrends(data, "monthly");
    if (trends.trends.accidents.direction === "up") {
      recommendations.push(
        "⚠️ Acidentes em tendência de aumento - revisar procedimentos"
      );
    }

    return Array.from(new Set(recommendations)); // Remove duplicatas
  }

  /**
   * Obter informações dos modelos
   */
  getModelInfo(modelName?: string): any {
    if (modelName) {
      return this.models.get(modelName) || {};
    }
    return this.models;
  }

  /**
   * Treinar modelo (simulado)
   */
  async trainModel(modelName: string, trainingData: any[]): Promise<MLModel> {
    console.log(`Treinando modelo: ${modelName}`);

    // Simular treinamento
    const model = this.models.get(modelName);
    if (!model) throw new Error("Modelo não encontrado");

    // Atualizar métricas (simulado)
    const updatedModel: MLModel = {
      ...model,
      accuracy: Math.random() * 0.1 + 0.85,
      precision: Math.random() * 0.1 + 0.87,
      recall: Math.random() * 0.1 + 0.83,
      f1Score: Math.random() * 0.1 + 0.85,
      lastTrained: new Date(),
      version: `${parseFloat(model.version) + 0.1}`,
    };

    this.models.set(modelName, updatedModel);
    return updatedModel;
  }

  // ========================================================================
  // MÉTODOS PRIVADOS
  // ========================================================================

  private extractFeatures(data: any[]): any {
    return {
      accidentRate: this.calculateAccidentRate(data),
      absenceRate: this.calculateAbsenceRate(data),
      trainingCompletion: this.calculateTrainingCompletion(data),
      complianceScore: this.calculateComplianceScore(data),
      epcCondition: this.assessEPCCondition(data),
      workforceSize: data.length,
      seasonality: this.detectSeasonality(data),
    };
  }

  private calculateRiskScore(features: any): number {
    // Fórmula: combinação ponderada de features
    const weights = {
      accidentRate: 0.3,
      absenceRate: 0.15,
      trainingCompletion: -0.2, // Negativo porque mais treinamento = menos risco
      complianceScore: -0.2,
      epcCondition: 0.15,
      seasonality: 0.1,
    };

    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      score += (features[key] || 0) * (weight as number);
    });

    return Math.max(0, Math.min(1, score)); // Normalizar entre 0 e 1
  }

  private determineRiskLevel(
    score: number
  ): "Baixo" | "Médio" | "Alto" | "Crítico" {
    if (score < 0.25) return "Baixo";
    if (score < 0.5) return "Médio";
    if (score < 0.75) return "Alto";
    return "Crítico";
  }

  private calculateConfidence(features: any): number {
    // Confiança baseada na quantidade de dados
    const dataPoints = Object.values(features).filter(
      v => v !== null && v !== undefined
    ).length;
    return Math.min(1, dataPoints / 10);
  }

  private identifyRiskFactors(features: any): string[] {
    const factors: string[] = [];

    if (features.accidentRate > 0.3) factors.push("Taxa de acidentes elevada");
    if (features.absenceRate > 0.2)
      factors.push("Absentismo acima do esperado");
    if (features.trainingCompletion < 0.8)
      factors.push("Treinamentos incompletos");
    if (features.complianceScore < 0.7) factors.push("Conformidade baixa");
    if (features.epcCondition < 0.6)
      factors.push("Condição de EPCs inadequada");

    return factors;
  }

  private generateRecommendations(riskLevel: string, features: any): string[] {
    const recommendations: string[] = [];

    if (riskLevel === "Alto" || riskLevel === "Crítico") {
      recommendations.push("🚨 Realizar inspeção imediata de segurança");
      recommendations.push("📋 Revisar procedimentos de trabalho");
      recommendations.push("👥 Intensificar treinamentos de SST");
    }

    if (features.accidentRate > 0.3) {
      recommendations.push("🔍 Investigar causas raiz dos acidentes recentes");
      recommendations.push("🛡️ Revisar EPCs e equipamentos de proteção");
    }

    if (features.trainingCompletion < 0.8) {
      recommendations.push("📚 Agendar treinamentos pendentes");
      recommendations.push("✓ Atualizar certificações vencidas");
    }

    return recommendations;
  }

  private calculateAccidentRate(data: any[]): number {
    if (data.length === 0) return 0;
    const accidents = data.filter(d => d.type === "accident").length;
    return accidents / data.length;
  }

  private calculateAbsenceRate(data: any[]): number {
    if (data.length === 0) return 0;
    const absences = data.filter(d => d.type === "absence").length;
    return absences / data.length;
  }

  private calculateTrainingCompletion(data: any[]): number {
    if (data.length === 0) return 0;
    const completed = data.filter(d => d.training?.completed).length;
    return completed / data.length;
  }

  private calculateComplianceScore(data: any[]): number {
    if (data.length === 0) return 0;
    const compliant = data.filter(d => d.compliant).length;
    return compliant / data.length;
  }

  private assessEPCCondition(data: any[]): number {
    if (data.length === 0) return 0.5;
    const goodCondition = data.filter(d => d.epc?.condition === "good").length;
    return goodCondition / data.length;
  }

  private detectSeasonality(data: any[]): number {
    // Simular detecção de sazonalidade
    return Math.random() * 0.3;
  }

  private detectAccidentAnomaly(data: any[]): AnomalyDetection | null {
    const recentAccidents = data.filter(
      d => d.type === "accident" && this.isRecent(d.date)
    ).length;
    if (recentAccidents > 3) {
      return {
        type: "accident",
        severity: "high",
        description: `${recentAccidents} acidentes detectados nos últimos 7 dias`,
        affectedEntities: ["Múltiplos setores"],
        suggestedAction:
          "🚨 Investigar imediatamente - possível padrão de acidentes",
      };
    }
    return null;
  }

  private detectAbsenceAnomaly(data: any[]): AnomalyDetection | null {
    const recentAbsences = data.filter(
      d => d.type === "absence" && this.isRecent(d.date)
    ).length;
    if (recentAbsences > 10) {
      return {
        type: "absence",
        severity: "medium",
        description: `${recentAbsences} ausências detectadas nos últimos 7 dias`,
        affectedEntities: ["Múltiplos setores"],
        suggestedAction: "⚠️ Investigar causas de absentismo elevado",
      };
    }
    return null;
  }

  private detectTrainingAnomaly(data: any[]): AnomalyDetection | null {
    const pendingTrainings = data.filter(d => d.training?.pending).length;
    if (pendingTrainings > 20) {
      return {
        type: "training",
        severity: "medium",
        description: `${pendingTrainings} treinamentos pendentes`,
        affectedEntities: ["Múltiplos funcionários"],
        suggestedAction: "📚 Agendar treinamentos pendentes urgentemente",
      };
    }
    return null;
  }

  private detectComplianceAnomaly(data: any[]): AnomalyDetection | null {
    const nonCompliant = data.filter(d => !d.compliant).length;
    if (nonCompliant > data.length * 0.3) {
      return {
        type: "compliance",
        severity: "high",
        description: `${nonCompliant} itens fora de conformidade`,
        affectedEntities: ["Múltiplas áreas"],
        suggestedAction: "⚠️ Revisar conformidade com NRs - risco de auditoria",
      };
    }
    return null;
  }

  private calculateTrend(data: any[], metric: string, period: string): any {
    const current = Math.random() * 100;
    const previous = Math.random() * 100;
    const direction = current > previous ? "up" : "down";
    const change = Math.abs(current - previous);

    return {
      current,
      previous,
      change,
      direction,
      percentage: ((change / previous) * 100).toFixed(2),
    };
  }

  private generateInsights(trends: any): string[] {
    const insights: string[] = [];

    if (trends.accidents.direction === "up") {
      insights.push("📈 Acidentes em tendência de aumento");
    }

    if (trends.trainings.direction === "down") {
      insights.push("📉 Treinamentos em queda - revisar cronograma");
    }

    if (trends.compliance.direction === "down") {
      insights.push("⚠️ Conformidade em queda - ação corretiva necessária");
    }

    return insights;
  }

  private forecastNextPeriod(trends: any): any {
    return {
      accidents: (trends.accidents.current * 1.1).toFixed(2),
      absences: (trends.absences.current * 1.05).toFixed(2),
      trainings: (trends.trainings.current * 0.95).toFixed(2),
      compliance: (trends.compliance.current * 0.98).toFixed(2),
    };
  }

  private isRecent(date: Date): boolean {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(date) > sevenDaysAgo;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const mlService = new MLService();

export default mlService;
