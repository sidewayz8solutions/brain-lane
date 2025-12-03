import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { FileCode, Plus, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function DiffLine({ type, content, lineNumber }) {
    const styles = {
        addition: 'bg-green-500/10 text-green-400',
        deletion: 'bg-red-500/10 text-red-400',
        context: 'text-slate-400'
    };

    const icons = {
        addition: <Plus className="w-3 h-3 text-green-500" />,
        deletion: <Minus className="w-3 h-3 text-red-500" />,
        context: <span className="w-3" />
    };

    return (
        <div className={cn(
            "flex items-start font-mono text-xs leading-6 border-l-2",
            type === 'addition' ? 'border-green-500' : type === 'deletion' ? 'border-red-500' : 'border-transparent',
            styles[type]
        )}>
            <span className="w-12 text-right pr-3 text-slate-600 select-none flex-shrink-0">
                {lineNumber}
            </span>
            <span className="w-6 flex items-center justify-center flex-shrink-0">
                {icons[type]}
            </span>
            <pre className="flex-1 overflow-x-auto whitespace-pre">
                {content}
            </pre>
        </div>
    );
}

function FileDiff({ file }) {
    const [isExpanded, setIsExpanded] = useState(true);
    
    // Parse diff to get lines
    const parseContent = () => {
        const lines = [];
        const originalLines = (file.original || '').split('\n');
        const modifiedLines = (file.modified || '').split('\n');
        
        // Simple diff visualization
        let lineNum = 1;
        const maxLines = Math.max(originalLines.length, modifiedLines.length);
        
        for (let i = 0; i < maxLines; i++) {
            const origLine = originalLines[i];
            const modLine = modifiedLines[i];
            
            if (origLine === modLine) {
                if (origLine !== undefined) {
                    lines.push({ type: 'context', content: origLine, lineNumber: lineNum++ });
                }
            } else {
                if (origLine !== undefined && origLine !== '') {
                    lines.push({ type: 'deletion', content: origLine, lineNumber: lineNum });
                }
                if (modLine !== undefined && modLine !== '') {
                    lines.push({ type: 'addition', content: modLine, lineNumber: lineNum });
                }
                lineNum++;
            }
        }
        
        return lines;
    };

    const lines = parseContent();
    const additions = lines.filter(l => l.type === 'addition').length;
    const deletions = lines.filter(l => l.type === 'deletion').length;

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* File Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-sm text-white">{file.path}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-400">+{additions}</span>
                    <span className="text-red-400">-{deletions}</span>
                </div>
            </button>

            {/* Diff Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-slate-700/50 max-h-96 overflow-y-auto">
                            {lines.map((line, idx) => (
                                <DiffLine key={idx} {...line} />
                            ))}
                            {lines.length === 0 && (
                                <div className="p-4 text-center text-slate-500 text-sm">
                                    No changes
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function DiffViewer({ diff }) {
    if (!diff?.files || diff.files.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                No changes to display
            </div>
        );
    }

    const totalAdditions = diff.files.reduce((sum, f) => sum + (f.additions || 0), 0);
    const totalDeletions = diff.files.reduce((sum, f) => sum + (f.deletions || 0), 0);

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400">
                    {diff.files.length} file{diff.files.length !== 1 ? 's' : ''} changed
                </span>
                <span className="text-green-400">+{totalAdditions} additions</span>
                <span className="text-red-400">-{totalDeletions} deletions</span>
            </div>

            {/* File Diffs */}
            <div className="space-y-3">
                {diff.files.map((file, idx) => (
                    <FileDiff key={idx} file={file} />
                ))}
            </div>

            {/* Explanation */}
            {diff.explanation && (
                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">AI Explanation</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{diff.explanation}</p>
                </div>
            )}
        </div>
    );
}