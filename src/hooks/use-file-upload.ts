import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, InputHTMLAttributes, RefObject } from 'react';
import { nanoid } from 'nanoid';

export type FileWithPreview = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview: string;
};

type UseFileUploadOptions = {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  onFilesChange?: (files: FileWithPreview[]) => void;
};

type FileUploadState = {
  files: FileWithPreview[];
  isDragging: boolean;
  errors: string[];
};

type FileUploadActions = {
  inputRef: RefObject<HTMLInputElement | null>;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  handleDragEnter: (event: DragEvent<HTMLElement>) => void;
  handleDragLeave: (event: DragEvent<HTMLElement>) => void;
  handleDragOver: (event: DragEvent<HTMLElement>) => void;
  handleDrop: (event: DragEvent<HTMLElement>) => void;
  openFileDialog: () => void;
  getInputProps: () => InputHTMLAttributes<HTMLInputElement>;
};

const DEFAULT_MAX_FILES = 1;
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024;

const ACCEPT_ALL = '*/*';

const normalizeAcceptPattern = (accept?: string): string[] => {
  if (!accept?.trim()) return [ACCEPT_ALL];
  return accept
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
};

const matchesAcceptPattern = (file: File, patterns: string[]) => {
  if (patterns.includes(ACCEPT_ALL)) return true;

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return patterns.some((pattern) => {
    if (pattern.endsWith('/*')) {
      return fileType.startsWith(pattern.replace('*', ''));
    }

    if (pattern.startsWith('.')) {
      return fileName.endsWith(pattern);
    }

    return fileType === pattern;
  });
};

const toFileWithPreview = (file: File): FileWithPreview => ({
  id: nanoid(),
  file,
  name: file.name,
  size: file.size,
  type: file.type,
  preview: URL.createObjectURL(file),
});

export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[power]}`;
};

export function useFileUpload({
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  accept = ACCEPT_ALL,
  multiple = false,
  onFilesChange,
}: UseFileUploadOptions = {}): [FileUploadState, FileUploadActions] {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const filesRef = useRef<FileWithPreview[]>([]);
  const dragDepthRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const acceptPatterns = normalizeAcceptPattern(accept);

  const syncFiles = useCallback(
    (nextFiles: FileWithPreview[]) => {
      filesRef.current = nextFiles;
      setFiles(nextFiles);
      onFilesChange?.(nextFiles);
    },
    [onFilesChange]
  );

  const revokeFiles = useCallback((items: FileWithPreview[]) => {
    items.forEach((item) => URL.revokeObjectURL(item.preview));
  }, []);

  const addFiles = useCallback(
    (incomingFiles: File[]) => {
      if (!incomingFiles.length) return;

      const nextErrors: string[] = [];
      const validFiles: FileWithPreview[] = [];

      for (const file of incomingFiles) {
        if (!matchesAcceptPattern(file, acceptPatterns)) {
          nextErrors.push(`Type non supporte: ${file.name}`);
          continue;
        }
        if (file.size > maxSize) {
          nextErrors.push(`Fichier trop volumineux: ${file.name} (max ${formatBytes(maxSize)})`);
          continue;
        }
        validFiles.push(toFileWithPreview(file));
      }

      if (!multiple && validFiles.length > 1) {
        const dropped = validFiles.splice(1);
        revokeFiles(dropped);
        nextErrors.push('Un seul fichier est autorise.');
      }

      const previousFiles = filesRef.current;
      const remainingSlots = Math.max(maxFiles - (multiple ? previousFiles.length : 0), 0);
      const acceptedFiles = validFiles.slice(0, remainingSlots || (multiple ? 0 : 1));
      const overflowFiles = validFiles.slice(acceptedFiles.length);

      if (overflowFiles.length > 0) {
        revokeFiles(overflowFiles);
        nextErrors.push(`Nombre maximal de fichiers atteint (${maxFiles}).`);
      }

      const nextFiles = multiple ? [...previousFiles, ...acceptedFiles] : acceptedFiles;

      if (!multiple) {
        revokeFiles(previousFiles);
      }

      setErrors(nextErrors);
      syncFiles(nextFiles);
    },
    [acceptPatterns, maxFiles, maxSize, multiple, revokeFiles, syncFiles]
  );

  const removeFile = useCallback(
    (fileId: string) => {
      const previousFiles = filesRef.current;
      const fileToRemove = previousFiles.find((file) => file.id === fileId);
      if (!fileToRemove) return;

      URL.revokeObjectURL(fileToRemove.preview);
      const nextFiles = previousFiles.filter((file) => file.id !== fileId);
      setErrors([]);
      syncFiles(nextFiles);

      if (inputRef.current && nextFiles.length === 0) {
        inputRef.current.value = '';
      }
    },
    [syncFiles]
  );

  const clearFiles = useCallback(() => {
    revokeFiles(filesRef.current);
    setErrors([]);
    syncFiles([]);
    if (inputRef.current) inputRef.current.value = '';
  }, [revokeFiles, syncFiles]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      addFiles(selectedFiles);
      event.target.value = '';
    },
    [addFiles]
  );

  const handleDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragging(false);
      const droppedFiles = Array.from(event.dataTransfer.files ?? []);
      addFiles(droppedFiles);
    },
    [addFiles]
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const getInputProps = useCallback(
    (): InputHTMLAttributes<HTMLInputElement> => ({
      type: 'file',
      accept,
      multiple,
      onChange: handleInputChange,
    }),
    [accept, handleInputChange, multiple]
  );

  useEffect(() => {
    return () => {
      revokeFiles(filesRef.current);
    };
  }, [revokeFiles]);

  return [
    { files, isDragging, errors },
    {
      inputRef,
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ];
}
