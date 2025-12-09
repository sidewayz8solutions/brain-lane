// Vercel Edge Function to proxy OpenAI requests (avoids CORS issues)
export const config = {
  runtime: 'edge',
  // Increase max duration for AI analysis (Vercel Pro: up to 300s, Hobby: 10s)
  maxDuration: 60,
};

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout (leave buffer for response)
    
    // Optimize request for faster responses
    const optimizedBody = {
      ...body,
      // Use faster model if not specified or if using gpt-4
      model: body.model === 'gpt-4' ? 'gpt-4-turbo-preview' : (body.model || 'gpt-3.5-turbo'),
      // Limit tokens if not specified
      max_tokens: body.max_tokens || 2000,
      // Lower temperature for faster, more deterministic responses
      temperature: body.temperature ?? 0.7,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(optimizedBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    
    // Handle OpenAI API errors
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: data.error?.message || `OpenAI API error: ${response.status}`,
        code: data.error?.code || response.status
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    // Handle timeout
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ 
        error: 'Request timed out. Try analyzing a smaller project or fewer files.',
        code: 'TIMEOUT'
      }), {
        status: 504,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
