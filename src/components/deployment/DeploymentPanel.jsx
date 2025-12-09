/**
 * Deployment Panel — One-click deployment configuration generator
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import {
  Rocket,
  Cloud,
  Server,
  Database,
  FileCode,
  Download,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { deploymentGenerator, DeploymentPlatform } from '../../services/deploymentGenerator';
import JSZip from 'jszip';

const PLATFORM_INFO = {
  [DeploymentPlatform.VERCEL]: {
    name: 'Vercel',
    description: 'Best for React, Next.js, Vite apps',
    icon: '▲',
    color: 'bg-black text-white',
    url: 'https://vercel.com',
  },
  [DeploymentPlatform.NETLIFY]: {
    name: 'Netlify',
    description: 'Great for static sites and serverless',
    icon: '◆',
    color: 'bg-teal-500 text-white',
    url: 'https://netlify.com',
  },
  [DeploymentPlatform.DOCKER]: {
    name: 'Docker',
    description: 'Containerized deployment anywhere',
    icon: '🐳',
    color: 'bg-blue-500 text-white',
    url: 'https://docker.com',
  },
  [DeploymentPlatform.RAILWAY]: {
    name: 'Railway',
    description: 'Full-stack apps with databases',
    icon: '🚂',
    color: 'bg-purple-500 text-white',
    url: 'https://railway.app',
  },
  [DeploymentPlatform.FLY_IO]: {
    name: 'Fly.io',
    description: 'Edge deployment with global reach',
    icon: '✈️',
    color: 'bg-violet-500 text-white',
    url: 'https://fly.io',
  },
};

export default function DeploymentPanel({ files = [], projectName = 'project' }) {
  const [selectedPlatform, setSelectedPlatform] = useState(DeploymentPlatform.VERCEL);
  const [deploymentConfig, setDeploymentConfig] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedFile, setCopiedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('files');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const config = await deploymentGenerator.generateDeploymentPackage(files, {
        platform: selectedPlatform,
      });
      setDeploymentConfig(config);
    } catch (error) {
      console.error('Failed to generate deployment config:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyFile = async (filename, content) => {
    await navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadAll = async () => {
    if (!deploymentConfig) return;

    const zip = new JSZip();
    
    for (const [filename, content] of Object.entries(deploymentConfig.files)) {
      zip.file(filename, content);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}-deployment-config.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            One-Click Deployment
          </h2>
          <p className="text-muted-foreground">
            Generate deployment configs for your preferred platform
          </p>
        </div>
      </div>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Platform</CardTitle>
          <CardDescription>
            Choose where you want to deploy your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(PLATFORM_INFO).map(([key, platform]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlatform(key)}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  selectedPlatform === key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-lg mb-2`}>
                  {platform.icon}
                </div>
                <div className="font-medium">{platform.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {platform.description}
                </div>
              </motion.button>
            ))}
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || files.length === 0}
            className="w-full mt-4"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Generate Deployment Config
              </>
            )}
          </Button>

          {files.length === 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Upload a project first to generate deployment configurations.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Config */}
      <AnimatePresence>
        {deploymentConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Configuration Ready
                    </CardTitle>
                    <CardDescription>
                      Detected: {deploymentConfig.stack?.framework || 'Unknown'} / {deploymentConfig.stack?.language || 'JavaScript'}
                    </CardDescription>
                  </div>
                  <Button onClick={handleDownloadAll} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 w-full mb-4">
                    <TabsTrigger value="files">
                      <FileCode className="h-4 w-4 mr-2" />
                      Config Files
                    </TabsTrigger>
                    <TabsTrigger value="env">
                      <Database className="h-4 w-4 mr-2" />
                      Environment
                    </TabsTrigger>
                    <TabsTrigger value="steps">
                      <Terminal className="h-4 w-4 mr-2" />
                      Deploy Steps
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="files">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {Object.entries(deploymentConfig.files).map(([filename, content]) => (
                          <div key={filename} className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 bg-muted">
                              <span className="font-mono text-sm">{filename}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyFile(filename, content)}
                              >
                                {copiedFile === filename ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <pre className="p-4 text-xs overflow-auto max-h-60 bg-background">
                              {content}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="env">
                    <div className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Never commit real API keys to version control. Use your platform's environment variable settings.
                        </AlertDescription>
                      </Alert>

                      <div className="border rounded-lg divide-y">
                        {deploymentConfig.envVars.map((envVar, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {envVar.name}
                              </code>
                              <p className="text-xs text-muted-foreground mt-1">
                                {envVar.description}
                              </p>
                            </div>
                            {envVar.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        ))}
                        {deploymentConfig.envVars.length === 0 && (
                          <div className="px-4 py-8 text-center text-muted-foreground">
                            No environment variables detected
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="steps">
                    <div className="space-y-3">
                      {deploymentConfig.deploymentSteps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{step.title}</div>
                            <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded mt-1 inline-block">
                              {step.command}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyFile(step.title, step.command)}
                          >
                            {copiedFile === step.title ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Ready to deploy to {PLATFORM_INFO[selectedPlatform]?.name}
                      </p>
                      <Button asChild>
                        <a
                          href={PLATFORM_INFO[selectedPlatform]?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open {PLATFORM_INFO[selectedPlatform]?.name}
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
