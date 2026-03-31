import React, { useState, useEffect, useCallback } from 'react';
import { devError } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Link2, Copy, Check, Globe, Lock, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
    enableProjectSharing,
    disableProjectSharing,
    getProjectShareToken,
} from '@/lib/supabaseService';

interface ShareProjectModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    projectName: string;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
    isOpen,
    onOpenChange,
    projectId,
    projectName,
}) => {
    const [isPublic, setIsPublic] = useState(false);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = shareToken
        ? `${window.location.origin}/shared/${shareToken}`
        : '';

    const fetchShareStatus = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const token = await getProjectShareToken(projectId);
            setShareToken(token);
            setIsPublic(!!token);
        } catch (e) {
            devError('[Share] Failed to fetch share status:', e);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (isOpen) {
            fetchShareStatus();
            setCopied(false);
        }
    }, [isOpen, fetchShareStatus]);

    const handleToggleShare = async (enabled: boolean) => {
        setLoading(true);
        try {
            if (enabled) {
                const token = await enableProjectSharing(projectId);
                setShareToken(token);
                setIsPublic(true);
                toast.success('Lien de partage activé');
            } else {
                await disableProjectSharing(projectId);
                setShareToken(null);
                setIsPublic(false);
                toast.success('Partage désactivé');
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur lors du partage');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Lien copié !');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Impossible de copier le lien');
        }
    };

    const handleOpenLink = () => {
        if (shareUrl) window.open(shareUrl, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        Partager « {projectName} »
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3">
                            {isPublic ? (
                                <Globe className="h-5 w-5 text-green-500" />
                            ) : (
                                <Lock className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                                <p className="text-sm font-medium">
                                    {isPublic ? 'Lien public actif' : 'Projet privé'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isPublic
                                        ? 'Toute personne avec le lien peut voir ce projet'
                                        : 'Seul vous pouvez accéder à ce projet'}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={handleToggleShare}
                            disabled={loading}
                        />
                    </div>

                    {/* Share Link */}
                    {isPublic && shareToken && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-sm font-medium text-muted-foreground">
                                Lien de partage
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={shareUrl}
                                    readOnly
                                    className="text-xs font-mono bg-muted/50"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopy}
                                    className="shrink-0"
                                    title="Copier le lien"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleOpenLink}
                                    className="shrink-0"
                                    title="Ouvrir dans un nouvel onglet"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Les visiteurs verront votre interface en lecture seule.
                            </p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
