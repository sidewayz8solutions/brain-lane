/**
 * Brain Lane — Job Queue System
 * ==============================
 * A robust job queue for processing large uploads and AI tasks.
 * 
 * Architecture:
 * - Client-side: In-memory queue with IndexedDB persistence
 * - Backend-ready: Interface matches BullMQ for easy migration
 * 
 * Job States:
 * - QUEUED: Job is waiting to be processed
 * - RUNNING: Job is currently being processed
 * - COMPLETE: Job finished successfully
 * - FAILED: Job encountered an error
 * - CANCELLED: Job was cancelled by user
 */

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export const JobStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

export const JobType = {
  ZIP_ANALYSIS: 'zip_analysis',
  PROJECT_SCAN: 'project_scan',
  AI_ANALYSIS: 'ai_analysis',
  TASK_GENERATION: 'task_generation',
  CODE_REFACTOR: 'code_refactor',
  FILE_GENERATION: 'file_generation',
  DEPLOYMENT_PREP: 'deployment_prep',
};

export const JobPriority = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
};

// ============================================================================
// JOB CLASS
// ============================================================================

class Job {
  constructor({
    id = null,
    type,
    data,
    priority = JobPriority.NORMAL,
    maxRetries = 3,
    timeout = 300000, // 5 minutes default
    userId = null,
    projectId = null,
  }) {
    this.id = id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.data = data;
    this.priority = priority;
    this.maxRetries = maxRetries;
    this.timeout = timeout;
    this.userId = userId;
    this.projectId = projectId;
    
    // State
    this.status = JobStatus.QUEUED;
    this.progress = 0;
    this.result = null;
    this.error = null;
    this.retryCount = 0;
    
    // Timestamps
    this.createdAt = new Date().toISOString();
    this.startedAt = null;
    this.completedAt = null;
    this.updatedAt = this.createdAt;
    
    // Metadata
    this.logs = [];
    this.metrics = {
      queueTime: null,
      processTime: null,
      totalTime: null,
    };
  }

  log(message, level = 'info') {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
    });
    this.updatedAt = new Date().toISOString();
  }

  updateProgress(progress, message = null) {
    this.progress = Math.min(100, Math.max(0, progress));
    if (message) this.log(message);
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      priority: this.priority,
      status: this.status,
      progress: this.progress,
      result: this.result,
      error: this.error,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      userId: this.userId,
      projectId: this.projectId,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      updatedAt: this.updatedAt,
      logs: this.logs,
      metrics: this.metrics,
    };
  }

  static fromJSON(json) {
    const job = new Job({
      id: json.id,
      type: json.type,
      data: json.data,
      priority: json.priority,
      maxRetries: json.maxRetries,
      userId: json.userId,
      projectId: json.projectId,
    });
    job.status = json.status;
    job.progress = json.progress;
    job.result = json.result;
    job.error = json.error;
    job.retryCount = json.retryCount;
    job.createdAt = json.createdAt;
    job.startedAt = json.startedAt;
    job.completedAt = json.completedAt;
    job.updatedAt = json.updatedAt;
    job.logs = json.logs || [];
    job.metrics = json.metrics || {};
    return job;
  }
}

// ============================================================================
// JOB QUEUE CLASS
// ============================================================================

class JobQueue {
  constructor(options = {}) {
    this.name = options.name || 'brain-lane-queue';
    this.concurrency = options.concurrency || 2;
    this.persistToStorage = options.persistToStorage ?? true;
    
    // State
    this.queue = [];
    this.activeJobs = new Map();
    this.completedJobs = new Map();
    this.processors = new Map();
    this.listeners = new Map();
    
    // Stats
    this.stats = {
      totalJobsProcessed: 0,
      totalJobsFailed: 0,
      averageProcessTime: 0,
      currentQueueSize: 0,
    };

    // Initialize
    this._loadFromStorage();
    this._startProcessing();
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  /**
   * Register a processor for a job type
   */
  process(jobType, handler) {
    this.processors.set(jobType, handler);
    console.log(`📋 Registered processor for: ${jobType}`);
  }

  /**
   * Add a job to the queue
   */
  async add(type, data, options = {}) {
    const job = new Job({
      type,
      data,
      priority: options.priority || JobPriority.NORMAL,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 300000,
      userId: options.userId,
      projectId: options.projectId,
    });

    job.log(`Job created: ${type}`);
    
    // Insert by priority (lower number = higher priority)
    const insertIndex = this.queue.findIndex(j => j.priority > job.priority);
    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    this.stats.currentQueueSize = this.queue.length;
    this._emit('added', job);
    this._saveToStorage();

    console.log(`📥 Job added: ${job.id} (${type}) - Queue size: ${this.queue.length}`);
    return job;
  }

  /**
   * Get job by ID
   */
  getJob(jobId) {
    // Check active jobs
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId);
    }
    // Check queue
    const queued = this.queue.find(j => j.id === jobId);
    if (queued) return queued;
    // Check completed
    if (this.completedJobs.has(jobId)) {
      return this.completedJobs.get(jobId);
    }
    return null;
  }

  /**
   * Get all jobs for a project
   */
  getJobsByProject(projectId) {
    const jobs = [];
    this.queue.forEach(j => { if (j.projectId === projectId) jobs.push(j); });
    this.activeJobs.forEach(j => { if (j.projectId === projectId) jobs.push(j); });
    this.completedJobs.forEach(j => { if (j.projectId === projectId) jobs.push(j); });
    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      activeJobs: this.activeJobs.size,
      completedJobs: this.completedJobs.size,
      stats: { ...this.stats },
      processors: Array.from(this.processors.keys()),
    };
  }

  /**
   * Cancel a job
   */
  async cancel(jobId) {
    const job = this.getJob(jobId);
    if (!job) return false;

    if (job.status === JobStatus.QUEUED) {
      this.queue = this.queue.filter(j => j.id !== jobId);
      job.status = JobStatus.CANCELLED;
      job.completedAt = new Date().toISOString();
      job.log('Job cancelled by user', 'warn');
      this.completedJobs.set(job.id, job);
      this._emit('cancelled', job);
      this._saveToStorage();
      return true;
    }

    if (job.status === JobStatus.RUNNING) {
      // Mark for cancellation - processor should check this
      job.status = JobStatus.CANCELLED;
      job.log('Job cancellation requested', 'warn');
      return true;
    }

    return false;
  }

  /**
   * Retry a failed job
   */
  async retry(jobId) {
    const job = this.completedJobs.get(jobId);
    if (!job || job.status !== JobStatus.FAILED) return null;

    // Reset job state
    job.status = JobStatus.QUEUED;
    job.progress = 0;
    job.error = null;
    job.retryCount++;
    job.log(`Manual retry requested (attempt ${job.retryCount + 1})`);

    this.completedJobs.delete(jobId);
    this.queue.push(job);
    this._emit('retried', job);
    this._saveToStorage();

    return job;
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) listeners.splice(index, 1);
    }
  }

  /**
   * Clear completed jobs older than specified time
   */
  clearOldJobs(maxAgeMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAgeMs;
    let cleared = 0;
    
    this.completedJobs.forEach((job, id) => {
      if (new Date(job.completedAt).getTime() < cutoff) {
        this.completedJobs.delete(id);
        cleared++;
      }
    });

    if (cleared > 0) {
      this._saveToStorage();
      console.log(`🧹 Cleared ${cleared} old jobs`);
    }

    return cleared;
  }

  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------

  _emit(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Event listener error (${event}):`, err);
      }
    });
  }

  async _startProcessing() {
    // Process loop
    setInterval(() => this._processNext(), 500);
  }

  async _processNext() {
    // Check if we can process more jobs
    if (this.activeJobs.size >= this.concurrency) return;
    if (this.queue.length === 0) return;

    // Get next job
    const job = this.queue.shift();
    if (!job) return;

    // Check if we have a processor
    const processor = this.processors.get(job.type);
    if (!processor) {
      job.status = JobStatus.FAILED;
      job.error = `No processor registered for job type: ${job.type}`;
      job.log(job.error, 'error');
      job.completedAt = new Date().toISOString();
      this.completedJobs.set(job.id, job);
      this._emit('failed', job);
      return;
    }

    // Start processing
    this.activeJobs.set(job.id, job);
    job.status = JobStatus.RUNNING;
    job.startedAt = new Date().toISOString();
    job.metrics.queueTime = new Date(job.startedAt) - new Date(job.createdAt);
    job.log('Job started');
    this._emit('started', job);
    this.stats.currentQueueSize = this.queue.length;

    // Setup timeout
    const timeoutId = setTimeout(() => {
      if (job.status === JobStatus.RUNNING) {
        job.status = JobStatus.FAILED;
        job.error = `Job timed out after ${job.timeout}ms`;
        job.log(job.error, 'error');
        this._completeJob(job);
      }
    }, job.timeout);

    try {
      // Create job context for processor
      const context = {
        job,
        updateProgress: (progress, msg) => job.updateProgress(progress, msg),
        log: (msg, level) => job.log(msg, level),
        isCancelled: () => job.status === JobStatus.CANCELLED,
      };

      // Run processor
      const result = await processor(job.data, context);
      clearTimeout(timeoutId);

      // Check if cancelled during processing
      if (job.status === JobStatus.CANCELLED) {
        job.log('Job was cancelled during processing', 'warn');
        this._completeJob(job);
        return;
      }

      // Success
      job.status = JobStatus.COMPLETE;
      job.result = result;
      job.progress = 100;
      job.log('Job completed successfully');
      this.stats.totalJobsProcessed++;
      this._completeJob(job);

    } catch (error) {
      clearTimeout(timeoutId);
      job.error = error.message || String(error);
      job.log(`Job failed: ${job.error}`, 'error');

      // Check if we should retry
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = JobStatus.QUEUED;
        job.log(`Retrying (attempt ${job.retryCount + 1}/${job.maxRetries + 1})`);
        this.activeJobs.delete(job.id);
        
        // Add back to queue with delay
        setTimeout(() => {
          this.queue.push(job);
          this._emit('retried', job);
          this._saveToStorage();
        }, Math.min(1000 * Math.pow(2, job.retryCount), 30000));
        
        return;
      }

      job.status = JobStatus.FAILED;
      this.stats.totalJobsFailed++;
      this._completeJob(job);
    }
  }

  _completeJob(job) {
    job.completedAt = new Date().toISOString();
    job.metrics.processTime = new Date(job.completedAt) - new Date(job.startedAt);
    job.metrics.totalTime = new Date(job.completedAt) - new Date(job.createdAt);
    
    this.activeJobs.delete(job.id);
    this.completedJobs.set(job.id, job);
    
    // Update average process time
    const totalProcessed = this.stats.totalJobsProcessed + this.stats.totalJobsFailed;
    if (totalProcessed > 0) {
      this.stats.averageProcessTime = 
        (this.stats.averageProcessTime * (totalProcessed - 1) + job.metrics.processTime) / totalProcessed;
    }

    this._emit(job.status === JobStatus.COMPLETE ? 'completed' : 'failed', job);
    this._saveToStorage();

    console.log(`📤 Job ${job.status.toLowerCase()}: ${job.id} (${job.metrics.processTime}ms)`);
  }

  async _saveToStorage() {
    if (!this.persistToStorage) return;
    
    try {
      const data = {
        queue: this.queue.map(j => j.toJSON()),
        completed: Array.from(this.completedJobs.values()).map(j => j.toJSON()),
        stats: this.stats,
      };
      localStorage.setItem(`${this.name}_data`, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save job queue to storage:', err);
    }
  }

  _loadFromStorage() {
    if (!this.persistToStorage) return;
    
    try {
      const stored = localStorage.getItem(`${this.name}_data`);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      // Restore queue (only QUEUED jobs)
      if (data.queue) {
        this.queue = data.queue
          .filter(j => j.status === JobStatus.QUEUED)
          .map(j => Job.fromJSON(j));
      }
      
      // Restore completed jobs
      if (data.completed) {
        data.completed.forEach(j => {
          const job = Job.fromJSON(j);
          this.completedJobs.set(job.id, job);
        });
      }
      
      // Restore stats
      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
      }

      console.log(`📋 Loaded ${this.queue.length} queued, ${this.completedJobs.size} completed jobs from storage`);
    } catch (err) {
      console.warn('Failed to load job queue from storage:', err);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const jobQueue = new JobQueue({
  name: 'brain-lane-jobs',
  concurrency: 2,
  persistToStorage: true,
});

// ============================================================================
// EXPORTS
// ============================================================================

export { Job, JobQueue };
export default jobQueue;
