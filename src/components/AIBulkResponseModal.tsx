

import React, { useState, useEffect, useCallback } from 'react';
import { aiClient } from '../services/aiClient';
import type { ReportRecord } from '../types';
import Spinner from './common/Spinner';
import { WandIcon } from './common/icons';
import { textFromGemini } from '../utils/ai';
// FIX: Changed import path for PRINCIPAL_PERSONA_PROMPT from ../App to ../constants
import { PRINCIPAL_PERSONA_PROMPT } from '../constants';

interface AIBulkResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ReportRecord[];
  onSave: (responses: Record<number, string>) => Promise<void>;
}

const AIBulkResponseModal: React.FC<AIBulkResponseModalProps> = ({ isOpen, onClose, reports, onSave }) => {
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const generateResponses = useCallback(async () => {
    if (!aiClient) {
      console.error("AI client not available");
      return;
    }

    setLoadingStates(reports.reduce((acc, report) => ({ ...acc, [report.id]: true }), {}));

    const prompts = reports.map(report => {
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
        };

        const audienceContext = getAudienceContext(report);

        return `
            A report has been submitted by ${report.author?.name} (${report.author?.role}).
            
            Report Details:
            - Type: ${report.report_type}
            - Content: "${report.report_text}"
            
            Task:
            Based on your persona, draft a concise response to the author of the report, ${report.author?.name}.
            Your response should acknowledge the report and provide clear, actionable next steps or feedback.
            It will be sent as a task to the reporter, so it should be self-contained.
            Format your response for readability with clear paragraphs. Do not use asterisks or other markdown for emphasis.
            
            ${audienceContext}
            
            Draft your response now.
        `;
    });

    const newResponses: Record<number, string> = {};
    for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        const prompt = prompts[i];
        try {
            const response = await aiClient.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction: PRINCIPAL_PERSONA_PROMPT }
            });
            newResponses[report.id] = textFromGemini(response);
        } catch (e) {
            console.error(`Failed to generate response for report #${report.id}`, e);
            newResponses[report.id] = "Error: Could not generate AI response.";
        } finally {
            setLoadingStates(prev => ({ ...prev, [report.id]: false }));
        }
    }
    setResponses(newResponses);
  }, [reports]);

  useEffect(() => {
    if (isOpen) {
      setResponses({});
      setLoadingStates({});
      generateResponses();
    }
  }, [isOpen, generateResponses]);

  const handleResponseChange = (reportId: number, text: string) => {
    setResponses(prev => ({ ...prev, [reportId]: text }));
  };

  const handleSaveAndClose = async () => {
    setIsSaving(true);
    await onSave(responses);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-3xl m-4 flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <WandIcon className="w-6 h-6 text-purple-600"/> AI Bulk Response Generation
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-4">
          The AI has drafted personalized responses for each selected report using the Nigerian Principal persona. Review and edit them below before creating acknowledgement tasks for the reporters.
        </p>
        
        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
          {reports.map(report => (
            <div key={report.id} className="p-3 bg-slate-500/10 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-sm font-semibold">Response for Report #{report.id} (from {report.author?.name})</p>
              <p className="text-xs text-slate-500 italic truncate mb-2">"{report.report_text}"</p>
              {loadingStates[report.id] ? (
                <div className="w-full h-40 p-2 flex items-center justify-center"><Spinner /></div>
              ) : (
                <textarea
                  value={responses[report.id] || ''}
                  onChange={(e) => handleResponseChange(report.id, e.target.value)}
                  className="w-full h-40 p-2 border rounded-md bg-white/50 dark:bg-slate-900/50 leading-relaxed"
                  rows={5}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-200/60 flex-shrink-0">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md disabled:opacity-50">Cancel</button>
          <button onClick={handleSaveAndClose} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400 flex items-center min-w-[180px] justify-center">
            {isSaving ? <Spinner size="sm" /> : `Create ${reports.length} Tasks`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIBulkResponseModal;
