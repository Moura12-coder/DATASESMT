/**
 * GHE Service - Versão Melhorada
 * 
 * Funcionalidades:
 * - CRUD completo (Create, Read, Update, Delete)
 * - Suporte a todos os 5 tipos de risco
 * - Validações robustas
 * - Auditoria de mudanças
 */

// Serviço de GHE - Sem dependências de DB (em memória para testes)

// ============================================================================
// TIPOS
// ============================================================================

export interface ExposureAgent {
  id: string;
  gheId: number;
  agentType: 'Químico' | 'Físico' | 'Biológico' | 'Ergonômico' | 'Acidente';
  agentName: string;
  riskLevel: 'Tolerável' | 'Moderado' | 'Substancial' | 'Intolerável';
  limiteTolerance?: number;
  unit?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GHE {
  id: number;
  unitId: number;
  code: string;
  name: string;
  description?: string;
  exposureAgents: ExposureAgent[];
  employeeCount: number;
  riskLevel: 'Tolerável' | 'Moderado' | 'Substancial' | 'Intolerável';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface GHEAuditLog {
  id: string;
  gheId: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ADD_AGENT' | 'REMOVE_AGENT';
  userId: string;
  changes: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// GHE SERVICE
// ============================================================================

export class GHEService {
  private ghes: Map<number, GHE> = new Map();
  private agents: Map<string, ExposureAgent> = new Map();
  private auditLogs: GHEAuditLog[] = [];
  private nextGHEId = 1;
  private nextAgentId = 1;

  // Validações
  private AGENT_TYPES = ['Químico', 'Físico', 'Biológico', 'Ergonômico', 'Acidente'];
  private RISK_LEVELS = ['Tolerável', 'Moderado', 'Substancial', 'Intolerável'];

  /**
   * Criar novo GHE
   */
  createGHE(
    unitId: number,
    code: string,
    name: string,
    description?: string,
    userId: string = 'system'
  ): GHE {
    // Validações
    if (!code || !name) {
      throw new Error('Código e nome do GHE são obrigatórios');
    }

    if (code.length < 3 || code.length > 20) {
      throw new Error('Código deve ter entre 3 e 20 caracteres');
    }

    if (name.length < 3 || name.length > 100) {
      throw new Error('Nome deve ter entre 3 e 100 caracteres');
    }

    // Verificar duplicata
    const existing = Array.from(this.ghes.values()).find(
      g => g.unitId === unitId && g.code === code && !g.deletedAt
    );

    if (existing) {
      throw new Error(`GHE com código ${code} já existe nesta unidade`);
    }

    const ghe: GHE = {
      id: this.nextGHEId++,
      unitId,
      code,
      name,
      description,
      exposureAgents: [],
      employeeCount: 0,
      riskLevel: 'Tolerável',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ghes.set(ghe.id, ghe);

    // Log de auditoria
    this.logAudit(ghe.id, 'CREATE', userId, { code, name, description });

    console.log(`✅ GHE criado: ${name} (${code})`);

    return ghe;
  }

  /**
   * Obter GHE por ID
   */
  getGHE(gheId: number): GHE | undefined {
    const ghe = this.ghes.get(gheId);
    return ghe && !ghe.deletedAt ? ghe : undefined;
  }

  /**
   * Listar GHEs por unidade
   */
  listGHEs(unitId: number, includeDeleted: boolean = false): GHE[] {
    return Array.from(this.ghes.values()).filter(
      g => g.unitId === unitId && (includeDeleted || !g.deletedAt)
    );
  }

  /**
   * Atualizar GHE
   */
  updateGHE(
    gheId: number,
    updates: Partial<GHE>,
    userId: string = 'system'
  ): GHE {
    const ghe = this.getGHE(gheId);
    if (!ghe) throw new Error(`GHE ${gheId} não encontrado`);

    const changes: Record<string, any> = {};

    if (updates.name && updates.name !== ghe.name) {
      if (updates.name.length < 3 || updates.name.length > 100) {
        throw new Error('Nome deve ter entre 3 e 100 caracteres');
      }
      ghe.name = updates.name;
      changes.name = updates.name;
    }

    if (updates.description !== undefined && updates.description !== ghe.description) {
      ghe.description = updates.description;
      changes.description = updates.description;
    }

    if (Object.keys(changes).length > 0) {
      ghe.updatedAt = new Date();
      this.logAudit(gheId, 'UPDATE', userId, changes);
    }

    return ghe;
  }

  /**
   * Deletar GHE (soft delete)
   */
  deleteGHE(gheId: number, userId: string = 'system'): boolean {
    const ghe = this.getGHE(gheId);
    if (!ghe) return false;

    ghe.deletedAt = new Date();
    ghe.updatedAt = new Date();

    // Deletar agentes associados
    ghe.exposureAgents.forEach(agent => {
      this.agents.delete(agent.id);
    });
    ghe.exposureAgents = [];

    this.logAudit(gheId, 'DELETE', userId, { deletedAt: ghe.deletedAt });

    console.log(`🗑️ GHE deletado: ${ghe.name}`);

    return true;
  }

  /**
   * Restaurar GHE deletado
   */
  restoreGHE(gheId: number, userId: string = 'system'): boolean {
    const ghe = this.ghes.get(gheId);
    if (!ghe || !ghe.deletedAt) return false;

    ghe.deletedAt = undefined;
    ghe.updatedAt = new Date();

    this.logAudit(gheId, 'UPDATE', userId, { restored: true });

    return true;
  }

  /**
   * Adicionar agente de exposição
   */
  addExposureAgent(
    gheId: number,
    agentType: ExposureAgent['agentType'],
    agentName: string,
    riskLevel: ExposureAgent['riskLevel'],
    limiteTolerance?: number,
    unit?: string,
    userId: string = 'system'
  ): ExposureAgent {
    const ghe = this.getGHE(gheId);
    if (!ghe) throw new Error(`GHE ${gheId} não encontrado`);

    // Validações
    if (!this.AGENT_TYPES.includes(agentType)) {
      throw new Error(`Tipo de agente inválido: ${agentType}`);
    }

    if (!this.RISK_LEVELS.includes(riskLevel)) {
      throw new Error(`Nível de risco inválido: ${riskLevel}`);
    }

    if (!agentName || agentName.length < 2) {
      throw new Error('Nome do agente deve ter pelo menos 2 caracteres');
    }

    if (limiteTolerance !== undefined && limiteTolerance < 0) {
      throw new Error('Limite de tolerância não pode ser negativo');
    }

    // Verificar duplicata
    const existing = ghe.exposureAgents.find(
      a => a.agentType === agentType && a.agentName.toLowerCase() === agentName.toLowerCase()
    );

    if (existing) {
      throw new Error(`Agente ${agentName} já existe neste GHE`);
    }

    const agent: ExposureAgent = {
      id: `agent-${Date.now()}-${this.nextAgentId++}`,
      gheId,
      agentType,
      agentName,
      riskLevel,
      limiteTolerance,
      unit,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.agents.set(agent.id, agent);
    ghe.exposureAgents.push(agent);

    // Atualizar nível de risco do GHE
    this.updateGHERiskLevel(gheId);

    this.logAudit(gheId, 'ADD_AGENT', userId, { agentType, agentName, riskLevel });

    console.log(`✅ Agente adicionado: ${agentName} (${agentType})`);

    return agent;
  }

  /**
   * Remover agente de exposição
   */
  removeExposureAgent(gheId: number, agentId: string, userId: string = 'system'): boolean {
    const ghe = this.getGHE(gheId);
    if (!ghe) return false;

    const agent = ghe.exposureAgents.find(a => a.id === agentId);
    if (!agent) return false;

    ghe.exposureAgents = ghe.exposureAgents.filter(a => a.id !== agentId);
    this.agents.delete(agentId);

    // Atualizar nível de risco do GHE
    this.updateGHERiskLevel(gheId);

    this.logAudit(gheId, 'REMOVE_AGENT', userId, { agentId, agentName: agent.agentName });

    console.log(`🗑️ Agente removido: ${agent.agentName}`);

    return true;
  }

  /**
   * Obter agentes de exposição
   */
  getExposureAgents(gheId: number, filterByType?: ExposureAgent['agentType']): ExposureAgent[] {
    const ghe = this.getGHE(gheId);
    if (!ghe) return [];

    let agents = ghe.exposureAgents;

    if (filterByType) {
      agents = agents.filter(a => a.agentType === filterByType);
    }

    return agents;
  }

  /**
   * Atualizar nível de risco do GHE baseado nos agentes
   */
  private updateGHERiskLevel(gheId: number): void {
    const ghe = this.getGHE(gheId);
    if (!ghe) return;

    if (ghe.exposureAgents.length === 0) {
      ghe.riskLevel = 'Tolerável';
      return;
    }

    const levels = ['Tolerável', 'Moderado', 'Substancial', 'Intolerável'];
    let maxLevel = 0;

    ghe.exposureAgents.forEach(agent => {
      const levelIndex = levels.indexOf(agent.riskLevel);
      maxLevel = Math.max(maxLevel, levelIndex);
    });

    ghe.riskLevel = levels[maxLevel] as any;
  }

  /**
   * Agrupar agentes por tipo
   */
  getAgentsByType(gheId: number): Record<string, ExposureAgent[]> {
    const ghe = this.getGHE(gheId);
    if (!ghe) return {};

    const grouped: Record<string, ExposureAgent[]> = {};

    this.AGENT_TYPES.forEach(type => {
      grouped[type] = ghe.exposureAgents.filter(a => a.agentType === type);
    });

    return grouped;
  }

  /**
   * Gerar relatório de GHE
   */
  generateGHEReport(gheId: number): string {
    const ghe = this.getGHE(gheId);
    if (!ghe) return '';

    const grouped = this.getAgentsByType(gheId);

    let report = `
RELATÓRIO DE GHE
================
Data: ${new Date().toLocaleDateString('pt-BR')}

Informações Gerais
==================
Código: ${ghe.code}
Nome: ${ghe.name}
Descrição: ${ghe.description || 'N/A'}
Nível de Risco: ${ghe.riskLevel}
Total de Agentes: ${ghe.exposureAgents.length}
Funcionários: ${ghe.employeeCount}

Agentes de Exposição por Tipo
=============================
    `;

    this.AGENT_TYPES.forEach(type => {
      const agents = grouped[type];
      report += `\n${type}s (${agents.length})\n${'-'.repeat(40)}\n`;

      if (agents.length === 0) {
        report += 'Nenhum agente\n';
      } else {
        agents.forEach(agent => {
          report += `• ${agent.agentName}\n`;
          report += `  Nível: ${agent.riskLevel}\n`;
          if (agent.limiteTolerance) {
            report += `  Limite: ${agent.limiteTolerance} ${agent.unit || ''}\n`;
          }
        });
      }
    });

    report += `\nGerado em: ${new Date().toLocaleString('pt-BR')}\n`;

    return report;
  }

  /**
   * Registrar auditoria
   */
  private logAudit(
    gheId: number,
    action: GHEAuditLog['action'],
    userId: string,
    changes: Record<string, any>
  ): void {
    const log: GHEAuditLog = {
      id: `audit-${Date.now()}`,
      gheId,
      action,
      userId,
      changes,
      timestamp: new Date(),
    };

    this.auditLogs.push(log);
  }

  /**
   * Obter histórico de auditoria
   */
  getAuditHistory(gheId: number, limit: number = 50): GHEAuditLog[] {
    return this.auditLogs
      .filter(log => log.gheId === gheId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Obter estatísticas
   */
  getStatistics(unitId: number) {
    const ghes = this.listGHEs(unitId);
    const allAgents = ghes.flatMap(g => g.exposureAgents);

    const byType = {
      'Químico': allAgents.filter(a => a.agentType === 'Químico').length,
      'Físico': allAgents.filter(a => a.agentType === 'Físico').length,
      'Biológico': allAgents.filter(a => a.agentType === 'Biológico').length,
      'Ergonômico': allAgents.filter(a => a.agentType === 'Ergonômico').length,
      'Acidente': allAgents.filter(a => a.agentType === 'Acidente').length,
    };

    const byLevel = {
      'Tolerável': allAgents.filter(a => a.riskLevel === 'Tolerável').length,
      'Moderado': allAgents.filter(a => a.riskLevel === 'Moderado').length,
      'Substancial': allAgents.filter(a => a.riskLevel === 'Substancial').length,
      'Intolerável': allAgents.filter(a => a.riskLevel === 'Intolerável').length,
    };

    const criticalGHEs = ghes.filter(g => g.riskLevel === 'Intolerável');

    return {
      totalGHEs: ghes.length,
      totalAgents: allAgents.length,
      byType,
      byLevel,
      criticalGHEs: criticalGHEs.length,
      avgAgentsPerGHE: ghes.length > 0 ? (allAgents.length / ghes.length).toFixed(1) : 0,
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const gheService = new GHEService();

export default gheService;
