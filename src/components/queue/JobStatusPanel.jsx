/**
 * JobStatusPanel — Real-time job status display
 * Shows queue status, active jobs, and job history
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Ban,
  ListOrdered,
  Zap,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { jobQueue, JobStatus, JobType } from '@/services/jobQueue';

const STATUS_CONFIG = {
  [JobStatus.QUEUED]: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    label: 'Queued',
  },
  [JobStatus.RUNNING]: {
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    label: 'Running',
    animate: true,
  },
  [JobStatus.COMPLETE]: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    label: 'Complete',
  },
  [JobStatus.FAILED]: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    label: 'Failed',
  },
  [JobStatus.CANCELLED]: {
    icon: Ban,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    label: 'Cancelled',
  },
};

const TYPE_LABELS = {
  [JobType.ZIP_ANALYSIS]: 'ZIP Analysis',
  [JobType.PROJECT_SCAN]: 'Project Scan',
  [JobType.AI_ANALYSIS]: 'AI Analysis',
  [JobType.TASK_GENERATION]: 'Task Generation',
  [JobType.CODE_REFACTOR]: 'Code Refactor',
  [JobType.FILE_GENERATION]: 'File Generation',
  [JobType.DEPLOYMENT_PREP]: 'Deployment Prep',
};

function formatDuration(ms) {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTime(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleTimeString();
}

function JobItem({ job, onRetry, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG[JobStatus.QUEUED];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`border border-white/10 rounded-lg overflow-hidden ${config.bgColor}`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon 
          className={`w-5 h-5 ${config.color} ${config.animate ? 'animate-spin' : ''}`} 
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {TYPE_LABELS[job.type] || job.type}
            </span>
            <Badge variant="outline" className="text-xs">
              {config.label}
            </Badge>
          </div>
          
          {job.status === JobStatus.RUNNING && (
            <Progress value={job.progress} className="mt-2 h-1" />
          )}
          
          {job.error && (
            <p className="text-xs text-red-400 mt-1 truncate">{job.error}</p>
          )}
        </div>

        <span className="text-xs text-gray-500">
          {formatTime(job.createdAt)}
        </span>

        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-white/10 space-y-3">
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Queue Time:</span>
                  <span className="ml-1 text-gray-300">{formatDuration(job.metrics?.queueTime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Process Time:</span>
                  <span className="ml-1 text-gray-300">{formatDuration(job.metrics?.processTime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="ml-1 text-gray-300">{formatDuration(job.metrics?.totalTime)}</span>
                </div>
              </div>

              {/* Logs */}
              {job.logs && job.logs.length > 0 && (
                <div className="bg-black/30 rounded p-2 max-h-32 overflow-auto">
                  {job.logs.slice(-5).map((log, i) => (
                    <div key={i} className="text-xs font-mono">
                      <span className="text-gray-500">{formatTime(log.timestamp)}</span>
                      <span className={`ml-2 ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warn' ? 'text-yellow-400' : 'text-gray-300'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {job.status === JobStatus.FAILED && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetry(job.id)}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
                {(job.status === JobStatus.QUEUED || job.status === JobStatus.RUNNING) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCancel(job.id)}
                    className="h-7 text-xs text-red-400 hover:text-red-300"
                  >
                    <Ban className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function JobStatusPanel({ projectId = null, className = '' }) {
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Initial load
    updateJobs();
    updateStatus();

    // Subscribe to events
    const unsubAdded = jobQueue.on('added', updateJobs);
    const unsubStarted = jobQueue.on('started', updateJobs);
    const unsubCompleted = jobQueue.on('completed', updateJobs);
    const unsubFailed = jobQueue.on('failed', updateJobs);
    const unsubCancelled = jobQueue.on('cancelled', updateJobs);

    // Poll for progress updates
    const interval = setInterval(() => {
      updateJobs();
      updateStatus();
    }, 1000);

    return () => {
      unsubAdded();
      unsubStarted();
      unsubCompleted();
      unsubFailed();
      unsubCancelled();
      clearInterval(interval);
    };
  }, [projectId]);

  function updateJobs() {
    const allJobs = projectId 
      ? jobQueue.getJobsByProject(projectId)
      : [
          ...Array.from(jobQueue.activeJobs.values()),
          ...jobQueue.queue,
          ...Array.from(jobQueue.completedJobs.values()).slice(0, 20),
        ];
    setJobs(allJobs.map(j => j.toJSON ? j.toJSON() : j));
  }

  function updateStatus() {
    setStatus(jobQueue.getStatus());
  }

  function handleRetry(jobId) {
    jobQueue.retry(jobId);
    updateJobs();
  }

  function handleCancel(jobId) {
    jobQueue.cancel(jobId);
    updateJobs();
  }

  function handleClearOld() {
    jobQueue.clearOldJobs();
    updateJobs();
  }

  const activeCount = jobs.filter(j => j.status === JobStatus.RUNNING).length;
  const queuedCount = jobs.filter(j => j.status === JobStatus.QUEUED).length;
  const failedCount = jobs.filter(j => j.status === JobStatus.FAILED).length;

  return (
    <Card className={`bg-gray-900/80 border-white/10 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Job Queue
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <Badge className="bg-blue-500/20 text-blue-400">
                <Zap className="w-3 h-3 mr-1" />
                {activeCount} Active
              </Badge>
            )}
            {queuedCount > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400">
                <ListOrdered className="w-3 h-3 mr-1" />
                {queuedCount} Queued
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400">
                <XCircle className="w-3 h-3 mr-1" />
                {failedCount} Failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No jobs in queue</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-3">
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {jobs.map(job => (
                    <JobItem
                      key={job.id}
                      job={job}
                      onRetry={handleRetry}
                      onCancel={handleCancel}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer Stats */}
            {status && (
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span>Total: {status.stats.totalJobsProcessed} processed</span>
                  <span>Avg: {formatDuration(status.stats.averageProcessTime)}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearOld}
                  className="h-6 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear Old
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
