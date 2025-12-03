import React from 'react';
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, Bug, FileCode } from 'lucide-react';

const severityConfig = {
    critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    high: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    medium: { icon: Bug, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
};

export default function IssuesList({ issues }) {
    if (!issues || issues.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Info className="w-6 h-6 text-green-400" />
                </div>
                No issues detected
            </div>
        );
    }

    // Group by severity
    const grouped = issues.reduce((acc, issue) => {
        const sev = issue.severity || 'medium';
        if (!acc[sev]) acc[sev] = [];
        acc[sev].push(issue);
        return acc;
    }, {});

    const order = ['critical', 'high', 'medium', 'low'];

    return (
        <div className="space-y-4">
            {order.map(severity => {
                const items = grouped[severity];
                if (!items?.length) return null;
                
                const config = severityConfig[severity];
                const Icon = config.icon;

                return (
                    <div key={severity}>
                        <h4 className={cn(
                            "text-xs font-medium uppercase tracking-wider mb-2",
                            config.color
                        )}>
                            {severity} ({items.length})
                        </h4>
                        <div className="space-y-2">
                            {items.map((issue, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "p-3 rounded-lg border",
                                        config.bg, config.border
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.color)} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white">{issue.description}</p>
                                            {issue.file && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <FileCode className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="text-xs text-slate-400 font-mono truncate">
                                                        {issue.file}
                                                        {issue.line && `:${issue.line}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}