import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

interface RiskArea {
  id: number;
  name: string;
  riskType: "Químico" | "Físico" | "Biológico" | "Ergonômico" | "Acidente";
  riskLevel: "Tolerável" | "Moderado" | "Substancial" | "Intolerável";
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const RISK_TYPE_COLORS = {
  Químico: "#FF6B6B",
  Físico: "#4ECDC4",
  Biológico: "#FFE66D",
  Ergonômico: "#95E1D3",
  Acidente: "#C44569",
};

const RISK_LEVEL_COLORS = {
  Tolerável: "#51CF66",
  Moderado: "#FFD43B",
  Substancial: "#FF922B",
  Intolerável: "#FF6B6B",
};

export default function RiskMapImproved() {
  const [unitId] = useState(1);
  const [areas, setAreas] = useState<RiskArea[]>([
    {
      id: 1,
      name: "Setor de Soldagem",
      riskType: "Químico",
      riskLevel: "Intolerável",
      coordinates: { x: 100, y: 100, width: 200, height: 150 },
    },
    {
      id: 2,
      name: "Setor de Ruído",
      riskType: "Físico",
      riskLevel: "Substancial",
      coordinates: { x: 400, y: 150, width: 180, height: 120 },
    },
    {
      id: 3,
      name: "Laboratório",
      riskType: "Biológico",
      riskLevel: "Moderado",
      coordinates: { x: 700, y: 200, width: 150, height: 100 },
    },
  ]);

  const [selectedArea, setSelectedArea] = useState<RiskArea | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [newArea, setNewArea] = useState({
    name: "",
    riskType: "Químico" as const,
    riskLevel: "Moderado" as const,
  });

  const handleAddArea = () => {
    if (!newArea.name.trim()) {
      toast.error("Digite o nome da área");
      return;
    }

    const newRiskArea: RiskArea = {
      id: Math.max(...areas.map((a) => a.id), 0) + 1,
      name: newArea.name,
      riskType: newArea.riskType,
      riskLevel: newArea.riskLevel,
      coordinates: {
        x: Math.random() * 600 + 100,
        y: Math.random() * 400 + 100,
        width: 150,
        height: 100,
      },
    };

    setAreas([...areas, newRiskArea]);
    setNewArea({ name: "", riskType: "Químico", riskLevel: "Moderado" });
    setShowDialog(false);
    toast.success("Área de risco adicionada");
  };

  const handleDeleteArea = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta área de risco?")) {
      setAreas(areas.filter((a) => a.id !== id));
      setSelectedArea(null);
      toast.success("Área removida");
    }
  };

  const handleExportPDF = () => {
    toast.info("Exportação para PDF será implementada em breve");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Mapa de Riscos Interativo</h1>
          <p className="text-gray-600">Visualização de áreas de risco com círculos coloridos por tipo de agente</p>
        </div>
        <Button onClick={handleExportPDF} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Legenda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legenda - Tipos de Risco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(RISK_TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm">{type}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Legenda Nível de Risco */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legenda - Nível de Risco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(RISK_LEVEL_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: color, opacity: 0.7 }}
                />
                <span className="text-sm">{level}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Informações da Área Selecionada */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Área Selecionada</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedArea ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-semibold">{selectedArea.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-600">Tipo</p>
                    <Badge style={{ backgroundColor: RISK_TYPE_COLORS[selectedArea.riskType] }}>
                      {selectedArea.riskType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nível</p>
                    <Badge style={{ backgroundColor: RISK_LEVEL_COLORS[selectedArea.riskLevel], opacity: 0.7 }}>
                      {selectedArea.riskLevel}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteArea(selectedArea.id)}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Área
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Clique em um círculo no mapa para ver detalhes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mapa de Riscos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Mapa de Riscos</CardTitle>
              <CardDescription>Clique nos círculos para selecionar áreas</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nova Área
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Área de Risco</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Área *</Label>
                    <Input
                      placeholder="Ex: Setor de Soldagem"
                      value={newArea.name}
                      onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Tipo de Risco *</Label>
                    <Select value={newArea.riskType} onValueChange={(value) => setNewArea({ ...newArea, riskType: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Químico">Químico</SelectItem>
                        <SelectItem value="Físico">Físico</SelectItem>
                        <SelectItem value="Biológico">Biológico</SelectItem>
                        <SelectItem value="Ergonômico">Ergonômico</SelectItem>
                        <SelectItem value="Acidente">Acidente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nível de Risco *</Label>
                    <Select value={newArea.riskLevel} onValueChange={(value) => setNewArea({ ...newArea, riskLevel: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tolerável">Tolerável</SelectItem>
                        <SelectItem value="Moderado">Moderado</SelectItem>
                        <SelectItem value="Substancial">Substancial</SelectItem>
                        <SelectItem value="Intolerável">Intolerável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddArea} className="w-full">
                    Adicionar Área
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-auto bg-gray-50">
            <svg
              viewBox="0 0 1200 600"
              className="w-full"
              style={{ minHeight: "500px" }}
            >
              {/* Grid de fundo */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="1200" height="600" fill="url(#grid)" />

              {/* Círculos de Risco */}
              {areas.map((area) => {
                const centerX = area.coordinates.x + area.coordinates.width / 2;
                const centerY = area.coordinates.y + area.coordinates.height / 2;
                const radius = Math.min(area.coordinates.width, area.coordinates.height) / 2;
                const isSelected = selectedArea?.id === area.id;

                return (
                  <g key={area.id}>
                    {/* Círculo principal */}
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={radius}
                      fill={RISK_TYPE_COLORS[area.riskType]}
                      fillOpacity="0.6"
                      stroke={isSelected ? "#000" : "#333"}
                      strokeWidth={isSelected ? "3" : "2"}
                      onClick={() => setSelectedArea(area)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />

                    {/* Anel de nível de risco */}
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={radius}
                      fill="none"
                      stroke={RISK_LEVEL_COLORS[area.riskLevel]}
                      strokeWidth="4"
                      strokeOpacity="0.7"
                    />

                    {/* Texto do nome */}
                    <text
                      x={centerX}
                      y={centerY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-semibold"
                      fill="#000"
                      pointerEvents="none"
                    >
                      {area.name.substring(0, 15)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tabela de Áreas */}
          <div className="mt-6">
            <h3 className="font-semibold mb-4">Áreas de Risco Cadastradas ({areas.length})</h3>
            <div className="space-y-2">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedArea?.id === area.id
                      ? "bg-blue-50 border-blue-500"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedArea(area)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: RISK_TYPE_COLORS[area.riskType] }}
                      />
                      <div>
                        <p className="font-semibold text-sm">{area.name}</p>
                        <p className="text-xs text-gray-600">
                          {area.riskType} • {area.riskLevel}
                        </p>
                      </div>
                    </div>
                    <Badge style={{ backgroundColor: RISK_LEVEL_COLORS[area.riskLevel], opacity: 0.7 }}>
                      {area.riskLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
