import React, { useState } from 'react';
import { useWidgets } from '@/contexts/WidgetContext';
import { X, Plus, FileCode2, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const FileTabsBar: React.FC = () => {
  const { files, activeFileId, setActiveFile, createFile, deleteFile, renameFile } = useWidgets();
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      const fileName = newFileName.endsWith('.py') ? newFileName : `${newFileName}.py`;
      createFile(fileName);
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleStartRename = (fileId: string, currentName: string) => {
    setEditingFileId(fileId);
    setEditingName(currentName);
  };

  const handleRename = (fileId: string) => {
    if (editingName.trim()) {
      const fileName = editingName.endsWith('.py') ? editingName : `${editingName}.py`;
      renameFile(fileId, fileName);
    }
    setEditingFileId(null);
  };

  const handleDelete = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length > 1) {
      deleteFile(fileId);
    }
  };

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 bg-muted/30 border-b border-border overflow-x-auto"
      data-tour-file-tabs-bar
    >
      {files.map((file) => {
        const isActive = file.id === activeFileId;
        const isEditing = editingFileId === file.id;

        return (
          <div
            key={file.id}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer group relative
              ${isActive ? 'bg-background border border-border shadow-sm' : 'hover:bg-background/50'}
              transition-all min-w-[120px] max-w-[200px]
            `}
            onClick={() => !isEditing && setActiveFile(file.id)}
          >
            <FileCode2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            
            {isEditing ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(file.id);
                    if (e.key === 'Escape') setEditingFileId(null);
                  }}
                  className="h-6 px-1 text-xs"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(file.id);
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <span 
                  className="text-xs font-medium truncate flex-1"
                  onDoubleClick={() => handleStartRename(file.id, file.name)}
                  title={file.name}
                >
                  {file.name}
                </span>
                
                <div className={`flex items-center gap-0.5 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(file.id, file.name);
                    }}
                    title="Renommer"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  
                  {files.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => handleDelete(file.id, e)}
                      title="Supprimer"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {isCreating ? (
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFile();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewFileName('');
              }
            }}
            placeholder="nom_fichier.py"
            className="h-6 px-2 text-xs w-32"
            data-tour-file-name-input
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleCreateFile}
          >
            <Check className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 rounded-md"
          onClick={() => setIsCreating(true)}
          title="Nouveau fichier"
          data-tour-create-file-button
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
