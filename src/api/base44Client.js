// Brain Lane Client - Independent of external SDKs
// This is the main entry point for all data operations

import { useProjectStore, useTaskStore } from '../store/projectStore';
import * as aiService from '../services/aiService';
import * as fileService from '../services/fileService';

// Create a unified client interface that mirrors the old API structure
// This makes migration easier and keeps components working

class BrainLaneClient {
  constructor() {
    this.entities = {
      Project: {
        create: async (data) => useProjectStore.getState().createProject(data),
        update: async (id, data) => useProjectStore.getState().updateProject(id, data),
        delete: async (id) => useProjectStore.getState().deleteProject(id),
        get: async (id) => useProjectStore.getState().getProject(id),
        list: async () => useProjectStore.getState().listProjects(),
        filter: async (filters) => {
          const projects = useProjectStore.getState().listProjects();
          // Simple filter implementation
          return projects.filter(p => {
            return Object.entries(filters).every(([key, value]) => p[key] === value);
          });
        }
      },
      Task: {
        create: async (data) => useTaskStore.getState().createTask(data),
        update: async (id, data) => useTaskStore.getState().updateTask(id, data),
        delete: async (id) => useTaskStore.getState().deleteTask(id),
        get: async (id) => useTaskStore.getState().getTask(id),
        list: async () => useTaskStore.getState().listTasks(),
        filter: async (filters) => {
          const tasks = useTaskStore.getState().listTasks();
          return tasks.filter(t => {
            return Object.entries(filters).every(([key, value]) => t[key] === value);
          });
        }
      }
    };

    this.integrations = {
      Core: {
        InvokeLLM: aiService.InvokeLLM,
        GenerateImage: aiService.GenerateImage,
        UploadFile: fileService.UploadFile,
        ExtractDataFromUploadedFile: fileService.ExtractZipContents,
        CreateFileSignedUrl: fileService.CreateFileSignedUrl,
      }
    };

    // Simple auth placeholder - can integrate with Supabase Auth later
    this.auth = {
      isAuthenticated: () => true, // For now, always authenticated
      getCurrentUser: () => ({ id: 'local-user', email: 'user@brain-lane.tech' }),
      signIn: async () => ({ success: true }),
      signOut: async () => ({ success: true }),
    };
  }
}

export const brainLane = new BrainLaneClient();

// Export for backward compatibility
export const base44 = brainLane;
