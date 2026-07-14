import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  ShieldPlus, LayoutDashboard, Users, ShieldAlert, Stethoscope,
  HardHat, GraduationCap, AlertTriangle, Activity, FileText,
  Bot, CheckCircle, ArrowRight, Building2, ClipboardCheck
} from "lucide-react";

const features = [
  { icon: <LayoutDashboard size={20} />, title: "Dashboard Executivo", desc: "KPIs em tempo real, taxa de frequência, gravidade e compliance score." },
  { icon: <ShieldAlert size={20} />, title: "PGR (NR-01)", desc: "Inventário de riscos com matriz probabilidade x severidade e plano 5W2H." },
  { icon: <Stethoscope size={20} />, title: "PCMSO (NR-07)", desc: "Agenda de exames, ASO digital e alertas automáticos de vencimento." },
  { icon: <HardHat size={20} />, title: "EPIs (NR-06)", desc: "Controle de estoque, ficha digital e histórico de entregas por funcionário." },
  { icon: <GraduationCap size={20} />, title: "Treinamentos", desc: "Matriz por cargo/função, calendário e relatório de conformidade por NR." },
  { icon: <AlertTriangle size={20} />, title: "Incidentes / CAT", desc: "Investigação com 5 Porquês, registro de CAT e plano de ação corretiva." },
  { icon: <Activity size={20} />, title: "Central eSocial SST", desc: "Gestão dos eventos S-2210, S-2220, S-2240 e S-2245 com histórico." },
  { icon: <Bot size={20} />, title: "Assistente IA", desc: "Análise de riscos, sugestões de controle e geração de documentos SST." },
  { icon: <FileText size={20} />, title: "Documentos e Laudos", desc: "PGR, PCMSO, LTCAT, PPP, ASO com controle de revisões e armazenamento." },
  { icon: <Users size={20} />, title: "Gestão de Funcionários", desc: "CRUD completo, histórico médico/ocupacional e gestão de afastamentos." },
  { icon: <ClipboardCheck size={20} />, title: "Inspeções de Campo", desc: "Checklist digital por NR, registro de não conformidades e plano de ação." },
  { icon: <Building2 size={20} />, title: "Multi-Unidades", desc: "Suporte a múltiplas unidades, filiais e canteiros de obra." },
];

const nrs = ["NR-01", "NR-05", "NR-06", "NR-07", "NR-09", "NR-15", "NR-17", "NR-35", "eSocial SST"];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-blue-800 bg-blue-950 text-white sticky top-0 z-50 shadow-md">
        <div className="h-16 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <svg width="48" height="48" viewBox="0 0 28 28" fill="none" className="text-blue-400 flex-shrink-0">
              <rect x="4" y="4" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="14" cy="14" r="6" fill="currentColor" opacity="0.8"/>
              <path d="M14 8V6M14 22v-2M8 14H6m16 0h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div className="flex flex-col leading-tight">
              <h1 className="text-2xl font-black text-white tracking-tight">MOURA</h1>
              <p className="text-[11px] font-bold text-blue-200 tracking-widest">TECHNOLOGY</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-600 text-white">
                <Link href="/app/dashboard">
                  <LayoutDashboard size={14} className="mr-1.5" /> Acessar Sistema
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-600 text-white">
                <Link href="/login">Entrar <ArrowRight size={14} className="ml-1.5" /></Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 px-4 text-white overflow-hidden animate-fade-in-up">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(\"/manus-storage/NetMFj8vIf34_0b93a976.jpg\")` }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-cyan-700/80"></div>
        <div className="container relative z-10 text-center max-w-4xl">
          <Badge variant="outline" className="mb-6 text-xs font-semibold px-3 py-1 border-white/50 text-white">
            🇧🇷 Plataforma SST 100% Brasileira
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
            Gestão Completa de{" "}
            <span className="text-white">Saúde e Segurança</span>{" "}
            do Trabalho
          </h1>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Plataforma enterprise para profissionais de SST. Cobertura total das obrigações legais brasileiras — NRs e eSocial SST — com dashboards em tempo real e inteligência artificial integrada.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {nrs.map(nr => (
              <Badge key={nr} variant="secondary" className="text-xs font-semibold px-3 py-1 bg-white/20 text-white border-white/30">{nr}</Badge>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Button asChild size="lg" className="text-base px-8 bg-white text-blue-900 hover:bg-gray-100">
                <Link href="/app/dashboard">
                  <LayoutDashboard size={18} className="mr-2" /> Ir para o Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="text-base px-8 bg-white text-blue-900 hover:bg-gray-100">
                <Link href="/login">
                  Começar Agora <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-gray-50 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Módulos Completos</h2>
            <p className="text-gray-600">Tudo que você precisa para gerir SST em um único sistema</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col items-start text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">{f.icon}</div>
                  <h3 className="font-bold text-base text-gray-800">{f.title}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-900 text-white animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="container text-center max-w-2xl">
          <div className="rounded-2xl p-10">
            <ShieldPlus size={40} className="mx-auto mb-4 opacity-70" />
            <h2 className="text-2xl font-bold mb-3">Pronto para começar?</h2>
            <p className="opacity-70 mb-6 text-sm leading-relaxed">
              Acesse o sistema completo de gestão SST. Conformidade com todas as NRs e eSocial SST.
            </p>
            {isAuthenticated ? (
              <Button asChild variant="secondary" size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                <Link href="/app/dashboard">Acessar o Sistema</Link>
              </Button>
            ) : (
              <Button asChild variant="secondary" size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                <Link href="/login">Entrar no Sistema</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 bg-gray-50">
        <div className="container text-center text-xs text-gray-600">
          <p>© 2026 DataSESMT Pro — Plataforma de Gestão de Saúde e Segurança do Trabalho</p>
          <p className="mt-1">Desenvolvido em conformidade com a legislação brasileira vigente</p>
        </div>
      </footer>
    </div>
  );
}
