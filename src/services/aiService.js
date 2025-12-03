// AI Service - Brain Lane's AI integration layer
// This can be connected to OpenAI, Anthropic, or any LLM API

const AI_CONFIG = {
  // For demo mode, we'll use mock responses
  // In production, set VITE_OPENAI_API_KEY in .env
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || null,
  model: 'gpt-4o', // Better at structured JSON output
  demoMode: !import.meta.env.VITE_OPENAI_API_KEY,
};

// Log mode on startup
console.log('🧠 Brain Lane AI Mode:', AI_CONFIG.demoMode ? 'DEMO (mock data)' : 'LIVE (OpenAI API)');
if (!AI_CONFIG.demoMode) {
  console.log('🔑 API Key loaded:', AI_CONFIG.apiKey?.slice(0, 20) + '...');
}

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
  if (AI_CONFIG.demoMode) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    return getMockResponse(prompt, { add_context_from_internet });
  }

  // Real API call to OpenAI
  try {
    console.log('🚀 Making real OpenAI API call...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a senior software architect. Always respond with valid JSON. Keep responses concise but comprehensive.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: response_json_schema ? { type: 'json_object' } : undefined,
        max_tokens: 4000, // Ensure complete response
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API Error:', response.status, errorData);
      throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('✅ OpenAI API Response received');
    
    const content = data.choices[0]?.message?.content;
    console.log('📝 Response content length:', content?.length || 0);
    
    // Check if response was cut off
    if (data.choices[0]?.finish_reason === 'length') {
      console.warn('⚠️ Response was truncated, using mock data');
      return getMockResponse(prompt, {});
    }
    
    if (response_json_schema) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError.message);
        console.log('📄 Raw content:', content?.substring(0, 500));
        return getMockResponse(prompt, {});
      }
    }
    
    return content;
  } catch (error) {
    console.error('❌ AI Service Error:', error);
    console.log('⚠️ Falling back to mock data...');
    return getMockResponse(prompt, {});
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
      properties: {
        quality_score: { type: 'number' },
        issues: { type: 'array' },
        suggestions: { type: 'array' }
      }
    }
  });
};

export const GenerateTasks = async (projectAnalysis) => {
  return InvokeLLM({
    prompt: `Based on this project analysis, generate implementation tasks:\n\n${JSON.stringify(projectAnalysis)}`,
    response_json_schema: {
      type: 'object', 
      properties: {
        tasks: { type: 'array' }
      }
    }
  });
};

