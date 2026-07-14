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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { HardHat, Plus, Edit, Trash2, AlertTriangle, Package, ArrowDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyEpi = {
  name: "", ca: "", caExpiration: "", manufacturer: "", type: "",
  stock: 0, minStock: 0, unitCost: 0, unit: "un", location: "", notes: "",
};

const emptyDelivery = {
  employeeId: 0, epiId: 0, quantity: 1, deliveryDate: "", returnDate: "", reason: "", notes: "",
};

export default function EPI() {
  const [showEpiForm, setShowEpiForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [epiForm, setEpiForm] = useState({ ...emptyEpi });
  const [deliveryForm, setDeliveryForm] = useState({ ...emptyDelivery });
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: epis = [], isLoading } = trpc.epi.list.useQuery();
  const { data: lowStock = [] } = trpc.epi.lowStock.useQuery();
  const { data: deliveries = [] } = trpc.epi.deliveries.list.useQuery({});
  const { data: employees = [] } = trpc.employees.list.useQuery({});

  const createEpi = trpc.epi.create.useMutation({ onSuccess: () => { utils.epi.list.invalidate(); utils.epi.lowStock.invalidate(); toast.success("EPI cadastrado!"); setShowEpiForm(false); setEpiForm({ ...emptyEpi }); }, onError: e => toast.error(e.message) });
  const updateEpi = trpc.epi.update.useMutation({ onSuccess: () => { utils.epi.list.invalidate(); utils.epi.lowStock.invalidate(); toast.success("EPI atualizado!"); setShowEpiForm(false); }, onError: e => toast.error(e.message) });
  const deleteEpi = trpc.epi.delete.useMutation({ onSuccess: () => { utils.epi.list.invalidate(); toast.success("EPI removido!"); }, onError: e => toast.error(e.message) });
  const createDelivery = trpc.epi.deliveries.create.useMutation({ onSuccess: () => { utils.epi.deliveries.list.invalidate(); utils.epi.list.invalidate(); utils.epi.lowStock.invalidate(); toast.success("Entrega registrada!"); setShowDeliveryForm(false); setDeliveryForm({ ...emptyDelivery }); }, onError: e => toast.error(e.message) });

  const filtered = epis.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.ca || "").includes(search));

  const handleEpiSubmit = () => {
    if (!epiForm.name) return toast.error("Nome é obrigatório");
    const payload = { ...epiForm, stock: Number(epiForm.stock), minStock: Number(epiForm.minStock), unitCost: Number(epiForm.unitCost), caExpiration: epiForm.caExpiration || undefined };
    if (editingId) updateEpi.mutate({ id: editingId, data: payload });
    else createEpi.mutate(payload as any);
  };

  const handleDeliverySubmit = () => {
    if (!deliveryForm.employeeId || !deliveryForm.epiId || !deliveryForm.deliveryDate) return toast.error("Funcionário, EPI e data são obrigatórios");
    createDelivery.mutate({ ...deliveryForm, employeeId: Number(deliveryForm.employeeId), epiId: Number(deliveryForm.epiId), quantity: Number(deliveryForm.quantity) } as any);
  };

  const openEdit = (epi: any) => {
    setEpiForm({ ...emptyEpi, ...epi, caExpiration: epi.caExpiration ? String(epi.caExpiration).split("T")[0] : "" });
    setEditingId(epi.id); setShowEpiForm(true);
  };

  const getStockStatus = (stock: number, min: number) => {
    if (stock === 0) return { label: "Sem Estoque", cls: "bg-red-50 text-red-700 border-red-200" };
    if (stock <= min) return { label: "Crítico", cls: "bg-red-50 text-red-700 border-red-200" };
    if (stock <= min * 1.5) return { label: "Baixo", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Normal", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">EPIs — Equipamentos de Proteção Individual</h1>
          <p className="text-sm text-muted-foreground">NR-06 • Controle de estoque, CA e ficha de entrega</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setDeliveryForm({ ...emptyDelivery }); setShowDeliveryForm(true); }}>
            <ArrowDown size={14} className="mr-1.5" /> Registrar Entrega
          </Button>
          <Button size="sm" onClick={() => { setEpiForm({ ...emptyEpi }); setEditingId(null); setShowEpiForm(true); }}>
            <Plus size={14} className="mr-1.5" /> Novo EPI
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{epis.length}</p><p className="text-xs text-muted-foreground">Tipos de EPI</p></CardContent></Card>
        <Card className="border-red-200 bg-red-50/30"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-700">{lowStock.length}</p><p className="text-xs text-red-600">Abaixo do Mínimo</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{deliveries.length}</p><p className="text-xs text-muted-foreground">Entregas Registradas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{epis.reduce((acc, e) => acc + e.stock, 0)}</p><p className="text-xs text-muted-foreground">Itens em Estoque</p></CardContent></Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">{lowStock.length} EPI(s) abaixo do estoque mínimo</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {lowStock.map(e => <Badge key={e.id} variant="outline" className="text-[10px] border-red-200 text-red-700">{e.name} ({e.stock}/{e.minStock})</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock" className="text-xs">Estoque ({epis.length})</TabsTrigger>
          <TabsTrigger value="deliveries" className="text-xs">Fichas de Entrega ({deliveries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CA..." className="pl-8 h-9 text-sm max-w-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-24 bg-muted rounded animate-pulse" /></CardContent></Card>)
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <HardHat size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum EPI cadastrado</p>
              </div>
            ) : filtered.map(epi => {
              const status = getStockStatus(epi.stock, epi.minStock);
              const pct = epi.minStock > 0 ? Math.min(100, (epi.stock / (epi.minStock * 2)) * 100) : 100;
              return (
                <Card key={epi.id} className={cn("transition-all", epi.stock <= epi.minStock && "border-red-200")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{epi.name}</p>
                        <p className="text-[10px] text-muted-foreground">{epi.manufacturer || "—"} {epi.ca ? `• CA: ${epi.ca}` : ""}</p>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(epi)}><Edit size={11} /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { if (confirm("Remover EPI?")) deleteEpi.mutate({ id: epi.id }); }}><Trash2 size={11} /></Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Estoque</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{epi.stock} {epi.unit}</span>
                          <Badge variant="outline" className={cn("text-[10px]", status.cls)}>{status.label}</Badge>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Mín: {epi.minStock} {epi.unit}</span>
                        {epi.caExpiration && <span>CA vence: {new Date(epi.caExpiration).toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                    {epi.location && <p className="text-[10px] text-muted-foreground mt-2">📍 {epi.location}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3">Funcionário</th>
                      <th className="text-left px-4 py-3">EPI</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Qtd</th>
                      <th className="text-left px-4 py-3">Data Entrega</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        <Package size={32} className="mx-auto mb-2 opacity-30" />
                        Nenhuma entrega registrada
                      </td></tr>
                    ) : deliveries.map(d => (
                      <tr key={d.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{employees.find(e => e.id === d.employeeId)?.name || "—"}</td>
                        <td className="px-4 py-3 text-sm">{epis.find(e => e.id === d.epiId)?.name || "—"}</td>
                        <td className="px-4 py-3 text-sm hidden md:table-cell">{d.quantity}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString("pt-BR") : "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{d.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EPI Form */}
      <Dialog open={showEpiForm} onOpenChange={setShowEpiForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar EPI" : "Novo EPI"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Nome do EPI *</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ex: Capacete de segurança" value={epiForm.name} onChange={e => setEpiForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Número do CA</Label>
              <Input className="h-9 text-sm mt-1" value={epiForm.ca} onChange={e => setEpiForm(f => ({ ...f, ca: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Vencimento do CA</Label>
              <Input type="date" className="h-9 text-sm mt-1" value={epiForm.caExpiration} onChange={e => setEpiForm(f => ({ ...f, caExpiration: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Fabricante</Label>
              <Input className="h-9 text-sm mt-1" value={epiForm.manufacturer} onChange={e => setEpiForm(f => ({ ...f, manufacturer: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ex: Proteção da cabeça" value={epiForm.type} onChange={e => setEpiForm(f => ({ ...f, type: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Estoque Atual</Label>
              <Input type="number" className="h-9 text-sm mt-1" value={epiForm.stock} onChange={e => setEpiForm(f => ({ ...f, stock: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Estoque Mínimo</Label>
              <Input type="number" className="h-9 text-sm mt-1" value={epiForm.minStock} onChange={e => setEpiForm(f => ({ ...f, minStock: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Custo Unitário (R$)</Label>
              <Input type="number" className="h-9 text-sm mt-1" value={epiForm.unitCost} onChange={e => setEpiForm(f => ({ ...f, unitCost: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Unidade</Label>
              <Input className="h-9 text-sm mt-1" placeholder="un, par, cx..." value={epiForm.unit} onChange={e => setEpiForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Localização</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ex: Almoxarifado A - Prateleira 3" value={epiForm.location} onChange={e => setEpiForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowEpiForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleEpiSubmit} disabled={createEpi.isPending || updateEpi.isPending}>
              {editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Form */}
      <Dialog open={showDeliveryForm} onOpenChange={setShowDeliveryForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Entrega de EPI</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Funcionário *</Label>
              <Select value={String(deliveryForm.employeeId || "")} onValueChange={v => setDeliveryForm(f => ({ ...f, employeeId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">EPI *</Label>
              <Select value={String(deliveryForm.epiId || "")} onValueChange={v => setDeliveryForm(f => ({ ...f, epiId: Number(v) }))}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{epis.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name} (Estoque: {e.stock})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Quantidade *</Label>
                <Input type="number" min="1" className="h-9 text-sm mt-1" value={deliveryForm.quantity} onChange={e => setDeliveryForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs">Data da Entrega *</Label>
                <Input type="date" className="h-9 text-sm mt-1" value={deliveryForm.deliveryDate} onChange={e => setDeliveryForm(f => ({ ...f, deliveryDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Motivo</Label>
              <Input className="h-9 text-sm mt-1" placeholder="Ex: Uso diário, substituição..." value={deliveryForm.reason} onChange={e => setDeliveryForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeliveryForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleDeliverySubmit} disabled={createDelivery.isPending}>Registrar Entrega</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
