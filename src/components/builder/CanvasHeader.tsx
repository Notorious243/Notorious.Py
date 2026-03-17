import React, { useState, useRef, useEffect } from 'react';
import { useWidgets } from '@/contexts/WidgetContext';
import { Grid2X2 } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useTheme } from 'next-themes';

export const CanvasHeader: React.FC = () => {
  const { canvasSettings, updateCanvasSettings, previewMode } = useWidgets();
  const isPreview = previewMode === 'preview';
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(canvasSettings.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleClick = () => {
    setIsEditing(true);
    setTempTitle(canvasSettings.title);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (tempTitle.trim()) {
      updateCanvasSettings({ title: tempTitle.trim() });
    } else {
      setTempTitle(canvasSettings.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempTitle(canvasSettings.title);
    }
  };

  // Déterminer la couleur par défaut en fonction du thème
  const getDefaultHeaderColor = () => {
    if (canvasSettings.headerBackgroundColor) {
      return canvasSettings.headerBackgroundColor;
    }
    return theme === 'dark' ? '#1f1f1f' : '#f1f5f9';
  };
  const iconSource = canvasSettings.icon_data || canvasSettings.icon_path;

  return (
    <div 
      className="h-10 rounded-t-lg grid grid-cols-3 items-center px-4 border-b border-slate-200 dark:border-zinc-800"
      style={{ 
        backgroundColor: getDefaultHeaderColor()
      }}
    >
      <div className="flex items-center gap-2 justify-self-start">
        {iconSource ? (
          <img 
            src={iconSource} 
            alt="Icône de l'application" 
            className="w-5 h-5 rounded object-contain"
          />
        ) : (
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-black/5"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-black/5"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-black/5"></div>
          </div>
        )}
      </div>
      
      {isEditing && !isPreview ? (
        <input
          ref={inputRef}
          type="text"
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleKeyDown}
          className="text-sm text-center bg-white dark:bg-zinc-800 border border-violet-500 rounded px-2 py-0.5 outline-none justify-self-center text-slate-700 dark:text-slate-200 shadow-sm"
          style={{ 
            fontWeight: canvasSettings.titleFontWeight,
            fontFamily: 'Poppins, sans-serif',
            minWidth: '200px',
            maxWidth: '300px'
          }}
        />
      ) : (
        <p 
          className={`text-sm font-medium text-slate-700 dark:text-slate-200 justify-self-center px-3 py-1 rounded transition-colors ${isPreview ? 'cursor-default' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/10'}`}
          style={{ 
            fontWeight: canvasSettings.titleFontWeight,
            fontFamily: 'Poppins, sans-serif'
          }}
          onClick={isPreview ? undefined : handleTitleClick}
          title={isPreview ? undefined : "Renommer l'application"}
        >
          {canvasSettings.title}
        </p>
      )}
      
      <div className="flex items-center gap-3 text-sm font-medium text-slate-400 justify-self-end">
        {!isPreview && (
          <Toggle
            size="sm"
            pressed={canvasSettings.gridVisible}
            onPressedChange={(pressed) => updateCanvasSettings({ gridVisible: pressed })}
            aria-label="Afficher/Masquer la grille"
            className="h-7 w-7 data-[state=on]:bg-slate-200 dark:data-[state=on]:bg-zinc-800 text-slate-500"
          >
            <Grid2X2 className="w-4 h-4" />
          </Toggle>
        )}
      </div>
    </div>
  );
};
