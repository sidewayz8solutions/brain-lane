import React from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    FileCode, 
    Terminal, 
    GitBranch,
    Download,
    Copy,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DiffViewer from '../project/DiffViewer';

const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Completed' },
    approved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Approved' },
    rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Rejected' },
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Pending' },
    in_progress: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'In Progress' }
};

export default function ExecutionReport({ task, onApprove, onReject, onDownload }) {
    const config = statusConfig[task.status] || statusConfig.pending;
    const Icon = config.icon;
    const hasDiff = task.diff?.files?.length > 0;

    const copyDiff = () => {
        if (!hasDiff) return;
        
        const diffText = task.diff.files.map(file => {
            return `--- ${file.path}\n+++ ${file.path}\n${file.modified}`;
        }).join('\n\n');
        
        navigator.clipboard.writeText(diffText);
    };

    const downloadPatch = () => {
        if (!hasDiff) return;
        
        let patchContent = '';
        task.diff.files.forEach(file => {
            patchContent += `diff --git a/${file.path} b/${file.path}\n`;
            patchContent += `--- a/${file.path}\n`;
            patchContent += `+++ b/${file.path}\n`;
            
            // Generate unified diff format
            const originalLines = (file.original || '').split('\n');
            const modifiedLines = (file.modified || '').split('\n');
            
            patchContent += `@@ -1,${originalLines.length} +1,${modifiedLines.length} @@\n`;
            originalLines.forEach(line => {
                patchContent += `-${line}\n`;
            });
            modifiedLines.forEach(line => {
                patchContent += `+${line}\n`;
            });
            patchContent += '\n';
        });

        const blob = new Blob([patchContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${task.title.replace(/\s+/g, '-').toLowerCase()}.patch`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
        >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-xl", config.bg)}>
                            <Icon className={cn("w-6 h-6", config.color)} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-1">{task.title}</h2>
                            <div className="flex items-center gap-3 text-sm">
                                <span className={cn("px-2 py-0.5 rounded-full", config.bg, config.color)}>
                                    {config.label}
                                </span>
                                {task.category && (
                                    <span className="text-slate-500 capitalize">{task.category}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {task.status === 'completed' && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyDiff}
                                disabled={!hasDiff}
                                className="border-slate-700"
                            >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadPatch}
                                disabled={!hasDiff}
                                className="border-slate-700"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Download Patch
                            </Button>
                            <Button
                                onClick={onApprove}
                                size="sm"
                                className="bg-green-600 hover:bg-green-500"
                            >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                            </Button>
                            <Button
                                onClick={onReject}
                                variant="destructive"
                                size="sm"
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Explanation */}
            {task.ai_explanation && (
                <div className="p-6 border-b border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                        AI Explanation
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{task.ai_explanation}</p>
                </div>
            )}

            {/* Files Changed */}
            {hasDiff && (
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                            Files Changed
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-400">
                                +{task.diff.files.reduce((sum, f) => sum + (f.additions || 0), 0)}
                            </span>
                            <span className="text-red-400">
                                -{task.diff.files.reduce((sum, f) => sum + (f.deletions || 0), 0)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        {task.diff.files.map((file, idx) => (
                            <div 
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                            >
                                <div className="flex items-center gap-2">
                                    <FileCode className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-mono text-slate-300">{file.path}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-green-400">+{file.additions || 0}</span>
                                    <span className="text-red-400">-{file.deletions || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Diff Viewer */}
            {hasDiff && (
                <div className="p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                        Code Changes
                    </h3>
                    <DiffViewer diff={task.diff} />
                </div>
            )}

            {/* No changes */}
            {!hasDiff && task.status !== 'pending' && task.status !== 'in_progress' && (
                <div className="p-12 text-center text-slate-500">
                    <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No code changes generated</p>
                </div>
            )}
        </motion.div>
    );
}