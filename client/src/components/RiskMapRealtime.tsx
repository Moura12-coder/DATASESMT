import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Trash2, Edit2, Plus, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { toast } from 'sonner';

interface RiskCircle {
  id: string;
  type: 'Físico' | 'Químico' | 'Biológico' | 'Ergonômico' | 'Acidente';
  riskLevel: 'Tolerável' | 'Moderado' | 'Substancial' | 'Intolerável';
  count: number;
  x: number;
  y: number;
}

interface RiskMapArea {
  id: number;
  name: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  riskCircles: RiskCircle[];
  maxRiskLevel: 'Tolerável' | 'Moderado' | 'Substancial' | 'Intolerável';
}

interface RiskMapRealtimeProps {
  areas: RiskMapArea[];
  onAreaCreate?: (area: Partial<RiskMapArea>) => void;
  onAreaUpdate?: (id: number, area: Partial<RiskMapArea>) => void;
  onAreaDelete?: (id: number) => void;
  onSelectChange?: (selectedIds: number[]) => void;
  isEditing?: boolean;
}

const RISK_COLORS: Record<string, string> = {
  'Tolerável': '#10b981',      // Green
  'Moderado': '#f59e0b',       // Amber
  'Substancial': '#f97316',    // Orange
  'Intolerável': '#ef4444',    // Red
};

const RISK_TYPE_COLORS: Record<string, string> = {
  'Físico': '#3b82f6',         // Blue
  'Químico': '#8b5cf6',        // Purple
  'Biológico': '#ec4899',      // Pink
  'Ergonômico': '#f59e0b',     // Amber
  'Acidente': '#ef4444',       // Red
};

export function RiskMapRealtime({
  areas,
  onAreaCreate,
  onAreaUpdate,
  onAreaDelete,
  onSelectChange,
  isEditing = false,
}: RiskMapRealtimeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedAreas, setSelectedAreas] = useState<Set<number>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredArea, setHoveredArea] = useState<number | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [filterRiskType, setFilterRiskType] = useState<string | null>(null);
  const [editingArea, setEditingArea] = useState<RiskMapArea | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getRiskColor = (level: string): string => RISK_COLORS[level] || '#6b7280';

  const getRiskRadius = (level: string): number => {
    switch (level) {
      case 'Tolerável':
        return 25;
      case 'Moderado':
        return 35;
      case 'Substancial':
        return 50;
      case 'Intolerável':
        return 70;
      default:
        return 20;
    }
  };

  const allRiskTypes = Array.from(
    new Set(areas.flatMap((a) => a.riskCircles.map((c) => c.type)))
  ).sort();

  const handleSelectArea = (areaId: number) => {
    const newSelected = new Set(selectedAreas);
    if (newSelected.has(areaId)) {
      newSelected.delete(areaId);
    } else {
      newSelected.add(areaId);
    }
    setSelectedAreas(newSelected);
    onSelectChange?.(Array.from(newSelected));
  };

  const handleSelectAll = () => {
    if (selectedAreas.size === areas.length) {
      setSelectedAreas(new Set());
    } else {
      setSelectedAreas(new Set(areas.map((a) => a.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedAreas.size === 0) {
      toast.error('Selecione pelo menos uma área para deletar');
      return;
    }
    if (confirm(`Tem certeza que deseja deletar ${selectedAreas.size} área(s)?`)) {
      selectedAreas.forEach((id) => onAreaDelete?.(id));
      setSelectedAreas(new Set());
    }
  };

  const handleAreaClick = (area: RiskMapArea) => {
    if (isEditing) {
      setEditingArea(area);
      setShowEditDialog(true);
    } else {
      // In view mode, toggle selection
      handleSelectArea(area.id);
    }
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(3, z * 1.2));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.5, z / 1.2));
  };

  const handleExportMap = () => {
    if (svgRef.current) {
      const svg = svgRef.current.outerHTML;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mapa-riscos.svg';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Mapa exportado com sucesso');
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.5, Math.min(3, z * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const filteredAreas = areas.filter((area) => {
    if (!filterRiskType) return true;
    return area.riskCircles.some((c) => c.type === filterRiskType);
  });

  return (
    <div className="w-full space-y-4">
      {/* Selection Controls */}
      <div className="flex gap-2 items-center justify-between mb-4 flex-wrap">
        <div className="flex gap-2 items-center flex-wrap">
          <Button
            onClick={handleSelectAll}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {selectedAreas.size === areas.length
              ? 'Desselecionar Tudo'
              : 'Selecionar Tudo'}
          </Button>

          {selectedAreas.size > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {selectedAreas.size} selecionado(s)
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Selecionados
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ZoomIn className="w-4 h-4" />
            Zoom +
          </Button>
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ZoomOut className="w-4 h-4" />
            Zoom -
          </Button>
          <Button
            onClick={handleExportMap}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button
            onClick={() => setShowLegend(!showLegend)}
            variant="outline"
            size="sm"
          >
            {showLegend ? 'Ocultar' : 'Mostrar'} Legenda
          </Button>
        </div>
      </div>

      {/* Filter */}
      {allRiskTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Filtrar por tipo:</span>
          <Button
            onClick={() => setFilterRiskType(null)}
            variant={filterRiskType === null ? 'default' : 'outline'}
            size="sm"
          >
            Todos
          </Button>
          {allRiskTypes.map((type) => (
            <Button
              key={type}
              onClick={() => setFilterRiskType(type)}
              variant={filterRiskType === type ? 'default' : 'outline'}
              size="sm"
              style={{
                backgroundColor: filterRiskType === type ? RISK_TYPE_COLORS[type] : 'transparent',
                color: filterRiskType === type ? 'white' : 'inherit',
              }}
            >
              {type}
            </Button>
          ))}
        </div>
      )}

      {/* SVG Map */}
      <svg
        ref={svgRef}
        width="100%"
        height="600"
        viewBox="0 0 1200 600"
        xmlns="http://www.w3.org/2000/svg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
        }}
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
          </pattern>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>

        <rect width="1200" height="600" fill="url(#grid)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {filteredAreas.map((area) => (
            <g key={`area-${area.id}`}>
              {/* Area rectangle */}
              <rect
                x={area.x}
                y={area.y}
                width={area.width}
                height={area.height}
                fill={selectedAreas.has(area.id) ? '#dbeafe' : '#ffffff'}
                stroke={selectedAreas.has(area.id) ? '#3b82f6' : getRiskColor(area.maxRiskLevel)}
                strokeWidth={selectedAreas.has(area.id) ? '3' : '2'}
                rx="4"
                onClick={() => handleAreaClick(area)}
                style={{
                  cursor: 'pointer',
                  filter: hoveredArea === area.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                }}
                onMouseEnter={() => setHoveredArea(area.id)}
                onMouseLeave={() => setHoveredArea(null)}
              />

              {/* Area name */}
              <text
                x={area.x + 5}
                y={area.y + 20}
                fontSize="12"
                fontWeight="bold"
                fill="#1f2937"
                pointerEvents="none"
              >
                {area.name}
              </text>

              {/* Risk circles */}
              {area.riskCircles.map((circle, idx) => {
                const radius = getRiskRadius(circle.riskLevel);
                const circleX = area.x + area.width / 2 + (idx - area.riskCircles.length / 2) * 80;
                const circleY = area.y + area.height / 2;

                return (
                  <g key={`circle-${area.id}-${idx}`}>
                    {/* Circle */}
                    <circle
                      cx={circleX}
                      cy={circleY}
                      r={radius}
                      fill={RISK_COLORS[circle.riskLevel]}
                      opacity="0.7"
                      stroke={RISK_COLORS[circle.riskLevel]}
                      strokeWidth="2"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      }}
                    />

                    {/* Risk type icon/label */}
                    <text
                      x={circleX}
                      y={circleY - 5}
                      fontSize="10"
                      fontWeight="bold"
                      fill="white"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {circle.type.substring(0, 3).toUpperCase()}
                    </text>

                    {/* Count */}
                    <text
                      x={circleX}
                      y={circleY + 8}
                      fontSize="12"
                      fontWeight="bold"
                      fill="white"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {circle.count}
                    </text>

                    {/* Tooltip on hover */}
                    {hoveredArea === area.id && (
                      <title>
                        {circle.type} - {circle.riskLevel} ({circle.count} agente{circle.count > 1 ? 's' : ''})
                      </title>
                    )}
                  </g>
                );
              })}

              {/* Tooltip for area */}
              {hoveredArea === area.id && (
                <title>
                  {area.name} - Risco: {area.maxRiskLevel}
                </title>
              )}
            </g>
          ))}
        </g>
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Níveis de Risco</h4>
            <div className="space-y-1">
              {Object.entries(RISK_COLORS).map(([level, color]) => (
                <div key={level} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color, opacity: 0.7 }}
                  />
                  <span>{level}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Tipos de Risco</h4>
            <div className="space-y-1">
              {allRiskTypes.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: RISK_TYPE_COLORS[type] }}
                  />
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Areas List with Selection */}
      {areas.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Áreas do Mapa</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {areas.map((area) => (
              <div
                key={area.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedAreas.has(area.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => handleSelectArea(area.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <Checkbox
                      checked={selectedAreas.has(area.id)}
                      onChange={() => handleSelectArea(area.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <h5 className="font-semibold text-sm">{area.name}</h5>
                      <p className="text-xs text-gray-600 mt-1">
                        Nível: {area.maxRiskLevel}
                      </p>
                      <p className="text-xs text-gray-600">
                        Riscos: {area.riskCircles.length}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Tem certeza que deseja deletar esta área?')) {
                        onAreaDelete?.(area.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
