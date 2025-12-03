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
import { InvokeLLM } from '@/services/aiService';

export default function ProjectAnalysis() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Use Zustand stores
    const getProject = useProjectStore((state) => state.getProject);
    const updateProject = useProjectStore((state) => state.updateProject);
    const project = getProject(projectId);

    const tasksStore = useTaskStore((state) => state.tasks);
    const createTask = useTaskStore((state) => state.createTask);

    // Filter tasks for this project
    const tasks = tasksStore.filter(t => t.project_id === projectId);

    // Run analysis when project is in analyzing state
    useEffect(() => {
        if (project?.status === 'analyzing' && !isAnalyzing) {
            runAnalysis();
        }
    }, [project?.status]);

    const runAnalysis = async () => {
        if (isAnalyzing || !project) return;
        setIsAnalyzing(true);

        try {
            // Use file_contents that were already extracted during upload
            let fileContents = project.file_contents || {};

            // Build context from file contents
            const fileList = Object.keys(fileContents).join('\n') || 'No files extracted';
            
            // Get important files content (limited)
            let importantFiles = '';
            const importantPaths = ['package.json', 'requirements.txt', 'README.md', 'setup.py', 'pyproject.toml'];
            
            for (const path of Object.keys(fileContents)) {
                if (importantPaths.some(p => path.endsWith(p))) {
                    importantFiles += `\n--- ${path} ---\n${fileContents[path]?.substring(0, 3000)}\n`;
                }
            }

            // Get sample source files
            let sampleCode = '';
            const codeExts = ['.js', '.jsx', '.ts', '.tsx', '.py'];
            let codeCount = 0;
            
            for (const [path, content] of Object.entries(fileContents)) {
                if (codeCount >= 5) break;
                if (codeExts.some(ext => path.endsWith(ext)) && content && content.length < 5000) {
                    sampleCode += `\n--- ${path} ---\n${content.substring(0, 2000)}\n`;
                    codeCount++;
                }
            }

            // Call LLM for analysis
            const analysisPrompt = project.zip_file_url 
                ? `Analyze the uploaded ZIP file and provide a comprehensive codebase analysis.`
                : `Analyze the GitHub repository at ${project.github_url} and provide a comprehensive codebase analysis.`;

            const analysisResult = await InvokeLLM({
                prompt: `${analysisPrompt}

            You are a senior full-stack engineer and security specialist performing a comprehensive code review.

            ${fileList ? `FILE STRUCTURE:\n${fileList}\n` : ''}
            ${importantFiles ? `CONFIGURATION FILES:\n${importantFiles}\n` : ''}
            ${sampleCode ? `SAMPLE SOURCE CODE:\n${sampleCode}\n` : ''}

            Provide a DETAILED analysis including:

            1. **PROJECT SUMMARY**: What the project does, its purpose and main functionality.

            2. **TECHNOLOGY STACK**: Framework, language, package manager, testing framework, databases, APIs.

            3. **ARCHITECTURE ANALYSIS**:
            - Overall architecture pattern (MVC, microservices, monolith, etc.)
            - Key components and their responsibilities
            - Data flow between components
            - External dependencies and integrations

            4. **SECURITY VULNERABILITIES** (check for common CWEs):
            - CWE-79: Cross-site Scripting (XSS)
            - CWE-89: SQL Injection
            - CWE-522: Insufficiently Protected Credentials
            - CWE-798: Hard-coded Credentials
            - CWE-306: Missing Authentication
            - CWE-352: Cross-Site Request Forgery (CSRF)
            - CWE-918: Server-Side Request Forgery (SSRF)
            - CWE-502: Deserialization of Untrusted Data
            - Insecure dependencies, exposed secrets, missing input validation

            5. **CODE SMELLS & OPTIMIZATION**:
            - Duplicate code / DRY violations
            - Long functions or god classes
            - Dead code or unused imports
            - Missing error handling
            - Performance bottlenecks (N+1 queries, memory leaks, etc.)
            - Poor naming conventions
            - Missing type safety

            6. **ISSUES FOUND**: TODOs, incomplete functions, broken imports, failing tests.

            7. **TEST COVERAGE GAPS**: Identify uncovered code paths and suggest specific unit tests:
            - Functions without test coverage
            - Edge cases not tested
            - Integration tests needed
            - Suggested test cases with descriptions

            8. **COMPLETION TASKS** (10-20 tasks, prioritized):
            - Features to complete
            - Bugs to fix
            - Security fixes (highest priority)
            - Refactoring opportunities
            - Tests to add
            - Documentation needed

            Be specific, actionable, and reference exact files/functions when possible.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        summary: { type: "string" },
                        detected_stack: {
                            type: "object",
                            properties: {
                                framework: { type: "string" },
                                language: { type: "string" },
                                package_manager: { type: "string" },
                                testing_framework: { type: "string" },
                                database: { type: "string" },
                                additional: { type: "array", items: { type: "string" } }
                            }
                        },
                        architecture: {
                            type: "object",
                            properties: {
                                pattern: { type: "string" },
                                components: { type: "array", items: { 
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        responsibility: { type: "string" },
                                        files: { type: "array", items: { type: "string" } }
                                    }
                                }},
                                external_dependencies: { type: "array", items: { type: "string" } },
                                data_flow: { type: "string" }
                            }
                        },
                        security_vulnerabilities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    cwe_id: { type: "string" },
                                    title: { type: "string" },
                                    severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                                    file: { type: "string" },
                                    line: { type: "number" },
                                    description: { type: "string" },
                                    recommendation: { type: "string" }
                                }
                            }
                        },
                        code_smells: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                                    file: { type: "string" },
                                    description: { type: "string" },
                                    suggestion: { type: "string" }
                                }
                            }
                        },
                        issues: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                                    file: { type: "string" },
                                    line: { type: "number" },
                                    description: { type: "string" }
                                }
                            }
                        },
                        test_suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    target_file: { type: "string" },
                                    function_name: { type: "string" },
                                    test_type: { type: "string", enum: ["unit", "integration", "e2e"] },
                                    description: { type: "string" },
                                    test_cases: { type: "array", items: { type: "string" } }
                                }
                            }
                        },
                        tasks: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    category: { type: "string", enum: ["feature", "bugfix", "refactor", "test", "documentation", "security"] },
                                    priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                                    estimated_effort: { type: "string", enum: ["small", "medium", "large"] },
                                    files_affected: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                }
            });

            // Build file tree from extracted content
            const fileTree = Object.keys(fileContents).map(path => ({
                path,
                type: 'file',
                size: fileContents[path]?.length || 0
            }));

            // Update project with analysis results using Zustand store
            updateProject(project.id, {
                summary: analysisResult.summary,
                detected_stack: analysisResult.detected_stack,
                architecture: analysisResult.architecture,
                security_vulnerabilities: analysisResult.security_vulnerabilities,
                code_smells: analysisResult.code_smells,
                test_suggestions: analysisResult.test_suggestions,
                issues: analysisResult.issues,
                file_tree: fileTree,
                file_contents: fileContents,
                status: 'ready'
            });

            // Create tasks using Zustand store
            if (analysisResult.tasks?.length > 0) {
                for (const task of analysisResult.tasks) {
                    createTask({
                        project_id: project.id,
                        title: task.title,
                        description: task.description,
                        category: task.category,
                        priority: task.priority,
                        estimated_effort: task.estimated_effort,
                        files_affected: task.files_affected,
                        status: 'pending'
                    });
                }
            }

        } catch (error) {
            console.error('Analysis error:', error);
            updateProject(project.id, {
                status: 'error'
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

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
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to={createPageUrl('Home')}>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{project.name}</h1>
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
                                <Button variant="outline" className="border-slate-700">
                                    <Flame className="w-4 h-4 mr-2" />
                                    Health Dashboard
                                </Button>
                            </Link>
                            {tasks.length > 0 && (
                                <Link to={createPageUrl('TaskView') + `?projectId=${project.id}`}>
                                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500">
                                        <Sparkles className="w-4 h-4 mr-2" />
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
                        className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
                            <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                                <Brain className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Analyzing Your Project</h2>
                        <p className="text-slate-400 mb-6">
                            Our AI is scanning your codebase, detecting the stack, and creating a completion plan...
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            This usually takes 15-30 seconds
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
                            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                                    Project Summary
                                </h3>
                                <p className="text-slate-200 leading-relaxed">{project.summary}</p>
                            </div>
                        )}

                        {/* Main Content Tabs */}
                        <Tabs defaultValue="tasks" className="w-full">
                            <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl flex-wrap h-auto gap-1">
                                <TabsTrigger value="tasks" className="data-[state=active]:bg-slate-700 rounded-lg">
                                    <ListTodo className="w-4 h-4 mr-2" />
                                    Tasks ({tasks.length})
                                </TabsTrigger>
                                <TabsTrigger value="security" className="data-[state=active]:bg-slate-700 rounded-lg">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Security ({project.security_vulnerabilities?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="architecture" className="data-[state=active]:bg-slate-700 rounded-lg">
                                    <Layers className="w-4 h-4 mr-2" />
                                    Architecture
                                </TabsTrigger>
                                <TabsTrigger value="dependencies" className="data-[state=active]:bg-slate-700 rounded-lg">
                                    <GitBranch className="w-4 h-4 mr-2" />
                                    Dependencies
                                </TabsTrigger>
                                <TabsTrigger value="complexity" className="data-[state=active]:bg-slate-700 rounded-lg">
                                    <Flame className="w-4 h-4 mr-2" />
                                    Complexity
                                </TabsTrigger>
                                <TabsTrigger value="code-smells" className="data-[state=active]:bg-slate-700 rounded-lg">
                                    <Code className="w-4 h-4 mr-2" />
                                    Code Quality ({project.code_smells?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="tests" className="data-[state=active]:bg-slate-700 rounded-lg">
                                    <TestTube className="w-4 h-4 mr-2" />
                                    Tests ({project.test_suggestions?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="refactor" className="data-[state=active]:bg-slate-700 rounded-lg">
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Refactoring
                                </TabsTrigger>
                                <TabsTrigger value="issues" className="data-[state=active]:bg-slate-700 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Issues ({project.issues?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="files" className="data-[state=active]:bg-slate-700 rounded-lg">
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
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                                    <SecurityPanel vulnerabilities={project.security_vulnerabilities} />
                                </div>
                            </TabsContent>

                            <TabsContent value="architecture" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                            <Layers className="w-5 h-5 text-cyan-400" />
                                            Architecture Diagram
                                        </h3>
                                        <ArchitectureDiagram architecture={project.architecture} />
                                    </div>
                                    <div className="border-t border-slate-700/50 pt-6">
                                        <h3 className="text-lg font-medium text-white mb-4">Details</h3>
                                        <ArchitecturePanel architecture={project.architecture} />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="dependencies" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                        <GitBranch className="w-5 h-5 text-cyan-400" />
                                        Dependency Graph
                                    </h3>
                                    <DependencyGraph 
                                        architecture={project.architecture} 
                                        detectedStack={project.detected_stack} 
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="complexity" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
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
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                                    <CodeSmellsPanel codeSmells={project.code_smells} />
                                </div>
                            </TabsContent>

                            <TabsContent value="tests" className="mt-6">
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
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
                                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                                    <IssuesList issues={project.issues} />
                                </div>
                            </TabsContent>

                            <TabsContent value="files" className="mt-6">
                                <FileTree files={project.file_tree} />
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                )}

                {/* Error State */}
                {project.status === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Analysis Failed</h2>
                        <p className="text-slate-400 mb-6">
                            Something went wrong while analyzing your project.
                        </p>
                        <Button
                            onClick={() => {
                                updateProject(project.id, { status: 'analyzing' });
                            }}
                            className="bg-slate-800 hover:bg-slate-700"
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