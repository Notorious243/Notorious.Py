import { createContext } from 'react';

export interface ProjectMetadata {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    thumbnail?: string;
}

export interface ProjectContextType {
    projects: ProjectMetadata[];
    activeProjectId: string | null;
    loading: boolean;
    createProject: (name: string) => Promise<string>;
    openProject: (id: string) => void;
    closeProject: () => void;
    deleteProject: (id: string) => void;
    renameProject: (id: string, newName: string) => void;
    updateProjectThumbnail: (id: string, thumbnail: string) => void;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);
