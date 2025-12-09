import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Users, Cpu, Zap, Play, Settings2 } from 'lucide-react';
import MultiAgentPanel from '@/components/agent/MultiAgentPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function Agents() {
    const [selectedProject, setSelectedProject] = useState(null);

    // Sample project for demo
    const demoProject = {
        id: 'demo-project',
        name: 'brain-lane',
        files: [
            { path: 'src/App.jsx', content: '' },
            { path: 'src/main.jsx', content: '' },
        ]
    };

    const agentTypes = [
        { 
            id: 'auditor', 
            name: 'Code Auditor', 
            icon: '🔍', 
            color: 'blue',
            description: 'Analyzes code for issues, patterns, and improvements',
            status: 'ready'
        },
        { 
            id: 'fixer', 
            name: 'Syntax Fixer', 
            icon: '🔧', 
            color: 'green',
            description: 'Automatically fixes syntax errors and warnings',
            status: 'ready'
        },
        { 
            id: 'completer', 
            name: 'Feature Completer', 
            icon: '✨', 
            color: 'purple',
            description: 'Completes partial implementations and adds features',
            status: 'ready'
        },
        { 
            id: 'designer', 
            name: 'UI Designer', 
            icon: '🎨', 
            color: 'pink',
            description: 'Suggests and implements UI/UX improvements',
            status: 'ready'
        },
        { 
            id: 'architect', 
            name: 'Deployment Architect', 
            icon: '🏗️', 
            color: 'orange',
            description: 'Generates deployment configs and CI/CD pipelines',
            status: 'ready'
        },
        { 
            id: 'writer', 
            name: 'Doc Writer', 
            icon: '📝', 
            color: 'yellow',
            description: 'Generates documentation and comments',
            status: 'ready'
        },
        { 
            id: 'tester', 
            name: 'Test Writer', 
            icon: '🧪', 
            color: 'cyan',
            description: 'Creates unit and integration tests',
            status: 'ready'
        },
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            purple: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
            pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
            orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                            <Bot className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">AI Agents</h1>
                            <p className="text-slate-400">Multi-agent AI system for comprehensive code assistance</p>
                        </div>
                    </div>
                </div>

                {/* Agent Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                    <Bot className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">7</p>
                                    <p className="text-xs text-slate-400">Available Agents</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                    <Zap className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">0</p>
                                    <p className="text-xs text-slate-400">Active Sessions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <Play className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">0</p>
                                    <p className="text-xs text-slate-400">Tasks Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/20">
                                    <Cpu className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">Ready</p>
                                    <p className="text-xs text-slate-400">System Status</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="orchestrate" className="space-y-6">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
                        <TabsTrigger 
                            value="orchestrate" 
                            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Orchestrate
                        </TabsTrigger>
                        <TabsTrigger 
                            value="agents" 
                            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                        >
                            <Bot className="w-4 h-4 mr-2" />
                            Agent Details
                        </TabsTrigger>
                        <TabsTrigger 
                            value="settings" 
                            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                        >
                            <Settings2 className="w-4 h-4 mr-2" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="orchestrate">
                        <MultiAgentPanel project={demoProject} />
                    </TabsContent>

                    <TabsContent value="agents">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {agentTypes.map((agent) => (
                                <Card 
                                    key={agent.id}
                                    className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl border ${getColorClasses(agent.color)}`}>
                                                <span className="text-2xl">{agent.icon}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold">{agent.name}</h3>
                                                    <Badge 
                                                        variant="outline" 
                                                        className="text-emerald-400 border-emerald-500/30"
                                                    >
                                                        {agent.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-400">{agent.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="settings">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings2 className="w-5 h-5 text-emerald-400" />
                                    Agent Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                        <h4 className="font-medium mb-2">Parallel Execution</h4>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id="parallelExec" 
                                                defaultChecked 
                                                className="accent-purple-500" 
                                            />
                                            <label htmlFor="parallelExec" className="text-sm text-slate-400">
                                                Allow agents to run in parallel for faster results
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                        <h4 className="font-medium mb-2">Max Concurrent Agents</h4>
                                        <select className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white">
                                            <option value="2">2 agents</option>
                                            <option value="3">3 agents</option>
                                            <option value="4" selected>4 agents</option>
                                            <option value="5">5 agents</option>
                                            <option value="all">All agents</option>
                                        </select>
                                    </div>

                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                        <h4 className="font-medium mb-2">Result Aggregation</h4>
                                        <select className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white">
                                            <option value="merge">Merge all results</option>
                                            <option value="priority">Priority-based (first success)</option>
                                            <option value="consensus">Consensus (majority vote)</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}
