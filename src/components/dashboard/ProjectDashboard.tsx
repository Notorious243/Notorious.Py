import React, { useState } from 'react';
import { devError } from '@/lib/logger';
import { useProjects } from '@/contexts/useProjects';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Trash2, Rocket, Search, Share2, Globe, Layers, Pencil, ImagePlus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ShareProjectModal } from './ShareProjectModal';
import { PublishToGalleryModal } from './PublishToGalleryModal';
import { GalleryPage } from './GalleryPage';
import { openAIAssistantForPrompt } from '@/lib/aiSidebar';


export const ProjectDashboard: React.FC = () => {
    const { projects, createProject, openProject, deleteProject, renameProject, updateProjectThumbnail } = useProjects();
    const { resolvedTheme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalMode, setCreateModalMode] = useState<'manual' | 'ai'>('manual');
    const [newProjectName, setNewProjectName] = useState('');
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);
    const [publishTarget, setPublishTarget] = useState<{ id: string; name: string; thumbnail?: string } | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const thumbnailInputRef = React.useRef<HTMLInputElement>(null);
    const [thumbnailTargetId, setThumbnailTargetId] = useState<string | null>(null);


    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        try {
            await createProject(newProjectName.trim());
            if (createModalMode === 'ai') openAIAssistantForPrompt({ forceNewConversation: true });
            setIsCreateModalOpen(false);
            setNewProjectName('');
            setCreateModalMode('manual');
        } catch (error) {
            devError('Erreur creation projet:', error);
        }
    };

    const handleCreateWithAI = () => {
        setCreateModalMode('ai');
        setIsCreateModalOpen(true);
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteTargetId(id);
    };

    const handleRenameProject = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        setRenameTarget({ id, name });
        setRenameValue(name);
    };

    const confirmRename = () => {
        if (renameTarget && renameValue.trim()) {
            renameProject(renameTarget.id, renameValue.trim());
            setRenameTarget(null);
        }
    };

    const handleChangeThumbnail = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setThumbnailTargetId(id);
        thumbnailInputRef.current?.click();
    };

    const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !thumbnailTargetId) return;
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            updateProjectThumbnail(thumbnailTargetId, dataUrl);
            setThumbnailTargetId(null);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleShareProject = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        setShareTarget({ id, name });
    };

    const handlePublishProject = (e: React.MouseEvent, id: string, name: string, thumbnail?: string) => {
        e.stopPropagation();
        setPublishTarget({ id, name, thumbnail });
    };

    const confirmDelete = () => {
        if (deleteTargetId) {
            deleteProject(deleteTargetId);
            setDeleteTargetId(null);
        }
    };

    // Date formatter
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (showGallery) {
        return (
            <GalleryPage
                onBack={() => setShowGallery(false)}
                onProjectCloned={(id) => { setShowGallery(false); openProject(id); }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <FolderOpen className="text-primary-foreground w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Mes Projets</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => setShowGallery(true)}>
                        <Layers className="mr-2 h-4 w-4" /> Galerie
                    </Button>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un projet..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setCreateModalMode('manual'); setIsCreateModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Projet
                    </Button>
                </div>
            </header>

            {/* Empty State */}
            {projects.length === 0 && !searchTerm ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center bg-primary/10 ${resolvedTheme === 'dark' ? 'shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]' : ''}`}>
                        <Rocket className="w-16 h-16 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Bienvenue dans Notorious.PY</h2>
                        <p className="text-muted-foreground">Commencez par créer votre premier projet ou laissez l'IA le faire pour vous.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button size="lg" onClick={() => { setCreateModalMode('manual'); setIsCreateModalOpen(true); }} className="h-12 px-8">
                            <Plus className="mr-2 h-5 w-5" /> Créer un projet vide
                        </Button>
                        <Button size="lg" variant="outline" onClick={handleCreateWithAI} className="h-12 px-8 border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-500 transition-all">
                            <Rocket className="mr-2 h-5 w-5 text-purple-500" /> Générer avec l'IA
                        </Button>
                    </div>
                </div>
            ) : (
                /* Projects Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Create New Card (Always first) */}
                    <button
                        onClick={() => { setCreateModalMode('manual'); setIsCreateModalOpen(true); }}
                        className="group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <span className="font-medium text-lg">Nouveau Projet</span>
                    </button>

                    {/* Create with AI Card */}
                    <button
                        onClick={handleCreateWithAI}
                        className="group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/5 transition-all duration-300 min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Rocket className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="font-medium text-lg text-purple-500">Générer avec l'IA</span>
                    </button>

                    {/* Project Cards */}
                    {filteredProjects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => openProject(project.id)}
                            className="group relative rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[200px]"
                        >
                            {/* Project Preview/Thumbnail Placeholder */}
                            <div className="flex-1 bg-muted/30 p-4 flex items-center justify-center relative overflow-hidden">
                                {project.thumbnail ? (
                                    <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover rounded" />
                                ) : (
                                    <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center">
                                        <FolderOpen className="w-8 h-8 text-primary/40" />
                                    </div>
                                )}
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="secondary" className="translate-y-4 group-hover:translate-y-0 transition-transform">
                                        Ouvrir
                                    </Button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border/50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold truncate pr-2" title={project.name}>{project.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Modifié le {formatDate(project.updatedAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-0.5 -mt-1 -mr-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                                            onClick={(e) => handleRenameProject(e, project.id, project.name)}
                                            title="Renommer"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                                            onClick={(e) => handleChangeThumbnail(e, project.id)}
                                            title="Changer l'image"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-emerald-500"
                                            onClick={(e) => handlePublishProject(e, project.id, project.name, project.thumbnail)}
                                            title="Publier dans la galerie"
                                        >
                                            <Globe className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-violet-500"
                                            onClick={(e) => handleShareProject(e, project.id, project.name)}
                                            title="Partager"
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                            onClick={(e) => handleDeleteProject(e, project.id)}
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            <Dialog
                open={isCreateModalOpen}
                onOpenChange={(open) => {
                    setIsCreateModalOpen(open);
                    if (!open) {
                        setNewProjectName('');
                        setCreateModalMode('manual');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{createModalMode === 'ai' ? 'Créer un projet IA' : 'Créer un nouveau projet'}</DialogTitle>
                        <DialogDescription>
                            {createModalMode === 'ai'
                                ? 'Donnez un nom à votre projet puis ouvrez Dayanna pour commencer le prompt.'
                                : 'Donnez un nom à votre projet pour commencer.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder={createModalMode === 'ai' ? 'Nom du projet IA (ex: Dashboard RH)' : 'Nom du projet (ex: Mon Application)'}
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
                        <Button onClick={handleCreateProject}>Créer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share Modal */}
            {shareTarget && (
                <ShareProjectModal
                    isOpen={!!shareTarget}
                    onOpenChange={(open) => { if (!open) setShareTarget(null); }}
                    projectId={shareTarget.id}
                    projectName={shareTarget.name}
                />
            )}

            {/* Publish to Gallery Modal */}
            {publishTarget && (
                <PublishToGalleryModal
                    isOpen={!!publishTarget}
                    onOpenChange={(open) => { if (!open) setPublishTarget(null); }}
                    projectId={publishTarget.id}
                    projectName={publishTarget.name}
                    projectThumbnail={publishTarget.thumbnail}
                />
            )}

            {/* Hidden file input for thumbnail */}
            <input
                ref={thumbnailInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.ico"
                className="hidden"
                onChange={handleThumbnailFileChange}
            />

            {/* Rename Project Modal */}
            <Dialog open={renameTarget !== null} onOpenChange={(open) => { if (!open) setRenameTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renommer le projet</DialogTitle>
                        <DialogDescription>
                            Modifiez le nom de votre projet.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Nouveau nom du projet"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameTarget(null)}>Annuler</Button>
                        <Button onClick={confirmRename}>Renommer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteTargetId !== null}
                onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
                title="Supprimer ce projet ?"
                description="Cette action est irréversible. Toutes les données du projet seront définitivement supprimées."
                confirmLabel="Supprimer"
                variant="danger"
                onConfirm={confirmDelete}
            />

        </div>
    );
};
