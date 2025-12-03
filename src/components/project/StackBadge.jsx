import React from 'react';
import { cn } from "@/lib/utils";

const stackColors = {
    react: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    next: { bg: 'bg-white/10', text: 'text-white', border: 'border-white/20' },
    vue: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    angular: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    node: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    express: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' },
    python: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    django: { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-600/30' },
    flask: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' },
    typescript: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    javascript: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    tailwind: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    default: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' }
};

export default function StackBadge({ name, size = 'sm' }) {
    const normalizedName = name?.toLowerCase().replace(/[^a-z]/g, '') || '';
    const colors = stackColors[normalizedName] || stackColors.default;
    
    return (
        <span className={cn(
            "inline-flex items-center px-3 py-1 rounded-full border font-medium",
            colors.bg, colors.text, colors.border,
            size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
            {name}
        </span>
    );
}