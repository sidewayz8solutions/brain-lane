import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Code, Zap, Trash2, RefreshCw, FileCode } from 'lucide-react';
import { cn } from "@/lib/utils";

const smellTypeConfig = {
    'duplicate_code': { icon: Code, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    'long_function': { icon: FileCode, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    'dead_code': { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/20' },
    'performance': { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    'naming': { icon: Code, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    'default': { icon: AlertTriangle, color: 'text-slate-400', bg: 'bg-slate-500/20' }
};

const severityColors = {
    critical: 'border-red-500/50 bg-red-500/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    medium: 'border-yellow-500/50 bg-yellow-500/10',
    low: 'border-slate-500/50 bg-slate-500/10'
};

export default function CodeSmellsPanel({ codeSmells = [] }) {
    if (codeSmells.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Code className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Code Quality Looks Good</h3>
                <p className="text-slate-400 text-sm">No major code smells detected.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <div>
                    <span className="text-white font-medium">{codeSmells.length}</span>
                    <span className="text-slate-400 ml-2">code quality issues found</span>
                </div>
            </div>

            {/* Smells list */}
            <div className="space-y-3">
                {codeSmells.map((smell, idx) => {
                    const typeKey = smell.type?.toLowerCase().replace(/\s+/g, '_') || 'default';
                    const config = smellTypeConfig[typeKey] || smellTypeConfig.default;
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                                "p-4 rounded-xl border",
                                severityColors[smell.severity] || severityColors.medium
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <div className={cn("p-2 rounded-lg", config.bg)}>
                                    <Icon className={cn("w-4 h-4", config.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 capitalize">
                                            {smell.type || 'Code Smell'}
                                        </span>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded capitalize",
                                            smell.severity === 'critical' && "bg-red-500/30 text-red-300",
                                            smell.severity === 'high' && "bg-orange-500/30 text-orange-300",
                                            smell.severity === 'medium' && "bg-yellow-500/30 text-yellow-300",
                                            smell.severity === 'low' && "bg-slate-500/30 text-slate-300"
                                        )}>
                                            {smell.severity}
                                        </span>
                                    </div>
                                    <p className="text-white text-sm mb-1">{smell.description}</p>
                                    {smell.file && (
                                        <p className="text-xs text-slate-500 font-mono">{smell.file}</p>
                                    )}
                                    {smell.suggestion && (
                                        <div className="mt-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
                                            <p className="text-xs text-slate-500 mb-1">💡 Suggestion</p>
                                            <p className="text-sm text-green-400">{smell.suggestion}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}