import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from '@/components/ui/accordion';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { useWidgets } from '@/contexts/useWidgets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetProperties } from './properties/WidgetProperties';
import { WidgetList } from './properties/WidgetList';
import { CanvasProperties } from './properties/CanvasProperties';
import { DayannaAIPanel } from './dayanna-ai/DayannaAIPanel';
import { cn } from '@/lib/utils';
import {
  OPEN_AI_SIDEBAR_EVENT,
  consumeFocusAIPromptOnLoadFlag,
  consumeOpenAIOnLoadFlag,
  emitFocusAIPrompt,
} from '@/lib/aiSidebar';

export const RightSidebar: React.FC = () => {
  const { selectedWidget } = useWidgets();
  const [activeTab, setActiveTab] = React.useState<'properties' | 'ai'>('properties');
  const isAiTab = activeTab === 'ai';

  React.useEffect(() => {
    if (consumeOpenAIOnLoadFlag()) {
      setActiveTab('ai');
    }
  }, []);

  React.useEffect(() => {
    const openAiSidebar = () => setActiveTab('ai');
    window.addEventListener(OPEN_AI_SIDEBAR_EVENT, openAiSidebar);
    return () => window.removeEventListener(OPEN_AI_SIDEBAR_EVENT, openAiSidebar);
  }, []);

  React.useEffect(() => {
    if (activeTab !== 'ai') return;

    const shouldForceFocus = consumeFocusAIPromptOnLoadFlag();
    if (shouldForceFocus) {
      emitFocusAIPrompt();
      const timer = window.setTimeout(() => emitFocusAIPrompt(), 140);
      return () => window.clearTimeout(timer);
    }

    emitFocusAIPrompt();
    const timer = window.setTimeout(() => emitFocusAIPrompt(), 120);
    return () => window.clearTimeout(timer);
  }, [activeTab]);

  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('right-sidebar-tab-change', {
        detail: { tab: activeTab },
      })
    );
  }, [activeTab]);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden border-l",
        isAiTab
          ? "ai-active border-[#2b5a91] bg-[#0e2f57] text-white"
          : "border-border bg-card"
      )}
    >
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'properties' | 'ai')} className="flex h-full flex-col">
        <div
          className={cn(
            "border-b px-4 pb-2 pt-4",
            isAiTab ? "border-white/20 bg-[#123a67]" : "border-border bg-card"
          )}
        >
          <TabsList
            className={cn(
              "grid h-10 w-full grid-cols-2 rounded-xl border p-1",
              isAiTab
                ? "border-white/25 bg-[#0f325c] text-white/80"
                : "border-border bg-secondary text-muted-foreground"
            )}
          >
            <TabsTrigger
              value="properties"
              className={cn(
                "gap-2 rounded-lg text-xs",
                isAiTab
                  ? "data-[state=active]:bg-white data-[state=active]:text-[#10345e] data-[state=inactive]:text-white/75 data-[state=inactive]:hover:bg-white/10 data-[state=inactive]:hover:text-white"
                  : "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Propriétés
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className={cn(
                "gap-2 rounded-lg text-xs",
                isAiTab
                  ? "data-[state=active]:bg-white data-[state=active]:text-[#10345e] data-[state=inactive]:text-white/75 data-[state=inactive]:hover:bg-white/10 data-[state=inactive]:hover:text-white"
                  : "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
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
            <DayannaAIPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
