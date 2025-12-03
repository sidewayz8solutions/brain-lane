import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Brain,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Clock,
    Zap,
    Target,
    ChevronRight,
    Sparkles,
    Shield,
    Bug,
    Gauge,
    Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const riskLevels = {
    low: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' }
};

function PredictionCard({ prediction }) {
    const [expanded, setExpanded] = useState(false);
    const risk = riskLevels[prediction.riskLevel] || riskLevels.medium;

    return (
        <motion.div
            layout
            className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer",
                risk.bg, risk.border,
                expanded && "ring-1 ring-white/10"
            )}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", risk.bg)}>
                    {prediction.type === 'failure' && <AlertTriangle className={cn("w-4 h-4", risk.color)} />}
                    {prediction.type === 'delay' && <Clock className={cn("w-4 h-4", risk.color)} />}
                    {prediction.type === 'bottleneck' && <Gauge className={cn("w-4 h-4", risk.color)} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">{prediction.title}</span>
                        <Badge className={cn("text-[10px]", risk.bg, risk.color)}>
                            {Math.round(prediction.probability * 100)}% likely
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{prediction.summary}</p>
                    
                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                                    <p className="text-xs text-slate-300">{prediction.details}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Impact:</span>
                                        <Progress value={prediction.impact * 100} className="flex-1 h-1.5" />
                                        <span className="text-xs text-slate-400">{Math.round(prediction.impact * 100)}%</span>
                                    </div>
                                    {prediction.affectedWorkflows && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {prediction.affectedWorkflows.map((wf, idx) => (
                                                <Badge key={idx} variant="outline" className="text-[10px] border-slate-600">
                                                    {wf}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <ChevronRight className={cn(
                    "w-4 h-4 text-slate-500 transition-transform",
                    expanded && "rotate-90"
                )} />
            </div>
        </motion.div>
    );
}

export default function PredictiveInsights({ workflowData, executionData }) {
    // Generate predictions based on trends
    const predictions = React.useMemo(() => {
        const results = [];
        
        // Analyze failure trend
        const recentFailures = workflowData?.slice(-3).reduce((sum, d) => sum + (d.failed || 0), 0) || 0;
        const avgFailures = workflowData?.reduce((sum, d) => sum + (d.failed || 0), 0) / (workflowData?.length || 1);
        
        if (recentFailures > avgFailures * 1.5) {
            results.push({
                type: 'failure',
                title: 'Increased Failure Risk',
                summary: 'Workflow failures trending upward',
                details: `Recent failure rate is ${Math.round((recentFailures / avgFailures - 1) * 100)}% higher than average. Consider reviewing recent code changes and test coverage.`,
                probability: Math.min(0.85, 0.5 + (recentFailures / avgFailures - 1) * 0.3),
                impact: 0.7,
                riskLevel: recentFailures > avgFailures * 2 ? 'high' : 'medium',
                affectedWorkflows: ['Standard Implementation', 'Full Deployment']
            });
        }

        // Analyze execution time trend
        const recentAvgTime = executionData?.slice(-3).reduce((sum, d) => sum + (d.avgTime || 0), 0) / 3 || 0;
        const overallAvgTime = executionData?.reduce((sum, d) => sum + (d.avgTime || 0), 0) / (executionData?.length || 1);
        
        if (recentAvgTime > overallAvgTime * 1.2) {
            results.push({
                type: 'delay',
                title: 'Execution Slowdown Detected',
                summary: 'Workflow execution times increasing',
                details: `Average execution time has increased by ${Math.round((recentAvgTime / overallAvgTime - 1) * 100)}%. This may indicate growing complexity or resource constraints.`,
                probability: 0.72,
                impact: 0.5,
                riskLevel: 'medium',
                affectedWorkflows: ['Thorough Review', 'Full Deployment']
            });
        }

        // Bottleneck prediction
        results.push({
            type: 'bottleneck',
            title: 'Test Stage Bottleneck',
            summary: 'Test execution consuming 40% of workflow time',
            details: 'The testing phase is taking longer than optimal. Consider parallelizing tests or implementing test caching strategies.',
            probability: 0.65,
            impact: 0.45,
            riskLevel: 'low',
            affectedWorkflows: ['Standard Implementation', 'Thorough Review']
        });

        return results;
    }, [workflowData, executionData]);

    const overallRisk = predictions.length > 0 
        ? predictions.reduce((max, p) => {
            const levels = ['low', 'medium', 'high', 'critical'];
            return levels.indexOf(p.riskLevel) > levels.indexOf(max) ? p.riskLevel : max;
        }, 'low')
        : 'low';

    return (
        <div className="p-5 rounded-xl border border-slate-700/50 bg-slate-900/80">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Brain className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">Predictive Insights</h3>
                        <p className="text-xs text-slate-500">AI-powered failure & delay predictions</p>
                    </div>
                </div>
                <Badge className={cn(
                    riskLevels[overallRisk].bg,
                    riskLevels[overallRisk].color,
                    "capitalize"
                )}>
                    {overallRisk} risk
                </Badge>
            </div>

            <div className="space-y-3">
                {predictions.map((prediction, idx) => (
                    <PredictionCard key={idx} prediction={prediction} />
                ))}
                {predictions.length === 0 && (
                    <div className="text-center py-6 text-slate-500">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm">All systems healthy - no risks detected</p>
                    </div>
                )}
            </div>
        </div>
    );
}