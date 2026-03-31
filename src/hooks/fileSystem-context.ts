import { createContext } from 'react';
import type { FileSystemContextValue } from '@/hooks/useFileSystem';

export const FileSystemContext = createContext<FileSystemContextValue | null>(null);
