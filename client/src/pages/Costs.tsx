import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DollarSign, Plus, Edit, Trash2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const categories = ["EPI","Exame","Treinamento","Consultor","Equipamento","Outro"];
const categoryColors: Record<string, string> = { "EPI": "#3b82f6", "Exame": "#8b5cf6", "Treinamento": "#10b981", "Consultor": "#f59e0b", "Equipamento": "#ef4444", "Outro": "#6b7280" };
const emptyCost = { description: "", category: "EPI" as const, value: 0, date: "", status: "Pago" as const, notes: "", unitId: undefined as number | undefined };

export default function Costs() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyCost });

  const utils = trpc.useUtils();
  const { data: costs = [], isLoading } = trpc.costs.list.useQuery({});
  const { data: units = [] } = trpc.units.list.useQuery();
  const createMutation = trpc.costs.create.useMutation({ onSuccess: () => { utils.costs.list.invalidate(); toast.success("Custo registrado!"); setShowForm(false); setForm({ ...emptyCost }); }, onError: e => toast.error(e.message) });
  const updateMutation = trpc.costs.update.useMutation({ onSuccess: () => { utils.costs.list.invalidate(); toast.success("Custo atualizado!"); setShowForm(false); }, onError: e => toast.error(e.message) });
  const deleteMutation = trpc.costs.delete.useMutation({ onSuccess: () => { utils.costs.list.invalidate(); toast.success("Custo removido!"); }, onError: e => toast.error(e.message) });

  const openEdit = (c: any) => { setForm({ ...emptyCost, ...c, date: c.date ? String(c.date).split("T")[0] : "", value: Number(c.value) }); setEditingId(c.id); setShowForm(true); };

  const total = costs.reduce((acc, c) => acc + Number(c.value), 0);
  const pago = costs.filter(c => c.status === "Pago").reduce((acc, c) => acc + Number(c.value), 0);
  const pendente = costs.filter(c => c.status === "Pendente").reduce((acc, c) => acc + Number(c.value), 0);

  const chartData = categories.map(cat => ({ name: cat, value: costs.filter(c => c.category === cat).reduce((acc, c) => acc + Number(c.value), 0) })).filter(d => d.value > 0);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Custos SST</h1>
          <p className="text-sm text-muted-foreground">Controle de gastos com EPIs, exames, treinamentos e consultorias</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyCost }); setEditingId(null); setShowForm(true); }} size="sm">
          <Plus size={14} className="mr-1.5" /> Registrar Custo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Geral</p><p className="text-2xl font-bold text-foreground mt-1">{fmt(total)}</p><p className="text-xs text-muted-foreground mt-1">{costs.length} lançamentos</p></CardContent></Card>
        <Card className="border-emerald-200 bg-emerald-50/30"><CardContent className="p-4"><p className="text-xs text-emerald-600">Total Pago</p><p className="text-2xl font-bold text-emerald-700 mt-1">{fmt(pago)}</p></CardContent></Card>
        <Card className="border-amber-200 bg-amber-50/30"><CardContent className="p-4"><p className="text-xs text-amber-600">Total Pendente</p><p className="text-2xl font-bold text-amber-700 mt-1">{fmt(pendente)}</p></CardContent></Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={categoryColors[entry.name] || "#6b7280"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3">Descrição</th>
                  <th className="text-left px-4 py-3">Categoria</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Data</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <tr key={i} className="border-b"><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>)
                : costs.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <DollarSign size={32} className="mx-auto mb-2 opacity-30" />Nenhum custo registrado
                  </td></tr>
                ) : costs.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{c.description}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]" style={{ borderColor: categoryColors[c.category] + "40", color: categoryColors[c.category] }}>{c.category}</Badge></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{c.date ? new Date(c.date).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">{fmt(Number(c.value))}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={cn("text-[10px]", c.status === "Pago" ? "border-emerald-200 text-emerald-700" : c.status === "Pendente" ? "border-amber-200 text-amber-700" : "border-gray-200 text-gray-600")}>{c.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit size={13} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Remover?")) deleteMutation.mutate({ id: c.id }); }}><Trash2 size={13} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar Custo" : "Registrar Custo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Descrição *</Label><Input className="h-9 text-sm mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Valor (R$) *</Label><Input type="number" step="0.01" className="h-9 text-sm mt-1" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">Data</Label><Input type="date" className="h-9 text-sm mt-1" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Pago">Pago</SelectItem><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Cancelado">Cancelado</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Observações</Label><textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              if (!form.description || !form.value) return toast.error("Descrição e valor são obrigatórios");
              const payload = { ...form, value: Number(form.value), date: form.date || undefined, unitId: form.unitId ? Number(form.unitId) : undefined };
              if (editingId) updateMutation.mutate({ id: editingId, data: payload });
              else createMutation.mutate(payload as any);
            }} disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
