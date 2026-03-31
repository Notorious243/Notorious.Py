import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, BarChart3, Database, Settings2, Palette } from 'lucide-react';
import { ToggleRow, ColorField, ActionsRow, CompactButton } from '../ui/layout';
import { LazyInput } from '../ui/LazyInput';
import { WidgetPropertySectionProps, type ChartDataPoint } from '../widget-properties-shared';

export const ChartProperties: React.FC<WidgetPropertySectionProps> = ({
  selectedWidget,
  properties,
  handlePropertyChange,
  handleNumericPropertyBlur,
  handleSizeBlur,
}) => {
  const chartData = Array.isArray(properties.data) ? properties.data : [
    { label: 'A', value: 10 },
    { label: 'B', value: 40 },
    { label: 'C', value: 25 },
  ];

  const updateDataPoint = (index: number, field: 'label' | 'value', rawValue: string) => {
    const newData = chartData.map((d: ChartDataPoint, i: number) =>
      i === index
        ? { ...d, [field]: field === 'value' ? (rawValue === '' ? 0 : Number(rawValue)) : rawValue }
        : d
    );
    handlePropertyChange('data', newData);
  };

  const addDataPoint = () => {
    const newData = [...chartData, { label: `Point ${chartData.length + 1}`, value: 0 }];
    handlePropertyChange('data', newData);
  };

  const removeDataPoint = (index: number) => {
    if (chartData.length <= 2) return;
    const newData = chartData.filter((_: ChartDataPoint, i: number) => i !== index);
    handlePropertyChange('data', newData);
  };

  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={['chartType', 'chartData', 'chartStyle', 'chartColors']} className="space-y-4">
        {/* Type de graphique */}
        <AccordionItem value="chartType" className="rounded-lg border border-border/30 bg-muted/20 px-3 shadow-sm">
          <AccordionTrigger className="flex items-center gap-2 py-3.5 text-sm font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-foreground">Type de Graphique</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 pt-2">
            <div className="space-y-3">
              <Label>Type</Label>
              <Select value={properties.chartType || 'line'} onValueChange={v => handlePropertyChange('chartType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Ligne</SelectItem>
                  <SelectItem value="bar">Barre</SelectItem>
                  <SelectItem value="area">Aire</SelectItem>
                  <SelectItem value="pie">Donut</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Titre du Graphique</Label>
              <Input value={properties.title || ''} onChange={e => handlePropertyChange('title', e.target.value)} placeholder="Évolution des ventes" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Données du graphique */}
        <AccordionItem value="chartData" className="rounded-lg border border-border/30 bg-muted/20 px-3 shadow-sm">
          <AccordionTrigger className="flex items-center gap-2 py-3.5 text-sm font-semibold">
            <Database className="h-5 w-5 text-primary" />
            <span className="text-foreground">Données ({chartData.length} points)</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 pt-2">
            <ActionsRow>
              <span className="text-sm font-semibold text-foreground tracking-wide">Points de données</span>
              <CompactButton onClick={addDataPoint}>
                <Plus className="h-4 w-4 mr-1" /> Ajouter
              </CompactButton>
            </ActionsRow>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {chartData.map((point: ChartDataPoint, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 border border-border/60 rounded-md bg-background/40 hover:bg-background/80 transition-colors">
                  <span className="text-xs font-mono text-muted-foreground w-4">{index + 1}</span>
                  <Input
                    value={point.label || ''}
                    onChange={e => updateDataPoint(index, 'label', e.target.value)}
                    placeholder="Lbl"
                    className="h-7 text-xs w-16"
                  />
                  <LazyInput
                    value={point.value ?? ''}
                    inputMode="numeric"
                    onValueChange={val => updateDataPoint(index, 'value', val)}
                    placeholder="Val"
                    className="h-7 text-xs flex-1"
                  />
                  {chartData.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeDataPoint(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Style du graphique */}
        <AccordionItem value="chartStyle" className="rounded-lg border border-border/30 bg-muted/20 px-3 shadow-sm">
          <AccordionTrigger className="flex items-center gap-2 py-3.5 text-sm font-semibold">
            <Settings2 className="h-5 w-5 text-primary" />
            <span className="text-foreground">Style</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 pt-2">
            {/* Taille du graphique */}
            <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dimensions</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Largeur (px)</Label>
                  <LazyInput value={selectedWidget.size.width} inputMode="numeric" onValueChange={val => handleSizeBlur('width', val)} placeholder="400" />
                </div>
                <div>
                  <Label className="text-xs">Hauteur (px)</Label>
                  <LazyInput value={selectedWidget.size.height} inputMode="numeric" onValueChange={val => handleSizeBlur('height', val)} placeholder="280" />
                </div>
              </div>
            </div>

            {/* Fond transparent */}
            <ToggleRow
              label="Fond transparent"
              description="Supprime l'arrière-plan et l'ombre du graphique"
              checked={properties.transparentBackground === true}
              onChange={(checked) => handlePropertyChange('transparentBackground', checked)}
            />

            <ToggleRow
              label="Afficher la grille"
              checked={properties.showGrid !== false}
              onChange={(checked) => handlePropertyChange('showGrid', checked)}
            />
            {(properties.chartType === 'line' || !properties.chartType) && (
              <>
                <ToggleRow
                  label="Afficher les marqueurs"
                  checked={properties.showMarkers !== false}
                  onChange={(checked) => handlePropertyChange('showMarkers', checked)}
                />
                <ToggleRow
                  label="Remplir la zone"
                  checked={properties.showFill !== false}
                  onChange={(checked) => handlePropertyChange('showFill', checked)}
                />
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Épaisseur Ligne</Label>
                <LazyInput value={properties.lineWidth ?? 2} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('lineWidth', val, 2)} />
              </div>
              {properties.showMarkers !== false && (
                <div>
                  <Label>Taille Marqueur</Label>
                  <LazyInput value={properties.markerSize ?? 8} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('markerSize', val, 8)} />
                </div>
              )}
              <div>
                <Label>Rayon Coins</Label>
                <LazyInput value={properties.cornerRadius ?? 16} inputMode="numeric" onValueChange={val => handleNumericPropertyBlur('cornerRadius', val, 16)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Couleurs */}
        <AccordionItem value="chartColors" className="rounded-lg border border-border/30 bg-muted/20 px-3 shadow-sm">
          <AccordionTrigger className="flex items-center gap-2 py-3.5 text-sm font-semibold">
            <Palette className="h-5 w-5 text-primary" />
            <span className="text-foreground">Couleurs</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 pt-2">
            {/* Donut sector colors */}
            {properties.chartType === 'pie' && (
              <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[properties.pieColor1 || '#4CAF50', properties.pieColor2 || '#FFC107', properties.pieColor3 || '#E53935'].map((c: string, i: number) => (
                      <div key={i} className="w-3.5 h-3.5 rounded-full border-2 border-background" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secteurs Donut</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ColorField label="Secteur 1" value={properties.pieColor1 || '#4CAF50'} onChange={(color) => handlePropertyChange('pieColor1', color)} />
                  <ColorField label="Secteur 2" value={properties.pieColor2 || '#FFC107'} onChange={(color) => handlePropertyChange('pieColor2', color)} />
                  <ColorField label="Secteur 3" value={properties.pieColor3 || '#E53935'} onChange={(color) => handlePropertyChange('pieColor3', color)} />
                </div>
              </div>
            )}

            {/* Data colors group */}
            <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Données</span>
              <div className="grid grid-cols-2 gap-3">
                <ColorField label="Ligne / Barre" value={properties.lineColor || '#22C55E'} onChange={(color) => handlePropertyChange('lineColor', color)} />
                <ColorField label="Remplissage" value={properties.fillColor || '#22C55E20'} onChange={(color) => handlePropertyChange('fillColor', color)} />
              </div>
            </div>

            {/* Canvas colors group */}
            <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fond & Grille</span>
              <div className="grid grid-cols-2 gap-3">
                <ColorField label="Fond" value={properties.backgroundColor || '#FFFFFF'} onChange={(color) => handlePropertyChange('backgroundColor', color)} />
                <ColorField label="Grille" value={properties.gridColor || '#E2E8F0'} onChange={(color) => handlePropertyChange('gridColor', color)} />
              </div>
            </div>

            {/* Typography colors group */}
            <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Typographie</span>
              <div className="grid grid-cols-2 gap-3">
                <ColorField label="Titre" value={properties.titleColor || '#0F172A'} onChange={(color) => handlePropertyChange('titleColor', color)} />
                <ColorField label="Texte" value={properties.textColor || '#64748B'} onChange={(color) => handlePropertyChange('textColor', color)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
