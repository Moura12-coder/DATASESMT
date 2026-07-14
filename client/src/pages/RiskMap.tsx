import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Download } from 'lucide-react';
import { RiskMapVisual } from '@/components/RiskMapVisual';

export default function RiskMap() {
  const [unitId, setUnitId] = useState(1);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [newArea, setNewArea] = useState({ name: '', description: '', riskLevel: 'medium' });
  const [showDialog, setShowDialog] = useState(false);

  const { data: areas = [], isLoading, refetch } = trpc.riskMap.listAreas.useQuery({ unitId });

  const createMutation = trpc.riskMap.createArea.useMutation({
    onSuccess: () => {
      toast.success('Área criada com sucesso');
      refetch();
      setNewArea({ name: '', description: '', riskLevel: 'medium' });
      setShowDialog(false);
    },
    onError: (error) => {
      toast.error(`Erro ao criar área: ${error.message}`);
    },
  });

  const deleteMutation = trpc.riskMap.deleteArea.useMutation({
    onSuccess: () => {
      toast.success('Área deletada com sucesso');
      refetch();
      setSelectedArea(null);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar área: ${error.message}`);
    },
  });

  const handleCreateArea = () => {
    if (!newArea.name.trim()) {
      toast.error('Digite o nome da área');
      return;
    }
    createMutation.mutate({
      unitId,
      name: newArea.name,
      coordinates: {
        x: Math.random() * 800 + 100,
        y: Math.random() * 400 + 100,
        width: 100,
        height: 100,
      },
      description: newArea.description,
    });
  };

  const handleDeleteArea = (areaId: number) => {
    if (confirm('Tem certeza que deseja deletar esta área?')) {
      deleteMutation.mutate({ id: areaId });
    }
  };

  const handleSelectChange = (selectedIds: number[]) => {
    // Handle selection for bulk operations
    console.log('Selected areas:', selectedIds);
  };

  const handleExportMap = () => {
    const svg = document.querySelector('svg');
    if (!svg) {
      toast.error('Mapa não encontrado');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `mapa-risco-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
      toast.success('Mapa exportado com sucesso');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const visualAreas = (areas || []).map((area: any) => {
    const coords = area.coordinates || { x: 0, y: 0 };
    return {
      id: area.id,
      name: area.name,
      riskLevel: 'medium' as const,
      x: coords.x || 100,
      y: coords.y || 100,
      employees: 0,
      exposures: [],
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mapa de Risco</h1>
          <p className="text-gray-600 mt-1">Visualização interativa de áreas e seus riscos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportMap} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar Mapa
          </Button>
          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Área
          </Button>
        </div>
      </div>

      {/* Unit Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Unidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={unitId.toString()} onValueChange={(v) => setUnitId(Number(v))}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Unidade 1</SelectItem>
              <SelectItem value="2">Unidade 2</SelectItem>
              <SelectItem value="3">Unidade 3</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Risk Map Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa Interativo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando mapa...</div>
          ) : visualAreas.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              Nenhuma área cadastrada. Clique em "Nova Área" para começar.
            </div>
          ) : (
            <RiskMapVisual
              areas={visualAreas}
              onEdit={(area) => {
                setSelectedArea(area);
                setNewArea({
                  name: area.name,
                  description: '',
                  riskLevel: area.riskLevel,
                });
              }}
              onDelete={handleDeleteArea}
              onSelectChange={handleSelectChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Area Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Área de Risco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Área</label>
              <Input
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                placeholder="Ex: Setor de Produção"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={newArea.description}
                onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                placeholder="Ex: Área com máquinas de soldagem"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Nível de Risco</label>
              <Select value={newArea.riskLevel} onValueChange={(v) => setNewArea({ ...newArea, riskLevel: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Tolerável (Verde)</SelectItem>
                  <SelectItem value="medium">Moderado (Amarelo)</SelectItem>
                  <SelectItem value="high">Substancial (Laranja)</SelectItem>
                  <SelectItem value="critical">Intolerável (Vermelho)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateArea} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Área'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
