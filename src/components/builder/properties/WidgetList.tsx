import React from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWidgets } from '@/contexts/WidgetContext';
import { Layers, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const WidgetList: React.FC = () => {
    const { widgets, selectedWidgetId, selectWidget, deleteWidget } = useWidgets();

    return (
        <AccordionItem value="widgets">
            <AccordionTrigger className="px-4">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                    <Layers className="h-4 w-4" />Calques
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-2">
                <ScrollArea className="h-48">
                    <div className="space-y-1">
                        <AnimatePresence>
                            {widgets.length > 0 ? widgets.map((widget, index) => (
                                <motion.div
                                    key={widget.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2, delay: index * 0.02 }}
                                >
                                    <div
                                        onClick={() => selectWidget(widget.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border border-border/40 cursor-pointer transition-all duration-200 ${selectedWidgetId === widget.id ? 'bg-primary/20 border-primary/50' : 'bg-card/30 hover:bg-card hover:border-primary/30'}`}
                                    >
                                        <span className="text-sm font-medium truncate">
                                            {widget.properties.text || widget.name || widget.type}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteWidget(widget.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center text-sm text-muted-foreground py-10">
                                    Aucun composant pour le moment
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </AccordionContent>
        </AccordionItem>
    );
};
