import React, { useState, useRef } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Trash2, Search, Calendar, Rocket, ArrowLeft, Upload, Pencil, ImagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';
import JSZip from 'jszip';

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
  const { projects, createProject, openProject, deleteProject, renameProject, updateProjectThumbnail } = useProjects();
  const { user } = useAuth();
  const isGuest = !user;
  const [authPromptFeature, setAuthPromptFeature] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailTargetId, setThumbnailTargetId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
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
      const tree: any[] = [];
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
      setShowImportDialog(false);
      onClose?.();
    } catch (err) {
      console.error('Import ZIP error:', err);
    }
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processZipFile(file);
    e.target.value = '';
  };

  const handleImportDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.zip')) {
      await processZipFile(file);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await createProject(newProjectName);
    setIsCreateModalOpen(false);
    setNewProjectName('');
    onClose?.();
  };

  const handleCreateWithAI = async () => {
    await createProject('Projet IA ' + new Date().toLocaleTimeString());
    try {
      localStorage.setItem('ctk_open_ai_on_load', 'true');
      window.dispatchEvent(new CustomEvent('open-ai-sidebar'));
    } catch { /* ignore */ }
    onClose?.();
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

  // Floating code snippets for background decoration
  const codeSnippets = [
    'import customtkinter as ctk',
    'class App(ctk.CTk):',
    'def __init__(self):',
    'self.title("App")',
    'ctk.CTkButton()',
    'ctk.CTkLabel()',
    'self.mainloop()',
    'frame.pack()',
    'root = ctk.CTk()',
    'widget.grid(row=0)',
    'def callback():',
    'ctk.set_appearance_mode("dark")',
  ];

  return (
    <div className="h-full w-full overflow-y-auto animate-in fade-in duration-500 relative text-foreground bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{
            background: 'radial-gradient(circle, #1F5AA0, transparent 70%)',
            top: '-10%', right: '-8%',
            animation: 'float-orb-1 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, #0F3460, transparent 70%)',
            bottom: '-5%', left: '-5%',
            animation: 'float-orb-2 25s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, #153E6E, transparent 70%)',
            top: '40%', left: '50%',
            animation: 'float-orb-3 18s ease-in-out infinite',
          }}
        />
      </div>

      {/* Subtle dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(circle, #94a3b8 0.7px, transparent 0.7px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Floating code snippets */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {codeSnippets.map((snippet, i) => (
          <div
            key={i}
            className="absolute font-mono text-[11px] whitespace-nowrap select-none"
            style={{
              color: i % 3 === 0 ? 'rgba(15,52,96,0.10)' : i % 3 === 1 ? 'rgba(31,90,160,0.08)' : 'rgba(15,52,96,0.09)',
              top: `${8 + (i * 7.5) % 85}%`,
              left: i % 2 === 0 ? `${-2 + (i * 13) % 30}%` : `${68 + (i * 7) % 28}%`,
              animation: `float-code-${(i % 4) + 1} ${18 + (i * 3) % 12}s ease-in-out infinite`,
              animationDelay: `${(i * 1.5) % 8}s`,
              transform: `rotate(${-3 + (i * 2) % 6}deg)`,
            }}
          >
            {snippet}
          </div>
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 20px) scale(1.05); }
          66% { transform: translate(20px, -15px) scale(0.95); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(25px, -20px) scale(1.08); }
          66% { transform: translate(-15px, 25px) scale(0.92); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -20px) scale(1.1); }
        }
        @keyframes float-code-1 {
          0%, 100% { transform: translateY(0px) rotate(-2deg); opacity: 1; }
          50% { transform: translateY(-12px) rotate(1deg); opacity: 0.7; }
        }
        @keyframes float-code-2 {
          0%, 100% { transform: translateY(0px) rotate(1deg); opacity: 0.8; }
          50% { transform: translateY(10px) rotate(-1deg); opacity: 1; }
        }
        @keyframes float-code-3 {
          0%, 100% { transform: translateX(0px) rotate(-1deg); opacity: 0.9; }
          50% { transform: translateX(8px) rotate(2deg); opacity: 0.6; }
        }
        @keyframes float-code-4 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translate(-6px, -8px) rotate(-2deg); opacity: 1; }
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
          className="absolute top-5 left-5 z-50 flex items-center gap-2 h-10 px-5 rounded-full bg-secondary border border-border text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary shadow-md transition-all duration-200 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au projet
        </button>
      )}

      {/* Main content */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-10 lg:py-12">
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

          <div className="mt-5 w-full max-w-lg flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 h-11 text-sm font-semibold bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] hover:brightness-110 text-white border-0 shadow-[0_10px_26px_rgba(15,52,96,0.25)] hover:shadow-[0_14px_34px_rgba(15,52,96,0.35)] transition-all duration-300 hover:scale-[1.02] rounded-xl"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>

            <Button
              onClick={() => isGuest ? setAuthPromptFeature('La génération IA') : handleCreateWithAI()}
              variant="outline"
              className={`flex-1 h-11 text-sm font-semibold border-border bg-secondary hover:bg-accent text-foreground rounded-xl transition-all duration-300 hover:scale-[1.02] ${isGuest ? 'opacity-60' : ''}`}
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Générer avec l'IA
            </Button>

            <Button
              onClick={() => isGuest ? setAuthPromptFeature('L\'importation de projet') : setShowImportDialog(true)}
              variant="outline"
              className={`flex-1 h-11 text-sm font-semibold border-border bg-secondary hover:bg-accent text-foreground rounded-xl transition-all duration-300 hover:scale-[1.02] ${isGuest ? 'opacity-60' : ''}`}
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              Importer un projet
            </Button>
          </div>
        </div>

        {/* ESPACE DE TRAVAIL section — Image 3 list design */}
        <section className="mt-10 rounded-2xl border border-border bg-card shadow-[0_20px_48px_rgba(15,52,96,0.08)] overflow-hidden">
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

          <div className="max-h-[52vh] overflow-y-auto p-3">
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
                        className="text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 rounded-lg h-8 w-8"
                        onClick={(e) => handleChangeThumbnail(e, project.id)}
                        title="Changer l'image"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
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
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
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

      {/* Import Project Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border text-foreground z-[70]">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Importer un projet</DialogTitle>
          </DialogHeader>
          <div
            className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer ${
              isDragOver
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/40 hover:bg-secondary'
            }`}
            onClick={() => importZipRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleImportDrop}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              isDragOver
                ? 'bg-primary/20 text-primary'
                : 'bg-secondary text-muted-foreground'
            }`}>
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-foreground">Glissez-d\u00e9posez votre fichier .zip ici</p>
            <p className="text-xs text-muted-foreground mt-1">ou cliquez pour parcourir</p>
          </div>
          <input ref={importZipRef} type="file" accept=".zip" className="hidden" onChange={handleImportZip} />
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
       <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border text-foreground z-[70]">
                <DialogHeader>
                    <DialogTitle className="text-xl text-foreground">Nouveau projet</DialogTitle>
                </DialogHeader>
                <div className="py-6">
                    <Input
                        placeholder="Nom du projet"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        autoFocus
                        className="h-12 text-lg rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl h-11 text-muted-foreground hover:text-foreground hover:bg-accent">Annuler</Button>
                    <Button onClick={handleCreateProject} className="rounded-xl h-11 px-6 bg-gradient-to-r from-[#0F3460] to-[#1F5AA0] hover:brightness-110 text-white">Créer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

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
