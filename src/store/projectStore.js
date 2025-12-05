import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveProjectFiles, loadProjectFiles } from '@/services/storageService';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const sanitizeProjectForStorage = (project) => {
  if (!project) return null;
  return {
    id: project.id,
    name: project.name,
    created_at: project.created_at,
    updated_at: project.updated_at,
    status: project.status,
    source_type: project.source_type,
    github_url: project.github_url,
    zip_file_url: project.zip_file_url,
    detected_stack: Array.isArray(project.detected_stack) ? project.detected_stack.slice(0, 20) : [],
    summary: project.summary || '',
    security_vulnerabilities: Array.isArray(project.security_vulnerabilities) ? project.security_vulnerabilities.slice(0, 50) : [],
    code_smells: Array.isArray(project.code_smells) ? project.code_smells.slice(0, 100) : [],
    test_suggestions: Array.isArray(project.test_suggestions) ? project.test_suggestions.slice(0, 50) : [],
    issues: Array.isArray(project.issues) ? project.issues.slice(0, 100) : [],
    architecture: project.architecture || null,
    file_contents_count: Object.keys(project.file_contents || {}).length,
    file_tree_count: Array.isArray(project.file_tree) ? project.file_tree.length : 0,
  };
};

const fileContentsCache = new Map();
const fileTreeCache = new Map();

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,

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

        const hasLargeData =
          (project.file_contents && Object.keys(project.file_contents).length > 0) ||
          (project.file_tree && project.file_tree.length > 0);

        if (hasLargeData) {
          fileContentsCache.set(project.id, project.file_contents || {});
          fileTreeCache.set(project.id, project.file_tree || []);
          saveProjectFiles(project.id, {
            fileContents: project.file_contents || {},
            fileTree: project.file_tree || [],
          }).catch((err) => console.warn('Failed to save project files:', err));
        }

        const sanitized = sanitizeProjectForStorage(project);

        set((state) => ({
          projects: [...state.projects, sanitized],
          currentProject: {
            ...project,
            file_contents: fileContentsCache.get(project.id) || {},
            file_tree: fileTreeCache.get(project.id) || [],
          },
        }));

        return project;
      },

      updateProject: (id, updates) => {
        if (updates.file_contents && Object.keys(updates.file_contents).length > 0) {
          fileContentsCache.set(id, updates.file_contents);
          saveProjectFiles(id, {
            fileContents: updates.file_contents,
            fileTree: fileTreeCache.get(id) || [],
          }).catch((err) => console.warn('Failed to save project files:', err));
        }

        if (updates.file_tree && updates.file_tree.length > 0) {
          fileTreeCache.set(id, updates.file_tree);
          saveProjectFiles(id, {
            fileContents: fileContentsCache.get(id) || {},
            fileTree: updates.file_tree,
          }).catch((err) => console.warn('Failed to save project files:', err));
        }

        const existing = get().projects.find((p) => p.id === id) || {};
        const merged = { ...existing, ...updates };
        const sanitized = sanitizeProjectForStorage(merged);

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...sanitized, updated_at: new Date().toISOString() } : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? {
                  ...state.currentProject,
                  ...updates,
                  file_contents: fileContentsCache.get(id) || state.currentProject.file_contents || {},
                  file_tree: fileTreeCache.get(id) || state.currentProject.file_tree || [],
                  updated_at: new Date().toISOString(),
                }
              : state.currentProject,
        }));
      },

      deleteProject: (id) => {
        fileContentsCache.delete(id);
        fileTreeCache.delete(id);
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        }));
      },

      getProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return null;

        const result = {
          ...project,
          file_contents: fileContentsCache.get(id) || {},
          file_tree: fileTreeCache.get(id) || [],
        };

        loadProjectFiles(id)
          .then(({ fileContents, fileTree }) => {
            if (fileContents && Object.keys(fileContents).length > 0) {
              fileContentsCache.set(id, fileContents);
            }
            if (fileTree && fileTree.length > 0) {
              fileTreeCache.set(id, fileTree);
            }
            const current = get().currentProject;
            if (current?.id === id) {
              set({
                currentProject: {
                  ...current,
                  file_contents: fileContents || current.file_contents,
                  file_tree: fileTree || current.file_tree,
                },
              });
            }
          })
          .catch(() => {});

        return result;
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
      partialize: (state) => ({
        projects: Array.isArray(state.projects) ? state.projects.map(sanitizeProjectForStorage) : [],
        currentProject: null,
      }),
    }
  )
);

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],

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
