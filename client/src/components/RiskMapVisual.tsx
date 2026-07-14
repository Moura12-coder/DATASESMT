'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Trash2, Edit2, Check } from "lucide-react";

interface RiskArea {
  id: number;
  name: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  x: number;
  y: number;
  employees: number;
  exposures: string[];
}

interface RiskMapVisualProps {
  areas: RiskArea[];
  onEdit?: (area: RiskArea) => void;
  onDelete?: (areaId: number) => void;
  onSelectChange?: (selectedIds: number[]) => void;
}

const getRiskColor = (level: string): string => {
  switch (level) {
    case "low":
      return "#10b981"; // Green
    case "medium":
      return "#f59e0b"; // Amber
    case "high":
      return "#f97316"; // Orange
    case "critical":
      return "#ef4444"; // Red
    default:
      return "#6b7280"; // Gray
  }
};

const getRiskRadius = (level: string): number => {
  switch (level) {
    case "low":
      return 30;
    case "medium":
      return 45;
    case "high":
      return 60;
    case "critical":
      return 80;
    default:
      return 25;
  }
};

const getRiskLabel = (level: string): string => {
  switch (level) {
    case "low":
      return "Tolerável";
    case "medium":
      return "Moderado";
    case "high":
      return "Substancial";
    case "critical":
      return "Intolerável";
    default:
      return "Desconhecido";
  }
};

export function RiskMapVisual({
  areas,
  onEdit,
  onDelete,
  onSelectChange,
}: RiskMapVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedAreas, setSelectedAreas] = useState<Set<number>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredArea, setHoveredArea] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleSelectAll = () => {
    if (selectedAreas.size === areas.length) {
      setSelectedAreas(new Set());
      onSelectChange?.([]);
    } else {
      const allIds = new Set(areas.map((a) => a.id));
      setSelectedAreas(allIds);
      onSelectChange?.(Array.from(allIds));
    }
  };

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

  const handleDeleteSelected = () => {
    selectedAreas.forEach((id) => {
      onDelete?.(id);
    });
    setSelectedAreas(new Set());
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

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="gap-2"
        >
          <Check className="w-4 h-4" />
          {selectedAreas.size === areas.length
            ? "Desselecionar Tudo"
            : "Selecionar Tudo"}
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

        <div className="ml-auto text-sm text-gray-600">
          Zoom: {(zoom * 100).toFixed(0)}% | Use scroll para zoom, arraste para
          mover
        </div>
      </div>

      {/* SVG Map */}
      <div className="border rounded-lg bg-gray-50 overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height="600"
          viewBox={`0 0 1000 600`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-grab active:cursor-grabbing"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: "0 0",
          }}
        >
          {/* Background */}
          <rect width="1000" height="600" fill="#f9fafb" />

          {/* Grid */}
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
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="1000" height="600" fill="url(#grid)" />

          {/* Risk Areas */}
          {areas.map((area) => {
            const radius = getRiskRadius(area.riskLevel);
            const color = getRiskColor(area.riskLevel);
            const isSelected = selectedAreas.has(area.id);
            const isHovered = hoveredArea === area.id;

            return (
              <g key={area.id}>
                {/* Circle */}
                <circle
                  cx={area.x}
                  cy={area.y}
                  r={radius}
                  fill={color}
                  opacity={isSelected ? 0.8 : 0.6}
                  stroke={isHovered ? "#000" : color}
                  strokeWidth={isHovered ? 3 : 2}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredArea(area.id)}
                  onMouseLeave={() => setHoveredArea(null)}
                  onClick={() => handleSelectArea(area.id)}
                />

                {/* Selection indicator */}
                {isSelected && (
                  <circle
                    cx={area.x}
                    cy={area.y}
                    r={radius + 8}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}

                {/* Label */}
                <text
                  x={area.x}
                  y={area.y - 10}
                  textAnchor="middle"
                  className="text-xs font-bold fill-white pointer-events-none"
                  fontSize="12"
                >
                  {area.name}
                </text>

                {/* Risk Level */}
                <text
                  x={area.x}
                  y={area.y + 5}
                  textAnchor="middle"
                  className="text-xs fill-white pointer-events-none"
                  fontSize="11"
                >
                  {getRiskLabel(area.riskLevel)}
                </text>

                {/* Employee count */}
                <text
                  x={area.x}
                  y={area.y + 18}
                  textAnchor="middle"
                  className="text-xs fill-white pointer-events-none"
                  fontSize="10"
                >
                  {area.employees} colaboradores
                </text>

                {/* Tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={area.x - 80}
                      y={area.y - radius - 100}
                      width="160"
                      height="90"
                      fill="#1f2937"
                      rx="4"
                      opacity="0.95"
                    />
                    <text
                      x={area.x}
                      y={area.y - radius - 80}
                      textAnchor="middle"
                      className="text-xs font-bold fill-white"
                      fontSize="12"
                    >
                      {area.name}
                    </text>
                    <text
                      x={area.x}
                      y={area.y - radius - 65}
                      textAnchor="middle"
                      className="text-xs fill-gray-300"
                      fontSize="10"
                    >
                      Nível: {getRiskLabel(area.riskLevel)}
                    </text>
                    <text
                      x={area.x}
                      y={area.y - radius - 50}
                      textAnchor="middle"
                      className="text-xs fill-gray-300"
                      fontSize="10"
                    >
                      Colaboradores: {area.employees}
                    </text>
                    <text
                      x={area.x}
                      y={area.y - radius - 35}
                      textAnchor="middle"
                      className="text-xs fill-gray-300"
                      fontSize="10"
                    >
                      Exposições: {area.exposures.length}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        {[
          { level: "low", label: "Tolerável" },
          { level: "medium", label: "Moderado" },
          { level: "high", label: "Substancial" },
          { level: "critical", label: "Intolerável" },
        ].map(({ level, label }) => (
          <div key={level} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: getRiskColor(level) }}
            />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Areas List */}
      {areas.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Áreas no Mapa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {areas.map((area) => (
              <div
                key={area.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAreas.has(area.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => handleSelectArea(area.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedAreas.has(area.id)}
                      onChange={() => handleSelectArea(area.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <h4 className="font-semibold text-sm">{area.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Nível: {getRiskLabel(area.riskLevel)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Colaboradores: {area.employees}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(area);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(area.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
