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
import { AlertTriangle, Plus, Edit, Trash2, Eye, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  "Acidente com Afastamento": "bg-red-50 text-red-700 border-red-200",
  "Acidente sem Afastamento": "bg-orange-50 text-orange-700 border-orange-200",
  "Quase Acidente": "bg-amber-50 text-amber-700 border-amber-200",
  "Incidente": "bg-blue-50 text-blue-700 border-blue-200",
  "Doença Ocupacional": "bg-purple-50 text-purple-700 border-purple-200",
};

const statusColors: Record<string, string> = {
  "Aberto": "bg-red-50 text-red-700 border-red-200",
  "Em Investigação": "bg-amber-50 text-amber-700 border-amber-200",
  "Encerrado": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const emptyIncident = {
  employeeId: undefined as number | undefined,
  unitId: 0, type: "Incidente" as const, date: "", time: "",
  location: "", description: "", bodyPart: "", injuryType: "",
  lostDays: 0, catNumber: "", catDate: "", status: "Aberto" as const,
  immediateAction: "", rootCause: "", correctiveActions: "",
  why1: "", why2: "", why3: "", why4: "", why5: "",
  witnesses: "", notes: "",
};

export default function Incidents() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [viewIncident, setViewIncident] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyIncident });
  const [activeTab, setActiveTab] = useState("basic");

  const utils = trpc.useUtils();
  const { data: incidents = [], isLoading } = trpc.incidents.list.useQuery({});
  const { data: employees = [] } = trpc.employees.list.useQuery({});
  const { data: units = [] } = trpc.units.list.useQuery();

  const createMutation = trpc.incidents.create.useMutation({ onSuccess: () => { utils.incidents.list.invalidate(); toast.success("Incidente registrado!"); setShowForm(false); setForm({ ...emptyIncident }); }, onError: e => toast.error(e.message) });
  const updateMutation = trpc.incidents.update.useMutation({ onSuccess: () => { utils.incidents.list.invalidate(); toast.success("Incidente atualizado!"); setShowForm(false); }, onError: e => toast.error(e.message) });
  const deleteMutation = trpc.incidents.delete.useMutation({ onSuccess: () => { utils.incidents.list.invalidate(); toast.success("Incidente removido!"); }, onError: e => toast.error(e.message) });

  const getEmployeeName = (id?: number) => id ? (employees.find(e => e.id === id)?.name || "—") : "—";

  const filtered = incidents.filter(i => {
    const matchSearch = !search || (i.description || "").toLowerCase().includes(search.toLowerCase()) || (i.location || "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || i.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleSubmit = () => {
    if (!form.unitId || !form.date || !form.description) return toast.error("Unidade, data e descrição são obrigatórios");
    const payload = { ...form, unitId: Number(form.unitId), employeeId: form.employeeId ? Number(form.employeeId) : undefined, lostDays: Number(form.lostDays) };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload as any);
  };

  const openEdit = (inc: any) => {
    setForm({ ...emptyIncident, ...inc, date: inc.date ? String(inc.date).split("T")[0] : "", catDate: inc.catDate ? String(inc.catDate).split("T")[0] : "" });
    setEditingId(inc.id); setActiveTab("basic"); setShowForm(true);
  };

  const stats = {
    total: incidents.length,
    comAfastamento: incidents.filter(i => i.type === "Acidente com Afastamento").length,
    semAfastamento: incidents.filter(i => i.type === "Acidente sem Afastamento").length,
    quaseAcidente: incidents.filter(i => i.type === "Quase Acidente").length,
    abertos: incidents.filter(i => i.status === "Aberto" || i.status === "Em Investigação").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Incidentes e Acidentes</h1>
          <p className="text-sm text-muted-foreground">Registro, investigação (5 Porquês), CAT e plano de ação corretiva</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyIncident }); setEditingId(null); setActiveTab("basic"); setShowForm(true); }} size="sm">
          <Plus size={14} className="mr-1.5" /> Registrar Incidente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-red-200 bg-red-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-700">{stats.comAfastamento}</p><p className="text-xs text-red-600">Com Afastamento</p></CardContent></Card>
        <Card className="border-orange-200 bg-orange-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-700">{stats.semAfastamento}</p><p className="text-xs text-orange-600">Sem Afastamento</p></CardContent></Card>
        <Card className="border-amber-200 bg-amber-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-700">{stats.quaseAcidente}</p><p className="text-xs text-amber-600">Quase Acidentes</p></CardContent></Card>
        <Card className="border-blue-200 bg-blue-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-700">{stats.abertos}</p><p className="text-xs text-blue-600">Em Aberto</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por descrição ou local..." className="pl-8 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-56 h-9 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.keys(typeColors).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Funcionário</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Local</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">CAT</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
                    Nenhum incidente registrado
                  </td></tr>
                ) : filtered.map(inc => (
                  <tr key={inc.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {inc.date ? new Date(inc.date).toLocaleDateString("pt-BR") : "—"}

                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px]", typeColors[inc.type] || "")}>{inc.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{getEmployeeName(inc.employeeId ?? undefined)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{inc.location || "—"}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">
                      {inc.catNumber ? <Badge variant="outline" className="text-[10px]">CAT: {inc.catNumber}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[inc.status || "Aberto"])}>{inc.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewIncident(inc)}><Eye size={13} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inc)}><Edit size={13} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover incidente?")) deleteMutation.mutate({ id: inc.id }); }}><Trash2 size={13} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Incidente" : "Registrar Incidente"}</DialogTitle></DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1 text-xs">Dados Básicos</TabsTrigger>
              <TabsTrigger value="investigation" className="flex-1 text-xs">Investigação</TabsTrigger>
              <TabsTrigger value="cat" className="flex-1 text-xs">CAT / Ações</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo de Ocorrência *</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(typeColors).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Unidade *</Label>
                  <Select value={String(form.unitId || "")} onValueChange={v => setForm(f => ({ ...f, unitId: Number(v) }))}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{units.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Data *</Label>
                  <Input type="date" className="h-9 text-sm mt-1" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Hora</Label>
                  <Input type="time" className="h-9 text-sm mt-1" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Funcionário Envolvido</Label>
                  <Select value={String(form.employeeId || "")} onValueChange={v => setForm(f => ({ ...f, employeeId: v ? Number(v) : undefined }))}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                    <SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Local da Ocorrência</Label>
                  <Input className="h-9 text-sm mt-1" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Parte do Corpo Atingida</Label>
                  <Input className="h-9 text-sm mt-1" value={form.bodyPart} onChange={e => setForm(f => ({ ...f, bodyPart: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Tipo de Lesão</Label>
                  <Input className="h-9 text-sm mt-1" value={form.injuryType} onChange={e => setForm(f => ({ ...f, injuryType: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Dias Perdidos</Label>
                  <Input type="number" className="h-9 text-sm mt-1" value={form.lostDays} onChange={e => setForm(f => ({ ...f, lostDays: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aberto">Aberto</SelectItem>
                      <SelectItem value="Em Investigação">Em Investigação</SelectItem>
                      <SelectItem value="Encerrado">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Descrição do Ocorrido *</Label>
                  <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Ação Imediata Tomada</Label>
                  <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.immediateAction} onChange={e => setForm(f => ({ ...f, immediateAction: e.target.value }))} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="investigation" className="space-y-3 mt-4">
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 mb-2">
                <strong>Método dos 5 Porquês:</strong> Questione repetidamente "Por quê?" para identificar a causa raiz do incidente.
              </div>
              {[
                { key: "why1", label: "1º Por quê?" },
                { key: "why2", label: "2º Por quê?" },
                { key: "why3", label: "3º Por quê?" },
                { key: "why4", label: "4º Por quê?" },
                { key: "why5", label: "5º Por quê? (Causa Raiz)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-xs">{label}</Label>
                  <Input className="h-9 text-sm mt-1" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <Label className="text-xs">Causa Raiz Identificada</Label>
                <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Testemunhas</Label>
                <Input className="h-9 text-sm mt-1" value={form.witnesses} onChange={e => setForm(f => ({ ...f, witnesses: e.target.value }))} />
              </div>
            </TabsContent>
            <TabsContent value="cat" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Número da CAT</Label>
                  <Input className="h-9 text-sm mt-1" placeholder="Nº da Comunicação de Acidente" value={form.catNumber} onChange={e => setForm(f => ({ ...f, catNumber: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Data da CAT</Label>
                  <Input type="date" className="h-9 text-sm mt-1" value={form.catDate} onChange={e => setForm(f => ({ ...f, catDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Ações Corretivas e Preventivas</Label>
                <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={4} value={form.correctiveActions} onChange={e => setForm(f => ({ ...f, correctiveActions: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Observações Adicionais</Label>
                <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Salvar" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewIncident && (
        <Dialog open={!!viewIncident} onOpenChange={() => setViewIncident(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Detalhes do Incidente
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Tipo</p><Badge variant="outline" className={cn("text-[10px] mt-1", typeColors[viewIncident.type] || "")}>{viewIncident.type}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={cn("text-[10px] mt-1", statusColors[viewIncident.status] || "")}>{viewIncident.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium">{viewIncident.date ? new Date(viewIncident.date).toLocaleDateString("pt-BR") : "—"} {viewIncident.time}</p></div>
                <div><p className="text-xs text-muted-foreground">Funcionário</p><p className="font-medium">{getEmployeeName(viewIncident.employeeId)}</p></div>
                <div><p className="text-xs text-muted-foreground">Local</p><p className="font-medium">{viewIncident.location || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Dias Perdidos</p><p className="font-medium">{viewIncident.lostDays || 0}</p></div>
              </div>
              {viewIncident.description && <div><p className="text-xs text-muted-foreground mb-1">Descrição</p><p className="text-sm bg-muted/30 rounded p-2">{viewIncident.description}</p></div>}
              {viewIncident.why1 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Análise 5 Porquês</p>
                  <div className="space-y-1">
                    {[viewIncident.why1, viewIncident.why2, viewIncident.why3, viewIncident.why4, viewIncident.why5].filter(Boolean).map((w, i) => (
                      <div key={i} className="flex gap-2 text-xs"><span className="text-muted-foreground shrink-0">{i + 1}.</span><span>{w}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {viewIncident.catNumber && <div><p className="text-xs text-muted-foreground">CAT</p><p className="font-medium">{viewIncident.catNumber}</p></div>}
              {viewIncident.correctiveActions && <div><p className="text-xs text-muted-foreground mb-1">Ações Corretivas</p><p className="text-sm bg-muted/30 rounded p-2">{viewIncident.correctiveActions}</p></div>}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
