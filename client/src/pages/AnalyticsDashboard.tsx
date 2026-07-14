/**
 * Analytics Dashboard Page
 * Compliance reporting and analytics
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

export function AnalyticsDashboardPage() {
  const { user } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Get units
  const { data: units = [] } = trpc.units.list.useQuery();

  // Get KPIs
  const { data: kpis } = trpc.analytics.getComplianceKPIs.useQuery(
    { unitId: selectedUnit || 0 },
    { enabled: !!selectedUnit }
  );

  // Get compliance report
  const { data: report } = trpc.analytics.getComplianceReport.useQuery(
    {
      unitId: selectedUnit || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: !!selectedUnit }
  );

  // Get trend data
  const { data: trendData } = trpc.analytics.getComplianceTrend.useQuery(
    { unitId: selectedUnit || 0, months: 12 },
    { enabled: !!selectedUnit }
  );

  // Get risk distribution
  const { data: riskDistribution } = trpc.analytics.getRiskDistribution.useQuery(
    { unitId: selectedUnit || 0 },
    { enabled: !!selectedUnit }
  );

  // Get benchmark
  const { data: benchmark } = trpc.analytics.getBenchmarkComparison.useQuery(
    { unitId: selectedUnit || 0 },
    { enabled: !!selectedUnit }
  );

  // Export mutation
  const exportMutation = trpc.analytics.exportReport.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao exportar relatório");
    },
  });

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    if (!report?.reportId) {
      toast.error("Nenhum relatório disponível para exportar");
      return;
    }
    exportMutation.mutate({
      reportId: report.reportId,
      format,
    });
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    if (score >= 70) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Analytics</h1>
          <p className="text-gray-600 mt-1">Relatórios de compliance e conformidade regulatória</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Unidade</label>
              <Select value={selectedUnit?.toString() || ""} onValueChange={(v) => setSelectedUnit(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button className="w-full">Filtrar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedUnit ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Selecione uma unidade para visualizar os dados</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* KPIs */}
          {kpis && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Score de Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getComplianceColor(kpis.complianceScore)}`}>
                    {kpis.complianceScore.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Conformidade geral</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{kpis.documentsCurrent}</div>
                  <p className="text-xs text-gray-600 mt-1">{kpis.documentsExpiring} vencendo</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Riscos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{kpis.risksOpen}</div>
                  <p className="text-xs text-gray-600 mt-1">{kpis.risksMitigated} mitigados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Incidentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{kpis.incidentsThisMonth}</div>
                  <p className="text-xs text-gray-600 mt-1">Este mês</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="trends" className="w-full">
            <TabsList>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
              <TabsTrigger value="risks">Riscos</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
            </TabsList>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Compliance (Últimos 12 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                  {trendData && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="compliance" stroke="#3b82f6" name="Compliance %" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risks Tab */}
            <TabsContent value="risks" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Nível</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {riskDistribution && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(riskDistribution.byLevel).map(([name, value]) => ({
                              name,
                              value,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Área</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {riskDistribution && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={Object.entries(riskDistribution.byArea).map(([name, value]) => ({
                            name,
                            value,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#f97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Compliance</CardTitle>
                    <CardDescription>Período: {startDate} a {endDate}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleExport("pdf")} disabled={exportMutation.isPending}>
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button size="sm" onClick={() => handleExport("excel")} disabled={exportMutation.isPending}>
                      <Download className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {report && (
                    <>
                      <div>
                        <h3 className="font-semibold mb-3">Conformidade por Norma</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(report.complianceMetrics.byNorm).map(([norm, score]) => (
                            <div key={norm} className="p-3 border rounded-lg">
                              <div className="text-sm font-medium">{norm}</div>
                              <div className={`text-lg font-bold ${getComplianceColor(score as number)}`}>
                                {score}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Recomendações</h3>
                        <ul className="space-y-2">
                          {report.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Benchmark Tab */}
            <TabsContent value="benchmark" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comparação com Benchmark do Setor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {benchmark && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold mb-3">Sua Empresa</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Score de Compliance</span>
                              <span className="font-bold">{benchmark.yourCompany.complianceScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxa de Incidentes</span>
                              <span className="font-bold">{benchmark.yourCompany.incidentRate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cobertura de Treinamento</span>
                              <span className="font-bold">{benchmark.yourCompany.trainingCoverage}%</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-3">Benchmark do Setor</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Score de Compliance</span>
                              <span className="font-bold">{benchmark.sectorBenchmark.complianceScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxa de Incidentes</span>
                              <span className="font-bold">{benchmark.sectorBenchmark.incidentRate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cobertura de Treinamento</span>
                              <span className="font-bold">{benchmark.sectorBenchmark.trainingCoverage}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Sua Posição</h3>
                        <Badge className="bg-green-100 text-green-800">{benchmark.ranking}</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
