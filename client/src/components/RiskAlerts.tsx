import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { AlertCircle, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Alert {
  id: number;
  areaId: number;
  unitId: number;
  oldRiskLevel: string | null;
  newRiskLevel: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
  createdAt: Date;
  createdBy: number;
  acknowledgedAt: Date | null;
  acknowledgedBy: number | null;
}

const SEVERITY_CONFIG = {
  low: {
    icon: AlertCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  high: {
    icon: AlertOctagon,
    color: 'text-red-600',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-800',
  },
};

export function RiskAlerts({ unitId }: { unitId: number }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Fetch alerts
  const { data: allAlerts = [] } = trpc.riskMap.getUnitAlerts.useQuery(
    { unitId, limit: 100 },
    { refetchInterval: 10000 } // Refresh every 10 seconds
  );

  const { data: highAlerts = [] } = trpc.riskMap.getAlertsBySeverity.useQuery(
    { unitId, severity: 'high' },
    { enabled: selectedSeverity === 'high' || selectedSeverity === 'all' }
  );

  const { data: mediumAlerts = [] } = trpc.riskMap.getAlertsBySeverity.useQuery(
    { unitId, severity: 'medium' },
    { enabled: selectedSeverity === 'medium' || selectedSeverity === 'all' }
  );

  const { data: lowAlerts = [] } = trpc.riskMap.getAlertsBySeverity.useQuery(
    { unitId, severity: 'low' },
    { enabled: selectedSeverity === 'low' || selectedSeverity === 'all' }
  );

  useEffect(() => {
    let filtered: Alert[] = [];

    if (selectedSeverity === 'all') {
      filtered = [...(allAlerts as Alert[])];
    } else if (selectedSeverity === 'high') {
      filtered = [...(highAlerts as Alert[])];
    } else if (selectedSeverity === 'medium') {
      filtered = [...(mediumAlerts as Alert[])];
    } else if (selectedSeverity === 'low') {
      filtered = [...(lowAlerts as Alert[])];
    }

    setAlerts(filtered);
  }, [allAlerts, highAlerts, mediumAlerts, lowAlerts, selectedSeverity]);

  const handleAcknowledge = (alertId: number) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    toast.success('Alerta marcado como lido');
  };

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;
  const highSeverityCount = alerts.filter((a) => a.severity === 'high').length;

  const getIcon = (severity: string) => {
    const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
    const IconComponent = config.icon;
    return <IconComponent className={`w-5 h-5 ${config.color}`} />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total de Alertas</p>
              <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Não Lidos</p>
              <p className="text-3xl font-bold text-yellow-600">{unacknowledgedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Críticos (Alta)</p>
              <p className="text-3xl font-bold text-red-600">{highSeverityCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Taxa de Leitura</p>
              <p className="text-3xl font-bold text-green-600">
                {alerts.length === 0 ? '0' : Math.round(((alerts.length - unacknowledgedCount) / alerts.length) * 100)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Severidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['all', 'high', 'medium', 'low'] as const).map((severity) => (
              <Button
                key={severity}
                variant={selectedSeverity === severity ? 'default' : 'outline'}
                onClick={() => setSelectedSeverity(severity)}
                className="capitalize"
              >
                {severity === 'all' ? 'Todos' : severity}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Risco</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} encontrado{alerts.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">Nenhum alerta neste momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = SEVERITY_CONFIG[alert.severity];
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-2 ${config.bg} ${alert.acknowledged ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              Aumento de Risco Detectado
                            </h4>
                            <Badge className={config.badge}>
                              {alert.severity === 'high'
                                ? 'Crítico'
                                : alert.severity === 'medium'
                                  ? 'Moderado'
                                  : 'Baixo'}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge variant="outline">Lido</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            Nível de risco alterado de{' '}
                            <span className="font-medium">{alert.oldRiskLevel || 'N/A'}</span> para{' '}
                            <span className="font-medium">{alert.newRiskLevel}</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-2">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="ml-4"
                        >
                          Marcar como Lido
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Statistics */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium">Alertas Críticos (Alta)</span>
                <span className="text-lg font-bold text-red-600">
                  {alerts.filter((a) => a.severity === 'high').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium">Alertas Moderados</span>
                <span className="text-lg font-bold text-yellow-600">
                  {alerts.filter((a) => a.severity === 'medium').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Alertas Baixos</span>
                <span className="text-lg font-bold text-blue-600">
                  {alerts.filter((a) => a.severity === 'low').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
