import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Settings2, Palette, Columns3, Rows3 } from 'lucide-react';
import { ToggleRow, ColorField, ActionsRow, CompactButton } from '../ui/layout';
import { LazyInput } from '../ui/LazyInput';
import { WidgetPropertySectionProps, DEFAULT_TABLE_COLUMNS, DEFAULT_TABLE_ROWS, type TableColumn } from '../widget-properties-shared';

export const TableProperties: React.FC<WidgetPropertySectionProps> = ({
  properties,
  handlePropertyChange,
  handleBatchPropertyChange,
}) => {
  const columns = Array.isArray(properties.columns) && properties.columns.length > 0
    ? properties.columns.map((column: TableColumn, index: number) => ({
      id: column?.id || `col${index + 1}`,
      label: column?.label || `Colonne ${index + 1}`,
      width: typeof column?.width === 'number' ? column.width : column?.width || '',
    }))
    : DEFAULT_TABLE_COLUMNS.map((column) => ({ ...column }));

  const normalizeRows = (rowsSource: (string[] | Record<string, string>)[], cols: TableColumn[]) =>
    rowsSource.map((row: string[] | Record<string, string>) => {
      const baseRow = Array.isArray(row)
        ? [...row]
        : cols.map((column) => (row && row[column.id]) ?? '');
      const normalized = [...baseRow];
      while (normalized.length < cols.length) normalized.push('');
      return normalized.slice(0, cols.length);
    });

  const rows = Array.isArray(properties.rows) && properties.rows.length > 0
    ? normalizeRows(properties.rows, columns)
    : normalizeRows(DEFAULT_TABLE_ROWS, columns);

  const applyTableUpdate = (nextColumns: TableColumn[], nextRows: string[][]) => {
    handleBatchPropertyChange({
      columns: nextColumns,
      rows: normalizeRows(nextRows, nextColumns),
    });
  };

  const updateColumn = (index: number, key: 'id' | 'label' | 'width', value: string) => {
    const nextColumns = columns.map((column: TableColumn, idx: number) =>
      idx === index ? { ...column, [key]: key === 'width' ? (value === '' ? '' : Number(value)) : value } : column
    );
    applyTableUpdate(nextColumns, rows);
  };

  const addColumn = () => {
    const newColumn = {
      id: `col${columns.length + 1}`,
      label: `Colonne ${columns.length + 1}`,
      width: 140,
    };
    const nextColumns = [...columns, newColumn];
    const nextRows = rows.map((row: string[]) => [...row, '']);
    applyTableUpdate(nextColumns, nextRows);
  };

  const removeColumn = (index: number) => {
    if (columns.length <= 1) return;
    const nextColumns = columns.filter((_: TableColumn, idx: number) => idx !== index);
    const nextRows = rows.map((row: string[]) => row.filter((_: string, cellIndex: number) => cellIndex !== index));
    applyTableUpdate(nextColumns, nextRows);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const nextRows = rows.map((row: string[], rIdx: number) =>
      rIdx === rowIndex
        ? row.map((cell: string, cIdx: number) => (cIdx === colIndex ? value : cell))
        : row
    );
    handleBatchPropertyChange({ rows: nextRows });
  };

  const addRow = () => {
    const blankRow = Array.from({ length: columns.length }, () => '');
    handleBatchPropertyChange({ rows: [...rows, blankRow] });
  };

  const removeRow = (rowIndex: number) => {
    const nextRows = rows.filter((_: string[], idx: number) => idx !== rowIndex);
    handleBatchPropertyChange({
      rows: nextRows.length > 0 ? nextRows : [Array.from({ length: columns.length }, () => '')],
    });
  };

  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={['structure', 'colors', 'columns', 'rows']} className="space-y-4">
        <AccordionItem value="structure" className="rounded-lg border border-border/30 bg-muted/20 px-3 shadow-sm">
          <AccordionTrigger className="flex items-center gap-2 py-3.5 text-sm font-semibold">
            <Settings2 className="h-5 w-5 text-primary" />
            <span className="text-foreground">Structure du Tableau</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 pt-2">
            <div className="space-y-3.5">
              <ToggleRow
                label="Afficher les En-têtes"
                checked={properties.showHeaders !== false}
                onChange={(checked) => handlePropertyChange('showHeaders', checked)}
              />
              <ToggleRow
                label="Activer le défilement"
                checked={properties.enableScroll !== false}
                onChange={(checked) => handlePropertyChange('enableScroll', checked)}
              />
              <ToggleRow
                label="Couleurs alternées"
                description="Alterner la couleur de fond des lignes"
                checked={properties.alternateRowColors !== false}
                onChange={(checked) => handlePropertyChange('alternateRowColors', checked)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <Label className="text-sm font-medium text-foreground mb-1.5">Hauteur de ligne</Label>
                <LazyInput
                  value={properties.rowHeight || 32}
                  inputMode="numeric"
                  onValueChange={(val) => {
                    handlePropertyChange('rowHeight', val === '' ? 32 : Math.max(24, Math.min(100, Number(val))));
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="32"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-foreground mb-1.5">Largeur bordure</Label>
                <LazyInput
                  value={properties.borderWidth ?? 1}
                  inputMode="numeric"
                  onValueChange={(val) => {
                    handlePropertyChange('borderWidth', val === '' ? 1 : Math.max(0, Math.min(10, Number(val))));
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="1"
                  className="h-10"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="colors" className="rounded-lg border border-border/30 bg-muted/20 px-3 shadow-sm">
          <AccordionTrigger className="flex items-center gap-2 py-3.5 text-sm font-semibold">
            <Palette className="h-5 w-5 text-primary" />
            <span className="text-foreground">Couleurs</span>
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-2 gap-4 pb-4 pt-2">
            <ColorField label="Fond En-tête" value={properties.headerBgColor || '#0F3460'} onChange={(color) => handlePropertyChange('headerBgColor', color)} />
            <ColorField label="Texte En-tête" value={properties.headerTextColor || '#FFFFFF'} onChange={(color) => handlePropertyChange('headerTextColor', color)} />
            <ColorField label="Lignes impaires" value={properties.oddRowColor || '#FFFFFF'} onChange={(color) => handlePropertyChange('oddRowColor', color)} />
            <ColorField label="Lignes paires" value={properties.evenRowColor || '#F8FAFC'} onChange={(color) => handlePropertyChange('evenRowColor', color)} />
            <ColorField label="Couleur bordure" value={properties.borderColor || '#E2E8F0'} onChange={(color) => handlePropertyChange('borderColor', color)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="columns" className="rounded-lg border border-border/30 bg-muted/20 px-3 shadow-sm">
          <AccordionTrigger className="flex items-center gap-2 py-3.5 text-sm font-semibold">
            <Columns3 className="h-5 w-5 text-primary" />
            <span className="text-foreground">Colonnes</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 pt-2">
            <ActionsRow>
              <span className="text-sm font-semibold text-foreground tracking-wide">Liste des colonnes</span>
              <CompactButton onClick={addColumn}>
                <Plus className="h-4 w-4 mr-1" /> Ajouter Colonne
              </CompactButton>
            </ActionsRow>
            {columns.map((column: TableColumn, index: number) => (
              <div key={`col-${index}`} className="border border-border/70 rounded-lg p-4 space-y-3.5 bg-background/60 shadow-sm">
                <ActionsRow>
                  <span className="text-sm font-semibold text-foreground">Colonne {index + 1}</span>
                  {columns.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeColumn(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </ActionsRow>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-1.5">Libellé En-tête</Label>
                    <Input
                      value={column.label}
                      onChange={(e) => updateColumn(index, 'label', e.target.value)}
                      placeholder="Ex: Nom du patient"
                      className="h-10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-1.5">Identifiant</Label>
                      <Input
                        value={column.id}
                        onChange={(e) => updateColumn(index, 'id', e.target.value.replace(/\s+/g, '_'))}
                        placeholder="Ex: nom_patient"
                        className="h-10 font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Pour export Python</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-1.5">Largeur (px)</Label>
                      <LazyInput
                        value={column.width ?? ''}
                        onValueChange={(val) => {
                          if (val === '' || /^\d*$/.test(val)) {
                            updateColumn(index, 'width', val);
                          }
                        }}
                        placeholder="Auto"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="rows" className="rounded-lg border border-border/30 bg-muted/20 px-3 shadow-sm">
          <AccordionTrigger className="flex items-center gap-2 py-3.5 text-sm font-semibold">
            <Rows3 className="h-5 w-5 text-primary" />
            <span className="text-foreground">Données</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4 pt-2">
            <ActionsRow>
              <span className="text-sm font-semibold text-foreground tracking-wide">Données du tableau</span>
              <CompactButton onClick={addRow}>
                <Plus className="h-4 w-4 mr-1" /> Nouvelle Ligne
              </CompactButton>
            </ActionsRow>
            {rows.map((row: string[], rowIndex: number) => (
              <div key={rowIndex} className="border border-border/70 rounded-lg p-4 space-y-3.5 bg-background/60 shadow-sm">
                <ActionsRow>
                  <span className="text-sm font-semibold text-foreground">Ligne {rowIndex + 1}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeRow(rowIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </ActionsRow>
                <div className="space-y-3">
                  {columns.map((column: TableColumn, colIndex: number) => (
                    <div key={`${rowIndex}-${colIndex}`} className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {colIndex + 1}
                        </span>
                        {column.label || column.id}
                      </Label>
                      <Input
                        value={row[colIndex] ?? ''}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        placeholder={`Entrer ${column.label || 'valeur'}`}
                        className="h-10"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30">
                <p className="font-medium mb-1">Aucune donnée</p>
                <p className="text-xs">Cliquez sur "Nouvelle Ligne" pour ajouter des données</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
