import React, { useMemo, useState, useCallback } from 'react';
import { useWidgets } from '@/contexts/WidgetContext';
import { useExportPython } from '@/hooks/useExportPython';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Copy, Check, Download, Package, FileCode2, Zap } from 'lucide-react';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const CodeView: React.FC = () => {
  const { widgets, canvasSettings } = useWidgets();
  const { exportToPython } = useExportPython();
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const pythonCode = exportToPython(widgets, canvasSettings);
  const isDark = resolvedTheme === 'dark';

  const stats = useMemo(() => ({
    lines: pythonCode.split('\n').length,
    widgets: widgets.length,
    chars: pythonCode.length,
  }), [pythonCode, widgets.length]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(pythonCode).then(() => {
      setCopied(true);
      toast.success('Code copié !');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Impossible de copier');
    });
  }, [pythonCode]);

  const handleSaveFile = useCallback(() => {
    const blob = new Blob([pythonCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Fichier app.py téléchargé !');
  }, [pythonCode]);

  return (
    <div className={`w-full h-full flex flex-col ${isDark ? 'bg-[#1E1E1E]' : 'bg-[#F5F5F5]'}`}>
      {/* Header with stats and actions */}
      <div className={`px-4 py-3 border-b shrink-0 ${
        isDark ? 'border-white/10' : 'border-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-800'}`} />
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Live Preview
            </h2>
            <div className="flex items-center gap-1 ml-1">
              <Zap className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-500 font-medium">LIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isDark
                  ? 'hover:bg-white/10 text-slate-300'
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="Copier le code"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={handleSaveFile}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isDark
                  ? 'hover:bg-white/10 text-slate-300'
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="Télécharger app.py"
            >
              <Download className="h-3.5 w-3.5" />
              app.py
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 mt-2">
          <div className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            <FileCode2 className="h-3 w-3" />
            <span>{stats.lines} lignes</span>
          </div>
          <div className={`flex items-center gap-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            <Package className="h-3 w-3" />
            <span>{stats.widgets} widgets</span>
          </div>
          <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {(stats.chars / 1024).toFixed(1)} KB
          </div>
        </div>
      </div>

      {/* Code area — auto-updates on every canvas change */}
      <ScrollArea className="flex-1">
        <CodeSyntaxHighlighter code={pythonCode} />
      </ScrollArea>
    </div>
  );
};

export { CodeView };
export default CodeView;
