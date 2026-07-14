import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, RefreshCw, Settings, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Users, Calendar, Target, Zap } from 'lucide-react';

interface KPI {
  id: number;
  name: string;
  value: number | string;
  target?: number;
  unit: string;
  status: 'Ótimo' | 'Bom' | 'Atenção' | 'Crítico';
  trend?: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  icon?: React.ReactNode;
  color: string;
}

interface DashboardData {
  kpis: KPI[];
  accidentTrend: Array<{ month: string; count: number }>;
  riskDistribution: Array<{ name: string; value: number }>;
  criticalAlerts: Array<{ id: number; title: string; severity: string; time: string }>;
}

export function ExecutiveDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const dashboardData: DashboardData = {
    kpis: [
      {
        id: 1,
        name: 'Funcionários Ativos',
        value: 1,
        unit: 'total',
        status: 'Ótimo',
        trend: 'up',
        lastUpdated: new Date(),
        color: 'text-blue-600',
      },
      {
        id: 2,
        name: 'Dias Sem Acidente',
        value: 365,
        unit: 'dias',
        status: 'Ótimo',
        trend: 'up',
        lastUpdated: new Date(),
        color: 'text-green-600',
      },
      {
        id: 3,
        name: 'Compliance Score',
        value: '100%',
        unit: 'conformidade',
        status: 'Ótimo',
        trend: 'stable',
        lastUpdated: new Date(),
        color: 'text-green-600',
      },
      {
        id: 4,
        name: 'Taxa de Frequência',
        value: 0,
        unit: 'por milhão de H/H',
        status: 'Ótimo',
        trend: 'down',
        lastUpdated: new Date(),
        color: 'text-orange-600',
      },
    ],
    accidentTrend: [
      { month: 'Jan', count: 4 },
      { month: 'Fev', count: 3 },
      { month: 'Mar', count: 2 },
      { month: 'Abr', count: 2 },
      { month: 'Mai', count: 1 },
      { month: 'Jun', count: 1 },
    ],
    riskDistribution: [
      { name: 'Substancial', value: 65 },
      { name: 'Moderado', value: 25 },
      { name: 'Tolerável', value: 10 },
    ],
    criticalAlerts: [
      { id: 1, title: 'Exames a Vencer', severity: 'warning', time: 'próximos 30 dias' },
      { id: 2, title: 'EPIs Abaixo do Mínimo', severity: 'critical', time: 'em alerta' },
      { id: 3, title: 'Treinamentos Vencidos', severity: 'warning', time: '1 registrado' },
      { id: 4, title: 'Ações em Aberto', severity: 'info', time: 'plano SWDH' },
    ],
  };

  const COLORS = ['#FF6B35', '#FFA500', '#4CAF50'];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Executivo</h1>
            <p className="text-slate-600 mt-1">Visão geral da gestão SST em tempo real</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardData.kpis.map((kpi) => (
            <Card key={kpi.id} className={`border-l-4 ${
              kpi.id === 1 ? 'border-l-blue-600' :
              kpi.id === 2 ? 'border-l-green-600' :
              kpi.id === 3 ? 'border-l-green-600' :
              'border-l-orange-600'
            } hover:shadow-md transition-shadow`}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {kpi.name}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${kpi.color}`}>
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-600">{kpi.unit}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {kpi.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase">Exames a Vencer</p>
                <p className="text-2xl font-bold text-yellow-600">0</p>
                <p className="text-xs text-slate-600">próximos 30 dias</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-600">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase">EPIs Abaixo do Mínimo</p>
                <p className="text-2xl font-bold text-red-600">0</p>
                <p className="text-xs text-slate-600">item em alerta</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase">Treinamentos Vencidos</p>
                <p className="text-2xl font-bold text-orange-600">1</p>
                <p className="text-xs text-slate-600">registros expirados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase">Ações em Aberto</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
                <p className="text-xs text-slate-600">plano SWDH</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incident Trend */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Tendência de Incidentes (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dashboardData.accidentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#FF6B35"
                    strokeWidth={3}
                    dot={{ fill: '#FF6B35', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Riscos</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboardData.riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dashboardData.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {dashboardData.riskDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-sm text-slate-700">● {item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
            <CardDescription>Últimas ações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Dashboard atualizado</p>
                  <p className="text-sm text-slate-600">Há 5 minutos</p>
                </div>
                <Badge variant="outline">Sistema</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Novo documento gerado</p>
                  <p className="text-sm text-slate-600">Há 1 hora</p>
                </div>
                <Badge variant="outline">Documentos</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
