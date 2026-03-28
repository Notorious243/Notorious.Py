import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWidgets } from '@/contexts/WidgetContext';
import { Layers, Trash2, Type, MousePointerClick, TextCursor, FileText, Gauge, CheckSquare, Circle, ToggleRight, ListFilter, ChevronDown, Menu, SlidersHorizontal, GripVertical, Box, ScrollText, FolderOpen, Image as ImageIcon, BarChart3, Table2, LayoutDashboard, ShoppingCart, CircleUser, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WidgetData } from '@/types/widget';

const WIDGET_TYPE_ICONS: Record<string, React.ElementType> = {
  label: Type,
  button: MousePointerClick,
  entry: TextCursor,
  passwordentry: TextCursor,
  textbox: FileText,
  progressbar: Gauge,
  image_label: ImageIcon,
  checkbox: CheckSquare,
  radiobutton: Circle,
  switch: ToggleRight,
  combobox: ListFilter,
  optionmenu: ChevronDown,
  segmentedbutton: Menu,
  slider: SlidersHorizontal,
  scrollbar: GripVertical,
  frame: Box,
  scrollableframe: ScrollText,
  tabview: FolderOpen,
  statCard: BarChart3,
  table: Table2,
  menuItem: LayoutDashboard,
  chart: BarChart3,
  datepicker: Calendar,
  productCard: ShoppingCart,
  userProfile: CircleUser,
  statCardWithProgress: Gauge,
};

const WIDGET_TYPE_NAMES: Record<string, string> = {
  label: 'Label',
  button: 'Bouton',
  entry: 'Champ texte',
  passwordentry: 'Mot de passe',
  textbox: 'Zone texte',
  progressbar: 'Progression',
  image_label: 'Image',
  checkbox: 'Case à cocher',
  radiobutton: 'Radio',
  switch: 'Interrupteur',
  combobox: 'Liste déroulante',
  optionmenu: 'Menu sélection',
  segmentedbutton: 'Segmenté',
  slider: 'Curseur',
  scrollbar: 'Défilement',
  frame: 'Conteneur',
  scrollableframe: 'Conteneur défilant',
  tabview: 'Onglets',
  statCard: 'Carte stat',
  table: 'Tableau',
  menuItem: 'Menu latéral',
  chart: 'Graphique',
  datepicker: 'Date',
  productCard: 'Carte produit',
  userProfile: 'Profil',
  statCardWithProgress: 'Stat progression',
};

function getLayerName(widget: WidgetData, allWidgets: WidgetData[]): string {
  const baseName = WIDGET_TYPE_NAMES[widget.type] || widget.name || widget.type;
  const sameType = allWidgets.filter(w => w.type === widget.type);
  if (sameType.length <= 1) return baseName;
  const idx = sameType.findIndex(w => w.id === widget.id);
  return `${baseName} ${idx + 1}`;
}

export const WidgetList: React.FC = () => {
    const { widgets, selectedWidgetId, selectWidget, deleteWidget } = useWidgets();

    return (
        <AccordionItem value="widgets" className="rounded-2xl border border-border bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Layers className="h-4 w-4" />Calques
                    <span className="ml-auto text-[10px] font-normal text-muted-foreground tabular-nums">{widgets.length}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-2">
                <ScrollArea className="h-48">
                    <div className="space-y-0.5">
                        <AnimatePresence>
                            {widgets.length > 0 ? widgets.map((widget, index) => {
                                const IconComp = WIDGET_TYPE_ICONS[widget.type] || Box;
                                const isSelected = selectedWidgetId === widget.id;
                                return (
                                    <motion.div
                                        key={widget.id}
                                        layout
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 8 }}
                                        transition={{ duration: 0.15, delay: index * 0.015 }}
                                    >
                                        <div
                                            onClick={() => selectWidget(widget.id)}
                                            className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                                                isSelected
                                                    ? 'bg-primary/15 border border-primary/30 shadow-sm'
                                                    : 'border border-transparent hover:bg-muted/50 hover:border-border/40'
                                            }`}
                                        >
                                            <IconComp className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <span className={`text-xs font-medium truncate flex-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                {getLayerName(widget, widgets)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteWidget(widget.id);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="text-center text-xs text-muted-foreground py-8">
                                    Aucun composant
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </AccordionContent>
        </AccordionItem>
    );
};
