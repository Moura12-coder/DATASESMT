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
import { Plus, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function EnvironmentalAssessments() {
  const [unitId] = useState(1);
  const [selectedGHE, setSelectedGHE] = useState<number | undefined>(undefined);
  const [newAssessmentForm, setNewAssessmentForm] = useState({
    agentType: "Químico",
    agentName: "",
    measurementValue: "",
    unit: "",
    limiteTolerance: "",
    responsible: "",
    notes: "",
  });

  // Queries
  const { data: gheList } = trpc.phase1.ghe.list.useQuery({ unitId });
  const { data: assessments } = selectedGHE
    ? { data: [] as any[] }
    : { data: [] as any[] };
  const { data: ppraReport } = trpc.phase1.environmentalAssessments.generatePPRA.useQuery({ unitId });

  // Mutations
  const createAssessmentMutation = trpc.phase1.environmentalAssessments.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação ambiental registrada");
      setNewAssessmentForm({
        agentType: "Químico",
        agentName: "",
        measurementValue: "",
        unit: "",
        limiteTolerance: "",
        responsible: "",
        notes: "",
      });
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const handleCreateAssessment = () => {
    if (!selectedGHE || !newAssessmentForm.agentName || !newAssessmentForm.measurementValue) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createAssessmentMutation.mutate({
      gheId: selectedGHE,
      agentType: newAssessmentForm.agentType as any,
      agentName: newAssessmentForm.agentName,
      measurementValue: Number(newAssessmentForm.measurementValue),
      unit: newAssessmentForm.unit,
      limiteTolerance: newAssessmentForm.limiteTolerance ? Number(newAssessmentForm.limiteTolerance) : 0,
      date: new Date(),
      responsible: newAssessmentForm.responsible,
      notes: newAssessmentForm.notes,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Conforme":
        return "bg-green-100 text-green-800";
      case "Não Conforme":
        return "bg-red-100 text-red-800";
      case "Atenção":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Conforme":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Não Conforme":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "Atenção":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  // Preparar dados para gráfico
  const chartData = (assessments as any[])?.map((a: any) => ({
    date: new Date(a.date).toLocaleDateString("pt-BR"),
    value: a.measurementValue,
    limite: a.limiteTolerance || 0,
    agent: a.agentName,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Avaliações Ambientais</h1>
        <p className="text-gray-600">Medições de Agentes Químicos, Físicos, Biológicos (NR-09)</p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          Registre as medições de agentes ambientais e compare com os Limites de Tolerância (LT). Os dados são centralizados e disponibilizados para gerar automaticamente documentos de SST (PGR, PCMSO, LTCAT, LTIP) no menu Documentos de SST.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="assessments" className="w-full">
        <TabsList>
          <TabsTrigger value="assessments">Avaliações</TabsTrigger>
          <TabsTrigger value="ppra">Relatório de Avaliações</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        {/* TAB: Avaliações */}
        <TabsContent value="assessments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Medições de Agentes Ambientais</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Nova Avaliação</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Avaliação Ambiental</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>GHE</Label>
                    <Select value={selectedGHE ? selectedGHE.toString() : ""} onValueChange={(v) => setSelectedGHE(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um GHE" />
                      </SelectTrigger>
                      <SelectContent>
                        {gheList?.map((ghe) => (
                          <SelectItem key={ghe.id} value={ghe.id.toString()}>
                            {ghe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo de Agente</Label>
                    <Select
                      value={newAssessmentForm.agentType}
                      onValueChange={(v) => setNewAssessmentForm({ ...newAssessmentForm, agentType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Químico">Químico</SelectItem>
                        <SelectItem value="Físico">Físico (Ruído, Calor, Radiação)</SelectItem>
                        <SelectItem value="Biológico">Biológico</SelectItem>
                        <SelectItem value="Ergonômico">Ergonômico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Nome do Agente</Label>
                    <Input
                      placeholder="Ex: Benzeno, Ruído, Calor"
                      value={newAssessmentForm.agentName}
                      onChange={(e) => setNewAssessmentForm({ ...newAssessmentForm, agentName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Medido</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="50"
                        value={newAssessmentForm.measurementValue}
                        onChange={(e) => setNewAssessmentForm({ ...newAssessmentForm, measurementValue: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Unidade</Label>
                      <Input
                        placeholder="ppm, mg/m³, dB"
                        value={newAssessmentForm.unit}
                        onChange={(e) => setNewAssessmentForm({ ...newAssessmentForm, unit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Limite de Tolerância (LT)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="100"
                      value={newAssessmentForm.limiteTolerance}
                      onChange={(e) => setNewAssessmentForm({ ...newAssessmentForm, limiteTolerance: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Responsável</Label>
                    <Input
                      placeholder="Engenheiro SST"
                      value={newAssessmentForm.responsible}
                      onChange={(e) => setNewAssessmentForm({ ...newAssessmentForm, responsible: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Input
                      placeholder="Notas adicionais"
                      value={newAssessmentForm.notes}
                      onChange={(e) => setNewAssessmentForm({ ...newAssessmentForm, notes: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleCreateAssessment} disabled={createAssessmentMutation.isPending} className="w-full">
                    {createAssessmentMutation.isPending ? "Registrando..." : "Registrar Avaliação"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {(assessments as any[])?.map((assessment: any) => (
              <Card key={assessment.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold">{assessment.agentName}</p>
                      <p className="text-sm text-gray-600">{assessment.agentType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assessment.status)}
                      <Badge className={getStatusColor(assessment.status)}>{assessment.status}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Valor Medido</p>
                      <p className="font-semibold">
                        {assessment.measurementValue} {assessment.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Limite de Tolerância</p>
                      <p className="font-semibold">
                        {assessment.limiteTolerance} {assessment.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Data</p>
                      <p className="font-semibold">{new Date(assessment.date).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>

                  {assessment.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">{assessment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: PPRA */}
        <TabsContent value="ppra" className="space-y-4">
          {ppraReport ? (
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Avaliações</CardTitle>
                <CardDescription>Programa de Prevenção de Riscos Ambientais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge>{ppraReport.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data</p>
                    <p className="font-semibold">{new Date(ppraReport.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">GHEs Avaliados</p>
                  <p className="font-semibold">{ppraReport.ghe?.length || 0} GHEs</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-50">
              <CardContent className="pt-6 text-center text-gray-600">
                Nenhuma avaliação registrada ainda. Registre avaliações ambientais para visualizar o relatório e gerar documentos de SST.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Tendências */}
        <TabsContent value="trends" className="space-y-4">
          {chartData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendências de Medições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Valor Medido" />
                    <Line type="monotone" dataKey="limite" stroke="#ef4444" name="Limite de Tolerância" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-50">
              <CardContent className="pt-6 text-center text-gray-600">
                Nenhuma avaliação registrada para exibir tendências
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
