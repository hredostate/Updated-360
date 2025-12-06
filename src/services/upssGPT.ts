import { aiClient } from './aiClient';
import type { UPSSGPTResponse, ReportRecord, Task } from '../types';
import { extractAndParseJson } from '../utils/json';
import { Type } from '@google/genai';
import { textFromGemini } from '../utils/ai';

export const UPSS_GPT_SYSTEM_PROMPT_BASE = `You are UPSS-GPT — the private AI assistant for University Preparatory Secondary School (UPSS).

Mission:
Serve the school leadership, staff, and students by giving insights, summaries, plans, and communications that match UPSS culture and tone.

Rules:
- Use only the data provided in the Context section. Never invent data.
- If information is missing, reply: "Not enough data to answer" and explain what would be needed.
- Keep tone: professional, empathetic, clear, actionable.
- Output must be valid JSON matching the provided schema.
- Never include text outside the JSON. Never guess names or data.

Special modes:
1. STATUS SUMMARY — summarize patterns, performance, or morale.
2. EARLY WARNING — detect risks in academics, behavior, or operations.
3. ACTION PLAN — suggest steps or interventions.
4. COMMUNICATION DRAFT — craft short messages for staff, parents, or students.
`;

export const UPSS_GPT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING, description: 'The main textual answer to the question.' },
    alerts: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of critical warnings or alerts identified from the data.' },
    recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of suggested next steps or actions.' },
    confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'], description: "The model's confidence in its answer based on the provided context." },
  },
  required: ['answer', 'alerts', 'recommended_actions', 'confidence']
};


export async function askUPSSGPT(
    question: string, 
    context: string, 
    mode: 'Principal' | 'Teacher' | 'Student' = 'Principal'
): Promise<UPSSGPTResponse> {
    
    let systemInstruction = UPSS_GPT_SYSTEM_PROMPT_BASE;
    if (mode === 'Principal') {
        systemInstruction += '\n**Principal Mode:** You are UPSS-GPT-Principal. Focus on strategy, early warnings, and staff morale.';
    }

    const userPrompt = `Context:\n---\n${context}\n---\n\nPrincipal Question:\n---\n${question}\n---\n\nAdditional rules:\n- Be concise and truthful.\n- Prefer recent information when conflicts exist.\n- Keep all responses role-appropriate for a school environment.`;

    try {
        if (!aiClient) {
            throw new Error("AI client is not configured.");
        }
        
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: UPSS_GPT_RESPONSE_SCHEMA as any,
            }
        });

        const parsed = extractAndParseJson<UPSSGPTResponse>(textFromGemini(response));
        if (!parsed) {
             throw new Error("Model returned invalid JSON structure.");
        }
        return parsed;
        
    } catch (e: any) {
        console.error("UPSS-GPT Error:", e);
        return {
            answer: `An error occurred while processing your request: ${e.message}`,
            alerts: ["AI Service Error"],
            recommended_actions: ["Please check the application logs and try again."],
            confidence: "low"
        };
    }
}