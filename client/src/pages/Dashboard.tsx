import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Users, ShieldAlert, Stethoscope, HardHat, GraduationCap, AlertTriangle,
  Activity, TrendingUp, TrendingDown, Minus, Calendar, ArrowRight,
  CheckCircle2, Clock, XCircle, Shield, Zap, BarChart3
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { cn } from "@/lib/utils";

const RISK_COLORS = {
  "Tolerável": "#10b981",
  "Moderado": "#f59e0b",
  "Substancial": "#f97316",
  "Intolerável": "#ef4444",
};

const incidentTrendData = [
  { mes: "Jan", acidentes: 2, quaseAcidentes: 5 },
  { mes: "Fev", acidentes: 0, quaseAcidentes: 3 },
  { mes: "Mar", acidentes: 1, quaseAcidentes: 4 },
  { mes: "Abr", acidentes: 3, quaseAcidentes: 7 },
  { mes: "Mai", acidentes: 0, quaseAcidentes: 2 },
  { mes: "Jun", acidentes: 1, quaseAcidentes: 4 },
];

function KPICard({ title, value, subtitle, icon, trend, color, loading }: {
  title: string; value: string | number; subtitle?: string; icon: React.ReactNode;
  trend?: "up" | "down" | "neutral"; color: string; loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mb-1" />
            ) : (
              <p className={cn("text-3xl font-extrabold kpi-value", color)}>{value}</p>
            )}
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl shrink-0", `bg-${color.replace("text-", "")}/10`)}>
            <span className={color}>{icon}</span>
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            {trend === "up" && <TrendingUp size={12} className="text-emerald-500" />}
            {trend === "down" && <TrendingDown size={12} className="text-red-500" />}
            {trend === "neutral" && <Minus size={12} className="text-muted-foreground" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertItem({ type, message, count }: { type: "error" | "warning" | "info"; message: string; count?: number }) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };
  const icons = {
    error: <XCircle size={14} />,
    warning: <Clock size={14} />,
    info: <CheckCircle2 size={14} />,
  };
  return (
    <div className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-medium", styles[type])}>
      {icons[type]}
      <span className="flex-1">{message}</span>
      {count !== undefined && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{count}</Badge>}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery({});
  const { data: epis } = trpc.epi.lowStock.useQuery();
  const { data: expiringExams } = trpc.exams.expiring.useQuery({ days: 30 });
  const { data: expiredTrainings } = trpc.trainings.expiring.useQuery({ days: 30 });
  const { data: openActions } = trpc.actionPlans.list.useQuery({});
  const { data: recentIncidents } = trpc.incidents.list.useQuery({});

  const riskPieData = stats ? [
    { name: "Tolerável", value: stats.risksByLevel.toleravel, color: "#10b981" },
    { name: "Moderado", value: stats.risksByLevel.moderado, color: "#f59e0b" },
    { name: "Substancial", value: stats.risksByLevel.substancial, color: "#f97316" },
    { name: "Intolerável", value: stats.risksByLevel.intoleravel, color: "#ef4444" },
  ].filter(d => d.value > 0) : [];

  const pendingActions = openActions?.filter(a => a.status === "Pendente" || a.status === "Em Andamento") || [];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground">Visão geral da gestão SST em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1.5">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Ao vivo
          </Badge>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KPICard
          title="Funcionários Ativos"
          value={isLoading ? "—" : (stats?.activeEmployees ?? 0)}
          subtitle={`${stats?.totalEmployees ?? 0} total`}
          icon={<Users size={20} />}
          color="text-blue-600"
          loading={isLoading}
        />
        <KPICard
          title="Dias Sem Acidente"
          value={isLoading ? "—" : (stats?.daysWithoutAccident ?? 0)}
          subtitle="Acidente com afastamento"
          icon={<Shield size={20} />}
          color="text-emerald-600"
          loading={isLoading}
        />
        <KPICard
          title="Compliance Score"
          value={isLoading ? "—" : `${stats?.complianceScore ?? 0}%`}
          subtitle="Exames em dia"
          icon={<CheckCircle2 size={20} />}
          color={stats && stats.complianceScore >= 80 ? "text-emerald-600" : "text-amber-600"}
          loading={isLoading}
        />
        <KPICard
          title="Taxa de Frequência"
          value={isLoading ? "—" : (stats?.frequencyRate ?? 0)}
          subtitle="por milhão de H/H"
          icon={<Activity size={20} />}
          color="text-orange-600"
          loading={isLoading}
        />
        <KPICard
          title="Riscos Críticos"
          value={isLoading ? "—" : (stats?.highRisks ?? 0)}
          subtitle="Substancial + Intolerável"
          icon={<ShieldAlert size={20} />}
          color={stats && stats.highRisks > 0 ? "text-red-600" : "text-emerald-600"}
          loading={isLoading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Stethoscope size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-xs text-amber-700 font-semibold">Exames a Vencer</p>
              <p className="text-2xl font-bold text-amber-700">{expiringExams?.length ?? 0}</p>
              <p className="text-[10px] text-amber-600">próximos 30 dias</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <HardHat size={20} className="text-red-600 shrink-0" />
            <div>
              <p className="text-xs text-red-700 font-semibold">EPIs Abaixo do Mínimo</p>
              <p className="text-2xl font-bold text-red-700">{epis?.length ?? 0}</p>
              <p className="text-[10px] text-red-600">itens em alerta</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <GraduationCap size={20} className="text-orange-600 shrink-0" />
            <div>
              <p className="text-xs text-orange-700 font-semibold">Treinamentos Vencidos</p>
              <p className="text-2xl font-bold text-orange-700">{expiredTrainings?.length ?? 0}</p>
              <p className="text-[10px] text-orange-600">registros expirados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap size={20} className="text-blue-600 shrink-0" />
            <div>
              <p className="text-xs text-blue-700 font-semibold">Ações em Aberto</p>
              <p className="text-2xl font-bold text-blue-700">{pendingActions.length}</p>
              <p className="text-[10px] text-blue-600">plano 5W2H</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" />
              Tendência de Incidentes (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={incidentTrendData}>
                <defs>
                  <linearGradient id="colorAcidentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorQuase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="acidentes" stroke="#ef4444" fill="url(#colorAcidentes)" name="Acidentes" strokeWidth={2} />
                <Area type="monotone" dataKey="quaseAcidentes" stroke="#f59e0b" fill="url(#colorQuase)" name="Quase Acidentes" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert size={16} className="text-primary" />
              Distribuição de Riscos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {riskPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <ShieldAlert size={32} className="mb-2 opacity-30" />
                <p className="text-xs">Nenhum risco cadastrado</p>
                <Button asChild variant="link" size="sm" className="text-xs mt-1">
                  <Link href="/app/pgr">Cadastrar riscos</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(epis?.length ?? 0) > 0 && (
              <AlertItem type="error" message="EPIs abaixo do estoque mínimo" count={epis?.length} />
            )}
            {(expiringExams?.length ?? 0) > 0 && (
              <AlertItem type="warning" message="Exames ocupacionais a vencer (30 dias)" count={expiringExams?.length} />
            )}
            {(expiredTrainings?.length ?? 0) > 0 && (
              <AlertItem type="warning" message="Treinamentos vencidos ou a vencer" count={expiredTrainings?.length} />
            )}
            {pendingActions.length > 0 && (
              <AlertItem type="info" message="Ações do plano 5W2H em aberto" count={pendingActions.length} />
            )}
            {(epis?.length ?? 0) === 0 && (expiringExams?.length ?? 0) === 0 && (expiredTrainings?.length ?? 0) === 0 && pendingActions.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-xs font-medium">Nenhum alerta crítico no momento</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Incidentes Recentes
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7">
              <Link href="/app/incidents">Ver todos <ArrowRight size={12} className="ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentIncidents && recentIncidents.length > 0 ? (
              <div className="space-y-2">
                {recentIncidents.slice(0, 4).map(incident => (
                  <div key={incident.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", incident.type === "Acidente com Afastamento" ? "bg-red-500" : incident.type === "Quase Acidente" ? "bg-amber-500" : "bg-blue-500")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{incident.type}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(incident.date).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", incident.status === "Encerrado" ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700")}>
                      {incident.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-xs">Nenhum incidente registrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Acesso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/app/pgr", icon: <ShieldAlert size={18} />, label: "PGR", color: "text-blue-600 bg-blue-50" },
            { href: "/app/pcmso", icon: <Stethoscope size={18} />, label: "PCMSO", color: "text-purple-600 bg-purple-50" },
            { href: "/app/epi", icon: <HardHat size={18} />, label: "EPIs", color: "text-orange-600 bg-orange-50" },
            { href: "/app/trainings", icon: <GraduationCap size={18} />, label: "Treinamentos", color: "text-green-600 bg-green-50" },
            { href: "/app/incidents", icon: <AlertTriangle size={18} />, label: "Incidentes", color: "text-red-600 bg-red-50" },
            { href: "/app/esocial", icon: <Activity size={18} />, label: "eSocial SST", color: "text-indigo-600 bg-indigo-50" },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={cn("p-2.5 rounded-xl", item.color)}>{item.icon}</div>
                  <span className="text-xs font-semibold text-foreground">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
