// AI Service - Brain Lane's AI integration layer
// This can be connected to OpenAI, Anthropic, or any LLM API

const AI_CONFIG = {
  // For demo mode, we'll use mock responses
  // In production, set VITE_OPENAI_API_KEY in .env
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || null,
  model: 'gpt-4o-mini', // Faster first token; good for JSON with post-processing
  demoMode: !import.meta.env.VITE_OPENAI_API_KEY,
};

// Log mode on startup
console.log('🧠 Brain Lane AI Mode:', AI_CONFIG.demoMode ? 'DEMO (mock data)' : 'LIVE (OpenAI API)');
if (!AI_CONFIG.demoMode) {
  console.log('🔑 API Key loaded:', AI_CONFIG.apiKey?.slice(0, 20) + '...');
}

// Resilient fetch with timeout & exponential backoff for transient network errors
const safeFetch = async (url, options = {}, {
  retries = 3,
  baseDelayMs = 750,
  timeoutMs = 30000,
} = {}) => {
  const transientMessages = [
    'Failed to fetch', // generic network failure
    'ERR_NETWORK_CHANGED', // Chrome network changed
    'NetworkError when attempting to fetch resource',
    'TypeError: NetworkError',
  ];

  for (let attempt = 0; attempt <= retries; attempt++) {
    // If offline, wait briefly then retry
    if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
      console.warn('📡 Offline detected. Waiting for network before retrying...');
      await new Promise(res => setTimeout(res, baseDelayMs * (attempt + 1)));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return resp;
    } catch (err) {
      clearTimeout(timer);
      const msg = err?.message || '';
      const isTransient = transientMessages.some(t => msg.includes(t)) || err?.name === 'AbortError';
      const canRetry = attempt < retries && isTransient;
      console.warn(`⚠️ Fetch error on attempt ${attempt + 1}/${retries + 1}: ${msg}`);
      if (!canRetry) {
        throw err;
      }
      const backoff = baseDelayMs * Math.pow(2, attempt);
      await new Promise(res => setTimeout(res, backoff));
    }
  }
  // Should not reach here
  throw new Error('safeFetch exhausted without response');
};

// Mock responses for demo mode - returns properly structured data for ProjectAnalysis
const getMockResponse = (prompt, context) => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Full analysis response for code review
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('review') || lowerPrompt.includes('senior full-stack')) {
    return {
      summary: 'This is a well-structured project with modern patterns. The codebase demonstrates good separation of concerns and follows established conventions. There are opportunities for improvement in error handling, test coverage, and security hardening.',
      detected_stack: {
        framework: 'React',
        language: 'JavaScript/TypeScript',
        package_manager: 'npm',
        testing_framework: 'Jest/Vitest',
        database: 'None detected',
        additional: ['Tailwind CSS', 'Vite', 'React Router']
      },
      architecture: {
        pattern: 'Component-based SPA with feature modules',
        components: [
          { name: 'UI Components', responsibility: 'Reusable UI elements', files: ['src/components/ui/'] },
          { name: 'Pages', responsibility: 'Route-level views', files: ['src/pages/'] },
          { name: 'Services', responsibility: 'API and business logic', files: ['src/services/'] },
          { name: 'Store', responsibility: 'State management', files: ['src/store/'] }
        ],
        external_dependencies: ['React', 'Framer Motion', 'Tailwind CSS', 'Zustand'],
        data_flow: 'Unidirectional data flow with centralized state management via Zustand stores'
      },
      security_vulnerabilities: [
        { cwe_id: 'CWE-522', title: 'Insufficiently Protected Credentials', severity: 'medium', file: 'src/services/aiService.js', line: 7, description: 'API key stored in environment variable but not validated for presence', recommendation: 'Add validation and fallback handling for missing API keys' },
        { cwe_id: 'CWE-79', title: 'Cross-site Scripting (XSS)', severity: 'low', file: 'src/components/', line: 0, description: 'Ensure user inputs are properly sanitized before rendering', recommendation: 'Use React\'s built-in XSS protection and validate any dangerouslySetInnerHTML usage' }
      ],
      code_smells: [
        { type: 'Missing Error Boundaries', severity: 'medium', file: 'src/App.jsx', description: 'No error boundaries to catch rendering errors', suggestion: 'Add React Error Boundaries to prevent full app crashes' },
        { type: 'Large Component', severity: 'low', file: 'src/pages/ProjectAnalysis.jsx', description: 'Component has many responsibilities', suggestion: 'Consider splitting into smaller, focused components' },
        { type: 'Missing Loading States', severity: 'low', file: 'src/pages/', description: 'Some async operations lack loading indicators', suggestion: 'Add skeleton loaders or spinners for better UX' }
      ],
      test_suggestions: [
        { target_file: 'src/store/projectStore.js', function_name: 'createProject', test_type: 'unit', description: 'Test project creation with various inputs', test_cases: ['Should create project with valid data', 'Should generate unique IDs', 'Should set default values'] },
        { target_file: 'src/services/fileService.js', function_name: 'ExtractZipContents', test_type: 'unit', description: 'Test ZIP extraction functionality', test_cases: ['Should extract valid ZIP files', 'Should handle corrupted files', 'Should filter out system files'] },
        { target_file: 'src/components/upload/FileUploader.jsx', function_name: 'handleUpload', test_type: 'integration', description: 'Test full upload flow', test_cases: ['Should upload and navigate on success', 'Should show error on invalid file', 'Should respect size limits'] }
      ],
      issues: [
        { type: 'TODO', severity: 'low', file: 'src/services/aiService.js', line: 5, description: 'API integration pending - currently using mock data' },
        { type: 'Improvement', severity: 'medium', file: 'src/pages/Home.jsx', line: 50, description: 'Error handling could be more robust with user feedback' },
        { type: 'Missing Feature', severity: 'low', file: 'src/components/', line: 0, description: 'No offline support or service worker' }
      ],
      tasks: [
        { title: 'Add Error Boundaries', description: 'Implement React Error Boundaries to gracefully handle component crashes', category: 'feature', priority: 'high', estimated_effort: 'small', files_affected: ['src/App.jsx', 'src/pages/'] },
        { title: 'Implement API Key Validation', description: 'Add proper validation and error messages for missing API configuration', category: 'security', priority: 'high', estimated_effort: 'small', files_affected: ['src/services/aiService.js'] },
        { title: 'Add Loading Skeletons', description: 'Replace loading spinners with skeleton loaders for better perceived performance', category: 'feature', priority: 'medium', estimated_effort: 'medium', files_affected: ['src/pages/ProjectAnalysis.jsx', 'src/components/'] },
        { title: 'Write Unit Tests for Store', description: 'Add comprehensive tests for Zustand store actions', category: 'test', priority: 'medium', estimated_effort: 'medium', files_affected: ['src/store/projectStore.js'] },
        { title: 'Add TypeScript Types', description: 'Convert JavaScript files to TypeScript for better type safety', category: 'refactor', priority: 'low', estimated_effort: 'large', files_affected: ['src/'] },
        { title: 'Document API Integration', description: 'Add documentation for setting up OpenAI API integration', category: 'documentation', priority: 'low', estimated_effort: 'small', files_affected: ['README.md'] },
        { title: 'Implement GitHub URL Import', description: 'Complete the GitHub repository cloning and analysis feature', category: 'feature', priority: 'medium', estimated_effort: 'large', files_affected: ['src/services/', 'src/pages/Home.jsx'] },
        { title: 'Add Input Sanitization', description: 'Ensure all user inputs are properly validated and sanitized', category: 'security', priority: 'high', estimated_effort: 'small', files_affected: ['src/components/upload/FileUploader.jsx'] }
      ]
    };
  }
  
  if (lowerPrompt.includes('task') || lowerPrompt.includes('plan')) {
    return {
      tasks: [
        { title: 'Add input validation', priority: 'high', estimated_effort: 'small', category: 'security', description: 'Validate all user inputs', files_affected: [] },
        { title: 'Implement error boundaries', priority: 'medium', estimated_effort: 'small', category: 'feature', description: 'Add React error boundaries', files_affected: [] },
        { title: 'Add loading states', priority: 'low', estimated_effort: 'small', category: 'feature', description: 'Improve UX with loading indicators', files_affected: [] }
      ]
    };
  }
  
  return {
    response: 'Analysis complete. The codebase shows good patterns with room for optimization.',
    confidence: 0.85
  };
};

export const InvokeLLM = async ({ prompt, response_json_schema, add_context_from_internet }) => {
  console.log('🧠 InvokeLLM called, demoMode:', AI_CONFIG.demoMode);
  
  if (AI_CONFIG.demoMode) {
    console.log('⚠️ Running in DEMO mode - no API key configured');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    return getMockResponse(prompt, { add_context_from_internet });
  }

  // Real API call to OpenAI
  try {
    console.log('🚀 Making real OpenAI API call...');
    console.log('📦 Prompt length:', prompt.length, 'chars');

    // Build response_format based on whether we have a schema
    let responseFormat = undefined;
    if (response_json_schema) {
      // Use strict JSON schema to guarantee valid JSON output
      responseFormat = {
        type: 'json_schema',
        json_schema: {
          name: 'analysis_response',
          strict: true,
          schema: response_json_schema
        }
      };
    }

    const requestBody = {
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: 'You are a senior software architect. Return ONLY valid JSON matching the provided schema. Analyze the actual code provided - do not use placeholder data. Be specific about files and issues.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: responseFormat,
      max_tokens: 4000,
      temperature: 0, // Zero temperature for deterministic structured output
    };
    
    // Use proxy endpoint when deployed (avoids CORS), direct API when local
    // Always use proxy to ensure consistent streaming/repair and avoid CORS/timeouts
    const apiUrl = '/api/openai';
    
    const headers = { 'Content-Type': 'application/json' };
    
    const response = await safeFetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    }, { retries: 3, baseDelayMs: 1000, timeoutMs: 60000 });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenAI API Error:', response.status, errorData);
      
      // Don't silently fall back to mock - throw the error so user knows
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
      throw new Error(`OpenAI API Error: ${errorMsg}`);
    }
    
    // The streaming proxy may include whitespace heartbeats - trim and parse
    const rawText = await response.text();
    const trimmedText = rawText.trim();

    let data;
    try {
      data = JSON.parse(trimmedText);
    } catch (parseErr) {
      console.error('❌ Failed to parse API response:', trimmedText.slice(0, 200));
      throw new Error('Invalid response from API - failed to parse JSON');
    }

    console.log('✅ OpenAI API Response received');
    console.log('📊 Usage:', data.usage);

    // Check if the response is an error from the proxy
    if (data.error) {
      console.error('❌ API returned error:', data.error);
      throw new Error(data.error);
    }

    // Ensure choices array exists
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('❌ Invalid API response - no choices array:', data);
      throw new Error('Invalid API response - no choices returned');
    }

    const content = data.choices[0]?.message?.content;
    console.log('📝 Response content length:', content?.length || 0);

    // Check if response was cut off
    if (data.choices[0]?.finish_reason === 'length') {
      console.warn('⚠️ Response was truncated due to max_tokens limit');
    }
    
    if (response_json_schema) {
      const tryParse = (text) => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      };

      const repairJson = (text) => {
        if (!text) return null;
        // Remove non-printable/control characters
        let t = text.replace(/[\u0000-\u001F\u007F]/g, '');
        // Normalize smart quotes
        t = t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
        // Trim any leading text before first '{' and trailing after last '}'
        const firstBrace = t.indexOf('{');
        const lastBrace = t.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          t = t.slice(firstBrace, lastBrace + 1);
        }
        // Remove trailing commas before closing braces/brackets
        t = t.replace(/,\s*([}\]])/g, '$1');
        // Balance all braces and brackets (handles truncated JSON)
        const openBraces = (t.match(/\{/g) || []).length;
        const closeBraces = (t.match(/\}/g) || []).length;
        const openBrackets = (t.match(/\[/g) || []).length;
        const closeBrackets = (t.match(/\]/g) || []).length;
        // Close any unclosed arrays first, then objects
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          t += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          t += '}';
        }
        // Try to fix truncated strings (missing closing quote)
        const result = tryParse(t);
        if (result) return result;
        // If still failing, try adding a closing quote before the brackets/braces we added
        if (openBraces > closeBraces || openBrackets > closeBrackets) {
          const closers = t.slice(-(openBraces - closeBraces + openBrackets - closeBrackets));
          const base = t.slice(0, t.length - closers.length);
          // Check for unterminated string
          const quoteCount = (base.match(/(?<!\\)"/g) || []).length;
          if (quoteCount % 2 !== 0) {
            return tryParse(base + '"' + closers);
          }
        }
        return null;
      };

      // If server already repaired content (json string), parsing should succeed
      const parsed = tryParse(content) || repairJson(content);
      if (parsed) {
        console.log('✅ JSON parsed successfully (with repair if needed)');
        // Log task count for debugging
        if (parsed.tasks) {
          console.log('📋 Tasks in response:', parsed.tasks.length);
        }
        return parsed;
      }
      // Final fallback: provide minimal structured object to avoid UI crash
      console.warn('⚠️ Using fallback structured response due to parse failure');
      console.warn('📄 Raw content preview:', content?.slice(0, 500));
      return {
        summary: 'Analysis encountered formatting issues. Partial results may be unavailable.',
        detected_stack: { framework: '', language: '', package_manager: '', testing_framework: '', database: '', additional: [] },
        architecture: { pattern: '', components: [], external_dependencies: [], data_flow: '' },
        security_vulnerabilities: [],
        code_smells: [],
        issues: [],
        test_suggestions: [],
        tasks: []
      };
    }
    
    return content;
  } catch (error) {
    console.error('❌ AI Service Error:', error.message);
    // Provide clearer guidance for common errors
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_NETWORK_CHANGED')) {
      throw new Error('Network error while contacting OpenAI. Please check your connection and try again.');
    }
    if (error?.message?.includes('504') || error?.message?.includes('TIMEOUT') || error?.message?.includes('timed out')) {
      throw new Error('Analysis timed out. Try uploading a smaller project or fewer files. Large projects may need to be analyzed in parts.');
    }
    if (error?.message?.includes('429')) {
      throw new Error('OpenAI rate limit reached. Please wait a moment and try again.');
    }
    // Re-throw the error so the calling code can handle it appropriately
    throw error;
  }
};

export const GenerateImage = async ({ prompt }) => {
  if (AI_CONFIG.demoMode) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Return a placeholder image
    return { 
      image_url: `https://placehold.co/600x400/1e293b/06b6d4?text=${encodeURIComponent(prompt.slice(0, 20))}` 
    };
  }
  
  // Real DALL-E API call would go here
  return { image_url: null };
};

export const AnalyzeCode = async (code, language = 'javascript') => {
  return InvokeLLM({
    prompt: `Analyze this ${language} code and provide feedback:\n\n${code}`,
    response_json_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['quality_score', 'issues', 'suggestions'],
      properties: {
        quality_score: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'array', items: { type: 'string' } }
      }
    }
  });
};

export const GenerateTasks = async (projectAnalysis) => {
  return InvokeLLM({
    prompt: `You are a senior tech lead. Based on this project analysis, generate a concrete implementation task plan.\n\nGenerate 15-25 specific, actionable tasks covering:\n- Security fixes (highest priority)\n- Bug fixes\n- Refactoring improvements\n- Test coverage\n- Infrastructure/DevOps\n- Documentation\n\nPROJECT ANALYSIS:\n${JSON.stringify(projectAnalysis)}`,
    response_json_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['tasks'],
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'description', 'category', 'priority'],
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              category: {
                type: 'string',
                enum: ['feature', 'bugfix', 'refactor', 'test', 'documentation', 'security', 'infra'],
              },
              type: {
                type: 'string',
                enum: ['refactor', 'test', 'bugfix', 'feature', 'infra'],
              },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              estimated_effort: { type: 'string', enum: ['small', 'medium', 'large'] },
              files_affected: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  });
};

