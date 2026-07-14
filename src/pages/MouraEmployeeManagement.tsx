'use client';

import React, { useState, useMemo } from 'react';
import { useMoura } from '@/contexts/MouraContext';

export default function MouraEmployeeManagement() {
  const {
    employees,
    ghes,
    assignEmployeeToGHE,
    getEmployeePPEInventory,
    getPPERequirementsForGHE,
  } = useMoura();

  const [selectedEmployee, setSelectedEmployee] = useState<number>(
    employees.find((e) => !e.gheId)?.id || employees[0]?.id || 1
  );
  const [selectedGHEForAssignment, setSelectedGHEForAssignment] = useState<number>(ghes[0]?.id || 1);
  const [assignmentMessage, setAssignmentMessage] = useState('');

  const selectedEmployeeData = employees.find((e) => e.id === selectedEmployee);
  const employeePPE = useMemo(
    () => getEmployeePPEInventory(selectedEmployee),
    [selectedEmployee, getEmployeePPEInventory]
  );

  const unassignedEmployees = employees.filter((e) => !e.gheId);
  const assignedEmployees = employees.filter((e) => e.gheId);

  const handleAssignToGHE = () => {
    if (!selectedEmployee || !selectedGHEForAssignment) {
      setAssignmentMessage('Selecione um funcionário e um GHE');
      return;
    }

    assignEmployeeToGHE(selectedEmployee, selectedGHEForAssignment);
    setAssignmentMessage('✅ Funcionário atribuído com sucesso! EPIs adicionados ao inventário.');

    // Reset
    setTimeout(() => {
      setSelectedEmployee(unassignedEmployees[0]?.id || employees[0]?.id || 1);
      setAssignmentMessage('');
    }, 2000);
  };

  const getPPEStatus = (status: string) => {
    switch (status) {
      case 'ativo':
        return { color: '#10B981', label: 'Ativo' };
      case 'vencido':
        return { color: '#DC2626', label: 'Vencido' };
      case 'descartado':
        return { color: '#6B7280', label: 'Descartado' };
      default:
        return { color: '#3B82F6', label: status };
    }
  };

  const isExpiringSoon = (expiryDate: Date | null): boolean => {
    if (!expiryDate) return false;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiryDate >= now && expiryDate <= thirtyDaysFromNow;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900">Gestão de Funcionários</h1>
        <p className="text-blue-600 mt-2">Atribuir funcionários a GHEs e gerenciar EPIs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Funcionários */}
        <div className="lg:col-span-1 space-y-6">
          {/* Funcionários Sem GHE */}
          {unassignedEmployees.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-orange-600 mb-4">
                ⚠️ Sem GHE Atribuído ({unassignedEmployees.length})
              </h2>
              <div className="space-y-2">
                {unassignedEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedEmployee === emp.id
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-gray-700 hover:bg-orange-100'
                    }`}
                  >
                    <div className="font-semibold">{emp.name}</div>
                    <div className="text-sm opacity-75">{emp.position}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Funcionários Com GHE */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">
              ✅ Com GHE Atribuído ({assignedEmployees.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {assignedEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedEmployee === emp.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{emp.name}</div>
                  <div className="text-sm opacity-75">
                    {ghes.find((g) => g.id === emp.gheId)?.code}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Informações do Funcionário */}
          {selectedEmployeeData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">{selectedEmployeeData.name}</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm">CPF</p>
                  <p className="text-lg font-semibold text-blue-900">{selectedEmployeeData.cpf}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Cargo</p>
                  <p className="text-lg font-semibold text-blue-900">{selectedEmployeeData.position}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Email</p>
                  <p className="text-lg font-semibold text-blue-900">{selectedEmployeeData.email}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className="text-lg font-semibold text-green-600">{selectedEmployeeData.status}</p>
                </div>
              </div>

              {/* GHE Assignment */}
              {!selectedEmployeeData.gheId && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-4">Atribuir a um GHE</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-orange-900 mb-2">
                        Selecione o GHE
                      </label>
                      <select
                        value={selectedGHEForAssignment}
                        onChange={(e) => setSelectedGHEForAssignment(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {ghes.map((ghe) => (
                          <option key={ghe.id} value={ghe.id}>
                            {ghe.code} - {ghe.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAssignToGHE}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Atribuir ao GHE
                    </button>
                    {assignmentMessage && (
                      <p className="text-green-600 font-semibold">{assignmentMessage}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedEmployeeData.gheId && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900">
                    GHE Atual:{' '}
                    <span className="text-blue-600">
                      {ghes.find((g) => g.id === selectedEmployeeData.gheId)?.name}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Inventário de EPIs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-6">Inventário de EPIs</h2>

            {employeePPE.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-blue-900">EPI</th>
                      <th className="px-6 py-3 text-left font-semibold text-blue-900">Qtd</th>
                      <th className="px-6 py-3 text-left font-semibold text-blue-900">Emissão</th>
                      <th className="px-6 py-3 text-left font-semibold text-blue-900">Vencimento</th>
                      <th className="px-6 py-3 text-left font-semibold text-blue-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {employeePPE.map((ppe) => {
                      const statusInfo = getPPEStatus(ppe.status);
                      const expiring = isExpiringSoon(ppe.expiryDate);

                      return (
                        <tr
                          key={ppe.id}
                          className={`hover:bg-blue-50 ${expiring ? 'bg-yellow-50' : ''}`}
                        >
                          <td className="px-6 py-4 font-semibold">{ppe.ppeName}</td>
                          <td className="px-6 py-4">{ppe.quantity}</td>
                          <td className="px-6 py-4">
                            {ppe.issueDate.toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            {ppe.expiryDate
                              ? ppe.expiryDate.toLocaleDateString('pt-BR')
                              : 'Sem vencimento'}
                            {expiring && (
                              <span className="ml-2 text-yellow-600 font-semibold">⚠️</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                              style={{ backgroundColor: statusInfo.color }}
                            >
                              {statusInfo.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>
                  {selectedEmployeeData?.gheId
                    ? 'Nenhum EPI atribuído'
                    : 'Atribua o funcionário a um GHE para ver os EPIs obrigatórios'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
