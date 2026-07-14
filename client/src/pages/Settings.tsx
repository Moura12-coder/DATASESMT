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
import { Settings as SettingsIcon, Building2, Plus, Edit, Trash2, Users, MapPin } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const emptyUnit = { name: "", cnpj: "", address: "", city: "", state: "", phone: "", cnae: "", grauRisco: "1" as const };
const emptySector = { name: "", unitId: 0, description: "", responsible: "" };

export default function Settings() {
  const { user } = useAuth();
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showSectorForm, setShowSectorForm] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editingSectorId, setEditingSectorId] = useState<number | null>(null);
  const [unitForm, setUnitForm] = useState({ ...emptyUnit });
  const [sectorForm, setSectorForm] = useState({ ...emptySector });

  const utils = trpc.useUtils();
  const { data: units = [] } = trpc.units.list.useQuery();
  const { data: sectors = [] } = trpc.sectors.list.useQuery({});

  const createUnit = trpc.units.create.useMutation({ onSuccess: () => { utils.units.list.invalidate(); toast.success("Unidade criada!"); setShowUnitForm(false); setUnitForm({ ...emptyUnit }); }, onError: e => toast.error(e.message) });
  const updateUnit = trpc.units.update.useMutation({ onSuccess: () => { utils.units.list.invalidate(); toast.success("Unidade atualizada!"); setShowUnitForm(false); }, onError: e => toast.error(e.message) });
  const deleteUnit = trpc.units.delete.useMutation({ onSuccess: () => { utils.units.list.invalidate(); toast.success("Unidade removida!"); }, onError: e => toast.error(e.message) });
  const createSector = trpc.sectors.create.useMutation({ onSuccess: () => { utils.sectors.list.invalidate(); toast.success("Setor criado!"); setShowSectorForm(false); setSectorForm({ ...emptySector }); }, onError: e => toast.error(e.message) });
  const updateSector = trpc.sectors.update.useMutation({ onSuccess: () => { utils.sectors.list.invalidate(); toast.success("Setor atualizado!"); setShowSectorForm(false); }, onError: e => toast.error(e.message) });
  const deleteSector = trpc.sectors.delete.useMutation({ onSuccess: () => { utils.sectors.list.invalidate(); toast.success("Setor removido!"); }, onError: e => toast.error(e.message) });

  const openEditUnit = (u: any) => { setUnitForm({ ...emptyUnit, ...u }); setEditingUnitId(u.id); setShowUnitForm(true); };
  const openEditSector = (s: any) => { setSectorForm({ ...emptySector, ...s }); setEditingSectorId(s.id); setShowSectorForm(true); };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon size={20} /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie unidades, setores e configurações do sistema</p>
      </div>

      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units" className="text-xs gap-1.5"><Building2 size={13} /> Unidades ({units.length})</TabsTrigger>
          <TabsTrigger value="sectors" className="text-xs gap-1.5"><MapPin size={13} /> Setores ({sectors.length})</TabsTrigger>
          <TabsTrigger value="profile" className="text-xs gap-1.5"><Users size={13} /> Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="units" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setUnitForm({ ...emptyUnit }); setEditingUnitId(null); setShowUnitForm(true); }}>
              <Plus size={14} className="mr-1.5" /> Nova Unidade
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma unidade cadastrada</p>
              </div>
            ) : units.map(u => (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{u.name}</p>
                        {u.cnpj && <p className="text-[10px] text-muted-foreground">{u.cnpj}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditUnit(u)}><Edit size={11} /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { if (confirm("Remover unidade?")) deleteUnit.mutate({ id: u.id }); }}><Trash2 size={11} /></Button>
                    </div>
                  </div>
                  {u.city && <p className="text-xs text-muted-foreground">{u.city}{u.state ? `, ${u.state}` : ""}</p>}

                  {u.cnae && <Badge variant="outline" className="text-[10px] mt-2">CNAE: {u.cnae}</Badge>}
                  {u.grauRisco && <Badge variant="outline" className="text-[10px] mt-1 ml-1">Grau de Risco: {u.grauRisco}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sectors" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setSectorForm({ ...emptySector }); setEditingSectorId(null); setShowSectorForm(true); }}>
              <Plus size={14} className="mr-1.5" /> Novo Setor
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full data-table">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3">Setor</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Unidade</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Responsável</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                      Nenhum setor cadastrado
                    </td></tr>
                  ) : sectors.map(s => (
                    <tr key={s.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        {s.description && <p className="text-[10px] text-muted-foreground">{s.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{units.find(u => u.id === s.unitId)?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{s.responsible || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSector(s)}><Edit size={13} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover setor?")) deleteSector.mutate({ id: s.id }); }}><Trash2 size={13} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{user?.name || "Usuário"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{user?.role === "admin" ? "Administrador" : "Usuário"}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">ID do Sistema</p><p className="font-medium">{user?.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Método de Login</p><p className="font-medium capitalize">{user?.loginMethod || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Membro desde</p><p className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Último acesso</p><p className="font-medium">{user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString("pt-BR") : "—"}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unit Form */}
      <Dialog open={showUnitForm} onOpenChange={setShowUnitForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingUnitId ? "Editar Unidade" : "Nova Unidade"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Nome da Unidade *</Label>
              <Input className="h-9 text-sm mt-1" value={unitForm.name} onChange={e => setUnitForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">CNPJ</Label>
              <Input className="h-9 text-sm mt-1" placeholder="00.000.000/0001-00" value={unitForm.cnpj} onChange={e => setUnitForm(f => ({ ...f, cnpj: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">CNAE</Label>
              <Input className="h-9 text-sm mt-1" placeholder="0000-0/00" value={unitForm.cnae} onChange={e => setUnitForm(f => ({ ...f, cnae: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Grau de Risco</Label>
              <Select value={unitForm.grauRisco} onValueChange={v => setUnitForm(f => ({ ...f, grauRisco: v as any }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Grau 1</SelectItem>
                  <SelectItem value="2">Grau 2</SelectItem>
                  <SelectItem value="3">Grau 3</SelectItem>
                  <SelectItem value="4">Grau 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="text-xs">Endereço</Label>
              <Input className="h-9 text-sm mt-1" value={unitForm.address} onChange={e => setUnitForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Cidade</Label>
              <Input className="h-9 text-sm mt-1" value={unitForm.city} onChange={e => setUnitForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Estado</Label>
              <Input className="h-9 text-sm mt-1" placeholder="SP" maxLength={2} value={unitForm.state} onChange={e => setUnitForm(f => ({ ...f, state: e.target.value.toUpperCase() }))} />
            </div>

            <div>
              <Label className="text-xs">Telefone</Label>
              <Input className="h-9 text-sm mt-1" value={unitForm.phone} onChange={e => setUnitForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowUnitForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              if (!unitForm.name) return toast.error("Nome é obrigatório");
              if (editingUnitId) updateUnit.mutate({ id: editingUnitId, data: unitForm });
              else createUnit.mutate(unitForm as any);
            }} disabled={createUnit.isPending || updateUnit.isPending}>
              {editingUnitId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sector Form */}
      <Dialog open={showSectorForm} onOpenChange={setShowSectorForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingSectorId ? "Editar Setor" : "Novo Setor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome do Setor *</Label>
              <Input className="h-9 text-sm mt-1" value={sectorForm.name} onChange={e => setSectorForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Unidade *</Label>
              <Select value={String(sectorForm.unitId || "")} onValueChange={v => setSectorForm(f => ({ ...f, unitId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input className="h-9 text-sm mt-1" value={sectorForm.responsible} onChange={e => setSectorForm(f => ({ ...f, responsible: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={sectorForm.description} onChange={e => setSectorForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSectorForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              if (!sectorForm.name || !sectorForm.unitId) return toast.error("Nome e unidade são obrigatórios");
              if (editingSectorId) updateSector.mutate({ id: editingSectorId, data: { ...sectorForm, unitId: Number(sectorForm.unitId) } });
              else createSector.mutate({ ...sectorForm, unitId: Number(sectorForm.unitId) } as any);
            }} disabled={createSector.isPending || updateSector.isPending}>
              {editingSectorId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
