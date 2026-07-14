'use client';

import React, { useMemo } from 'react';
import { useMoura } from '@/contexts/MouraContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function MouraDashboard() {
  const { getRiskDistribution, getAlertCards, risks } = useMoura();

  const riskDistribution = useMemo(() => getRiskDistribution(), [getRiskDistribution]);
  const alertCards = useMemo(() => getAlertCards(), [getAlertCards]);

  // Dados para o gráfico de distribuição de riscos
  const riskChartData = useMemo(() => {
    return [
      { name: 'Crítico', value: riskDistribution.critical, color: '#DC2626' },
      { name: 'Alto', value: riskDistribution.high, color: '#EA580C' },
      { name: 'Médio', value: riskDistribution.medium, color: '#F59E0B' },
      { name: 'Baixo', value: riskDistribution.low, color: '#10B981' },
      { name: 'Remoto', value: riskDistribution.remote, color: '#6B7280' },
    ].filter((item) => item.value > 0);
  }, [riskDistribution]);

  // Dados para o gráfico de tendência de incidentes (últimos 6 meses)
  const incidentTrendData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map((month, index) => ({
      month,
      incidents: Math.floor(Math.random() * 8) + 2,
      risks: Math.floor(Math.random() * 6) + 1,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900">Dashboard Executivo</h1>
        <p className="text-blue-600 mt-2">Visão geral da gestão SST em tempo real</p>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {alertCards.map((card) => (
          <div
            key={card.id}
            className="bg-white rounded-lg shadow-md p-6 border-l-4"
            style={{ borderLeftColor: card.color }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-3xl font-bold mt-2" style={{ color: card.color }}>
                  {card.count}
                </p>
              </div>
              <div className="text-4xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribuição de Riscos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-6">Distribuição de Riscos</h2>
          {riskChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-400">
              Nenhum risco registrado
            </div>
          )}
        </div>

        {/* Tendência de Incidentes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-6">Tendência de Incidentes (6 meses)</h2>
          <div className="space-y-4">
            {incidentTrendData.map((data, index) => (
              <div key={index} className="flex items-center">
                <span className="w-12 text-sm font-medium text-gray-600">{data.month}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-orange-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${(data.incidents / 10) * 100}%` }}
                    >
                      {data.incidents}
                    </div>
                  </div>
                  <span className="w-8 text-right text-sm text-gray-600">{data.incidents}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Riscos Recentes */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-bold text-blue-900 mb-6">Riscos Identificados Recentemente</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-blue-900">Descrição</th>
                <th className="px-6 py-3 text-left font-semibold text-blue-900">Severidade</th>
                <th className="px-6 py-3 text-left font-semibold text-blue-900">Probabilidade</th>
                <th className="px-6 py-3 text-left font-semibold text-blue-900">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-blue-900">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {risks.slice(0, 5).map((risk) => (
                <tr key={risk.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4">{risk.description}</td>
                  <td className="px-6 py-4">
                    <span
                      className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                      style={{
                        backgroundColor:
                          risk.severity === 'crítica'
                            ? '#DC2626'
                            : risk.severity === 'alta'
                              ? '#EA580C'
                              : risk.severity === 'média'
                                ? '#F59E0B'
                                : '#10B981',
                      }}
                    >
                      {risk.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize">{risk.probability}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                      {risk.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {risk.createdAt.toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
