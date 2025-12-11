import OpenAI from 'openai';
import { 
  initializeOllamaClient, 
  getOllamaClient, 
  getOllamaError,
  getOllamaConfig 
} from './ollamaClient';

// AI Provider state
let currentProvider: 'openrouter' | 'ollama' = 'openrouter';
let openRouterClient: OpenAI | null = null;
let aiClientError: string | null = null;
let currentModel: string = 'openai/gpt-4o'; // Default model

/**
 * Set the AI provider to use
 */
export function setAIProvider(provider: 'openrouter' | 'ollama'): void {
  currentProvider = provider;
  console.log('[AI] Provider set to:', provider);
}

/**
 * Get the current AI provider
 */
export function getAIProvider(): 'openrouter' | 'ollama' {
  return currentProvider;
}

/**
 * Initialize OpenRouter client
 */
export function initializeAIClient(apiKey: string, model?: string): void {
  if (!apiKey) {
    aiClientError = "OpenRouter API Key not configured. Please add your API key in Settings > AI Configuration.";
    openRouterClient = null;
    return;
  }
  
  try {
    openRouterClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Required for client-side usage
      defaultHeaders: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'School 360',
      },
    });
    aiClientError = null;
    if (model) {
      currentModel = model;
    }
    console.log('[AI] OpenRouter client initialized with model:', currentModel);
  } catch (e: any) {
    aiClientError = `Failed to initialize OpenRouter client: ${e.message}`;
    openRouterClient = null;
  }
}

/**
 * Initialize Ollama client
 */
export function initializeOllamaAIClient(url?: string, model?: string): void {
  initializeOllamaClient(url, model);
  if (model) {
    currentModel = model;
  }
  console.log('[AI] Ollama client initialized');
}

/**
 * Common interface for AI clients (OpenAI and Ollama)
 */
interface AIClient {
  chat: {
    completions: {
      create: (request: any) => Promise<any>;
    };
  };
}

/**
 * Get the active AI client based on the current provider
 * Returns an AI client that implements the OpenAI-compatible interface
 */
export function getAIClient(): AIClient | null {
  if (currentProvider === 'ollama') {
    const ollamaClient = getOllamaClient();
    const error = getOllamaError();
    if (error) {
      aiClientError = error;
    }
    return ollamaClient as AIClient;
  }
  
  return openRouterClient as AIClient | null;
}

/**
 * Get any error from the AI client
 */
export function getAIClientError(): string | null {
  if (currentProvider === 'ollama') {
    return getOllamaError();
  }
  return aiClientError;
}

/**
 * Get the current model being used
 */
export function getCurrentModel(): string {
  if (currentProvider === 'ollama') {
    return getOllamaConfig().model;
  }
  return currentModel;
}

// For backward compatibility
export { openRouterClient as aiClient, aiClientError };