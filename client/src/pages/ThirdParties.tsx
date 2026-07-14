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
import { Building, Plus, Edit, Trash2, Search, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyThirdParty = { companyName: "", cnpj: "", contact: "", phone: "", email: "", serviceType: "", contractStart: "", contractEnd: "", status: "Ativo" as const, pgr: false, pcmso: false, notes: "" };

export default function ThirdParties() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyThirdParty });

  const utils = trpc.useUtils();
  const { data: thirdParties = [], isLoading } = trpc.thirdParties.list.useQuery({});
  const createMutation = trpc.thirdParties.create.useMutation({ onSuccess: () => { utils.thirdParties.list.invalidate(); toast.success("Terceiro cadastrado!"); setShowForm(false); setForm({ ...emptyThirdParty }); }, onError: e => toast.error(e.message) });
  const updateMutation = trpc.thirdParties.update.useMutation({ onSuccess: () => { utils.thirdParties.list.invalidate(); toast.success("Terceiro atualizado!"); setShowForm(false); }, onError: e => toast.error(e.message) });
  const deleteMutation = trpc.thirdParties.delete.useMutation({ onSuccess: () => { utils.thirdParties.list.invalidate(); toast.success("Terceiro removido!"); }, onError: e => toast.error(e.message) });

  const filtered = thirdParties.filter(t => !search || t.companyName.toLowerCase().includes(search.toLowerCase()) || (t.serviceType || "").toLowerCase().includes(search.toLowerCase()));

  const openEdit = (t: any) => {
    setForm({ ...emptyThirdParty, ...t, contractStart: t.contractStart ? String(t.contractStart).split("T")[0] : "", contractEnd: t.contractEnd ? String(t.contractEnd).split("T")[0] : "" });
    setEditingId(t.id); setShowForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gestão de Terceiros</h1>
          <p className="text-sm text-muted-foreground">Empresas contratadas, prestadores de serviço e seus requisitos SST</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyThirdParty }); setEditingId(null); setShowForm(true); }} size="sm">
          <Plus size={14} className="mr-1.5" /> Novo Terceiro
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{thirdParties.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-emerald-200 bg-emerald-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-700">{thirdParties.filter(t => t.status === "Ativo").length}</p><p className="text-xs text-emerald-600">Ativos</p></CardContent></Card>
        <Card className="border-blue-200 bg-blue-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-700">{thirdParties.filter(t => t.pgr).length}</p><p className="text-xs text-blue-600">Com PGR</p></CardContent></Card>
        <Card className="border-purple-200 bg-purple-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-700">{thirdParties.filter(t => t.pcmso).length}</p><p className="text-xs text-purple-600">Com PCMSO</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar terceiro..." className="pl-8 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3">Empresa</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Serviço</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Contrato</th>
                  <th className="text-left px-4 py-3">PGR/PCMSO</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <tr key={i} className="border-b"><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>)
                : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <Building size={32} className="mx-auto mb-2 opacity-30" />Nenhum terceiro cadastrado
                  </td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{t.companyName}</p>
                      {t.cnpj && <p className="text-[10px] text-muted-foreground">{t.cnpj}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{t.serviceType || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {t.contractStart ? new Date(t.contractStart).toLocaleDateString("pt-BR") : "—"}
                      {t.contractEnd && ` → ${new Date(t.contractEnd).toLocaleDateString("pt-BR")}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {t.pgr ? <CheckCircle2 size={14} className="text-emerald-600" /> : <XCircle size={14} className="text-muted-foreground/40" />}
                        <span className="text-[10px] text-muted-foreground">PGR</span>
                        {t.pcmso ? <CheckCircle2 size={14} className="text-emerald-600 ml-1" /> : <XCircle size={14} className="text-muted-foreground/40 ml-1" />}
                        <span className="text-[10px] text-muted-foreground">PCMSO</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px]", t.status === "Ativo" ? "border-emerald-200 text-emerald-700" : "border-gray-200 text-gray-600")}>{t.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Edit size={13} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Remover?")) deleteMutation.mutate({ id: t.id }); }}><Trash2 size={13} /></Button>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Terceiro" : "Novo Terceiro"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Nome da Empresa *</Label><Input className="h-9 text-sm mt-1" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></div>
            <div><Label className="text-xs">CNPJ</Label><Input className="h-9 text-sm mt-1" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} /></div>
            <div><Label className="text-xs">Contato</Label><Input className="h-9 text-sm mt-1" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
            <div><Label className="text-xs">Telefone</Label><Input className="h-9 text-sm mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label className="text-xs">E-mail</Label><Input className="h-9 text-sm mt-1" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Serviço Prestado</Label><Input className="h-9 text-sm mt-1" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} /></div>
            <div><Label className="text-xs">Início do Contrato</Label><Input type="date" className="h-9 text-sm mt-1" value={form.contractStart} onChange={e => setForm(f => ({ ...f, contractStart: e.target.value }))} /></div>
            <div><Label className="text-xs">Fim do Contrato</Label><Input type="date" className="h-9 text-sm mt-1" value={form.contractEnd} onChange={e => setForm(f => ({ ...f, contractEnd: e.target.value }))} /></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem><SelectItem value="Suspenso">Suspenso</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.pgr} onChange={e => setForm(f => ({ ...f, pgr: e.target.checked }))} className="rounded" /> PGR</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.pcmso} onChange={e => setForm(f => ({ ...f, pcmso: e.target.checked }))} className="rounded" /> PCMSO</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              if (!form.companyName) return toast.error("Nome é obrigatório");
              const payload = { ...form, contractStart: form.contractStart || undefined, contractEnd: form.contractEnd || undefined };
              if (editingId) updateMutation.mutate({ id: editingId, data: payload });
              else createMutation.mutate(payload as any);
            }} disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
