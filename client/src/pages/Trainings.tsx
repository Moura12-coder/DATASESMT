import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, Plus, Edit, Trash2, AlertTriangle, Search, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  "Vigente": "border-emerald-200 text-emerald-700",
  "A Vencer": "border-amber-200 text-amber-700",
  "Vencido": "border-red-200 text-red-700",
};

const emptyTraining = { title: "", nr: "", type: "Periódico" as const, instructor: "", workload: 8, validityMonths: 12, description: "" };
const emptyRecord = { trainingId: 0, employeeId: 0, completionDate: "", expiryDate: "", status: "Vigente" as const, score: undefined as number | undefined, notes: "" };

export default function Trainings() {
  const [search, setSearch] = useState("");
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingTrainingId, setEditingTrainingId] = useState<number | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [trainingForm, setTrainingForm] = useState({ ...emptyTraining });
  const [recordForm, setRecordForm] = useState({ ...emptyRecord });

  const utils = trpc.useUtils();
  const { data: trainings = [], isLoading: loadingTrainings } = trpc.trainings.list.useQuery();
  const { data: records = [], isLoading: loadingRecords } = trpc.trainings.records.list.useQuery({});
  const { data: employees = [] } = trpc.employees.list.useQuery({});
  const { data: expiring = [] } = trpc.trainings.expiring.useQuery({ days: 30 });

  const createTraining = trpc.trainings.create.useMutation({ onSuccess: () => { utils.trainings.list.invalidate(); toast.success("Treinamento cadastrado!"); setShowTrainingForm(false); setTrainingForm({ ...emptyTraining }); }, onError: (e: any) => toast.error(e.message) });
  const updateTraining = trpc.trainings.update.useMutation({ onSuccess: () => { utils.trainings.list.invalidate(); toast.success("Treinamento atualizado!"); setShowTrainingForm(false); }, onError: (e: any) => toast.error(e.message) });
  const deleteTraining = trpc.trainings.delete.useMutation({ onSuccess: () => { utils.trainings.list.invalidate(); toast.success("Treinamento removido!"); }, onError: (e: any) => toast.error(e.message) });
  const createRecord = trpc.trainings.records.create.useMutation({ onSuccess: () => { utils.trainings.records.list.invalidate(); toast.success("Registro adicionado!"); setShowRecordForm(false); setRecordForm({ ...emptyRecord }); }, onError: (e: any) => toast.error(e.message) });
  const updateRecord = trpc.trainings.records.update.useMutation({ onSuccess: () => { utils.trainings.records.list.invalidate(); toast.success("Registro atualizado!"); setShowRecordForm(false); }, onError: (e: any) => toast.error(e.message) });

  const getEmployeeName = (id: number) => (employees as any[]).find(e => e.id === id)?.name || "—";
  const getTrainingTitle = (id: number) => (trainings as any[]).find(t => t.id === id)?.title || "—";

  const filteredRecords = (records as any[]).filter(r => {
    if (!search) return true;
    return getEmployeeName(r.employeeId).toLowerCase().includes(search.toLowerCase()) || getTrainingTitle(r.trainingId).toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: (records as any[]).length,
    vigente: (records as any[]).filter(r => r.status === "Vigente").length,
    aVencer: (records as any[]).filter(r => r.status === "A Vencer").length,
    vencido: (records as any[]).filter(r => r.status === "Vencido").length,
  };

  const nrGroups = (trainings as any[]).reduce((acc: Record<string, number>, t) => {
    const nr = t.nr || "Sem NR"; acc[nr] = (acc[nr] || 0) + 1; return acc;
  }, {});

  const openEditTraining = (t: any) => {
    setTrainingForm({ title: t.title, nr: t.nr || "", type: t.type || "Periódico", instructor: t.instructor || "", workload: t.workload || 8, validityMonths: t.validityMonths || 12, description: t.description || "" });
    setEditingTrainingId(t.id); setShowTrainingForm(true);
  };

  const openEditRecord = (r: any) => {
    setRecordForm({ trainingId: r.trainingId, employeeId: r.employeeId, completionDate: r.completionDate ? String(r.completionDate).split("T")[0] : "", expiryDate: r.expiryDate ? String(r.expiryDate).split("T")[0] : "", status: r.status || "Vigente", score: r.score ? Number(r.score) : undefined, notes: r.notes || "" });
    setEditingRecordId(r.id); setShowRecordForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Treinamentos e Capacitações</h1>
          <p className="text-sm text-muted-foreground">Catálogo de treinamentos por NR e registros de conclusão por funcionário</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setTrainingForm({ ...emptyTraining }); setEditingTrainingId(null); setShowTrainingForm(true); }}>
            <BookOpen size={14} className="mr-1.5" /> Novo Treinamento
          </Button>
          <Button size="sm" onClick={() => { setRecordForm({ ...emptyRecord }); setEditingRecordId(null); setShowRecordForm(true); }}>
            <Plus size={14} className="mr-1.5" /> Registrar Conclusão
          </Button>
        </div>
      </div>

      {(expiring as any[]).length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{(expiring as any[]).length} treinamento(s) vencendo nos próximos 30 dias</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(expiring as any[]).slice(0, 5).map((r: any) => <Badge key={r.id} variant="outline" className="text-[10px] border-amber-200 text-amber-700">{getEmployeeName(r.employeeId)} — {getTrainingTitle(r.trainingId)}</Badge>)}
                {(expiring as any[]).length > 5 && <Badge variant="outline" className="text-[10px]">+{(expiring as any[]).length - 5} mais</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-emerald-200 bg-emerald-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-700">{stats.vigente}</p><p className="text-xs text-emerald-600">Vigentes</p></CardContent></Card>
        <Card className="border-amber-200 bg-amber-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-700">{stats.aVencer}</p><p className="text-xs text-amber-600">A Vencer</p></CardContent></Card>
        <Card className="border-red-200 bg-red-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-700">{stats.vencido}</p><p className="text-xs text-red-600">Vencidos</p></CardContent></Card>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records" className="text-xs gap-1.5"><Users size={13} /> Registros ({(records as any[]).length})</TabsTrigger>
          <TabsTrigger value="catalog" className="text-xs gap-1.5"><BookOpen size={13} /> Catálogo ({(trainings as any[]).length})</TabsTrigger>
          <TabsTrigger value="matrix" className="text-xs gap-1.5">Matriz por NR</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-4 space-y-3">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por funcionário ou treinamento..." className="pl-8 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Funcionário</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Treinamento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Conclusão</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Vencimento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRecords ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b"><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                    )) : filteredRecords.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        <GraduationCap size={32} className="mx-auto mb-2 opacity-30" />Nenhum registro encontrado
                      </td></tr>
                    ) : filteredRecords.map((r: any) => (
                      <tr key={r.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{getEmployeeName(r.employeeId)}</td>
                        <td className="px-4 py-3 text-sm">{getTrainingTitle(r.trainingId)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{r.completionDate ? new Date(r.completionDate).toLocaleDateString("pt-BR") : "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString("pt-BR") : "—"}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={cn("text-[10px]", statusColors[r.status || "Vigente"])}>{r.status || "Vigente"}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRecord(r)}><Edit size={13} /></Button>
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

        <TabsContent value="catalog" className="mt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingTrainings ? Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-20 bg-muted rounded animate-pulse" /></CardContent></Card>)
            : (trainings as any[]).length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum treinamento no catálogo</p>
              </div>
            ) : (trainings as any[]).map((t: any) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {t.nr && <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700">{t.nr}</Badge>}
                        {t.type && <Badge variant="outline" className="text-[10px]">{t.type}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTraining(t)}><Edit size={13} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Remover treinamento?")) deleteTraining.mutate({ id: t.id }); }}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    {t.workload && <span>⏱ {t.workload}h</span>}
                    {t.validityMonths && <span>📅 {t.validityMonths} meses</span>}
                    {t.instructor && <span>👤 {t.instructor}</span>}
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{t.description}</p>}
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-[10px] text-muted-foreground">{(records as any[]).filter(r => r.trainingId === t.id).length} registros de conclusão</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(nrGroups).sort().map(([nr, count]) => {
              const nrTrainings = (trainings as any[]).filter(t => (t.nr || "Sem NR") === nr);
              const nrRecords = (records as any[]).filter(r => nrTrainings.some(t => t.id === r.trainingId));
              const vigente = nrRecords.filter(r => r.status === "Vigente").length;
              const aVencer = nrRecords.filter(r => r.status === "A Vencer").length;
              const vencido = nrRecords.filter(r => r.status === "Vencido").length;
              return (
                <Card key={nr}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs font-bold border-blue-200 text-blue-700">{nr}</Badge>
                      <span className="text-xs text-muted-foreground">{count} treinamento{count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-emerald-600">✓ Vigentes</span><span className="font-semibold text-emerald-700">{vigente}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-amber-600">⚠ A Vencer</span><span className="font-semibold text-amber-700">{aVencer}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-red-600">✗ Vencidos</span><span className="font-semibold text-red-700">{vencido}</span></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {Object.keys(nrGroups).length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <GraduationCap size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum treinamento cadastrado</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Training Catalog Form */}
      <Dialog open={showTrainingForm} onOpenChange={setShowTrainingForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTrainingId ? "Editar Treinamento" : "Novo Treinamento"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Título *</Label><Input className="h-9 text-sm mt-1" value={trainingForm.title} onChange={e => setTrainingForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">NR Relacionada</Label><Input className="h-9 text-sm mt-1" placeholder="Ex: NR-35" value={trainingForm.nr} onChange={e => setTrainingForm(f => ({ ...f, nr: e.target.value }))} /></div>
              <div><Label className="text-xs">Tipo</Label>
                <Select value={trainingForm.type} onValueChange={v => setTrainingForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Integração","Periódico","Específico","Reciclagem","Outro"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Carga Horária (h)</Label><Input type="number" className="h-9 text-sm mt-1" value={trainingForm.workload} onChange={e => setTrainingForm(f => ({ ...f, workload: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">Validade (meses)</Label><Input type="number" className="h-9 text-sm mt-1" value={trainingForm.validityMonths} onChange={e => setTrainingForm(f => ({ ...f, validityMonths: Number(e.target.value) }))} /></div>
            </div>
            <div><Label className="text-xs">Instrutor</Label><Input className="h-9 text-sm mt-1" value={trainingForm.instructor} onChange={e => setTrainingForm(f => ({ ...f, instructor: e.target.value }))} /></div>
            <div><Label className="text-xs">Descrição</Label><textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={trainingForm.description} onChange={e => setTrainingForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowTrainingForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              if (!trainingForm.title) return toast.error("Título é obrigatório");
              if (editingTrainingId) updateTraining.mutate({ id: editingTrainingId, data: trainingForm });
              else createTraining.mutate(trainingForm as any);
            }} disabled={createTraining.isPending || updateTraining.isPending}>{editingTrainingId ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Form */}
      <Dialog open={showRecordForm} onOpenChange={setShowRecordForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingRecordId ? "Editar Registro" : "Registrar Conclusão"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Funcionário *</Label>
              <Select value={String(recordForm.employeeId || "")} onValueChange={v => setRecordForm(f => ({ ...f, employeeId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{(employees as any[]).map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Treinamento *</Label>
              <Select value={String(recordForm.trainingId || "")} onValueChange={v => setRecordForm(f => ({ ...f, trainingId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{(trainings as any[]).map(t => <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Data de Conclusão *</Label><Input type="date" className="h-9 text-sm mt-1" value={recordForm.completionDate} onChange={e => setRecordForm(f => ({ ...f, completionDate: e.target.value }))} /></div>
              <div><Label className="text-xs">Data de Vencimento</Label><Input type="date" className="h-9 text-sm mt-1" value={recordForm.expiryDate} onChange={e => setRecordForm(f => ({ ...f, expiryDate: e.target.value }))} /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={recordForm.status} onValueChange={v => setRecordForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vigente">Vigente</SelectItem>
                    <SelectItem value="A Vencer">A Vencer</SelectItem>
                    <SelectItem value="Vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Nota (0-10)</Label><Input type="number" step="0.1" min="0" max="10" className="h-9 text-sm mt-1" value={recordForm.score ?? ""} onChange={e => setRecordForm(f => ({ ...f, score: e.target.value ? Number(e.target.value) : undefined }))} /></div>
            </div>
            <div><Label className="text-xs">Observações</Label><textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={recordForm.notes} onChange={e => setRecordForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowRecordForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              if (!recordForm.employeeId || !recordForm.trainingId || !recordForm.completionDate) return toast.error("Funcionário, treinamento e data são obrigatórios");
              const payload = { trainingId: Number(recordForm.trainingId), employeeId: Number(recordForm.employeeId), completionDate: recordForm.completionDate, expiryDate: recordForm.expiryDate || undefined, status: recordForm.status, score: recordForm.score, notes: recordForm.notes };
              if (editingRecordId) updateRecord.mutate({ id: editingRecordId, data: payload });
              else createRecord.mutate(payload as any);
            }} disabled={createRecord.isPending || updateRecord.isPending}>{editingRecordId ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
