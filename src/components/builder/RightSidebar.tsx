import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from '@/components/ui/accordion';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { useWidgets } from '@/contexts/WidgetContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetProperties } from './properties/WidgetProperties';
import { WidgetList } from './properties/WidgetList';
import { CanvasProperties } from './properties/CanvasProperties';
import { AIAssistantPanel } from './AIAssistantPanel';

export const RightSidebar: React.FC = () => {
  const { selectedWidget } = useWidgets();
  const [activeTab, setActiveTab] = React.useState<'properties' | 'ai'>('properties');

  React.useEffect(() => {
    try {
      const shouldOpenAI = localStorage.getItem('ctk_open_ai_on_load');
      if (shouldOpenAI === 'true') {
        setActiveTab('ai');
        localStorage.removeItem('ctk_open_ai_on_load');
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  React.useEffect(() => {
    const openAiSidebar = () => setActiveTab('ai');
    window.addEventListener('open-ai-sidebar', openAiSidebar);
    return () => window.removeEventListener('open-ai-sidebar', openAiSidebar);
  }, []);

  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('right-sidebar-tab-change', {
        detail: { tab: activeTab },
      })
    );
  }, [activeTab]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-l border-border bg-card">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'properties' | 'ai')} className="flex h-full flex-col">
        <div className="border-b border-border bg-card px-4 pb-2 pt-4">
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl border border-border bg-secondary p-1 text-muted-foreground">
            <TabsTrigger
              value="properties"
              className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Propriétés
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="gap-2 rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Assistant IA
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="properties" className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-4 py-4">
              <Accordion type="multiple" defaultValue={['proprietes', 'widgets', 'canvas']} className="w-full space-y-4">
                <WidgetProperties selectedWidget={selectedWidget} />
                <WidgetList />
                <CanvasProperties />
              </Accordion>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="ai" className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <div className="min-h-0 flex-1">
            <AIAssistantPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
