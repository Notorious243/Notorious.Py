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
import { useWidgets } from '@/contexts/WidgetContext';
import { useProjects } from '@/contexts/ProjectContext';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useExportPython, buildWidgetVarNameMap } from '@/hooks/useExportPython';
import {
  Copy,
  Check,
  FolderArchive,
  FileCode2,
  Image,
  Code2,
  LayoutPanelTop,
  Layers3,
  Files,
  ChevronLeft,
  ChevronRight,
  FolderClosed,
  FolderOpen,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';
import { InteractiveWidget } from './InteractiveWidget';
import JSZip from 'jszip';
import { motion } from 'framer-motion';
import type { CanvasSettings, WidgetData } from '@/types/widget';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

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
  imageCount: number;
  previewWidgets: WidgetData[];
  previewCanvasSettings: CanvasSettings;
}

interface ExportImageAsset {
  id: string;
  name: string;
  dataUrl: string;
  sourceFileName: string;
}

const isImageWidget = (widget: WidgetData) =>
  (widget.type === 'image_label' && !!widget.properties?.image_data) ||
  (widget.type === 'productCard' && !!widget.properties?.imageData) ||
  (widget.type === 'userProfile' && !!widget.properties?.avatarData);

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

const TreeCheckbox = ({
  checked,
  indeterminate = false,
  onCheckedChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
      className="h-4 w-4 shrink-0 rounded border-[#9bb0d2] text-[#2f6bb2] focus:ring-[#2f6bb2]"
    />
  );
};

const FolderBadge = ({
  isOpen,
  tone,
}: {
  isOpen: boolean;
  tone: 'project' | 'images';
}) => (
  <span
    className={`inline-flex h-5 w-5 items-center justify-center rounded-md ${
      tone === 'project' ? 'bg-[#3b82f6]' : 'bg-[#f59e0b]'
    } text-white`}
  >
    {isOpen ? <FolderOpen className="h-3.5 w-3.5" /> : <FolderClosed className="h-3.5 w-3.5" />}
  </span>
);

const AdaptiveDesignPreview = ({ file }: { file: ExportedFile }) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = React.useState({ width: 1, height: 1 });

  React.useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.max(1, Math.floor(entry.contentRect.width));
      const height = Math.max(1, Math.floor(entry.contentRect.height));
      setViewportSize({ width, height });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const rootKey = '__root__';
  const byParent = new Map<string, WidgetData[]>();

  file.previewWidgets.forEach((widget) => {
    const key = widget.parentId ?? rootKey;
    const group = byParent.get(key) ?? [];
    group.push(widget);
    byParent.set(key, group);
  });

  const renderWidgetTree = (widget: WidgetData, parentX = 0, parentY = 0): React.ReactNode => {
    const children = byParent.get(widget.id) ?? [];
    const left = widget.position.x - parentX;
    const top = widget.position.y - parentY;

    return (
      <div
        key={widget.id}
        style={{
          position: 'absolute',
          left,
          top,
          width: widget.size.width,
          height: widget.size.height,
        }}
      >
        <InteractiveWidget
          widget={widget}
          isPreviewMode={false}
          hasChildren={children.length > 0}
          childElements={children.map((child) => renderWidgetTree(child, widget.position.x, widget.position.y))}
        />
      </div>
    );
  };

  const roots = byParent.get(rootKey) ?? [];
  const canvasW = Math.max(file.previewCanvasSettings.width || 1, 1);
  const canvasH = Math.max(file.previewCanvasSettings.height || 1, 1);

  const gutterX = 20;
  const gutterY = 20;
  const fitRatio = 0.92;
  const maxScale = 1;

  const availableWidth = Math.max(1, viewportSize.width - gutterX);
  const availableHeight = Math.max(1, viewportSize.height - gutterY);
  const baseScale = Math.min(availableWidth / canvasW, availableHeight / canvasH);
  const calibratedScale = baseScale * fitRatio;
  const scale = Math.min(maxScale, calibratedScale);
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const scaledWidth = Math.max(1, Math.floor(canvasW * safeScale));
  const scaledHeight = Math.max(1, Math.floor(canvasH * safeScale));

  return (
    <div ref={viewportRef} className="relative h-full w-full overflow-hidden">
      <div className="absolute left-1/2 top-1/2" style={{ width: scaledWidth, height: scaledHeight, transform: 'translate(-50%, -50%)' }}>
        <div
          className="absolute left-0 top-0 overflow-hidden rounded-[10px] border border-[#d6dfec] shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `scale(${safeScale})`,
            transformOrigin: 'top left',
            backgroundColor: file.previewCanvasSettings.backgroundColor || '#f8faff',
          }}
        >
          {roots.map((widget) => renderWidgetTree(widget))}
        </div>
        {roots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-white/75 text-sm font-medium text-[#94a3b8]">
            Aucun widget sur cette interface
          </div>
        )}
      </div>
    </div>
  );
};

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onOpenChange }) => {
  const { widgets, canvasSettings, activeFileId } = useWidgets();
  const { projects, activeProjectId } = useProjects();
  const { getNode, getPyFiles } = useFileSystem();
  const { exportToPython } = useExportPython();
  const [copied, setCopied] = React.useState(false);
  const [isZipping, setIsZipping] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [previewMode, setPreviewMode] = React.useState<'code' | 'design'>('code');
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const [fileSelection, setFileSelection] = React.useState<Record<string, boolean>>({});
  const [imageSelection, setImageSelection] = React.useState<Record<string, boolean>>({});
  const [treeOpen, setTreeOpen] = React.useState({ code: true, images: true });

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
      const widgetImageCount = widgets.filter(isImageWidget).length;
      const canvasImageCount = Number(!!canvasSettings.icon_data) + Number(!!canvasSettings.background_image_data);
      return [{
        fileName: pyFileName,
        code,
        widgetCount: widgets.length,
        lineCount: code.split('\n').length,
        imageCount: widgetImageCount + canvasImageCount,
        previewWidgets: widgets,
        previewCanvasSettings: canvasSettings,
      }];
    }

    return allFiles.map(file => {
      const pyName = file.name.toLowerCase().endsWith('.py') ? file.name : `${file.name}.py`;
      let fileWidgets: WidgetData[] = widgets;
      let fileCanvasSettings: CanvasSettings = canvasSettings;

      // Parse le contenu du fichier pour extraire ses propres widgets
      if (file.content) {
        try {
          const parsed = JSON.parse(file.content);
          if (Array.isArray(parsed.widgets)) fileWidgets = parsed.widgets as WidgetData[];
          if (parsed.canvasSettings) fileCanvasSettings = { ...canvasSettings, ...parsed.canvasSettings };
        } catch { /* utiliser les widgets par défaut */ }
      }

      // Si c'est le fichier actif, utiliser les widgets en mémoire (potentiellement non sauvés)
      if (file.id === activeFileId) {
        fileWidgets = widgets;
        fileCanvasSettings = canvasSettings;
      }

      const code = exportToPython(fileWidgets, fileCanvasSettings);
      const widgetImageCount = fileWidgets.filter(isImageWidget).length;
      const canvasImageCount = Number(!!fileCanvasSettings.icon_data) + Number(!!fileCanvasSettings.background_image_data);
      return {
        fileName: pyName,
        code,
        widgetCount: fileWidgets.length,
        lineCount: code.split('\n').length,
        imageCount: widgetImageCount + canvasImageCount,
        previewWidgets: fileWidgets,
        previewCanvasSettings: fileCanvasSettings,
      };
    });
  }, [getPyFiles, activeFileId, getNode, widgets, canvasSettings, exportToPython]);

  const hasMultipleSlides = exportedFiles.length > 1;
  const currentFile = exportedFiles[activeTab] || exportedFiles[0];

  React.useEffect(() => {
    setFileSelection((previous) => {
      const next: Record<string, boolean> = {};
      exportedFiles.forEach((file) => {
        next[file.fileName] = previous[file.fileName] ?? true;
      });
      return next;
    });
  }, [exportedFiles]);

  const selectedPyFiles = React.useMemo(
    () => exportedFiles.filter((file) => fileSelection[file.fileName] ?? true),
    [exportedFiles, fileSelection]
  );

  const allPreviewWidgets = React.useMemo<WidgetData[]>(
    () => exportedFiles.flatMap((file) => file.previewWidgets),
    [exportedFiles]
  );

  const idToVarName = React.useMemo(
    () => buildWidgetVarNameMap(allPreviewWidgets),
    [allPreviewWidgets]
  );

  const exportImageAssets = React.useMemo<ExportImageAsset[]>(() => {
    const assets: ExportImageAsset[] = [];

    exportedFiles.forEach((file, fileIndex) => {
      const canvasSuffix = fileIndex === 0 ? '' : `_${fileIndex}`;

      if (file.previewCanvasSettings.icon_data) {
        assets.push({
          id: `canvas:${file.fileName}:icon`,
          name: fileIndex === 0 ? 'icon.png' : `icon${canvasSuffix}.png`,
          dataUrl: file.previewCanvasSettings.icon_data,
          sourceFileName: file.fileName,
        });
      }

      if (file.previewCanvasSettings.background_image_data) {
        assets.push({
          id: `canvas:${file.fileName}:background`,
          name: fileIndex === 0 ? 'background.png' : `background${canvasSuffix}.png`,
          dataUrl: file.previewCanvasSettings.background_image_data,
          sourceFileName: file.fileName,
        });
      }

      file.previewWidgets.forEach((widget) => {
        const varName = idToVarName[widget.id] || widget.type;

        if (widget.type === 'image_label' && widget.properties?.image_data) {
          assets.push({
            id: `widget:${file.fileName}:${widget.id}:image`,
            name: `image_${varName}.png`,
            dataUrl: widget.properties.image_data,
            sourceFileName: file.fileName,
          });
        }

        if (widget.type === 'productCard' && widget.properties?.imageData) {
          assets.push({
            id: `widget:${file.fileName}:${widget.id}:product`,
            name: `image_${varName}.png`,
            dataUrl: widget.properties.imageData,
            sourceFileName: file.fileName,
          });
        }

        if (widget.type === 'userProfile' && widget.properties?.avatarData) {
          assets.push({
            id: `widget:${file.fileName}:${widget.id}:avatar`,
            name: `avatar_${varName}.png`,
            dataUrl: widget.properties.avatarData,
            sourceFileName: file.fileName,
          });
        }
      });
    });

    return assets;
  }, [exportedFiles, idToVarName]);

  React.useEffect(() => {
    setImageSelection((previous) => {
      const next: Record<string, boolean> = {};
      exportImageAssets.forEach((asset) => {
        next[asset.id] = previous[asset.id] ?? true;
      });
      return next;
    });
  }, [exportImageAssets]);

  const selectedImageAssets = React.useMemo(
    () => exportImageAssets.filter((asset) => imageSelection[asset.id] ?? true),
    [exportImageAssets, imageSelection]
  );

  const selectedPyCount = selectedPyFiles.length;
  const selectedImageCount = selectedImageAssets.length;

  const imagesFolderChecked = exportImageAssets.length > 0 && selectedImageCount === exportImageAssets.length;
  const imagesFolderIndeterminate = selectedImageCount > 0 && selectedImageCount < exportImageAssets.length;

  React.useEffect(() => {
    if (activeTab > exportedFiles.length - 1) {
      setActiveTab(0);
    }
  }, [activeTab, exportedFiles.length]);

  React.useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setActiveTab(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on('select', onSelect);
    carouselApi.on('reInit', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
      carouselApi.off('reInit', onSelect);
    };
  }, [carouselApi]);

  const handleSelectFile = React.useCallback((index: number) => {
    setActiveTab(index);
    carouselApi?.scrollTo(index);
  }, [carouselApi]);

  const setFileChecked = React.useCallback((fileName: string, checked: boolean) => {
    setFileSelection((previous) => ({ ...previous, [fileName]: checked }));
  }, []);

  const setImageChecked = React.useCallback((imageId: string, checked: boolean) => {
    setImageSelection((previous) => ({ ...previous, [imageId]: checked }));
  }, []);

  const setCodeFolderChecked = React.useCallback((checked: boolean) => {
    setFileSelection(() =>
      Object.fromEntries(exportedFiles.map((file) => [file.fileName, checked]))
    );
  }, [exportedFiles]);

  const setImagesFolderChecked = React.useCallback((checked: boolean) => {
    setImageSelection(() =>
      Object.fromEntries(exportImageAssets.map((asset) => [asset.id, checked]))
    );
  }, [exportImageAssets]);

  const setAllNodesChecked = React.useCallback((checked: boolean) => {
    setCodeFolderChecked(checked);
    setImagesFolderChecked(checked);
  }, [setCodeFolderChecked, setImagesFolderChecked]);

  const totalSelectableCount = exportedFiles.length + exportImageAssets.length;
  const selectedSelectableCount = selectedPyCount + selectedImageCount;
  const rootFolderChecked = totalSelectableCount > 0 && selectedSelectableCount === totalSelectableCount;
  const rootFolderIndeterminate = selectedSelectableCount > 0 && selectedSelectableCount < totalSelectableCount;

  const requiredImageAssetIdsForSelectedPy = React.useMemo(() => {
    const selectedNames = new Set(selectedPyFiles.map((file) => file.fileName));
    const required = new Set<string>();

    exportedFiles.forEach((file) => {
      if (!selectedNames.has(file.fileName)) return;

      if (file.previewCanvasSettings.icon_data) {
        required.add(`canvas:${file.fileName}:icon`);
      }
      if (file.previewCanvasSettings.background_image_data) {
        required.add(`canvas:${file.fileName}:background`);
      }

      file.previewWidgets.forEach((widget) => {
        if (widget.type === 'image_label' && widget.properties?.image_data) {
          required.add(`widget:${file.fileName}:${widget.id}:image`);
        }
        if (widget.type === 'productCard' && widget.properties?.imageData) {
          required.add(`widget:${file.fileName}:${widget.id}:product`);
        }
        if (widget.type === 'userProfile' && widget.properties?.avatarData) {
          required.add(`widget:${file.fileName}:${widget.id}:avatar`);
        }
      });
    });

    return required;
  }, [selectedPyFiles, exportedFiles]);

  const uncheckedRequiredImageCount = React.useMemo(
    () => Array.from(requiredImageAssetIdsForSelectedPy).filter((id) => !(imageSelection[id] ?? true)).length,
    [requiredImageAssetIdsForSelectedPy, imageSelection]
  );

  const selectedCanvasSettings = React.useMemo<CanvasSettings[]>(
    () => selectedPyFiles.map((file) => file.previewCanvasSettings),
    [selectedPyFiles]
  );

  const selectedWidgets = React.useMemo<WidgetData[]>(
    () => selectedPyFiles.flatMap((file) => file.previewWidgets),
    [selectedPyFiles]
  );

  const totalWidgetCount = selectedPyFiles.reduce((sum, file) => sum + file.widgetCount, 0);
  const totalLineCount = selectedPyFiles.reduce((sum, file) => sum + file.lineCount, 0);
  const imageCount = selectedImageCount;

  const pyFileCount = selectedPyCount + (selectedPyCount >= 2 ? 1 : 0);

  const STANDARD_FONTS = new Set([
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia',
    'Verdana', 'Tahoma', 'Trebuchet MS', 'Segoe UI', 'San Francisco',
    'system-ui', 'sans-serif', 'serif', 'monospace', 'Roboto',
  ]);
  const customFontsUsed = new Set<string>();
  selectedWidgets.forEach(w => {
    [w.style?.fontFamily, w.properties?.font?.[0], w.properties?.nameFont, w.properties?.fontFamily]
      .filter(Boolean)
      .forEach((f: any) => { if (!STANDARD_FONTS.has(f)) customFontsUsed.add(f); });
  });
  const hasCustomFonts = customFontsUsed.size > 0;
  const totalFiles = selectedPyCount === 0 ? 0 : pyFileCount + imageCount + 2 + (hasCustomFonts ? 1 : 0);

  const toggleFolder = React.useCallback((key: 'code' | 'images') => {
    setTreeOpen((previous) => ({ ...previous, [key]: !previous[key] }));
  }, []);

  // ── Générer le main.py orchestrateur si multi-fichier ──
  const mainPyCode = React.useMemo(() => {
    if (selectedPyFiles.length < 2) return null;
    const imports = selectedPyFiles.map(f => {
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
    code += `    lancer_ecran("${selectedPyFiles[0].fileName}")\n`;
    return code;
  }, [selectedPyFiles, projectName]);

  const handleCopy = () => {
    if (!currentFile) return;
    const textToCopy = currentFile.code;
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
    if (selectedPyFiles.length === 0) {
      toast.error('Sélectionnez au moins un fichier à exporter.');
      return;
    }

    if (uncheckedRequiredImageCount > 0) {
      toast.warning(`${uncheckedRequiredImageCount} image(s) référencée(s) ne seront pas incluses dans le ZIP.`);
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(safeProjectName)!;

      // ── Ajouter tous les fichiers .py ──
      selectedPyFiles.forEach(f => folder.file(f.fileName, f.code));

      // Ajouter le main.py orchestrateur si multi-fichier
      if (mainPyCode) folder.file('main.py', mainPyCode);

      const entryPoint = selectedPyFiles.length >= 2 ? 'main.py' : selectedPyFiles[0].fileName;

      // ── Ajouter les images dans Assets/Images/ ──
      if (selectedImageAssets.length > 0) {
        const assetsImages = folder.folder('Assets')!.folder('Images')!;
        selectedImageAssets.forEach((asset) => {
          try {
            const imageBytes = dataUrlToUint8Array(asset.dataUrl);
            assetsImages.file(asset.name, imageBytes);
          } catch {
            // skip invalid image
          }
        });
      }

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
      const hasCharts = selectedWidgets.some(w => w.type === 'chart');
      const hasDatepicker = selectedWidgets.some(w => w.type === 'datepicker');
      const hasImages = imageCount > 0;
      const needsPILZip = selectedCanvasSettings.some(cs => cs.icon_data || cs.background_image_data)
        || selectedWidgets.some(w => ['image_label', 'productCard', 'userProfile'].includes(w.type));
      const needsRequestsZip = selectedWidgets.some(w => w.type === 'image_label' && w.properties?.image_path && !w.properties?.image_data);

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
      if (selectedPyFiles.length >= 2) {
        readme += `├── main.py                  # Point d'entrée principal\n`;
      }
      selectedPyFiles.forEach(f => {
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
      if (selectedWidgets.some(w => w.type === 'chart')) requirements.push('matplotlib>=3.7.0');
      if (selectedWidgets.some(w => w.type === 'datepicker')) requirements.push('tkcalendar>=1.6.1');
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

  const selectedCount = selectedPyFiles.length;
  const canGoPrev = activeTab > 0;
  const canGoNext = activeTab < exportedFiles.length - 1;
  const handlePrev = () => carouselApi?.scrollPrev();
  const handleNext = () => carouselApi?.scrollNext();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[53%] h-[calc(100vh-110px)] max-h-[calc(100vh-110px)] max-w-6xl overflow-hidden rounded-2xl border border-[#d6deec] bg-[#f4f7fe] p-0 shadow-[0_24px_64px_rgba(15,23,42,0.25)] [&>button]:right-3 [&>button]:top-3 [&>button]:rounded-md [&>button]:border [&>button]:border-white/25 [&>button]:bg-white/10 [&>button]:text-white [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:hover:bg-white/20 [&>button>svg]:h-5 [&>button>svg]:w-5"
      >
        <div className="relative flex h-full flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.13),transparent_28%),radial-gradient(circle_at_88%_90%,rgba(37,99,235,0.1),transparent_32%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative overflow-hidden border-b border-[#d6deec]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#1d4d8f] via-[#255ea3] to-[#2f6bb2]" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.14)_0%,transparent_45%,rgba(255,255,255,0.1)_100%)]" />
            <div className="relative px-6 py-5 text-white">
              <DialogHeader className="space-y-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/15 backdrop-blur-sm">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-[22px] font-bold tracking-tight">Exporter le Code Python</DialogTitle>
                      <DialogDescription className="mt-0.5 text-sm text-blue-100/95">
                        Projet : <span className="font-semibold text-white">{projectName}</span>
                      </DialogDescription>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { icon: FileCode2, label: 'Lignes de code', value: totalLineCount },
                  { icon: Layers3, label: 'Widgets', value: totalWidgetCount },
                  { icon: Image, label: 'Images', value: imageCount },
                  { icon: Files, label: 'Fichiers ZIP', value: totalFiles },
                  { icon: LayoutPanelTop, label: 'Interfaces', value: exportedFiles.length },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/14 px-3 py-2 backdrop-blur-sm"
                  >
                    <item.icon className="h-4 w-4 text-white/90" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-blue-100/85">{item.label}</p>
                      <p className="text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="relative grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden p-4">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="rounded-xl border border-[#d7deeb] bg-white/90 px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-[#e8eefb] px-2.5 py-1 text-[11px] font-semibold text-[#2a5288]">
                    {currentFile.fileName}
                  </span>
                  <span className="text-xs text-[#60739a]">
                    Interface {activeTab + 1}/{exportedFiles.length}
                  </span>
                </div>

                <div className="justify-self-center inline-flex items-center rounded-lg border border-[#cfdbef] bg-[#f6f9ff] p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('design')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      previewMode === 'design'
                        ? 'bg-[#2f6bb2] text-white shadow-sm'
                        : 'text-[#5f7397] hover:bg-[#e7eefc]'
                    }`}
                  >
                    Interface
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('code')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      previewMode === 'code'
                        ? 'bg-[#2f6bb2] text-white shadow-sm'
                        : 'text-[#5f7397] hover:bg-[#e7eefc]'
                    }`}
                  >
                    Code
                  </button>
                </div>
                <div />
              </div>
            </motion.div>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="min-h-0 overflow-hidden"
            >
              {previewMode === 'design' ? (
                <div className="grid h-full min-h-0 grid-cols-[280px_minmax(0,1fr)] gap-3 overflow-hidden">
                  <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#d7deeb] bg-white/92 p-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                    <div className="mb-2 rounded-xl border border-[#d6dfec] bg-[#f8faff] px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e8eefb] text-[#2f6bb2]">
                            <PythonIcon className="h-4 w-4" />
                          </span>
                          <span className="truncate text-xs font-semibold text-[#274777]">{projectName}</span>
                        </div>
                        <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#496899]">
                          <TreeCheckbox
                            checked={rootFolderChecked}
                            indeterminate={rootFolderIndeterminate}
                            onCheckedChange={setAllNodesChecked}
                          />
                          Tous les fichiers
                        </label>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:#8ea2c6_#eaf0fa] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8ea2c6] [&::-webkit-scrollbar-track]:bg-[#eaf0fa]">
                      <div className="rounded-xl border border-[#d7deeb] bg-[#f9fbff]">
                        <div className="flex items-center gap-2 px-2 py-2">
                          <button
                            type="button"
                            onClick={() => toggleFolder('code')}
                            className="rounded p-0.5 text-[#5e7499] hover:bg-[#eaf0fb]"
                          >
                            <ChevronRight className={`h-4 w-4 transition-transform ${treeOpen.code ? 'rotate-90' : ''}`} />
                          </button>
                          <FolderBadge isOpen={treeOpen.code} tone="project" />
                          <span className="truncate text-xs font-semibold text-[#2f4f7f]">{projectName}</span>
                          <span className="ml-auto text-[11px] font-semibold text-[#5f7397]">
                            {selectedSelectableCount}/{totalSelectableCount}
                          </span>
                        </div>

                        {treeOpen.code && (
                          <div className="space-y-1 px-2 pb-2 pl-8">
                            {exportImageAssets.length > 0 && (
                              <div>
                                <div className="relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-[#eef3ff]">
                                  <button
                                    type="button"
                                    onClick={() => toggleFolder('images')}
                                    className="absolute -left-4 rounded p-0.5 text-[#5e7499] hover:bg-[#eaf0fb]"
                                  >
                                    <ChevronRight className={`h-4 w-4 transition-transform ${treeOpen.images ? 'rotate-90' : ''}`} />
                                  </button>
                                  <div onClick={(event) => event.stopPropagation()}>
                                    <TreeCheckbox
                                      checked={imagesFolderChecked}
                                      indeterminate={imagesFolderIndeterminate}
                                      onCheckedChange={setImagesFolderChecked}
                                    />
                                  </div>
                                  <FolderBadge isOpen={treeOpen.images} tone="images" />
                                  <span className="text-xs font-semibold text-[#2f4f7f]">Images</span>
                                  <span className="ml-auto text-[11px] font-semibold text-[#5f7397]">
                                    {selectedImageCount}/{exportImageAssets.length}
                                  </span>
                                </div>

                                {treeOpen.images && (
                                  <div className="space-y-1 pl-8">
                                    {exportImageAssets.map((asset) => {
                                      const checked = imageSelection[asset.id] ?? true;
                                      return (
                                        <div
                                          key={asset.id}
                                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#eef3ff]"
                                        >
                                          <TreeCheckbox
                                            checked={checked}
                                            onCheckedChange={(value) => setImageChecked(asset.id, value)}
                                          />
                                          <ImageIcon className="h-4 w-4 text-[#6c85ad]" />
                                          <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-[#51678f]">{asset.name}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                            {exportedFiles.map((file, index) => {
                              const checked = fileSelection[file.fileName] ?? true;
                              const isActive = activeTab === index;
                              return (
                                <button
                                  key={file.fileName}
                                  type="button"
                                  onClick={() => handleSelectFile(index)}
                                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                                    isActive ? 'bg-[#e8f0ff]' : 'hover:bg-[#eef3ff]'
                                  }`}
                                >
                                  <div onClick={(event) => event.stopPropagation()}>
                                    <TreeCheckbox
                                      checked={checked}
                                      onCheckedChange={(value) => setFileChecked(file.fileName, value)}
                                    />
                                  </div>
                                  <PythonIcon className="h-4 w-4 text-[#3f67a8]" />
                                  <span className={`truncate text-xs font-medium ${isActive ? 'text-[#25518f]' : 'text-[#51678f]'}`}>
                                    {file.fileName}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </aside>

                  <div className="min-h-0 overflow-hidden">
                    <div className="h-full w-full overflow-hidden rounded-2xl border border-[#d7deeb] bg-white/92 p-1 shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
                      <div className="grid h-full min-h-0 grid-cols-[36px_minmax(0,1fr)_36px] items-stretch gap-1.5 overflow-hidden">
                        <div className="flex items-center justify-center">
                          {hasMultipleSlides && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handlePrev}
                              disabled={!canGoPrev}
                              className="h-9 w-9 rounded-full border border-[#1f4f93] bg-[#2f6bb2] text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] hover:bg-[#245da1] disabled:opacity-45 disabled:bg-[#9ab5db] disabled:text-white"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="min-h-0 min-w-0 overflow-x-hidden overflow-y-hidden">
                          <Carousel
                            setApi={setCarouselApi}
                            opts={{ align: 'start', loop: false, containScroll: 'trimSnaps' }}
                            className="h-full w-full min-w-0 overflow-hidden"
                          >
                            <CarouselContent className="-ml-0 h-full">
                              {exportedFiles.map((file) => (
                                <CarouselItem key={file.fileName} className="h-full min-h-0 basis-full pl-0">
                                  <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-[#d7deeb] bg-white">
                                    <div className="flex items-center justify-between border-b border-[#e0e7f4] bg-[#f5f8ff] px-2.5 py-2">
                                      <div className="flex items-center gap-2">
                                        <PythonIcon className="h-4 w-4 text-[#426ba4]" />
                                        <span className="text-xs font-semibold text-[#355f98]">{file.fileName}</span>
                                      </div>
                                      <span className="text-xs text-[#60739a]">
                                        {file.previewCanvasSettings.width}×{file.previewCanvasSettings.height}
                                      </span>
                                    </div>
                                    <div className="min-h-0 overflow-hidden bg-[#f7f9ff] p-0">
                                      <div className="h-full w-full">
                                        <AdaptiveDesignPreview file={file} />
                                      </div>
                                    </div>
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                          </Carousel>
                        </div>

                        <div className="flex items-center justify-center">
                          {hasMultipleSlides && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handleNext}
                              disabled={!canGoNext}
                              className="h-9 w-9 rounded-full border border-[#1f4f93] bg-[#2f6bb2] text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] hover:bg-[#245da1] disabled:opacity-45 disabled:bg-[#9ab5db] disabled:text-white"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto h-full w-full max-w-[860px] overflow-hidden rounded-2xl border border-[#d7deeb] bg-white/92 p-2 shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
                  <div className="grid h-full min-h-0 grid-cols-[38px_minmax(0,1fr)_38px] items-stretch gap-2 overflow-hidden">
                    <div className="flex items-center justify-center">
                      {hasMultipleSlides && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handlePrev}
                          disabled={!canGoPrev}
                          className="h-9 w-9 rounded-full border border-[#1f4f93] bg-[#2f6bb2] text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] hover:bg-[#245da1] disabled:opacity-45 disabled:bg-[#9ab5db] disabled:text-white"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="min-h-0 min-w-0 overflow-hidden">
                      <Carousel
                        setApi={setCarouselApi}
                        opts={{ align: 'start', loop: false, containScroll: 'trimSnaps' }}
                        className="h-full w-full min-w-0 overflow-hidden"
                      >
                        <CarouselContent className="-ml-0 h-full">
                          {exportedFiles.map((file) => (
                            <CarouselItem key={file.fileName} className="h-full min-h-0 basis-full pl-0">
                              <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-[#d7deeb] bg-white">
                                <div className="flex items-center justify-between border-b border-[#e0e7f4] bg-[#f5f8ff] px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                      <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                                      <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                                      <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                                    </div>
                                    <span className="text-xs font-mono text-[#60739a]">{file.fileName}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-[#355f98]">{file.lineCount} lignes</span>
                                </div>
                                <div className="min-h-0 overflow-hidden bg-[#0b1220]">
                                  <div className="h-full overflow-y-auto overflow-x-hidden [scrollbar-color:#5f78a8_#111b30] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#5f78a8] [&::-webkit-scrollbar-track]:bg-[#111b30]">
                                    <CodeSyntaxHighlighter code={file.code} />
                                  </div>
                                </div>
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                      </Carousel>
                    </div>

                    <div className="flex items-center justify-center">
                      {hasMultipleSlides && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleNext}
                          disabled={!canGoNext}
                          className="h-9 w-9 rounded-full border border-[#1f4f93] bg-[#2f6bb2] text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] hover:bg-[#245da1] disabled:opacity-45 disabled:bg-[#9ab5db] disabled:text-white"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.section>
          </div>

          <DialogFooter className="relative border-t border-[#d7deeb] bg-white/92 px-4 py-3 sm:justify-between">
            <p className="hidden text-xs text-[#7082a5] sm:block">
              CustomTkinter &middot; {currentFile.previewCanvasSettings.width}x{currentFile.previewCanvasSettings.height}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCount === 0 && (
                <span className="text-xs font-semibold text-[#b45309]">Sélectionnez au moins un fichier à exporter.</span>
              )}
              {selectedCount > 0 && uncheckedRequiredImageCount > 0 && (
                <span className="text-xs font-semibold text-[#b45309]">
                  {uncheckedRequiredImageCount} image(s) référencée(s) sont décochées.
                </span>
              )}
              <Button
                onClick={handleCopy}
                variant="outline"
                className="gap-2 border-[#ced9ec] text-[#274777] hover:bg-[#ecf3ff]"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Code copié !' : 'Copier code'}
              </Button>
              <Button
                onClick={handleDownloadZip}
                disabled={isZipping || selectedCount === 0}
                className="gap-2 bg-gradient-to-r from-[#1d4d8f] to-[#2f6bb2] text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] hover:brightness-110"
              >
                <FolderArchive className="h-4 w-4" />
                {isZipping ? 'Compression...' : `Télécharger ${safeProjectName}.zip`}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
