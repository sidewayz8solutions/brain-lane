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

    // Respect client-provided parameters; only add streaming to keep the connection alive
    // Do NOT override the model – client uses gpt-4o for structured JSON
    const optimizedBody = {
      ...body,
      stream: true,
      // Preserve max_tokens/temperature if provided; otherwise set safe defaults
      max_tokens: body.max_tokens ?? 4000,
      temperature: body.temperature ?? 0.3,
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
    let role = 'assistant';

    // Pump upstream quickly to avoid idle timeout; assemble content concurrently
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
            // Capture role if present in early deltas
            if (parsed.choices?.[0]?.delta?.role) {
              role = parsed.choices[0].delta.role;
            }
            const contentDelta = parsed.choices?.[0]?.delta?.content || '';
            fullContent += contentDelta;
            
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

    // If client requested a JSON object, attempt to repair/parse server-side and
    // ensure the content is a valid JSON string to avoid client-side parse errors.
    const tryParse = (text) => {
      try { return JSON.parse(text); } catch { return null; }
    };
    const repairJson = (text) => {
      if (!text) return null;
      let t = text.replace(/[\u0000-\u001F\u007F]/g, '');
      t = t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
      const firstBrace = t.indexOf('{');
      const lastBrace = t.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        t = t.slice(firstBrace, lastBrace + 1);
      }
      t = t.replace(/,\s*([}\]])/g, '$1');
      const openCount = (t.match(/\{/g) || []).length;
      const closeCount = (t.match(/\}/g) || []).length;
      if (closeCount < openCount) t += '}';
      return tryParse(t);
    };

    if (optimizedBody.response_format && optimizedBody.response_format.type === 'json_object') {
      const parsed = tryParse(fullContent) || repairJson(fullContent);
      if (parsed) {
        fullContent = JSON.stringify(parsed);
      }
    }

    // Return the complete response in OpenAI format – matching client expectations
    const result = {
      id: `bl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: optimizedBody.model || 'gpt-4o',
      choices: [{
        index: 0,
        message: {
          role,
          content: fullContent,
        },
        finish_reason: 'stop',
      }],
      usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
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
