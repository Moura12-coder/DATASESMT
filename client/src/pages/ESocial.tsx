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
import { Activity, Plus, Edit, Trash2, CheckCircle2, Clock, XCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const eventInfo: Record<string, { desc: string; color: string }> = {
  "S-2210": { desc: "Comunicação de Acidente de Trabalho (CAT)", color: "bg-red-50 text-red-700 border-red-200" },
  "S-2220": { desc: "Monitoramento da Saúde do Trabalhador (ASO)", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "S-2240": { desc: "Condições Ambientais do Trabalho (Agentes Nocivos)", color: "bg-orange-50 text-orange-700 border-orange-200" },
  "S-2245": { desc: "Treinamentos, Capacitações e Qualificações", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const statusColors: Record<string, string> = {
  "Pendente": "bg-amber-50 text-amber-700 border-amber-200",
  "Enviado": "bg-blue-50 text-blue-700 border-blue-200",
  "Sucesso": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Erro": "bg-red-50 text-red-700 border-red-200",
  "Retificado": "bg-purple-50 text-purple-700 border-purple-200",
};

const emptyEvent = {
  code: "S-2220" as "S-2210" | "S-2220" | "S-2240" | "S-2245",
  employeeId: undefined as number | undefined,
  eventDate: "",
  status: "Pendente" as "Pendente" | "Enviado" | "Sucesso" | "Erro" | "Retificado",
  protocol: "",
  errorMessage: "",
  referenceType: "",
};

export default function ESocial() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyEvent });
  const [codeFilter, setCodeFilter] = useState("all");

  const utils = trpc.useUtils();
  const { data: events = [], isLoading } = trpc.esocial.list.useQuery({});
  const { data: employees = [] } = trpc.employees.list.useQuery({});

  const createMutation = trpc.esocial.create.useMutation({
    onSuccess: () => { utils.esocial.list.invalidate(); toast.success("Evento eSocial registrado!"); setShowForm(false); setForm({ ...emptyEvent }); },
    onError: e => toast.error(e.message),
  });
  const updateMutation = trpc.esocial.update.useMutation({
    onSuccess: () => { utils.esocial.list.invalidate(); toast.success("Evento atualizado!"); setShowForm(false); },
    onError: e => toast.error(e.message),
  });

  const getEmployeeName = (id?: number | null) => id ? (employees.find(e => e.id === id)?.name || "—") : "Geral";

  const filtered = events.filter(e => codeFilter === "all" || e.code === codeFilter);

  const handleSubmit = () => {
    if (!form.code || !form.eventDate) return toast.error("Código do evento e data são obrigatórios");
    const payload = {
      code: form.code,
      employeeId: form.employeeId ? Number(form.employeeId) : undefined,
      eventDate: form.eventDate,
      status: form.status,
      protocol: form.protocol || undefined,
      referenceType: form.referenceType || undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const openEdit = (ev: any) => {
    setForm({
      code: ev.code,
      employeeId: ev.employeeId ?? undefined,
      eventDate: ev.eventDate ? new Date(ev.eventDate).toISOString().split("T")[0] : "",
      status: ev.status || "Pendente",
      protocol: ev.protocol || "",
      errorMessage: ev.errorMessage || "",
      referenceType: ev.referenceType || "",
    });
    setEditingId(ev.id); setShowForm(true);
  };

  const stats = {
    total: events.length,
    pendente: events.filter(e => e.status === "Pendente").length,
    enviado: events.filter(e => e.status === "Enviado").length,
    sucesso: events.filter(e => e.status === "Sucesso").length,
    erro: events.filter(e => e.status === "Erro").length,
  };

  const eventCounts = Object.keys(eventInfo).reduce((acc: Record<string, number>, k) => {
    acc[k] = events.filter(e => e.code === k).length; return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">eSocial SST</h1>
          <p className="text-sm text-muted-foreground">Gestão dos eventos S-2210, S-2220, S-2240 e S-2245 do eSocial</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyEvent }); setEditingId(null); setShowForm(true); }} size="sm">
          <Plus size={14} className="mr-1.5" /> Novo Evento
        </Button>
      </div>

      {/* Event Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(eventInfo).map(([code, info]) => (
          <Card key={code} className={cn("cursor-pointer transition-all hover:shadow-md", codeFilter === code && "ring-2 ring-primary")} onClick={() => setCodeFilter(codeFilter === code ? "all" : code)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className={cn("text-xs font-bold", info.color)}>{code}</Badge>
                <span className="text-lg font-bold text-foreground">{eventCounts[code] || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{info.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 flex items-center gap-2">
          <Clock size={16} className="text-amber-500 shrink-0" />
          <div><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-lg font-bold text-amber-700">{stats.pendente}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <Send size={16} className="text-blue-500 shrink-0" />
          <div><p className="text-xs text-muted-foreground">Enviados</p><p className="text-lg font-bold text-blue-700">{stats.enviado}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <div><p className="text-xs text-muted-foreground">Processados</p><p className="text-lg font-bold text-emerald-700">{stats.sucesso}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <XCircle size={16} className="text-red-500 shrink-0" />
          <div><p className="text-xs text-muted-foreground">Com Erro</p><p className="text-lg font-bold text-red-700">{stats.erro}</p></div>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Histórico de Eventos {codeFilter !== "all" && `— ${codeFilter}`}</span>
            {codeFilter !== "all" && <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setCodeFilter("all")}>Ver todos</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3">Evento</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Funcionário</th>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Protocolo</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <Activity size={32} className="mx-auto mb-2 opacity-30" />
                    Nenhum evento eSocial registrado
                  </td></tr>
                ) : filtered.map(ev => (
                  <tr key={ev.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px] font-bold", eventInfo[ev.code]?.color || "")}>{ev.code}</Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5 hidden lg:block">{eventInfo[ev.code]?.desc}</p>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{getEmployeeName(ev.employeeId)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {ev.protocol || <span className="text-xs italic">Aguardando</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[ev.status || "Pendente"])}>{ev.status || "Pendente"}</Badge>
                      {ev.errorMessage && <p className="text-[10px] text-red-600 mt-0.5 max-w-[150px] truncate">{ev.errorMessage}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ev)}><Edit size={13} /></Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Evento eSocial" : "Novo Evento eSocial"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Código do Evento *</Label>
              <Select value={form.code} onValueChange={v => setForm(f => ({ ...f, code: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(eventInfo).map(([code, info]) => (
                    <SelectItem key={code} value={code}>{code} — {info.desc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Funcionário</Label>
              <Select value={String(form.employeeId || "")} onValueChange={v => setForm(f => ({ ...f, employeeId: v ? Number(v) : undefined }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data do Evento *</Label>
                <Input type="date" className="h-9 text-sm mt-1" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="Sucesso">Sucesso</SelectItem>
                    <SelectItem value="Erro">Erro</SelectItem>
                    <SelectItem value="Retificado">Retificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Protocolo de Envio</Label>
              <Input className="h-9 text-sm mt-1" value={form.protocol} onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))} />
            </div>
            {form.status === "Erro" && (
              <div>
                <Label className="text-xs">Mensagem de Erro</Label>
                <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.errorMessage} onChange={e => setForm(f => ({ ...f, errorMessage: e.target.value }))} />
              </div>
            )}
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
