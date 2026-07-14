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
import { Users, Plus, Edit, Trash2, Calendar, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyMember = { employeeId: 0, unitId: 0, role: "Membro Efetivo" as const, origin: "Eleito" as const, mandateStart: "", mandateEnd: "", status: "Ativo" as const };
const emptyMeeting = { unitId: 0, date: "", type: "Ordinária" as const, agenda: "", minutes: "", status: "Agendada" as const };

export default function CIPA() {
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingMeetingId, setEditingMeetingId] = useState<number | null>(null);
  const [memberForm, setMemberForm] = useState({ ...emptyMember });
  const [meetingForm, setMeetingForm] = useState({ ...emptyMeeting });

  const utils = trpc.useUtils();
  const { data: members = [], isLoading: loadingMembers } = trpc.cipa.members.list.useQuery({});
  const { data: meetings = [], isLoading: loadingMeetings } = trpc.cipa.meetings.list.useQuery({});
  const { data: employees = [] } = trpc.employees.list.useQuery({});
  const { data: units = [] } = trpc.units.list.useQuery();

  const createMember = trpc.cipa.members.create.useMutation({
    onSuccess: () => { utils.cipa.members.list.invalidate(); toast.success("Membro CIPA cadastrado!"); setShowMemberForm(false); setMemberForm({ ...emptyMember }); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMember = trpc.cipa.members.update.useMutation({
    onSuccess: () => { utils.cipa.members.list.invalidate(); toast.success("Membro atualizado!"); setShowMemberForm(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMember = trpc.cipa.members.delete.useMutation({
    onSuccess: () => { utils.cipa.members.list.invalidate(); toast.success("Membro removido!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const createMeeting = trpc.cipa.meetings.create.useMutation({
    onSuccess: () => { utils.cipa.meetings.list.invalidate(); toast.success("Reunião registrada!"); setShowMeetingForm(false); setMeetingForm({ ...emptyMeeting }); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMeeting = trpc.cipa.meetings.update.useMutation({
    onSuccess: () => { utils.cipa.meetings.list.invalidate(); toast.success("Reunião atualizada!"); setShowMeetingForm(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const getEmployeeName = (id?: number | null) => id ? (employees.find(e => e.id === id)?.name || "—") : "—";

  const openEditMember = (m: any) => {
    setMemberForm({ ...emptyMember, ...m, mandateStart: m.mandateStart ? String(m.mandateStart).split("T")[0] : "", mandateEnd: m.mandateEnd ? String(m.mandateEnd).split("T")[0] : "" });
    setEditingMemberId(m.id); setShowMemberForm(true);
  };
  const openEditMeeting = (m: any) => {
    setMeetingForm({ ...emptyMeeting, ...m, date: m.date ? String(m.date).split("T")[0] : "" });
    setEditingMeetingId(m.id); setShowMeetingForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Shield size={20} className="text-primary" /> CIPA — NR-05</h1>
        <p className="text-sm text-muted-foreground">Comissão Interna de Prevenção de Acidentes — membros, reuniões e atas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{members.length}</p><p className="text-xs text-muted-foreground">Membros</p></CardContent></Card>
        <Card className="border-emerald-200 bg-emerald-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-700">{members.filter((m: any) => m.status === "Ativo").length}</p><p className="text-xs text-emerald-600">Ativos</p></CardContent></Card>
        <Card className="border-blue-200 bg-blue-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-700">{meetings.length}</p><p className="text-xs text-blue-600">Reuniões</p></CardContent></Card>
        <Card className="border-purple-200 bg-purple-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-700">{meetings.filter((m: any) => m.status === "Realizada").length}</p><p className="text-xs text-purple-600">Realizadas</p></CardContent></Card>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members" className="text-xs gap-1.5"><Users size={13} /> Membros ({members.length})</TabsTrigger>
          <TabsTrigger value="meetings" className="text-xs gap-1.5"><Calendar size={13} /> Reuniões ({meetings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setMemberForm({ ...emptyMember }); setEditingMemberId(null); setShowMemberForm(true); }}>
              <Plus size={14} className="mr-1.5" /> Adicionar Membro
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Funcionário</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Cargo CIPA</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Origem</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Mandato</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingMembers ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b"><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  )) : members.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />Nenhum membro cadastrado
                    </td></tr>
                  ) : members.map((m: any) => (
                    <tr key={m.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{getEmployeeName(m.employeeId)}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{m.role}</Badge></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{m.origin || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {m.mandateStart ? new Date(m.mandateStart).toLocaleDateString("pt-BR") : "—"}
                        {m.mandateEnd ? ` → ${new Date(m.mandateEnd).toLocaleDateString("pt-BR")}` : ""}
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className={cn("text-[10px]", m.status === "Ativo" ? "border-emerald-200 text-emerald-700" : "border-gray-200 text-gray-600")}>{m.status}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMember(m)}><Edit size={13} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Remover membro?")) deleteMember.mutate({ id: m.id }); }}><Trash2 size={13} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setMeetingForm({ ...emptyMeeting }); setEditingMeetingId(null); setShowMeetingForm(true); }}>
              <Plus size={14} className="mr-1.5" /> Registrar Reunião
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingMeetings ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><div className="h-20 bg-muted rounded animate-pulse" /></CardContent></Card>
            )) : meetings.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma reunião registrada</p>
              </div>
            ) : meetings.map((m: any) => (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                        <Badge variant="outline" className={cn("text-[10px]", m.status === "Realizada" ? "border-emerald-200 text-emerald-700" : m.status === "Agendada" ? "border-blue-200 text-blue-700" : "border-gray-200 text-gray-600")}>{m.status}</Badge>
                      </div>
                      <p className="text-sm font-semibold mt-1">{m.date ? new Date(m.date).toLocaleDateString("pt-BR") : "—"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMeeting(m)}><Edit size={13} /></Button>
                    </div>
                  </div>
                  {m.agenda && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Pauta: {m.agenda}</p>}
                  {m.minutes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Ata: {m.minutes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Member Form */}
      <Dialog open={showMemberForm} onOpenChange={setShowMemberForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingMemberId ? "Editar Membro" : "Adicionar Membro CIPA"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Funcionário *</Label>
              <Select value={String(memberForm.employeeId || "")} onValueChange={v => setMemberForm(f => ({ ...f, employeeId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Unidade *</Label>
              <Select value={String(memberForm.unitId || "")} onValueChange={v => setMemberForm(f => ({ ...f, unitId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{units.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cargo na CIPA</Label>
              <Select value={memberForm.role} onValueChange={v => setMemberForm(f => ({ ...f, role: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Presidente","Vice-Presidente","Secretário","Membro Efetivo","Membro Suplente"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Origem</Label>
              <Select value={memberForm.origin} onValueChange={v => setMemberForm(f => ({ ...f, origin: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eleito">Eleito</SelectItem>
                  <SelectItem value="Indicado">Indicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={memberForm.status} onValueChange={v => setMemberForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Início do Mandato</Label>
              <Input type="date" className="h-9 text-sm mt-1" value={memberForm.mandateStart} onChange={e => setMemberForm(f => ({ ...f, mandateStart: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Fim do Mandato</Label>
              <Input type="date" className="h-9 text-sm mt-1" value={memberForm.mandateEnd} onChange={e => setMemberForm(f => ({ ...f, mandateEnd: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowMemberForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              if (!memberForm.unitId || !memberForm.employeeId) return toast.error("Unidade e funcionário são obrigatórios");
              const payload = { ...memberForm, unitId: Number(memberForm.unitId), employeeId: Number(memberForm.employeeId), mandateStart: memberForm.mandateStart || undefined, mandateEnd: memberForm.mandateEnd || undefined };
              if (editingMemberId) updateMember.mutate({ id: editingMemberId, data: payload });
              else createMember.mutate(payload);
            }} disabled={createMember.isPending || updateMember.isPending}>
              {editingMemberId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Form */}
      <Dialog open={showMeetingForm} onOpenChange={setShowMeetingForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingMeetingId ? "Editar Reunião" : "Registrar Reunião CIPA"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Unidade *</Label>
              <Select value={String(meetingForm.unitId || "")} onValueChange={v => setMeetingForm(f => ({ ...f, unitId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{units.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={meetingForm.type} onValueChange={v => setMeetingForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ordinária">Ordinária</SelectItem>
                  <SelectItem value="Extraordinária">Extraordinária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data *</Label>
              <Input type="date" className="h-9 text-sm mt-1" value={meetingForm.date} onChange={e => setMeetingForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={meetingForm.status} onValueChange={v => setMeetingForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agendada">Agendada</SelectItem>
                  <SelectItem value="Realizada">Realizada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Pauta</Label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} value={meetingForm.agenda} onChange={e => setMeetingForm(f => ({ ...f, agenda: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Ata / Deliberações</Label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} value={meetingForm.minutes} onChange={e => setMeetingForm(f => ({ ...f, minutes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowMeetingForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              if (!meetingForm.unitId || !meetingForm.date) return toast.error("Unidade e data são obrigatórios");
              const payload = { ...meetingForm, unitId: Number(meetingForm.unitId) };
              if (editingMeetingId) updateMeeting.mutate({ id: editingMeetingId, data: payload });
              else createMeeting.mutate(payload);
            }} disabled={createMeeting.isPending || updateMeeting.isPending}>
              {editingMeetingId ? "Salvar" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
