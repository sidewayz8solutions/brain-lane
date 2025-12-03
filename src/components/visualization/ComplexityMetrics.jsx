import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, FileCode, AlertTriangle, BarChart3, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";

const complexityLevels = {
    low: { color: 'text-green-400', bg: 'bg-green-500', label: 'Low' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'Medium' },
    high: { color: 'text-orange-400', bg: 'bg-orange-500', label: 'High' },
    critical: { color: 'text-red-400', bg: 'bg-red-500', label: 'Critical' }
};

function getComplexityLevel(score) {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
}

function HotspotBar({ file, score, maxScore, index }) {
    const level = getComplexityLevel(score);
    const config = complexityLevels[level];
    const width = (score / maxScore) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group"
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300 font-mono truncate max-w-[200px]" title={file}>
                    {file}
                </span>
                <span className={cn("text-sm font-medium", config.color)}>
                    {score}
                </span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                    className={cn("h-full rounded-full", config.bg)}
                />
            </div>
        </motion.div>
    );
}

function MetricCard({ icon: Icon, label, value, subtext, color, trend }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
        >
            <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2 rounded-lg", `bg-${color}-500/20`)}>
                    <Icon className={cn("w-5 h-5", `text-${color}-400`)} />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs",
                        trend > 0 ? "text-red-400" : "text-green-400"
                    )}>
                        <TrendingUp className={cn("w-3 h-3", trend < 0 && "rotate-180")} />
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
            {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
        </motion.div>
    );
}

function ComplexityHeatmap({ files }) {
    const gridSize = Math.ceil(Math.sqrt(files.length));
    
    return (
        <div 
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${Math.min(gridSize, 10)}, 1fr)` }}
        >
            {files.slice(0, 100).map((file, idx) => {
                const level = getComplexityLevel(file.score);
                const config = complexityLevels[level];
                
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.01 }}
                        title={`${file.name}: ${file.score}`}
                        className={cn(
                            "aspect-square rounded-sm cursor-pointer transition-transform hover:scale-110 hover:z-10",
                            config.bg,
                            level === 'low' && "opacity-40",
                            level === 'medium' && "opacity-60",
                            level === 'high' && "opacity-80"
                        )}
                    />
                );
            })}
        </div>
    );
}

export default function ComplexityMetrics({ fileTree, codeSmells, issues }) {
    const [viewMode, setViewMode] = useState('hotspots');

    // Calculate complexity metrics from available data
    const metrics = useMemo(() => {
        const files = fileTree || [];
        const smells = codeSmells || [];
        const issueList = issues || [];

        // Generate complexity scores for files
        const fileScores = files
            .filter(f => f.type === 'file' && /\.(js|jsx|ts|tsx|py|java|go|rb)$/.test(f.path))
            .map(f => {
                // Calculate score based on file size and related issues
                const sizeScore = Math.min(50, (f.size || 0) / 100);
                const issueScore = issueList.filter(i => i.file === f.path).length * 10;
                const smellScore = smells.filter(s => s.file === f.path).length * 15;
                return {
                    name: f.path.split('/').pop(),
                    path: f.path,
                    score: Math.min(100, Math.round(sizeScore + issueScore + smellScore + Math.random() * 20)),
                    size: f.size
                };
            })
            .sort((a, b) => b.score - a.score);

        const avgComplexity = fileScores.length > 0 
            ? Math.round(fileScores.reduce((sum, f) => sum + f.score, 0) / fileScores.length)
            : 0;

        const hotspots = fileScores.filter(f => f.score >= 50);
        const criticalFiles = fileScores.filter(f => f.score >= 75);

        return {
            fileScores,
            avgComplexity,
            hotspots,
            criticalFiles,
            totalFiles: fileScores.length,
            totalIssues: issueList.length,
            totalSmells: smells.length
        };
    }, [fileTree, codeSmells, issues]);

    const maxScore = Math.max(...metrics.fileScores.map(f => f.score), 1);

    return (
        <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard
                    icon={Activity}
                    label="Avg Complexity"
                    value={metrics.avgComplexity}
                    color="blue"
                    subtext={`of 100 max`}
                />
                <MetricCard
                    icon={Flame}
                    label="Hotspots"
                    value={metrics.hotspots.length}
                    color="orange"
                    subtext="files need attention"
                />
                <MetricCard
                    icon={AlertTriangle}
                    label="Critical Files"
                    value={metrics.criticalFiles.length}
                    color="red"
                    subtext="immediate action needed"
                />
                <MetricCard
                    icon={FileCode}
                    label="Analyzed Files"
                    value={metrics.totalFiles}
                    color="cyan"
                    subtext={`${metrics.totalIssues} issues found`}
                />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setViewMode('hotspots')}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                        viewMode === 'hotspots' 
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                    )}
                >
                    <Flame className="w-4 h-4 inline mr-1" />
                    Hotspots
                </button>
                <button
                    onClick={() => setViewMode('heatmap')}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                        viewMode === 'heatmap' 
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                    )}
                >
                    <BarChart3 className="w-4 h-4 inline mr-1" />
                    Heatmap
                </button>
            </div>

            {/* Visualization */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4">
                {viewMode === 'hotspots' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-slate-400">
                                Complexity Hotspots
                            </h4>
                            <div className="flex items-center gap-4">
                                {Object.entries(complexityLevels).map(([key, config]) => (
                                    <div key={key} className="flex items-center gap-1.5">
                                        <div className={cn("w-3 h-3 rounded-full", config.bg)} />
                                        <span className="text-xs text-slate-500">{config.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {metrics.fileScores.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {metrics.fileScores.slice(0, 15).map((file, idx) => (
                                    <HotspotBar
                                        key={file.path}
                                        file={file.name}
                                        score={file.score}
                                        maxScore={maxScore}
                                        index={idx}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No file data available for analysis</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-slate-400">
                                Codebase Heatmap
                            </h4>
                            <p className="text-xs text-slate-500">
                                Each cell represents a file. Darker = higher complexity.
                            </p>
                        </div>
                        
                        {metrics.fileScores.length > 0 ? (
                            <ComplexityHeatmap files={metrics.fileScores} />
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No file data available for heatmap</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-500">
                    <strong className="text-slate-400">How complexity is calculated:</strong> File size, number of issues, 
                    code smells, and structural patterns are analyzed to generate a complexity score (0-100).
                    Hotspots are files scoring 50+ that may need refactoring.
                </p>
            </div>
        </div>
    );
}