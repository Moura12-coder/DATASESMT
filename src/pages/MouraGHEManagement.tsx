'use client';

import React, { useState, useMemo } from 'react';
import { useMoura } from '@/contexts/MouraContext';

export default function MouraGHEManagement() {
  const { ghes, addRisk, getRisksByGHE, risks } = useMoura();
  const [selectedGHE, setSelectedGHE] = useState<number>(ghes[0]?.id || 1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    severity: 'média' as const,
    probability: 'média' as const,
    controlMeasures: '',
  });

  const selectedGHEData = ghes.find((g) => g.id === selectedGHE);
  const gheRisks = useMemo(() => getRisksByGHE(selectedGHE), [selectedGHE, getRisksByGHE]);

  const calculateRiskLevel = (severity: string, probability: string): number => {
    const severityMap = { crítica: 5, alta: 4, média: 3, baixa: 2, remota: 1 };
    const probabilityMap = {
      muito_alta: 5,
      alta: 4,
      média: 3,
      baixa: 2,
      remota: 1,
    };

    const sevScore = severityMap[severity as keyof typeof severityMap] || 1;
    const probScore = probabilityMap[probability as keyof typeof probabilityMap] || 1;

    return Math.ceil((sevScore * probScore) / 5);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const riskLevel = calculateRiskLevel(formData.severity, formData.probability);

    const newRisk = {
      id: Math.max(...risks.map((r) => r.id), 0) + 1,
      gheId: selectedGHE,
      description: formData.description,
      severity: formData.severity,
      probability: formData.probability,
      controlMeasures: formData.controlMeasures,
      status: 'identificado' as const,
      riskLevel,
      createdAt: new Date(),
    };

    addRisk(newRisk);

    // Reset form
    setFormData({
      description: '',
      severity: 'média',
      probability: 'média',
      controlMeasures: '',
    });
    setShowForm(false);
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'crítica':
        return '#DC2626';
      case 'alta':
        return '#EA580C';
      case 'média':
        return '#F59E0B';
      case 'baixa':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900">Gestão de GHE</h1>
        <p className="text-blue-600 mt-2">Gerenciar Grupos Homogêneos de Exposição e Riscos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Lista de GHEs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">GHEs Cadastrados</h2>
            <div className="space-y-2">
              {ghes.map((ghe) => (
                <button
                  key={ghe.id}
                  onClick={() => setSelectedGHE(ghe.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedGHE === ghe.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{ghe.code}</div>
                  <div className="text-sm opacity-75">{ghe.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* GHE Info */}
          {selectedGHEData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">{selectedGHEData.name}</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm">Código</p>
                  <p className="text-lg font-semibold text-blue-900">{selectedGHEData.code}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Funcionários</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {selectedGHEData.employeeCount}
                  </p>
                </div>
              </div>
              <p className="text-gray-700">{selectedGHEData.description}</p>
            </div>
          )}

          {/* Riscos do GHE */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-blue-900">Riscos Identificados</h2>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {showForm ? 'Cancelar' : '+ Novo Risco'}
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-blue-50 p-6 rounded-lg mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    Descrição do Risco
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Ex: Exposição a ruído acima de 85dB"
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Severidade
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          severity: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="remota">Remota</option>
                      <option value="baixa">Baixa</option>
                      <option value="média">Média</option>
                      <option value="alta">Alta</option>
                      <option value="crítica">Crítica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Probabilidade
                    </label>
                    <select
                      value={formData.probability}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          probability: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="remota">Remota</option>
                      <option value="baixa">Baixa</option>
                      <option value="média">Média</option>
                      <option value="alta">Alta</option>
                      <option value="muito_alta">Muito Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    Medidas de Controle
                  </label>
                  <textarea
                    value={formData.controlMeasures}
                    onChange={(e) =>
                      setFormData({ ...formData, controlMeasures: e.target.value })
                    }
                    placeholder="Ex: Uso obrigatório de protetor auricular"
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Criar Risco
                </button>
              </form>
            )}

            {/* Lista de Riscos */}
            {gheRisks.length > 0 ? (
              <div className="space-y-3">
                {gheRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="border-l-4 p-4 rounded-lg bg-gray-50"
                    style={{ borderLeftColor: getRiskColor(risk.severity) }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{risk.description}</p>
                        <p className="text-sm text-gray-600 mt-1">{risk.controlMeasures}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <span
                          className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                          style={{ backgroundColor: getRiskColor(risk.severity) }}
                        >
                          {risk.severity}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                          Nível: {risk.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Nenhum risco identificado para este GHE</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
