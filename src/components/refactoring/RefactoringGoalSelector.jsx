import React from 'react';
import { cn } from "@/lib/utils";
import { 
    BookOpen, 
    Zap, 
    Package, 
    Boxes, 
    TestTube, 
    Shield,
    Sparkles,
    Check
} from 'lucide-react';

const REFACTORING_GOALS = [
    {
        id: 'readability',
        title: 'Improve Readability',
        description: 'Better naming, structure, comments, and code organization',
        icon: BookOpen,
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'performance',
        title: 'Optimize Performance',
        description: 'Fix bottlenecks, reduce memory usage, improve speed',
        icon: Zap,
        color: 'from-yellow-500 to-orange-500'
    },
    {
        id: 'modernize',
        title: 'Modernize Dependencies',
        description: 'Update packages, use modern APIs and patterns',
        icon: Package,
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'architecture',
        title: 'Improve Architecture',
        description: 'Better separation of concerns, design patterns',
        icon: Boxes,
        color: 'from-emerald-500 to-teal-500'
    },
    {
        id: 'testability',
        title: 'Enhance Testability',
        description: 'Make code easier to test with better structure',
        icon: TestTube,
        color: 'from-indigo-500 to-violet-500'
    },
    {
        id: 'security',
        title: 'Security Hardening',
        description: 'Fix vulnerabilities, improve authentication',
        icon: Shield,
        color: 'from-red-500 to-rose-500'
    }
];

export default function RefactoringGoalSelector({ selectedGoals, onGoalsChange }) {
    const toggleGoal = (goalId) => {
        if (selectedGoals.includes(goalId)) {
            onGoalsChange(selectedGoals.filter(g => g !== goalId));
        } else {
            onGoalsChange([...selectedGoals, goalId]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-medium text-white">Select Refactoring Goals</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {REFACTORING_GOALS.map((goal) => {
                    const isSelected = selectedGoals.includes(goal.id);
                    const Icon = goal.icon;
                    
                    return (
                        <button
                            key={goal.id}
                            onClick={() => toggleGoal(goal.id)}
                            className={cn(
                                "relative p-4 rounded-xl border text-left transition-all duration-200",
                                "hover:scale-[1.02]",
                                isSelected 
                                    ? "border-cyan-500/50 bg-cyan-500/10" 
                                    : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
                            )}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                            )}
                            
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                                `bg-gradient-to-br ${goal.color} bg-opacity-20`
                            )}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            
                            <h4 className="font-medium text-white mb-1">{goal.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {goal.description}
                            </p>
                        </button>
                    );
                })}
            </div>
            
            {selectedGoals.length > 0 && (
                <p className="text-sm text-slate-400 mt-4">
                    {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected
                </p>
            )}
        </div>
    );
}

export { REFACTORING_GOALS };