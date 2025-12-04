import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to create storage-friendly project (exclude large data)
const sanitizeProjectForStorage = (project) => {
  const { file_contents, ...projectWithoutContents } = project;
  return {
    ...projectWithoutContents,
    file_contents_count: Object.keys(file_contents || {}).length,
    // Keep file_contents in memory only, not in localStorage
  };
};

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      // In-memory storage for large data (not persisted to localStorage)
      fileContentsCache: new Map(),
      
      // Project CRUD
      createProject: (projectData) => {
        const project = {
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'analyzing',
          file_tree: [],
          file_contents: {},
          detected_stack: [],
          issues: [],
          ...projectData,
        };
        
        // Store file contents in memory cache
        if (project.file_contents && Object.keys(project.file_contents).length > 0) {
          get().fileContentsCache.set(project.id, project.file_contents);
        }
        
        // Store sanitized version in state
        const sanitized = sanitizeProjectForStorage(project);
        
        set((state) => ({ 
          projects: [...state.projects, sanitized],
          currentProject: project // Keep full version in current
        }));
        return project;
      },
      
      updateProject: (id, updates) => {
        // Cache file contents if present
        if (updates.file_contents && Object.keys(updates.file_contents).length > 0) {
          get().fileContentsCache.set(id, updates.file_contents);
        }
        
        // Sanitize updates for storage
        const sanitizedUpdates = updates.file_contents 
          ? sanitizeProjectForStorage(updates)
          : updates;
        
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...sanitizedUpdates, updated_at: new Date().toISOString() } : p
          ),
          currentProject: state.currentProject?.id === id 
            ? { ...state.currentProject, ...updates, updated_at: new Date().toISOString() }
            : state.currentProject
        }));
      },
      
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject
        }));
      },
      
      getProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return null;
        
        // Restore file contents from cache if available
        const fileContents = get().fileContentsCache.get(id) || {};
        return { ...project, file_contents: fileContents };
      },
      
      setCurrentProject: (project) => {
        set({ currentProject: project });
      },
      
      listProjects: () => {
        return get().projects;
      },
    }),
    {
      name: 'brain-lane-projects',
      // Exclude fileContentsCache from persistence
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject 
          ? sanitizeProjectForStorage(state.currentProject)
          : null,
      }),
    }
  )
);

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      
      // Task CRUD
      createTask: (taskData) => {
        const task = {
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'pending',
          priority: 'medium',
          ...taskData,
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        return task;
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
          ),
        }));
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },
      
      getTask: (id) => {
        return get().tasks.find((t) => t.id === id);
      },
      
      getTasksByProject: (projectId) => {
        return get().tasks.filter((t) => t.project_id === projectId);
      },
      
      listTasks: () => {
        return get().tasks;
      },
    }),
    {
      name: 'brain-lane-tasks',
    }
  )
);

