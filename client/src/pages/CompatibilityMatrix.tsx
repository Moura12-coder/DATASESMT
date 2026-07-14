import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function CompatibilityMatrix() {
  const [unitId] = useState(1);

  const { data: matrix, isLoading } = trpc.phase1.compatibility.getMatrix.useQuery({ unitId });

  const getAptStatus = (isApt: boolean) => {
    if (isApt) {
      return { icon: <CheckCircle className="h-5 w-5 text-green-600" />, label: "Apto", color: "bg-green-50" };
    }
    return { icon: <XCircle className="h-5 w-5 text-red-600" />, label: "Não Apto", color: "bg-red-50" };
  };

  const getIndicatorStatus = (value: boolean) => {
    return value ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando matriz de compatibilidade...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Matriz de Compatibilidade</h1>
        <p className="text-gray-600">Validação de aptidão de funcionários por setor/risco</p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          A matriz valida se cada funcionário está apto para trabalhar em seu setor/GHE baseado em: treinamentos, exames ocupacionais, EPIs disponíveis e compatibilidade com riscos.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {matrix?.map((emp) => {
          const aptStatus = getAptStatus(emp.compatibility.isApt);

          return (
            <Card key={emp.employee.id} className={aptStatus.color}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{emp.employee.name}</CardTitle>
                    <CardDescription>{emp.employee.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {aptStatus.icon}
                    <Badge variant={emp.compatibility.isApt ? "default" : "destructive"}>
                      {aptStatus.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Indicador: Treinado */}
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    {getIndicatorStatus(emp.compatibility.trained)}
                    <div>
                      <p className="text-sm font-semibold">Treinado</p>
                      <p className="text-xs text-gray-600">
                        {emp.trainings.length > 0 ? `${emp.trainings.length} treinamentos` : "Sem treinamentos"}
                      </p>
                    </div>
                  </div>

                  {/* Indicador: Exames em Dia */}
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    {getIndicatorStatus(emp.compatibility.examsUpToDate)}
                    <div>
                      <p className="text-sm font-semibold">Exames em Dia</p>
                      <p className="text-xs text-gray-600">
                        {emp.exams.length > 0 ? `${emp.exams.length} exames` : "Sem exames"}
                      </p>
                    </div>
                  </div>

                  {/* Indicador: EPIs Disponíveis */}
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    {getIndicatorStatus(emp.compatibility.episAvailable)}
                    <div>
                      <p className="text-sm font-semibold">EPIs Disponíveis</p>
                      <p className="text-xs text-gray-600">
                        {emp.epis.length > 0 ? `${emp.epis.length} EPIs` : "Sem EPIs"}
                      </p>
                    </div>
                  </div>

                  {/* Indicador: GHE Atribuído */}
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    {getIndicatorStatus(emp.ghe.length > 0)}
                    <div>
                      <p className="text-sm font-semibold">GHE Atribuído</p>
                      <p className="text-xs text-gray-600">
                        {emp.ghe.length > 0 ? `${emp.ghe.length} GHE(s)` : "Sem GHE"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Riscos Associados */}
                {emp.risks.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Riscos Associados:</p>
                    <div className="flex flex-wrap gap-2">
                      {emp.risks.map((risk: any) => (
                        <Badge key={risk.id} variant="outline">
                          {risk.riskName || risk.name || "Risco"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alertas */}
                {!emp.compatibility.isApt && (
                  <div className="mt-4 pt-4 border-t bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold">Ações Necessárias:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {!emp.compatibility.trained && <li>Realizar treinamentos obrigatórios</li>}
                          {!emp.compatibility.examsUpToDate && <li>Agendar exames ocupacionais</li>}
                          {!emp.compatibility.episAvailable && <li>Entregar EPIs necessários</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {matrix?.length === 0 && (
          <Card className="bg-gray-50">
            <CardContent className="pt-6 text-center text-gray-600">
              Nenhum funcionário encontrado na unidade
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
