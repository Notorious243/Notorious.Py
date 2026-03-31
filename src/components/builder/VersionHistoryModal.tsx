import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { History, Save, RotateCcw, Trash2, Loader2, Clock, Layers, Plus, FileCode2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    createVersion,
    listVersions,
    getVersion,
    deleteVersion,
    ProjectVersion,
} from '@/lib/supabaseService';
import { WidgetData, CanvasSettings } from '@/types/widget';

type VersionSummary = Omit<ProjectVersion, 'widgets' | 'canvas_settings'>;

interface VersionHistoryModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    currentWidgets: WidgetData[];
    currentCanvasSettings: CanvasSettings;
    onRestore: (widgets: WidgetData[], canvasSettings: CanvasSettings) => void;
    activeFileId?: string | null;
    activeFileName?: string | null;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
    isOpen,
    onOpenChange,
    projectId,
    currentWidgets,
    currentCanvasSettings,
    onRestore,
    activeFileId,
    activeFileName,
}) => {
    const [versions, setVersions] = useState<VersionSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [newLabel, setNewLabel] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<VersionSummary | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'file'>('all');

    const fetchVersions = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const fileFilter = filterMode === 'file' ? activeFileId : undefined;
            const data = await listVersions(projectId, fileFilter);
            setVersions(data);
        } catch (e) {
            console.error('[Versions] Failed to fetch:', e);
        } finally {
            setLoading(false);
        }
    }, [projectId, filterMode, activeFileId]);

    useEffect(() => {
        if (isOpen) {
            fetchVersions();
            setShowCreateForm(false);
            setNewLabel('');
        }
    }, [isOpen, fetchVersions]);

    const handleCreateVersion = async () => {
        const label = newLabel.trim() || `Version du ${new Date().toLocaleString('fr-FR')}`;
        setSaving(true);
        try {
            await createVersion(projectId, label, currentCanvasSettings, currentWidgets, activeFileId, activeFileName);
            toast.success('Version sauvegardée');
            setNewLabel('');
            setShowCreateForm(false);
            fetchVersions();
        } catch (e: any) {
            toast.error(e.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleRestore = async (versionId: string) => {
        const loadingToastId = toast.loading('Restauration de la version...');
        setRestoringId(versionId);
        try {
            const version = await getVersion(versionId);
            if (!version) {
                toast.error('Version introuvable', { id: loadingToastId });
                return;
            }
            onRestore(version.widgets, version.canvas_settings);
            toast.success('Version restaurée avec succès', { id: loadingToastId });
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e.message || 'Erreur lors de la restauration', { id: loadingToastId });
        } finally {
            setRestoringId(null);
            setRestoreTarget(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTargetId) return;
        try {
            await deleteVersion(deleteTargetId);
            setVersions(prev => prev.filter(v => v.id !== deleteTargetId));
            toast.success('Version supprimée');
        } catch (e: any) {
            toast.error(e.message || 'Erreur');
        } finally {
            setDeleteTargetId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatRelative = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "À l'instant";
        if (minutes < 60) return `Il y a ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Il y a ${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `Il y a ${days}j`;
        return formatDate(dateStr);
    };

    const buildRestoreDescription = (version: VersionSummary) => {
        const base = `Vous allez restaurer "${version.label || 'Sans nom'}" (${formatDate(version.created_at)}) avec ${version.widget_count} widget${version.widget_count !== 1 ? 's' : ''}.`;
        if (version.file_name) {
            return `${base} Fichier associé: ${version.file_name}.`;
        }
        return base;
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Historique des versions
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                        {/* Filter tabs: all vs current file */}
                        {activeFileId && (
                            <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
                                <button
                                    onClick={() => setFilterMode('all')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                        filterMode === 'all'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Toutes les versions
                                </button>
                                <button
                                    onClick={() => setFilterMode('file')}
                                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                                        filterMode === 'file'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <FileCode2 className="h-3 w-3" />
                                    {activeFileName || 'Fichier actif'}
                                </button>
                            </div>
                        )}
                        {/* Create version - stable container to avoid visual jump */}
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-2 min-h-[52px] transition-all duration-200">
                            {!showCreateForm ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowCreateForm(true)}
                                    className="h-9 w-full justify-center border border-dashed border-border/70 bg-background/90"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Sauvegarder une version
                                </Button>
                            ) : (
                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <Input
                                        placeholder="Nom de la version (optionnel)"
                                        value={newLabel}
                                        onChange={(e) => setNewLabel(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateVersion()}
                                        autoFocus
                                        className="h-9 flex-1"
                                    />
                                    <Button onClick={handleCreateVersion} disabled={saving} size="sm" className="h-9 px-3">
                                        {saving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowCreateForm(false)}
                                        className="h-9 px-3"
                                    >
                                        Annuler
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Version list */}
                        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : versions.length === 0 ? (
                                <div className="text-center py-8 space-y-2">
                                    <History className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                                    <p className="text-sm text-muted-foreground">Aucune version sauvegardée</p>
                                    <p className="text-xs text-muted-foreground/60">
                                        Sauvegardez une version pour pouvoir restaurer votre projet ultérieurement
                                    </p>
                                </div>
                            ) : (
                                versions.map((version, index) => (
                                    <div
                                        key={version.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                            index === 0
                                                ? 'border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/10'
                                                : 'bg-card hover:bg-muted/50'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold truncate text-foreground">
                                                    {version.label || 'Sans nom'}
                                                </p>
                                                {index === 0 && (
                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                                                        Dernière
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatRelative(version.created_at)}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Layers className="h-3 w-3" />
                                                    {version.widget_count} widget{version.widget_count !== 1 ? 's' : ''}
                                                </span>
                                                {version.file_name && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-medium flex items-center gap-1">
                                                        <FileCode2 className="h-2.5 w-2.5" />
                                                        {version.file_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setRestoreTarget(version)}
                                                disabled={restoringId === version.id}
                                                title="Restaurer cette version"
                                                className="h-8 px-2 text-xs border-blue-200/70 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-950/20"
                                            >
                                                {restoringId === version.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                )}
                                                <span className="ml-1">Restaurer</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteTargetId(version.id)}
                                                title="Supprimer"
                                                className="h-8 w-8 text-muted-foreground/70 hover:text-red-500"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {versions.length > 0 && (
                            <p className="text-[10px] text-muted-foreground text-center">
                                {versions.length}/30 versions — les plus anciennes sont supprimées automatiquement
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
                title="Supprimer cette version ?"
                description="Cette action est irréversible."
                confirmLabel="Supprimer"
                variant="danger"
                onConfirm={handleDelete}
            />
            <ConfirmDialog
                open={restoreTarget !== null}
                onOpenChange={(open) => { if (!open) setRestoreTarget(null); }}
                title="Restaurer cette version ?"
                description={restoreTarget ? buildRestoreDescription(restoreTarget) : ''}
                confirmLabel="Restaurer"
                cancelLabel="Annuler"
                variant="default"
                onConfirm={() => {
                    if (restoreTarget) {
                        handleRestore(restoreTarget.id);
                    }
                }}
            />
        </>
    );
};
