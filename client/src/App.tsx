import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SSTLayout } from "./components/SSTLayout";
import { MouraProvider } from "./contexts/MouraContext";
import MouraSidebar from "./components/MouraSidebar";

const PasswordRecoveryPage = lazy(() =>
  import("./pages/PasswordRecovery").then(module => ({
    default: module.PasswordRecoveryPage,
  }))
);
const AccessManagementPage = lazy(() =>
  import("./pages/AccessManagement").then(module => ({
    default: module.AccessManagementPage,
  }))
);
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const PGR = lazy(() => import("./pages/PGR"));
const PCMSO = lazy(() => import("./pages/PCMSO"));
const EPI = lazy(() => import("./pages/EPI"));
const Trainings = lazy(() => import("./pages/Trainings"));
const Incidents = lazy(() => import("./pages/Incidents"));
const ESocial = lazy(() => import("./pages/ESocial"));
const CIPA = lazy(() => import("./pages/CIPA"));
const Inspections = lazy(() => import("./pages/Inspections"));
const Documents = lazy(() => import("./pages/Documents"));
const ThirdParties = lazy(() => import("./pages/ThirdParties"));
const Costs = lazy(() => import("./pages/Costs"));
const Units = lazy(() => import("./pages/Units"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Settings = lazy(() => import("./pages/Settings"));
const Home = lazy(() => import("./pages/Home"));
const RiskMap = lazy(() => import("./pages/RiskMap"));
const RiskMapNew = lazy(() => import("./pages/RiskMapNew"));
const GHE = lazy(() => import("./pages/GHE"));
const GHEProfessional = lazy(() => import("./pages/GHEProfessional"));
const EnvironmentalAssessments = lazy(
  () => import("./pages/EnvironmentalAssessments")
);
const TechnicalReports = lazy(() => import("./pages/TechnicalReports"));
const LoginPage = lazy(() =>
  import("./pages/Login").then(module => ({ default: module.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/Register").then(module => ({ default: module.RegisterPage }))
);
const AnalyticsDashboardPage = lazy(() =>
  import("./pages/AnalyticsDashboard").then(module => ({
    default: module.AnalyticsDashboardPage,
  }))
);
const CompatibilityMatrix = lazy(() => import("./pages/CompatibilityMatrix"));
const ExecutiveDashboard = lazy(() =>
  import("./pages/ExecutiveDashboard").then(module => ({
    default: module.ExecutiveDashboard,
  }))
);
const EmployeeManagement = lazy(() =>
  import("./pages/EmployeeManagement").then(module => ({
    default: module.EmployeeManagement,
  }))
);
const RiskMapAdvancedPage = lazy(() =>
  import("./pages/RiskMapAdvancedPage").then(module => ({
    default: module.RiskMapAdvancedPage,
  }))
);
const DashboardSST = lazy(() => import("./pages/DashboardSST"));
const VisualRiskMapPage = lazy(() => import("./pages/VisualRiskMapPage"));
const SstDocumentsPage = lazy(() =>
  import("./pages/SstDocuments").then(module => ({
    default: module.SstDocumentsPage,
  }))
);
const SstDocumentGeneratorPage = lazy(() =>
  import("./pages/SstDocumentGenerator").then(module => ({
    default: module.SstDocumentGeneratorPage,
  }))
);
const MouraDashboard = lazy(() => import("./pages/MouraDashboard"));
const MouraGHEManagement = lazy(() => import("./pages/MouraGHEManagement"));
const MouraEmployeeManagement = lazy(
  () => import("./pages/MouraEmployeeManagement")
);
const MouraRiskMap = lazy(() => import("./pages/MouraRiskMap"));

function AppRouter() {
  return (
    <Switch>
      <Route path="/forgot-password">
        <PasswordRecoveryPage />
      </Route>
      <Route path="/reset-password">
        <PasswordRecoveryPage reset />
      </Route>
      <Route path="/app/access">
        <SSTLayout>
          <AccessManagementPage />
        </SSTLayout>
      </Route>
      <Route path="/login">{() => <LoginPage />}</Route>
      <Route path="/register">{() => <RegisterPage />}</Route>
      <Route path="/" component={Home} />
      <Route path="/app/dashboard">
        {() => (
          <SSTLayout>
            <Dashboard />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/dashboard-sst">
        {() => (
          <SSTLayout>
            <DashboardSST />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/executive-dashboard">
        {() => (
          <SSTLayout>
            <ExecutiveDashboard />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/employee-management">
        {() => (
          <SSTLayout>
            <EmployeeManagement />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/risk-map">
        {() => (
          <SSTLayout>
            <RiskMap />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/risk-map-realtime">
        {() => (
          <SSTLayout>
            <RiskMapNew />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/visual-risk-map">
        {() => (
          <SSTLayout>
            <VisualRiskMapPage />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/risk-map-advanced">
        {() => (
          <SSTLayout>
            <RiskMapAdvancedPage />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/ghe">
        {() => (
          <SSTLayout>
            <GHE />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/ghe-professional">
        {() => (
          <SSTLayout>
            <GHEProfessional />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/environmental-assessments">
        {() => (
          <SSTLayout>
            <EnvironmentalAssessments />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/technical-reports">
        {() => (
          <SSTLayout>
            <TechnicalReports />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/sst-documents">
        {() => (
          <SSTLayout>
            <SstDocumentsPage />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/sst-documents/generator">
        {() => (
          <SSTLayout>
            <SstDocumentGeneratorPage />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/sst-documents/:type">
        {params => (
          <SSTLayout>
            <SstDocumentsPage defaultType={params.type} />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/compatibility-matrix">
        {() => (
          <SSTLayout>
            <CompatibilityMatrix />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/employees">
        {() => (
          <SSTLayout>
            <Employees />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/trainings">
        {() => (
          <SSTLayout>
            <Trainings />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/incidents">
        {() => (
          <SSTLayout>
            <Incidents />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/esocial">
        {() => (
          <SSTLayout>
            <ESocial />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/inspections">
        {() => (
          <SSTLayout>
            <Inspections />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/documents">
        {() => (
          <SSTLayout>
            <Documents />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/third-parties">
        {() => (
          <SSTLayout>
            <ThirdParties />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/costs">
        {() => (
          <SSTLayout>
            <Costs />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/units">
        {() => (
          <SSTLayout>
            <Units />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/ai-assistant">
        {() => (
          <SSTLayout>
            <AIAssistant />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/settings">
        {() => (
          <SSTLayout>
            <Settings />
          </SSTLayout>
        )}
      </Route>
      <Route path="/app/analytics">
        {() => (
          <SSTLayout>
            <AnalyticsDashboardPage />
          </SSTLayout>
        )}
      </Route>

      {/* Moura System Routes */}
      <Route path="/moura-dashboard">
        {() => (
          <div className="flex">
            <MouraSidebar />
            <div className="flex-1 ml-64">
              <MouraDashboard />
            </div>
          </div>
        )}
      </Route>

      <Route path="/moura-ghe-management">
        {() => (
          <div className="flex">
            <MouraSidebar />
            <div className="flex-1 ml-64">
              <MouraGHEManagement />
            </div>
          </div>
        )}
      </Route>

      <Route path="/moura-employee-management">
        {() => (
          <div className="flex">
            <MouraSidebar />
            <div className="flex-1 ml-64">
              <MouraEmployeeManagement />
            </div>
          </div>
        )}
      </Route>

      <Route path="/moura-risk-map">
        {() => (
          <div className="flex">
            <MouraSidebar />
            <div className="flex-1 ml-64">
              <MouraRiskMap />
            </div>
          </div>
        )}
      </Route>

      <Route path="/app">
        {() => (
          <SSTLayout>
            <Dashboard />
          </SSTLayout>
        )}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <MouraProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Suspense
              fallback={
                <div role="status" className="p-8 text-slate-500">
                  Carregando módulo…
                </div>
              }
            >
              <AppRouter />
            </Suspense>
          </TooltipProvider>
        </MouraProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
