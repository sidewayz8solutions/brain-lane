import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from "@/lib/utils";
import {
    ArrowUpDown,
    Filter,
    GripVertical,
    Flame,
    Clock,
    AlertTriangle,
    Shield,
    Bug,
    Zap,
    RefreshCw,
    TestTube,
    FileText,
    ChevronDown,
    ChevronUp,
    SortAsc,
    SortDesc,
    Layers,
    Target,
    TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const effortOrder = { small: 0, medium: 1, large: 2 };

const priorityConfig = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50', icon: Flame, score: 100 },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/50', icon: AlertTriangle, score: 75 },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', icon: Clock, score: 50 },
    low: { color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/50', icon: Clock, score: 25 }
};

const categoryConfig = {
    security: { icon: Shield, color: 'text-orange-400', weight: 1.5 },
    bugfix: { icon: Bug, color: 'text-red-400', weight: 1.3 },
    feature: { icon: Zap, color: 'text-blue-400', weight: 1.0 },
    refactor: { icon: RefreshCw, color: 'text-purple-400', weight: 0.9 },
    test: { icon: TestTube, color: 'text-green-400', weight: 0.8 },
    documentation: { icon: FileText, color: 'text-yellow-400', weight: 0.6 }
};

const sortOptions = [
    { id: 'smart', label: 'Smart Priority', icon: Target, description: 'AI-optimized order' },
    { id: 'priority', label: 'Priority', icon: Flame, description: 'Critical first' },
    { id: 'effort', label: 'Effort', icon: TrendingUp, description: 'Quick wins first' },
    { id: 'category', label: 'Category', icon: Layers, description: 'Group by type' },
    { id: 'impact', label: 'Impact Score', icon: Zap, description: 'Highest impact first' }
];

// Calculate smart priority score
function calculateSmartScore(task) {
    const priorityScore = priorityConfig[task.priority]?.score || 50;
    const categoryWeight = categoryConfig[task.category]?.weight || 1.0;
    
    // Effort bonus (smaller = higher score for quick wins)
    const effortBonus = task.estimated_effort === 'small' ? 20 : 
                        task.estimated_effort === 'medium' ? 10 : 0;
    
    // Files impact (more files = potentially more impactful)
    const filesBonus = Math.min((task.files_affected?.length || 0) * 5, 25);
    
    // Security tasks get extra priority
    const securityBonus = task.category === 'security' ? 30 : 0;
    
    // Bug fixes are urgent
    const bugBonus = task.category === 'bugfix' ? 15 : 0;
    
    return Math.round((priorityScore * categoryWeight) + effortBonus + filesBonus + securityBonus + bugBonus);
}

export default function TaskPrioritizer({ 
    tasks, 
    onReorder, 
    onFilterChange,
    activeFilters = {},
    sortBy = 'smart',
    onSortChange 
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [sortDirection, setSortDirection] = useState('desc');

    // Calculate scores for all tasks
    const tasksWithScores = useMemo(() => {
        return tasks.map(task => ({
            ...task,
            smartScore: calculateSmartScore(task)
        }));
    }, [tasks]);

    // Sort tasks
    const sortedTasks = useMemo(() => {
        const sorted = [...tasksWithScores];
        
        switch (sortBy) {
            case 'smart':
                sorted.sort((a, b) => b.smartScore - a.smartScore);
                break;
            case 'priority':
                sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'effort':
                sorted.sort((a, b) => effortOrder[a.estimated_effort || 'medium'] - effortOrder[b.estimated_effort || 'medium']);
                break;
            case 'category':
                sorted.sort((a, b) => {
                    const catA = categoryConfig[a.category]?.weight || 1;
                    const catB = categoryConfig[b.category]?.weight || 1;
                    return catB - catA;
                });
                break;
            case 'impact':
                sorted.sort((a, b) => (b.files_affected?.length || 0) - (a.files_affected?.length || 0));
                break;
            default:
                break;
        }
        
        if (sortDirection === 'asc') sorted.reverse();
        return sorted;
    }, [tasksWithScores, sortBy, sortDirection]);

    // Priority breakdown stats
    const stats = useMemo(() => ({
        critical: tasks.filter(t => t.priority === 'critical').length,
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length,
        avgScore: Math.round(tasksWithScores.reduce((sum, t) => sum + t.smartScore, 0) / (tasks.length || 1))
    }), [tasks, tasksWithScores]);

    const currentSort = sortOptions.find(s => s.id === sortBy);

    return (
        <div className="space-y-3">
            {/* Controls Row */}
            <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/50 gap-2">
                            {currentSort && <currentSort.icon className="w-3.5 h-3.5" />}
                            <span className="text-xs">{currentSort?.label || 'Sort'}</span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-700">
                        <DropdownMenuLabel className="text-xs text-slate-500">Sort By</DropdownMenuLabel>
                        {sortOptions.map(option => (
                            <DropdownMenuItem
                                key={option.id}
                                onClick={() => onSortChange?.(option.id)}
                                className={cn(
                                    "flex items-center gap-3 cursor-pointer",
                                    sortBy === option.id && "bg-slate-800"
                                )}
                            >
                                <option.icon className="w-4 h-4 text-slate-400" />
                                <div className="flex-1">
                                    <p className="text-sm">{option.label}</p>
                                    <p className="text-xs text-slate-500">{option.description}</p>
                                </div>
                                {sortBy === option.id && (
                                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem
                            onClick={() => setSortDirection(d => d === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-3 cursor-pointer"
                        >
                            {sortDirection === 'desc' ? (
                                <SortDesc className="w-4 h-4 text-slate-400" />
                            ) : (
                                <SortAsc className="w-4 h-4 text-slate-400" />
                            )}
                            <span>{sortDirection === 'desc' ? 'Descending' : 'Ascending'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/50 gap-2">
                            <Filter className="w-3.5 h-3.5" />
                            <span className="text-xs">Filter</span>
                            {Object.keys(activeFilters).length > 0 && (
                                <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-cyan-500/20 text-cyan-400">
                                    {Object.keys(activeFilters).length}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-700">
                        <DropdownMenuLabel className="text-xs text-slate-500">Priority</DropdownMenuLabel>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                            <DropdownMenuItem
                                key={key}
                                onClick={() => onFilterChange?.('priority', key)}
                                className={cn(
                                    "flex items-center gap-3 cursor-pointer",
                                    activeFilters.priority === key && "bg-slate-800"
                                )}
                            >
                                <config.icon className={cn("w-4 h-4", config.color)} />
                                <span className="capitalize">{key}</span>
                                {activeFilters.priority === key && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuLabel className="text-xs text-slate-500">Category</DropdownMenuLabel>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                            <DropdownMenuItem
                                key={key}
                                onClick={() => onFilterChange?.('category', key)}
                                className={cn(
                                    "flex items-center gap-3 cursor-pointer",
                                    activeFilters.category === key && "bg-slate-800"
                                )}
                            >
                                <config.icon className={cn("w-4 h-4", config.color)} />
                                <span className="capitalize">{key}</span>
                                {activeFilters.category === key && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-cyan-400" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        {Object.keys(activeFilters).length > 0 && (
                            <>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem
                                    onClick={() => onFilterChange?.('clear')}
                                    className="text-slate-400 cursor-pointer"
                                >
                                    Clear all filters
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Expand Stats Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-auto text-slate-400 hover:text-white"
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
            </div>

            {/* Expanded Stats Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
                            {/* Priority Distribution */}
                            <div>
                                <p className="text-xs text-slate-500 mb-2">Priority Distribution</p>
                                <div className="flex gap-2">
                                    {Object.entries(priorityConfig).map(([key, config]) => (
                                        <motion.div
                                            key={key}
                                            className={cn(
                                                "flex-1 p-2 rounded-lg border text-center",
                                                config.bg, config.border
                                            )}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <div className={cn("text-lg font-bold", config.color)}>
                                                {stats[key]}
                                            </div>
                                            <div className="text-xs text-slate-500 capitalize">{key}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Average Score */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                                <span className="text-xs text-slate-500">Average Smart Score</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.avgScore}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-cyan-400">{stats.avgScore}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sorted Tasks Info */}
            {sortBy === 'smart' && tasks.length > 0 && (
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-slate-500 px-1"
                >
                    ✨ Tasks sorted by AI-optimized priority score
                </motion.p>
            )}
        </div>
    );
}

// Export the score calculation for use in other components
export { calculateSmartScore, priorityConfig, categoryConfig };