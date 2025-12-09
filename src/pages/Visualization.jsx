import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Network, FileCode, RefreshCw, Download, Layers } from 'lucide-react';
import FlowchartBuilder from '@/components/visualization/FlowchartBuilder';
import { flowchartEngine } from '@/services/flowchartEngine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Visualization() {
    const [architectureData, setArchitectureData] = useState(null);
    const [dependencyData, setDependencyData] = useState(null);
    const [activeView, setActiveView] = useState('architecture');
    const [isLoading, setIsLoading] = useState(false);
    const [projectFiles, setProjectFiles] = useState([]);

    // Sample project structure for demo
    const sampleProject = {
        files: [
            { path: 'src/App.jsx', type: 'file' },
            { path: 'src/main.jsx', type: 'file' },
            { path: 'src/pages/Home.jsx', type: 'file' },
            { path: 'src/pages/Projects.jsx', type: 'file' },
            { path: 'src/components/ui/Button.jsx', type: 'file' },
            { path: 'src/components/ui/Card.jsx', type: 'file' },
            { path: 'src/services/aiService.js', type: 'file' },
            { path: 'src/services/storageService.js', type: 'file' },
            { path: 'src/store/projectStore.js', type: 'file' },
            { path: 'src/hooks/use-mobile.jsx', type: 'file' },
        ]
    };

    const loadVisualization = async () => {
        setIsLoading(true);
        try {
            // Generate architecture visualization
            const architecture = await flowchartEngine.generateArchitectureFlowchart(sampleProject);
            setArchitectureData(architecture);

            // Generate dependency graph
            const dependencies = await flowchartEngine.generateDependencyGraph(sampleProject);
            setDependencyData(dependencies);

            setProjectFiles(sampleProject.files);
        } catch (error) {
            console.error('Failed to generate visualization:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadVisualization();
    }, []);

    const handleExportMermaid = () => {
        const data = activeView === 'architecture' ? architectureData : dependencyData;
        if (data) {
            const mermaid = flowchartEngine.exportToMermaid(data);
            const blob = new Blob([mermaid], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeView}-diagram.mmd`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const currentData = activeView === 'architecture' ? architectureData : dependencyData;

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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                                <Network className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Visualization</h1>
                                <p className="text-slate-400">Interactive architecture and dependency diagrams</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadVisualization}
                                disabled={isLoading}
                                className="border-slate-700 hover:bg-slate-800"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportMermaid}
                                disabled={!currentData}
                                className="border-slate-700 hover:bg-slate-800"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export Mermaid
                            </Button>
                        </div>
                    </div>
                </div>

                {/* View Selector */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={activeView === 'architecture' ? 'default' : 'outline'}
                        onClick={() => setActiveView('architecture')}
                        className={activeView === 'architecture' 
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                            : 'border-slate-700 hover:bg-slate-800'
                        }
                    >
                        <Layers className="w-4 h-4 mr-2" />
                        Architecture View
                    </Button>
                    <Button
                        variant={activeView === 'dependencies' ? 'default' : 'outline'}
                        onClick={() => setActiveView('dependencies')}
                        className={activeView === 'dependencies' 
                            ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                            : 'border-slate-700 hover:bg-slate-800'
                        }
                    >
                        <GitBranch className="w-4 h-4 mr-2" />
                        Dependency Graph
                    </Button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Flowchart */}
                    <div className="lg:col-span-3">
                        <Card className="bg-slate-900/50 border-slate-800 h-[600px]">
                            <CardContent className="p-0 h-full">
                                {isLoading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
                                            <p className="text-slate-400">Generating visualization...</p>
                                        </div>
                                    </div>
                                ) : currentData ? (
                                    <FlowchartBuilder
                                        nodes={currentData.nodes}
                                        edges={currentData.edges}
                                        onNodeClick={(node) => console.log('Node clicked:', node)}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        <p>No visualization data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileCode className="w-4 h-4 text-cyan-400" />
                                    Project Files
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {projectFiles.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="text-xs px-2 py-1 rounded bg-slate-800/50 text-slate-400 truncate"
                                        >
                                            {file.path}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Statistics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Nodes</span>
                                        <span className="text-white">{currentData?.nodes?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Edges</span>
                                        <span className="text-white">{currentData?.edges?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Files</span>
                                        <span className="text-white">{projectFiles.length}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
