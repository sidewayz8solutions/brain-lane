import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    UserPlus,
    Bot,
    Check,
    X,
    ChevronDown,
    Shield,
    Code,
    TestTube,
    Gauge,
    FileSearch,
    Sparkles,
    Clock,
    CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';

const agents = [
    { 
        id: 'architect', 
        name: 'Architect Agent', 
        icon: Code, 
        color: 'purple',
        specialty: 'Code structure & design patterns',
        status: 'available'
    },
    { 
        id: 'security', 
        name: 'Security Agent', 
        icon: Shield, 
        color: 'red',
        specialty: 'Vulnerability scanning & fixes',
        status: 'available'
    },
    { 
        id: 'testing', 
        name: 'Testing Agent', 
        icon: TestTube, 
        color: 'green',
        specialty: 'Test coverage & quality',
        status: 'busy'
    },
    { 
        id: 'performance', 
        name: 'Performance Agent', 
        icon: Gauge, 
        color: 'yellow',
        specialty: 'Optimization & benchmarking',
        status: 'available'
    },
    { 
        id: 'reviewer', 
        name: 'Code Review Agent', 
        icon: FileSearch, 
        color: 'cyan',
        specialty: 'Code review & best practices',
        status: 'available'
    }
];

const colorClasses = {
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' }
};

function AgentOption({ agent, isSelected, onToggle }) {
    const colors = colorClasses[agent.color];
    const Icon = agent.icon;

    return (
        <button
            onClick={() => onToggle(agent.id)}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                isSelected ? `${colors.bg} ${colors.border} border` : "hover:bg-slate-800"
            )}
        >
            <div className={cn("p-2 rounded-lg", colors.bg)}>
                <Icon className={cn("w-4 h-4", colors.text)} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{agent.name}</span>
                    {agent.status === 'busy' && (
                        <Badge className="text-[9px] bg-yellow-500/20 text-yellow-400">Busy</Badge>
                    )}
                </div>
                <p className="text-xs text-slate-500 truncate">{agent.specialty}</p>
            </div>
            {isSelected && (
                <CheckCircle className={cn("w-5 h-5", colors.text)} />
            )}
        </button>
    );
}

function AssignedAgentChip({ agent, onRemove }) {
    const colors = colorClasses[agent.color];
    const Icon = agent.icon;

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-full border",
                colors.bg, colors.border
            )}
        >
            <Icon className={cn("w-3 h-3", colors.text)} />
            <span className="text-xs text-white">{agent.name.replace(' Agent', '')}</span>
            <button
                onClick={() => onRemove(agent.id)}
                className="hover:bg-slate-700 rounded-full p-0.5"
            >
                <X className="w-3 h-3 text-slate-400" />
            </button>
        </motion.div>
    );
}

export default function AgentAssignment({ 
    taskId, 
    stepId, 
    initialAssignments = [],
    onAssignmentChange,
    compact = false 
}) {
    const [assignedIds, setAssignedIds] = useState(initialAssignments);
    const [isOpen, setIsOpen] = useState(false);

    const assignedAgents = agents.filter(a => assignedIds.includes(a.id));

    const toggleAssignment = (agentId) => {
        const newAssignments = assignedIds.includes(agentId)
            ? assignedIds.filter(id => id !== agentId)
            : [...assignedIds, agentId];
        
        setAssignedIds(newAssignments);
        onAssignmentChange?.(newAssignments);
    };

    const removeAssignment = (agentId) => {
        const newAssignments = assignedIds.filter(id => id !== agentId);
        setAssignedIds(newAssignments);
        onAssignmentChange?.(newAssignments);
    };

    if (compact) {
        return (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                        {assignedAgents.length > 0 ? (
                            <div className="flex -space-x-2">
                                {assignedAgents.slice(0, 3).map(agent => {
                                    const Icon = agent.icon;
                                    return (
                                        <div
                                            key={agent.id}
                                            className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900",
                                                colorClasses[agent.color].bg
                                            )}
                                        >
                                            <Icon className={cn("w-3 h-3", colorClasses[agent.color].text)} />
                                        </div>
                                    );
                                })}
                                {assignedAgents.length > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-900 text-[10px] text-white">
                                        +{assignedAgents.length - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                Assign
                            </>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2 bg-slate-900 border-slate-700">
                    <div className="space-y-1">
                        {agents.map(agent => (
                            <AgentOption
                                key={agent.id}
                                agent={agent}
                                isSelected={assignedIds.includes(agent.id)}
                                onToggle={toggleAssignment}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/80">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-cyan-400" />
                    <span className="font-medium text-white text-sm">Agent Assignments</span>
                </div>
                <Badge className="text-[10px] bg-slate-700">{assignedAgents.length} assigned</Badge>
            </div>

            {/* Assigned Agents */}
            {assignedAgents.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    <AnimatePresence>
                        {assignedAgents.map(agent => (
                            <AssignedAgentChip
                                key={agent.id}
                                agent={agent}
                                onRemove={removeAssignment}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Agent Selection */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full border-slate-700 border-dashed">
                        <Bot className="w-4 h-4 mr-2" />
                        {assignedAgents.length > 0 ? 'Manage Assignments' : 'Assign Agents'}
                        <ChevronDown className="w-4 h-4 ml-auto" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-2 bg-slate-900 border-slate-700" align="start">
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                        {agents.map(agent => (
                            <AgentOption
                                key={agent.id}
                                agent={agent}
                                isSelected={assignedIds.includes(agent.id)}
                                onToggle={toggleAssignment}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Auto-assign suggestion */}
            {assignedAgents.length === 0 && (
                <button className="mt-3 w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-colors">
                    <Sparkles className="w-3 h-3" />
                    Auto-assign based on task type
                </button>
            )}
        </div>
    );
}