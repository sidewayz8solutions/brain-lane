// Vercel Edge Function to proxy OpenAI requests with streaming support
export const config = {
  runtime: 'edge',
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
    
    // Force streaming to avoid timeout - stream keeps connection alive
    const optimizedBody = {
      ...body,
      // Use gpt-3.5-turbo for much faster responses
      model: 'gpt-3.5-turbo-16k',
      // Enable streaming to keep connection alive and avoid timeout
      stream: true,
      // Limit tokens for faster response
      max_tokens: body.max_tokens || 3000,
      temperature: body.temperature ?? 0.5,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(optimizedBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({ 
        error: errorData.error?.message || `OpenAI API error: ${response.status}`,
        code: errorData.error?.code || response.status
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Collect streamed response and return as complete JSON
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let usage = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            fullContent += content;
            
            // Capture usage if present (usually in last chunk)
            if (parsed.usage) {
              usage = parsed.usage;
            }
          } catch (e) {
            // Skip malformed JSON chunks
          }
        }
      }
    }

    // Return the complete response in OpenAI format
    const result = {
      choices: [{
        message: {
          role: 'assistant',
          content: fullContent
        },
        finish_reason: 'stop'
      }],
      usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error',
      code: 'STREAM_ERROR'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
