/**
 * SST Documents Management Page
 * Displays and manages all SST documents (PGR, PCMSO, LTCAT, etc.)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Eye, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

const DOCUMENT_TYPES = [
  { value: "PGR", label: "PGR", description: "Programa de Gestão de Riscos" },
  { value: "PCMSO", label: "PCMSO", description: "Programa de Controle Médico e Saúde Ocupacional" },
  { value: "LTCAT", label: "LTCAT", description: "Laudo Técnico de Condições Ambientais" },
  { value: "LTIP", label: "LTIP", description: "Laudo de Insalubridade e Periculosidade" },
  { value: "Ordem de Serviço", label: "Ordem de Serviço", description: "Ordem de Serviço" },
  { value: "Permissão de Trabalho", label: "Permissão de Trabalho", description: "Permissão de Trabalho" },
  { value: "APR", label: "APR", description: "Análise Preliminar de Risco" },
  { value: "ASO", label: "ASO", description: "Atestado de Saúde Ocupacional" },
  { value: "Ficha de Controle de EPI", label: "Ficha de Controle de EPI", description: "Ficha de Controle de EPI" },
  { value: "Avaliação Ergonômica Preliminar", label: "Avaliação Ergonômica", description: "Avaliação Ergonômica Preliminar" },
];

const STATUS_COLORS: Record<string, string> = {
  "Rascunho": "bg-gray-100 text-gray-800",
  "Aguardando Aprovação": "bg-yellow-100 text-yellow-800",
  "Aprovado": "bg-green-100 text-green-800",
  "Vigente": "bg-blue-100 text-blue-800",
  "Expirado": "bg-red-100 text-red-800",
  "Cancelado": "bg-slate-100 text-slate-800",
};

interface SstDocumentsPageProps {
  defaultType?: string;
}

export function SstDocumentsPage({ defaultType }: SstDocumentsPageProps = {}) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(defaultType || null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Get units
  const { data: units = [] } = trpc.units.list.useQuery();

  // Get documents
  const { data: documents = [], isLoading: docsLoading, refetch: refetchDocs } = trpc.sstDocuments.list.useQuery(
    {
      unitId: selectedUnit || 0,
      type: selectedType || undefined,
    },
    {
      enabled: !!selectedUnit,
    }
  );

  // Get pending approvals
  const { data: pendingApprovals = [] } = trpc.sstDocuments.getPendingApprovals.useQuery();

  // Delete mutation
  const deleteMutation = trpc.sstDocuments.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento deletado com sucesso");
      refetchDocs();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar documento");
    },
  });

  const handleSelectUnit = (unitId: number) => {
    setSelectedUnit(unitId);
    setSelectedType(null);
  };

  const handleDelete = (documentId: number) => {
    if (confirm("Tem certeza que deseja deletar este documento?")) {
      deleteMutation.mutate({ documentId });
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Faça login para acessar documentos</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos de SST</h1>
          <p className="text-gray-600 mt-2">Gerencie todos os documentos de Segurança e Saúde do Trabalho</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => window.location.href = '/app/sst-documents/generator'}>
            <Plus className="w-4 h-4" />
            Gerar com Avaliações
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Documento
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Documento</DialogTitle>
              <DialogDescription>Selecione o tipo de documento que deseja criar</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {DOCUMENT_TYPES.map((type) => (
                <Card
                  key={type.value}
                  className="cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => {
                    // Navigate to document creation page
                    window.location.href = `/app/sst-documents/create?type=${encodeURIComponent(type.value)}`;
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{type.label}</CardTitle>
                    <CardDescription className="text-sm">{type.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Unit Selection */}
      {!selectedUnit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit: any) => (
            <Card
              key={unit.id}
              className="cursor-pointer hover:shadow-lg transition"
              onClick={() => handleSelectUnit(unit.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{unit.name}</CardTitle>
                <CardDescription>{unit.cnpj}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Acessar Documentos
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => {
              setSelectedUnit(null);
              setSelectedType(null);
            }}
          >
            ← Voltar para Unidades
          </Button>

          {/* Tabs for Document Types */}
          <Tabs value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? null : value)}>
            <TabsList className="grid grid-cols-6 lg:grid-cols-11 w-full">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {DOCUMENT_TYPES.map((type) => (
                <TabsTrigger key={type.value} value={type.value} className="text-xs">
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedType || "all"} className="space-y-4">
              {/* Pending Approvals Section */}
              {pendingApprovals.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-orange-900">Aprovações Pendentes</CardTitle>
                    <CardDescription>Você tem {pendingApprovals.length} documento(s) aguardando sua aprovação</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pendingApprovals.map((approval: any) => (
                        <div key={approval.id} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div>
                            <p className="font-medium">Documento #{approval.documentId}</p>
                            <p className="text-sm text-gray-600">{approval.approverRole}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="default">
                              <Check className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button size="sm" variant="destructive">
                              <X className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents List */}
              {docsLoading ? (
                <div className="text-center py-8">Carregando documentos...</div>
              ) : documents.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600">Nenhum documento encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <Card key={doc.id} className="hover:shadow-md transition">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-lg">{doc.title}</h3>
                              <Badge className={STATUS_COLORS[doc.status] || "bg-gray-100"}>
                                {doc.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Tipo: {doc.type}</span>
                              <span>Rev. {doc.revision}</span>
                              <span>Autor: {doc.author}</span>
                              {doc.validUntil && (
                                <span>Válido até: {new Date(doc.validUntil).toLocaleDateString("pt-BR")}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(doc.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
