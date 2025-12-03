import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { 
    Shield, 
    Zap, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle,
    Loader2,
    Bug,
    Lock,
    Gauge,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Sparkles
} from 'lucide-react';

const severityConfig = {
    critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    info: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
};

const categoryIcons = {
    security: Lock,
    performance: Gauge,
    regression: Bug,
    best_practice: BookOpen
};

function ReviewIssue({ issue }) {
    const [expanded, setExpanded] = useState(false);
    const severity = severityConfig[issue.severity] || severityConfig.info;
    const SeverityIcon = severity.icon;
    const CategoryIcon = categoryIcons[issue.category] || BookOpen;

    return (
        <div className={cn(
            "rounded-lg border p-3",
            severity.bg, severity.border
        )}>
            <div 
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <SeverityIcon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", severity.color)} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <CategoryIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-400 capitalize">{issue.category?.replace('_', ' ')}</span>
                        {issue.file && (
                            <span className="text-xs text-slate-500 font-mono truncate">
                                {issue.file}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-white">{issue.title}</p>
                </div>
                {issue.details && (
                    expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </div>
            
            {expanded && issue.details && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-slate-700/50"
                >
                    <p className="text-sm text-slate-300 leading-relaxed">{issue.details}</p>
                    {issue.suggestion && (
                        <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-400">
                            <span className="text-cyan-400 font-medium">Suggestion:</span> {issue.suggestion}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default function CodeReviewPanel({ diff, onReviewComplete, isReviewing, setIsReviewing }) {
    const [review, setReview] = useState(null);
    const [error, setError] = useState(null);

    const runCodeReview = async () => {
        if (!diff?.files || diff.files.length === 0) return;
        
        setIsReviewing(true);
        setError(null);

        try {
            // Build diff content for review
            let diffContent = '';
            for (const file of diff.files) {
                diffContent += `\n=== ${file.path} ===\n`;
                diffContent += `ORIGINAL:\n${file.original?.substring(0, 3000) || '(new file)'}\n`;
                diffContent += `MODIFIED:\n${file.modified?.substring(0, 3000) || '(deleted)'}\n`;
            }

            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `You are an expert code reviewer. Analyze these code changes and provide a thorough review.

CODE CHANGES:
${diffContent}

Review for:
1. SECURITY: SQL injection, XSS, authentication issues, exposed secrets
2. PERFORMANCE: N+1 queries, memory leaks, unnecessary re-renders, inefficient algorithms
3. REGRESSIONS: Breaking changes, removed functionality, changed behavior
4. BEST PRACTICES: Code style, naming, error handling, edge cases, maintainability

Provide a concise but thorough review. Be specific about issues and provide actionable suggestions.
If the code looks good, say so - don't invent issues.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        overall_score: { 
                            type: "number",
                            description: "Score from 1-10, where 10 is perfect"
                        },
                        summary: { 
                            type: "string",
                            description: "Brief overall assessment"
                        },
                        approved: {
                            type: "boolean",
                            description: "Whether the code is safe to merge"
                        },
                        issues: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    severity: { type: "string", enum: ["critical", "warning", "info", "success"] },
                                    category: { type: "string", enum: ["security", "performance", "regression", "best_practice"] },
                                    title: { type: "string" },
                                    file: { type: "string" },
                                    details: { type: "string" },
                                    suggestion: { type: "string" }
                                }
                            }
                        },
                        highlights: {
                            type: "array",
                            items: { type: "string" },
                            description: "Positive aspects of the code"
                        }
                    }
                }
            });

            setReview(result);
            onReviewComplete?.(result);

        } catch (err) {
            console.error('Code review error:', err);
            setError('Failed to complete code review');
        } finally {
            setIsReviewing(false);
        }
    };

    // Auto-run review when diff is provided
    React.useEffect(() => {
        if (diff?.files?.length > 0 && !review && !isReviewing) {
            runCodeReview();
        }
    }, [diff]);

    if (isReviewing) {
        return (
            <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 text-slate-300">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    <span>AI is reviewing code changes...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 rounded-xl border border-red-500/30 p-4">
                <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={runCodeReview}
                    className="mt-3"
                >
                    Retry Review
                </Button>
            </div>
        );
    }

    if (!review) return null;

    const criticalCount = review.issues?.filter(i => i.severity === 'critical').length || 0;
    const warningCount = review.issues?.filter(i => i.severity === 'warning').length || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden"
        >
            {/* Header */}
            <div className={cn(
                "p-4 border-b",
                review.approved ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            review.approved ? "bg-green-500/20" : "bg-red-500/20"
                        )}>
                            {review.approved ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                AI Code Review
                            </h3>
                            <p className="text-sm text-slate-400">
                                {review.approved ? 'Changes look good!' : 'Issues found - please review'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right">
                        <div className={cn(
                            "text-2xl font-bold",
                            review.overall_score >= 8 ? "text-green-400" :
                            review.overall_score >= 6 ? "text-yellow-400" : "text-red-400"
                        )}>
                            {review.overall_score}/10
                        </div>
                        <p className="text-xs text-slate-500">Quality Score</p>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="p-4 border-b border-slate-700/50">
                <p className="text-sm text-slate-300 leading-relaxed">{review.summary}</p>
                
                {/* Quick stats */}
                <div className="flex gap-4 mt-3">
                    {criticalCount > 0 && (
                        <span className="text-xs flex items-center gap-1 text-red-400">
                            <XCircle className="w-3.5 h-3.5" />
                            {criticalCount} critical
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="text-xs flex items-center gap-1 text-yellow-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {warningCount} warnings
                        </span>
                    )}
                    {review.highlights?.length > 0 && (
                        <span className="text-xs flex items-center gap-1 text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {review.highlights.length} highlights
                        </span>
                    )}
                </div>
            </div>

            {/* Issues */}
            {review.issues?.length > 0 && (
                <div className="p-4 space-y-3">
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Issues & Suggestions</h4>
                    {review.issues.map((issue, idx) => (
                        <ReviewIssue key={idx} issue={issue} />
                    ))}
                </div>
            )}

            {/* Highlights */}
            {review.highlights?.length > 0 && (
                <div className="p-4 border-t border-slate-700/50">
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Highlights</h4>
                    <ul className="space-y-2">
                        {review.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                {highlight}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}