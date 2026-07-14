import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Move, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskCircle {
  id: string;
  x: number;
  y: number;
  radius: number;
  level: 'toleravel' | 'moderado' | 'substancial' | 'intoleravel';
  label: string;
  description: string;
}

interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

const RISK_COLORS = {
  toleravel: { color: '#10b981', label: 'Tolerável', hex: '#10b981' },
  moderado: { color: '#f59e0b', label: 'Moderado', hex: '#f59e0b' },
  substancial: { color: '#f97316', label: 'Substancial', hex: '#f97316' },
  intoleravel: { color: '#ef4444', label: 'Intolerável', hex: '#ef4444' }
};

export function VisualRiskMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Produção', x: 50, y: 50, width: 300, height: 200, color: '#e8f4f8' },
    { id: '2', name: 'Almoxarifado', x: 400, y: 50, width: 200, height: 150, color: '#f0f4e8' },
    { id: '3', name: 'Administrativo', x: 50, y: 300, width: 250, height: 150, color: '#f4e8f8' },
  ]);
  const [risks, setRisks] = useState<RiskCircle[]>([
    {
      id: '1',
      x: 150,
      y: 120,
      radius: 40,
      level: 'intoleravel',
      label: 'Ruído Ocupacional',
      description: 'Nível acima de 85dB'
    },
    {
      id: '2',
      x: 250,
      y: 180,
      radius: 30,
      level: 'substancial',
      label: 'Calor',
      description: 'Temperatura elevada'
    },
    {
      id: '3',
      x: 450,
      y: 100,
      radius: 25,
      level: 'moderado',
      label: 'Produtos Químicos',
      description: 'Vapores químicos'
    },
    {
      id: '4',
      x: 120,
      y: 360,
      radius: 20,
      level: 'toleravel',
      label: 'Ergonomia',
      description: 'Postura inadequada'
    },
  ]);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply pan and zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    drawGrid(ctx, canvas);

    // Draw rooms
    rooms.forEach(room => {
      drawRoom(ctx, room);
    });

    // Draw risk circles
    risks.forEach(risk => {
      drawRiskCircle(ctx, risk, selectedRisk === risk.id);
    });

    // Restore context state
    ctx.restore();

    // Draw border
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [zoom, pan, rooms, risks, selectedRisk]);

  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    const gridSize = 50;

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const drawRoom = (ctx: CanvasRenderingContext2D, room: Room) => {
    // Draw room rectangle
    ctx.fillStyle = room.color;
    ctx.fillRect(room.x, room.y, room.width, room.height);

    // Draw border
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x, room.y, room.width, room.height);

    // Draw label
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(room.name, room.x + room.width / 2, room.y + 20);
  };

  const drawRiskCircle = (
    ctx: CanvasRenderingContext2D,
    risk: RiskCircle,
    isSelected: boolean
  ) => {
    const riskColor = RISK_COLORS[risk.level];

    // Draw circle
    ctx.fillStyle = riskColor.color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(risk.x, risk.y, risk.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw border
    ctx.strokeStyle = isSelected ? '#000' : riskColor.color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.beginPath();
    ctx.arc(risk.x, risk.y, risk.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(risk.label.substring(0, 15), risk.x, risk.y - 5);
    ctx.font = '10px Arial';
    ctx.fillText(riskColor.label, risk.x, risk.y + 8);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicked on a risk circle
    let clickedRisk = false;
    for (const risk of risks) {
      const distance = Math.sqrt((x - risk.x) ** 2 + (y - risk.y) ** 2);
      if (distance <= risk.radius) {
        setSelectedRisk(risk.id);
        clickedRisk = true;
        break;
      }
    }

    if (!clickedRisk) {
      setSelectedRisk(null);
      setIsDragging(true);
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dx = e.clientX - rect.left - dragStart.x;
    const dy = e.clientY - rect.top - dragStart.y;

    setPan({ x: pan.x + dx, y: pan.y + dy });
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const step = 0.2;
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev + step : Math.max(0.5, prev - step);
      return newZoom;
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedRisk(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Risco Visual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleZoom('in')}
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleZoom('out')}
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              title="Resetar visualização"
            >
              <Move className="w-4 h-4" />
            </Button>
            <div className="text-sm text-muted-foreground">
              Zoom: {(zoom * 100).toFixed(0)}%
            </div>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLegend(!showLegend)}
            >
              {showLegend ? 'Ocultar' : 'Mostrar'} Legenda
            </Button>
          </div>

          {/* Canvas */}
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="w-full cursor-grab active:cursor-grabbing"
            />
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(RISK_COLORS).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2"
                    style={{
                      backgroundColor: value.color,
                      borderColor: value.color,
                      opacity: 0.7
                    }}
                  />
                  <span className="text-sm font-medium">{value.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected Risk Info */}
          {selectedRisk && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                {risks
                  .filter(r => r.id === selectedRisk)
                  .map(risk => (
                    <div key={risk.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{risk.label}</h4>
                          <p className="text-sm text-muted-foreground">
                            {risk.description}
                          </p>
                          <Badge className="mt-2" style={{ backgroundColor: RISK_COLORS[risk.level].color }}>
                            {RISK_COLORS[risk.level].label}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRisk(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Rooms List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Áreas Mapeadas</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className="p-2 border rounded text-sm"
                  style={{ borderLeftColor: room.color, borderLeftWidth: '4px' }}
                >
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {risks.filter(r => {
                      const inRoom =
                        r.x >= room.x &&
                        r.x <= room.x + room.width &&
                        r.y >= room.y &&
                        r.y <= room.y + room.height;
                      return inRoom;
                    }).length} riscos
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Riscos Identificados</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {risks.map(risk => (
                <div
                  key={risk.id}
                  className={cn(
                    'p-2 border rounded cursor-pointer transition-colors',
                    selectedRisk === risk.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
                  )}
                  onClick={() => setSelectedRisk(risk.id)}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                      style={{
                        backgroundColor: RISK_COLORS[risk.level].color,
                        opacity: 0.7
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{risk.label}</p>
                      <p className="text-xs text-muted-foreground">{risk.description}</p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      {RISK_COLORS[risk.level].label}
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
