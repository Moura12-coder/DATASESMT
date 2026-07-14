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
import { Users, Plus, Search, Filter, Edit, Trash2, UserCheck, UserX, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  "Ativo": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Afastado": "bg-red-50 text-red-700 border-red-200",
  "Férias": "bg-blue-50 text-blue-700 border-blue-200",
  "Desligado": "bg-gray-50 text-gray-600 border-gray-200",
};

const emptyEmployee = {
  unitId: 0, sectorId: undefined as number | undefined, name: "", cpf: "", rg: "", role: "",
  department: "", admissionDate: "", birthDate: "", phone: "", email: "",
  status: "Ativo" as const, esocialCategory: "", pis: "", ctps: "", bloodType: "",
  emergencyContact: "", emergencyPhone: "", notes: "",
};

export default function Employees() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyEmployee });
  const [viewEmployee, setViewEmployee] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: employees = [], isLoading } = trpc.employees.list.useQuery({});
  const { data: units = [] } = trpc.units.list.useQuery();
  const { data: sectors = [] } = trpc.sectors.list.useQuery({});

  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => { utils.employees.list.invalidate(); toast.success("Funcionário cadastrado!"); setShowForm(false); setForm({ ...emptyEmployee }); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.employees.update.useMutation({
    onSuccess: () => { utils.employees.list.invalidate(); toast.success("Funcionário atualizado!"); setShowForm(false); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.employees.delete.useMutation({
    onSuccess: () => { utils.employees.list.invalidate(); toast.success("Funcionário removido!"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = employees.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.cpf || "").includes(search) || (e.role || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = () => {
    if (!form.name || !form.unitId) return toast.error("Nome e unidade são obrigatórios");
    const payload = { ...form, unitId: Number(form.unitId), sectorId: form.sectorId ? Number(form.sectorId) : undefined };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload as any);
  };

  const openEdit = (emp: any) => {
    setForm({ ...emptyEmployee, ...emp, admissionDate: emp.admissionDate ? String(emp.admissionDate).split("T")[0] : "", birthDate: emp.birthDate ? String(emp.birthDate).split("T")[0] : "" });
    setEditingId(emp.id);
    setShowForm(true);
  };

  const stats = { total: employees.length, active: employees.filter(e => e.status === "Ativo").length, afastado: employees.filter(e => e.status === "Afastado").length, ferias: employees.filter(e => e.status === "Férias").length };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Funcionários</h1>
          <p className="text-sm text-muted-foreground">Gestão completa do quadro de colaboradores</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyEmployee }); setEditingId(null); setShowForm(true); }} size="sm">
          <Plus size={14} className="mr-1.5" /> Novo Funcionário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Ativos", value: stats.active, color: "text-emerald-600" },
          { label: "Afastados", value: stats.afastado, color: "text-red-600" },
          { label: "Férias", value: stats.ferias, color: "text-blue-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome, CPF ou cargo..." className="pl-8 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Afastado">Afastado</SelectItem>
              <SelectItem value="Férias">Férias</SelectItem>
              <SelectItem value="Desligado">Desligado</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3">Nome</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">CPF</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Cargo</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Admissão</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    {search || statusFilter !== "all" ? "Nenhum funcionário encontrado" : "Nenhum funcionário cadastrado"}
                  </td></tr>
                ) : filtered.map(emp => (
                  <tr key={emp.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.department || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{emp.cpf || "—"}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{emp.role || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{emp.admissionDate ? new Date(emp.admissionDate).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[emp.status] || "")}>{emp.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewEmployee(emp)}>
                          <Eye size={13} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(emp)}>
                          <Edit size={13} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover funcionário?")) deleteMutation.mutate({ id: emp.id }); }}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
              Exibindo {filtered.length} de {employees.length} funcionários
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1 text-xs">Dados Básicos</TabsTrigger>
              <TabsTrigger value="work" className="flex-1 text-xs">Dados Trabalhistas</TabsTrigger>
              <TabsTrigger value="health" className="flex-1 text-xs">Saúde / Emergência</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Nome Completo *</Label>
                  <Input className="h-9 text-sm mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">CPF</Label>
                  <Input className="h-9 text-sm mt-1" placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">RG</Label>
                  <Input className="h-9 text-sm mt-1" value={form.rg} onChange={e => setForm(f => ({ ...f, rg: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Data de Nascimento</Label>
                  <Input type="date" className="h-9 text-sm mt-1" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input className="h-9 text-sm mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" className="h-9 text-sm mt-1" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="work" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Unidade *</Label>
                  <Select value={String(form.unitId || "")} onValueChange={v => setForm(f => ({ ...f, unitId: Number(v) }))}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{units.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Setor</Label>
                  <Select value={String(form.sectorId || "")} onValueChange={v => setForm(f => ({ ...f, sectorId: v ? Number(v) : undefined }))}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{sectors.filter(s => !form.unitId || s.unitId === form.unitId).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Cargo / Função</Label>
                  <Input className="h-9 text-sm mt-1" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Departamento</Label>
                  <Input className="h-9 text-sm mt-1" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Data de Admissão</Label>
                  <Input type="date" className="h-9 text-sm mt-1" value={form.admissionDate} onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Afastado">Afastado</SelectItem>
                      <SelectItem value="Férias">Férias</SelectItem>
                      <SelectItem value="Desligado">Desligado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">PIS/PASEP</Label>
                  <Input className="h-9 text-sm mt-1" value={form.pis} onChange={e => setForm(f => ({ ...f, pis: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">CTPS</Label>
                  <Input className="h-9 text-sm mt-1" value={form.ctps} onChange={e => setForm(f => ({ ...f, ctps: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Categoria eSocial</Label>
                  <Input className="h-9 text-sm mt-1" placeholder="Ex: 101" value={form.esocialCategory} onChange={e => setForm(f => ({ ...f, esocialCategory: e.target.value }))} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="health" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo Sanguíneo</Label>
                  <Select value={form.bloodType} onValueChange={v => setForm(f => ({ ...f, bloodType: v }))}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Contato de Emergência</Label>
                  <Input className="h-9 text-sm mt-1" value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Telefone de Emergência</Label>
                  <Input className="h-9 text-sm mt-1" value={form.emergencyPhone} onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Observações</Label>
                  <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewEmployee && (
        <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  {viewEmployee.name.charAt(0).toUpperCase()}
                </div>
                {viewEmployee.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "CPF", value: viewEmployee.cpf },
                { label: "Cargo", value: viewEmployee.role },
                { label: "Departamento", value: viewEmployee.department },
                { label: "Admissão", value: viewEmployee.admissionDate ? new Date(viewEmployee.admissionDate).toLocaleDateString("pt-BR") : null },
                { label: "Status", value: viewEmployee.status },
                { label: "Telefone", value: viewEmployee.phone },
                { label: "E-mail", value: viewEmployee.email },
                { label: "PIS", value: viewEmployee.pis },
                { label: "Tipo Sanguíneo", value: viewEmployee.bloodType },
                { label: "Emergência", value: viewEmployee.emergencyContact },
              ].map(f => f.value ? (
                <div key={f.label}>
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="font-medium">{f.value}</p>
                </div>
              ) : null)}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
