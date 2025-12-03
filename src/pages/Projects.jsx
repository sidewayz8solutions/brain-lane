import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
    Plus, 
    FolderGit2, 
    Clock, 
    ArrowRight,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import StatusBadge from '../components/project/StatusBadge';
import StackBadge from '../components/project/StackBadge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from '@tanstack/react-query';

export default function Projects() {
    const queryClient = useQueryClient();
    
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => base44.entities.Project.list('-created_date')
    });

    const deleteProject = async (projectId) => {
        await base44.entities.Project.delete(projectId);
        // Also delete related tasks
        const tasks = await base44.entities.Task.filter({ project_id: projectId });
        for (const task of tasks) {
            await base44.entities.Task.delete(task.id);
        }
        queryClient.invalidateQueries(['projects']);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Your Projects</h1>
                        <p className="text-slate-400 mt-1">
                            {projects.length} project{projects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link to={createPageUrl('Home')}>
                        <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500">
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                        </Button>
                    </Link>
                </div>

                {/* Projects Grid */}
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-slate-800/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 bg-slate-800 rounded-2xl flex items-center justify-center">
                            <FolderGit2 className="w-10 h-10 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
                        <p className="text-slate-400 mb-6">
                            Upload your first project to get started
                        </p>
                        <Link to={createPageUrl('Home')}>
                            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Project
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project, idx) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Link 
                                    to={createPageUrl('ProjectAnalysis') + `?id=${project.id}`}
                                    className="block"
                                >
                                    <div className="group bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 hover:border-cyan-500/50 transition-all duration-300">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl flex items-center justify-center">
                                                <FolderGit2 className="w-6 h-6 text-cyan-400" />
                                            </div>
                                            <StatusBadge status={project.status} showLabel={false} />
                                        </div>

                                        <h3 className="font-semibold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                                            {project.name}
                                        </h3>

                                        {project.summary && (
                                            <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                                {project.summary}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {project.detected_stack?.framework && (
                                                <StackBadge name={project.detected_stack.framework} size="sm" />
                                            )}
                                            {project.detected_stack?.language && (
                                                <StackBadge name={project.detected_stack.language} size="sm" />
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(project.created_date), 'MMM d, yyyy')}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Delete Button */}
                                <div className="mt-2 flex justify-end">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="text-slate-500 hover:text-red-400"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-400">
                                                    Are you sure you want to delete "{project.name}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={() => deleteProject(project.id)}
                                                    className="bg-red-600 hover:bg-red-500"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}