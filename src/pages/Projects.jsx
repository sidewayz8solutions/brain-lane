import React from 'react';
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
import { useProjectStore, useTaskStore } from '@/store/projectStore';

export default function Projects() {
    const projects = useProjectStore((state) => state.projects);
    const deleteProjectStore = useProjectStore((state) => state.deleteProject);
    const tasks = useTaskStore((state) => state.tasks);
    const deleteTask = useTaskStore((state) => state.deleteTask);

    // Sort by created_at descending
    const sortedProjects = [...projects].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    );

    const deleteProject = (projectId) => {
        // Delete related tasks first
        const projectTasks = tasks.filter(t => t.project_id === projectId);
        projectTasks.forEach(task => deleteTask(task.id));
        // Then delete the project
        deleteProjectStore(projectId);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Background - Vibrant */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400">Your Projects</h1>
                        <p className="text-slate-400 mt-1">
                            {projects.length} project{projects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link to={createPageUrl('Home')}>
                        <Button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500">
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                        </Button>
                    </Link>
                </div>

                {/* Projects Grid */}
                {sortedProjects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                            <FolderGit2 className="w-10 h-10 text-cyan-400" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-cyan-400">No projects yet</h2>
                        <p className="text-slate-400 mb-6">
                            Upload your first project to get started
                        </p>
                        <Link to={createPageUrl('Home')}>
                            <Button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Project
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sortedProjects.map((project, idx) => {
                            const colors = ['cyan', 'purple', 'green', 'orange'];
                            const color = colors[idx % colors.length];
                            const colorClasses = {
                                cyan: { border: 'hover:border-cyan-500/50', icon: 'from-cyan-500/20 to-cyan-500/10 text-cyan-400', text: 'group-hover:text-cyan-400' },
                                purple: { border: 'hover:border-purple-500/50', icon: 'from-purple-500/20 to-purple-500/10 text-purple-400', text: 'group-hover:text-purple-400' },
                                green: { border: 'hover:border-green-500/50', icon: 'from-green-500/20 to-green-500/10 text-green-400', text: 'group-hover:text-green-400' },
                                orange: { border: 'hover:border-orange-500/50', icon: 'from-orange-500/20 to-orange-500/10 text-orange-400', text: 'group-hover:text-orange-400' }
                            };
                            return (
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
                                    <div className={`group bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 ${colorClasses[color].border} transition-all duration-300`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color].icon} rounded-xl flex items-center justify-center`}>
                                                <FolderGit2 className="w-6 h-6" />
                                            </div>
                                            <StatusBadge status={project.status} showLabel={false} />
                                        </div>

                                        <h3 className={`font-semibold text-lg mb-2 ${colorClasses[color].text} transition-colors`}>
                                            {project.name}
                                        </h3>

                                        {project.summary && (
                                            <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                                {project.summary}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {Array.isArray(project.detected_stack) ? (
                                                project.detected_stack.slice(0, 2).map((tech, i) => (
                                                    <StackBadge key={i} name={tech} size="sm" />
                                                ))
                                            ) : (
                                                <>
                                                    {project.detected_stack?.framework && (
                                                        <StackBadge name={project.detected_stack.framework} size="sm" />
                                                    )}
                                                    {project.detected_stack?.language && (
                                                        <StackBadge name={project.detected_stack.language} size="sm" />
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(project.created_at), 'MMM d, yyyy')}
                                            </span>
                                            <ArrowRight className={`w-4 h-4 text-slate-500 ${colorClasses[color].text} group-hover:translate-x-1 transition-all`} />
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
                        );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}