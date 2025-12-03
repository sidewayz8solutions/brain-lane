import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
    ChevronRight, 
    Zap, 
    Bug, 
    RefreshCw, 
    TestTube, 
    FileText, 
    Shield,
    Clock,
    Loader2,
    CheckCircle2,
    XCircle,
    Sparkles
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { calculateSmartScore } from './TaskPrioritizer';

const categoryConfig = {
    feature: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/20', glow: 'shadow-blue-500/20' },
    bugfix: { icon: Bug, color: 'text-red-400', bg: 'bg-red-500/20', glow: 'shadow-red-500/20' },
    refactor: { icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/20', glow: 'shadow-purple-500/20' },
    test: { icon: TestTube, color: 'text-green-400', bg: 'bg-green-500/20', glow: 'shadow-green-500/20' },
    documentation: { icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-500/20', glow: 'shadow-yellow-500/20' },
    security: { icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/20', glow: 'shadow-orange-500/20' }
};

const priorityColors = {
    critical: 'border-red-500/50 bg-red-500/5 hover:border-red-400/60',
    high: 'border-orange-500/50 bg-orange-500/5 hover:border-orange-400/60',
    medium: 'border-yellow-500/50 bg-yellow-500/5 hover:border-yellow-400/60',
    low: 'border-slate-600/50 hover:border-slate-500/60'
};

export default function TaskCard({ task, onClick, isActive, showScore = false }) {
    const [isHovered, setIsHovered] = useState(false);
    const category = categoryConfig[task.category] || categoryConfig.feature;
    const CategoryIcon = category.icon;
    const smartScore = showScore ? calculateSmartScore(task) : null;

    // Mouse tracking for glow effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const glowX = useSpring(mouseX, { damping: 25, stiffness: 150 });
    const glowY = useSpring(mouseY, { damping: 25, stiffness: 150 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        mouseX.set(x);
        mouseY.set(y);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "relative p-4 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden",
                "bg-slate-800/50 backdrop-blur-sm",
                priorityColors[task.priority] || 'border-slate-700/50',
                isActive && "ring-2 ring-cyan-500/50 border-cyan-500/50 bg-slate-800/80"
            )}
        >
            {/* Dynamic glow effect */}
            {isHovered && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at ${glowX.get()}% ${glowY.get()}%, rgba(6, 182, 212, 0.08), transparent 50%)`,
                    }}
                />
            )}

            {/* Shine effect on hover */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0, x: '-100%' }}
                animate={{ 
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? '100%' : '-100%'
                }}
                transition={{ duration: 0.6 }}
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
                    transform: 'skewX(-20deg)',
                }}
            />

            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <motion.div 
                        className={cn(
                            "p-2.5 rounded-xl flex-shrink-0 transition-all duration-300",
                            category.bg,
                            isHovered && `shadow-lg ${category.glow}`
                        )}
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.4 }}
                    >
                        <CategoryIcon className={cn("w-4 h-4", category.color)} />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate group-hover:text-cyan-50 transition-colors">
                            {task.title}
                        </h3>
                        {task.description && (
                            <p className="text-slate-400 text-sm mt-1.5 line-clamp-2 leading-relaxed">
                                {task.description}
                            </p>
                        )}
                        
                        {/* Meta info with micro animations */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <StatusBadge status={task.status} />
                            {task.estimated_effort && (
                                <motion.span 
                                    className="text-xs text-slate-500 capitalize px-2 py-0.5 rounded-full bg-slate-700/50"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    {task.estimated_effort}
                                </motion.span>
                            )}
                            {task.files_affected?.length > 0 && (
                                <motion.span 
                                    className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-700/50"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    {task.files_affected.length} file{task.files_affected.length !== 1 ? 's' : ''}
                                </motion.span>
                            )}
                            {smartScore !== null && (
                                <motion.span 
                                    className="text-xs text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 font-medium"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Score: {smartScore}
                                </motion.span>
                            )}
                        </div>
                    </div>
                </div>

                <motion.div
                    animate={{ x: isHovered ? 4 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                    <ChevronRight className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors duration-300",
                        isHovered ? "text-cyan-400" : "text-slate-500"
                    )} />
                </motion.div>
            </div>

            {/* Active indicator */}
            {isActive && (
                <motion.div
                    layoutId="activeTaskIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
        </motion.div>
    );
}