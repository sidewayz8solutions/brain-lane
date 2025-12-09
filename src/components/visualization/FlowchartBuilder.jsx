/**
 * AI Flowchart Builder — Interactive architecture visualization
 */
import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import {
  FileCode,
  GitBranch,
  Database,
  Layers,
  Workflow,
  RefreshCw,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { flowchartEngine, FlowchartType } from '../../services/flowchartEngine';

const DIAGRAM_TYPES = [
  { id: FlowchartType.ARCHITECTURE, label: 'Architecture', icon: Layers },
  { id: FlowchartType.DEPENDENCIES, label: 'Dependencies', icon: GitBranch },
  { id: FlowchartType.COMPONENT_TREE, label: 'Components', icon: FileCode },
  { id: FlowchartType.DATA_FLOW, label: 'Data Flow', icon: Database },
  { id: FlowchartType.STATE_FLOW, label: 'State', icon: Workflow },
  { id: FlowchartType.REDESIGN, label: 'AI Redesign', icon: Sparkles },
];

const nodeTypes = {};

export default function FlowchartBuilder({ files = [], projectName = 'Project' }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedType, setSelectedType] = useState(FlowchartType.ARCHITECTURE);
  const [isLoading, setIsLoading] = useState(false);
  const [flowchartData, setFlowchartData] = useState(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  // Generate flowchart when type or files change
  useEffect(() => {
    if (files.length > 0) {
      generateFlowchart();
    }
  }, [selectedType, files.length]);

  const generateFlowchart = async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    try {
      const data = await flowchartEngine.generateFlowchart(files, selectedType);
      setFlowchartData(data);

      // Convert to React Flow format
      const rfData = flowchartEngine.toReactFlow(data);
      
      // Apply auto-layout
      const layoutedNodes = applyLayout(rfData.nodes, rfData.edges, data.layout);
      
      setNodes(layoutedNodes);
      setEdges(rfData.edges.map(e => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed },
      })));

      // Generate Mermaid code
      const mermaid = flowchartEngine.toMermaid(data);
      setMermaidCode(mermaid);
    } catch (error) {
      console.error('Failed to generate flowchart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple auto-layout
  const applyLayout = (nodes, edges, layoutType) => {
    const nodeWidth = 180;
    const nodeHeight = 60;
    const horizontalGap = 50;
    const verticalGap = 80;

    switch (layoutType) {
      case 'hierarchical':
      case 'tree': {
        // Build adjacency for levels
        const levels = {};
        const visited = new Set();
        
        // Find roots
        const targets = new Set(edges.map(e => e.target));
        const roots = nodes.filter(n => !targets.has(n.id));
        
        const assignLevel = (nodeId, level) => {
          if (visited.has(nodeId)) return;
          visited.add(nodeId);
          
          if (!levels[level]) levels[level] = [];
          levels[level].push(nodeId);
          
          const children = edges.filter(e => e.source === nodeId).map(e => e.target);
          children.forEach(child => assignLevel(child, level + 1));
        };
        
        roots.forEach(root => assignLevel(root.id, 0));
        
        // Position nodes by level
        return nodes.map(node => {
          let level = 0;
          let index = 0;
          for (const [l, nodeIds] of Object.entries(levels)) {
            const idx = nodeIds.indexOf(node.id);
            if (idx !== -1) {
              level = parseInt(l);
              index = idx;
              break;
            }
          }
          
          const levelNodes = levels[level] || [node.id];
          const totalWidth = levelNodes.length * (nodeWidth + horizontalGap);
          const startX = -totalWidth / 2;
          
          return {
            ...node,
            position: {
              x: startX + index * (nodeWidth + horizontalGap),
              y: level * (nodeHeight + verticalGap),
            },
          };
        });
      }
      
      case 'radial': {
        const centerX = 300;
        const centerY = 300;
        const radius = 200;
        
        return nodes.map((node, i) => {
          if (i === 0) {
            return { ...node, position: { x: centerX, y: centerY } };
          }
          const angle = ((i - 1) / (nodes.length - 1)) * 2 * Math.PI;
          return {
            ...node,
            position: {
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle),
            },
          };
        });
      }
      
      case 'horizontal': {
        const columns = 4;
        return nodes.map((node, i) => ({
          ...node,
          position: {
            x: (i % columns) * (nodeWidth + horizontalGap),
            y: Math.floor(i / columns) * (nodeHeight + verticalGap),
          },
        }));
      }
      
      default: {
        // Grid layout
        const columns = Math.ceil(Math.sqrt(nodes.length));
        return nodes.map((node, i) => ({
          ...node,
          position: {
            x: (i % columns) * (nodeWidth + horizontalGap),
            y: Math.floor(i / columns) * (nodeHeight + verticalGap),
          },
        }));
      }
    }
  };

  const copyMermaidCode = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsPng = () => {
    // Would require html-to-image or similar library
    console.log('Export to PNG - requires html-to-image library');
  };

  if (files.length === 0) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Upload or select a project to visualize its architecture</p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${fullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Architecture Flowchart
              <Badge variant="secondary">{projectName}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={generateFlowchart} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFullscreen(!fullscreen)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Diagram Type Tabs */}
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v)}>
            <TabsList className="grid grid-cols-6 w-full">
              {DIAGRAM_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <TabsTrigger key={type.id} value={type.id} className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-0">
          <div className={`${fullscreen ? 'h-[calc(100vh-180px)]' : 'h-[500px]'} relative`}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Generating flowchart...</p>
                </div>
              </div>
            ) : null}

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Controls />
              <MiniMap 
                nodeStrokeColor="#666"
                nodeColor={(node) => node.style?.background || '#666'}
                nodeBorderRadius={4}
              />
              <Background variant="dots" gap={12} size={1} />
            </ReactFlow>

            {/* Stats Panel */}
            {flowchartData?.stats && (
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Files:</span>
                    <span className="font-mono">{flowchartData.stats.totalFiles}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Dependencies:</span>
                    <span className="font-mono">{flowchartData.stats.totalDependencies}</span>
                  </div>
                  {flowchartData.stats.circularDeps > 0 && (
                    <div className="flex justify-between gap-4 text-destructive">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Circular:
                      </span>
                      <span className="font-mono">{flowchartData.stats.circularDeps}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            <AnimatePresence>
              {flowchartData?.recommendations?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-4 right-4 max-w-md"
                >
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <strong>AI Recommendations:</strong>
                      <ul className="mt-2 text-sm space-y-1">
                        {flowchartData.recommendations.slice(0, 3).map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mermaid Export */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Mermaid Code</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyMermaidCode}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={exportAsPng}>
                  <Download className="h-4 w-4 mr-1" />
                  Export PNG
                </Button>
              </div>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-32">
              {mermaidCode || 'No diagram generated yet'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
