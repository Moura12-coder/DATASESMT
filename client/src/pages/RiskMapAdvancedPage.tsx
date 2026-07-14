import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskMapAdvanced } from '@/components/RiskMapAdvanced';
import { RiskMapReports } from '@/components/RiskMapReports';
import { RiskAlerts } from '@/components/RiskAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { MapPin, BarChart3, AlertCircle, Zap } from 'lucide-react';

export function RiskMapAdvancedPage() {
  const { user } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  // Fetch units
  const { data: units = [] } = trpc.units.list.useQuery();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  const unitId = selectedUnit ? parseInt(selectedUnit) : units[0]?.id;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🗺️ Mapa de Riscos Avançado
          </h1>
          <p className="text-gray-600">
            Gerenciamento completo de riscos com drag & drop, histórico, relatórios e alertas em tempo real
          </p>
        </div>

        {/* Unit Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Selecionar Unidade:</label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Escolha uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Drag & Drop</p>
                  <p className="font-semibold">Reorganizar Áreas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Edição Inline</p>
                  <p className="font-semibold">Editar em Tempo Real</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Relatórios</p>
                  <p className="font-semibold">Análise Completa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Alertas</p>
                  <p className="font-semibold">Notificações em Tempo Real</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {unitId && (
          <Tabs defaultValue="map" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Mapa</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Alertas</span>
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Guia</span>
              </TabsTrigger>
            </TabsList>

            {/* Map Tab */}
            <TabsContent value="map" className="space-y-6">
              <RiskMapAdvanced unitId={unitId} />
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <RiskMapReports unitId={unitId} />
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-6">
              <RiskAlerts unitId={unitId} />
            </TabsContent>

            {/* Guide Tab */}
            <TabsContent value="guide" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Guia de Uso - Mapa de Riscos Avançado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Aba Mapa
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 ml-7">
                      <p>
                        <strong>Drag & Drop:</strong> Clique e arraste as áreas no mapa para reorganizá-las. A posição é salva automaticamente com histórico.
                      </p>
                      <p>
                        <strong>Edição de Nome:</strong> Clique no ícone de edição para alterar o nome da área. Pressione Enter para salvar ou ESC para cancelar.
                      </p>
                      <p>
                        <strong>Histórico:</strong> Clique no ícone de relógio para visualizar todas as mudanças da área e reverter para versões anteriores.
                      </p>
                      <p>
                        <strong>Feedback Visual:</strong> Áreas selecionadas ficam azuis, facilitando a identificação.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                      Aba Relatórios
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 ml-7">
                      <p>
                        <strong>Gerar Relatório:</strong> Selecione um período e clique em "Gerar Relatório" para obter análise completa de mudanças.
                      </p>
                      <p>
                        <strong>Comparar Períodos:</strong> Compare dois períodos diferentes para identificar tendências e padrões de mudança.
                      </p>
                      <p>
                        <strong>Exportar:</strong> Exporte os relatórios em PDF ou Excel para compartilhar com stakeholders.
                      </p>
                      <p>
                        <strong>Gráficos:</strong> Visualize dados com gráficos interativos de barras e linhas.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Aba Alertas
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 ml-7">
                      <p>
                        <strong>Alertas em Tempo Real:</strong> Receba notificações automáticas quando o nível de risco de uma área aumenta.
                      </p>
                      <p>
                        <strong>Severidade:</strong> Alertas são classificados como Crítico (Vermelho), Moderado (Amarelo) ou Baixo (Azul).
                      </p>
                      <p>
                        <strong>Marcar como Lido:</strong> Clique em "Marcar como Lido" para reconhecer o alerta.
                      </p>
                      <p>
                        <strong>Filtros:</strong> Use os botões de filtro para visualizar apenas alertas de uma severidade específica.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 Dicas Importantes</h4>
                    <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                      <li>Todas as mudanças são registradas automaticamente no histórico</li>
                      <li>Você pode reverter para qualquer versão anterior a qualquer momento</li>
                      <li>Os alertas são atualizados a cada 10 segundos</li>
                      <li>Use os relatórios para análise periódica de tendências</li>
                      <li>Exporte dados regularmente para auditoria e conformidade</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
