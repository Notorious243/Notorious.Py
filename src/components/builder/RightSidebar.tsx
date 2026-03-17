import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from '@/components/ui/accordion';
import { SlidersHorizontal } from 'lucide-react';
import { useWidgets } from '@/contexts/WidgetContext';
import { WidgetProperties } from './properties/WidgetProperties';
import { WidgetList } from './properties/WidgetList';
import { CanvasProperties } from './properties/CanvasProperties';

export const RightSidebar: React.FC = () => {
  const { selectedWidget } = useWidgets();

  return (
    <div className="w-full border-l border-slate-300/80 dark:border-slate-700/70 bg-gradient-to-b from-white via-slate-50/65 to-slate-100/70 dark:from-[#0b1422] dark:via-[#0d1829] dark:to-[#0b1422] flex flex-col h-full overflow-hidden">
      <div className="border-b border-slate-300/70 dark:border-slate-700/70 bg-white/80 dark:bg-[#0c1728]/95">
        <div className="px-4 py-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          Propriétés
        </div>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="px-4 py-4">
          <Accordion type="multiple" defaultValue={['proprietes', 'widgets', 'canvas']} className="w-full space-y-6">
            <WidgetProperties selectedWidget={selectedWidget} />
            <WidgetList />
            <CanvasProperties />
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
};
