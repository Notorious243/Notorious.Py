import React, { useState, useRef, useEffect } from 'react';
import { useWidgets } from '@/contexts/useWidgets';
import { Grid2X2 } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

export const CanvasHeader: React.FC = () => {
  const { canvasSettings, updateCanvasSettings, previewMode } = useWidgets();
  const isPreview = previewMode === 'preview';
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

  const getDefaultHeaderColor = () => {
    if (canvasSettings.headerBackgroundColor) {
      return canvasSettings.headerBackgroundColor;
    }
    return '#F3F6FB';
  };
  const iconSource = canvasSettings.icon_data || canvasSettings.icon_path;

  return (
    <div 
      className="grid h-11 grid-cols-3 items-center rounded-t-2xl border-b border-border px-4"
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
          className="justify-self-center rounded-md border border-primary/45 bg-background px-2 py-0.5 text-center text-sm text-foreground shadow-sm outline-none"
          style={{ 
            fontWeight: canvasSettings.titleFontWeight,
            fontFamily: 'Poppins, sans-serif',
            minWidth: '200px',
            maxWidth: '300px'
          }}
        />
      ) : (
        <p 
          className={`justify-self-center rounded-lg px-3 py-1 text-sm font-medium text-foreground transition-colors ${isPreview ? 'cursor-default' : 'cursor-pointer hover:bg-primary/10'}`}
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
      
      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground justify-self-end">
        {!isPreview && (
          <Toggle
            size="sm"
            pressed={canvasSettings.gridVisible}
            onPressedChange={(pressed) => updateCanvasSettings({ gridVisible: pressed })}
            aria-label="Afficher/Masquer la grille"
            className="h-7 w-7 rounded-md border border-border bg-secondary text-muted-foreground data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
          >
            <Grid2X2 className="w-4 h-4" />
          </Toggle>
        )}
      </div>
    </div>
  );
};
