import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Database, Globe, Server, Layout, Layers, ArrowRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const componentIcons = {
    'frontend': Layout,
    'backend': Server,
    'database': Database,
    'api': Globe,
    'service': Box,
    'default': Layers
};

const componentColors = {
    'frontend': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    'backend': { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', glow: 'shadow-green-500/20' },
    'database': { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    'api': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    'service': { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
    'default': { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400', glow: 'shadow-slate-500/20' }
};

function getComponentType(name) {
    const lower = name?.toLowerCase() || '';
    if (lower.includes('frontend') || lower.includes('ui') || lower.includes('view') || lower.includes('component')) return 'frontend';
    if (lower.includes('backend') || lower.includes('server') || lower.includes('controller')) return 'backend';
    if (lower.includes('database') || lower.includes('db') || lower.includes('model') || lower.includes('repository')) return 'database';
    if (lower.includes('api') || lower.includes('route') || lower.includes('endpoint')) return 'api';
    if (lower.includes('service') || lower.includes('util') || lower.includes('helper')) return 'service';
    return 'default';
}

function ComponentNode({ component, index, total, isSelected, onSelect, containerSize }) {
    const type = getComponentType(component.name);
    const Icon = componentIcons[type];
    const colors = componentColors[type];
    
    // Calculate position in a circle layout
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = Math.min(containerSize.width, containerSize.height) * 0.32;
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    const x = centerX + radius * Math.cos(angle) - 80;
    const y = centerY + radius * Math.sin(angle) - 50;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, x, y }}
            transition={{ delay: index * 0.1, type: "spring", bounce: 0.4 }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            onClick={() => onSelect(component)}
            className={cn(
                "absolute w-40 p-3 rounded-xl border-2 cursor-pointer transition-all",
                colors.bg, colors.border,
                isSelected && `ring-2 ring-white/30 shadow-lg ${colors.glow}`
            )}
            style={{ left: 0, top: 0 }}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg", colors.bg)}>
                    <Icon className={cn("w-4 h-4", colors.text)} />
                </div>
                <span className="text-sm font-medium text-white truncate">{component.name}</span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">{component.responsibility}</p>
            {component.files?.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                    {component.files.length} file{component.files.length > 1 ? 's' : ''}
                </div>
            )}
        </motion.div>
    );
}

function ConnectionLine({ from, to, containerSize, total }) {
    const getPosition = (index) => {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        const radius = Math.min(containerSize.width, containerSize.height) * 0.32;
        const centerX = containerSize.width / 2;
        const centerY = containerSize.height / 2;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    };

    const fromPos = getPosition(from);
    const toPos = getPosition(to);

    return (
        <motion.line
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeDasharray="4 4"
        />
    );
}

export default function ArchitectureDiagram({ architecture }) {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (containerRef.current) {
            const updateSize = () => {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            };
            updateSize();
            window.addEventListener('resize', updateSize);
            return () => window.removeEventListener('resize', updateSize);
        }
    }, []);

    if (!architecture?.components?.length) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No architecture data available</p>
            </div>
        );
    }

    const components = architecture.components;

    // Generate connections based on data flow or sequential order
    const connections = [];
    for (let i = 0; i < components.length - 1; i++) {
        connections.push({ from: i, to: i + 1 });
    }
    if (components.length > 2) {
        connections.push({ from: components.length - 1, to: 0 });
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                        className="bg-slate-800 border-slate-700"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                        className="bg-slate-800 border-slate-700"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(1)}
                        className="bg-slate-800 border-slate-700"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                </div>
                {architecture.pattern && (
                    <div className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm">
                        {architecture.pattern}
                    </div>
                )}
            </div>

            {/* Diagram */}
            <div 
                ref={containerRef}
                className="relative h-[500px] bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden"
            >
                <div 
                    className="absolute inset-0 transition-transform duration-300"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                >
                    {/* SVG for connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                        {connections.map((conn, idx) => (
                            <ConnectionLine 
                                key={idx} 
                                from={conn.from} 
                                to={conn.to} 
                                containerSize={containerSize}
                                total={components.length}
                            />
                        ))}
                    </svg>

                    {/* Center label */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-2">
                            <Layers className="w-8 h-8 text-cyan-400" />
                        </div>
                        <p className="text-sm font-medium text-white">System</p>
                        <p className="text-xs text-slate-500">{components.length} components</p>
                    </motion.div>

                    {/* Component nodes */}
                    {components.map((comp, idx) => (
                        <ComponentNode
                            key={idx}
                            component={comp}
                            index={idx}
                            total={components.length}
                            isSelected={selectedComponent?.name === comp.name}
                            onSelect={setSelectedComponent}
                            containerSize={containerSize}
                        />
                    ))}
                </div>
            </div>

            {/* Selected component details */}
            {selectedComponent && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-white">{selectedComponent.name}</h4>
                        <button 
                            onClick={() => setSelectedComponent(null)}
                            className="text-slate-400 hover:text-white text-sm"
                        >
                            Close
                        </button>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{selectedComponent.responsibility}</p>
                    {selectedComponent.files?.length > 0 && (
                        <div>
                            <p className="text-xs text-slate-500 mb-2">Files:</p>
                            <div className="flex flex-wrap gap-1">
                                {selectedComponent.files.map((file, i) => (
                                    <span key={i} className="px-2 py-1 rounded bg-slate-700 text-xs text-slate-300 font-mono">
                                        {file}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}