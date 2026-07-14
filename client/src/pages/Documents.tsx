import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FolderOpen, Plus, Edit, Trash2, Search, Download, Upload, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const docTypes = ["PGR","PCMSO","LTCAT","PPP","ASO","CAT","Laudo","Certificado","Procedimento","Outro"] as const;
type DocType = typeof docTypes[number];

const typeColors: Record<string, string> = {
  "PGR": "border-blue-200 text-blue-700", "PCMSO": "border-purple-200 text-purple-700",
  "LTCAT": "border-orange-200 text-orange-700", "PPP": "border-teal-200 text-teal-700",
  "ASO": "border-green-200 text-green-700", "CAT": "border-red-200 text-red-700",
  "Laudo": "border-indigo-200 text-indigo-700", "Certificado": "border-emerald-200 text-emerald-700",
  "Procedimento": "border-gray-300 text-gray-700", "Outro": "border-gray-200 text-gray-600",
};

const emptyDoc = { title: "", type: "PGR" as DocType, revision: "Rev. 01", status: "Vigente" as "Vigente"|"Em Revisão"|"Obsoleto", author: "", description: "", validFrom: "", validUntil: "", unitId: undefined as number | undefined };

export default function Documents() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyDoc });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: docs = [], isLoading } = trpc.documents.list.useQuery({});
  const { data: units = [] } = trpc.units.list.useQuery();

  const createMutation = trpc.documents.create.useMutation({
    onSuccess: () => { utils.documents.list.invalidate(); toast.success("Documento cadastrado!"); setShowForm(false); setForm({ ...emptyDoc }); setSelectedFile(null); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMutation = trpc.documents.update.useMutation({
    onSuccess: () => { utils.documents.list.invalidate(); toast.success("Documento atualizado!"); setShowForm(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => { utils.documents.list.invalidate(); toast.success("Documento removido!"); },
    onError: (e: any) => toast.error(e.message),
  });
  const uploadMutation = trpc.documents.upload.useMutation({
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = docs.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo 10MB."); return; }
      setSelectedFile(file);
      if (!form.title) setForm(f => ({ ...f, title: file.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  const handleSubmit = async () => {
    if (!form.title) return toast.error("Título é obrigatório");
    setUploading(true);
    try {
      let fileData: { fileKey?: string; fileUrl?: string; fileName?: string; fileSize?: number; mimeType?: string } = {};
      if (selectedFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        const uploaded = await uploadMutation.mutateAsync({ fileName: selectedFile.name, mimeType: selectedFile.type, base64 });
        fileData = { fileKey: uploaded.key, fileUrl: uploaded.url, fileName: selectedFile.name, fileSize: selectedFile.size, mimeType: selectedFile.type };
      }
      const payload = { ...form, ...fileData, validFrom: form.validFrom || undefined, validUntil: form.validUntil || undefined, unitId: form.unitId ? Number(form.unitId) : undefined };
      if (editingId) updateMutation.mutate({ id: editingId, data: payload });
      else createMutation.mutate(payload);
    } finally { setUploading(false); }
  };

  const openEdit = (d: any) => {
    setForm({ ...emptyDoc, title: d.title, type: d.type, revision: d.revision || "Rev. 01", status: d.status || "Vigente", author: d.author || "", description: d.description || "", validFrom: d.validFrom ? String(d.validFrom).split("T")[0] : "", validUntil: d.validUntil ? String(d.validUntil).split("T")[0] : "", unitId: d.unitId ?? undefined });
    setEditingId(d.id); setShowForm(true);
  };

  const typeCounts = docTypes.reduce((acc: Record<string, number>, t) => { acc[t] = docs.filter(d => d.type === t).length; return acc; }, {});

  const expiringSoon = docs.filter(d => {
    if (!d.validUntil) return false;
    const days = Math.ceil((new Date(d.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 90;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Documentos e Laudos</h1>
          <p className="text-sm text-muted-foreground">PGR, PCMSO, LTCAT, PPP, laudos, ASOs e certificados com controle de revisões</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyDoc }); setEditingId(null); setSelectedFile(null); setShowForm(true); }} size="sm">
          <Plus size={14} className="mr-1.5" /> Novo Documento
        </Button>
      </div>

      {expiringSoon.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{expiringSoon.length} documento(s) vencem nos próximos 90 dias</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {expiringSoon.map(d => <Badge key={d.id} variant="outline" className="text-[10px] border-amber-200 text-amber-700">{d.title}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Type Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTypeFilter("all")} className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-all", typeFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}>
          Todos ({docs.length})
        </button>
        {docTypes.filter(t => typeCounts[t] > 0).map(t => (
          <button key={t} onClick={() => setTypeFilter(typeFilter === t ? "all" : t)} className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-all", typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}>
            {t} ({typeCounts[t]})
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar documento..." className="pl-8 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-24 bg-muted rounded animate-pulse" /></CardContent></Card>)
        : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum documento encontrado</p>
            <Button variant="link" size="sm" onClick={() => { setForm({ ...emptyDoc }); setEditingId(null); setShowForm(true); }}>Enviar o primeiro documento</Button>
          </div>
        ) : filtered.map(doc => {
          const isExpired = doc.validUntil && new Date(doc.validUntil) < new Date();
          const isExpiring = doc.validUntil && !isExpired && Math.ceil((new Date(doc.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 90;
          return (
            <Card key={doc.id} className={cn("transition-all hover:shadow-md group", isExpired && "border-red-200", isExpiring && "border-amber-200")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px]", typeColors[doc.type] || "")}>{doc.type}</Badge>
                      {doc.revision && <span className="text-[10px] text-muted-foreground">{doc.revision}</span>}
                      <Badge variant="outline" className={cn("text-[10px]", doc.status === "Vigente" ? "border-emerald-200 text-emerald-700" : doc.status === "Em Revisão" ? "border-amber-200 text-amber-700" : "border-gray-200 text-gray-600")}>{doc.status}</Badge>
                    </div>
                  </div>
                </div>
                {doc.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{doc.description}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div>
                    {doc.validUntil && (
                      <p className={cn("text-[10px]", isExpired ? "text-red-600 font-semibold" : isExpiring ? "text-amber-600 font-semibold" : "text-muted-foreground")}>
                        {isExpired ? "⚠ Vencido: " : "Vence: "}{new Date(doc.validUntil).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {doc.author && <p className="text-[10px] text-muted-foreground">{doc.author}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.fileUrl && <Button variant="ghost" size="icon" className="h-7 w-7" asChild><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Download size={13} /></a></Button>}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(doc)}><Edit size={13} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Remover documento?")) deleteMutation.mutate({ id: doc.id }); }}><Trash2 size={13} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Documento" : "Novo Documento"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!editingId && (
              <div>
                <Label className="text-xs">Arquivo (opcional)</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => fileRef.current?.click()}>
                  {selectedFile ? (
                    <div className="flex items-center gap-2 justify-center text-sm">
                      <FileText size={14} className="text-primary" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-muted-foreground text-xs">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Clique para selecionar o arquivo</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PDF, DOC, DOCX, XLS, XLSX — máx. 10MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" onChange={handleFileChange} />
              </div>
            )}
            <div><Label className="text-xs">Título *</Label><Input className="h-9 text-sm mt-1" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Tipo *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as DocType }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{docTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Revisão</Label><Input className="h-9 text-sm mt-1" placeholder="Rev. 01" value={form.revision} onChange={e => setForm(f => ({ ...f, revision: e.target.value }))} /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vigente">Vigente</SelectItem>
                    <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                    <SelectItem value="Obsoleto">Obsoleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Unidade</Label>
                <Select value={String(form.unitId || "")} onValueChange={v => setForm(f => ({ ...f, unitId: v ? Number(v) : undefined }))}>
                  <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Geral" /></SelectTrigger>
                  <SelectContent>{units.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Válido de</Label><Input type="date" className="h-9 text-sm mt-1" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} /></div>
              <div><Label className="text-xs">Válido até</Label><Input type="date" className="h-9 text-sm mt-1" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Responsável / Autor</Label><Input className="h-9 text-sm mt-1" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} /></div>
            <div><Label className="text-xs">Descrição</Label><textarea className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || uploading}>
              {uploading ? "Enviando..." : editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
