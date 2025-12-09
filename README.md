# Brain Lane 🧠

An AI-powered code analysis and refactoring platform with multi-agent orchestration, GPU acceleration, and one-click deployments.

![Brain Lane](https://img.shields.io/badge/Brain%20Lane-AI%20Code%20Platform-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🤖 AI-Powered Code Analysis
- **Smart Code Scanning** - Automatic detection of code patterns, issues, and improvements
- **Architecture Visualization** - Interactive flowcharts of your codebase structure
- **Security Analysis** - Identify vulnerabilities and security best practices
- **Code Health Metrics** - Track technical debt and code quality over time

### 🔧 Multi-Agent System
7 specialized AI agents working together:
- **Code Auditor** 🔍 - Analyzes code for issues and patterns
- **Syntax Fixer** 🔧 - Automatically fixes syntax errors
- **Feature Completer** ✨ - Completes partial implementations
- **UI Designer** 🎨 - Suggests UI/UX improvements
- **Deployment Architect** 🏗️ - Generates deployment configurations
- **Doc Writer** 📝 - Auto-generates documentation
- **Test Writer** 🧪 - Creates unit and integration tests

### ⚡ GPU Acceleration
Support for cloud GPU providers for heavy inference:
- RunPod
- Replicate
- LM Studio (local)
- Ollama (local)

### 🚀 One-Click Deployments
Generate deployment configurations for:
- Vercel
- Docker
- Netlify
- Railway
- Fly.io

### 📊 Project Health Dashboard
- Real-time code health monitoring
- Predictive insights
- Workflow template impact analysis
- AI recommendations

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **State Management**: Zustand, TanStack Query
- **Visualization**: React Flow
- **Backend**: Supabase, Vercel Edge Functions
- **AI**: OpenAI GPT-4, Claude (Anthropic)
- **Payments**: Stripe

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/brain-lane.git
cd brain-lane
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
```

4. **Set up Supabase**

Run the SQL migrations in your Supabase dashboard:
- `setup-auth-schema.sql` - User authentication tables

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Building for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
brain-lane/
├── api/                    # Vercel Edge Functions
│   ├── auth.js            # Authentication endpoints
│   ├── openai.js          # OpenAI proxy
│   └── stripe-webhook.js  # Stripe webhook handler
├── src/
│   ├── components/        # React components
│   │   ├── agent/        # AI agent components
│   │   ├── auth/         # Authentication
│   │   ├── deployment/   # Deployment tools
│   │   ├── settings/     # Settings panels
│   │   ├── ui/           # UI primitives
│   │   └── visualization/# Charts & diagrams
│   ├── pages/            # Route pages
│   ├── services/         # Business logic
│   │   ├── aiEngine.js           # Core AI engine
│   │   ├── authService.js        # Auth service
│   │   ├── billingService.js     # Stripe billing
│   │   ├── completionEngine.js   # Code completion
│   │   ├── deploymentGenerator.js# Deploy configs
│   │   ├── flowchartEngine.js    # Visualization
│   │   ├── gpuWorker.js          # GPU acceleration
│   │   ├── jobQueue.js           # Background jobs
│   │   ├── multiAgentOrchestrator.js # Multi-agent
│   │   └── projectScanner.js     # Code scanning
│   ├── store/            # Zustand stores
│   └── utils/            # Utilities
└── public/               # Static assets
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth?action=callback` | GET | OAuth callback |
| `/api/auth?action=session` | GET | Get session |
| `/api/auth?action=logout` | POST | Sign out |
| `/api/stripe-webhook` | POST | Stripe events |

## 🎯 Usage

### Analyzing a Project

1. Navigate to **Projects** page
2. Upload your project or connect a GitHub repo
3. Click **Analyze** to start code scanning
4. View results in the **Health** dashboard

### Running Multi-Agent Tasks

1. Go to **Agents** page
2. Select agents for your task
3. Configure execution options
4. Click **Run** to start orchestration
5. View aggregated results

### Generating Deployments

1. Open **Deployment** page
2. Select your project
3. Choose target platform
4. Configure options
5. Download or copy configuration files

## 🔐 Authentication

Brain Lane supports:
- Email/Password authentication
- GitHub OAuth
- Google OAuth

Configure OAuth providers in your Supabase dashboard.

## 💳 Billing

Three subscription tiers:
- **Free** - 100 AI requests/month
- **Pro** ($29/month) - 10,000 requests/month
- **Team** ($99/month) - Unlimited requests

## 🧪 Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run typecheck
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [React Flow](https://reactflow.dev/) for diagrams
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide Icons](https://lucide.dev/) for icons

---

Built with ❤️ by the Brain Lane team