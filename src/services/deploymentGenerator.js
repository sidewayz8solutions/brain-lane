/**
 * Brain Lane — Deployment Generator Service
 * ==========================================
 * Generates deployment configurations for various platforms:
 * - Vercel / Netlify
 * - Docker / Docker Compose
 * - Supabase schema
 * - Environment variables
 * - CI/CD workflows (GitHub Actions)
 */

import { aiEngine } from './aiEngine';

// ============================================================================
// DEPLOYMENT PLATFORMS
// ============================================================================

export const DeploymentPlatform = {
  VERCEL: 'vercel',
  NETLIFY: 'netlify',
  DOCKER: 'docker',
  RAILWAY: 'railway',
  FLY_IO: 'fly_io',
  RENDER: 'render',
  AWS_AMPLIFY: 'aws_amplify',
};

export const DatabaseType = {
  SUPABASE: 'supabase',
  PLANETSCALE: 'planetscale',
  NEON: 'neon',
  MONGODB_ATLAS: 'mongodb_atlas',
  FIREBASE: 'firebase',
};

// ============================================================================
// DEPLOYMENT GENERATOR CLASS
// ============================================================================

class DeploymentGenerator {
  constructor() {
    this.detectedStack = null;
  }

  /**
   * Analyze project and generate all deployment configs
   */
  async generateDeploymentPackage(files, options = {}) {
    // Detect project stack
    this.detectedStack = this._detectStack(files);

    const configs = {
      platform: options.platform || this._recommendPlatform(),
      stack: this.detectedStack,
      files: {},
      envVars: [],
      deploymentSteps: [],
    };

    // Generate configs based on platform
    switch (configs.platform) {
      case DeploymentPlatform.VERCEL:
        configs.files['vercel.json'] = this._generateVercelConfig();
        break;
      case DeploymentPlatform.NETLIFY:
        configs.files['netlify.toml'] = this._generateNetlifyConfig();
        break;
      case DeploymentPlatform.DOCKER:
        configs.files['Dockerfile'] = this._generateDockerfile();
        configs.files['docker-compose.yml'] = this._generateDockerCompose();
        configs.files['.dockerignore'] = this._generateDockerignore();
        break;
      case DeploymentPlatform.RAILWAY:
        configs.files['railway.json'] = this._generateRailwayConfig();
        break;
      case DeploymentPlatform.FLY_IO:
        configs.files['fly.toml'] = this._generateFlyConfig();
        break;
    }

    // Always generate common configs
    configs.files['.env.example'] = this._generateEnvExample();
    configs.files['.github/workflows/deploy.yml'] = this._generateGitHubWorkflow(configs.platform);
    
    // Database schema if detected
    if (this.detectedStack.database) {
      configs.files['supabase/schema.sql'] = await this._generateDatabaseSchema(files);
    }

    // Generate deployment steps
    configs.deploymentSteps = this._generateDeploymentSteps(configs.platform);

    // Collect environment variables
    configs.envVars = this._collectEnvVars(files);

    return configs;
  }

  // ---------------------------------------------------------------------------
  // STACK DETECTION
  // ---------------------------------------------------------------------------

  _detectStack(files) {
    const stack = {
      framework: null,
      language: null,
      runtime: null,
      database: null,
      hasApi: false,
      hasAuth: false,
      hasBuild: false,
    };

    // Check for package.json
    const packageJson = files.find(f => f.name === 'package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson.content || '{}');
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        // Detect framework
        if (deps['next']) stack.framework = 'nextjs';
        else if (deps['nuxt']) stack.framework = 'nuxt';
        else if (deps['@remix-run/react']) stack.framework = 'remix';
        else if (deps['vite']) stack.framework = 'vite';
        else if (deps['react']) stack.framework = 'react';
        else if (deps['vue']) stack.framework = 'vue';
        else if (deps['@angular/core']) stack.framework = 'angular';
        else if (deps['express']) stack.framework = 'express';

        // Detect language
        stack.language = deps['typescript'] ? 'typescript' : 'javascript';
        stack.runtime = 'node';

        // Detect database
        if (deps['@supabase/supabase-js']) stack.database = 'supabase';
        else if (deps['@prisma/client']) stack.database = 'prisma';
        else if (deps['mongoose']) stack.database = 'mongodb';
        else if (deps['firebase']) stack.database = 'firebase';

        // Detect features
        stack.hasAuth = !!(deps['@supabase/auth-helpers-react'] || deps['next-auth'] || deps['firebase']);
        stack.hasBuild = !!(pkg.scripts?.build);

      } catch (e) {
        console.error('Failed to parse package.json:', e);
      }
    }

    // Check for Python
    const requirements = files.find(f => f.name === 'requirements.txt' || f.name === 'pyproject.toml');
    if (requirements) {
      stack.runtime = 'python';
      stack.language = 'python';
      if (requirements.content?.includes('fastapi')) stack.framework = 'fastapi';
      else if (requirements.content?.includes('django')) stack.framework = 'django';
      else if (requirements.content?.includes('flask')) stack.framework = 'flask';
    }

    // Check for API routes
    stack.hasApi = files.some(f => 
      f.path.includes('/api/') || 
      f.path.includes('/routes/') ||
      f.content?.includes('express')
    );

    return stack;
  }

  _recommendPlatform() {
    if (!this.detectedStack) return DeploymentPlatform.VERCEL;

    const { framework, hasApi, runtime } = this.detectedStack;

    // Next.js / React / Vite → Vercel
    if (['nextjs', 'react', 'vite'].includes(framework)) {
      return DeploymentPlatform.VERCEL;
    }

    // Full-stack with API → Railway or Docker
    if (hasApi && runtime === 'node') {
      return DeploymentPlatform.RAILWAY;
    }

    // Python → Fly.io or Railway
    if (runtime === 'python') {
      return DeploymentPlatform.FLY_IO;
    }

    return DeploymentPlatform.VERCEL;
  }

  // ---------------------------------------------------------------------------
  // CONFIG GENERATORS
  // ---------------------------------------------------------------------------

  _generateVercelConfig() {
    const { framework, hasApi } = this.detectedStack;

    const config = {
      $schema: 'https://openapi.vercel.sh/vercel.json',
      buildCommand: this._getBuildCommand(),
      outputDirectory: this._getOutputDirectory(),
      installCommand: 'npm install',
      framework: framework === 'nextjs' ? 'nextjs' : framework === 'vite' ? 'vite' : null,
    };

    if (hasApi && framework !== 'nextjs') {
      config.rewrites = [
        { source: '/api/:path*', destination: '/api/:path*' },
      ];
    }

    // Add headers for security
    config.headers = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];

    return JSON.stringify(config, null, 2);
  }

  _generateNetlifyConfig() {
    const { framework } = this.detectedStack;

    return `[build]
  command = "${this._getBuildCommand()}"
  publish = "${this._getOutputDirectory()}"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  NODE_ENV = "production"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
`;
  }

  _generateDockerfile() {
    const { runtime, framework } = this.detectedStack;

    if (runtime === 'python') {
      return `# Python Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`;
    }

    // Node.js Dockerfile
    return `# Node.js Multi-stage Dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built assets
COPY --from=builder /app/${this._getOutputDirectory()} ./${this._getOutputDirectory()}
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser
USER appuser

EXPOSE 3000

CMD ["npm", "start"]
`;
  }

  _generateDockerCompose() {
    return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Add database service
  # postgres:
  #   image: postgres:15-alpine
  #   environment:
  #     POSTGRES_DB: app
  #     POSTGRES_USER: user
  #     POSTGRES_PASSWORD: password
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   ports:
  #     - "5432:5432"

volumes:
  postgres_data:
`;
  }

  _generateDockerignore() {
    return `# Dependencies
node_modules
.pnp
.pnp.js

# Build
dist
build
.next
out

# Dev
.env
.env.local
.env*.local
*.log

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage
.nyc_output

# Misc
*.md
*.txt
.git
.gitignore
`;
  }

  _generateRailwayConfig() {
    return JSON.stringify({
      $schema: 'https://railway.app/railway.schema.json',
      build: {
        builder: 'NIXPACKS',
        buildCommand: this._getBuildCommand(),
      },
      deploy: {
        startCommand: 'npm start',
        healthcheckPath: '/health',
        restartPolicyType: 'ON_FAILURE',
        restartPolicyMaxRetries: 10,
      },
    }, null, 2);
  }

  _generateFlyConfig() {
    return `app = "brain-lane-app"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[services]]
  protocol = "tcp"
  internal_port = 3000

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = 10000
    grace_period = "5s"
    method = "get"
    path = "/health"
    protocol = "http"
    timeout = 2000
`;
  }

  _generateEnvExample() {
    const envVars = [
      '# App Configuration',
      'NODE_ENV=development',
      'PORT=3000',
      '',
      '# API Keys',
      'OPENAI_API_KEY=sk-...',
      'ANTHROPIC_API_KEY=sk-ant-...',
      '',
    ];

    if (this.detectedStack?.database === 'supabase') {
      envVars.push(
        '# Supabase',
        'VITE_SUPABASE_URL=https://xxx.supabase.co',
        'VITE_SUPABASE_ANON_KEY=eyJ...',
        'SUPABASE_SERVICE_ROLE_KEY=eyJ...',
        ''
      );
    }

    if (this.detectedStack?.hasAuth) {
      envVars.push(
        '# Authentication',
        'AUTH_SECRET=your-secret-key',
        'GOOGLE_CLIENT_ID=',
        'GOOGLE_CLIENT_SECRET=',
        'GITHUB_CLIENT_ID=',
        'GITHUB_CLIENT_SECRET=',
        ''
      );
    }

    envVars.push(
      '# Billing (Stripe)',
      'STRIPE_SECRET_KEY=sk_...',
      'STRIPE_WEBHOOK_SECRET=whsec_...',
      'STRIPE_PRICE_PRO=price_...',
      ''
    );

    return envVars.join('\n');
  }

  _generateGitHubWorkflow(platform) {
    const workflow = {
      name: 'Deploy',
      on: {
        push: { branches: ['main'] },
        pull_request: { branches: ['main'] },
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          steps: [
            { uses: 'actions/checkout@v4' },
            { 
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v4',
              with: { 'node-version': '18', cache: 'npm' },
            },
            { name: 'Install dependencies', run: 'npm ci' },
            { name: 'Run tests', run: 'npm test --if-present' },
            { name: 'Build', run: 'npm run build' },
          ],
        },
      },
    };

    // Add deploy job based on platform
    if (platform === DeploymentPlatform.VERCEL) {
      workflow.jobs.deploy = {
        'runs-on': 'ubuntu-latest',
        needs: 'test',
        if: "github.ref == 'refs/heads/main'",
        steps: [
          { uses: 'actions/checkout@v4' },
          {
            name: 'Deploy to Vercel',
            uses: 'amondnet/vercel-action@v25',
            with: {
              'vercel-token': '${{ secrets.VERCEL_TOKEN }}',
              'vercel-org-id': '${{ secrets.VERCEL_ORG_ID }}',
              'vercel-project-id': '${{ secrets.VERCEL_PROJECT_ID }}',
              'vercel-args': '--prod',
            },
          },
        ],
      };
    }

    // Convert to YAML
    return this._toYaml(workflow);
  }

  async _generateDatabaseSchema(files) {
    // Find existing schema files
    const schemaFiles = files.filter(f => 
      f.name.includes('schema') || 
      f.name.includes('.sql') ||
      f.path.includes('/prisma/')
    );

    if (schemaFiles.length > 0) {
      // Use AI to analyze and complete schema
      const prompt = `Analyze these database schema files and generate a complete Supabase SQL schema:

${schemaFiles.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n')}

Generate:
1. Complete table definitions with proper types
2. Row Level Security (RLS) policies
3. Indexes for common queries
4. Triggers for timestamps
5. Comments documenting each table`;

      try {
        const response = await aiEngine.invoke({
          prompt,
          type: 'code',
          model: 'gpt-4o',
        });
        return response.text;
      } catch (e) {
        console.error('AI schema generation failed:', e);
      }
    }

    // Default schema template
    return `-- Supabase SQL Schema
-- Generated by Brain Lane

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
`;
  }

  _generateDeploymentSteps(platform) {
    const commonSteps = [
      { step: 1, title: 'Install dependencies', command: 'npm install' },
      { step: 2, title: 'Build project', command: this._getBuildCommand() },
      { step: 3, title: 'Run tests', command: 'npm test' },
    ];

    const platformSteps = {
      [DeploymentPlatform.VERCEL]: [
        ...commonSteps,
        { step: 4, title: 'Install Vercel CLI', command: 'npm i -g vercel' },
        { step: 5, title: 'Login to Vercel', command: 'vercel login' },
        { step: 6, title: 'Deploy', command: 'vercel --prod' },
      ],
      [DeploymentPlatform.NETLIFY]: [
        ...commonSteps,
        { step: 4, title: 'Install Netlify CLI', command: 'npm i -g netlify-cli' },
        { step: 5, title: 'Login to Netlify', command: 'netlify login' },
        { step: 6, title: 'Deploy', command: 'netlify deploy --prod' },
      ],
      [DeploymentPlatform.DOCKER]: [
        ...commonSteps,
        { step: 4, title: 'Build Docker image', command: 'docker build -t brain-lane .' },
        { step: 5, title: 'Run container', command: 'docker run -p 3000:3000 brain-lane' },
        { step: 6, title: 'Push to registry', command: 'docker push your-registry/brain-lane' },
      ],
      [DeploymentPlatform.RAILWAY]: [
        ...commonSteps,
        { step: 4, title: 'Install Railway CLI', command: 'npm i -g @railway/cli' },
        { step: 5, title: 'Login to Railway', command: 'railway login' },
        { step: 6, title: 'Deploy', command: 'railway up' },
      ],
      [DeploymentPlatform.FLY_IO]: [
        ...commonSteps,
        { step: 4, title: 'Install Fly CLI', command: 'curl -L https://fly.io/install.sh | sh' },
        { step: 5, title: 'Login to Fly', command: 'flyctl auth login' },
        { step: 6, title: 'Launch app', command: 'flyctl launch' },
        { step: 7, title: 'Deploy', command: 'flyctl deploy' },
      ],
    };

    return platformSteps[platform] || commonSteps;
  }

  _collectEnvVars(files) {
    const envVars = new Set();

    for (const file of files) {
      if (!file.content) continue;

      // Match process.env.XXX or import.meta.env.XXX
      const envMatches = file.content.matchAll(/(?:process\.env|import\.meta\.env)\.([A-Z_][A-Z0-9_]*)/g);
      for (const match of envMatches) {
        envVars.add(match[1]);
      }
    }

    return Array.from(envVars).map(name => ({
      name,
      required: true,
      description: this._inferEnvDescription(name),
    }));
  }

  _inferEnvDescription(name) {
    const descriptions = {
      'DATABASE_URL': 'PostgreSQL connection string',
      'SUPABASE_URL': 'Supabase project URL',
      'SUPABASE_ANON_KEY': 'Supabase anonymous key',
      'OPENAI_API_KEY': 'OpenAI API key for AI features',
      'STRIPE_SECRET_KEY': 'Stripe secret key for billing',
      'NODE_ENV': 'Environment (development/production)',
    };
    return descriptions[name] || `Value for ${name}`;
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  _getBuildCommand() {
    const { framework } = this.detectedStack || {};
    switch (framework) {
      case 'nextjs': return 'npm run build';
      case 'vite': return 'npm run build';
      case 'nuxt': return 'npm run build';
      default: return 'npm run build';
    }
  }

  _getOutputDirectory() {
    const { framework } = this.detectedStack || {};
    switch (framework) {
      case 'nextjs': return '.next';
      case 'vite': return 'dist';
      case 'nuxt': return '.output';
      case 'react': return 'build';
      default: return 'dist';
    }
  }

  _toYaml(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}  - ${this._toYaml(item, indent + 2).trim().replace(/\n/g, `\n${spaces}    `)}\n`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += this._toYaml(value, indent + 1);
      } else if (typeof value === 'string' && value.includes('\n')) {
        yaml += `${spaces}${key}: |\n`;
        yaml += value.split('\n').map(line => `${spaces}  ${line}`).join('\n') + '\n';
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const deploymentGenerator = new DeploymentGenerator();
export default deploymentGenerator;
