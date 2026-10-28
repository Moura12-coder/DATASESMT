import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ReportData {
  unitId: number;
  period: { start: Date; end: Date };
  totalAreas: number;
  totalChanges: number;
  changesByType: {
    position_update: number;
    name_update: number;
    risk_update: number;
  };
  areas: Array<{
    id: number;
    name: string;
    riskLevel: string;
    changes: number;
  }>;
  generatedAt: Date;
}

interface ComparisonData {
  period1: {
    start: Date;
    end: Date;
    totalChanges: number;
    changesByType: {
      position_update: number;
      name_update: number;
      risk_update: number;
    };
  };
  period2: {
    start: Date;
    end: Date;
    totalChanges: number;
    changesByType: {
      position_update: number;
      name_update: number;
      risk_update: number;
    };
  };
  differences: {
    totalChangesDifference: number;
    areasWithMoreChanges: Array<any>;
  };
}

export function RiskMapReports({ unitId }: { unitId: number }) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null
  );

  // Report form
  const [reportStartDate, setReportStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [reportEndDate, setReportEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Comparison form
  const [period1Start, setPeriod1Start] = useState(
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [period1End, setPeriod1End] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [period2Start, setPeriod2Start] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [period2End, setPeriod2End] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Mutations
  const reportMutation = trpc.riskMap.generateRiskAnalysisReport.useQuery(
    {
      unitId,
      period1Start: new Date(reportStartDate),
      period1End: new Date(reportEndDate),
      period2Start: new Date(period2Start),
      period2End: new Date(period2End),
    },
    { enabled: false }
  );

  const reportTrigger = async () => {
    const data = await reportMutation.refetch();
    if (data.data) {
      setReportData(data.data as any);
      toast.success("Relatório gerado com sucesso");
    }
  };

  const comparisonMutation = trpc.riskMap.compareRiskMapPeriods.useQuery(
    {
      startDate1: new Date(period1Start),
      endDate1: new Date(period1End),
      startDate2: new Date(period2Start),
      endDate2: new Date(period2End),
    },
    { enabled: false }
  );

  const comparisonTrigger = async () => {
    const data = await comparisonMutation.refetch();
    if (data.data) {
      setComparisonData(data.data as any);
      toast.success("Comparação gerada com sucesso");
    }
  };

  const handleGenerateReport = () => {
    reportTrigger();
  };

  const handleCompareperiods = () => {
    comparisonTrigger();
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    toast.info("Exportação para PDF em desenvolvimento");
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    toast.info("Exportação para Excel em desenvolvimento");
  };

  const chartData = reportData?.changesByType
    ? [
        { name: "Posição", value: reportData.changesByType.position_update },
        { name: "Nome", value: reportData.changesByType.name_update },
        { name: "Risco", value: reportData.changesByType.risk_update },
      ]
    : [];

  const comparisonChartData = comparisonData
    ? [
        {
          name: "Período 1",
          changes: comparisonData.period1.totalChanges,
          posição: comparisonData.period1.changesByType.position_update,
          nome: comparisonData.period1.changesByType.name_update,
          risco: comparisonData.period1.changesByType.risk_update,
        },
        {
          name: "Período 2",
          changes: comparisonData.period2.totalChanges,
          posição: comparisonData.period2.changesByType.position_update,
          nome: comparisonData.period2.changesByType.name_update,
          risco: comparisonData.period2.changesByType.risk_update,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório de Análise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={reportStartDate}
                onChange={e => setReportStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={reportEndDate}
                onChange={e => setReportEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={reportMutation.isPending}
            className="w-full"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Análise de Riscos</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Período: {new Date(reportData.period.start).toLocaleDateString()}{" "}
              a {new Date(reportData.period.end).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total de Áreas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reportData.totalAreas}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total de Mudanças</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.totalChanges}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Média por Área</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(reportData.totalChanges / reportData.totalAreas).toFixed(1)}
                </p>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Areas Table */}
            <div>
              <h4 className="font-semibold mb-3">Áreas Monitoradas</h4>
              <div className="space-y-2">
                {reportData.areas.map(area => (
                  <div
                    key={area.id}
                    className="p-3 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{area.name}</p>
                      <Badge variant="outline">{area.riskLevel}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {area.changes} mudanças
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparar Períodos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Período 1 - Início</label>
              <Input
                type="date"
                value={period1Start}
                onChange={e => setPeriod1Start(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Período 1 - Fim</label>
              <Input
                type="date"
                value={period1End}
                onChange={e => setPeriod1End(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Período 2 - Início</label>
              <Input
                type="date"
                value={period2Start}
                onChange={e => setPeriod2Start(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Período 2 - Fim</label>
              <Input
                type="date"
                value={period2End}
                onChange={e => setPeriod2End(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={handleCompareperiods}
            disabled={comparisonMutation.isPending}
            className="w-full"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Comparar Períodos
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonData && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação de Períodos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comparison Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Período 1 - Mudanças</p>
                <p className="text-2xl font-bold text-blue-600">
                  {comparisonData.period1.totalChanges}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Período 2 - Mudanças</p>
                <p className="text-2xl font-bold text-green-600">
                  {comparisonData.period2.totalChanges}
                </p>
              </div>
            </div>

            {/* Difference */}
            <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <p className="text-sm text-gray-600">Diferença</p>
              <p
                className={`text-2xl font-bold ${comparisonData.differences.totalChangesDifference > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {comparisonData.differences.totalChangesDifference > 0
                  ? "+"
                  : ""}
                {comparisonData.differences.totalChangesDifference}
              </p>
            </div>

            {/* Comparison Chart */}
            {comparisonChartData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="changes"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
