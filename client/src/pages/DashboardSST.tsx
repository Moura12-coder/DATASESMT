import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  AlertTriangle, CheckCircle2, TrendingUp, Users, Zap, BookOpen,
  BarChart3, Shield, Activity, Target, Clock, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardSST() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Sistema de SST</h1>
          <p className="text-muted-foreground">Gestão Completa de Segurança e Saúde no Trabalho</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Riscos Identificados"
            value="24"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <StatCard
            title="Riscos Controlados"
            value="18"
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            title="Colaboradores Treinados"
            value="156"
            icon={<Users className="w-5 h-5" />}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Conformidade"
            value="92%"
            icon={<Shield className="w-5 h-5" />}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        {/* Main SST Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Component 1: Identificação de Riscos */}
          <ComponentCard
            title="1. Identificação de Riscos"
            description="Mapear todos os perigos presentes no ambiente de trabalho"
            icon={<Target className="w-6 h-6" />}
            color="bg-blue-600"
            items={[
              "Riscos Físicos",
              "Riscos Químicos",
              "Riscos Biológicos",
              "Riscos Ergonômicos",
              "Riscos de Acidentes"
            ]}
            link="/app/risk-identification"
            buttonText="Gerenciar Riscos"
          />

          {/* Component 2: Avaliação de Riscos */}
          <ComponentCard
            title="2. Avaliação de Riscos"
            description="Avaliar gravidade e probabilidade de cada risco"
            icon={<BarChart3 className="w-6 h-6" />}
            color="bg-orange-600"
            items={[
              "Matriz de Risco",
              "Probabilidade",
              "Severidade",
              "Nível de Risco",
              "Priorização"
            ]}
            link="/app/risk-assessment"
            buttonText="Avaliar Riscos"
          />

          {/* Component 3: Controle de Riscos */}
          <ComponentCard
            title="3. Controle de Riscos"
            description="Implementar medidas para mitigar riscos identificados"
            icon={<Shield className="w-6 h-6" />}
            color="bg-green-600"
            items={[
              "Eliminação do Risco",
              "Substituição",
              "Engenharia",
              "Administrativo",
              "EPI"
            ]}
            link="/app/risk-control"
            buttonText="Controlar Riscos"
          />

          {/* Component 4: Treinamento */}
          <ComponentCard
            title="4. Treinamento & Conscientização"
            description="Capacitar colaboradores sobre riscos e prevenção"
            icon={<BookOpen className="w-6 h-6" />}
            color="bg-purple-600"
            items={[
              "Programas de Treinamento",
              "Palestras",
              "Simulados",
              "Certificações",
              "Avaliação"
            ]}
            link="/app/training"
            buttonText="Gerenciar Treinamentos"
          />

          {/* Component 5: Monitoramento */}
          <ComponentCard
            title="5. Monitoramento & Revisão"
            description="Controlar e revisar continuamente os processos"
            icon={<Activity className="w-6 h-6" />}
            color="bg-red-600"
            items={[
              "Inspeções Periódicas",
              "Análise de Dados",
              "Feedback",
              "Auditorias",
              "Relatórios"
            ]}
            link="/app/monitoring"
            buttonText="Monitorar"
          />

          {/* Mapa de Riscos */}
          <ComponentCard
            title="Mapa de Riscos em Tempo Real"
            description="Visualização gráfica dos riscos por área"
            icon={<Zap className="w-6 h-6" />}
            color="bg-cyan-600"
            items={[
              "Visualização SVG",
              "Círculos por Risco",
              "Cores por Nível",
              "Interativo",
              "Exportação"
            ]}
            link="/app/risk-map-realtime"
            buttonText="Ver Mapa"
          />
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ActivityItem
                title="Novo Risco Identificado"
                description="Risco químico na área de produção"
                time="2 horas atrás"
                type="risk"
              />
              <ActivityItem
                title="Treinamento Concluído"
                description="15 colaboradores completaram treinamento de NR-10"
                time="5 horas atrás"
                type="training"
              />
              <ActivityItem
                title="Inspeção Realizada"
                description="Inspeção de segurança na área de almoxarifado"
                time="1 dia atrás"
                type="inspection"
              />
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Status de Conformidade
            </CardTitle>
            <CardDescription>Atendimento às normas regulamentadoras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ComplianceItem label="NR-01" status="Completo" percentage={100} />
              <ComplianceItem label="NR-05" status="Completo" percentage={95} />
              <ComplianceItem label="NR-06" status="Em Progresso" percentage={80} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon, color, bgColor
}: {
  title: string; value: string | number; icon: React.ReactNode; color: string; bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-3xl font-bold mt-2", color)}>{value}</p>
          </div>
          <div className={cn("p-3 rounded-lg", bgColor)}>
            <div className={color}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComponentCard({
  title, description, icon, color, items, link, buttonText
}: {
  title: string; description: string; icon: React.ReactNode; color: string;
  items: string[]; link: string; buttonText: string;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className={cn("h-2", color)} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg text-white", color)}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
        <Button asChild className="w-full" variant="outline">
          <Link href={link}>{buttonText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  title, description, time, type
}: {
  title: string; description: string; time: string; type: "risk" | "training" | "inspection";
}) {
  const icons = {
    risk: <AlertTriangle className="w-4 h-4 text-orange-600" />,
    training: <BookOpen className="w-4 h-4 text-blue-600" />,
    inspection: <CheckCircle2 className="w-4 h-4 text-green-600" />
  };

  return (
    <div className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
      <div className="mt-1">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}

function ComplianceItem({
  label, status, percentage
}: {
  label: string; status: string; percentage: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        <Badge variant={percentage === 100 ? "default" : "secondary"}>{status}</Badge>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">{percentage}%</p>
    </div>
  );
}
