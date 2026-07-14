import { VisualRiskMap } from '@/components/VisualRiskMap';

export default function VisualRiskMapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mapa de Risco Visual</h1>
        <p className="text-muted-foreground mt-2">
          Visualização gráfica dos riscos por área/sala com representação em tempo real
        </p>
      </div>

      <VisualRiskMap />
    </div>
  );
}
