/**
 * GPU Provider Panel — Configure and monitor GPU workers
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Cpu, 
  Cloud, 
  Server, 
  Zap, 
  Settings, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { gpuWorker, GPUProvider } from '../../services/gpuWorker';

const PROVIDER_INFO = {
  [GPUProvider.OLLAMA]: {
    name: 'Ollama',
    description: 'Local LLM server — Free, private, fast',
    icon: Server,
    color: 'bg-green-500',
    setupUrl: 'https://ollama.ai',
    local: true,
  },
  [GPUProvider.LM_STUDIO]: {
    name: 'LM Studio',
    description: 'Local model hosting with GUI',
    icon: Cpu,
    color: 'bg-blue-500',
    setupUrl: 'https://lmstudio.ai',
    local: true,
  },
  [GPUProvider.RUNPOD]: {
    name: 'RunPod',
    description: 'Serverless GPU — A100, H100 on demand',
    icon: Zap,
    color: 'bg-purple-500',
    setupUrl: 'https://runpod.io',
    local: false,
  },
  [GPUProvider.REPLICATE]: {
    name: 'Replicate',
    description: 'Hosted model inference — pay per use',
    icon: Cloud,
    color: 'bg-orange-500',
    setupUrl: 'https://replicate.com',
    local: false,
  },
  [GPUProvider.MODAL]: {
    name: 'Modal',
    description: 'Python-first serverless compute',
    icon: Settings,
    color: 'bg-cyan-500',
    setupUrl: 'https://modal.com',
    local: false,
  },
};

export default function GPUProviderPanel() {
  const [providerStatus, setProviderStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    runpod: '',
    replicate: '',
    modal: '',
  });
  const [showKeys, setShowKeys] = useState({});
  const [stats, setStats] = useState(null);

  useEffect(() => {
    checkAllProviders();
    setStats(gpuWorker.getStats());
  }, []);

  const checkAllProviders = async () => {
    setIsLoading(true);
    try {
      const status = await gpuWorker.getAvailableProviders();
      setProviderStatus(status);
    } catch (error) {
      console.error('Failed to check providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKeys = () => {
    gpuWorker.configure({
      runpodApiKey: apiKeys.runpod,
      replicateApiKey: apiKeys.replicate,
      modalToken: apiKeys.modal,
    });
    checkAllProviders();
  };

  const toggleKeyVisibility = (key) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GPU Providers</h2>
          <p className="text-muted-foreground">
            Configure local and cloud GPU workers for heavy AI workloads
          </p>
        </div>
        <Button onClick={checkAllProviders} disabled={isLoading} variant="outline">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Status
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalComputeSeconds.toFixed(1)}s</div>
              <div className="text-sm text-muted-foreground">Compute Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
              <div className="text-sm text-muted-foreground">Estimated Cost</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Local Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Local Providers
          </CardTitle>
          <CardDescription>
            Free, private inference running on your machine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[GPUProvider.OLLAMA, GPUProvider.LM_STUDIO].map(provider => {
            const info = PROVIDER_INFO[provider];
            const status = providerStatus[provider];
            const Icon = info.icon;

            return (
              <motion.div
                key={provider}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${info.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{info.name}</div>
                    <div className="text-sm text-muted-foreground">{info.description}</div>
                    {status?.models?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {status.models.slice(0, 3).map(model => (
                          <Badge key={model} variant="secondary" className="text-xs">
                            {model}
                          </Badge>
                        ))}
                        {status.models.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{status.models.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {status?.available ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <a href={info.setupUrl} target="_blank" rel="noopener noreferrer">
                      Setup Guide
                    </a>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Cloud Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloud Providers
          </CardTitle>
          <CardDescription>
            Powerful GPUs on demand — A100, H100, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[GPUProvider.RUNPOD, GPUProvider.REPLICATE, GPUProvider.MODAL].map(provider => {
            const info = PROVIDER_INFO[provider];
            const status = providerStatus[provider];
            const Icon = info.icon;
            const keyName = provider.toLowerCase().replace('_', '');

            return (
              <motion.div
                key={provider}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${info.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{info.name}</div>
                      <div className="text-sm text-muted-foreground">{info.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status?.available ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        {status?.error || 'Not Configured'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* API Key Input */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`${provider}-key`} className="sr-only">API Key</Label>
                    <div className="relative">
                      <Input
                        id={`${provider}-key`}
                        type={showKeys[provider] ? 'text' : 'password'}
                        placeholder={`${info.name} API Key`}
                        value={apiKeys[keyName] || ''}
                        onChange={(e) => setApiKeys(prev => ({ 
                          ...prev, 
                          [keyName]: e.target.value 
                        }))}
                      />
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility(provider)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showKeys[provider] ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <a href={info.setupUrl} target="_blank" rel="noopener noreferrer">
                      Get Key
                    </a>
                  </Button>
                </div>
              </motion.div>
            );
          })}

          <Button onClick={handleSaveKeys} className="w-full">
            Save API Keys
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Recommended Setup:</strong> Install Ollama for free local inference. 
          For heavy workloads (70B+ models, project completion), configure RunPod or Replicate.
        </AlertDescription>
      </Alert>
    </div>
  );
}
