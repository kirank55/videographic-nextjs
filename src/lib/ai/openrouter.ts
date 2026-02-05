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

function attemptJSONRecovery(truncatedJson: string): string {
  // Count unclosed brackets and braces to try to repair truncated JSON
  let openBraces = 0;
  let openBrackets = 0;
  let quoteCount = 0;
  let inString = false;
  
  for (let i = 0; i < truncatedJson.length; i++) {
    const char = truncatedJson[i];
    
    if (char === '"') {
      // Check if this is an escaped quote
      if (i > 0 && truncatedJson[i - 1] === '\\') {
        continue;
      }
      inString = !inString;
      quoteCount++;
    }
    
    if (!inString) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
  }
  
  // Try to repair the JSON by adding closing brackets/braces
  let repaired = truncatedJson;
  
  // Handle trailing comma issues
  repaired = repaired.trim();
  if (repaired.endsWith(',')) {
    repaired = repaired.slice(0, -1);
  }
  
  // Handle cases where we're still in a string
  if (inString || quoteCount % 2 !== 0) {
    // Find the last unescaped quote to see if we were in a string
    const lastUnescapedQuote = findLastUnescapedQuote(truncatedJson);
    if (lastUnescapedQuote !== -1) {
      // Cut off at the last unescaped quote and try to close the structure
      const partial = truncatedJson.substring(0, lastUnescapedQuote + 1);
      // Count brackets/braces in the partial string
      let tempBraces = 0, tempBrackets = 0;
      for (let i = 0; i < partial.length; i++) {
        const char = partial[i];
        if (char === '"') {
          if (i > 0 && partial[i - 1] === '\\') continue;
          inString = !inString;
        }
        if (!inString) {
          if (char === '{') tempBraces++;
          if (char === '}') tempBraces--;
          if (char === '[') tempBrackets++;
          if (char === ']') tempBrackets--;
        }
      }
      repaired = partial;
      // Check for trailing comma in the repaired partial
      if (repaired.trim().endsWith(',')) {
        repaired = repaired.slice(0, -1);
      }
      openBraces = tempBraces;
      openBrackets = tempBrackets;
    }
  }
  
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }
  
  return repaired;
}

function findLastUnescapedQuote(str: string): number {
  let lastQuote = -1;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '"' && (i === 0 || str[i - 1] !== '\\')) {
      lastQuote = i;
    }
  }
  return lastQuote;
}

function parseJSONWithWorker(jsonText: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // First, try direct parsing
      const result = JSON.parse(jsonText);
      return resolve(result);
    } catch (parseError) {
      console.error(`[OpenRouter] Initial parse failed, attempting recovery:`, parseError);
      console.error(`[OpenRouter] Original JSON snippet:`, jsonText.substring(0, 200));
      
      // Try to recover from truncated JSON
      try {
        const repaired = attemptJSONRecovery(jsonText);
        console.error(`[OpenRouter] Attempting to parse repaired JSON:`, repaired.substring(0, 200));
        const result = JSON.parse(repaired);
        console.warn(`[OpenRouter] Successfully parsed repaired JSON`);
        return resolve(result);
      } catch (recoveryError) {
        console.error(`[OpenRouter] Recovery failed:`, recoveryError);
        reject(recoveryError);
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
    
    console.log(`[OpenRouter] Raw response snippet (first 100 chars):`, jsonText.substring(0, 100));
    
    // Remove markdown code blocks: ```json...``` or ```...```
    if (jsonText.startsWith('```')) {
      const lines = jsonText.split('\n');
      // Remove first line (```json or ```)
      lines.shift();
      // Remove last line if it's ```
      if (lines[lines.length - 1] && lines[lines.length - 1].trim() === '```') {
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
    
    // Extract JSON between first { and last }
    const startIdx = jsonText.indexOf('{');
    const endIdx = jsonText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      jsonText = jsonText.substring(startIdx, endIdx + 1).trim();
    }

     try {
      // Use robust parsing with recovery
      const parsed = await parseJSONWithWorker(jsonText);
      console.log(`[OpenRouter] Parsed JSON successfully`);
      
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
      console.error(`[OpenRouter] Full raw response length:`, text.length);
      console.error(`[OpenRouter] Raw response snippet (last 200 chars):`, text.substring(text.length - 200));
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
