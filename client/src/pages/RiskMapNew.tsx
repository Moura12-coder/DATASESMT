import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Link2, Unlink } from 'lucide-react';
import { RiskMapRealtime } from '@/components/RiskMapRealtime';

interface RiskMapArea {
  id: number;
  name: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  riskCircles: any[];
  maxRiskLevel: string;
}

export default function RiskMapNew() {
  const [unitId, setUnitId] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [newArea, setNewArea] = useState({ name: '', description: '' });
  const [selectedGheId, setSelectedGheId] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);

  // Fetch real-time risk map areas with circles
  const queryKey = { unitId }; // Stabilize query key
  const { data: areas = [], isLoading, refetch } = trpc.riskMap.listAreasWithCircles.useQuery(
    queryKey,
    { refetchInterval: 5000, staleTime: 2000 } // Auto-refresh every 5 seconds
  );

  // Fetch GHEs for linking
  const gheQueryKey = { unitId }; // Stabilize query key
  const { data: ghes = [] } = trpc.phase1.ghe.list.useQuery(gheQueryKey);

  // Mutations
  const createAreaMutation = trpc.riskMap.createArea.useMutation({
    onSuccess: () => {
      toast.success('Área criada com sucesso');
      setNewArea({ name: '', description: '' });
      setShowCreateDialog(false);
      // Force immediate refetch
      setTimeout(() => refetch(), 100);
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error(`Erro ao criar área: ${error.message}`);
    },
  });

  const deleteAreaMutation = trpc.riskMap.deleteArea.useMutation({
    onSuccess: () => {
      toast.success('Área deletada com sucesso');
      // Force immediate refetch
      setTimeout(() => refetch(), 100);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(`Erro ao deletar área: ${error.message}`);
    },
  });

  const updateAreaPositionMutation = trpc.riskMap.updateAreaPosition.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar posição: ${error.message}`);
    },
  });

  const linkGheMutation = trpc.riskMap.linkGheToArea.useMutation({
    onSuccess: () => {
      toast.success('GHE vinculado à área com sucesso');
      refetch();
      setShowLinkDialog(false);
      setSelectedGheId(null);
      setSelectedAreaId(null);
    },
    onError: (error) => {
      toast.error(`Erro ao vincular GHE: ${error.message}`);
    },
  });

  const unlinkGheMutation = trpc.riskMap.unlinkGheFromArea.useMutation({
    onSuccess: () => {
      toast.success('GHE desvinculado com sucesso');
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao desvincular GHE: ${error.message}`);
    },
  });

  const handleCreateArea = () => {
    if (!newArea.name.trim()) {
      toast.error('Digite o nome da área');
      return;
    }
    createAreaMutation.mutate({
      unitId,
      name: newArea.name,
      description: newArea.description,
      coordinates: {
        x: Math.random() * 800 + 100,
        y: Math.random() * 400 + 100,
        width: 150,
        height: 120,
      },
    });
  };

  const handleDeleteArea = async (areaId: number) => {
    if (window.confirm('Tem certeza que deseja deletar esta área?')) {
      try {
        await deleteAreaMutation.mutateAsync({ id: areaId });
        console.log('Área deletada com sucesso');
      } catch (error) {
        console.error('Erro ao deletar área:', error);
      }
    }
  };

  const handleUpdatePosition = (areaId: number, x: number, y: number) => {
    updateAreaPositionMutation.mutate({ id: areaId, x, y });
  };

  const handleLinkGhe = () => {
    if (!selectedGheId || !selectedAreaId) {
      toast.error('Selecione um GHE e uma área');
      return;
    }
    linkGheMutation.mutate({ gheId: selectedGheId, areaId: selectedAreaId });
  };

  const handleSelectChange = (selectedIds: number[]) => {
    // Handle bulk operations if needed
    console.log('Selected areas:', selectedIds);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mapa de Riscos em Tempo Real</h1>
          <p className="text-gray-600 mt-1">
            Visualização interativa com círculos coloridos por tipo e nível de risco
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'default' : 'outline'}
            className="gap-2"
          >
            {isEditing ? 'Salvar' : 'Editar Layout'}
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            variant="default"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Área
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Áreas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{areas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Riscos Identificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {areas.reduce((sum, a) => sum + a.riskCircles.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agentes Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {areas.reduce((sum, a) => sum + a.riskCircles.reduce((s, c) => s + c.count, 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Map Visualization */}
      {isLoading ? (
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Carregando mapa...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mapa Interativo</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskMapRealtime
              areas={areas}
              isEditing={isEditing}
              onAreaUpdate={handleUpdatePosition}
              onAreaDelete={handleDeleteArea}
              onSelectChange={handleSelectChange}
            />
          </CardContent>
        </Card>
      )}

      {/* GHE Linking Section */}
      <Card>
        <CardHeader>
          <CardTitle>Vincular GHEs a Áreas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Vincule Grupos Homogêneos de Exposição (GHEs) às áreas do mapa para visualizar os riscos em tempo real.
            </p>
            <Button
              onClick={() => setShowLinkDialog(true)}
              variant="outline"
              className="gap-2"
            >
              <Link2 className="w-4 h-4" />
              Vincular GHE
            </Button>

            {/* Linked GHEs List */}
            {ghes.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-sm">GHEs Disponíveis</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ghes.map((ghe: any) => (
                    <div
                      key={ghe.id}
                      className="p-2 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-sm">{ghe.name}</p>
                        <p className="text-xs text-gray-500">{ghe.code}</p>
                      </div>
                      {ghe.riskMapAreaId ? (
                        <Button
                          onClick={() => unlinkGheMutation.mutate({ gheId: ghe.id })}
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedGheId(ghe.id);
                            setShowLinkDialog(true);
                          }}
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                        >
                          <Link2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Area Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Área</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Área</label>
              <Input
                placeholder="Ex: Sala de Produção"
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                placeholder="Ex: Área com máquinas de produção"
                value={newArea.description}
                onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setShowCreateDialog(false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateArea}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link GHE Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular GHE a Área</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Selecione um GHE</label>
              <Select
                value={selectedGheId?.toString() || ''}
                onValueChange={(v) => setSelectedGheId(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um GHE" />
                </SelectTrigger>
                <SelectContent>
                  {ghes.map((ghe: any) => (
                    <SelectItem key={ghe.id} value={ghe.id.toString()}>
                      {ghe.name} ({ghe.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Selecione uma Área</label>
              <Select
                value={selectedAreaId?.toString() || ''}
                onValueChange={(v) => setSelectedAreaId(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area: RiskMapArea) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setShowLinkDialog(false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button onClick={handleLinkGhe}>Vincular</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
