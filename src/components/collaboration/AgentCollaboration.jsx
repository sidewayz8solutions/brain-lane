import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { InvokeLLM } from '@/services/aiService';
import {
    Users,
    Bot,
    MessageSquare,
    Zap,
    CheckCircle,
    Clock,
    AlertTriangle,
    Send,
    Loader2,
    ChevronDown,
    ChevronRight,
    Code,
    FileSearch,
    TestTube,
    Shield,
    Lightbulb,
    GitBranch,
    UserPlus,
    AtSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskComments from './TaskComments';
import AgentAssignment from './AgentAssignment';
import NotificationCenter from './NotificationCenter';

const agents = [
    { 
        id: 'code', 
        name: 'Code Agent', 
        icon: Code, 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/20',
        specialty: 'Code generation & refactoring',
        skills: ['refactoring', 'architecture', 'patterns', 'clean code', 'modularization', 'api design'],
        keywords: ['refactor', 'restructure', 'clean', 'organize', 'split', 'extract', 'module', 'class', 'function', 'api', 'interface']
    },
    { 
        id: 'review', 
        name: 'Review Agent', 
        icon: FileSearch, 
        color: 'text-purple-400', 
        bg: 'bg-purple-500/20',
        specialty: 'Code review & quality',
        skills: ['code review', 'best practices', 'code standards', 'documentation', 'readability'],
        keywords: ['review', 'quality', 'standard', 'convention', 'document', 'comment', 'readable', 'maintain', 'best practice']
    },
    { 
        id: 'test', 
        name: 'Test Agent', 
        icon: TestTube, 
        color: 'text-green-400', 
        bg: 'bg-green-500/20',
        specialty: 'Test generation & coverage',
        skills: ['unit testing', 'integration testing', 'test coverage', 'mocking', 'TDD'],
        keywords: ['test', 'coverage', 'unit', 'integration', 'mock', 'assert', 'spec', 'jest', 'pytest', 'tdd']
    },
    { 
        id: 'security', 
        name: 'Security Agent', 
        icon: Shield, 
        color: 'text-orange-400', 
        bg: 'bg-orange-500/20',
        specialty: 'Security analysis & vulnerability scanning',
        skills: ['vulnerability scanning', 'authentication', 'authorization', 'encryption', 'input validation'],
        keywords: ['security', 'vulnerability', 'auth', 'password', 'encrypt', 'inject', 'xss', 'csrf', 'sanitize', 'validate', 'token']
    },
    { 
        id: 'performance', 
        name: 'Performance Agent', 
        icon: Zap, 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/20',
        specialty: 'Performance optimization & profiling',
        skills: ['optimization', 'caching', 'profiling', 'memory management', 'async operations'],
        keywords: ['performance', 'optimize', 'speed', 'fast', 'slow', 'cache', 'memory', 'leak', 'async', 'parallel', 'bottleneck', 'latency']
    }
];

// Intelligent agent routing based on context
const routeToAgents = (query, taskCategory) => {
    const queryLower = query.toLowerCase();
    const scores = agents.map(agent => {
        let score = 0;
        
        // Check keyword matches
        agent.keywords.forEach(keyword => {
            if (queryLower.includes(keyword)) score += 3;
        });
        
        // Check skill matches
        agent.skills.forEach(skill => {
            if (queryLower.includes(skill)) score += 2;
        });
        
        // Boost based on task category
        const categoryBoosts = {
            'security': ['security'],
            'bugfix': ['code', 'test', 'review'],
            'feature': ['code', 'review'],
            'refactor': ['code', 'review'],
            'test': ['test'],
            'documentation': ['review']
        };
        
        if (categoryBoosts[taskCategory]?.includes(agent.id)) score += 2;
        
        return { agent, score };
    });
    
    // Sort by score and filter relevant agents
    const sorted = scores.sort((a, b) => b.score - a.score);
    const relevant = sorted.filter(s => s.score > 0).map(s => s.agent);
    
    // Return at least the top agent, or top 2-3 if multiple are relevant
    if (relevant.length === 0) return [agents[0]]; // Default to code agent
    if (relevant.length <= 2) return relevant;
    return relevant.slice(0, 3);
};

function AgentMessage({ message, agent }) {
    const agentConfig = agents.find(a => a.id === agent) || agents[0];
    const Icon = agentConfig.icon;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
        >
            <Avatar className={cn("w-8 h-8", agentConfig.bg)}>
                <AvatarFallback className={agentConfig.bg}>
                    <Icon className={cn("w-4 h-4", agentConfig.color)} />
                </AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-sm font-medium", agentConfig.color)}>{agentConfig.name}</span>
                    <span className="text-xs text-slate-600">{message.time}</span>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300">
                    {message.content}
                </div>
                {message.action && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Action:</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                            {message.action}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function AgentStatus({ agent, status }) {
    const Icon = agent.icon;
    
    return (
        <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border",
            status === 'active' ? 'border-green-500/30 bg-green-500/5' :
            status === 'thinking' ? 'border-yellow-500/30 bg-yellow-500/5' :
            'border-slate-700/50 bg-slate-800/30'
        )}>
            <div className={cn("p-2 rounded-lg", agent.bg)}>
                <Icon className={cn("w-4 h-4", agent.color)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{agent.name}</p>
                <p className="text-xs text-slate-500 truncate">{agent.specialty}</p>
            </div>
            <div className="flex items-center gap-1">
                {status === 'active' && (
                    <>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400">Active</span>
                    </>
                )}
                {status === 'thinking' && (
                    <>
                        <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                        <span className="text-xs text-yellow-400">Thinking</span>
                    </>
                )}
                {status === 'idle' && (
                    <span className="text-xs text-slate-500">Idle</span>
                )}
            </div>
        </div>
    );
}

export default function AgentCollaboration({ task, project, onSuggestion }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isCollaborating, setIsCollaborating] = useState(false);
    const [agentStatuses, setAgentStatuses] = useState({
        code: 'idle',
        review: 'idle',
        test: 'idle',
        security: 'idle',
        performance: 'idle'
    });
    const [showAgents, setShowAgents] = useState(true);
    const [activeTab, setActiveTab] = useState('chat');
    const [assignedAgents, setAssignedAgents] = useState([]);

    const addMessage = (content, agentId, action = null) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { content, agent: agentId, time, action }]);
    };

    const startCollaboration = async () => {
        if (!task) return;
        setIsCollaborating(true);
        setMessages([]);

        // Intelligently route to relevant agents based on task
        const relevantAgents = routeToAgents(
            `${task.title} ${task.description || ''}`,
            task.category
        );
        
        // Show routing decision
        const routedNames = relevantAgents.map(a => a.name).join(', ');
        addMessage(
            `Based on the task category "${task.category}" and content, routing to: ${routedNames}`,
            'code',
            'Smart Routing'
        );

        for (const agent of relevantAgents) {
            setAgentStatuses(prev => ({ ...prev, [agent.id]: 'thinking' }));
            
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
            
            // Get agent-specific response with skills context
            const response = await InvokeLLM({
                prompt: `You are the ${agent.name}, a specialist in ${agent.specialty}.
Your core skills: ${agent.skills.join(', ')}.

Task: ${task.title}
Description: ${task.description}
Category: ${task.category}
Files: ${task.files_affected?.join(', ') || 'TBD'}

Provide a brief (2-3 sentences) expert analysis from your specialty. Be specific and actionable based on your skills.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        action: { type: "string" },
                        confidence: { type: "number" }
                    }
                }
            });

            addMessage(response.message, agent.id, response.action);
            setAgentStatuses(prev => ({ ...prev, [agent.id]: 'active' }));
        }

        // Final synthesis
        await new Promise(resolve => setTimeout(resolve, 500));
        addMessage(
            `Analysis complete from ${relevantAgents.length} specialized agent(s). Ready for implementation.`,
            relevantAgents[0].id,
            'Ready to implement'
        );

        setIsCollaborating(false);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        
        // Add user message
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { content: input, agent: 'user', time }]);
        const userQuery = input;
        setInput('');

        // Intelligently route to the best agent(s) for this query
        const relevantAgents = routeToAgents(userQuery, task?.category);
        const primaryAgent = relevantAgents[0];
        
        setAgentStatuses(prev => ({ ...prev, [primaryAgent.id]: 'thinking' }));

        const response = await InvokeLLM({
            prompt: `You are the ${primaryAgent.name}, a specialist in ${primaryAgent.specialty}.
Your core skills: ${primaryAgent.skills.join(', ')}.

User question about task "${task?.title}": ${userQuery}

Provide a helpful, expert response based on your specialty.`,
            response_json_schema: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    action: { type: "string" }
                }
            }
        });

        addMessage(response.message, primaryAgent.id, response.action);
        setAgentStatuses(prev => ({ ...prev, [primaryAgent.id]: 'active' }));
        
        // If multiple agents are relevant, get secondary opinion
        if (relevantAgents.length > 1) {
            const secondaryAgent = relevantAgents[1];
            setAgentStatuses(prev => ({ ...prev, [secondaryAgent.id]: 'thinking' }));
            
            await new Promise(r => setTimeout(r, 800));
            
            const secondResponse = await InvokeLLM({
                prompt: `You are the ${secondaryAgent.name}, specialist in ${secondaryAgent.specialty}.
Skills: ${secondaryAgent.skills.join(', ')}.

Add a brief (1-2 sentence) complementary insight to this discussion about: ${userQuery}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        action: { type: "string" }
                    }
                }
            });
            
            addMessage(secondResponse.message, secondaryAgent.id, secondResponse.action);
            setAgentStatuses(prev => ({ ...prev, [secondaryAgent.id]: 'active' }));
        }
    };

    return (
        <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">Agent Collaboration</h3>
                        <p className="text-xs text-slate-500">Multi-agent task analysis & chat</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <AgentAssignment
                        taskId={task?.id}
                        initialAssignments={assignedAgents}
                        onAssignmentChange={setAssignedAgents}
                        compact
                    />
                    <Button
                        onClick={startCollaboration}
                        disabled={isCollaborating || !task}
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                    >
                        {isCollaborating ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Collaborating...
                            </>
                        ) : (
                            <>
                                <Zap className="w-3 h-3 mr-1" />
                                Start
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
                <TabsList className="w-full justify-start bg-slate-800/50 rounded-none border-b border-slate-700/50 p-0 h-10">
                    <TabsTrigger value="chat" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500">
                        <AtSign className="w-3 h-3 mr-1" />
                        Comments
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Assignments
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="m-0 flex-1 flex flex-col">

            {/* Agent Status Panel */}
            <div className="border-b border-slate-700/50">
                <button
                    onClick={() => setShowAgents(!showAgents)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/30"
                >
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Agent Status
                    </span>
                    {showAgents ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </button>
                
                <AnimatePresence>
                    {showAgents && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                                {agents.map(agent => (
                                    <AgentStatus 
                                        key={agent.id} 
                                        agent={agent} 
                                        status={agentStatuses[agent.id]} 
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Messages */}
            <ScrollArea className="h-64">
                <div className="p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Start collaboration to get multi-agent insights</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            msg.agent === 'user' ? (
                                <div key={idx} className="flex justify-end">
                                    <div className="bg-cyan-500/20 rounded-lg p-3 max-w-[80%]">
                                        <p className="text-sm text-cyan-100">{msg.content}</p>
                                    </div>
                                </div>
                            ) : (
                                <AgentMessage key={idx} message={msg} agent={msg.agent} />
                            )
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-slate-700/50">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask the agents..."
                        className="bg-slate-800/50 border-slate-700"
                    />
                    <Button onClick={sendMessage} size="icon" className="bg-cyan-600 hover:bg-cyan-500">
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
                </TabsContent>

                <TabsContent value="comments" className="m-0 flex-1">
                    <TaskComments taskId={task?.id} />
                </TabsContent>

                <TabsContent value="assignments" className="m-0 flex-1 p-4">
                    <AgentAssignment
                        taskId={task?.id}
                        initialAssignments={assignedAgents}
                        onAssignmentChange={setAssignedAgents}
                    />
                    
                    {/* Assignment History */}
                    <div className="mt-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                        <h4 className="text-sm font-medium text-white mb-3">Assignment History</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Security Agent assigned</span>
                                <span className="text-slate-600">2 hours ago</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Testing Agent completed review</span>
                                <span className="text-slate-600">5 hours ago</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Task created</span>
                                <span className="text-slate-600">1 day ago</span>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}