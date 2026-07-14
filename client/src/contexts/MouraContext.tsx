'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Types
interface Risk {
  id: number;
  gheId: number;
  description: string;
  severity: 'crítica' | 'alta' | 'média' | 'baixa' | 'remota';
  probability: 'muito_alta' | 'alta' | 'média' | 'baixa' | 'remota';
  controlMeasures: string;
  status: 'identificado' | 'em_controle' | 'controlado';
  riskLevel: number;
  createdAt: Date;
}

interface GHE {
  id: number;
  code: string;
  name: string;
  description: string;
  employeeCount: number;
}

interface Employee {
  id: number;
  name: string;
  cpf: string;
  position: string;
  email: string;
  status: 'ativo' | 'inativo';
  gheId?: number;
}

interface PPE {
  id: number;
  name: string;
  description: string;
}

interface EmployeePPE {
  id: number;
  employeeId: number;
  ppeId: number;
  ppeName: string;
  quantity: number;
  issueDate: Date;
  expiryDate: Date | null;
  status: 'ativo' | 'vencido' | 'descartado';
}

interface AlertCard {
  id: string;
  title: string;
  count: number;
  color: string;
  icon: string;
}

interface MouraContextType {
  // State
  risks: Risk[];
  ghes: GHE[];
  employees: Employee[];
  employeePPEInventory: EmployeePPE[];

  // Actions
  addRisk: (risk: Risk) => void;
  deleteRisk: (riskId: number) => void;
  getRisksByGHE: (gheId: number) => Risk[];
  getRiskDistribution: () => {
    critical: number;
    high: number;
    medium: number;
    low: number;
    remote: number;
  };
  getAlertCards: () => AlertCard[];
  assignEmployeeToGHE: (employeeId: number, gheId: number) => void;
  getEmployeePPEInventory: (employeeId: number) => EmployeePPE[];
  getPPERequirementsForGHE: (gheId: number) => PPE[];
}

const MouraContext = createContext<MouraContextType | undefined>(undefined);

// Initial data
const initialGHEs: GHE[] = [
  {
    id: 1,
    code: 'GHE-001',
    name: 'Setor de Produção',
    description: 'Área de manufatura com exposição a ruído e vibração',
    employeeCount: 15,
  },
  {
    id: 2,
    code: 'GHE-002',
    name: 'Setor Administrativo',
    description: 'Escritório com exposição ergonômica',
    employeeCount: 8,
  },
  {
    id: 3,
    code: 'GHE-003',
    name: 'Laboratório',
    description: 'Área com exposição a agentes químicos',
    employeeCount: 5,
  },
];

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: 'João Silva',
    cpf: '123.456.789-00',
    position: 'Operador de Máquina',
    email: 'joao@moura.com',
    status: 'ativo',
    gheId: 1,
  },
  {
    id: 2,
    name: 'Maria Santos',
    cpf: '987.654.321-00',
    position: 'Assistente Administrativo',
    email: 'maria@moura.com',
    status: 'ativo',
    gheId: 2,
  },
  {
    id: 3,
    name: 'Pedro Oliveira',
    cpf: '456.789.123-00',
    position: 'Técnico de Laboratório',
    email: 'pedro@moura.com',
    status: 'ativo',
  },
  {
    id: 4,
    name: 'Ana Costa',
    cpf: '789.123.456-00',
    position: 'Operador de Máquina',
    email: 'ana@moura.com',
    status: 'ativo',
  },
];

const initialRisks: Risk[] = [
  {
    id: 1,
    gheId: 1,
    description: 'Exposição a ruído acima de 85dB',
    severity: 'alta',
    probability: 'alta',
    controlMeasures: 'Uso obrigatório de protetor auricular',
    status: 'identificado',
    riskLevel: 4,
    createdAt: new Date(2026, 6, 1),
  },
  {
    id: 2,
    gheId: 1,
    description: 'Risco de prensagem de membros',
    severity: 'crítica',
    probability: 'média',
    controlMeasures: 'Proteção de máquinas e treinamento',
    status: 'identificado',
    riskLevel: 5,
    createdAt: new Date(2026, 6, 5),
  },
  {
    id: 3,
    gheId: 2,
    description: 'Postura inadequada prolongada',
    severity: 'média',
    probability: 'alta',
    controlMeasures: 'Pausas periódicas e ergonomia',
    status: 'identificado',
    riskLevel: 3,
    createdAt: new Date(2026, 6, 3),
  },
];

const initialPPEInventory: EmployeePPE[] = [
  {
    id: 1,
    employeeId: 1,
    ppeId: 1,
    ppeName: 'Protetor Auricular',
    quantity: 2,
    issueDate: new Date(2026, 0, 15),
    expiryDate: new Date(2027, 0, 15),
    status: 'ativo',
  },
  {
    id: 2,
    employeeId: 1,
    ppeId: 2,
    ppeName: 'Luva de Proteção',
    quantity: 5,
    issueDate: new Date(2026, 1, 20),
    expiryDate: null,
    status: 'ativo',
  },
  {
    id: 3,
    employeeId: 2,
    ppeId: 3,
    ppeName: 'Teclado Ergonômico',
    quantity: 1,
    issueDate: new Date(2026, 3, 10),
    expiryDate: null,
    status: 'ativo',
  },
];

export function MouraProvider({ children }: { children: React.ReactNode }) {
  const [risks, setRisks] = useState<Risk[]>(initialRisks);
  const [ghes] = useState<GHE[]>(initialGHEs);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [employeePPEInventory, setEmployeePPEInventory] = useState<EmployeePPE[]>(
    initialPPEInventory
  );

  const addRisk = useCallback((risk: Risk) => {
    setRisks((prev) => [...prev, risk]);
  }, []);

  const deleteRisk = useCallback((riskId: number) => {
    setRisks((prev) => prev.filter((r) => r.id !== riskId));
  }, []);

  const getRisksByGHE = useCallback(
    (gheId: number) => {
      return risks.filter((r) => r.gheId === gheId);
    },
    [risks]
  );

  const getRiskDistribution = useCallback(() => {
    return {
      critical: risks.filter((r) => r.severity === 'crítica').length,
      high: risks.filter((r) => r.severity === 'alta').length,
      medium: risks.filter((r) => r.severity === 'média').length,
      low: risks.filter((r) => r.severity === 'baixa').length,
      remote: risks.filter((r) => r.severity === 'remota').length,
    };
  }, [risks]);

  const getAlertCards = useCallback((): AlertCard[] => {
    const expiredTrainings = 5; // Mock data
    const expiredEPIs = 2; // Mock data
    const trainingsDueSoon = 3; // Mock data
    const criticalRisks = risks.filter((r) => r.severity === 'crítica').length;

    return [
      {
        id: 'active-employees',
        title: 'Funcionários Ativos',
        count: employees.filter((e) => e.status === 'ativo').length,
        color: '#3B82F6',
        icon: '👥',
      },
      {
        id: 'days-without-incident',
        title: 'Dias Sem Acidente',
        count: 365,
        color: '#10B981',
        icon: '✓',
      },
      {
        id: 'compliance-score',
        title: 'Compliance Score',
        count: 92,
        color: '#8B5CF6',
        icon: '📊',
      },
      {
        id: 'critical-risks',
        title: 'Riscos Críticos',
        count: criticalRisks,
        color: '#DC2626',
        icon: '⚠️',
      },
    ];
  }, [risks, employees]);

  const assignEmployeeToGHE = useCallback(
    (employeeId: number, gheId: number) => {
      // Update employee GHE assignment
      setEmployees((prev) =>
        prev.map((e) => (e.id === employeeId ? { ...e, gheId } : e))
      );

      // Add automatic EPIs based on GHE
      const gheCode = ghes.find((g) => g.id === gheId)?.code || '';
      const newPPEItems: EmployeePPE[] = [];

      // Mock: Add EPIs based on GHE
      if (gheId === 1) {
        // Production sector
        newPPEItems.push(
          {
            id: Math.max(...employeePPEInventory.map((p) => p.id), 0) + 1,
            employeeId,
            ppeId: 1,
            ppeName: 'Protetor Auricular',
            quantity: 2,
            issueDate: new Date(),
            expiryDate: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000),
            status: 'ativo',
          },
          {
            id: Math.max(...employeePPEInventory.map((p) => p.id), 0) + 2,
            employeeId,
            ppeId: 2,
            ppeName: 'Luva de Proteção',
            quantity: 5,
            issueDate: new Date(),
            expiryDate: null,
            status: 'ativo',
          }
        );
      } else if (gheId === 2) {
        // Administrative sector
        newPPEItems.push({
          id: Math.max(...employeePPEInventory.map((p) => p.id), 0) + 1,
          employeeId,
          ppeId: 3,
          ppeName: 'Teclado Ergonômico',
          quantity: 1,
          issueDate: new Date(),
          expiryDate: null,
          status: 'ativo',
        });
      }

      setEmployeePPEInventory((prev) => [...prev, ...newPPEItems]);
    },
    [ghes, employeePPEInventory]
  );

  const getEmployeePPEInventory = useCallback(
    (employeeId: number) => {
      return employeePPEInventory.filter((p) => p.employeeId === employeeId);
    },
    [employeePPEInventory]
  );

  const getPPERequirementsForGHE = useCallback((gheId: number) => {
    // Mock: Return PPE requirements based on GHE
    const requirements: PPE[] = [];

    if (gheId === 1) {
      requirements.push(
        { id: 1, name: 'Protetor Auricular', description: 'Para proteção contra ruído' },
        { id: 2, name: 'Luva de Proteção', description: 'Para proteção das mãos' }
      );
    } else if (gheId === 2) {
      requirements.push({
        id: 3,
        name: 'Teclado Ergonômico',
        description: 'Para prevenção de lesões ergonômicas',
      });
    } else if (gheId === 3) {
      requirements.push({
        id: 4,
        name: 'Óculos de Proteção',
        description: 'Para proteção dos olhos contra agentes químicos',
      });
    }

    return requirements;
  }, []);

  const value: MouraContextType = {
    risks,
    ghes,
    employees,
    employeePPEInventory,
    addRisk,
    deleteRisk,
    getRisksByGHE,
    getRiskDistribution,
    getAlertCards,
    assignEmployeeToGHE,
    getEmployeePPEInventory,
    getPPERequirementsForGHE,
  };

  return <MouraContext.Provider value={value}>{children}</MouraContext.Provider>;
}

export function useMoura() {
  const context = useContext(MouraContext);
  if (!context) {
    throw new Error('useMoura must be used within MouraProvider');
  }
  return context;
}
