// AI Service - Brain Lane's AI integration layer
// This can be connected to OpenAI, Anthropic, or any LLM API

const AI_CONFIG = {
  // For demo mode, we'll use mock responses
  // In production, set VITE_OPENAI_API_KEY in .env
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || null,
  model: 'gpt-4-turbo-preview',
  demoMode: !import.meta.env.VITE_OPENAI_API_KEY,
};

// Mock responses for demo mode
const getMockResponse = (prompt, context) => {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('review')) {
    return {
      analysis: 'Code structure looks well-organized. Found a few areas for improvement.',
      suggestions: [
        'Consider adding error handling to async functions',
        'Add TypeScript types for better maintainability', 
        'Implement unit tests for core functionality'
      ],
      score: 78
    };
  }
  
  if (lowerPrompt.includes('task') || lowerPrompt.includes('plan')) {
    return {
      tasks: [
        { title: 'Add input validation', priority: 'high', effort: '2h' },
        { title: 'Implement error boundaries', priority: 'medium', effort: '1h' },
        { title: 'Add loading states', priority: 'low', effort: '30m' }
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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: response_json_schema ? { type: 'json_object' } : undefined,
      }),
    });
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    return response_json_schema ? JSON.parse(content) : content;
  } catch (error) {
    console.error('AI Service Error:', error);
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

