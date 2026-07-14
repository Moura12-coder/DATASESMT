import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldAlert, Plus, Edit, Trash2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const riskColors: Record<string, string> = {
  "Tolerável": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Moderado": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Substancial": "bg-orange-50 text-orange-700 border-orange-200",
  "Intolerável": "bg-red-50 text-red-700 border-red-200",
};

const riskTypeColors: Record<string, string> = {
  "Físico": "bg-blue-50 text-blue-700",
  "Químico": "bg-purple-50 text-purple-700",
  "Biológico": "bg-green-50 text-green-700",
  "Ergonômico": "bg-pink-50 text-pink-700",
  "Acidente": "bg-red-50 text-red-700",
  "Psicossocial": "bg-indigo-50 text-indigo-700",
};

function calcRiskLevel(prob: string, sev: string): "Tolerável" | "Moderado" | "Substancial" | "Intolerável" {
  const p = Number(prob); const s = Number(sev); const score = p * s;
  if (score <= 4) return "Tolerável";
  if (score <= 9) return "Moderado";
  if (score <= 16) return "Substancial";
  return "Intolerável";
}

const emptyRisk = {
  unitId: 0, sectorId: undefined as number | undefined,
  type: "Físico" as const, description: "", source: "", ghe: "",
  probability: "1" as const, severity: "1" as const,
  riskLevel: "Tolerável" as const, controlMeasures: "", existingControls: "",
  residualRisk: "Tolerável" as const, responsible: "", deadline: "", status: "Identificado" as const,
};

const emptyAction = {
  what: "", why: "", who: "", where: "", when: "", howMuch: undefined as number | undefined,
  how: "", status: "Pendente" as const, priority: "Média" as const, notes: "",
};

export default function PGR() {
  const [activeTab, setActiveTab] = useState("risks");
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingRiskId, setEditingRiskId] = useState<number | null>(null);
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const [riskForm, setRiskForm] = useState({ ...emptyRisk });
  const [actionForm, setActionForm] = useState({ ...emptyAction });
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const utils = trpc.useUtils();
  const { data: risks = [], isLoading } = trpc.risks.list.useQuery({});
  const { data: actions = [] } = trpc.actionPlans.list.useQuery({});
  const { data: units = [] } = trpc.units.list.useQuery();
  const { data: sectors = [] } = trpc.sectors.list.useQuery({});

  const createRisk = trpc.risks.create.useMutation({ onSuccess: () => { utils.risks.list.invalidate(); toast.success("Risco cadastrado!"); setShowRiskForm(false); setRiskForm({ ...emptyRisk }); }, onError: e => toast.error(e.message) });
  const updateRisk = trpc.risks.update.useMutation({ onSuccess: () => { utils.risks.list.invalidate(); toast.success("Risco atualizado!"); setShowRiskForm(false); }, onError: e => toast.error(e.message) });
  const deleteRisk = trpc.risks.delete.useMutation({ onSuccess: () => { utils.risks.list.invalidate(); toast.success("Risco removido!"); }, onError: e => toast.error(e.message) });
  const createAction = trpc.actionPlans.create.useMutation({ onSuccess: () => { utils.actionPlans.list.invalidate(); toast.success("Ação cadastrada!"); setShowActionForm(false); setActionForm({ ...emptyAction }); }, onError: e => toast.error(e.message) });
  const updateAction = trpc.actionPlans.update.useMutation({ onSuccess: () => { utils.actionPlans.list.invalidate(); toast.success("Ação atualizada!"); setShowActionForm(false); }, onError: e => toast.error(e.message) });
  const deleteAction = trpc.actionPlans.delete.useMutation({ onSuccess: () => { utils.actionPlans.list.invalidate(); toast.success("Ação removida!"); }, onError: e => toast.error(e.message) });

  const filteredRisks = risks.filter(r => (typeFilter === "all" || r.type === typeFilter) && (levelFilter === "all" || r.riskLevel === levelFilter));

  const handleRiskSubmit = () => {
    if (!riskForm.description || !riskForm.unitId) return toast.error("Descrição e unidade são obrigatórios");
    const level = calcRiskLevel(riskForm.probability, riskForm.severity);
    const payload = { ...riskForm, unitId: Number(riskForm.unitId), sectorId: riskForm.sectorId ? Number(riskForm.sectorId) : undefined, riskLevel: level };
    if (editingRiskId) updateRisk.mutate({ id: editingRiskId, data: payload });
    else createRisk.mutate(payload as any);
  };

  const handleActionSubmit = () => {
    if (!actionForm.what || !actionForm.who || !actionForm.when) return toast.error("O quê, Quem e Quando são obrigatórios");
    const payload = { ...actionForm, riskId: selectedRiskId || undefined, howMuch: actionForm.howMuch ? Number(actionForm.howMuch) : undefined };
    if (editingActionId) updateAction.mutate({ id: editingActionId, data: payload });
    else createAction.mutate(payload as any);
  };

  const openEditRisk = (r: any) => {
    setRiskForm({ ...emptyRisk, ...r, deadline: r.deadline ? String(r.deadline).split("T")[0] : "" });
    setEditingRiskId(r.id); setShowRiskForm(true);
  };

  const openNewAction = (riskId?: number) => {
    setActionForm({ ...emptyAction }); setSelectedRiskId(riskId || null); setEditingActionId(null); setShowActionForm(true);
  };

  const riskStats = {
    total: risks.length,
    toleravel: risks.filter(r => r.riskLevel === "Tolerável").length,
    moderado: risks.filter(r => r.riskLevel === "Moderado").length,
    substancial: risks.filter(r => r.riskLevel === "Substancial").length,
    intoleravel: risks.filter(r => r.riskLevel === "Intolerável").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">PGR — Programa de Gerenciamento de Riscos</h1>
          <p className="text-sm text-muted-foreground">NR-01 • Inventário de perigos, matriz de riscos e plano de ação</p>
        </div>
        <Button onClick={() => { setRiskForm({ ...emptyRisk }); setEditingRiskId(null); setShowRiskForm(true); }} size="sm">
          <Plus size={14} className="mr-1.5" /> Novo Risco
        </Button>
      </div>

      {/* Risk Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{riskStats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-emerald-200 bg-emerald-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-700">{riskStats.toleravel}</p><p className="text-xs text-emerald-600">Tolerável</p></CardContent></Card>
        <Card className="border-yellow-200 bg-yellow-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-700">{riskStats.moderado}</p><p className="text-xs text-yellow-600">Moderado</p></CardContent></Card>
        <Card className="border-orange-200 bg-orange-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-700">{riskStats.substancial}</p><p className="text-xs text-orange-600">Substancial</p></CardContent></Card>
        <Card className="border-red-200 bg-red-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-700">{riskStats.intoleravel}</p><p className="text-xs text-red-600">Intolerável</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="risks" className="text-xs">Inventário de Riscos ({risks.length})</TabsTrigger>
          <TabsTrigger value="matrix" className="text-xs">Matriz de Risco</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">Plano de Ação 5W2H ({actions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Tipo de Risco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {["Físico","Químico","Biológico","Ergonômico","Acidente","Psicossocial"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Nível de Risco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                {["Tolerável","Moderado","Substancial","Intolerável"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3">Perigo / Risco</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Tipo</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">GHE / Setor</th>
                      <th className="text-center px-4 py-3">P × S</th>
                      <th className="text-left px-4 py-3">Nível</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Status</th>
                      <th className="text-right px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
                        </tr>
                      ))
                    ) : filteredRisks.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        <ShieldAlert size={32} className="mx-auto mb-2 opacity-30" />
                        Nenhum risco cadastrado
                      </td></tr>
                    ) : filteredRisks.map(r => (
                      <tr key={r.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{r.description}</p>
                          {r.source && <p className="text-[10px] text-muted-foreground">{r.source}</p>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="outline" className={cn("text-[10px]", riskTypeColors[r.type] || "")}>{r.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{r.ghe || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-foreground">{Number(r.probability) * Number(r.severity)}</span>
                          <span className="text-[10px] text-muted-foreground block">{r.probability}×{r.severity}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px]", riskColors[r.riskLevel || "Tolerável"])}>{r.riskLevel}</Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{r.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Adicionar ação" onClick={() => openNewAction(r.id)}>
                              <Plus size={13} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRisk(r)}>
                              <Edit size={13} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover risco?")) deleteRisk.mutate({ id: r.id }); }}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Matriz de Probabilidade × Severidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 border border-border bg-muted/50 text-left">P\S</th>
                      {["1 - Insignificante","2 - Pequena","3 - Moderada","4 - Grande","5 - Catastrófica"].map((s, i) => (
                        <th key={i} className="p-2 border border-border bg-muted/50 text-center min-w-[100px]">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["5 - Quase certo", 5, 10, 15, 20, 25],
                      ["4 - Provável", 4, 8, 12, 16, 20],
                      ["3 - Possível", 3, 6, 9, 12, 15],
                      ["2 - Improvável", 2, 4, 6, 8, 10],
                      ["1 - Raro", 1, 2, 3, 4, 5],
                    ].map((row, ri) => (
                      <tr key={ri}>
                        <td className="p-2 border border-border bg-muted/30 font-medium">{row[0]}</td>
                        {(row.slice(1) as number[]).map((score, ci) => {
                          const level = score <= 4 ? "Tolerável" : score <= 9 ? "Moderado" : score <= 16 ? "Substancial" : "Intolerável";
                          const bg = score <= 4 ? "bg-emerald-100 text-emerald-800" : score <= 9 ? "bg-yellow-100 text-yellow-800" : score <= 16 ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800";
                          const count = risks.filter(r => Number(r.probability) * Number(r.severity) === score).length;
                          return (
                            <td key={ci} className={cn("p-2 border border-border text-center", bg)}>
                              <div className="font-bold text-base">{score}</div>
                              <div className="text-[9px] opacity-70">{level}</div>
                              {count > 0 && <div className="mt-1 text-[10px] font-semibold bg-white/50 rounded px-1">{count} risco{count > 1 ? "s" : ""}</div>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                {[["Tolerável (1-4)", "bg-emerald-100 text-emerald-800"], ["Moderado (5-9)", "bg-yellow-100 text-yellow-800"], ["Substancial (10-16)", "bg-orange-100 text-orange-800"], ["Intolerável (17-25)", "bg-red-100 text-red-800"]].map(([label, cls]) => (
                  <div key={label} className={cn("px-2 py-1 rounded font-medium", cls)}>{label}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openNewAction()}>
              <Plus size={14} className="mr-1.5" /> Nova Ação
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3">O Quê</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Quem</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Quando</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Prioridade</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
                        Nenhuma ação cadastrada
                      </td></tr>
                    ) : actions.map(a => (
                      <tr key={a.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{a.what}</p>
                          {a.why && <p className="text-[10px] text-muted-foreground">{a.why}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm hidden md:table-cell">{a.who}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{a.when ? new Date(a.when).toLocaleDateString("pt-BR") : "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Badge variant="outline" className={cn("text-[10px]", a.priority === "Crítica" ? "border-red-200 text-red-700" : a.priority === "Alta" ? "border-orange-200 text-orange-700" : a.priority === "Média" ? "border-yellow-200 text-yellow-700" : "border-green-200 text-green-700")}>{a.priority}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px]", a.status === "Concluída" ? "border-emerald-200 text-emerald-700" : a.status === "Em Andamento" ? "border-blue-200 text-blue-700" : a.status === "Cancelada" ? "border-gray-200 text-gray-600" : "border-amber-200 text-amber-700")}>{a.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setActionForm({ ...emptyAction, ...a, when: a.when ? String(a.when).split("T")[0] : "" } as unknown as typeof emptyAction); setEditingActionId(a.id); setShowActionForm(true); }}>
                              <Edit size={13} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover ação?")) deleteAction.mutate({ id: a.id }); }}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risk Form Dialog */}
      <Dialog open={showRiskForm} onOpenChange={setShowRiskForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRiskId ? "Editar Risco" : "Novo Perigo / Risco"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Descrição do Perigo / Risco *</Label>
              <Input className="h-9 text-sm mt-1" value={riskForm.description} onChange={e => setRiskForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Unidade *</Label>
              <Select value={String(riskForm.unitId || "")} onValueChange={v => setRiskForm(f => ({ ...f, unitId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo de Risco</Label>
              <Select value={riskForm.type} onValueChange={v => setRiskForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["Físico","Químico","Biológico","Ergonômico","Acidente","Psicossocial"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fonte / Agente</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ex: Ruído de máquinas" value={riskForm.source} onChange={e => setRiskForm(f => ({ ...f, source: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">GHE (Grupo Homogêneo)</Label>
              <Input className="h-9 text-sm mt-1" value={riskForm.ghe} onChange={e => setRiskForm(f => ({ ...f, ghe: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Probabilidade (1-5)</Label>
              <Select value={riskForm.probability} onValueChange={v => setRiskForm((f: any) => ({ ...f, probability: v as any, riskLevel: calcRiskLevel(v, f.severity) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Raro</SelectItem>
                  <SelectItem value="2">2 - Improvável</SelectItem>
                  <SelectItem value="3">3 - Possível</SelectItem>
                  <SelectItem value="4">4 - Provável</SelectItem>
                  <SelectItem value="5">5 - Quase certo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Severidade (1-5)</Label>
              <Select value={riskForm.severity} onValueChange={v => setRiskForm((f: any) => ({ ...f, severity: v as any, riskLevel: calcRiskLevel(f.probability, v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Insignificante</SelectItem>
                  <SelectItem value="2">2 - Pequena</SelectItem>
                  <SelectItem value="3">3 - Moderada</SelectItem>
                  <SelectItem value="4">4 - Grande</SelectItem>
                  <SelectItem value="5">5 - Catastrófica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Nível de Risco Calculado:</span>
                <Badge variant="outline" className={cn("text-xs font-semibold", riskColors[calcRiskLevel(riskForm.probability, riskForm.severity)])}>
                  {calcRiskLevel(riskForm.probability, riskForm.severity)} (Score: {Number(riskForm.probability) * Number(riskForm.severity)})
                </Badge>
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Controles Existentes</Label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={riskForm.existingControls} onChange={e => setRiskForm(f => ({ ...f, existingControls: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Medidas de Controle Propostas</Label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={riskForm.controlMeasures} onChange={e => setRiskForm(f => ({ ...f, controlMeasures: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input className="h-9 text-sm mt-1" value={riskForm.responsible} onChange={e => setRiskForm(f => ({ ...f, responsible: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Prazo</Label>
              <Input type="date" className="h-9 text-sm mt-1" value={riskForm.deadline} onChange={e => setRiskForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={riskForm.status} onValueChange={v => setRiskForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Identificado">Identificado</SelectItem>
                  <SelectItem value="Em Controle">Em Controle</SelectItem>
                  <SelectItem value="Controlado">Controlado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowRiskForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleRiskSubmit} disabled={createRisk.isPending || updateRisk.isPending}>
              {editingRiskId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Form Dialog */}
      <Dialog open={showActionForm} onOpenChange={setShowActionForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Plano de Ação 5W2H</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">O Quê? (What) *</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ação a ser executada" value={actionForm.what} onChange={e => setActionForm(f => ({ ...f, what: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Por Quê? (Why)</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Justificativa da ação" value={actionForm.why} onChange={e => setActionForm(f => ({ ...f, why: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Quem? (Who) *</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Responsável" value={actionForm.who} onChange={e => setActionForm(f => ({ ...f, who: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Onde? (Where)</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Local" value={actionForm.where} onChange={e => setActionForm(f => ({ ...f, where: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Quando? (When) *</Label>
              <Input type="date" className="h-9 text-sm mt-1" value={actionForm.when} onChange={e => setActionForm(f => ({ ...f, when: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Quanto? (How Much)</Label>
              <Input type="number" className="h-9 text-sm mt-1" placeholder="Custo estimado (R$)" value={actionForm.howMuch || ""} onChange={e => setActionForm(f => ({ ...f, howMuch: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Como? (How)</Label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} placeholder="Método de execução" value={actionForm.how} onChange={e => setActionForm(f => ({ ...f, how: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Prioridade</Label>
              <Select value={actionForm.priority} onValueChange={v => setActionForm(f => ({ ...f, priority: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={actionForm.status} onValueChange={v => setActionForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowActionForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleActionSubmit} disabled={createAction.isPending || updateAction.isPending}>
              {editingActionId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
