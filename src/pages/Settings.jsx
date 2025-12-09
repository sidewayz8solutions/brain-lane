import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Cpu, Cloud, Server, Zap } from 'lucide-react';
import GPUProviderPanel from '@/components/settings/GPUProviderPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-6xl mx-auto"
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                            <Settings className="w-6 h-6 text-violet-400" />
                        </div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                    </div>
                    <p className="text-slate-400">Configure your AI providers and system preferences</p>
                </div>

                {/* Settings Tabs */}
                <Tabs defaultValue="gpu" className="space-y-6">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
                        <TabsTrigger 
                            value="gpu" 
                            className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"
                        >
                            <Cpu className="w-4 h-4 mr-2" />
                            GPU Providers
                        </TabsTrigger>
                        <TabsTrigger 
                            value="ai" 
                            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            AI Settings
                        </TabsTrigger>
                        <TabsTrigger 
                            value="storage" 
                            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                        >
                            <Server className="w-4 h-4 mr-2" />
                            Storage
                        </TabsTrigger>
                        <TabsTrigger 
                            value="cloud" 
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                        >
                            <Cloud className="w-4 h-4 mr-2" />
                            Cloud Services
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="gpu">
                        <GPUProviderPanel />
                    </TabsContent>

                    <TabsContent value="ai">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-blue-400" />
                                    AI Model Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                        <h4 className="font-medium mb-2">Default Model</h4>
                                        <p className="text-sm text-slate-400">
                                            Configure your default AI model for code generation and analysis
                                        </p>
                                        <select className="mt-2 w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white">
                                            <option value="gpt-4">GPT-4 (OpenAI)</option>
                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</option>
                                            <option value="claude-3">Claude 3 (Anthropic)</option>
                                            <option value="llama-3">Llama 3 (Local)</option>
                                        </select>
                                    </div>
                                    
                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                        <h4 className="font-medium mb-2">Temperature</h4>
                                        <p className="text-sm text-slate-400 mb-2">
                                            Controls randomness in AI responses (0 = deterministic, 1 = creative)
                                        </p>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.1" 
                                            defaultValue="0.7"
                                            className="w-full accent-blue-500"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="storage">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="w-5 h-5 text-emerald-400" />
                                    Storage Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-slate-400">
                                    <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Storage settings coming soon</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cloud">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cloud className="w-5 h-5 text-cyan-400" />
                                    Cloud Services
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-slate-400">
                                    <Cloud className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Cloud service integrations coming soon</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}
