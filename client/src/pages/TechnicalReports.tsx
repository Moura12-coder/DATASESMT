import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, FileText, CheckCircle, Clock, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";

export default function TechnicalReports() {
  const [unitId] = useState(1);
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [newReportForm, setNewReportForm] = useState({
    type: "LTCAT",
    title: "",
    author: "",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  // Queries
  const { data: reports } = { data: [] as any[] };
  const { data: history } = { data: [] as any[] };

  // Mutations
  const createReportMutation = trpc.phase1.technicalReports.create.useMutation({
    onSuccess: () => {
      toast.success("Laudo criado com sucesso");
      setNewReportForm({
        type: "LTCAT",
        title: "",
        author: "",
        validFrom: new Date().toISOString().split("T")[0],
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const approveMutation = trpc.phase1.technicalReports.approve.useMutation({
    onSuccess: () => {
      toast.success("Laudo aprovado com sucesso");
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const handleCreateReport = () => {
    if (!newReportForm.title || !newReportForm.author) {
      toast.error("Preencha título e autor");
      return;
    }

    createReportMutation.mutate({
      unitId,
      type: newReportForm.type as any,
      title: newReportForm.title,
      author: newReportForm.author,
      validFrom: new Date(newReportForm.validFrom),
      validUntil: new Date(newReportForm.validUntil),
    });
  };

  const handleApprove = (reportId: number) => {
    approveMutation.mutate({
      reportId,
      approver: "Gerente de SST",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Rascunho":
        return "bg-gray-100 text-gray-800";
      case "Aguardando Aprovação":
        return "bg-yellow-100 text-yellow-800";
      case "Aprovado":
        return "bg-blue-100 text-blue-800";
      case "Vigente":
        return "bg-green-100 text-green-800";
      case "Expirado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Vigente":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Aguardando Aprovação":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "Expirado":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      LTCAT: "Laudo Técnico de Condições Ambientais do Trabalho",
      PPP: "Perfil Profissiográfico Previdenciário",
      PPRA: "Programa de Prevenção de Riscos Ambientais",
      PGR: "Programa de Gerenciamento de Riscos",
      LAUDO_ERGONOMICO: "Laudo Ergonômico",
      LAUDO_AMBIENTAL: "Laudo Ambiental",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Laudos Técnicos</h1>
        <p className="text-gray-600">Versionamento, rastreabilidade e controle de revisões</p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          Todos os laudos técnicos (LTCAT, PPP, PPRA, PGR, etc.) são versionados automaticamente. Cada aprovação cria uma nova revisão com rastreabilidade completa.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">Laudos</TabsTrigger>
          <TabsTrigger value="history">Histórico de Revisões</TabsTrigger>
        </TabsList>

        {/* TAB: Laudos */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Laudos Técnicos da Unidade</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Novo Laudo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Laudo Técnico</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Laudo</Label>
                    <Select value={newReportForm.type} onValueChange={(v) => setNewReportForm({ ...newReportForm, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LTCAT">LTCAT - Laudo Técnico de Condições Ambientais</SelectItem>
                        <SelectItem value="PPP">PPP - Perfil Profissiográfico Previdenciário</SelectItem>
                        <SelectItem value="PPRA">PPRA - Programa de Prevenção de Riscos Ambientais</SelectItem>
                        <SelectItem value="PGR">PGR - Programa de Gerenciamento de Riscos</SelectItem>
                        <SelectItem value="LAUDO_ERGONOMICO">Laudo Ergonômico</SelectItem>
                        <SelectItem value="LAUDO_AMBIENTAL">Laudo Ambiental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Título</Label>
                    <Input
                      placeholder="Título do laudo"
                      value={newReportForm.title}
                      onChange={(e) => setNewReportForm({ ...newReportForm, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Autor</Label>
                    <Input
                      placeholder="Nome do Engenheiro SST"
                      value={newReportForm.author}
                      onChange={(e) => setNewReportForm({ ...newReportForm, author: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Válido de</Label>
                      <Input
                        type="date"
                        value={newReportForm.validFrom}
                        onChange={(e) => setNewReportForm({ ...newReportForm, validFrom: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Válido até</Label>
                      <Input
                        type="date"
                        value={newReportForm.validUntil}
                        onChange={(e) => setNewReportForm({ ...newReportForm, validUntil: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={handleCreateReport} disabled={createReportMutation.isPending} className="w-full">
                    {createReportMutation.isPending ? "Criando..." : "Criar Laudo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {(reports as any[])?.map((report: any) => (
              <Card
                key={report.id}
                className={`cursor-pointer transition-colors ${selectedReport === report.id ? "border-blue-500 bg-blue-50" : ""}`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <CardTitle>{report.title}</CardTitle>
                      </div>
                      <CardDescription>{getReportTypeLabel(report.type)}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.status)}
                      <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Revisão</p>
                      <p className="font-semibold">{report.revision}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Autor</p>
                      <p className="font-semibold">{report.author}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Válido de</p>
                      <p className="font-semibold">{new Date(report.validFrom).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Válido até</p>
                      <p className="font-semibold">{new Date(report.validUntil).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>

                  {report.status === "Rascunho" && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(report.id);
                      }}
                      disabled={approveMutation.isPending}
                    >
                      Aprovar Laudo
                    </Button>
                  )}

                  {report.status === "Vigente" && (
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Baixar PDF
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}

            {reports?.length === 0 && (
              <Card className="bg-gray-50">
                <CardContent className="pt-6 text-center text-gray-600">
                  Nenhum laudo técnico registrado
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* TAB: Histórico */}
        <TabsContent value="history" className="space-y-4">
          {!selectedReport ? (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800">Selecione um laudo para ver seu histórico de revisões</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(history as any[])?.map((revision: any, index: number) => (
                <Card key={revision.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold">Revisão {revision.revision}</p>
                        <p className="text-sm text-gray-600">Status: {revision.status}</p>
                      </div>
                      <Badge variant="outline">{new Date(revision.date).toLocaleDateString("pt-BR")}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Autor</p>
                        <p className="font-semibold">{revision.author}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Aprovador</p>
                        <p className="font-semibold">{revision.approver || "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Válido de</p>
                        <p className="font-semibold">{new Date(revision.validFrom).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Válido até</p>
                        <p className="font-semibold">{new Date(revision.validUntil).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>

                    {revision.status === "Aprovado" && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          Aprovado em {new Date(revision.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
