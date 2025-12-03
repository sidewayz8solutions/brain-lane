import React from 'react';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Clock, Zap, AlertTriangle, Sparkles } from 'lucide-react';

const statusConfig = {
    uploading: { 
        icon: Loader2, 
        label: 'Uploading', 
        bg: 'bg-blue-500/20', 
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        glow: 'shadow-blue-500/20',
        iconClass: 'animate-spin'
    },
    analyzing: { 
        icon: Sparkles, 
        label: 'Analyzing', 
        bg: 'bg-cyan-500/20', 
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
        glow: 'shadow-cyan-500/20',
        iconClass: 'animate-pulse'
    },
    ready: { 
        icon: Zap, 
        label: 'Ready', 
        bg: 'bg-emerald-500/20', 
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        glow: 'shadow-emerald-500/20'
    },
    processing: { 
        icon: Loader2, 
        label: 'Processing', 
        bg: 'bg-yellow-500/20', 
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
        glow: 'shadow-yellow-500/20',
        iconClass: 'animate-spin'
    },
    completed: { 
        icon: CheckCircle2, 
        label: 'Completed', 
        bg: 'bg-green-500/20', 
        text: 'text-green-400',
        border: 'border-green-500/30',
        glow: 'shadow-green-500/20'
    },
    error: { 
        icon: XCircle, 
        label: 'Error', 
        bg: 'bg-red-500/20', 
        text: 'text-red-400',
        border: 'border-red-500/30',
        glow: 'shadow-red-500/20'
    },
    pending: { 
        icon: Clock, 
        label: 'Pending', 
        bg: 'bg-slate-500/20', 
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        glow: 'shadow-slate-500/20'
    },
    in_progress: { 
        icon: Loader2, 
        label: 'In Progress', 
        bg: 'bg-blue-500/20', 
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        glow: 'shadow-blue-500/20',
        iconClass: 'animate-spin'
    },
    approved: { 
        icon: CheckCircle2, 
        label: 'Approved', 
        bg: 'bg-green-500/20', 
        text: 'text-green-400',
        border: 'border-green-500/30',
        glow: 'shadow-green-500/20'
    },
    rejected: { 
        icon: XCircle, 
        label: 'Rejected', 
        bg: 'bg-red-500/20', 
        text: 'text-red-400',
        border: 'border-red-500/30',
        glow: 'shadow-red-500/20'
    }
};

export default function StatusBadge({ status, showLabel = true, size = 'default' }) {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    const sizes = {
        sm: 'px-2 py-0.5 text-[10px]',
        default: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        default: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    };
    
    return (
        <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full font-medium border backdrop-blur-sm",
                "transition-all duration-300 hover:shadow-md",
                sizes[size],
                config.bg, 
                config.text,
                config.border,
                `hover:${config.glow}`
            )}
        >
            <Icon className={cn(iconSizes[size], config.iconClass)} />
            {showLabel && (
                <span className="relative">
                    {config.label}
                    {(status === 'analyzing' || status === 'in_progress' || status === 'processing') && (
                        <motion.span
                            className="absolute -right-1 top-0"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            •
                        </motion.span>
                    )}
                </span>
            )}
        </motion.span>
    );
}