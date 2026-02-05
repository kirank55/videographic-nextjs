import { SYSTEM_PROMPT, buildUserPrompt, validateGeneratedProject } from "./prompts";
import { VideoProject } from "@/lib/schemas/timeline";

export interface GenerationResult {
  success: boolean;
  project?: VideoProject;
  error?: string;
  rawResponse?: string;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
    delta?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    code?: string;
    metadata?: unknown;
  };
}

function parseJSONWithWorker(jsonText: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // Try direct parsing for small responses (fallback for Node.js)
      if (typeof Worker === 'undefined' || jsonText.length < 10000) {
        return resolve(JSON.parse(jsonText));
      }

      const worker = new Worker(new URL('@/workers/json-parser.worker', import.meta.url));
      
      worker.postMessage(jsonText);
      
      worker.onmessage = (e) => {
        worker.terminate();
        if (e.data.success) {
          resolve(e.data.data);
        } else {
          reject(new Error(e.data.error));
        }
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
    } catch (error) {
      // Fallback to direct parsing if worker fails
      try {
        resolve(JSON.parse(jsonText));
      } catch (parseError) {
        reject(parseError);
      }
    }
  });
}

export async function generateWithOpenRouter(
  prompt: string,
  apiKey: string,
  model: string = "minimax/minimax-m2.1",
  duration: number = 5
): Promise<GenerationResult> {
  const url = "https://openrouter.ai/api/v1/chat/completions";

  try {
    console.log(`[OpenRouter] Calling model: ${model}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Videographic",
        // Required for free models - allows prompt sharing
        "X-Allow-Sharing": "true",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: buildUserPrompt(prompt, duration),
          },
        ],
        temperature: 0.7,
        max_tokens: 16000, // Increased for large videos
        // Allow training data usage for free models
        allow_training: true,
        stream: true, // Enable streaming for long responses
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      const errorMsg = (errorData as OpenRouterResponse).error?.message || `API error: ${response.status}`;
      console.error(`[OpenRouter] Error:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log(`[OpenRouter] Response status: ${response.status}`);
    
    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      return {
        success: false,
        error: "No response body from OpenRouter",
      };
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "" || line.trim() === "data: [DONE]") continue;
        if (!line.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(line.substring(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
          }
        } catch (e) {
          // Skip malformed JSON chunks
          continue;
        }
      }
    }

    const text = fullText;
    console.log(`[OpenRouter] Got streamed response of ${text.length} chars`);

    if (!text) {
      return {
        success: false,
        error: "No response generated",
      };
    }

    // Extract JSON from response (handle various markdown formats)
    let jsonText = text.trim();
    
    // Remove markdown code blocks: ```json...``` or ```...```
    if (jsonText.startsWith('```')) {
      const lines = jsonText.split('\n');
      // Remove first line (```json or ```)
      lines.shift();
      // Remove last line if it's ```
      if (lines[lines.length - 1].trim() === '```') {
        lines.pop();
      }
      jsonText = lines.join('\n').trim();
    }
    
    // Alternative: try regex match as fallback
    if (jsonText.includes('```')) {
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
    }

     try {
      // Use web worker for parsing large responses
      const parsed = await parseJSONWithWorker(jsonText);
      const project = validateGeneratedProject(parsed);

      if (!project) {
        console.error(`[OpenRouter] Invalid project structure`);
        console.error(`[OpenRouter] Raw response:`, text);
        return {
          success: false,
          error: "Invalid project structure from AI",
          rawResponse: text,
        };
      }

      return {
        success: true,
        project,
        rawResponse: text,
      };
    } catch (parseError) {
      console.error(`[OpenRouter] JSON parse error:`, parseError);
      console.error(`[OpenRouter] Attempted to parse:`, jsonText);
      console.error(`[OpenRouter] Full raw response:`, text);
      return {
        success: false,
        error: "Failed to parse AI response as JSON",
        rawResponse: text,
      };
    }
  } catch (error) {
    console.error(`[OpenRouter] Exception:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}

// MiniMax models on OpenRouter
export const OPENROUTER_MODELS = {
  "minimax-m2.1": "minimax/minimax-m2.1",
} as const;

export type OpenRouterModelKey = keyof typeof OPENROUTER_MODELS;
