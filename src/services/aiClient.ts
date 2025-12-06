import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;
let aiClientError: string | null = null;

if (!apiKey) {
    aiClientError = "Gemini API Key not found. Please create a '.env' file and add VITE_GEMINI_API_KEY. Refer to README.md for details.";
} else {
    try {
        aiClient = new GoogleGenAI({ apiKey });
    } catch(e: any) {
        aiClientError = `Failed to initialize Google AI client: ${e.message}`;
    }
}

export { aiClient, aiClientError };