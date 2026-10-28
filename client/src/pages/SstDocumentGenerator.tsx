/**
 * SST Document Generator Page
 * Allows users to create SST documents by importing environmental assessments
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Plus, Trash2, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const DOCUMENT_TYPES = {
  PGR: { label: "PGR (NR-01)", description: "Programa de Gestão de Riscos" },
  PCMSO: {
    label: "PCMSO (NR-07)",
    description: "Programa de Controle Médico e Saúde Ocupacional",
  },
  LTCAT: {
    label: "LTCAT",
    description: "Laudo Técnico de Condições Ambientais",
  },
  LTIP: {
    label: "LTIP",
    description: "Laudo de Insalubridade e Periculosidade",
  },
};

interface SelectedAssessment {
  id: number;
  agentName: string;
  agentType: string;
  measurementValue: number;
  unit: string;
  status: string;
}

export function SstDocumentGeneratorPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"type" | "import" | "review" | "generate">(
    "type"
  );
  const [selectedDocType, setSelectedDocType] = useState<
    keyof typeof DOCUMENT_TYPES | null
  >(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [selectedAssessments, setSelectedAssessments] = useState<
    SelectedAssessment[]
  >([]);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");

  // Get units
  const { data: units = [] } = trpc.units.list.useQuery();

  // Get assessments for selected unit
  const { data: assessments = [], isLoading: assessmentsLoading } =
    trpc.assessmentIntegration.getAssessmentsByUnit.useQuery(
      { unitId: selectedUnit || 0 },
      { enabled: !!selectedUnit && step === "import" }
    );

  // Hooks run in a stable order; enable only the chosen document generator.
  const generate = { unitId: selectedUnit || 0 };
  const enabled = !!selectedUnit && step === "review";
  const pgrData = trpc.assessmentIntegration.generatePgrData.useQuery(
    generate,
    { enabled: enabled && selectedDocType === "PGR" }
  );
  const pcmsoData = trpc.assessmentIntegration.generatePcmsoData.useQuery(
    generate,
    { enabled: enabled && selectedDocType === "PCMSO" }
  );
  const ltcatData = trpc.assessmentIntegration.generateLtcatData.useQuery(
    generate,
    { enabled: enabled && selectedDocType === "LTCAT" }
  );
  const ltipData = trpc.assessmentIntegration.generateLtipData.useQuery(
    generate,
    { enabled: enabled && selectedDocType === "LTIP" }
  );
  const generatedData = {
    ...pgrData.data,
    ...pcmsoData.data,
    ...ltcatData.data,
    ...ltipData.data,
  };

  // Create document mutation
  const createDocMutation = trpc.sstDocuments.create.useMutation({
    onSuccess: data => {
      toast.success("Documento criado com sucesso!");
      // Link assessments to document
      selectedAssessments.forEach(assessment => {
        linkAssessmentMutation.mutate({
          documentId: data.documentId,
          assessmentId: assessment.id,
          linkType: "Fonte de Dados",
        });
      });
      navigate("/app/sst-documents");
    },
    onError: error => {
      toast.error(error.message || "Erro ao criar documento");
    },
  });

  // Link assessment mutation
  const linkAssessmentMutation =
    trpc.assessmentIntegration.linkAssessmentToDocument.useMutation({
      onSuccess: () => {
        // Silent success - handled by parent mutation
      },
      onError: error => {
        console.error("Error linking assessment:", error);
      },
    });

  const handleSelectAssessment = (assessment: any) => {
    const isSelected = selectedAssessments.some(a => a.id === assessment.id);
    if (isSelected) {
      setSelectedAssessments(
        selectedAssessments.filter(a => a.id !== assessment.id)
      );
    } else {
      setSelectedAssessments([...selectedAssessments, assessment]);
    }
  };

  const handleGenerateDocument = () => {
    if (!documentTitle.trim()) {
      toast.error("Por favor, defina um título para o documento");
      return;
    }

    if (!selectedDocType || !selectedUnit) {
      toast.error("Tipo de documento e unidade são obrigatórios");
      return;
    }

    createDocMutation.mutate({
      unitId: selectedUnit,
      type: selectedDocType,
      title: documentTitle,
      description: documentDescription,
      metadata: {
        linkedAssessments: selectedAssessments.length,
        generatedFrom: "Assessment Import",
      },
    });
  };

  if (!user) {
    return (
      <div className="p-8 text-center">Faça login para gerar documentos</div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gerador de Documentos de SST</h1>
        <p className="text-gray-600 mt-2">
          Crie documentos automaticamente importando avaliações ambientais
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {["type", "import", "review", "generate"].map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step === s
                  ? "bg-blue-600 text-white"
                  : ["type", "import", "review", "generate"].indexOf(step) > idx
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {idx + 1}
            </div>
            {idx < 3 && <div className="w-12 h-1 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Document Type */}
      {step === "type" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Selecione o tipo de documento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(DOCUMENT_TYPES).map(([key, value]) => (
              <Card
                key={key}
                className={`cursor-pointer transition ${
                  selectedDocType === key
                    ? "ring-2 ring-blue-600"
                    : "hover:shadow-md"
                }`}
                onClick={() => {
                  setSelectedDocType(key as keyof typeof DOCUMENT_TYPES);
                  setStep("import");
                }}
              >
                <CardHeader>
                  <CardTitle>{value.label}</CardTitle>
                  <CardDescription>{value.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Import Assessments */}
      {step === "import" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Importar Avaliações Ambientais
          </h2>

          {/* Unit Selection */}
          {!selectedUnit ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {units.map((unit: any) => (
                <Card
                  key={unit.id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() => setSelectedUnit(unit.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{unit.name}</CardTitle>
                    <CardDescription>{unit.cnpj}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Avaliações de:{" "}
                  {units.find((u: any) => u.id === selectedUnit)?.name}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUnit(null)}
                >
                  Trocar Unidade
                </Button>
              </div>

              {assessmentsLoading ? (
                <div className="text-center py-8">Carregando avaliações...</div>
              ) : assessments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma avaliação encontrada para esta unidade
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment: any) => (
                    <Card key={assessment.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={selectedAssessments.some(
                              a => a.id === assessment.id
                            )}
                            onCheckedChange={() =>
                              handleSelectAssessment(assessment)
                            }
                          />
                          <div className="flex-1">
                            <div className="font-semibold">
                              {assessment.agentName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {assessment.agentType} •{" "}
                              {assessment.measurementValue} {assessment.unit}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                className={
                                  assessment.status === "Conforme"
                                    ? "bg-green-100 text-green-800"
                                    : assessment.status === "Não Conforme"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {assessment.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(assessment.date).toLocaleDateString(
                                  "pt-BR"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setStep("type")}>
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep("review")}
                  disabled={selectedAssessments.length === 0}
                >
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review Generated Data */}
      {step === "review" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Revisar Dados Gerados</h2>

          {generatedData && (
            <div className="space-y-4">
              {selectedDocType === "PGR" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Inventário de Riscos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">
                        {generatedData.inventoryOfRisks}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Plano de Ação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">
                        {generatedData.actionPlan}
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}

              {selectedDocType === "PCMSO" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Fatores de Risco Identificados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        {generatedData.riskFactorsIdentified}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Exames Recomendados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        {generatedData.examsRequired?.map((exam: string) => (
                          <li key={exam}>• {exam}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}

              {selectedDocType === "LTCAT" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Atividades Especiais
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        {(generatedData.specialActivities?.length ?? 0) > 0 ? (
                          generatedData.specialActivities?.map(
                            (activity: string) => (
                              <li key={activity}>• {activity}</li>
                            )
                          )
                        ) : (
                          <li>Nenhuma atividade especial identificada</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Fatores de Exposição
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{generatedData.exposureFactors}</p>
                    </CardContent>
                  </Card>
                </>
              )}

              {selectedDocType === "LTIP" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Insalubridade</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-sm font-semibold">Nível: </span>
                        <Badge>{generatedData.insalubrityLevel}</Badge>
                      </div>
                      <div>
                        <span className="text-sm font-semibold">
                          Percentual:{" "}
                        </span>
                        <span className="text-sm">
                          {generatedData.insalubrityPercentage}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Periculosidade
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-sm font-semibold">Status: </span>
                        <Badge>{generatedData.dangerLevel}</Badge>
                      </div>
                      <div>
                        <span className="text-sm font-semibold">
                          Percentual:{" "}
                        </span>
                        <span className="text-sm">
                          {generatedData.dangerPercentage}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setStep("import")}>
              Voltar
            </Button>
            <Button onClick={() => setStep("generate")}>
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Generate Document */}
      {step === "generate" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Finalizar Documento</h2>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Informações do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold">
                  Título do Documento *
                </label>
                <Input
                  value={documentTitle}
                  onChange={e => setDocumentTitle(e.target.value)}
                  placeholder="Ex: PGR 2026 - Unidade São Paulo"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Descrição</label>
                <Textarea
                  value={documentDescription}
                  onChange={e => setDocumentDescription(e.target.value)}
                  placeholder="Adicione notas ou observações sobre este documento"
                  className="mt-2"
                  rows={4}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectedAssessments.length} avaliação(ões) será(ão)
                  vinculada(s) a este documento
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setStep("review")}>
              Voltar
            </Button>
            <Button
              onClick={handleGenerateDocument}
              disabled={createDocMutation.isPending}
            >
              {createDocMutation.isPending ? "Gerando..." : "Gerar Documento"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
