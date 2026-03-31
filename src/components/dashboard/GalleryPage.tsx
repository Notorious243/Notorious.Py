import React, { useState, useEffect, useCallback } from 'react';
import { devError } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search, Heart, Copy, Loader2, ArrowLeft, TrendingUp, Clock,
    Layers, User, Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/useAuth';
import {
    fetchGalleryProjects,
    toggleGalleryLike,
    getUserLikes,
    cloneGalleryProject,
    GalleryProject,
    GallerySortBy,
} from '@/lib/supabaseService';

interface GalleryPageProps {
    onBack: () => void;
    onProjectCloned?: (projectId: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ onBack, onProjectCloned }) => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<GalleryProject[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<GallerySortBy>('recent');
    const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
    const [cloningId, setCloningId] = useState<string | null>(null);
    const [likingId, setLikingId] = useState<string | null>(null);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchGalleryProjects(sortBy, searchTerm, 50, 0);
            setProjects(result.projects);
            setTotal(result.total);
        } catch (e) {
            devError('[Gallery] Failed to fetch:', e);
        } finally {
            setLoading(false);
        }
    }, [sortBy, searchTerm]);

    const loadLikes = useCallback(async () => {
        if (!user) return;
        const likes = await getUserLikes(user.id);
        setUserLikes(likes);
    }, [user]);

    useEffect(() => { loadProjects(); }, [loadProjects]);
    useEffect(() => { loadLikes(); }, [loadLikes]);

    const handleLike = async (galleryProjectId: string) => {
        if (!user) { toast.error('Connectez-vous pour liker'); return; }
        setLikingId(galleryProjectId);
        try {
            const liked = await toggleGalleryLike(galleryProjectId, user.id);
            setUserLikes(prev => {
                const next = new Set(prev);
                if (liked) next.add(galleryProjectId);
                else next.delete(galleryProjectId);
                return next;
            });
            setProjects(prev => prev.map(p =>
                p.id === galleryProjectId
                    ? { ...p, likes_count: p.likes_count + (liked ? 1 : -1) }
                    : p
            ));
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur');
        } finally {
            setLikingId(null);
        }
    };

    const handleClone = async (project: GalleryProject) => {
        if (!user) { toast.error('Connectez-vous pour cloner'); return; }
        setCloningId(project.id);
        try {
            const newId = await cloneGalleryProject(project.id, user.id, `${project.title} (copie)`);
            toast.success('Projet cloné dans vos projets !');
            setProjects(prev => prev.map(p =>
                p.id === project.id ? { ...p, clones_count: p.clones_count + 1 } : p
            ));
            onProjectCloned?.(newId);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur lors du clonage');
        } finally {
            setCloningId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return "À l'instant";
        if (hours < 24) return `Il y a ${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `Il y a ${days}j`;
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Galerie Communautaire</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {total} projet{total !== 1 ? 's' : ''} partagé{total !== 1 ? 's' : ''} par la communauté
                        </p>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par titre, auteur..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 border rounded-lg p-0.5">
                    <Button
                        variant={sortBy === 'recent' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSortBy('recent')}
                        className="h-8 text-xs"
                    >
                        <Clock className="h-3 w-3 mr-1.5" />
                        Récents
                    </Button>
                    <Button
                        variant={sortBy === 'popular' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSortBy('popular')}
                        className="h-8 text-xs"
                    >
                        <TrendingUp className="h-3 w-3 mr-1.5" />
                        Populaires
                    </Button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : projects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                        <Layers className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground">
                        {searchTerm ? 'Aucun résultat pour cette recherche' : 'La galerie est encore vide'}
                    </p>
                    {searchTerm && (
                        <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                            Effacer la recherche
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {projects.map(project => {
                        const isLiked = userLikes.has(project.id);
                        return (
                            <div
                                key={project.id}
                                className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                            >
                                {/* Thumbnail */}
                                <div className="h-40 bg-muted/30 relative overflow-hidden">
                                    {project.thumbnail ? (
                                        <img
                                            src={project.thumbnail}
                                            alt={project.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Layers className="h-12 w-12 text-muted-foreground/20" />
                                        </div>
                                    )}
                                    {/* Overlay actions */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleClone(project)}
                                            disabled={cloningId === project.id}
                                            className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                                        >
                                            {cloningId === project.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                            )}
                                            Cloner
                                        </Button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-semibold text-sm truncate" title={project.title}>
                                        {project.title}
                                    </h3>
                                    {project.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}

                                    {/* Tags */}
                                    {project.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {project.tags.slice(0, 3).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary"
                                                >
                                                    <Tag className="h-2 w-2" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="mt-auto pt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            <span className="truncate max-w-[100px]">{project.author_name || 'Anonyme'}</span>
                                            <span className="text-muted-foreground/40">·</span>
                                            <span>{formatDate(project.published_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                <Layers className="h-2.5 w-2.5" />
                                                {project.widget_count}
                                            </span>
                                            <button
                                                onClick={() => handleLike(project.id)}
                                                disabled={likingId === project.id}
                                                className={`flex items-center gap-1 text-xs transition-colors ${
                                                    isLiked
                                                        ? 'text-red-500 hover:text-red-400'
                                                        : 'text-muted-foreground hover:text-red-500'
                                                }`}
                                            >
                                                <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                                                {project.likes_count > 0 && (
                                                    <span>{project.likes_count}</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
