import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TestTube, ChevronDown, ChevronRight, CheckCircle2, FileCode } from 'lucide-react';
import { cn } from "@/lib/utils";

const testTypeColors = {
    unit: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    integration: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    e2e: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' }
};

function TestSuggestionCard({ suggestion, index }) {
    const [expanded, setExpanded] = React.useState(false);
    const config = testTypeColors[suggestion.test_type] || testTypeColors.unit;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "rounded-xl border p-4 cursor-pointer transition-all",
                "bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50"
            )}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                        <TestTube className={cn("w-4 h-4", config.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium capitalize",
                                config.bg, config.text
                            )}>
                                {suggestion.test_type}
                            </span>
                        </div>
                        <h4 className="font-medium text-white">
                            {suggestion.function_name || 'Test Coverage'}
                        </h4>
                        <p className="text-sm text-slate-400 mt-1">{suggestion.description}</p>
                        {suggestion.target_file && (
                            <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1">
                                <FileCode className="w-3 h-3" />
                                {suggestion.target_file}
                            </p>
                        )}
                    </div>
                </div>
                {expanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
            </div>

            <AnimatePresence>
                {expanded && suggestion.test_cases?.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                Suggested Test Cases
                            </p>
                            <ul className="space-y-2">
                                {suggestion.test_cases.map((testCase, idx) => (
                                    <li 
                                        key={idx}
                                        className="flex items-start gap-2 text-sm text-slate-300"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                        {testCase}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function TestSuggestionsPanel({ suggestions = [] }) {
    if (suggestions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TestTube className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Good Test Coverage</h3>
                <p className="text-slate-400 text-sm">No additional test suggestions at this time.</p>
            </div>
        );
    }

    // Group by test type
    const grouped = {
        unit: suggestions.filter(s => s.test_type === 'unit'),
        integration: suggestions.filter(s => s.test_type === 'integration'),
        e2e: suggestions.filter(s => s.test_type === 'e2e')
    };

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                {Object.entries(grouped).map(([type, items]) => {
                    const config = testTypeColors[type];
                    return (
                        <div 
                            key={type}
                            className={cn(
                                "p-3 rounded-xl border text-center",
                                config.bg, config.border
                            )}
                        >
                            <div className={cn("text-2xl font-bold", config.text)}>
                                {items.length}
                            </div>
                            <div className="text-xs text-slate-400 capitalize">{type} tests</div>
                        </div>
                    );
                })}
            </div>

            {/* Suggestions list */}
            <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                    <TestSuggestionCard key={idx} suggestion={suggestion} index={idx} />
                ))}
            </div>
        </div>
    );
}