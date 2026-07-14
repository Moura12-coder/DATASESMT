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
import { Stethoscope, Plus, Edit, Trash2, AlertTriangle, Clock, CheckCircle2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const examStatusColors: Record<string, string> = {
  "Válido": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "A Vencer": "bg-amber-50 text-amber-700 border-amber-200",
  "Vencido": "bg-red-50 text-red-700 border-red-200",
};

const resultColors: Record<string, string> = {
  "Apto": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Apto com Restrições": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Inapto Temporário": "bg-orange-50 text-orange-700 border-orange-200",
  "Inapto": "bg-red-50 text-red-700 border-red-200",
};

const emptyExam = {
  employeeId: 0, type: "Periódico" as const, examDate: "", expirationDate: "",
  doctor: "", crm: "", result: "Apto" as const, restrictions: "",
  status: "Válido" as const, notes: "",
};

export default function PCMSO() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyExam });

  const utils = trpc.useUtils();
  const { data: exams = [], isLoading } = trpc.exams.list.useQuery({});
  const { data: employees = [] } = trpc.employees.list.useQuery({});
  const { data: expiringExams = [] } = trpc.exams.expiring.useQuery({ days: 30 });

  const createMutation = trpc.exams.create.useMutation({ onSuccess: () => { utils.exams.list.invalidate(); toast.success("Exame cadastrado!"); setShowForm(false); setForm({ ...emptyExam }); }, onError: e => toast.error(e.message) });
  const updateMutation = trpc.exams.update.useMutation({ onSuccess: () => { utils.exams.list.invalidate(); toast.success("Exame atualizado!"); setShowForm(false); }, onError: e => toast.error(e.message) });
  const deleteMutation = trpc.exams.delete.useMutation({ onSuccess: () => { utils.exams.list.invalidate(); toast.success("Exame removido!"); }, onError: e => toast.error(e.message) });

  const getEmployeeName = (id: number) => employees.find(e => e.id === id)?.name || "—";

  const filtered = exams.filter(e => {
    const empName = getEmployeeName(e.employeeId).toLowerCase();
    const matchSearch = !search || empName.includes(search.toLowerCase());
    const matchType = typeFilter === "all" || e.type === typeFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleSubmit = () => {
    if (!form.employeeId || !form.examDate) return toast.error("Funcionário e data são obrigatórios");
    const payload = { ...form, employeeId: Number(form.employeeId) };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload as any);
  };

  const openEdit = (exam: any) => {
    setForm({ ...emptyExam, ...exam, examDate: exam.examDate ? String(exam.examDate).split("T")[0] : "", expirationDate: exam.expirationDate ? String(exam.expirationDate).split("T")[0] : "" });
    setEditingId(exam.id); setShowForm(true);
  };

  const stats = {
    total: exams.length,
    valido: exams.filter(e => e.status === "Válido").length,
    aVencer: exams.filter(e => e.status === "A Vencer").length,
    vencido: exams.filter(e => e.status === "Vencido").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">PCMSO — Programa de Controle Médico de Saúde Ocupacional</h1>
          <p className="text-sm text-muted-foreground">NR-07 • Gestão de exames, ASOs e saúde ocupacional</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyExam }); setEditingId(null); setShowForm(true); }} size="sm">
          <Plus size={14} className="mr-1.5" /> Novo Exame
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{stats.total}</p><p className="text-xs text-muted-foreground">Total de Exames</p></CardContent></Card>
        <Card className="border-emerald-200 bg-emerald-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-700">{stats.valido}</p><p className="text-xs text-emerald-600">Válidos</p></CardContent></Card>
        <Card className="border-amber-200 bg-amber-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-700">{stats.aVencer}</p><p className="text-xs text-amber-600">A Vencer (30 dias)</p></CardContent></Card>
        <Card className="border-red-200 bg-red-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-700">{stats.vencido}</p><p className="text-xs text-red-600">Vencidos</p></CardContent></Card>
      </div>

      {/* Expiring Alert */}
      {expiringExams.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Atenção: {expiringExams.length} exame(s) vencem nos próximos 30 dias</p>
              <p className="text-xs text-amber-700 mt-0.5">Agende os exames periódicos para manter a conformidade com a NR-07.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="text-xs">Todos os Exames</TabsTrigger>
          <TabsTrigger value="expiring" className="text-xs">A Vencer ({expiringExams.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por funcionário..." className="pl-8 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {["Admissional","Periódico","Demissional","Retorno ao Trabalho","Mudança de Função"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Válido">Válido</SelectItem>
                  <SelectItem value="A Vencer">A Vencer</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3">Funcionário</th>
                      <th className="text-left px-4 py-3">Tipo</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Data Exame</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Vencimento</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Resultado</th>
                      <th className="text-left px-4 py-3">Status ASO</th>
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
                        <Stethoscope size={32} className="mx-auto mb-2 opacity-30" />
                        Nenhum exame encontrado
                      </td></tr>
                    ) : filtered.map(exam => (
                      <tr key={exam.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{getEmployeeName(exam.employeeId)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px]">{exam.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          {exam.examDate ? new Date(exam.examDate).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm hidden lg:table-cell">
                          {exam.expirationDate ? (
                            <span className={cn(exam.status === "Vencido" ? "text-red-600 font-semibold" : exam.status === "A Vencer" ? "text-amber-600 font-semibold" : "text-muted-foreground")}>
                              {new Date(exam.expirationDate).toLocaleDateString("pt-BR")}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Badge variant="outline" className={cn("text-[10px]", resultColors[exam.result || "Apto"])}>{exam.result}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px]", examStatusColors[exam.status || "Válido"])}>{exam.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(exam)}><Edit size={13} /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover exame?")) deleteMutation.mutate({ id: exam.id }); }}><Trash2 size={13} /></Button>
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

        <TabsContent value="expiring" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3">Funcionário</th>
                      <th className="text-left px-4 py-3">Tipo</th>
                      <th className="text-left px-4 py-3">Vencimento</th>
                      <th className="text-left px-4 py-3">Dias Restantes</th>
                      <th className="text-left px-4 py-3">Médico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringExams.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                        Nenhum exame vencendo nos próximos 30 dias
                      </td></tr>
                    ) : expiringExams.map(exam => {
                      const daysLeft = exam.expirationDate ? Math.ceil((new Date(exam.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                      return (
                        <tr key={exam.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">{getEmployeeName(exam.employeeId)}</td>
                          <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{exam.type}</Badge></td>
                          <td className="px-4 py-3 text-sm text-amber-600 font-semibold">{exam.expirationDate ? new Date(exam.expirationDate).toLocaleDateString("pt-BR") : "—"}</td>
                          <td className="px-4 py-3">
                            {daysLeft !== null && (
                              <Badge variant="outline" className={cn("text-[10px]", daysLeft <= 7 ? "border-red-200 text-red-700" : "border-amber-200 text-amber-700")}>
                                {daysLeft} dias
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{exam.doctor || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Exame" : "Novo Exame / ASO"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Funcionário *</Label>
              <Select value={String(form.employeeId || "")} onValueChange={v => setForm(f => ({ ...f, employeeId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo de Exame *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Admissional","Periódico","Demissional","Retorno ao Trabalho","Mudança de Função"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Resultado</Label>
              <Select value={form.result} onValueChange={v => setForm(f => ({ ...f, result: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Apto","Apto com Restrições","Inapto Temporário","Inapto"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data do Exame *</Label>
              <Input type="date" className="h-9 text-sm mt-1" value={form.examDate} onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Data de Vencimento</Label>
              <Input type="date" className="h-9 text-sm mt-1" value={form.expirationDate} onChange={e => setForm(f => ({ ...f, expirationDate: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Médico Responsável</Label>
              <Input className="h-9 text-sm mt-1" value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">CRM</Label>
              <Input className="h-9 text-sm mt-1" value={form.crm} onChange={e => setForm(f => ({ ...f, crm: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Status do ASO</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Válido">Válido</SelectItem>
                  <SelectItem value="A Vencer">A Vencer</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Restrições / Observações</Label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.restrictions} onChange={e => setForm(f => ({ ...f, restrictions: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
