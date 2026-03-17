import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWidgets } from '@/contexts/WidgetContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useExportPython, buildWidgetVarNameMap } from '@/hooks/useExportPython';
import { Copy, Check, FolderArchive, FileCode2, Image, FileText, Package, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';
import JSZip from 'jszip';

interface ExportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// ── Types internes pour l'export multi-fichier ──
interface ExportedFile {
  fileName: string;
  code: string;
  widgetCount: number;
  lineCount: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onOpenChange }) => {
  const { widgets, canvasSettings, activeFileId } = useWidgets();
  const { projects, activeProjectId } = useProjects();
  const { getNode, getPyFiles } = useFileSystem();
  const { exportToPython } = useExportPython();
  const [copied, setCopied] = React.useState(false);
  const [isZipping, setIsZipping] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectName = activeProject?.name || 'MonProjet';
  const safeProjectName = projectName.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_') || 'MonProjet';

  // ── Collecter tous les fichiers .py du file_tree et générer le code ──
  const exportedFiles = React.useMemo<ExportedFile[]>(() => {
    // Whitelist: only .py files, excluding Images folder entirely
    const allFiles = getPyFiles();
    if (allFiles.length === 0) {
      // Fallback : exporter le fichier actif (widgets en mémoire)
      const activeNode = activeFileId ? getNode(activeFileId) : null;
      const pyFileName = activeNode?.name
        ? (activeNode.name.toLowerCase().endsWith('.py') ? activeNode.name : `${activeNode.name}.py`)
        : 'app.py';
      const code = exportToPython(widgets, canvasSettings);
      return [{ fileName: pyFileName, code, widgetCount: widgets.length, lineCount: code.split('\n').length }];
    }

    return allFiles.map(file => {
      const pyName = file.name.toLowerCase().endsWith('.py') ? file.name : `${file.name}.py`;
      let fileWidgets = widgets;
      let fileCanvasSettings = canvasSettings;

      // Parse le contenu du fichier pour extraire ses propres widgets
      if (file.content) {
        try {
          const parsed = JSON.parse(file.content);
          if (Array.isArray(parsed.widgets)) fileWidgets = parsed.widgets;
          if (parsed.canvasSettings) fileCanvasSettings = { ...canvasSettings, ...parsed.canvasSettings };
        } catch { /* utiliser les widgets par défaut */ }
      }

      // Si c'est le fichier actif, utiliser les widgets en mémoire (potentiellement non sauvés)
      if (file.id === activeFileId) {
        fileWidgets = widgets;
        fileCanvasSettings = canvasSettings;
      }

      const code = exportToPython(fileWidgets, fileCanvasSettings);
      return { fileName: pyName, code, widgetCount: fileWidgets.length, lineCount: code.split('\n').length };
    });
  }, [getPyFiles, activeFileId, getNode, widgets, canvasSettings, exportToPython]);

  const isMultiFile = exportedFiles.length > 1;
  const currentFile = exportedFiles[activeTab] || exportedFiles[0];

  // ── Générer le main.py orchestrateur si multi-fichier ──
  const mainPyCode = React.useMemo(() => {
    if (!isMultiFile) return null;
    const imports = exportedFiles.map(f => {
      const moduleName = f.fileName.replace(/\.py$/, '');
      const safeModule = moduleName.replace(/[^a-zA-Z0-9_]/g, '_');
      return `# from ${safeModule} import *  # Décommentez pour importer ${f.fileName}`;
    });
    let code = `#!/usr/bin/env python3\n`;
    code += `"""Point d'entrée principal — ${projectName}\n`;
    code += `Généré par Notorious.PY — Générateur d'interfaces CustomTkinter\n"""\n\n`;
    code += `import subprocess\nimport sys\nimport os\n\n`;
    code += `# Imports des modules du projet\n`;
    code += imports.join('\n') + '\n\n';
    code += `def lancer_ecran(fichier: str):\n`;
    code += `    """Lance un écran/page dans un processus séparé."""\n`;
    code += `    chemin = os.path.join(os.path.dirname(__file__), fichier)\n`;
    code += `    subprocess.Popen([sys.executable, chemin])\n\n`;
    code += `if __name__ == "__main__":\n`;
    code += `    # Lancer l'écran principal (premier fichier)\n`;
    code += `    lancer_ecran("${exportedFiles[0].fileName}")\n`;
    return code;
  }, [isMultiFile, exportedFiles, projectName]);

  // ── Stats globales ──
  const allWidgets = React.useMemo(() => {
    // Collect all widgets from all files for image/font counting
    const collected: typeof widgets = [];
    for (const f of exportedFiles) {
      // Re-parse from file content to get all widgets
      const pyFiles = getPyFiles();
      const match = pyFiles.find(af => {
        const pyName = af.name.toLowerCase().endsWith('.py') ? af.name : `${af.name}.py`;
        return pyName === f.fileName;
      });
      if (match?.content) {
        try {
          const parsed = JSON.parse(match.content);
          if (Array.isArray(parsed.widgets)) { collected.push(...parsed.widgets); continue; }
        } catch { /* skip */ }
      }
      // Fallback for active file
      if (match?.id === activeFileId) collected.push(...widgets);
    }
    return collected.length > 0 ? collected : widgets;
  }, [exportedFiles, getPyFiles, activeFileId, widgets]);

  const idToVarName = buildWidgetVarNameMap(allWidgets);

  // Compter les fichiers images pour le ZIP
  const imageWidgets = allWidgets.filter(w =>
    (w.type === 'image_label' && w.properties?.image_data) ||
    (w.type === 'productCard' && w.properties?.imageData) ||
    (w.type === 'userProfile' && w.properties?.avatarData)
  );
  // Collect all canvas settings for icon/bg counting
  const allCanvasSettings = React.useMemo(() => {
    const settings: typeof canvasSettings[] = [canvasSettings];
    const pyFiles = getPyFiles();
    pyFiles.forEach(f => {
      if (f.content && f.id !== activeFileId) {
        try {
          const parsed = JSON.parse(f.content);
          if (parsed.canvasSettings) settings.push(parsed.canvasSettings);
        } catch { /* skip */ }
      }
    });
    return settings;
  }, [getPyFiles, activeFileId, canvasSettings]);

  const imageCount = imageWidgets.length
    + allCanvasSettings.filter(cs => cs.icon_data).length
    + allCanvasSettings.filter(cs => cs.background_image_data).length;

  const STANDARD_FONTS = new Set([
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia',
    'Verdana', 'Tahoma', 'Trebuchet MS', 'Segoe UI', 'San Francisco',
    'system-ui', 'sans-serif', 'serif', 'monospace', 'Roboto',
  ]);
  const customFontsUsed = new Set<string>();
  allWidgets.forEach(w => {
    [w.style?.fontFamily, w.properties?.font?.[0], w.properties?.nameFont, w.properties?.fontFamily]
      .filter(Boolean)
      .forEach((f: any) => { if (!STANDARD_FONTS.has(f)) customFontsUsed.add(f); });
  });
  const hasCustomFonts = customFontsUsed.size > 0;
  const pyFileCount = exportedFiles.length + (isMultiFile ? 1 : 0); // .py files + main.py
  const totalFiles = pyFileCount + imageCount + 2 + (hasCustomFonts ? 1 : 0);
  const totalWidgetCount = exportedFiles.reduce((sum, f) => sum + f.widgetCount, 0);

  const handleCopy = () => {
    const textToCopy = currentFile?.code || '';
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast.success(`Code de ${currentFile.fileName} copié !`);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Impossible de copier. Essayez Ctrl+C manuellement.');
    });
  };

  // Helper: convert a data URL to a Uint8Array
  const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
    const base64 = dataUrl.split(',')[1];
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(safeProjectName)!;

      // ── Ajouter tous les fichiers .py ──
      exportedFiles.forEach(f => folder.file(f.fileName, f.code));

      // Ajouter le main.py orchestrateur si multi-fichier
      if (mainPyCode) folder.file('main.py', mainPyCode);

      const entryPoint = isMultiFile ? 'main.py' : exportedFiles[0].fileName;

      // ── Ajouter les images dans Assets/Images/ ──
      const assetsImages = folder.folder('Assets')!.folder('Images')!;
      allCanvasSettings.forEach((cs, idx) => {
        if (cs.icon_data) {
          try {
            const iconBytes = dataUrlToUint8Array(cs.icon_data);
            assetsImages.file(idx === 0 ? 'icon.png' : `icon_${idx}.png`, iconBytes);
          } catch { /* skip if invalid */ }
        }
        if (cs.background_image_data) {
          try {
            const bgBytes = dataUrlToUint8Array(cs.background_image_data);
            assetsImages.file(idx === 0 ? 'background.png' : `background_${idx}.png`, bgBytes);
          } catch { /* skip if invalid */ }
        }
      });

      // Ajouter les images des widgets dans Assets/Images/
      allWidgets.forEach(w => {
        const varName = idToVarName[w.id] || w.type;
        if (w.type === 'image_label' && w.properties?.image_data) {
          try {
            const imgBytes = dataUrlToUint8Array(w.properties.image_data);
            assetsImages.file(`image_${varName}.png`, imgBytes);
          } catch { /* skip */ }
        }
        if (w.type === 'productCard' && w.properties?.imageData) {
          try {
            const imgBytes = dataUrlToUint8Array(w.properties.imageData);
            assetsImages.file(`image_${varName}.png`, imgBytes);
          } catch { /* skip */ }
        }
        if (w.type === 'userProfile' && w.properties?.avatarData) {
          try {
            const imgBytes = dataUrlToUint8Array(w.properties.avatarData);
            assetsImages.file(`avatar_${varName}.png`, imgBytes);
          } catch { /* skip */ }
        }
      });

      // ── Inclure les polices depuis public/fonts/ dans Assets/Fonts/ ──
      if (hasCustomFonts) {
        // Mapping nom de police → fichiers .ttf embarqués dans public/fonts/
        const FONT_FILES: Record<string, string[]> = {
          // Sans-serif
          'Roboto': ['Roboto-Regular.ttf', 'Roboto-Bold.ttf'],
          'Poppins': ['Poppins-Regular.ttf', 'Poppins-Bold.ttf'],
          'Inter': ['Inter-Regular.ttf', 'Inter-Bold.ttf'],
          'Montserrat': ['Montserrat-Regular.ttf', 'Montserrat-Bold.ttf'],
          'Open Sans': ['OpenSans-Regular.ttf', 'OpenSans-Bold.ttf'],
          'Lato': ['Lato-Regular.ttf', 'Lato-Bold.ttf'],
          'Nunito': ['Nunito-Regular.ttf', 'Nunito-Bold.ttf'],
          'Nunito Sans': ['NunitoSans-Regular.ttf', 'NunitoSans-Bold.ttf'],
          'Raleway': ['Raleway-Regular.ttf', 'Raleway-Bold.ttf'],
          'Ubuntu': ['Ubuntu-Regular.ttf', 'Ubuntu-Bold.ttf'],
          'Outfit': ['Outfit-Regular.ttf', 'Outfit-Bold.ttf'],
          'Space Grotesk': ['SpaceGrotesk-Regular.ttf', 'SpaceGrotesk-Bold.ttf'],
          'Quicksand': ['Quicksand-Regular.ttf', 'Quicksand-Bold.ttf'],
          'Josefin Sans': ['JosefinSans-Regular.ttf', 'JosefinSans-Bold.ttf'],
          'Source Sans Pro': ['SourceSansPro-Regular.ttf', 'SourceSansPro-Bold.ttf'],
          'Oswald': ['Oswald-Regular.ttf', 'Oswald-Bold.ttf'],
          'PT Sans': ['PTSans-Regular.ttf', 'PTSans-Bold.ttf'],
          'Rubik': ['Rubik-Regular.ttf', 'Rubik-Bold.ttf'],
          'Fira Sans': ['FiraSans-Regular.ttf', 'FiraSans-Bold.ttf'],
          'Work Sans': ['WorkSans-Regular.ttf', 'WorkSans-Bold.ttf'],
          'DM Sans': ['DMSans-Regular.ttf', 'DMSans-Bold.ttf'],
          'Plus Jakarta Sans': ['PlusJakartaSans-Regular.ttf', 'PlusJakartaSans-Bold.ttf'],
          'Manrope': ['Manrope-Regular.ttf', 'Manrope-Bold.ttf'],
          'IBM Plex Sans': ['IBMPlexSans-Regular.ttf', 'IBMPlexSans-Bold.ttf'],
          // Serif
          'Lora': ['Lora-Regular.ttf', 'Lora-Bold.ttf'],
          'Playfair Display': ['PlayfairDisplay-Regular.ttf', 'PlayfairDisplay-Bold.ttf'],
          'Merriweather': ['Merriweather-Regular.ttf', 'Merriweather-Bold.ttf'],
          'Crimson Text': ['CrimsonText-Regular.ttf', 'CrimsonText-Bold.ttf'],
          // Monospace
          'Roboto Mono': ['RobotoMono-Regular.ttf', 'RobotoMono-Bold.ttf'],
          'Source Code Pro': ['SourceCodePro-Regular.ttf', 'SourceCodePro-Bold.ttf'],
          'Fira Code': ['FiraCode-Regular.ttf', 'FiraCode-Bold.ttf'],
          'JetBrains Mono': ['JetBrainsMono-Regular.ttf', 'JetBrainsMono-Bold.ttf'],
          'IBM Plex Mono': ['IBMPlexMono-Regular.ttf', 'IBMPlexMono-Bold.ttf'],
        };

        const assetsFonts = folder.folder('Assets')!.folder('Fonts')!;
        // Charger les .ttf depuis public/fonts/ (assets statiques locaux, zéro réseau)
        const fontLoads: Promise<void>[] = [];
        customFontsUsed.forEach(fontName => {
          const files = FONT_FILES[fontName];
          if (!files) return;
          files.forEach(fileName => {
            fontLoads.push(
              fetch(`/fonts/${fileName}`)
                .then(res => {
                  if (!res.ok) throw new Error(`${fileName}: HTTP ${res.status}`);
                  return res.arrayBuffer();
                })
                .then(buf => { assetsFonts.file(fileName, new Uint8Array(buf)); })
                .catch(() => { /* Police non disponible localement */ })
            );
          });
        });
        await Promise.allSettled(fontLoads);
      }

      // ── README ──
      const hasCharts = allWidgets.some(w => w.type === 'chart');
      const hasDatepicker = allWidgets.some(w => w.type === 'datepicker');
      const hasImages = imageCount > 0;
      const needsPILZip = allCanvasSettings.some(cs => cs.icon_data || cs.background_image_data)
        || allWidgets.some(w => ['image_label', 'productCard', 'userProfile'].includes(w.type));
      const needsRequestsZip = allWidgets.some(w => w.type === 'image_label' && w.properties?.image_path && !w.properties?.image_data);

      let readme = `# ${projectName}\n\n`;
      readme += `> Interface générée automatiquement par **Notorious.PY — Générateur d'interfaces CustomTkinter**.\n\n`;
      readme += `## Prérequis\n\n`;
      readme += `| Outil | Version minimum | Vérification |\n`;
      readme += `|-------|----------------|---------------|\n`;
      readme += `| Python | 3.8+ | \`python --version\` |\n`;
      readme += `| pip | inclus avec Python | \`pip --version\` |\n\n`;
      readme += `## Installation\n\n`;
      readme += `\`\`\`bash\npip install -r requirements.txt\n\`\`\`\n\n`;
      readme += `## Lancement\n\n`;
      readme += `\`\`\`bash\npython ${entryPoint}\n\`\`\`\n\n`;
      readme += `## Structure du projet\n\n`;
      readme += `\`\`\`\n`;
      readme += `${safeProjectName}/\n`;
      if (isMultiFile) {
        readme += `├── main.py                  # Point d'entrée principal\n`;
      }
      exportedFiles.forEach(f => {
        readme += `├── ${f.fileName.padEnd(25)}# Écran — ${f.widgetCount} widgets\n`;
      });
      readme += `├── requirements.txt         # Dépendances Python\n`;
      readme += `├── README.md\n`;
      if (hasImages || hasCustomFonts) {
        readme += `└── Assets/\n`;
        if (hasImages) {
          readme += `    ├── Images/              # Images du projet\n`;
        }
        if (hasCustomFonts) {
          readme += `    └── Fonts/               # Polices .ttf (incluses)\n`;
        }
      }
      readme += `\`\`\`\n\n`;

      if (hasImages) {
        readme += `## Images\n\n`;
        readme += `Les images sont stockées dans \`Assets/Images/\` et chargées automatiquement.\n`;
        readme += `Vous pouvez les remplacer par d'autres images de même nom.\n\n`;
      }

      if (hasCustomFonts) {
        const fontNames = Array.from(customFontsUsed).join(', ');
        readme += `## Polices personnalisées\n\n`;
        readme += `Ce projet utilise : **${fontNames}**\n\n`;
        readme += `Les fichiers .ttf sont inclus dans \`Assets/Fonts/\` et chargés automatiquement.\n`;
        readme += `Aucune connexion internet n'est nécessaire.\n\n`;
      }

      readme += `## Détails techniques\n\n`;
      readme += `| Propriété | Valeur |\n`;
      readme += `|-----------|--------|\n`;
      readme += `| **Framework** | CustomTkinter |\n`;
      readme += `| **Fichiers Python** | ${pyFileCount} |\n`;
      readme += `| **Widgets (total)** | ${totalWidgetCount} |\n`;
      if (hasImages) {
        readme += `| **Images** | ${imageCount} (dans Assets/Images/) |\n`;
      }
      if (hasCharts) {
        readme += `| **Graphiques** | Matplotlib (FigureCanvasTkAgg) |\n`;
      }
      if (hasDatepicker) {
        readme += `| **Calendrier** | tkcalendar (DateEntry) |\n`;
      }

      readme += `\n## Personnalisation\n\n`;
      readme += `Le code généré est entièrement modifiable. Les méthodes \`maj_*\` permettent\n`;
      readme += `de mettre à jour dynamiquement les widgets composites (cartes statistiques,\n`;
      readme += `tableaux, graphiques) depuis votre logique métier ou une base de données.\n\n`;

      readme += `## Résolution des problèmes\n\n`;
      readme += `| Problème | Solution |\n`;
      readme += `|----------|----------|\n`;
      readme += `| \`ModuleNotFoundError: customtkinter\` | \`pip install customtkinter\` |\n`;
      if (needsPILZip) {
        readme += `| Images absentes ou erreur PIL | \`pip install Pillow\` |\n`;
      }
      if (hasCharts) {
        readme += `| Graphiques absents | \`pip install matplotlib\` |\n`;
      }
      if (hasDatepicker) {
        readme += `| Calendrier = champ texte | \`pip install tkcalendar\` |\n`;
      }
      if (hasCustomFonts) {
        readme += `| Police différente du design | Vérifiez les .ttf dans Assets/Fonts/ |\n`;
      }
      readme += `| Icône non affichée | Vérifiez que \`Pillow\` est installé |\n`;
      readme += `\n## Compatibilité\n\n`;
      readme += `| Système | Statut |\n`;
      readme += `|---------|--------|\n`;
      readme += `| Windows 10/11 | Entièrement supporté |\n`;
      readme += `| macOS 12+ | Entièrement supporté |\n`;
      readme += `| Linux (Ubuntu 20.04+) | Supporté (\`sudo apt install python3-tk\`) |\n`;

      readme += `\n## Licence\n\nCe code est libre d'utilisation.\n\n`;
      readme += `---\n*Généré par Notorious.PY — Le constructeur visuel d'interfaces Python CustomTkinter*\n`;
      folder.file('README.md', readme);

      // ── requirements.txt ──
      const requirements = ['customtkinter>=5.2.0'];
      if (needsPILZip) requirements.push('Pillow>=10.0.0');
      if (needsRequestsZip) requirements.push('requests>=2.28.0');
      if (allWidgets.some(w => w.type === 'chart')) requirements.push('matplotlib>=3.7.0');
      if (allWidgets.some(w => w.type === 'datepicker')) requirements.push('tkcalendar>=1.6.1');
      folder.file('requirements.txt', requirements.join('\n') + '\n');

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeProjectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Projet exporté : ${safeProjectName}.zip (${pyFileCount} fichier${pyFileCount > 1 ? 's' : ''} Python)`);
    } catch (err) {
      console.error('ZIP export error:', err);
      toast.error("Erreur lors de l'exportation ZIP");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border-0 bg-gradient-to-b from-slate-50 to-white dark:from-[#0c1425] dark:to-[#0a111e] shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
        {/* Premium gradient header */}
        <div className="relative overflow-hidden rounded-t-2xl -mx-6 -mt-6 mb-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 opacity-95" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDgpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative px-8 py-6">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg">
                  <Code2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white tracking-tight">
                    Exporter le Code Python
                  </DialogTitle>
                  <DialogDescription className="text-violet-100/80 text-sm mt-0.5">
                    Projet : <span className="font-semibold text-white/90">{projectName}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Stats pills */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 text-white/90 text-xs font-medium">
                <FileCode2 className="h-3.5 w-3.5" />
                <span>{currentFile.lineCount} lignes</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 text-white/90 text-xs font-medium">
                <Package className="h-3.5 w-3.5" />
                <span>{totalWidgetCount} widgets</span>
              </div>
              {imageCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 text-white/90 text-xs font-medium">
                  <Image className="h-3.5 w-3.5" />
                  <span>{imageCount} image{imageCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 text-white/90 text-xs font-medium">
                <FileText className="h-3.5 w-3.5" />
                <span>{totalFiles} fichiers dans le ZIP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Code preview area */}
        <div className="flex-1 my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#1a1a2e] border-b border-slate-200 dark:border-white/10">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <span className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            {/* File tabs for multi-file export */}
            {isMultiFile ? (
              <div className="flex items-center gap-1 ml-2 overflow-x-auto">
                {exportedFiles.map((f, idx) => (
                  <button
                    key={f.fileName}
                    onClick={() => setActiveTab(idx)}
                    className={`px-2.5 py-0.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap ${
                      activeTab === idx
                        ? 'bg-violet-600/80 text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {f.fileName}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">{currentFile.fileName}</span>
            )}
          </div>
          <ScrollArea className="bg-[#1e1e1e]" style={{ maxHeight: 'calc(90vh - 320px)' }}>
            <CodeSyntaxHighlighter code={currentFile.code} />
          </ScrollArea>
        </div>

        {/* Footer with actions */}
        <DialogFooter className="pt-4 border-t border-slate-200 dark:border-white/10 flex-row gap-3 justify-between sm:justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500 self-center hidden sm:block">
            CustomTkinter &middot; {canvasSettings.width}x{canvasSettings.height}
          </p>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copié !' : 'Copier'}
            </Button>
            <Button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 dark:shadow-violet-600/30 transition-all disabled:opacity-60"
            >
              <FolderArchive className="h-4 w-4" />
              {isZipping ? 'Compression...' : `${safeProjectName}.zip`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
