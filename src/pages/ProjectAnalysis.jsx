import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Loader2,
    FolderTree,
    AlertTriangle,
    ListTodo,
    Sparkles,
    ArrowLeft,
    RefreshCw,
    Wand2,
    Shield,
    Code,
    Layers,
    TestTube,
    GitBranch,
    Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StackBadge from '../components/project/StackBadge';
import StatusBadge from '../components/project/StatusBadge';
import FileTree from '../components/project/FileTree';
import IssuesList from '../components/project/IssuesList';
import TaskCard from '../components/project/TaskCard';
import RefactoringPanel from '../components/refactoring/RefactoringPanel';
import TaskDependencyGraph from '../components/refactoring/TaskDependencyGraph';
import SecurityPanel from '../components/analysis/SecurityPanel';
import CodeSmellsPanel from '../components/analysis/CodeSmellsPanel';
import ArchitecturePanel from '../components/analysis/ArchitecturePanel';
import TestSuggestionsPanel from '../components/analysis/TestSuggestionsPanel';
import ArchitectureDiagram from '../components/visualization/ArchitectureDiagram';
import DependencyGraph from '../components/visualization/DependencyGraph';
import ComplexityMetrics from '../components/visualization/ComplexityMetrics';
import { useProjectStore, useTaskStore } from '@/store/projectStore';
import { runProjectAnalysis } from '@/services/analysisService';

export default function ProjectAnalysis() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [projectData, setProjectData] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);

    // Use Zustand stores - subscribe to projects array for updates
    const projects = useProjectStore((state) => state.projects);
    const getProject = useProjectStore((state) => state.getProject);
    const getProjectAsync = useProjectStore((state) => state.getProjectAsync);
    const updateProject = useProjectStore((state) => state.updateProject);
    
    // Get project from store (will update when store changes)
    const storeProject = projects.find(p => p.id === projectId);
    
    // Merge store data with loaded file data
    const project = storeProject ? {
        ...storeProject,
        file_contents: projectData?.file_contents || {},
        file_tree: projectData?.file_tree || []
    } : projectData;

    const tasksStore = useTaskStore((state) => state.tasks);

    // Filter tasks for this project
    const tasks = tasksStore.filter(t => t.project_id === projectId);

    // Load project with files on mount
    useEffect(() => {
        if (projectId && !projectData) {
            console.log('🔄 Loading project:', projectId);
            getProjectAsync(projectId).then(p => {
                if (p) {
                    setProjectData(p);
                    const fileCount = Object.keys(p.file_contents || {}).length;
                    console.log('📂 Project loaded:', p.name, 'Status:', p.status, 'Files:', fileCount);
                    if (fileCount === 0) {
                        console.warn('⚠️ No files loaded! Check if files were extracted and saved correctly.');
                    }
                } else {
                    console.error('❌ Project not found:', projectId);
                }
            }).catch(err => {
                console.error('❌ Error loading project:', err);
            });
        }
    }, [projectId]);

    // Run analysis when project is in analyzing state AND files are loaded
    useEffect(() => {
        const fileCount = Object.keys(projectData?.file_contents || {}).length;
        const currentStatus = storeProject?.status || projectData?.status;
        console.log('🔍 Analysis check - Status:', currentStatus, 'isAnalyzing:', isAnalyzing, 'Files:', fileCount);

        if (projectId && currentStatus === 'analyzing' && !isAnalyzing && fileCount > 0) {
            console.log('🚀 Starting analysis via shared service...');
            setIsAnalyzing(true);
            runProjectAnalysis(projectId)
                .then((result) => {
                    setProjectData(result);
                    setAnalysisError(null);
                })
                .catch((error) => {
                    console.error('❌ Analysis error:', error);
                    setAnalysisError(error.message || 'Analysis failed');
                })
                .finally(() => {
                    setIsAnalyzing(false);
                });
        } else if (currentStatus === 'analyzing' && fileCount === 0) {
            console.log('⏳ Waiting for files to load...');
        }
    }, [projectId, storeProject?.status, projectData?.file_contents, isAnalyzing]);

    if (!project) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <h2 className="text-xl font-medium mb-4">Project not found</h2>
                    <Link to={createPageUrl('Home')}>
                        <Button>Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isReady = project.status === 'ready' || project.status === 'completed';

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Background - Vibrant */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to={createPageUrl('Home')}>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400">{project.name}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <StatusBadge status={project.status} />
                                {Array.isArray(project.detected_stack) ? (
                                    project.detected_stack.slice(0, 3).map((tech, i) => (
                                        <StackBadge key={i} name={tech} />
                                    ))
                                ) : (
                                    <>
                                        {project.detected_stack?.framework && (
                                            <StackBadge name={project.detected_stack.framework} />
                                        )}
                                        {project.detected_stack?.language && (
                                            <StackBadge name={project.detected_stack.language} />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {isReady && (
                        <div className="flex items-center gap-2">
                            <Link to={createPageUrl('ProjectHealth') + `?id=${project.id}`}>
                                <Button variant="orange" className="gap-2">
                                    <Flame className="w-4 h-4" />
                                    Health Dashboard
                                </Button>
                            </Link>
                            {tasks.length > 0 && (
                                <Link to={createPageUrl('TaskView') + `?projectId=${project.id}`}>
                                    <Button variant="cyan" className="gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        View Tasks ({tasks.length})
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Analyzing State */}
                {project.status === 'analyzing' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-12 text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
                            <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 via-purple-500 to-green-500 rounded-full flex items-center justify-center">
                                <Brain className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-cyan-400">Analyzing Your Project</h2>
                        <p className="text-slate-400 mb-6">
                            Our AI is scanning your codebase, detecting the stack, and creating a completion plan...
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            This usually takes 15-30 seconds
                        </div>
                    </motion.div>
                )}

                {/* Error State */}
                {(project.status === 'error' || analysisError) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/30 p-12 text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-red-400">Analysis Failed</h2>
                        <p className="text-slate-400 mb-4">
                            {analysisError || project.error_message || 'Something went wrong during analysis.'}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Button 
                                variant="outline" 
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                    setAnalysisError(null);
                                    updateProject(project.id, { status: 'analyzing' });
                                    setProjectData((prev) => prev ? { ...prev, status: 'analyzing' } : prev);
                                }}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry Analysis
                            </Button>
                            <Link to={createPageUrl('Home')}>
                                <Button variant="ghost" className="text-slate-400">
                                    Go Home
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* Ready State */}
                {isReady && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Summary Card */}
                        {project.summary && (
                            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6">
                                <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wider mb-3">
                                    Project Summary
                                </h3>
                                <p className="text-slate-200 leading-relaxed">{project.summary}</p>
                            </div>
                        )}

                        {/* Main Content Tabs */}
                        <Tabs defaultValue="tasks" className="w-full">
                            <TabsList className="bg-slate-900/80 border border-cyan-500/20 p-1 rounded-xl flex-wrap h-auto gap-1">
                                <TabsTrigger value="tasks" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-lg">
                                    <ListTodo className="w-4 h-4 mr-2" />
                                    Tasks ({tasks.length})
                                </TabsTrigger>
                                <TabsTrigger value="security" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Security ({project.security_vulnerabilities?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="architecture" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 rounded-lg">
                                    <Layers className="w-4 h-4 mr-2" />
                                    Architecture
                                </TabsTrigger>
                                <TabsTrigger value="dependencies" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 rounded-lg">
                                    <GitBranch className="w-4 h-4 mr-2" />
                                    Dependencies
                                </TabsTrigger>
                                <TabsTrigger value="complexity" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 rounded-lg">
                                    <Flame className="w-4 h-4 mr-2" />
                                    Complexity
                                </TabsTrigger>
                                <TabsTrigger value="code-smells" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 rounded-lg">
                                    <Code className="w-4 h-4 mr-2" />
                                    Code Quality ({project.code_smells?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="tests" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-lg">
                                    <TestTube className="w-4 h-4 mr-2" />
                                    Tests ({project.test_suggestions?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="refactor" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 rounded-lg">
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Refactoring
                                </TabsTrigger>
                                <TabsTrigger value="issues" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Issues ({project.issues?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="files" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 rounded-lg">
                                    <FolderTree className="w-4 h-4 mr-2" />
                                    Files
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="tasks" className="mt-6">
                                {tasks.length > 0 ? (
                                    <div className="space-y-6">
                                        <TaskDependencyGraph 
                                            tasks={tasks} 
                                            projectId={project.id}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        No tasks generated yet
                                        <p className="mt-2 text-sm">Use the Refactoring tab to generate tasks</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="security" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/30 p-6">
                                    <SecurityPanel vulnerabilities={project.security_vulnerabilities} />
                                </div>
                            </TabsContent>

                            <TabsContent value="architecture" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                            <Layers className="w-5 h-5 text-purple-400" />
                                            Architecture Diagram
                                        </h3>
                                        <ArchitectureDiagram architecture={project.architecture} />
                                    </div>
                                    <div className="border-t border-purple-500/20 pt-6">
                                        <h3 className="text-lg font-medium text-white mb-4">Details</h3>
                                        <ArchitecturePanel architecture={project.architecture} />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="dependencies" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
                                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                        <GitBranch className="w-5 h-5 text-green-400" />
                                        Dependency Graph
                                    </h3>
                                    <DependencyGraph 
                                        architecture={project.architecture} 
                                        detectedStack={project.detected_stack} 
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="complexity" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-6">
                                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                        <Flame className="w-5 h-5 text-orange-400" />
                                        Code Complexity & Hotspots
                                    </h3>
                                    <ComplexityMetrics 
                                        fileTree={project.file_tree}
                                        codeSmells={project.code_smells}
                                        issues={project.issues}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="code-smells" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-yellow-500/30 p-6">
                                    <CodeSmellsPanel codeSmells={project.code_smells} />
                                </div>
                            </TabsContent>

                            <TabsContent value="tests" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6">
                                    <TestSuggestionsPanel suggestions={project.test_suggestions} />
                                </div>
                            </TabsContent>

                            <TabsContent value="refactor" className="mt-6">
                                <RefactoringPanel 
                                    project={project}
                                    onTasksGenerated={(newTasks, summary) => {
                                        queryClient.invalidateQueries(['tasks', projectId]);
                                        queryClient.invalidateQueries(['project', projectId]);
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="issues" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/30 p-6">
                                    <IssuesList issues={project.issues} />
                                </div>
                            </TabsContent>

                            <TabsContent value="files" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
                                    <FileTree files={project.file_tree} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                )}

                {/* Error State */}
                {project.status === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-400 mb-2">Analysis Failed</h2>
                        <p className="text-slate-400 mb-6">
                            Something went wrong while analyzing your project.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                updateProject(project.id, { status: 'analyzing' });
                            }}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry Analysis
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}