import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

const severityConfig = {
    critical: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', badge: 'bg-red-500' },
    high: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', badge: 'bg-orange-500' },
    medium: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', badge: 'bg-yellow-500' },
    low: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', badge: 'bg-blue-500' }
};

function VulnerabilityCard({ vuln, index }) {
    const [expanded, setExpanded] = React.useState(false);
    const config = severityConfig[vuln.severity] || severityConfig.medium;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "rounded-xl border p-4 cursor-pointer transition-all",
                config.bg, config.border,
                expanded && "ring-1 ring-white/10"
            )}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                        <Shield className={cn("w-4 h-4", config.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            {vuln.cwe_id && (
                                <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-700 text-slate-300">
                                    {vuln.cwe_id}
                                </span>
                            )}
                            <span className={cn("px-2 py-0.5 rounded text-xs font-medium text-white", config.badge)}>
                                {vuln.severity}
                            </span>
                        </div>
                        <h4 className="font-medium text-white">{vuln.title}</h4>
                        {vuln.file && (
                            <p className="text-sm text-slate-400 font-mono mt-1">
                                {vuln.file}{vuln.line ? `:${vuln.line}` : ''}
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
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Description</p>
                                <p className="text-sm text-slate-300">{vuln.description}</p>
                            </div>
                            {vuln.recommendation && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recommendation</p>
                                    <p className="text-sm text-green-400">{vuln.recommendation}</p>
                                </div>
                            )}
                            {vuln.cwe_id && (
                                <a
                                    href={`https://cwe.mitre.org/data/definitions/${vuln.cwe_id.replace('CWE-', '')}.html`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                                >
                                    Learn more about {vuln.cwe_id}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function SecurityPanel({ vulnerabilities = [] }) {
    const groupedBySeverity = {
        critical: vulnerabilities.filter(v => v.severity === 'critical'),
        high: vulnerabilities.filter(v => v.severity === 'high'),
        medium: vulnerabilities.filter(v => v.severity === 'medium'),
        low: vulnerabilities.filter(v => v.severity === 'low')
    };

    if (vulnerabilities.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Security Issues Found</h3>
                <p className="text-slate-400 text-sm">Your codebase looks secure!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
                {Object.entries(groupedBySeverity).map(([severity, items]) => (
                    <div 
                        key={severity}
                        className={cn(
                            "p-3 rounded-xl border text-center",
                            severityConfig[severity].bg,
                            severityConfig[severity].border
                        )}
                    >
                        <div className={cn("text-2xl font-bold", severityConfig[severity].text)}>
                            {items.length}
                        </div>
                        <div className="text-xs text-slate-400 capitalize">{severity}</div>
                    </div>
                ))}
            </div>

            {/* Vulnerabilities list */}
            <div className="space-y-3">
                {vulnerabilities.map((vuln, idx) => (
                    <VulnerabilityCard key={idx} vuln={vuln} index={idx} />
                ))}
            </div>
        </div>
    );
}