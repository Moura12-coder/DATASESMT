import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SSTLayout } from "./components/SSTLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import PGR from "./pages/PGR";
import PCMSO from "./pages/PCMSO";
import EPI from "./pages/EPI";
import Trainings from "./pages/Trainings";
import Incidents from "./pages/Incidents";
import ESocial from "./pages/ESocial";
import CIPA from "./pages/CIPA";
import Inspections from "./pages/Inspections";
import Documents from "./pages/Documents";
import ThirdParties from "./pages/ThirdParties";
import Costs from "./pages/Costs";
import Units from "./pages/Units";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import Home from "./pages/Home";
import RiskMap from "./pages/RiskMap";
import RiskMapNew from "./pages/RiskMapNew";
import GHE from "./pages/GHE";
import GHEProfessional from "./pages/GHEProfessional";
import EnvironmentalAssessments from "./pages/EnvironmentalAssessments";
import TechnicalReports from "./pages/TechnicalReports";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { AnalyticsDashboardPage } from "./pages/AnalyticsDashboard";
import CompatibilityMatrix from "./pages/CompatibilityMatrix";
import { ExecutiveDashboard } from "./pages/ExecutiveDashboard";
import { EmployeeManagement } from "./pages/EmployeeManagement";
import { RiskMapAdvancedPage } from "./pages/RiskMapAdvancedPage";
import DashboardSST from "./pages/DashboardSST";
import VisualRiskMapPage from "./pages/VisualRiskMapPage";
import { SstDocumentsPage } from "./pages/SstDocuments";
import { SstDocumentGeneratorPage } from "./pages/SstDocumentGenerator";
import { MouraProvider } from "./contexts/MouraContext";
import MouraSidebar from "./components/MouraSidebar";
import MouraDashboard from "./pages/MouraDashboard";
import MouraGHEManagement from "./pages/MouraGHEManagement";
import MouraEmployeeManagement from "./pages/MouraEmployeeManagement";
import MouraRiskMap from "./pages/MouraRiskMap";

function AppRouter() {
  return (
    <Switch>
      <Route path="/login">
        {() => <LoginPage />}
      </Route>
      <Route path="/register">
        {() => <RegisterPage />}
      </Route>
      <Route path="/" component={Home} />
      <Route path="/app/dashboard">
        {() => <SSTLayout><Dashboard /></SSTLayout>}
      </Route>
      <Route path="/app/dashboard-sst">
        {() => <SSTLayout><DashboardSST /></SSTLayout>}
      </Route>
      <Route path="/app/executive-dashboard">
        {() => <SSTLayout><ExecutiveDashboard /></SSTLayout>}
      </Route>
      <Route path="/app/employee-management">
        {() => <SSTLayout><EmployeeManagement /></SSTLayout>}
      </Route>
      <Route path="/app/risk-map">
        {() => <SSTLayout><RiskMap /></SSTLayout>}
      </Route>
      <Route path="/app/risk-map-realtime">
        {() => <SSTLayout><RiskMapNew /></SSTLayout>}
      </Route>
      <Route path="/app/visual-risk-map">
        {() => <SSTLayout><VisualRiskMapPage /></SSTLayout>}
      </Route>
      <Route path="/app/risk-map-advanced">
        {() => <SSTLayout><RiskMapAdvancedPage /></SSTLayout>}
      </Route>
      <Route path="/app/ghe">
        {() => <SSTLayout><GHE /></SSTLayout>}
      </Route>
      <Route path="/app/ghe-professional">
        {() => <SSTLayout><GHEProfessional /></SSTLayout>}
      </Route>
      <Route path="/app/environmental-assessments">
        {() => <SSTLayout><EnvironmentalAssessments /></SSTLayout>}
      </Route>
      <Route path="/app/technical-reports">
        {() => <SSTLayout><TechnicalReports /></SSTLayout>}
      </Route>
      <Route path="/app/sst-documents">
        {() => <SSTLayout><SstDocumentsPage /></SSTLayout>}
      </Route>
      <Route path="/app/sst-documents/generator">
        {() => <SSTLayout><SstDocumentGeneratorPage /></SSTLayout>}
      </Route>
      <Route path="/app/sst-documents/:type">
        {(params) => <SSTLayout><SstDocumentsPage defaultType={params.type} /></SSTLayout>}
      </Route>
      <Route path="/app/compatibility-matrix">
        {() => <SSTLayout><CompatibilityMatrix /></SSTLayout>}
      </Route>
      <Route path="/app/employees">
        {() => <SSTLayout><Employees /></SSTLayout>}
      </Route>
      <Route path="/app/trainings">
        {() => <SSTLayout><Trainings /></SSTLayout>}
      </Route>
      <Route path="/app/incidents">
        {() => <SSTLayout><Incidents /></SSTLayout>}
      </Route>
      <Route path="/app/esocial">
        {() => <SSTLayout><ESocial /></SSTLayout>}
      </Route>
      <Route path="/app/inspections">
        {() => <SSTLayout><Inspections /></SSTLayout>}
      </Route>
      <Route path="/app/documents">
        {() => <SSTLayout><Documents /></SSTLayout>}
      </Route>
      <Route path="/app/third-parties">
        {() => <SSTLayout><ThirdParties /></SSTLayout>}
      </Route>
      <Route path="/app/costs">
        {() => <SSTLayout><Costs /></SSTLayout>}
      </Route>
      <Route path="/app/units">
        {() => <SSTLayout><Units /></SSTLayout>}
      </Route>
      <Route path="/app/ai-assistant">
        {() => <SSTLayout><AIAssistant /></SSTLayout>}
      </Route>
      <Route path="/app/settings">
        {() => <SSTLayout><Settings /></SSTLayout>}
      </Route>
      <Route path="/app/analytics">
        {() => <SSTLayout><AnalyticsDashboardPage /></SSTLayout>}
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
        {() => <SSTLayout><Dashboard /></SSTLayout>}
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
            <AppRouter />
          </TooltipProvider>
        </MouraProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
