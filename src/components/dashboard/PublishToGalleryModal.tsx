import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Globe, Loader2, Tag, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/useAuth';
import { useWidgets } from '@/contexts/useWidgets';
import {
    publishToGallery,
    unpublishFromGallery,
    isProjectPublished,
} from '@/lib/supabaseService';

interface PublishToGalleryModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    projectName: string;
    projectThumbnail?: string | null;
}

const COMMON_TAGS = ['dashboard', 'formulaire', 'login', 'chat', 'e-commerce', 'paramètres', 'profil', 'tableau', 'navigation', 'calculatrice'];

export const PublishToGalleryModal: React.FC<PublishToGalleryModalProps> = ({
    isOpen,
    onOpenChange,
    projectId,
    projectName,
    projectThumbnail,
}) => {
    const { user } = useAuth();
    const { widgets, canvasSettings } = useWidgets();
    const [title, setTitle] = useState(projectName);
    const [description, setDescription] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [authorName, setAuthorName] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [publishedId, setPublishedId] = useState<string | null>(null);

    const checkPublished = useCallback(async () => {
        if (!projectId) return;
        setChecking(true);
        const id = await isProjectPublished(projectId);
        setPublishedId(id);
        setChecking(false);
    }, [projectId]);

    useEffect(() => {
        if (isOpen) {
            setTitle(projectName);
            setAuthorName(user?.user_metadata?.first_name || user?.email?.split('@')[0] || '');
            checkPublished();
        }
    }, [isOpen, projectName, user, checkPublished]);

    const handleAddTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !tags.includes(tag) && tags.length < 5) {
            setTags(prev => [...prev, tag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    const handlePublish = async () => {
        if (!user || !title.trim()) return;
        if (widgets.length === 0) {
            toast.error('Le projet doit contenir au moins un widget');
            return;
        }
        setLoading(true);
        try {
            await publishToGallery(
                projectId,
                user.id,
                title.trim(),
                description.trim(),
                authorName.trim(),
                tags,
                canvasSettings,
                widgets,
                projectThumbnail ?? null
            );
            toast.success(publishedId ? 'Publication mise à jour !' : 'Projet publié dans la galerie !');
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e.message || 'Erreur lors de la publication');
        } finally {
            setLoading(false);
        }
    };

    const handleUnpublish = async () => {
        setLoading(true);
        try {
            await unpublishFromGallery(projectId);
            toast.success('Projet retiré de la galerie');
            setPublishedId(null);
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e.message || 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        {publishedId ? 'Gérer la publication' : 'Publier dans la galerie'}
                    </DialogTitle>
                </DialogHeader>

                {checking ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Titre</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nom de votre projet"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Décrivez votre projet en quelques mots..."
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Auteur</Label>
                            <Input
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                placeholder="Votre nom ou pseudo"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Tags ({tags.length}/5)
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    placeholder="Ajouter un tag..."
                                    className="flex-1"
                                    disabled={tags.length >= 5}
                                />
                                <Button variant="outline" size="sm" onClick={handleAddTag} disabled={tags.length >= 5}>
                                    +
                                </Button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                                            onClick={() => handleRemoveTag(tag)}
                                            title="Cliquez pour retirer"
                                        >
                                            {tag} ×
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1">
                                {COMMON_TAGS.filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => { if (tags.length < 5) setTags(prev => [...prev, tag]); }}
                                        className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
                                        disabled={tags.length >= 5}
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                            <Layers className="h-4 w-4 shrink-0" />
                            <span>{widgets.length} widget{widgets.length !== 1 ? 's' : ''} seront publiés</span>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    {publishedId && (
                        <Button variant="destructive" onClick={handleUnpublish} disabled={loading} className="mr-auto">
                            Retirer de la galerie
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handlePublish} disabled={loading || !title.trim() || widgets.length === 0}>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Globe className="h-4 w-4 mr-2" />
                        )}
                        {publishedId ? 'Mettre à jour' : 'Publier'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
