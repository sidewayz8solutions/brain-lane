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

    // Use streaming with include_usage to get token counts
    const optimizedBody = {
      ...body,
      stream: true,
      stream_options: { include_usage: true }, // Required to get usage in streaming mode
      max_tokens: body.max_tokens ?? 4000,
      temperature: body.temperature ?? 0.2,
    };

    // Heartbeat streaming: send whitespace chunks periodically to keep connection alive
    const stream = new ReadableStream({
      async start(controller) {
        const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(optimizedBody),
        });

        if (!upstream.ok) {
          const errorData = await upstream.json().catch(() => ({}));
          const errPayload = {
            error: errorData.error?.message || `OpenAI API error: ${upstream.status}`,
            code: errorData.error?.code || upstream.status
          };
          controller.enqueue(new TextEncoder().encode(JSON.stringify(errPayload)));
          controller.close();
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        let fullContent = '';
        let usage = null;
        let role = 'assistant';
        let finishReason = 'stop';

        // Heartbeat every 2500ms to keep connection alive
        const heartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode(' ')); } catch {}
        }, 2500);

        try {
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
                  if (parsed.choices?.[0]?.delta?.role) {
                    role = parsed.choices[0].delta.role;
                  }
                  const contentDelta = parsed.choices?.[0]?.delta?.content || '';
                  fullContent += contentDelta;
                  // Capture finish_reason when present
                  if (parsed.choices?.[0]?.finish_reason) {
                    finishReason = parsed.choices[0].finish_reason;
                  }
                  // Usage is sent in the final chunk when stream_options.include_usage is true
                  if (parsed.usage) {
                    usage = parsed.usage;
                  }
                } catch {}
              }
            }
          }
        } finally {
          clearInterval(heartbeat);
        }

        // Clean up JSON content - extract valid JSON from response
        let cleanedContent = fullContent;
        const extractJson = (text) => {
          if (!text) return null;
          // Remove code fences and "json" prefix
          let t = text.replace(/```json|```/g, '').trim();
          t = t.replace(/^json\s*/i, '').trim();
          // Remove control characters and normalize quotes
          t = t.replace(/[\u0000-\u001F\u007F]/g, '');
          t = t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
          // Extract JSON object
          const first = t.indexOf('{');
          const last = t.lastIndexOf('}');
          if (first !== -1 && last !== -1 && last > first) {
            return t.slice(first, last + 1);
          }
          return t;
        };

        // If JSON response was requested, clean and validate it
        if (optimizedBody.response_format) {
          const extracted = extractJson(fullContent);
          try {
            const parsed = JSON.parse(extracted);
            cleanedContent = JSON.stringify(parsed);
          } catch {
            // Keep original if parsing fails - client will handle
            cleanedContent = extracted || fullContent;
          }
        }

        const result = {
          id: `bl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: optimizedBody.model || 'gpt-4o',
          choices: [{
            index: 0,
            message: { role, content: cleanedContent },
            finish_reason: finishReason
          }],
          usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };

        controller.enqueue(encoder.encode(JSON.stringify(result)));
        controller.close();
      }
    });

    return new Response(stream, {
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
