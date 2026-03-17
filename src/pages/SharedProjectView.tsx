import React, { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Loader2, Eye, ArrowLeft } from 'lucide-react';
import { fetchSharedProject, SharedProjectData } from '@/lib/supabaseService';
import { WidgetData } from '@/types/widget';
import { InteractiveWidget } from '@/components/builder/InteractiveWidget';
import { isContainerWidget, getContainerMetrics } from '@/lib/widgetLayout';

interface SharedProjectViewProps {
    shareToken: string;
}

const ReadOnlyWidget: React.FC<{ widget: WidgetData; allWidgets: WidgetData[] }> = ({ widget, allWidgets }) => {
    const children = allWidgets.filter(w => w.parentId === widget.id);
    const isContainer = isContainerWidget(widget);
    const metrics = isContainer ? getContainerMetrics(widget) : undefined;

    const childElements = children.length > 0 ? (
        <>
            {children.map(child => (
                <ReadOnlyWidget key={child.id} widget={child} allWidgets={allWidgets} />
            ))}
        </>
    ) : undefined;

    return (
        <div
            style={{
                position: 'absolute',
                left: widget.position.x,
                top: widget.position.y,
                width: widget.size.width,
                height: widget.size.height,
                zIndex: 1,
            }}
        >
            <InteractiveWidget
                widget={widget}
                isPreviewMode={true}
                childElements={childElements}
                hasChildren={children.length > 0}
                containerMetrics={metrics}
            />
        </div>
    );
};

export const SharedProjectView: React.FC<SharedProjectViewProps> = ({ shareToken }) => {
    const [project, setProject] = useState<SharedProjectData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchSharedProject(shareToken);
                if (!data) {
                    setError('Projet introuvable ou lien expiré');
                } else {
                    setProject(data);
                }
            } catch {
                setError('Erreur lors du chargement du projet');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [shareToken]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                    <p className="text-zinc-400 text-sm">Chargement du projet...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Eye className="h-8 w-8 text-red-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-white">Projet non accessible</h1>
                    <p className="text-zinc-400 text-sm">{error || 'Ce lien de partage n\'est plus valide.'}</p>
                    <a
                        href="/"
                        className="mt-4 inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour à l'accueil
                    </a>
                </div>
            </div>
        );
    }

    const { canvas_settings: cs, widgets, name } = project;
    const rootWidgets = widgets.filter(w => !w.parentId);
    const canvasH = cs.height - 40; // Content height (sans barre titre décorative)

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <div className="min-h-screen bg-zinc-950 flex flex-col">
                {/* Header */}
                <header className="h-12 bg-zinc-900 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center">
                            <Eye className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-zinc-200">{name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-medium">
                            Lecture seule
                        </span>
                    </div>
                    <a
                        href="/"
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        Créer mon projet →
                    </a>
                </header>

                {/* Canvas */}
                <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                    <div
                        className="relative rounded-lg shadow-2xl shadow-black/40 overflow-hidden"
                        style={{
                            width: cs.width,
                            minHeight: canvasH,
                            backgroundColor: cs.backgroundColor || '#f0f0f0',
                        }}
                    >
                        {/* Title bar (decorative) */}
                        <div
                            className="flex items-center gap-2 px-4 h-[32px] select-none shrink-0"
                            style={{ backgroundColor: cs.headerBackgroundColor || '#e0e0e0' }}
                        >
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                            </div>
                            <span className="text-xs text-zinc-600 ml-2 font-medium">
                                {cs.title || 'Application'}
                            </span>
                        </div>

                        {/* Widget area */}
                        <div className="relative" style={{ height: canvasH - 32 }}>
                            {rootWidgets.map(w => (
                                <ReadOnlyWidget key={w.id} widget={w} allWidgets={widgets} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
};

export default SharedProjectView;
