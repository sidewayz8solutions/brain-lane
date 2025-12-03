import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { InvokeLLM } from '@/services/aiService';
import {
    Sparkles,
    Zap,
    Clock,
    TrendingUp,
    CheckCircle,
    ChevronDown,
    Loader2,
    RefreshCw,
    Target,
    Lightbulb,
    ArrowRight,
    Rocket,
    Shield,
    TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const categoryIcons = {
    performance: Clock,
    quality: Shield,
    testing: TestTube,
    deployment: Rocket,
    general: Lightbulb
};

const impactColors = {
    high: 'text-green-400 bg-green-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low: 'text-blue-400 bg-blue-500/20'
};

function RecommendationCard({ recommendation, onApply }) {
    const [expanded, setExpanded] = useState(false);
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const Icon = categoryIcons[recommendation.category] || Lightbulb;

    const handleApply = async (e) => {
        e.stopPropagation();
        setApplying(true);
        await new Promise(r => setTimeout(r, 1500));
        setApplying(false);
        setApplied(true);
        onApply?.(recommendation);
    };

    return (
        <motion.div
            layout
            className={cn(
                "p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 transition-all cursor-pointer",
                expanded && "ring-1 ring-cyan-500/30",
                applied && "opacity-60"
            )}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Icon className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">{recommendation.title}</span>
                        <Badge className={cn("text-[10px]", impactColors[recommendation.impact])}>
                            {recommendation.impact} impact
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{recommendation.summary}</p>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
                                    <p className="text-xs text-slate-300">{recommendation.details}</p>
                                    
                                    {recommendation.metrics && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {recommendation.metrics.map((metric, idx) => (
                                                <div key={idx} className="p-2 rounded-lg bg-slate-900/50">
                                                    <p className="text-[10px] text-slate-500 mb-1">{metric.label}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-white">{metric.current}</span>
                                                        <ArrowRight className="w-3 h-3 text-slate-500" />
                                                        <span className="text-sm font-medium text-green-400">{metric.projected}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {recommendation.steps && (
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-500">Implementation steps:</p>
                                            {recommendation.steps.map((step, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                                                        {idx + 1}
                                                    </span>
                                                    {step}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!applied && (
                                        <Button
                                            onClick={handleApply}
                                            disabled={applying}
                                            size="sm"
                                            className="w-full bg-cyan-600 hover:bg-cyan-500"
                                        >
                                            {applying ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                    Applying...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-3 h-3 mr-1" />
                                                    Apply Recommendation
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    {applied && (
                                        <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                                            <CheckCircle className="w-4 h-4" />
                                            Applied successfully
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <ChevronDown className={cn(
                    "w-4 h-4 text-slate-500 transition-transform",
                    expanded && "rotate-180"
                )} />
            </div>
        </motion.div>
    );
}

export default function AIRecommendations({ metrics, workflowData, project }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [recommendations, setRecommendations] = useState([
        {
            id: 1,
            category: 'performance',
            title: 'Parallelize Test Execution',
            summary: 'Split test suite into parallel jobs to reduce execution time by ~40%',
            details: 'Your test suite currently runs sequentially, taking an average of 2.4s. By parallelizing across 4 workers, you could reduce this to ~1.4s while maintaining reliability.',
            impact: 'high',
            metrics: [
                { label: 'Execution Time', current: '2.4s', projected: '1.4s' },
                { label: 'CI Cost', current: '$45/mo', projected: '$52/mo' }
            ],
            steps: [
                'Configure Jest/Vitest for parallel execution',
                'Split tests into independent shards',
                'Update CI configuration for parallel jobs'
            ]
        },
        {
            id: 2,
            category: 'quality',
            title: 'Add Pre-commit Security Hooks',
            summary: 'Catch security issues before they reach the pipeline',
            details: 'Adding pre-commit hooks for security scanning would catch 65% of vulnerabilities locally, reducing pipeline failures and security review time.',
            impact: 'medium',
            metrics: [
                { label: 'Issues Caught Early', current: '12%', projected: '77%' },
                { label: 'Review Time', current: '45min', projected: '15min' }
            ],
            steps: [
                'Install husky and lint-staged',
                'Configure security scanning hooks',
                'Add dependency vulnerability checks'
            ]
        },
        {
            id: 3,
            category: 'testing',
            title: 'Increase Coverage for Critical Paths',
            summary: 'Authentication and payment modules have low coverage',
            details: 'Critical business logic in auth and payment modules only have 62% coverage. Increasing to 85% would significantly reduce production incidents.',
            impact: 'high',
            metrics: [
                { label: 'Auth Coverage', current: '62%', projected: '85%' },
                { label: 'Bug Escape Rate', current: '8%', projected: '3%' }
            ],
            steps: [
                'Identify uncovered critical paths',
                'Add unit tests for edge cases',
                'Implement integration tests for flows'
            ]
        },
        {
            id: 4,
            category: 'deployment',
            title: 'Implement Canary Deployments',
            summary: 'Reduce deployment risk with gradual rollouts',
            details: 'Current all-or-nothing deployments have caused 3 incidents this month. Canary deployments would limit blast radius to 5% of users initially.',
            impact: 'medium',
            metrics: [
                { label: 'Rollback Rate', current: '15%', projected: '3%' },
                { label: 'MTTR', current: '23min', projected: '5min' }
            ],
            steps: [
                'Configure traffic splitting in load balancer',
                'Set up monitoring for canary metrics',
                'Define automatic rollback thresholds'
            ]
        }
    ]);

    const generateNewRecommendations = async () => {
        setIsGenerating(true);
        try {
            const result = await InvokeLLM({
                prompt: `Analyze these project metrics and generate 3 specific, actionable recommendations to improve workflow efficiency:

Metrics:
- Success Rate: ${metrics?.successRate || 87}%
- Avg Execution Time: ${metrics?.avgExecutionTime || '2.4s'}
- Test Coverage: ${metrics?.testCoverage || 85}%
- Open Vulnerabilities: ${metrics?.openVulnerabilities || 2}

Generate recommendations focusing on:
1. Reducing execution time
2. Improving test coverage quality
3. Enhancing deployment reliability

Be specific with metrics and implementation steps.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        recommendations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    category: { type: "string", enum: ["performance", "quality", "testing", "deployment"] },
                                    title: { type: "string" },
                                    summary: { type: "string" },
                                    details: { type: "string" },
                                    impact: { type: "string", enum: ["high", "medium", "low"] },
                                    steps: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                }
            });

            if (result.recommendations) {
                setRecommendations(prev => [
                    ...result.recommendations.map((r, i) => ({ ...r, id: Date.now() + i })),
                    ...prev
                ]);
            }
        } catch (error) {
            console.error('Failed to generate recommendations:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const potentialSavings = recommendations.reduce((acc, r) => {
        if (r.impact === 'high') return acc + 25;
        if (r.impact === 'medium') return acc + 15;
        return acc + 5;
    }, 0);

    return (
        <div className="p-5 rounded-xl border border-slate-700/50 bg-slate-900/80">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">AI Recommendations</h3>
                        <p className="text-xs text-slate-500">Optimize workflows & reduce execution time</p>
                    </div>
                </div>
                <Button
                    onClick={generateNewRecommendations}
                    disabled={isGenerating}
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Refresh
                        </>
                    )}
                </Button>
            </div>

            {/* Potential Impact Summary */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-slate-300">Potential improvement if all applied</span>
                    </div>
                    <span className="text-lg font-bold text-cyan-400">+{potentialSavings}%</span>
                </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {recommendations.map((rec) => (
                    <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        onApply={(r) => console.log('Applied:', r.title)}
                    />
                ))}
            </div>
        </div>
    );
}