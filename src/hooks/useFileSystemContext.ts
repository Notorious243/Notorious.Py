import { useContext } from 'react';
import { FileSystemContext } from '@/hooks/fileSystem-context';

export const useFileSystem = () => {
    const context = useContext(FileSystemContext);
    if (!context) {
        throw new Error('useFileSystem must be used within a FileSystemProvider');
    }
    return context;
};
