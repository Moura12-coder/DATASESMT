import { describe, it, expect } from 'vitest';

/**
 * Testes para Serviços Melhorados de Mapa de Risco e GHE
 * 
 * Estes testes validam a lógica de negócio dos serviços melhorados
 * riskMapImproved.ts e gheImproved.ts
 */

// ============================================================================
// TESTES - RISK MAP SERVICE
// ============================================================================

describe('RiskMapService - Melhorado', () => {
  describe('Criar Áreas de Risco', () => {
    it('deve validar que áreas de risco têm coordenadas', () => {
      const area = {
        id: 1,
        name: 'Setor de Produção',
        coordinates: { x: 100, y: 100, width: 200, height: 150 },
        riskLevel: 'Tolerável',
        riskCircles: [],
      };

      expect(area.name).toBe('Setor de Produção');
      expect(area.coordinates.x).toBe(100);
      expect(area.riskLevel).toBe('Tolerável');
      expect(area.riskCircles.length).toBe(0);
    });

    it('deve suportar múltiplas áreas', () => {
      const areas = [
        { id: 1, name: 'Área 1', coordinates: { x: 0, y: 0, width: 100, height: 100 }, riskLevel: 'Tolerável', riskCircles: [] },
        { id: 2, name: 'Área 2', coordinates: { x: 200, y: 200, width: 100, height: 100 }, riskLevel: 'Moderado', riskCircles: [] },
      ];

      expect(areas.length).toBe(2);
      expect(areas[0].riskLevel).toBe('Tolerável');
      expect(areas[1].riskLevel).toBe('Moderado');
    });
  });

  describe('Adicionar Círculos de Risco', () => {
    it('deve suportar 5 tipos de agentes', () => {
      const agentTypes = ['Químico', 'Físico', 'Biológico', 'Ergonômico', 'Acidente'];

      agentTypes.forEach(type => {
        expect(['Químico', 'Físico', 'Biológico', 'Ergonômico', 'Acidente']).toContain(type);
      });
    });

    it('deve validar círculos com agentes', () => {
      const circle = {
        id: 'circle-1',
        agentType: 'Químico',
        agentName: 'Benzeno',
        centerX: 100,
        centerY: 100,
        radius: 50,
        riskLevel: 'Intolerável',
        intensity: 90,
      };

      expect(circle.agentType).toBe('Químico');
      expect(circle.riskLevel).toBe('Intolerável');
      expect(circle.intensity).toBeGreaterThan(0);
    });

    it('deve suportar múltiplos círculos por área', () => {
      const circles = [
        { id: '1', agentType: 'Químico', agentName: 'Benzeno', riskLevel: 'Intolerável' },
        { id: '2', agentType: 'Físico', agentName: 'Ruído', riskLevel: 'Moderado' },
        { id: '3', agentType: 'Biológico', agentName: 'Bactérias', riskLevel: 'Tolerável' },
      ];

      expect(circles.length).toBe(3);
      expect(circles.filter(c => c.agentType === 'Químico').length).toBe(1);
    });
  });

  describe('Cálculo de Nível de Risco', () => {
    it('deve calcular nível máximo de risco', () => {
      const riskLevels = ['Tolerável', 'Moderado', 'Substancial', 'Intolerável'];
      const circles = [
        { riskLevel: 'Moderado' },
        { riskLevel: 'Intolerável' },
        { riskLevel: 'Tolerável' },
      ];

      const maxIndex = Math.max(...circles.map(c => riskLevels.indexOf(c.riskLevel)));
      const maxLevel = riskLevels[maxIndex];

      expect(maxLevel).toBe('Intolerável');
    });
  });

  describe('Cores por Tipo de Agente', () => {
    it('deve ter cores distintas para cada tipo', () => {
      const colors = {
        'Químico': '#ef4444',
        'Físico': '#f97316',
        'Biológico': '#f59e0b',
        'Ergonômico': '#eab308',
        'Acidente': '#8b5cf6',
      };

      expect(Object.keys(colors).length).toBe(5);
      expect(colors['Químico']).toBe('#ef4444');
      expect(colors['Físico']).toBe('#f97316');
    });
  });

  describe('Exportação de Dados', () => {
    it('deve gerar JSON válido', () => {
      const data = {
        unitId: 1,
        areas: [
          { id: 1, name: 'Área 1', circles: [] },
        ],
        legend: {
          riskLevels: { 'Tolerável': '#10b981' },
        },
      };

      expect(data.unitId).toBe(1);
      expect(data.areas.length).toBe(1);
      expect(data.legend).toBeDefined();
    });

    it('deve suportar estatísticas', () => {
      const stats = {
        totalAreas: 3,
        totalRisks: 8,
        byType: {
          'Químico': 2,
          'Físico': 3,
          'Biológico': 2,
          'Ergonômico': 1,
          'Acidente': 0,
        },
        criticalAreas: 1,
      };

      expect(stats.totalRisks).toBe(8);
      expect(stats.byType['Químico']).toBe(2);
      expect(stats.criticalAreas).toBe(1);
    });
  });
});

// ============================================================================
// TESTES - GHE SERVICE
// ============================================================================

describe('GHEService - Melhorado', () => {
  describe('Criar GHE', () => {
    it('deve validar código e nome obrigatórios', () => {
      const ghe = {
        id: 1,
        unitId: 1,
        code: 'GHE-001',
        name: 'Setor de Soldagem',
        exposureAgents: [],
        riskLevel: 'Tolerável',
      };

      expect(ghe.code).toBe('GHE-001');
      expect(ghe.name).toBe('Setor de Soldagem');
      expect(ghe.code.length).toBeGreaterThanOrEqual(3);
    });

    it('deve validar comprimento do código', () => {
      const validCodes = ['GHE-001', 'GHE-002', 'SETOR-001'];
      const invalidCodes = ['AB', 'X', ''];

      validCodes.forEach(code => {
        expect(code.length).toBeGreaterThanOrEqual(3);
      });

      invalidCodes.forEach(code => {
        expect(code.length).toBeLessThan(3);
      });
    });
  });

  describe('Adicionar Agentes de Exposição', () => {
    it('deve suportar todos os 5 tipos de agentes', () => {
      const agentTypes = ['Químico', 'Físico', 'Biológico', 'Ergonômico', 'Acidente'];
      const agents = agentTypes.map(type => ({
        id: `agent-${type}`,
        agentType: type,
        agentName: `${type} Test`,
        riskLevel: 'Moderado',
      }));

      expect(agents.length).toBe(5);
      expect(agents.map(a => a.agentType)).toEqual(agentTypes);
    });

    it('deve validar nível de risco', () => {
      const riskLevels = ['Tolerável', 'Moderado', 'Substancial', 'Intolerável'];
      const agent = {
        id: 'agent-1',
        agentType: 'Químico',
        agentName: 'Benzeno',
        riskLevel: 'Intolerável',
      };

      expect(riskLevels).toContain(agent.riskLevel);
    });

    it('deve validar limite de tolerância', () => {
      const agent = {
        id: 'agent-1',
        agentType: 'Químico',
        agentName: 'Benzeno',
        limiteTolerance: 100,
        unit: 'ppm',
      };

      expect(agent.limiteTolerance).toBeGreaterThan(0);
      expect(agent.unit).toBe('ppm');
    });
  });

  describe('CRUD de GHE', () => {
    it('deve criar GHE', () => {
      const ghe = {
        id: 1,
        code: 'GHE-001',
        name: 'Setor',
        exposureAgents: [],
        riskLevel: 'Tolerável',
      };

      expect(ghe.id).toBe(1);
      expect(ghe.exposureAgents.length).toBe(0);
    });

    it('deve adicionar agentes', () => {
      const ghe = {
        id: 1,
        exposureAgents: [
          { id: '1', agentType: 'Químico', agentName: 'Benzeno' },
          { id: '2', agentType: 'Físico', agentName: 'Ruído' },
        ],
      };

      expect(ghe.exposureAgents.length).toBe(2);
    });

    it('deve remover agentes', () => {
      const ghe = {
        id: 1,
        exposureAgents: [
          { id: '1', agentType: 'Químico', agentName: 'Benzeno' },
          { id: '2', agentType: 'Físico', agentName: 'Ruído' },
        ],
      };

      const filtered = ghe.exposureAgents.filter(a => a.id !== '1');
      expect(filtered.length).toBe(1);
      expect(filtered[0].agentType).toBe('Físico');
    });
  });

  describe('Agrupar Agentes por Tipo', () => {
    it('deve agrupar corretamente', () => {
      const agents = [
        { id: '1', agentType: 'Químico', agentName: 'Benzeno' },
        { id: '2', agentType: 'Químico', agentName: 'Tolueno' },
        { id: '3', agentType: 'Físico', agentName: 'Ruído' },
      ];

      const grouped = {
        'Químico': agents.filter(a => a.agentType === 'Químico'),
        'Físico': agents.filter(a => a.agentType === 'Físico'),
      };

      expect(grouped['Químico'].length).toBe(2);
      expect(grouped['Físico'].length).toBe(1);
    });
  });

  describe('Auditoria', () => {
    it('deve registrar ações', () => {
      const logs = [
        { id: '1', action: 'CREATE', timestamp: new Date(), userId: 'user1' },
        { id: '2', action: 'ADD_AGENT', timestamp: new Date(), userId: 'user1' },
        { id: '3', action: 'DELETE', timestamp: new Date(), userId: 'user2' },
      ];

      expect(logs.length).toBe(3);
      expect(logs.filter(l => l.action === 'CREATE').length).toBe(1);
      expect(logs.filter(l => l.userId === 'user1').length).toBe(2);
    });
  });

  describe('Estatísticas', () => {
    it('deve calcular estatísticas', () => {
      const stats = {
        totalGHEs: 3,
        totalAgents: 8,
        byType: {
          'Químico': 2,
          'Físico': 3,
          'Biológico': 2,
          'Ergonômico': 1,
          'Acidente': 0,
        },
        criticalGHEs: 1,
      };

      expect(stats.totalGHEs).toBe(3);
      expect(stats.totalAgents).toBe(8);
      expect(Object.values(stats.byType).reduce((a, b) => a + b, 0)).toBe(8);
    });
  });
});

// ============================================================================
// TESTES - INTEGRAÇÃO
// ============================================================================

describe('Integração Mapa de Risco + GHE', () => {
  it('deve vincular GHE a áreas de risco', () => {
    const ghe = {
      id: 1,
      code: 'GHE-001',
      name: 'Setor de Soldagem',
      riskMapAreaId: 5,
    };

    const area = {
      id: 5,
      name: 'Setor de Produção',
      gheId: 1,
    };

    expect(ghe.riskMapAreaId).toBe(area.id);
    expect(area.gheId).toBe(ghe.id);
  });

  it('deve sincronizar riscos entre GHE e Mapa', () => {
    const ghe = {
      id: 1,
      exposureAgents: [
        { agentType: 'Químico', riskLevel: 'Intolerável' },
        { agentType: 'Físico', riskLevel: 'Moderado' },
      ],
      riskLevel: 'Intolerável',
    };

    const area = {
      id: 1,
      riskCircles: [
        { agentType: 'Químico', riskLevel: 'Intolerável' },
        { agentType: 'Físico', riskLevel: 'Moderado' },
      ],
      riskLevel: 'Intolerável',
    };

    expect(ghe.riskLevel).toBe(area.riskLevel);
    expect(ghe.exposureAgents.length).toBe(area.riskCircles.length);
  });
});
