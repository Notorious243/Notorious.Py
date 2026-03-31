import React, { useState, useRef } from 'react';
import type { FileSystemItem } from '@/hooks/useFileSystem';
import { devError } from '@/lib/logger';
import { useProjects } from '@/contexts/useProjects';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Trash2, Search, Calendar, Rocket, ArrowLeft, Upload, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';
import JSZip from 'jszip';
import { openAIAssistantForPrompt } from '@/lib/aiSidebar';
import { BackgroundPathsLayer } from '@/components/ui/background-paths';

// Simple custom SVG for Python logo since it's not standard in lucide-react
const PythonIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 110 110"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M53.8,4.1c-24.8,0-23.3,10.7-23.3,10.7l0,11h23.8v3.4H30.4c0,0-15.3,2.4-15.3,21.8c0,19.4,13.3,20.6,13.3,20.6h6.7v-9.6c0,0-0.4-11.2,11.4-11.2h16c0,0,10.1-0.8,10.1-10.5V14.1C72.5,14.1,72.6,4.1,53.8,4.1z M39.4,11.5c2.4,0,4.4,2,4.4,4.4c0,2.4-2,4.4-4.4,4.4c-2.4,0-4.4-2-4.4-4.4C35.1,13.5,37,11.5,39.4,11.5z" />
    <path d="M55.7,105.8c24.8,0,23.3-10.7,23.3-10.7l0-11H55.2v-3.4h23.8c0,0,15.3-2.4,15.3-21.8c0-19.4-13.3-20.6-13.3-20.6H74.3v9.6c0,0,0.4,11.2-11.4,11.2H46.9c0,0-10.1,0.8-10.1,10.5v26.2C36.9,95.8,36.8,105.8,55.7,105.8z M70.1,98.4c-2.4,0-4.4-2-4.4-4.4c0-2.4,2-4.4,4.4-4.4c2.4,0,4.4,2,4.4,4.4C74.5,96.4,72.5,98.4,70.1,98.4z" />
  </svg>
);

// ─── Main WelcomeScreen: project listing only (shown when projects exist) ───
export const WelcomeScreen: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { projects, createProject, openProject, deleteProject, renameProject } = useProjects();
  const { user } = useAuth();
  const isGuest = !user;
  const [authPromptFeature, setAuthPromptFeature] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalMode, setCreateModalMode] = useState<'manual' | 'ai'>('manual');
  const [newProjectName, setNewProjectName] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const importZipRef = useRef<HTMLInputElement>(null);

  const fileToNode = async (name: string, content: string) => ({
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    type: 'file' as const,
    content,
  });

  const processZipFile = async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const tree: FileSystemItem[] = [];
      const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);
      const paths = entries.map(([p]) => p);
      const commonPrefix = paths.length > 0 && paths.every(p => p.includes('/'))
        ? paths[0].split('/')[0] + '/'
        : '';
      for (const [path, zipFile] of entries) {
        const relativePath = commonPrefix ? path.replace(commonPrefix, '') : path;
        if (!relativePath) continue;
        const content = await zipFile.async('text');
        tree.push(await fileToNode(relativePath, content));
      }
      const projectName = commonPrefix
        ? commonPrefix.replace(/\/$/, '')
        : file.name.replace(/\.zip$/i, '');
      const newId = await createProject(projectName);
      await supabase.from('projects').update({ file_tree: tree, updated_at: new Date().toISOString() }).eq('id', newId);
      onClose?.();
    } catch (err) {
      devError('Import ZIP error:', err);
    }
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processZipFile(file);
    e.target.value = '';
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await createProject(newProjectName.trim());
      if (createModalMode === 'ai') openAIAssistantForPrompt({ forceNewConversation: true });
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setCreateModalMode('manual');
      onClose?.();
    } catch (error) {
      devError('Erreur creation projet:', error);
    }
  };

  const handleCreateWithAI = () => {
    setCreateModalMode('ai');
    setIsCreateModalOpen(true);
  };

  const handleOpenProject = (id: string) => {
    openProject(id);
    onClose?.();
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

  const confirmDelete = () => {
    if (deleteTargetId) {
        deleteProject(deleteTargetId);
        setDeleteTargetId(null);
    }
  };

  const hasProjects = projects.length > 0;
  const recentProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
  const filteredProjects = recentProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pythonMotifs = [
    { top: '8%', left: '7%', size: 62, rotate: -14, opacity: 0.12, duration: '20s', delay: '0s' },
    { top: '18%', right: '9%', size: 74, rotate: 12, opacity: 0.11, duration: '23s', delay: '1.5s' },
    { bottom: '16%', left: '10%', size: 82, rotate: -8, opacity: 0.09, duration: '25s', delay: '0.8s' },
    { bottom: '10%', right: '11%', size: 68, rotate: 16, opacity: 0.1, duration: '21s', delay: '2.2s' },
    { top: '44%', left: '2.8%', size: 54, rotate: -20, opacity: 0.08, duration: '19s', delay: '1.1s' },
    { top: '48%', right: '2.5%', size: 54, rotate: 18, opacity: 0.08, duration: '19s', delay: '2.6s' },
  ] as const;
  const flowRightPaths = Array.from({ length: 12 }, (_, i) => ({
    d: `M 22 ${324 - i * 17} C 176 ${286 - i * 21}, 336 ${198 - i * 16}, 560 ${36 - i * 14}`,
    opacity: Math.max(0.08, 0.26 - i * 0.014),
    width: 1 + i * 0.06,
    delay: `${i * 0.18}s`,
  }));
  const flowLeftPaths = Array.from({ length: 7 }, (_, i) => ({
    d: `M 14 ${216 - i * 10} C 88 ${194 - i * 15}, 168 ${136 - i * 12}, 292 ${72 - i * 10}`,
    opacity: Math.max(0.08, 0.22 - i * 0.02),
    width: 0.9 + i * 0.05,
    delay: `${i * 0.22}s`,
  }));

  return (
    <div className="relative h-full w-full overflow-hidden bg-background text-foreground animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#f9fbff_0%,#f4f7fc_44%,#eef3fa_100%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_12%,rgba(15,52,96,0.12),transparent_36%),radial-gradient(circle_at_82%_78%,rgba(31,90,160,0.11),transparent_44%)]" />
      <BackgroundPathsLayer className="text-[#0F3460] opacity-[0.3]" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(15,52,96,0.25) 0.7px, transparent 0.7px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="flow-path-layer absolute -right-[6%] top-[6%] h-[86%] w-[48%]"
          viewBox="0 0 600 380"
          fill="none"
          aria-hidden="true"
        >
          {flowRightPaths.map((path, index) => (
            <path
              key={`right-${index}`}
              d={path.d}
              className="flow-path flow-path-forward"
              style={{
                stroke: '#0F3460',
                strokeWidth: path.width + 0.24,
                opacity: Math.min(path.opacity + 0.12, 0.62),
                animationDelay: path.delay,
              }}
            />
          ))}
        </svg>
        <svg
          className="flow-path-layer absolute -left-[4%] bottom-[1%] h-[31%] w-[30%]"
          viewBox="0 0 320 240"
          fill="none"
          aria-hidden="true"
        >
          {flowLeftPaths.map((path, index) => (
            <path
              key={`left-${index}`}
              d={path.d}
              className="flow-path flow-path-backward"
              style={{
                stroke: '#0F3460',
                strokeWidth: path.width + 0.2,
                opacity: Math.min(path.opacity + 0.1, 0.55),
                animationDelay: path.delay,
              }}
            />
          ))}
        </svg>
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.93)_0%,rgba(255,255,255,0.88)_38%,rgba(255,255,255,0.45)_72%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {pythonMotifs.map(({ size, rotate, opacity, duration, delay, ...position }, index) => {
          const motifStyle: React.CSSProperties & Record<'--start-rot', string> = {
            ...position,
            width: size,
            height: size,
            color: '#0F3460',
            opacity,
            animation: `python-motif-float ${duration} ease-in-out infinite`,
            animationDelay: delay,
            '--start-rot': `${rotate}deg`,
          };

          return (
            <div key={index} className="absolute" style={motifStyle}>
              <PythonIcon className="h-full w-full" />
            </div>
          );
        })}
      </div>

      {/* CSS Animations */}
      <style>{`
        .flow-path-layer {
          overflow: visible;
          filter: drop-shadow(0 0 1px rgba(15, 52, 96, 0.15));
        }
        .flow-path {
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 15 9;
        }
        .flow-path-forward {
          animation: flow-forward 7.4s linear infinite;
        }
        .flow-path-backward {
          animation: flow-backward 6.8s linear infinite;
        }
        @keyframes flow-forward {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -180; }
        }
        @keyframes flow-backward {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 180; }
        }
        @keyframes python-motif-float {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--start-rot, 0deg)); }
          35% { transform: translate3d(8px, -10px, 0) rotate(calc(var(--start-rot, 0deg) + 3deg)); }
          70% { transform: translate3d(-6px, 8px, 0) rotate(calc(var(--start-rot, 0deg) - 2deg)); }
        }
        .back-home-btn {
          animation: back-btn-glow 2.8s ease-in-out infinite;
        }
        @keyframes back-btn-glow {
          0%, 100% { box-shadow: 0 12px 26px rgba(15, 52, 96, 0.28); }
          50% { box-shadow: 0 16px 34px rgba(15, 52, 96, 0.42); }
        }
        @keyframes shimmer-line {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Back button when used as overlay */}
      {onClose && (
        <button
          onClick={onClose}
          className="back-home-btn group absolute left-5 top-5 z-50 h-11 overflow-hidden rounded-xl border border-[#1F5AA0]/55 bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] px-5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:brightness-110"
        >
          <span className="absolute inset-0 -translate-x-[130%] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent)] transition-transform duration-700 group-hover:translate-x-[130%]" />
          <span className="relative flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au projet
          </span>
        </button>
      )}

      {/* Main content */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col px-6 pb-5 pt-8 lg:pb-6 lg:pt-9">
        <div className="flex flex-col items-center text-center">
          {/* Animated logo with glow */}
          <div className="relative mb-5">
            <div className="absolute inset-0 w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0F3460] to-[#1F5AA0] blur-2xl opacity-40 animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl shadow-[0_18px_38px_rgba(15,52,96,0.38)] flex items-center justify-center transition-transform duration-500 hover:scale-105 overflow-hidden">
              <img src="/logo-128x128.png" alt="Logo" className="w-20 h-20 rounded-3xl" />
            </div>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Notorious.PY</h1>
          <p className="mt-3 text-muted-foreground text-lg max-w-md">
            L'outil ultime pour créer des interfaces Python modernes.
          </p>

          {/* Decorative shimmer line */}
          <div className="mt-5 mb-2 w-32 h-[2px] rounded-full overflow-hidden">
            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(15,52,96,0.5), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer-line 3s ease-in-out infinite',
              }}
            />
          </div>

          <div className="mt-5 w-full flex justify-center">
            <div className="w-full max-w-[760px] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={() => {
                setCreateModalMode('manual');
                setIsCreateModalOpen(true);
              }}
              className="h-11 text-sm font-semibold bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] hover:brightness-110 text-white border-0 shadow-[0_10px_26px_rgba(15,52,96,0.25)] hover:shadow-[0_14px_34px_rgba(15,52,96,0.35)] transition-all duration-300 hover:scale-[1.02] rounded-xl"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>

            <Button
              onClick={() => isGuest ? setAuthPromptFeature('La génération IA') : handleCreateWithAI()}
              variant="outline"
              className={`h-11 text-sm font-semibold border-border bg-secondary hover:bg-accent text-foreground rounded-xl transition-all duration-300 hover:scale-[1.02] ${isGuest ? 'opacity-60' : ''}`}
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Générer avec l'IA
            </Button>

            <Button
              onClick={() => isGuest ? setAuthPromptFeature('L\'importation de projet') : importZipRef.current?.click()}
              variant="outline"
              className={`h-11 text-sm font-semibold border-border bg-secondary hover:bg-accent text-foreground rounded-xl transition-all duration-300 hover:scale-[1.02] ${isGuest ? 'opacity-60' : ''}`}
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importer projet Notorious.PY
            </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Importez un fichier .zip d&apos;un projet Notorious.PY existant.
          </p>
        </div>

        {/* ESPACE DE TRAVAIL section — Image 3 list design */}
        <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_48px_rgba(15,52,96,0.08)]">
          <div className="sticky top-0 z-10 p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Espace de travail</h2>
              <div className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-muted-foreground">
                {filteredProjects.length} / {recentProjects.length}
              </div>
            </div>

            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un projet..."
                className="pl-9 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl"
              />
            </div>
          </div>

          <div className={`min-h-0 flex-1 p-3 ${hasProjects && filteredProjects.length > 0 ? 'overflow-y-auto' : 'overflow-y-hidden'}`}>
            {!hasProjects ? (
              <div className="h-[34vh] flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-secondary/50">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Rocket className="w-7 h-7 text-primary/60" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Aucun projet pour l'instant</p>
                <p className="text-xs text-muted-foreground">Créez votre premier projet pour commencer.</p>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 cursor-pointer hover:shadow-[0_4px_16px_rgba(15,52,96,0.15)]"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:shadow-[0_0_16px_rgba(15,52,96,0.2)] transition-all duration-300 shrink-0">
                      <PythonIcon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-sm">{project.name}</h3>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(project.updatedAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg h-8 w-8"
                        onClick={(e) => handleRenameProject(e, project.id, project.name)}
                        title="Renommer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg h-8 w-8"
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[34vh] flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-secondary/50">
                <Search className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Aucun projet ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer badges */}
        <div className="mt-4 shrink-0 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5" /> Rapide
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> IA intégrée
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>Export Python</span>
        </div>
      </div>

      <input ref={importZipRef} type="file" accept=".zip" className="hidden" onChange={handleImportZip} />

      {/* Create Modal */}
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
            <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border text-foreground z-[70]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-foreground">
                      {createModalMode === 'ai' ? 'Nouveau projet IA' : 'Nouveau projet'}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-6">
                    <Input
                        placeholder={createModalMode === 'ai' ? 'Nom du projet IA' : 'Nom du projet'}
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        autoFocus
                        className="h-12 text-lg rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl h-11 text-muted-foreground hover:text-foreground hover:bg-accent">Annuler</Button>
                    <Button onClick={handleCreateProject} className="rounded-xl h-11 px-6 bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] hover:brightness-110 text-white">
                      Créer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Rename Project Modal */}
        <Dialog open={renameTarget !== null} onOpenChange={(open) => { if (!open) setRenameTarget(null); }}>
            <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border text-foreground z-[70]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-foreground">Renommer le projet</DialogTitle>
                    <DialogDescription className="pt-1 text-muted-foreground">
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
                        className="h-12 text-lg rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setRenameTarget(null)} className="rounded-xl h-11 text-muted-foreground hover:text-foreground hover:bg-accent">Annuler</Button>
                    <Button onClick={confirmRename} className="rounded-xl h-11 px-6 bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] hover:brightness-110 text-white">Renommer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
            <DialogContent className="rounded-2xl bg-card border-border text-foreground z-[70]">
                <DialogHeader>
                    <DialogTitle className="text-red-400 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" /> Supprimer le projet ?
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-muted-foreground">
                        Cette action est irréversible. Toutes les données du projet seront définitivement perdues.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setDeleteTargetId(null)} className="rounded-xl border-border bg-secondary text-foreground hover:bg-accent">Annuler</Button>
                    <Button variant="destructive" onClick={confirmDelete} className="rounded-xl">Supprimer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      {/* Auth prompt for locked guest features */}
      <AuthPromptDialog
        open={!!authPromptFeature}
        onOpenChange={(open) => { if (!open) setAuthPromptFeature(null); }}
        feature={authPromptFeature ?? ''}
      />
    </div>
  );
};
