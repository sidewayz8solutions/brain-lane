/**
 * Multi-Agent Panel — Orchestrate specialized AI agents
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Bot,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Sparkles,
  Shield,
  Wrench,
  Palette,
  Rocket,
  FileText,
  TestTube2,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { 
  orchestrator, 
  AgentType, 
  AgentStatus, 
  AGENT_DEFINITIONS,
  PRESET_PIPELINES,
} from '../../services/multiAgentOrchestrator';
import { useProjectStore, useTaskStore } from '@/store/projectStore';

const AGENT_ICONS = {
  [AgentType.CODE_AUDITOR]: Shield,
  [AgentType.SYNTAX_FIXER]: Wrench,
  [AgentType.FEATURE_COMPLETER]: Sparkles,
  [AgentType.UI_DESIGNER]: Palette,
  [AgentType.DEPLOYMENT_ARCHITECT]: Rocket,
  [AgentType.DOCUMENTATION_WRITER]: FileText,
  [AgentType.TEST_ENGINEER]: TestTube2,
};

const STATUS_COLORS = {
  [AgentStatus.IDLE]: 'bg-gray-500',
  [AgentStatus.WORKING]: 'bg-yellow-500 animate-pulse',
  [AgentStatus.COMPLETED]: 'bg-green-500',
  [AgentStatus.FAILED]: 'bg-red-500',
  [AgentStatus.WAITING]: 'bg-blue-500',
};

export default function MultiAgentPanel({ files = [], projectName = 'Project' }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('agents');
  const [executionHistory, setExecutionHistory] = useState([]);
  const currentProject = useProjectStore((s) => s.currentProject);
  const createTask = useTaskStore((s) => s.createTask);
  const updateProject = useProjectStore((s) => s.updateProject);

  useEffect(() => {
    setAgents(orchestrator.getAgents());
    setExecutionHistory(orchestrator.getHistory());
  }, []);

  const toggleAgent = (agentType) => {
    setSelectedAgents(prev => 
      prev.includes(agentType)
        ? prev.filter(a => a !== agentType)
        : [...prev, agentType]
    );
  };

  const selectPreset = (preset) => {
    setSelectedAgents(preset.agents);
  };

  const handleRun = async () => {
    if (selectedAgents.length === 0 || files.length === 0) return;

    setIsRunning(true);
    setResults(null);

    try {
      const execution = await orchestrator.runPipeline(files, {
        agents: selectedAgents,
        onProgress: (prog) => {
          setProgress(prog);
          // Refresh agent statuses
          setAgents(orchestrator.getAgents());
        },
      });

      setResults(execution);
      setExecutionHistory(orchestrator.getHistory());

      // Persist lightweight task results for visibility
      if (execution?.results?.length) {
        execution.results.forEach((r) => {
          createTask({
            project_id: currentProject?.id,
            title: `${AGENT_DEFINITIONS[r.agent]?.name || r.agent} result`,
            description: r.analysis || '',
            status: r.success ? 'completed' : 'failed',
            priority: 'medium',
            tags: ['agent', r.agent],
          });
        });
      }

      // Update project summary minimally
      if (currentProject?.id) {
        updateProject(currentProject.id, {
          updated_at: new Date().toISOString(),
          status: 'ready',
        });
      }
    } catch (error) {
      console.error('Pipeline execution failed:', error);
    } finally {
      setIsRunning(false);
      setProgress(null);
      setAgents(orchestrator.getAgents());
    }
  };

  const handleSmartRoute = async () => {
    if (files.length === 0) return;

    setIsRunning(true);
    try {
      const suggestedAgents = await orchestrator.smartRoute(
        files, 
        'Analyze, fix issues, and prepare for deployment'
      );
      setSelectedAgents(suggestedAgents);
    } catch (error) {
      console.error('Smart routing failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Multi-Agent Mode
          </h2>
          <p className="text-muted-foreground">
            Specialized AI agents working together on your project
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSmartRoute}
            disabled={isRunning || files.length === 0}
          >
            <Zap className="h-4 w-4 mr-2" />
            Smart Select
          </Button>
          <Button 
            onClick={handleRun}
            disabled={isRunning || selectedAgents.length === 0 || files.length === 0}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Pipeline
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <AnimatePresence>
        {progress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Step {progress.step} / {progress.total}
                    </Badge>
                    <span className="text-sm">
                      {AGENT_DEFINITIONS[progress.agent]?.emoji} {AGENT_DEFINITIONS[progress.agent]?.name}
                    </span>
                  </div>
                  <Badge className={progress.status === 'running' ? 'bg-yellow-500' : 'bg-green-500'}>
                    {progress.status}
                  </Badge>
                </div>
                <Progress value={(progress.step / progress.total) * 100} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const Icon = AGENT_ICONS[agent.type];
              const isSelected = selectedAgents.includes(agent.type);

              return (
                <motion.div
                  key={agent.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => toggleAgent(agent.type)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {agent.emoji} {agent.name}
                            </div>
                            <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[agent.status]}`} />
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {agent.description}
                      </p>
                      <div className="flex gap-1 mt-3 flex-wrap">
                        {agent.capabilities.slice(0, 3).map((cap) => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {cap.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                      {agent.stats.tasksCompleted > 0 && (
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          {agent.stats.tasksCompleted} tasks • {Math.round(agent.stats.avgResponseTime / 1000)}s avg
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {selectedAgents.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Selected Pipeline:</div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedAgents.map((agentType, i) => {
                  const agent = AGENT_DEFINITIONS[agentType];
                  return (
                    <div key={agentType} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <Badge variant="outline">
                        {agent.emoji} {agent.name}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(PRESET_PIPELINES).map(([key, preset]) => (
              <Card 
                key={key}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => selectPreset(preset)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{preset.icon}</span>
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-muted-foreground">{preset.description}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap mt-3">
                    {preset.agents.map((agentType) => (
                      <Badge key={agentType} variant="secondary" className="text-xs">
                        {AGENT_DEFINITIONS[agentType]?.emoji} {AGENT_DEFINITIONS[agentType]?.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-4">
          {results ? (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {results.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Pipeline {results.success ? 'Completed' : 'Failed'}
                  </CardTitle>
                  <CardDescription>
                    {results.results.length} agents executed • {results.finalFiles.length} files processed
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Agent Results */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {results.results.map((result, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {AGENT_DEFINITIONS[result.agent]?.emoji} {result.agentName || result.agent}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {result.success ? (
                          <>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                              {result.analysis}
                            </p>
                            {result.fileChanges?.length > 0 && (
                              <div className="mt-3">
                                <Badge variant="secondary">
                                  {result.fileChanges.length} file changes
                                </Badge>
                              </div>
                            )}
                          </>
                        ) : (
                          <Alert variant="destructive">
                            <AlertDescription>{result.error}</AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : executionHistory.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium mb-3">Previous Executions</div>
              {executionHistory.slice(-5).reverse().map((exec) => (
                <div 
                  key={exec.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {exec.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {exec.agents.map(a => AGENT_DEFINITIONS[a]?.emoji).join(' → ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(exec.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results yet. Select agents and run a pipeline to see results.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {files.length === 0 && (
        <Alert>
          <AlertDescription>
            Upload a project to start using multi-agent analysis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
