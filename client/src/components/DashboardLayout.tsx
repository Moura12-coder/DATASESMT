import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  Shield,
  AlertTriangle,
  FileText,
  Settings,
  BarChart3,
  Zap,
  Bell,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app", section: "VISÃO GERAL" },
  { icon: Zap, label: "Assistente IA", path: "/app/ai-assistant", section: "VISÃO GERAL" },
  
  { icon: Users, label: "Funcionários", path: "/app/employees", section: "EMPRESA" },
  { icon: Shield, label: "Unidades / Filiais", path: "/app/units", section: "EMPRESA" },
  
  { icon: AlertTriangle, label: "Mapa de Riscos", path: "/app/risk-map", section: "SEGURANÇA DO TRABALHO" },
  { icon: FileText, label: "Documentos de SST", path: "/app/documents", section: "SEGURANÇA DO TRABALHO" },
  { icon: BarChart3, label: "Analytics", path: "/app/analytics", section: "SEGURANÇA DO TRABALHO" },
  
  { icon: Settings, label: "Configurações", path: "/app/settings", section: "GESTÃO" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 200;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Faça login para continuar
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Acesso ao dashboard requer autenticação.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Group menu items by section
  const groupedItems = menuItems.reduce(
    (acc, item) => {
      const section = item.section || "OTHER";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, typeof menuItems>
  );

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 !bg-transparent"
          style={{
            backgroundColor: "#244E96 !important",
            background: "#244E96 !important",
          } as any}
          disableTransition={isResizing}
        >
          {/* Header with Logo */}
          <SidebarHeader 
            className="h-16 justify-center border-b px-0"
            style={{
              background: "#244E96 !important" as any,
              borderColor: "#244E96 !important",
            }}
          >
            <div className="flex items-center gap-3 px-4 transition-all w-full">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white text-sm">MOURA</span>
                  <span className="text-xs text-blue-300">TECHNOLOGY</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Content */}
          <SidebarContent className="gap-4 py-4" style={{ background: "#244E96 !important" } as any}>
            {Object.entries(groupedItems).map(([section, items]) => (
              <div key={section}>
                {!isCollapsed && (
                  <div className="px-4 py-2">
                    <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                      {section}
                    </p>
                  </div>
                )}
                <SidebarMenu className="px-2 space-y-1">
                  {items.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-10 transition-all font-medium text-sm rounded-lg ${
                            isActive
                              ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md"
                              : "text-white hover:bg-blue-800/50 hover:text-white"
                          }`}
                        >
                          <item.icon className="h-4 w-4" style={{ color: '#ffffff' }} />
                          <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '14px' }}>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter 
            className="p-3 border-t"
            style={{
              background: "#244E96 !important",
              borderColor: "#244E96 !important",
            }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-blue-800/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
                  <Avatar className="h-9 w-9 border border-blue-600 flex-shrink-0 bg-gradient-to-br from-orange-500 to-orange-600">
                    <AvatarFallback className="text-xs font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-none text-white">
                        {user?.name || "-"}
                      </p>
                      <p className="text-xs text-blue-300 truncate mt-1">
                        {user?.email || "-"}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize Handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500/30 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      {/* Main Content */}
      <SidebarInset className="bg-white">
        {/* Top Bar - Blue Header */}
        <div className="h-16 border-b border-blue-900 bg-gradient-to-r from-blue-900 to-cyan-700 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-white hover:text-cyan-200" />
            <div className="h-6 w-px bg-blue-700" />
            <h1 className="text-lg font-semibold" style={{ color: '#ffffff', fontWeight: '700' }}>
              {menuItems.find((item) => item.path === location)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full hover:bg-blue-800 flex items-center justify-center text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full hover:bg-blue-800 flex items-center justify-center text-white transition-colors">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {children}
        </div>
      </SidebarInset>
    </>
  );
}
