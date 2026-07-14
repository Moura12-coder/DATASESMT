import { useState } from "react";

interface GHEFormData {
  code: string;
  name: string;
  description: string;
  location: string;
  responsible: string;
  status: string;
}

import { skipToken } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Plus, Trash2, Users, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { GHEAuditHistory } from "@/components/GHEAuditHistory";

export default function GHE() {
  const [unitId] = useState(1);
  const [selectedGHE, setSelectedGHE] = useState<number | null>(null);
  const [selectedGHEs, setSelectedGHEs] = useState<Set<number>>(new Set());
  const [editingGHE, setEditingGHE] = useState<number | null>(null);
  const [newGHEForm, setNewGHEForm] = useState<GHEFormData>({ code: "", name: "", description: "", location: "", responsible: "", status: "Ativo" });
  const [editGHEForm, setEditGHEForm] = useState<GHEFormData>({ code: "", name: "", description: "", location: "", responsible: "", status: "Ativo" });
  const [newAgentForm, setNewAgentForm] = useState({
    agentType: "Químico",
    agentName: "",
    riskLevel: "Moderado",
    limiteTolerance: "",
    unit: "",
  });
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Queries
  const { data: gheList = [] } = trpc.phase1.ghe.list.useQuery({ unitId });
  const { data: employees = [] } = trpc.phase1.ghe.getEmployees.useQuery(
    { gheId: selectedGHE! },
    { enabled: !!selectedGHE }
  );
  const { data: exposureAgents = [] } = trpc.phase1.ghe.getExposureAgents.useQuery(
    { gheId: selectedGHE! },
    { enabled: !!selectedGHE }
  );

  // Mutations
  const utils = trpc.useUtils();

  const createGHEMutation = trpc.phase1.ghe.create.useMutation({
    onSuccess: () => {
      toast.success("GHE criado com sucesso");
      setNewGHEForm({ code: "", name: "", description: "", location: "", responsible: "", status: "Ativo" });
      utils.phase1.ghe.list.invalidate({ unitId });
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deleteGHEMutation = trpc.phase1.ghe.delete.useMutation({
    onSuccess: () => {
      toast.success("GHE excluído com sucesso");
      setSelectedGHE(null);
      utils.phase1.ghe.list.invalidate({ unitId });
    },
    onError: (error) => toast.error(`Erro ao excluir: ${error.message}`),
  });

  const addAgentMutation = trpc.phase1.ghe.addExposureAgent.useMutation({
    onSuccess: () => {
      toast.success("Agente de exposição adicionado");
      setNewAgentForm({ agentType: "Químico", agentName: "", riskLevel: "Moderado", limiteTolerance: "", unit: "" });
      if (selectedGHE) utils.phase1.ghe.getExposureAgents.invalidate({ gheId: selectedGHE });
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deleteAgentMutation = trpc.phase1.ghe.deleteExposureAgent.useMutation({
    onSuccess: () => {
      toast.success("Agente removido com sucesso");
      if (selectedGHE) utils.phase1.ghe.getExposureAgents.invalidate({ gheId: selectedGHE });
    },
    onError: (error) => toast.error(`Erro ao remover: ${error.message}`),
  });

  const deleteMultipleGHEsMutation = trpc.phase1.ghe.delete.useMutation({
    onSuccess: () => {
      utils.phase1.ghe.list.invalidate({ unitId });
    },
    onError: (error) => toast.error(`Erro ao excluir: ${error.message}`),
  });

  const updateGHEMutation = trpc.phase1.ghe.update.useMutation({
    onSuccess: () => {
      toast.success("GHE atualizado com sucesso");
      setEditingGHE(null);
      utils.phase1.ghe.list.invalidate({ unitId });
    },
    onError: (error) => toast.error(`Erro ao atualizar: ${error.message}`),
  });

  const handleCreateGHE = () => {
    if (!newGHEForm.code || !newGHEForm.name) {
      toast.error("Preencha código e nome do GHE");
      return;
    }
    createGHEMutation.mutate({
      unitId,
      code: newGHEForm.code,
      name: newGHEForm.name,
      description: newGHEForm.description,
    });
  };

  const handleAddAgent = () => {
    if (!selectedGHE || !newAgentForm.agentName) {
      toast.error("Selecione um GHE e preencha o nome do agente");
      return;
    }
    addAgentMutation.mutate({
      gheId: selectedGHE,
      agentType: newAgentForm.agentType as any,
      agentName: newAgentForm.agentName,
      riskLevel: newAgentForm.riskLevel as any,
      limiteTolerance: newAgentForm.limiteTolerance ? Number(newAgentForm.limiteTolerance) : undefined,
      unit: newAgentForm.unit,
    });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Tolerável":
        return "bg-green-100 text-green-800";
      case "Moderado":
        return "bg-yellow-100 text-yellow-800";
      case "Substancial":
        return "bg-orange-100 text-orange-800";
      case "Intolerável":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de GHE</h1>
        <p className="text-gray-600">Grupos Homogêneos de Exposição (NR-07, NR-09)</p>
      </div>

      <Tabs defaultValue="ghe" className="w-full">
        <TabsList>
          <TabsTrigger value="ghe">GHEs</TabsTrigger>
          <TabsTrigger value="agents">Agentes de Exposição</TabsTrigger>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          {selectedGHE && <TabsTrigger value="audit">Histórico</TabsTrigger>}
        </TabsList>

        {/* TAB: GHEs */}
        <TabsContent value="ghe" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Grupos Homogêneos de Exposição</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Novo GHE</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo GHE</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Código</Label>
                    <Input
                      placeholder="GHE-001"
                      value={newGHEForm.code}
                      onChange={(e) => setNewGHEForm({ ...newGHEForm, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Nome</Label>
                    <Input
                      placeholder="Setor de Soldagem"
                      value={newGHEForm.name}
                      onChange={(e) => setNewGHEForm({ ...newGHEForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      placeholder="Soldadores e auxiliares"
                      value={newGHEForm.description}
                      onChange={(e) => setNewGHEForm({ ...newGHEForm, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreateGHE} disabled={createGHEMutation.isPending} className="w-full">
                    {createGHEMutation.isPending ? "Criando..." : "Criar GHE"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {selectedGHEs.size > 0 && (
            <>
            <div className="flex gap-2 items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
              <span className="text-sm font-medium">{selectedGHEs.size} GHE(s) selecionado(s)</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedGHEs(new Set())}
              >
                Desselecionar Tudo
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isBulkDeleting}
                onClick={() => {
                  if (confirm(`Tem certeza que deseja excluir ${selectedGHEs.size} GHE(s)?`)) {
                    setIsBulkDeleting(true);
                    setBulkDeleteProgress(0);
                    setProcessedCount(0);
                    const gheIds = Array.from(selectedGHEs);
                    setTotalCount(gheIds.length);
                    let completed = 0;
                    gheIds.forEach((gheId) => {
                      deleteMultipleGHEsMutation.mutate({ gheId }, {
                        onSuccess: () => {
                          completed++;
                          setProcessedCount(completed);
                          setBulkDeleteProgress((completed / gheIds.length) * 100);
                          if (completed === gheIds.length) {
                            setIsBulkDeleting(false);
                            setBulkDeleteProgress(0);
                            setSelectedGHEs(new Set());
                          }
                        },
                        onError: () => {
                          completed++;
                          setProcessedCount(completed);
                          setBulkDeleteProgress((completed / gheIds.length) * 100);
                          if (completed === gheIds.length) {
                            setIsBulkDeleting(false);
                          }
                        },
                      });
                    });
                  }
                }}
              >
                {isBulkDeleting ? `Excluindo... ${Math.round(bulkDeleteProgress)}%` : "Excluir Selecionados"}
              </Button>
            </div>
            {isBulkDeleting && (
              <div className="mt-2 space-y-2">
                <Progress value={bulkDeleteProgress} className="h-2" />
                <p className="text-xs text-gray-600">{processedCount}/{totalCount} processados ({Math.round(bulkDeleteProgress)}%)</p>
              </div>
            )}
            </>
          )}

          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">GHEs Cadastrados</h3>
            {gheList && gheList.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedGHEs.size === gheList.length) {
                    setSelectedGHEs(new Set());
                  } else {
                    setSelectedGHEs(new Set(gheList.map(g => g.id)));
                  }
                }}
              >
                {selectedGHEs.size === gheList.length ? "Desselecionar Tudo" : "Selecionar Tudo"}
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {gheList?.map((ghe) => (
              <Card
                key={ghe.id}
                className={`transition-colors ${selectedGHE === ghe.id ? "border-blue-500 bg-blue-50" : ""}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedGHE(ghe.id)}>
                      <CardTitle>{ghe.name}</CardTitle>
                      <CardDescription>{ghe.code}</CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={selectedGHEs.has(ghe.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedGHEs);
                          if (e.target.checked) {
                            newSet.add(ghe.id);
                          } else {
                            newSet.delete(ghe.id);
                          }
                          setSelectedGHEs(newSet);
                        }}
                        className="w-4 h-4"
                      />
                      <Badge variant="outline">{ghe.code}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGHE(ghe.id);
                          setEditGHEForm({
                            code: ghe.code,
                            name: ghe.name,
                            description: ghe.description || "",
                            location: ghe.location || "",
                            responsible: ghe.responsible || "",
                            status: ghe.status || "Ativo",
                          });
                        }}
                      >
                        <Edit2 className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o GHE ${ghe.code}?`)) {
                            deleteGHEMutation.mutate({ gheId: ghe.id });
                          }
                        }}
                        disabled={deleteGHEMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{ghe.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: Agentes de Exposição */}
        <TabsContent value="agents" className="space-y-4">
          {!selectedGHE ? (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800">Selecione um GHE para gerenciar seus agentes de exposição</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Agentes de Exposição</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" /> Novo Agente</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Agente de Exposição</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Tipo de Agente</Label>
                        <Select value={newAgentForm.agentType} onValueChange={(value) => setNewAgentForm({ ...newAgentForm, agentType: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Químico">Químico</SelectItem>
                            <SelectItem value="Físico">Físico</SelectItem>
                            <SelectItem value="Biológico">Biológico</SelectItem>
                            <SelectItem value="Ergonômico">Ergonômico</SelectItem>
                            <SelectItem value="Acidente">Acidente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Nome do Agente</Label>
                        <Input
                          placeholder="Ex: Benzeno, Ruído, Calor"
                          value={newAgentForm.agentName}
                          onChange={(e) => setNewAgentForm({ ...newAgentForm, agentName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Nível de Risco</Label>
                        <Select value={newAgentForm.riskLevel} onValueChange={(value) => setNewAgentForm({ ...newAgentForm, riskLevel: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tolerável">Tolerável</SelectItem>
                            <SelectItem value="Moderado">Moderado</SelectItem>
                            <SelectItem value="Substancial">Substancial</SelectItem>
                            <SelectItem value="Intolerável">Intolerável</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Limite de Tolerância</Label>
                          <Input
                            type="number"
                            placeholder="50"
                            value={newAgentForm.limiteTolerance}
                            onChange={(e) => setNewAgentForm({ ...newAgentForm, limiteTolerance: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Unidade</Label>
                          <Input
                            placeholder="ppm, mg/m³, dB"
                            value={newAgentForm.unit}
                            onChange={(e) => setNewAgentForm({ ...newAgentForm, unit: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddAgent} disabled={addAgentMutation.isPending} className="w-full">
                        {addAgentMutation.isPending ? "Adicionando..." : "Adicionar Agente"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {exposureAgents?.map((agent) => (
                  <Card key={agent.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{agent.agentName}</CardTitle>
                          <CardDescription>{agent.agentType}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getRiskColor(agent.riskLevel)}>{agent.riskLevel}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remover agente ${agent.agentName}?`)) {
                                deleteAgentMutation.mutate({ agentId: agent.id });
                              }
                            }}
                            disabled={deleteAgentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Limite de Tolerância</p>
                          <p className="font-semibold">{agent.limiteTolerance} {agent.unit}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB: Funcionários */}
        <TabsContent value="employees" className="space-y-4">
          {!selectedGHE ? (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800">Selecione um GHE para ver os funcionários</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Funcionários do GHE</h2>
              </div>

              <div className="grid gap-4">
                {employees?.map((employee) => (
                  <Card key={employee.id}>
                    <CardHeader>
                      <CardTitle>{employee.name}</CardTitle>
                      <CardDescription>{employee.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">CPF</p>
                          <p className="font-semibold">{employee.cpf}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Matrícula</p>
                          <p className="font-semibold">{employee.employeeNumber}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB: Audit History */}
        {selectedGHE && (
          <TabsContent value="audit" className="space-y-4">
            <GHEAuditHistory gheId={selectedGHE} />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={editingGHE !== null} onOpenChange={() => setEditingGHE(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar GHE</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código</Label>
              <Input
                value={editGHEForm.code}
                onChange={(e) => setEditGHEForm({ ...editGHEForm, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                value={editGHEForm.name}
                onChange={(e) => setEditGHEForm({ ...editGHEForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={editGHEForm.description}
                onChange={(e) => setEditGHEForm({ ...editGHEForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Localização</Label>
              <Input
                value={editGHEForm.location}
                onChange={(e) => setEditGHEForm({ ...editGHEForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input
                value={editGHEForm.responsible}
                onChange={(e) => setEditGHEForm({ ...editGHEForm, responsible: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editGHEForm.status} onValueChange={(value) => setEditGHEForm({ ...editGHEForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (editingGHE) {
                  updateGHEMutation.mutate({
                    gheId: editingGHE,
                    code: editGHEForm.code,
                    name: editGHEForm.name,
                    description: editGHEForm.description,
                    location: editGHEForm.location,
                    responsible: editGHEForm.responsible,
                    status: editGHEForm.status,
                  });
                }
              }}
              disabled={updateGHEMutation.isPending}
              className="w-full"
            >
              {updateGHEMutation.isPending ? "Atualizando..." : "Atualizar GHE"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
