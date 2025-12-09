import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Cloud, Server, Download, Code, Settings2 } from 'lucide-react';
import DeploymentPanel from '@/components/deployment/DeploymentPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Deployment() {
    const [selectedProject, setSelectedProject] = useState(null);

    // Sample project for demo
    const demoProject = {
        name: 'brain-lane',
        stack: { framework: 'react', language: 'javascript', buildTool: 'vite' },
        analysis: {
            mainEntry: 'src/main.jsx',
            buildCommand: 'npm run build',
            outputDir: 'dist'
        }
    };

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
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                            <Rocket className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Deployment</h1>
                            <p className="text-slate-400">One-click deployment to your favorite platforms</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <Cloud className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">5</p>
                                    <p className="text-xs text-slate-400">Platforms</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                    <Rocket className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">0</p>
                                    <p className="text-xs text-slate-400">Deployments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-500/20">
                                    <Server className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">1</p>
                                    <p className="text-xs text-slate-400">Projects</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/20">
                                    <Download className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">0</p>
                                    <p className="text-xs text-slate-400">Downloads</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="deploy" className="space-y-6">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
                        <TabsTrigger 
                            value="deploy" 
                            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                        >
                            <Rocket className="w-4 h-4 mr-2" />
                            Deploy
                        </TabsTrigger>
                        <TabsTrigger 
                            value="configs" 
                            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                        >
                            <Code className="w-4 h-4 mr-2" />
                            Configurations
                        </TabsTrigger>
                        <TabsTrigger 
                            value="settings" 
                            className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"
                        >
                            <Settings2 className="w-4 h-4 mr-2" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="deploy">
                        <DeploymentPanel project={demoProject} />
                    </TabsContent>

                    <TabsContent value="configs">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="w-5 h-5 text-blue-400" />
                                    Generated Configurations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-slate-400">
                                    <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="mb-2">No configurations generated yet</p>
                                    <p className="text-sm">Select a platform in the Deploy tab to generate configurations</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings2 className="w-5 h-5 text-violet-400" />
                                    Deployment Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                        <h4 className="font-medium mb-2">Default Platform</h4>
                                        <select className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white">
                                            <option value="vercel">Vercel</option>
                                            <option value="netlify">Netlify</option>
                                            <option value="docker">Docker</option>
                                            <option value="railway">Railway</option>
                                            <option value="flyio">Fly.io</option>
                                        </select>
                                    </div>
                                    
                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                        <h4 className="font-medium mb-2">Auto-Deploy</h4>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="autoDeploy" className="accent-emerald-500" />
                                            <label htmlFor="autoDeploy" className="text-sm text-slate-400">
                                                Enable automatic deployment on git push
                                            </label>
                                        </div>
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
