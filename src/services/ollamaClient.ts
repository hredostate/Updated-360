/**
 * Ollama Client Service
 * Provides local AI capabilities using Ollama
 * No API key required - just needs Ollama running locally
 * 
 * Note: Global state pattern mirrors the existing OpenRouter client implementation
 * for consistency and compatibility with the existing codebase.
 */

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaListResponse {
  models: OllamaModel[];
}

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

// OpenAI-compatible types for compatibility
interface OpenAICompatibleMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAICompatibleChatRequest {
  model: string;
  messages: OpenAICompatibleMessage[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: 'json_object' };
}

interface OpenAICompatibleChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
  index: number;
}

interface OpenAICompatibleChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAICompatibleChoice[];
}

let ollamaUrl: string = 'http://localhost:11434';
let currentModel: string = 'llama3';
let ollamaError: string | null = null;

/**
 * Initialize the Ollama client with a custom URL
 */
export function initializeOllamaClient(url?: string, model?: string): void {
  if (url) {
    ollamaUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }
  if (model) {
    currentModel = model;
  }
  ollamaError = null;
  console.log('[Ollama] Initialized with URL:', ollamaUrl, 'Model:', currentModel);
}

/**
 * Get the current Ollama configuration
 */
export function getOllamaConfig(): { url: string; model: string } {
  return { url: ollamaUrl, model: currentModel };
}

/**
 * Get the last Ollama error
 */
export function getOllamaError(): string | null {
  return ollamaError;
}

/**
 * Test connection to Ollama server
 */
export async function testOllamaConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OllamaListResponse = await response.json();
    
    if (!data.models || data.models.length === 0) {
      return {
        success: true,
        message: 'Connected to Ollama, but no models are installed. Please pull a model first.',
      };
    }

    ollamaError = null;
    return {
      success: true,
      message: `✓ Connected! Found ${data.models.length} model(s): ${data.models.map(m => m.name).join(', ')}`,
    };
  } catch (error: any) {
    ollamaError = error.message;
    return {
      success: false,
      message: `Connection failed: ${error.message}. Make sure Ollama is running on ${ollamaUrl}`,
    };
  }
}

/**
 * Fetch available models from Ollama
 */
export async function fetchOllamaModels(): Promise<OllamaModel[]> {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data: OllamaListResponse = await response.json();
    return data.models || [];
  } catch (error: any) {
    console.error('[Ollama] Error fetching models:', error);
    ollamaError = error.message;
    throw error;
  }
}

/**
 * Send a chat completion request to Ollama
 * Compatible with OpenAI SDK format
 */
export async function createChatCompletion(
  request: OpenAICompatibleChatRequest
): Promise<OpenAICompatibleChatResponse> {
  try {
    const ollamaRequest: OllamaChatRequest = {
      model: request.model || currentModel,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: false,
      options: {
        temperature: request.temperature,
        num_predict: request.max_tokens,
      },
    };

    // If JSON response is requested, add a system message for better compliance
    if (request.response_format?.type === 'json_object') {
      // Prepend a system message for JSON formatting
      ollamaRequest.messages = [
        {
          role: 'system',
          content: 'You are a helpful assistant. Always respond with valid JSON only, no additional text or formatting.',
        },
        ...ollamaRequest.messages,
      ];
    }

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaRequest),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data: OllamaChatResponse = await response.json();

    // Convert Ollama response to OpenAI-compatible format
    const openAIResponse: OpenAICompatibleChatResponse = {
      id: `ollama-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: data.model,
      choices: [
        {
          message: {
            role: data.message.role,
            content: data.message.content,
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
    };

    ollamaError = null;
    return openAIResponse;
  } catch (error: any) {
    console.error('[Ollama] Chat completion error:', error);
    ollamaError = error.message;
    throw error;
  }
}

/**
 * Create an OpenAI-compatible client object for Ollama
 * This allows existing code to work with minimal changes
 */
export function getOllamaClient() {
  return {
    chat: {
      completions: {
        create: createChatCompletion,
      },
    },
  };
}

/**
 * Generate text using Ollama's generate endpoint (simpler API)
 */
export async function generateText(prompt: string, model?: string): Promise<string> {
  try {
    const request: OllamaGenerateRequest = {
      model: model || currentModel,
      prompt,
      stream: false,
    };

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data: OllamaGenerateResponse = await response.json();
    ollamaError = null;
    return data.response;
  } catch (error: any) {
    console.error('[Ollama] Generate text error:', error);
    ollamaError = error.message;
    throw error;
  }
}
