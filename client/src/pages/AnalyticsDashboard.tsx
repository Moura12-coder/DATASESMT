import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
export function AnalyticsDashboardPage() {
  const [unit, setUnit] = useState(0);
  const [start, setStart] = useState(`${new Date().getFullYear()}-01-01`);
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const units = trpc.units.list.useQuery();
  const valid = !!unit && !!start && !!end && start <= end;
  const input = {
    unitId: unit,
    startDate: new Date(`${start}T00:00:00`),
    endDate: new Date(`${end}T23:59:59.999`),
  };
  const report = trpc.analytics.getComplianceReport.useQuery(input, {
    enabled: valid,
  });
  const trend = trpc.analytics.getComplianceTrend.useQuery(
    { unitId: unit, months: 12 },
    { enabled: !!unit }
  );
  const distribution = trpc.analytics.getRiskDistribution.useQuery(
    { unitId: unit },
    { enabled: !!unit }
  );
  const exportReport = trpc.analytics.exportReport.useMutation({
    onSuccess: result => {
      const url = URL.createObjectURL(
        new Blob([result.content], { type: "text/csv;charset=utf-8" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    onError: error => toast.error(error.message),
  });
  const stats = report.data;
  return (
    <main className="p-6 space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex gap-2 items-center">
            <BarChart3 /> Indicadores de SST
          </h1>
          <p className="text-slate-500 mt-2">
            Dados dos registros da unidade. Os números não substituem uma
            avaliação técnica de conformidade.
          </p>
        </div>
        <Button
          disabled={!valid || !stats || exportReport.isPending}
          onClick={() => exportReport.mutate(input)}
        >
          <Download size={16} className="mr-2" /> Exportar CSV
        </Button>
      </header>
      <section className="bg-white border rounded-xl p-5 grid sm:grid-cols-3 gap-4">
        <label className="text-sm space-y-2">
          Unidade
          <select
            className="block w-full border p-2 rounded"
            value={unit}
            onChange={e => setUnit(Number(e.target.value))}
          >
            <option value={0}>Selecione uma unidade</option>
            {units.data?.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm space-y-2">
          Data inicial
          <input
            className="block w-full border p-2 rounded"
            type="date"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
        </label>
        <label className="text-sm space-y-2">
          Data final
          <input
            className="block w-full border p-2 rounded"
            type="date"
            value={end}
            min={start}
            onChange={e => setEnd(e.target.value)}
          />
        </label>
      </section>
      {!unit && <p>Selecione uma unidade para consultar seus indicadores.</p>}
      {!!unit && !valid && (
        <p role="alert" className="text-red-700">
          Informe um período válido.
        </p>
      )}
      {report.isFetching && <p role="status">Atualizando indicadores…</p>}
      {(report.error || units.error) && (
        <p role="alert" className="text-red-700">
          {report.error?.message || units.error?.message}
        </p>
      )}
      {valid && stats && (
        <>
          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Documentos vigentes", stats.documents.current],
              ["Documentos vencidos", stats.documents.expired],
              ["Riscos em aberto", stats.risks.open],
              ["Incidentes no período", stats.incidentsInPeriod],
            ].map(([label, value]) => (
              <article key={label} className="border rounded-xl bg-white p-5">
                <h2 className="text-sm text-slate-500">{label}</h2>
                <p className="text-3xl font-bold mt-2">{value}</p>
              </article>
            ))}
          </section>
          <p className="text-xs text-slate-500">
            Documentos e riscos: situação atual. Incidentes: período
            selecionado. Atualizado em{" "}
            {new Date(stats.generatedAt).toLocaleString("pt-BR")}.
          </p>
          <section className="grid lg:grid-cols-2 gap-6">
            <article className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-4">
                Incidentes registrados nos últimos 12 meses
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trend.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="incidents"
                    name="Incidentes"
                    fill="#1d4ed8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </article>
            <article className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-4">
                Distribuição atual dos riscos
              </h2>
              {Object.entries(distribution.data?.byLevel ?? {}).length === 0 ? (
                <p className="text-slate-500">Nenhum risco registrado.</p>
              ) : (
                <ul className="divide-y">
                  {Object.entries(distribution.data?.byLevel ?? {}).map(
                    ([level, count]) => (
                      <li key={level} className="py-3 flex justify-between">
                        <span>{level}</span>
                        <strong>{count}</strong>
                      </li>
                    )
                  )}
                </ul>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  );
}
