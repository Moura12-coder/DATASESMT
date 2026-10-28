import React, { useRef, useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Edit2, Save, X, RotateCcw, Clock, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface RiskMapAreaWithHistory {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  riskLevel: string;
}

interface HistoryEntry {
  id: number;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: number;
  changedAt: Date;
  description: string;
}

export function RiskMapAdvanced({ unitId }: { unitId: number }) {
  const [areas, setAreas] = useState<RiskMapAreaWithHistory[]>([]);
  const [editingArea, setEditingArea] = useState<RiskMapAreaWithHistory | null>(
    null
  );
  const [editingName, setEditingName] = useState("");
  const [draggedArea, setDraggedArea] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAreaForHistory, setSelectedAreaForHistory] = useState<
    number | null
  >(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch areas
  const { data: areasData, refetch } =
    trpc.riskMap.listAreasWithCircles.useQuery(
      { unitId },
      { refetchInterval: 5000 }
    );

  // Mutations
  const updatePositionMutation =
    trpc.riskMap.updatePositionWithHistory.useMutation({
      onSuccess: () => {
        toast.success("Posição atualizada");
      },
      onError: error => {
        toast.error(`Erro: ${error.message}`);
      },
    });

  const updateNameMutation = trpc.riskMap.updateNameWithHistory.useMutation({
    onSuccess: () => {
      toast.success("Nome atualizado");
      setEditingArea(null);
      setEditingName("");
    },
    onError: error => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const getHistoryMutation = trpc.riskMap.getAreaChangeHistory.useQuery(
    { areaId: selectedAreaForHistory || 0 },
    { enabled: !!selectedAreaForHistory }
  );

  const rollbackMutation = trpc.riskMap.rollbackToVersion.useMutation({
    onSuccess: () => {
      toast.success("Revertido para versão anterior");
      setShowHistory(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao reverter: ${error?.message || "Erro desconhecido"}`);
    },
  });

  useEffect(() => {
    if (areasData) {
      setAreas(areasData as unknown as RiskMapAreaWithHistory[]);
    }
  }, [areasData]);

  const handleDragStart = (e: React.DragEvent, areaId: number) => {
    setDraggedArea(areaId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedArea || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / 1.2; // Adjust for zoom
    const y = (e.clientY - rect.top) / 1.2;

    updatePositionMutation.mutate({
      areaId: draggedArea,
      x: Math.max(0, Math.min(x, 1200 - 150)),
      y: Math.max(0, Math.min(y, 600 - 120)),
    });

    setDraggedArea(null);
  };

  const handleStartEditName = (area: RiskMapAreaWithHistory) => {
    setEditingArea(area);
    setEditingName(area.name);
  };

  const handleSaveName = () => {
    if (!editingArea || !editingName.trim()) {
      toast.error("Nome não pode estar vazio");
      return;
    }

    updateNameMutation.mutate({
      areaId: editingArea.id,
      newName: editingName,
    });
  };

  useEffect(() => {
    setHistory(
      (getHistoryMutation.data ?? []).map(entry => ({
        ...entry,
        description: `${entry.changeType}: ${entry.oldValue ?? ""} → ${entry.newValue ?? ""}`,
      }))
    );
  }, [getHistoryMutation.data]);

  const handleViewHistory = async (areaId: number) => {
    setSelectedAreaForHistory(areaId);
    setShowHistory(true);
  };

  const handleRollback = (versionId: number) => {
    if (!selectedAreaForHistory) return;
    if (confirm("Tem certeza que deseja reverter para esta versão?")) {
      rollbackMutation.mutate({
        areaId: selectedAreaForHistory,
        versionId,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Riscos Avançado</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Arraste áreas para reorganizar, clique para editar nome, visualize
            histórico de mudanças
          </p>
        </CardHeader>
        <CardContent>
          <svg
            ref={svgRef}
            width="100%"
            height="600"
            viewBox="0 0 1200 600"
            xmlns="http://www.w3.org/2000/svg"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              background: "#f9fafb",
            }}
          >
            <defs>
              <pattern
                id="grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>

            <rect width="1200" height="600" fill="url(#grid)" />

            {areas.map(area => (
              <g
                key={area.id}
                onPointerDown={e => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDraggedArea(area.id);
                }}
                onPointerUp={e => {
                  if (draggedArea !== area.id || !svgRef.current) return;
                  const matrix = svgRef.current.getScreenCTM();
                  if (!matrix) return;
                  const point = new DOMPoint(
                    e.clientX,
                    e.clientY
                  ).matrixTransform(matrix.inverse());
                  updatePositionMutation.mutate({
                    areaId: area.id,
                    x: Math.max(0, point.x - area.width / 2),
                    y: Math.max(0, point.y - area.height / 2),
                  });
                  setDraggedArea(null);
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                style={{
                  cursor: draggedArea === area.id ? "grabbing" : "grab",
                  touchAction: "none",
                }}
              >
                <rect
                  x={area.x}
                  y={area.y}
                  width={area.width}
                  height={area.height}
                  fill={draggedArea === area.id ? "#dbeafe" : "#ffffff"}
                  stroke={draggedArea === area.id ? "#3b82f6" : "#9ca3af"}
                  strokeWidth={draggedArea === area.id ? "3" : "2"}
                  rx="4"
                  style={{
                    opacity: draggedArea === area.id ? 0.8 : 1,
                    transition: "all 0.2s ease",
                  }}
                />

                <text
                  x={area.x + 5}
                  y={area.y + 20}
                  fontSize="12"
                  fontWeight="bold"
                  fill="#1f2937"
                  pointerEvents="none"
                >
                  {editingArea?.id === area.id ? "✏️ Editando..." : area.name}
                </text>

                <text
                  x={area.x + 5}
                  y={area.y + 40}
                  fontSize="10"
                  fill="#6b7280"
                  pointerEvents="none"
                >
                  Risco: {area.riskLevel}
                </text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>

      {/* Areas List with Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Áreas do Mapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {areas.map(area => (
              <div
                key={area.id}
                className="p-4 border rounded-lg flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  {editingArea?.id === area.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        placeholder="Nome da área"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveName}
                        disabled={updateNameMutation.isPending}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingArea(null);
                          setEditingName("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold">{area.name}</h4>
                      <p className="text-sm text-gray-600">
                        Posição: ({Math.round(area.x)}, {Math.round(area.y)})
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {area.riskLevel}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartEditName(area)}
                    disabled={editingArea !== null}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewHistory(area.id)}
                  >
                    <Clock className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Mudanças</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma mudança registrada
              </p>
            ) : (
              history.map(entry => (
                <div
                  key={entry.id}
                  className="p-3 border rounded-lg bg-gray-50 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-500" />
                      <p className="font-semibold text-sm">
                        {entry.description}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(entry.changedAt).toLocaleString()}
                    </p>
                    {entry.oldValue && (
                      <p className="text-xs text-gray-500 mt-1">
                        Antes: {entry.oldValue}
                      </p>
                    )}
                  </div>

                  {entry.changeType !== "rollback" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRollback(entry.id)}
                      disabled={rollbackMutation.isPending}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
