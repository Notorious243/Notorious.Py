import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Eye, Trash2, Type, MousePointerClick, TextCursor, FileText, Gauge,
  ImageIcon, CheckSquare, Circle, ToggleRight, ListFilter, ChevronDown,
  Menu, SlidersHorizontal, Box, ScrollText, FolderOpen, BarChart3,
  Table, LayoutDashboard, Calendar, ShoppingCart, CircleUser, HelpCircle,
} from 'lucide-react';
import { useWidgets } from '@/contexts/WidgetContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const WIDGET_ICON_MAP: Record<string, React.ElementType> = {
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
  frame: Box,
  scrollableframe: ScrollText,
  tabview: FolderOpen,
  statCard: BarChart3,
  table: Table,
  menuItem: LayoutDashboard,
  chart: BarChart3,
  datepicker: Calendar,
  productCard: ShoppingCart,
  userProfile: CircleUser,
};

export const LayersPanel: React.FC = () => {
  const { widgets, selectedWidgetId, selectWidget, deleteWidget } = useWidgets();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const pendingWidget = pendingDeleteId ? widgets.find(w => w.id === pendingDeleteId) : null;

  const getWidgetIcon = (type: string) => {
    return WIDGET_ICON_MAP[type] || HelpCircle;
  };

  return (
    <div className="border-t">
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold">Calques</h3>
      </div>
      
      <ScrollArea className="h-48">
        <div className="p-2">
          <AnimatePresence>
            {widgets.length === 0 ? (
              <motion.div
                className="text-center text-sm text-muted-foreground py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Aucun widget
              </motion.div>
            ) : (
              widgets.map((widget, index) => (
                <motion.div
                  key={widget.id}
                  className={`flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer ${
                    selectedWidgetId === widget.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => selectWidget(widget.id)}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    {React.createElement(getWidgetIcon(widget.type), { className: 'h-3.5 w-3.5 text-muted-foreground shrink-0' })}
                    <span className="text-xs font-medium truncate">
                      {widget.properties.text || widget.properties.title || widget.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implémenter la visibilité
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteId(widget.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        title="Supprimer le widget"
        description={`Voulez-vous vraiment supprimer « ${pendingWidget?.properties?.text || pendingWidget?.properties?.title || pendingWidget?.type || 'ce widget'} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId) deleteWidget(pendingDeleteId);
        }}
      />
    </div>
  );
};
