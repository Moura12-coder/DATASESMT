'use client';

import React, { useState, useMemo } from 'react';
import { useMoura } from '@/contexts/MouraContext';

export default function MouraRiskMap() {
  const { risks, ghes } = useMoura();
  const [selectedGHE, setSelectedGHE] = useState<number | null>(null);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  const severityLevels = ['remota', 'baixa', 'média', 'alta', 'crítica'];
  const probabilityLevels = ['remota', 'baixa', 'média', 'alta', 'muito_alta'];

  const severityScores = {
    remota: 1,
    baixa: 2,
    média: 3,
    alta: 4,
    crítica: 5,
  };

  const probabilityScores = {
    remota: 1,
    baixa: 2,
    média: 3,
    alta: 4,
    muito_alta: 5,
  };

  const getRiskColor = (severity: string, probability: string): string => {
    const sevScore = severityScores[severity as keyof typeof severityScores] || 1;
    const probScore = probabilityScores[probability as keyof typeof probabilityScores] || 1;
    const riskScore = sevScore * probScore;

    if (riskScore >= 16) return '#DC2626'; // Crítico (Vermelho)
    if (riskScore >= 12) return '#EA580C'; // Alto (Laranja)
    if (riskScore >= 8) return '#F59E0B'; // Médio (Amarelo)
    if (riskScore >= 4) return '#10B981'; // Baixo (Verde)
    return '#6B7280'; // Remoto (Cinza)
  };

  const getRiskLevel = (severity: string, probability: string): string => {
    const sevScore = severityScores[severity as keyof typeof severityScores] || 1;
    const probScore = probabilityScores[probability as keyof typeof probabilityScores] || 1;
    const riskScore = sevScore * probScore;

    if (riskScore >= 16) return 'CRÍTICO';
    if (riskScore >= 12) return 'ALTO';
    if (riskScore >= 8) return 'MÉDIO';
    if (riskScore >= 4) return 'BAIXO';
    return 'REMOTO';
  };

  // Filter risks by selected GHE
  const filteredRisks = useMemo(() => {
    if (selectedGHE === null) return risks;
    return risks.filter((r) => r.gheId === selectedGHE);
  }, [risks, selectedGHE]);

  // Build matrix data
  const matrixData = useMemo(() => {
    const matrix: Record<string, Record<string, any[]>> = {};

    severityLevels.forEach((severity) => {
      matrix[severity] = {};
      probabilityLevels.forEach((probability) => {
        matrix[severity][probability] = [];
      });
    });

    filteredRisks.forEach((risk) => {
      if (matrix[risk.severity] && matrix[risk.severity][risk.probability]) {
        matrix[risk.severity][risk.probability].push(risk);
      }
    });

    return matrix;
  }, [filteredRisks]);

  // Statistics
  const statistics = useMemo(() => {
    return {
      total: filteredRisks.length,
      critical: filteredRisks.filter((r) => r.severity === 'crítica').length,
      high: filteredRisks.filter((r) => r.severity === 'alta').length,
      medium: filteredRisks.filter((r) => r.severity === 'média').length,
      low: filteredRisks.filter((r) => r.severity === 'baixa').length,
      remote: filteredRisks.filter((r) => r.severity === 'remota').length,
    };
  }, [filteredRisks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900">Mapa de Riscos</h1>
        <p className="text-blue-600 mt-2">Matriz de Severidade × Probabilidade</p>
      </div>

      {/* GHE Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-bold text-blue-900 mb-4">Filtrar por GHE</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedGHE(null)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedGHE === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos os GHEs
          </button>
          {ghes.map((ghe) => (
            <button
              key={ghe.id}
              onClick={() => setSelectedGHE(ghe.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedGHE === ghe.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {ghe.code}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <p className="text-gray-600 text-sm font-semibold">Total</p>
          <p className="text-3xl font-bold text-blue-900">{statistics.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-red-600">
          <p className="text-gray-600 text-sm font-semibold">Críticos</p>
          <p className="text-3xl font-bold text-red-600">{statistics.critical}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-orange-600">
          <p className="text-gray-600 text-sm font-semibold">Altos</p>
          <p className="text-3xl font-bold text-orange-600">{statistics.high}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-yellow-600">
          <p className="text-gray-600 text-sm font-semibold">Médios</p>
          <p className="text-3xl font-bold text-yellow-600">{statistics.medium}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-green-600">
          <p className="text-gray-600 text-sm font-semibold">Baixos</p>
          <p className="text-3xl font-bold text-green-600">{statistics.low}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-gray-600">
          <p className="text-gray-600 text-sm font-semibold">Remotos</p>
          <p className="text-3xl font-bold text-gray-600">{statistics.remote}</p>
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        <h2 className="text-xl font-bold text-blue-900 mb-6">Matriz de Riscos</h2>
        
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-3 text-left font-semibold text-gray-700">
                Severidade / Probabilidade
              </th>
              {probabilityLevels.map((prob) => (
                <th
                  key={prob}
                  className="border border-gray-300 bg-gray-100 p-3 text-center font-semibold text-gray-700 min-w-32"
                >
                  {prob.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {severityLevels.reverse().map((severity) => (
              <tr key={severity}>
                <td className="border border-gray-300 bg-gray-50 p-3 font-semibold text-gray-700">
                  {severity.toUpperCase()}
                </td>
                {probabilityLevels.map((probability) => {
                  const cellRisks = matrixData[severity][probability];
                  const cellKey = `${severity}-${probability}`;
                  const isExpanded = expandedCell === cellKey;
                  const color = getRiskColor(severity, probability);
                  const riskLevel = getRiskLevel(severity, probability);

                  return (
                    <td
                      key={cellKey}
                      className="border border-gray-300 p-2 text-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        setExpandedCell(isExpanded ? null : cellKey)
                      }
                    >
                      <div
                        className="rounded-lg p-4 text-white font-bold min-h-24 flex flex-col items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        <div className="text-2xl">{cellRisks.length}</div>
                        <div className="text-xs mt-1">{riskLevel}</div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && cellRisks.length > 0 && (
                        <div className="absolute mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 min-w-80">
                          <h3 className="font-bold text-gray-900 mb-3">
                            Riscos - {severity.toUpperCase()} × {probability.toUpperCase()}
                          </h3>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {cellRisks.map((risk) => (
                              <div
                                key={risk.id}
                                className="p-2 bg-gray-50 rounded border-l-4"
                                style={{ borderLeftColor: color }}
                              >
                                <p className="font-semibold text-gray-900 text-sm">
                                  {risk.description}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {risk.controlMeasures}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-lg font-bold text-blue-900 mb-4">Legenda</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#DC2626' }}></div>
            <span className="text-gray-700 font-semibold">Crítico (16+)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#EA580C' }}></div>
            <span className="text-gray-700 font-semibold">Alto (12-15)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
            <span className="text-gray-700 font-semibold">Médio (8-11)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <span className="text-gray-700 font-semibold">Baixo (4-7)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#6B7280' }}></div>
            <span className="text-gray-700 font-semibold">Remoto (1-3)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
