import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ClipboardCheck, Plus, Edit, Trash2, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  "Agendada": "border-blue-200 text-blue-700",
  "Em Andamento": "border-amber-200 text-amber-700",
  "Concluída": "border-emerald-200 text-emerald-700",
};

const emptyInspection = {
  unitId: 0, title: "", type: "Rotina" as const, inspectionDate: "", inspector: "",
  nr: "", status: "Agendada" as const, conformities: 0, nonConformities: 0,
  score: undefined as number | undefined, notes: "",
};

export default function Inspections() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyInspection });
  const [viewInspection, setViewInspection] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: inspections = [], isLoading } = trpc.inspections.list.useQuery({});
  const { data: units = [] } = trpc.units.list.useQuery();

  const createMutation = trpc.inspections.create.useMutation({ onSuccess: () => { utils.inspections.list.invalidate(); toast.success("Inspeção registrada!"); setShowForm(false); setForm({ ...emptyInspection }); }, onError: (e: any) => toast.error(e.message) });
  const updateMutation = trpc.inspections.update.useMutation({ onSuccess: () => { utils.inspections.list.invalidate(); toast.success("Inspeção atualizada!"); setShowForm(false); }, onError: (e: any) => toast.error(e.message) });
  const deleteMutation = trpc.inspections.delete.useMutation({ onSuccess: () => { utils.inspections.list.invalidate(); toast.success("Inspeção removida!"); }, onError: (e: any) => toast.error(e.message) });

  const filtered = (inspections as any[]).filter(i => !search || (i.title || "").toLowerCase().includes(search.toLowerCase()) || (i.inspector || "").toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = () => {
    if (!form.unitId || !form.inspectionDate || !form.title) return toast.error("Unidade, título e data são obrigatórios");
    const payload = { ...form, unitId: Number(form.unitId), conformities: Number(form.conformities), nonConformities: Number(form.nonConformities), score: form.score };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload as any);
  };

  const openEdit = (i: any) => {
    setForm({ ...emptyInspection, ...i, inspectionDate: i.inspectionDate ? String(i.inspectionDate).split("T")[0] : "", score: i.score ? Number(i.score) : undefined });
    setEditingId(i.id); setShowForm(true);
  };

  const stats = {
    total: (inspections as any[]).length,
    agendada: (inspections as any[]).filter(i => i.status === "Agendada").length,
    concluida: (inspections as any[]).filter(i => i.status === "Concluída").length,
    nonConformities: (inspections as any[]).reduce((acc: number, i: any) => acc + (i.nonConformities ?? 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Inspeções de Campo</h1>
          <p className="text-sm text-muted-foreground">Checklist digital, não conformidades e recomendações</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyInspection }); setEditingId(null); setShowForm(true); }} size="sm">
          <Plus size={14} className="mr-1.5" /> Nova Inspeção
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-blue-200 bg-blue-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-700">{stats.agendada}</p><p className="text-xs text-blue-600">Agendadas</p></CardContent></Card>
        <Card className="border-emerald-200 bg-emerald-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-700">{stats.concluida}</p><p className="text-xs text-emerald-600">Concluídas</p></CardContent></Card>
        <Card className="border-red-200 bg-red-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-700">{stats.nonConformities}</p><p className="text-xs text-red-600">Não Conformidades</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por título ou inspetor..." className="pl-8 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Título / Área</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Inspetor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">NC</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <tr key={i} className="border-b"><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <ClipboardCheck size={32} className="mx-auto mb-2 opacity-30" />Nenhuma inspeção registrada
                  </td></tr>
                ) : filtered.map((ins: any) => (
                  <tr key={ins.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium">{ins.title || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{ins.type}</Badge></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{ins.inspector || "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {(ins.nonConformities ?? 0) > 0 ? <Badge variant="outline" className="text-[10px] border-red-200 text-red-700">{ins.nonConformities} NC</Badge> : <span className="text-xs text-emerald-600">0 NC</span>}
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className={cn("text-[10px]", statusColors[ins.status || "Agendada"])}>{ins.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewInspection(ins)}><Eye size={13} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ins)}><Edit size={13} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Remover inspeção?")) deleteMutation.mutate({ id: ins.id }); }}><Trash2 size={13} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      {viewInspection && (
        <Dialog open={!!viewInspection} onOpenChange={() => setViewInspection(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Detalhes da Inspeção</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-xs text-muted-foreground">Título</span><p className="font-medium">{viewInspection.title}</p></div>
                <div><span className="text-xs text-muted-foreground">Data</span><p>{viewInspection.inspectionDate ? new Date(viewInspection.inspectionDate).toLocaleDateString("pt-BR") : "—"}</p></div>
                <div><span className="text-xs text-muted-foreground">Tipo</span><p>{viewInspection.type}</p></div>
                <div><span className="text-xs text-muted-foreground">Inspetor</span><p>{viewInspection.inspector || "—"}</p></div>
                <div><span className="text-xs text-muted-foreground">Conformidades</span><p className="text-emerald-600 font-semibold">{viewInspection.conformities ?? 0}</p></div>
                <div><span className="text-xs text-muted-foreground">Não Conformidades</span><p className="text-red-600 font-semibold">{viewInspection.nonConformities ?? 0}</p></div>
                {viewInspection.score && <div><span className="text-xs text-muted-foreground">Score</span><p className="font-semibold">{viewInspection.score}%</p></div>}
                <div><span className="text-xs text-muted-foreground">Status</span><Badge variant="outline" className={cn("text-[10px]", statusColors[viewInspection.status || "Agendada"])}>{viewInspection.status}</Badge></div>
              </div>
              {viewInspection.notes && <div><span className="text-xs text-muted-foreground">Observações</span><p className="mt-0.5 text-muted-foreground">{viewInspection.notes}</p></div>}
            </div>
            <DialogFooter><Button variant="outline" size="sm" onClick={() => setViewInspection(null)}>Fechar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Inspeção" : "Nova Inspeção"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Título *</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ex: Inspeção de EPI - Produção" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Unidade *</Label>
              <Select value={String(form.unitId || "")} onValueChange={v => setForm(f => ({ ...f, unitId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{(units as any[]).map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Rotina","Especial","Auditoria","Pós-Acidente"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data *</Label>
              <Input type="date" className="h-9 text-sm mt-1" value={form.inspectionDate} onChange={e => setForm(f => ({ ...f, inspectionDate: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Inspetor</Label>
              <Input className="h-9 text-sm mt-1" value={form.inspector} onChange={e => setForm(f => ({ ...f, inspector: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">NR Relacionada</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ex: NR-12" value={form.nr} onChange={e => setForm(f => ({ ...f, nr: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agendada">Agendada</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Conformidades</Label>
              <Input type="number" className="h-9 text-sm mt-1" value={form.conformities} onChange={e => setForm(f => ({ ...f, conformities: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Não Conformidades</Label>
              <Input type="number" className="h-9 text-sm mt-1" value={form.nonConformities} onChange={e => setForm(f => ({ ...f, nonConformities: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Score (%)</Label>
              <Input type="number" step="0.1" min="0" max="100" className="h-9 text-sm mt-1" value={form.score ?? ""} onChange={e => setForm(f => ({ ...f, score: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Observações / Achados</Label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Salvar" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
