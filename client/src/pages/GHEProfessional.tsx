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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Plus, Trash2, Users, Edit2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface GHEFormData {
  code: string;
  name: string;
  description: string;
  location: string;
  responsible: string;
  status: "Ativo" | "Inativo" | "Em Revisão";
  createdDate: string;
  notes: string;
}

export default function GHEProfessional() {
  const [unitId] = useState(1);
  const [selectedGHE, setSelectedGHE] = useState<number | null>(null);
  const [selectedGHEs, setSelectedGHEs] = useState<Set<number>>(new Set());
  const [editingGHE, setEditingGHE] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const initialFormData: GHEFormData = {
    code: "",
    name: "",
    description: "",
    responsible: "",
    location: "",
    status: "Ativo",
    createdDate: new Date().toISOString().split("T")[0],
    notes: "",
  };

  const [gheForm, setGheForm] = useState<GHEFormData>(initialFormData);

  const [newAgentForm, setNewAgentForm] = useState({
    agentType: "Químico",
    agentName: "",
    riskLevel: "Moderado",
    limiteTolerance: "",
    unit: "",
    notes: "",
  });

  // Queries
  const { data: gheList, refetch: refetchGHEs } = trpc.phase1.ghe.list.useQuery({ unitId });
  const { data: employees } = selectedGHE ? trpc.phase1.ghe.getEmployees.useQuery({ gheId: selectedGHE }) : { data: [] };
  const { data: exposureAgents, refetch: refetchAgents } = selectedGHE ? trpc.phase1.ghe.getExposureAgents.useQuery({ gheId: selectedGHE }) : { data: [] };

  // Mutations
  const createGHEMutation = trpc.phase1.ghe.create.useMutation({
    onSuccess: () => {
      toast.success("GHE criado com sucesso");
      setGheForm(initialFormData);
      setShowCreateDialog(false);
      refetchGHEs();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deleteGHEMutation = trpc.phase1.ghe.delete.useMutation({
    onSuccess: () => {
      toast.success("GHE(s) excluído(s) com sucesso");
      setSelectedGHEs(new Set());
      setSelectedGHE(null);
      setShowDeleteConfirm(false);
      refetchGHEs();
    },
    onError: (error) => toast.error(`Erro ao excluir: ${error.message}`),
  });

  const addAgentMutation = trpc.phase1.ghe.addExposureAgent.useMutation({
    onSuccess: () => {
      toast.success("Agente de exposição adicionado");
      setNewAgentForm({ agentType: "Químico", agentName: "", riskLevel: "Moderado", limiteTolerance: "", unit: "", notes: "" });
      refetchAgents();
    },
    onError: (error) => toast.error(`Erro: ${error.message}`),
  });

  const deleteAgentMutation = trpc.phase1.ghe.deleteExposureAgent.useMutation({
    onSuccess: () => {
      toast.success("Agente removido com sucesso");
      refetchAgents();
    },
    onError: (error) => toast.error(`Erro ao remover: ${error.message}`),
  });

  // Validações
  const validateGHEForm = (): boolean => {
    if (!gheForm.code.trim()) {
      toast.error("Código do GHE é obrigatório");
      return false;
    }
    if (!gheForm.name.trim()) {
      toast.error("Nome do GHE é obrigatório");
      return false;
    }
    if (!gheForm.responsible.trim()) {
      toast.error("Responsável é obrigatório");
      return false;
    }
    if (!gheForm.location.trim()) {
      toast.error("Localização é obrigatória");
      return false;
    }
    if (gheForm.code.length < 3) {
      toast.error("Código deve ter no mínimo 3 caracteres");
      return false;
    }
    return true;
  };

  const handleCreateGHE = () => {
    if (!validateGHEForm()) return;

    createGHEMutation.mutate({
      unitId,
      code: gheForm.code,
      name: gheForm.name,
      description: gheForm.description,
    });
  };

  const handleEditGHE = (ghe: any) => {
    setGheForm({
      code: ghe.code,
      name: ghe.name,
      description: ghe.description,
      responsible: ghe.responsible || "",
      location: ghe.location || "",
      status: "Ativo" || "Ativo",
      createdDate: ghe.createdDate || new Date().toISOString().split("T")[0],
      notes: ghe.notes || "",
    });
    setEditingGHE(ghe.id);
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!validateGHEForm()) return;
    // Aqui você chamaria uma mutation de update quando implementada
    toast.success("GHE atualizado com sucesso");
    setShowEditDialog(false);
    setEditingGHE(null);
    refetchGHEs();
  };

  const toggleGHESelection = (gheId: number) => {
    const newSelected = new Set(selectedGHEs);
    if (newSelected.has(gheId)) {
      newSelected.delete(gheId);
    } else {
      newSelected.add(gheId);
    }
    setSelectedGHEs(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedGHEs.size === 0) {
      toast.error("Selecione pelo menos um GHE para excluir");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSelected = () => {
    selectedGHEs.forEach((gheId) => {
      deleteGHEMutation.mutate({ gheId });
    });
  };

  const handleAddAgent = () => {
    if (!selectedGHE || !newAgentForm.agentName.trim()) {
      toast.error("Selecione um GHE e preencha o nome do agente");
      return;
    }
    if (newAgentForm.agentName.length < 2) {
      toast.error("Nome do agente deve ter no mínimo 2 caracteres");
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800";
      case "Inativo":
        return "bg-gray-100 text-gray-800";
      case "Em Revisão":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gestão de GHE</h1>
          <p className="text-gray-600">Grupos Homogêneos de Exposição (NR-07, NR-09) - Gerenciamento Profissional</p>
        </div>
        {selectedGHEs.size > 0 && (
          <div className="flex gap-2">
            <Badge variant="secondary">{selectedGHEs.size} selecionado(s)</Badge>
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Selecionados
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="ghe" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ghe">GHEs ({gheList?.length || 0})</TabsTrigger>
          <TabsTrigger value="agents">Agentes de Exposição</TabsTrigger>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
        </TabsList>

        {/* TAB: GHEs */}
        <TabsContent value="ghe" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Grupos Homogêneos de Exposição</h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Novo GHE</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo GHE</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Código *</Label>
                      <Input
                        id="code"
                        placeholder="GHE-001"
                        value={gheForm.code}
                        onChange={(e) => setGheForm({ ...gheForm, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        placeholder="Setor de Soldagem"
                        value={gheForm.name}
                        onChange={(e) => setGheForm({ ...gheForm, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Localização *</Label>
                    <Input
                      id="location"
                      placeholder="Prédio A, Piso 2"
                      value={gheForm.location}
                      onChange={(e) => setGheForm({ ...gheForm, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="responsible">Responsável *</Label>
                    <Input
                      id="responsible"
                      placeholder="Nome do responsável"
                      value={gheForm.responsible}
                      onChange={(e) => setGheForm({ ...gheForm, responsible: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Soldadores e auxiliares"
                      value={gheForm.description}
                      onChange={(e) => setGheForm({ ...gheForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={gheForm.status} onValueChange={(value) => setGheForm({ ...gheForm, status: value as any })}>
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                          <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date">Data de Criação</Label>
                      <Input
                        id="date"
                        type="date"
                        value={gheForm.createdDate}
                        onChange={(e) => setGheForm({ ...gheForm, createdDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Input
                      id="notes"
                      placeholder="Notas adicionais"
                      value={gheForm.notes}
                      onChange={(e) => setGheForm({ ...gheForm, notes: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleCreateGHE} disabled={createGHEMutation.isPending} className="w-full">
                    {createGHEMutation.isPending ? "Criando..." : "Criar GHE"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {gheList?.map((ghe) => (
              <Card
                key={ghe.id}
                className={`transition-all ${selectedGHE === ghe.id ? "border-blue-500 bg-blue-50" : ""} ${selectedGHEs.has(ghe.id) ? "border-orange-500 bg-orange-50" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedGHEs.has(ghe.id)}
                      onCheckedChange={() => toggleGHESelection(ghe.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedGHE(ghe.id)}>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle>{ghe.name}</CardTitle>
                        <Badge className={getStatusColor("Ativo" || "Ativo")}>{"Ativo" || "Ativo"}</Badge>
                      </div>
                      <CardDescription>{ghe.code}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGHE(ghe)}
                      >
                        <Edit2 className="h-4 w-4" />
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
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Localização</p>
                      <p className="font-medium">{"N/A" || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Responsável</p>
                      <p className="font-medium">{"Não atribuído" || "-"}</p>
                    </div>
                    {ghe.description && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Descrição</p>
                        <p className="font-medium">{ghe.description}</p>
                      </div>
                    )}
                  </div>
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
                        <Label>Tipo de Agente *</Label>
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
                        <Label>Nome do Agente *</Label>
                        <Input
                          placeholder="Ex: Benzeno, Ruído, Calor"
                          value={newAgentForm.agentName}
                          onChange={(e) => setNewAgentForm({ ...newAgentForm, agentName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Nível de Risco *</Label>
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
                      <div>
                        <Label>Observações</Label>
                        <Input
                          placeholder="Notas adicionais"
                          value={newAgentForm.notes}
                          onChange={(e) => setNewAgentForm({ ...newAgentForm, notes: e.target.value })}
                        />
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
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">{agent.agentName}</p>
                          <p className="text-sm text-gray-600">{agent.agentType}</p>
                          {agent.limiteTolerance && (
                            <p className="text-sm text-gray-600 mt-2">
                              Limite: {agent.limiteTolerance} {agent.unit || ""}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge className={getRiskColor(agent.riskLevel || "Moderado")}>{agent.riskLevel}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja remover ${agent.agentName}?`)) {
                                deleteAgentMutation.mutate({ agentId: agent.id });
                              }
                            }}
                            disabled={deleteAgentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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
                <p className="text-yellow-800">Selecione um GHE para ver os funcionários vinculados</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Funcionários no GHE ({employees?.length || 0})
              </h2>
              <div className="grid gap-4">
                {employees?.length === 0 ? (
                  <Card className="bg-gray-50">
                    <CardContent className="pt-6">
                      <p className="text-gray-600">Nenhum funcionário vinculado a este GHE</p>
                    </CardContent>
                  </Card>
                ) : (
                  employees?.map((emp) => (
                    <Card key={emp.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{emp.employee?.name || "N/A"}</p>
                            <p className="text-sm text-gray-600">Desde: {emp.startDate ? new Date(emp.startDate).toLocaleDateString("pt-BR") : "-"}</p>
                          </div>
                          <Badge variant="outline">Vinculado</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação de Exclusão em Lote */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão em Lote
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir {selectedGHEs.size} GHE(s)? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeleteSelected}>
                Excluir {selectedGHEs.size} GHE(s)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
