

import React, { useState, useEffect } from 'react';
import { aiClient } from '../services/aiClient';
import type { ReportRecord, UserProfile } from '../types';
import Spinner from './common/Spinner';
import { WandIcon } from './common/icons';
import { textFromGemini } from '../utils/ai';
// FIX: Changed import path for PRINCIPAL_PERSONA_PROMPT from ../App to ../constants
import { PRINCIPAL_PERSONA_PROMPT } from '../constants';

interface AIResponseModalProps {
  report: ReportRecord | null;
  onClose: () => void;
  onSave: (reportId: number, responseText: string) => Promise<boolean>;
  users: UserProfile[];
}

const AIResponseModal: React.FC<AIResponseModalProps> = ({ report, onClose, onSave, users }) => {
    const [suggestion, setSuggestion] = useState('');
    const [editedResponse, setEditedResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (report) {
            setSuggestion('');
            setEditedResponse(report.response || '');
        }
    }, [report]);

    const getAudienceContext = (report: ReportRecord): string => {
        if (report.involved_students && report.involved_students.length > 0) {
            return "You are speaking to a teacher about a student matter. Your tone should align with the 'When Talking to Students' section, but framed as guidance for the teacher dealing with them.";
        }
        if (report.involved_staff && report.involved_staff.length > 0) {
            return "You are responding to a report concerning a staff member. Your tone should align with the 'When Talking to Teachers' section.";
        }
        if (['Maintenance Request', 'Supply Requisition'].includes(report.report_type)) {
            return "You are responding to a logistical request from the general workforce. Your tone should be respectful and empowering, aligning with the 'When Talking to the General Workforce' section.";
        }
        return "You are responding directly to a teacher about their report (e.g., a daily check-in). Your tone should align with the 'When Talking to Teachers' section.";
    }

    const handleGenerateSuggestion = async () => {
        if (!report || isLoading) return;
        setIsLoading(true);
        setSuggestion('');
        setEditedResponse('');

        try {
            if (!aiClient) throw new Error("AI client not available.");
            
            const audienceContext = getAudienceContext(report);
            const prompt = `
                A report has been submitted by ${report.author?.name} (${report.author?.role}).
                
                Report Details:
                - Type: ${report.report_type}
                - Content: "${report.report_text}"
                
                Task:
                Based on your persona and the provided context, draft a response to the author of the report, ${report.author?.name}.
                Your response should acknowledge the report and provide guidance, feedback, or a decision.
                
                ${audienceContext}
                
                Draft your response now.
            `;

            const response = await aiClient.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: { systemInstruction: PRINCIPAL_PERSONA_PROMPT }
            });

            const generatedText = textFromGemini(response);
            setSuggestion(generatedText);
            setEditedResponse(generatedText);
        } catch (e) {
            console.error("AI suggestion error:", e);
            setEditedResponse("Sorry, I couldn't generate a suggestion at this time.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!report || !editedResponse.trim()) return;
        setIsSaving(true);
        const success = await onSave(report.id, editedResponse);
        if (success) {
            onClose();
        }
        setIsSaving(false);
    };

    if (!report) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Respond to Report #{report.id}</h2>
                <div className="my-4 p-3 bg-slate-500/10 rounded-lg border border-slate-200/60 dark:border-slate-700/60 max-h-40 overflow-y-auto">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">From {report.author?.name}:</span> "{report.report_text}"
                    </p>
                </div>
                
                <div className="flex-grow flex flex-col">
                    <label htmlFor="response-text" className="text-sm font-medium">Your Response</label>
                    <textarea
                        id="response-text"
                        value={editedResponse}
                        onChange={(e) => setEditedResponse(e.target.value)}
                        rows={10}
                        placeholder="Write your response here, or generate an AI suggestion."
                        className="w-full mt-1 p-2 border rounded-md flex-grow bg-white/50 dark:bg-slate-900/50"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                        onClick={handleGenerateSuggestion}
                        disabled={isLoading || isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-500/30 disabled:opacity-50"
                    >
                        {isLoading ? <Spinner size="sm" /> : <WandIcon className="w-5 h-5" />}
                        <span>{isLoading ? 'Generating...' : 'Generate AI Suggestion'}</span>
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 rounded-md">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving || !editedResponse.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center min-w-[120px] justify-center">
                            {isSaving ? <Spinner size="sm" /> : 'Save & Treat'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIResponseModal;
