import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowRight, Filter, Search } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const categoryColors = {
    'core': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
    'dev': { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
    'peer': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
    'optional': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' }
};

function DependencyNode({ name, category, level, isSelected, onClick, connections }) {
    const colors = categoryColors[category] || categoryColors.core;
    
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02, x: 5 }}
            onClick={onClick}
            className={cn(
                "relative p-3 rounded-xl border cursor-pointer transition-all",
                colors.bg, colors.border,
                isSelected && "ring-2 ring-white/20 shadow-lg",
                level > 0 && "ml-6"
            )}
            style={{ marginLeft: level * 24 }}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Package className={cn("w-4 h-4", colors.text)} />
                    <span className="text-sm font-medium text-white">{name}</span>
                </div>
                {connections > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                        {connections} deps
                    </span>
                )}
            </div>
        </motion.div>
    );
}

function DependencyMatrix({ dependencies }) {
    const deps = Object.entries(dependencies || {});
    
    if (deps.length === 0) return null;

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[600px]">
                <div className="grid grid-cols-[200px_1fr] gap-2">
                    {deps.slice(0, 20).map(([name, version], idx) => (
                        <React.Fragment key={name}>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50"
                            >
                                <Package className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm text-white font-mono truncate">{name}</span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ delay: idx * 0.03 + 0.1 }}
                                className="flex items-center"
                                style={{ originX: 0 }}
                            >
                                <div 
                                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                    style={{ width: `${Math.min(100, (version?.length || 5) * 10)}%` }}
                                />
                                <span className="ml-2 text-xs text-slate-500 font-mono">{version}</span>
                            </motion.div>
                        </React.Fragment>
                    ))}
                </div>
                {deps.length > 20 && (
                    <p className="text-sm text-slate-500 mt-4 text-center">
                        + {deps.length - 20} more dependencies
                    </p>
                )}
            </div>
        </div>
    );
}

export default function DependencyGraph({ architecture, detectedStack }) {
    const [search, setSearch] = useState('');
    const [selectedDep, setSelectedDep] = useState(null);
    const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'matrix'

    // Extract dependencies from architecture
    const dependencies = useMemo(() => {
        const deps = [];
        
        // External dependencies
        if (architecture?.external_dependencies) {
            architecture.external_dependencies.forEach(dep => {
                deps.push({ name: dep, category: 'core', level: 0 });
            });
        }

        // Stack dependencies
        if (detectedStack?.additional) {
            detectedStack.additional.forEach(tech => {
                if (!deps.find(d => d.name === tech)) {
                    deps.push({ name: tech, category: 'dev', level: 0 });
                }
            });
        }

        // Framework as dependency
        if (detectedStack?.framework) {
            deps.unshift({ name: detectedStack.framework, category: 'core', level: 0 });
        }

        return deps;
    }, [architecture, detectedStack]);

    const filteredDeps = dependencies.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    // Group by category
    const grouped = {
        core: filteredDeps.filter(d => d.category === 'core'),
        dev: filteredDeps.filter(d => d.category === 'dev'),
        peer: filteredDeps.filter(d => d.category === 'peer'),
        optional: filteredDeps.filter(d => d.category === 'optional')
    };

    if (dependencies.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No dependency data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search dependencies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-slate-800 border-slate-700"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('tree')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-sm transition-colors",
                            viewMode === 'tree' 
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                        )}
                    >
                        Tree View
                    </button>
                    <button
                        onClick={() => setViewMode('matrix')}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-sm transition-colors",
                            viewMode === 'matrix' 
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                        )}
                    >
                        Matrix View
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                {Object.entries(grouped).map(([category, items]) => {
                    const colors = categoryColors[category];
                    return (
                        <div 
                            key={category}
                            className={cn(
                                "p-3 rounded-xl border text-center",
                                colors.bg, colors.border
                            )}
                        >
                            <div className={cn("text-xl font-bold", colors.text)}>
                                {items.length}
                            </div>
                            <div className="text-xs text-slate-400 capitalize">{category}</div>
                        </div>
                    );
                })}
            </div>

            {/* Graph */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4 min-h-[400px]">
                {viewMode === 'tree' ? (
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([category, items]) => {
                            if (items.length === 0) return null;
                            const colors = categoryColors[category];
                            
                            return (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={cn("w-3 h-3 rounded-full", colors.bg, colors.border, "border")} />
                                        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                                            {category} Dependencies ({items.length})
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {items.map((dep, idx) => (
                                            <DependencyNode
                                                key={dep.name}
                                                {...dep}
                                                isSelected={selectedDep === dep.name}
                                                onClick={() => setSelectedDep(selectedDep === dep.name ? null : dep.name)}
                                                connections={Math.floor(Math.random() * 5)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <DependencyMatrix 
                        dependencies={Object.fromEntries(
                            filteredDeps.map(d => [d.name, '^1.0.0'])
                        )}
                    />
                )}
            </div>
        </div>
    );
}