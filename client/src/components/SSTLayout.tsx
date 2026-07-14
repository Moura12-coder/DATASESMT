import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import {
  LayoutDashboard, Users, ShieldAlert, Stethoscope, HardHat, GraduationCap,
  AlertTriangle, FileText, Users2, ClipboardCheck, FolderOpen, Building2,
  Truck, DollarSign, Bot, ChevronDown, ChevronRight, Menu, X, Bell,
  LogOut, Settings, Shield, ShieldPlus, Activity, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
  children?: NavItem[];
}

const navStructure: { category: string; items: NavItem[] }[] = [
  {
    category: "Visão Geral",
    items: [
      { label: "Dashboard", href: "/app/dashboard", icon: <LayoutDashboard size={16} /> },
      { label: "Assistente IA", href: "/app/ai-assistant", icon: <Bot size={16} /> },
    ],
  },
  {
    category: "Empresa",
    items: [
      { label: "Unidades / Filiais", href: "/app/units", icon: <Building2 size={16} /> },
      { label: "Funcionários", href: "/app/employees", icon: <Users size={16} /> },
      { label: "Terceiros", href: "/app/third-parties", icon: <Truck size={16} /> },
    ],
  },
  {
    category: "Segurança do Trabalho",
    items: [
      { label: "Mapa de Riscos", href: "/app/risk-map", icon: <ShieldPlus size={16} /> },
      { label: "GHE (Grupos Homogêneos)", href: "/app/ghe", icon: <ShieldAlert size={16} /> },
      { label: "Avaliações Ambientais", href: "/app/environmental-assessments", icon: <Activity size={16} /> },
      {
        label: "Documentos de SST",
        icon: <FileText size={16} />,
        children: [
          { label: "PGR (NR-01)", href: "/app/sst-documents/pgr", icon: <ShieldAlert size={16} /> },
          { label: "PCMSO (NR-07)", href: "/app/sst-documents/pcmso", icon: <Stethoscope size={16} /> },
          { label: "LTCAT", href: "/app/sst-documents/ltcat", icon: <FileText size={16} /> },
          { label: "LTIP", href: "/app/sst-documents/ltip", icon: <FileText size={16} /> },
          { label: "Ordem de Serviço", href: "/app/sst-documents/work-order", icon: <ClipboardCheck size={16} /> },
          { label: "Permissão de Trabalho", href: "/app/sst-documents/work-permit", icon: <ClipboardCheck size={16} /> },
          { label: "APR", href: "/app/sst-documents/apr", icon: <AlertTriangle size={16} /> },
          { label: "ASO", href: "/app/sst-documents/aso", icon: <Stethoscope size={16} /> },
          { label: "Ficha de Controle de EPI", href: "/app/sst-documents/epi-control", icon: <HardHat size={16} /> },
          { label: "Avaliação Ergonômica", href: "/app/sst-documents/ergonomic", icon: <Activity size={16} /> },
          { label: "CIPA (NR-05)", href: "/app/sst-documents/cipa", icon: <Users2 size={16} /> },
        ],
      },
      { label: "Matriz de Compatibilidade", href: "/app/compatibility-matrix", icon: <ClipboardCheck size={16} /> },
      { label: "Inspeções de Campo", href: "/app/inspections", icon: <ClipboardCheck size={16} /> },
      { label: "Incidentes / CAT", href: "/app/incidents", icon: <AlertTriangle size={16} /> },
    ],
  },
  {
    category: "Saúde Ocupacional",
    items: [
      { label: "Treinamentos", href: "/app/trainings", icon: <GraduationCap size={16} /> },
    ],
  },
  {
    category: "Obrigações Legais",
    items: [
      { label: "Central eSocial SST", href: "/app/esocial", icon: <Activity size={16} /> },
      { label: "Documentos", href: "/app/documents", icon: <FolderOpen size={16} /> },
    ],
  },
  {
    category: "Gestão",
    items: [
      { label: "Custos SST", href: "/app/costs", icon: <DollarSign size={16} /> },
      { label: "Configurações", href: "/app/settings", icon: <Settings size={16} /> },
    ],
  },
];

function NavLink({ item, collapsed, depth = 0 }: { item: NavItem; collapsed: boolean; depth?: number }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = item.href ? location === item.href || location.startsWith(item.href + "/") : false;
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = item.children?.some(c => c.href && (location === c.href || location.startsWith(c.href + "/")));

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
            (isActive || isChildActive) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <span className="shrink-0">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>
              <ChevronDown size={12} className={cn("transition-transform duration-200", open && "rotate-180")} />
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
            {item.children!.map((child, i) => (
              <NavLink key={i} item={child} collapsed={false} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const linkContent = (
    <Link href={item.href!}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer",
        isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        collapsed && "justify-center px-2"
      )}>
        <span className="shrink-0">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && (
              <Badge variant={item.badgeVariant || "secondary"} className="text-[10px] h-4 px-1.5 min-w-[18px] justify-center">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </div>
    </Link>
  );

  if (collapsed && item.href) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function SSTLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { data: notifications } = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  if (loading) return <DashboardLayoutSkeleton />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="flex justify-center">
            <div className="bg-primary p-4 rounded-2xl shadow-lg">
              <ShieldPlus size={40} className="text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">DataSESMT Pro</h1>
            <p className="text-muted-foreground mt-2">Plataforma completa de Gestão de SST</p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Entrar no Sistema</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out shrink-0 z-40",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}>
        {/* Header */}
        <div className={cn("h-16 flex items-center border-b-2 border-blue-600 shrink-0 justify-center bg-gradient-to-r from-blue-50 to-cyan-50 px-4 shadow-md gap-2")}>
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none" className="text-blue-900 flex-shrink-0">
            <rect x="4" y="4" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="14" cy="14" r="6" fill="currentColor" opacity="0.8"/>
            <path d="M14 8V6M14 22v-2M8 14H6m16 0h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div className="text-center">
            <h1 className="text-lg font-black text-blue-900 tracking-tight">MOURA</h1>
            <p className="text-[9px] font-bold text-cyan-600 tracking-widest">TECHNOLOGY</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2 space-y-4">
          {navStructure.map((section, si) => (
            <div key={si}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                  {section.category}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item, ii) => (
                  <NavLink key={ii} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className={cn("border-t border-sidebar-border p-2 shrink-0", collapsed ? "flex justify-center" : "")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setCollapsed(false)} className="p-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all">
                  <ChevronRight size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expandir menu</TooltipContent>
            </Tooltip>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-all text-left">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name || "Usuário"}</p>
                    <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email || ""}</p>
                  </div>
                  <ChevronDown size={12} className="text-sidebar-foreground/40 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs">Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => setCollapsed(true)}>
                  <ChevronLeft size={14} className="mr-2" /> Recolher menu
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-xs text-destructive cursor-pointer" 
                  onSelect={async () => {
                    try {
                      console.log('Starting logout...');
                      await logout();
                      console.log('Logout successful');
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                >
                  <LogOut size={14} className="mr-2" /> Encerrar Sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-card border-b border-border flex items-center gap-3 px-4 shrink-0 shadow-sm">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/app/dashboard">
                <button className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>{unreadCount > 0 ? `${unreadCount} notificações` : "Sem notificações"}</TooltipContent>
          </Tooltip>

          {/* User Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-0 rounded-lg hover:bg-accent transition-all">
                <Avatar className="h-7 w-7 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">{user?.name || "Usuário"}</DropdownMenuLabel>
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">{user?.email || ""}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => window.location.href = '/app/settings'}>
                <Settings size={14} className="mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-xs text-destructive cursor-pointer" 
                onSelect={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
              >
                <LogOut size={14} className="mr-2" /> Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
