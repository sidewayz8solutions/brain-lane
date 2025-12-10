import React from 'react';
import { motion } from 'framer-motion';
import { Box, ArrowRight, Database, Globe, Server, Layout, Layers } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useProjectStore } from '@/store/projectStore';

const componentIcons = {
    'frontend': Layout,
    'backend': Server,
    'database': Database,
    'api': Globe,
    'default': Box
};

export default function ArchitecturePanel({ architecture }) {
    const currentProject = useProjectStore((s) => s.currentProject);
    const baselineArch = currentProject?.architecture;
    const arch = architecture || baselineArch || null;

    if (!arch) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Architecture analysis not available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Architecture Pattern */}
            {arch.pattern && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Layers className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Architecture Pattern</p>
                            <p className="text-lg font-medium text-white">{arch.pattern}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Components */}
            {arch.components?.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                        Key Components
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {arch.components.map((component, idx) => {
                            const iconKey = component.name?.toLowerCase().includes('frontend') ? 'frontend'
                                : component.name?.toLowerCase().includes('backend') ? 'backend'
                                : component.name?.toLowerCase().includes('database') ? 'database'
                                : component.name?.toLowerCase().includes('api') ? 'api'
                                : 'default';
                            const Icon = componentIcons[iconKey];

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-slate-700/50">
                                            <Icon className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-white mb-1">{component.name}</h5>
                                            <p className="text-sm text-slate-400 mb-2">{component.responsibility}</p>
                                            {component.files?.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {component.files.slice(0, 3).map((file, i) => (
                                                        <span 
                                                            key={i}
                                                            className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400 font-mono truncate max-w-[150px]"
                                                        >
                                                            {file}
                                                        </span>
                                                    ))}
                                                    {component.files.length > 3 && (
                                                        <span className="text-xs text-slate-500">
                                                            +{component.files.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Data Flow */}
            {arch.data_flow && (
                <div>
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                        Data Flow
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <p className="text-sm text-slate-300 leading-relaxed">{arch.data_flow}</p>
                    </div>
                </div>
            )}

            {/* External Dependencies */}
            {arch.external_dependencies?.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                        External Dependencies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {arch.external_dependencies.map((dep, idx) => (
                            <motion.span
                                key={idx}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300"
                            >
                                {dep}
                            </motion.span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}