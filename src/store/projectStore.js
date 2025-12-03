import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      
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
        set((state) => ({ 
          projects: [...state.projects, project],
          currentProject: project 
        }));
        return project;
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
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
        return get().projects.find((p) => p.id === id);
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

