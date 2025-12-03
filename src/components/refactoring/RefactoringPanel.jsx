import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, AlertCircle } from 'lucide-react';
import RefactoringGoalSelector, { REFACTORING_GOALS } from './RefactoringGoalSelector';
import { motion } from 'framer-motion';

export default function RefactoringPanel({ project, onTasksGenerated }) {
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [customInstructions, setCustomInstructions] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    const generateRefactoringPlan = async () => {
        if (selectedGoals.length === 0) return;
        
        setIsAnalyzing(true);
        setError(null);

        try {
            const fileContents = project.file_contents || {};
            const fileList = Object.keys(fileContents).join('\n');
            
            // Build code samples
            let codeSamples = '';
            const codeExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb'];
            let fileCount = 0;
            
            for (const [path, content] of Object.entries(fileContents)) {
                if (fileCount >= 15) break;
                if (codeExts.some(ext => path.endsWith(ext)) && content && content.length < 8000) {
                    codeSamples += `\n--- ${path} ---\n${content}\n`;
                    fileCount++;
                }
            }

            // Get selected goal descriptions
            const goalDescriptions = selectedGoals
                .map(gId => REFACTORING_GOALS.find(g => g.id === gId))
                .filter(Boolean)
                .map(g => `- ${g.title}: ${g.description}`)
                .join('\n');

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `You are an expert software architect specializing in code refactoring. Analyze this codebase and create a comprehensive refactoring plan.

REFACTORING GOALS:
${goalDescriptions}

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}\n` : ''}

FILE STRUCTURE:
${fileList}

CODE TO ANALYZE:
${codeSamples}

Create a detailed refactoring plan with 15-30 specific, actionable tasks. Each task should be:
1. Atomic and independently completable
2. Ordered by dependency (foundational changes first)
3. Specific about which files to modify
4. Clear about expected outcomes

Focus on high-impact changes that align with the selected goals. Consider:
- Code smells and anti-patterns
- Duplicate code
- Complex functions that need splitting
- Poor naming conventions
- Missing error handling
- Performance issues
- Security vulnerabilities
- Outdated patterns

Generate tasks that build on each other progressively.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        analysis_summary: { type: "string" },
                        critical_issues: {
                            type: "array",
                            items: { type: "string" }
                        },
                        tasks: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    category: { 
                                        type: "string", 
                                        enum: ["refactor", "feature", "bugfix", "test", "documentation", "security"] 
                                    },
                                    priority: { 
                                        type: "string", 
                                        enum: ["critical", "high", "medium", "low"] 
                                    },
                                    estimated_effort: { 
                                        type: "string", 
                                        enum: ["small", "medium", "large"] 
                                    },
                                    files_affected: { 
                                        type: "array", 
                                        items: { type: "string" } 
                                    },
                                    depends_on: {
                                        type: "array",
                                        items: { type: "number" },
                                        description: "Indices of tasks this depends on"
                                    },
                                    expected_outcome: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            // Create tasks in database
            const createdTasks = [];
            for (let i = 0; i < result.tasks.length; i++) {
                const task = result.tasks[i];
                const created = await base44.entities.Task.create({
                    project_id: project.id,
                    title: task.title,
                    description: `${task.description}\n\n**Expected Outcome:** ${task.expected_outcome || 'Improved code quality'}`,
                    category: task.category || 'refactor',
                    priority: task.priority || 'medium',
                    estimated_effort: task.estimated_effort || 'medium',
                    files_affected: task.files_affected || [],
                    status: 'pending',
                    steps: task.depends_on?.length > 0 
                        ? [{ order: 1, description: `Depends on tasks: ${task.depends_on.map(d => d + 1).join(', ')}`, completed: false }]
                        : []
                });
                createdTasks.push(created);
            }

            // Update project with analysis
            await base44.entities.Project.update(project.id, {
                summary: result.analysis_summary,
                issues: result.critical_issues?.map((desc, idx) => ({
                    type: 'refactoring',
                    severity: idx < 3 ? 'high' : 'medium',
                    description: desc
                })) || []
            });

            onTasksGenerated(createdTasks, result.analysis_summary);

        } catch (err) {
            console.error('Refactoring analysis error:', err);
            setError('Failed to generate refactoring plan. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <RefactoringGoalSelector 
                selectedGoals={selectedGoals}
                onGoalsChange={setSelectedGoals}
            />

            <div className="mt-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Custom Instructions (optional)
                </label>
                <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Add specific requirements, areas to focus on, or constraints..."
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px]"
                />
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400"
                >
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </motion.div>
            )}

            <Button
                onClick={generateRefactoringPlan}
                disabled={selectedGoals.length === 0 || isAnalyzing}
                className="w-full mt-6 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing Codebase & Generating Plan...
                    </>
                ) : (
                    <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Generate Refactoring Plan
                    </>
                )}
            </Button>

            {isAnalyzing && (
                <p className="text-center text-sm text-slate-500 mt-3">
                    This may take 30-60 seconds for thorough analysis
                </p>
            )}
        </div>
    );
}