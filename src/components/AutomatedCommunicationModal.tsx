import React, { useState } from 'react';
import type { ReportRecord } from '../types';
import Spinner from './common/Spinner';
import { aiClient } from '../services/aiClient';
import { WandIcon } from './common/icons';

interface AutomatedCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportRecord | null;
}

type ActionType = 'parent_email' | 'internal_summary' | 'action_plan';

const AutomatedCommunicationModal: React.FC<AutomatedCommunicationModalProps> = ({ isOpen, onClose, report }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !report) return null;

  const handleGenerate = async (action: ActionType) => {
    setIsLoading(true);
    setGeneratedContent('');
    
    // Safely extract student names from tagged_users (as involved_students stores IDs)
    const studentNames = report.tagged_users
        ?.filter(u => u.type === 'student')
        .map(u => u.name)
        .join(', ') || 'the student(s)';

    let prompt = `Based on the following school report, please draft a response.\n\nReport Text: "${report.report_text}"\nInvolved Students: ${studentNames}\n`;

    switch (action) {
      case 'parent_email':
        prompt += "\nTask: Draft a professional, empathetic, and clear email to the parents of the involved student(s). Do not include overly sensitive details, but inform them of the situation and the school's commitment to resolving it. Suggest a follow-up call or meeting.";
        break;
      case 'internal_summary':
        prompt += "\nTask: Draft a concise internal summary of this report for school leadership. Highlight key facts, potential risks, and the sentiment of the report.";
        break;
      case 'action_plan':
        prompt += "\nTask: Draft a list of 3-5 concrete, actionable steps to address the situation described in the report. For each step, suggest which role (e.g., Counselor, Team Lead) should be responsible.";
        break;
    }

    try {
      if (!aiClient) {
        throw new Error("AI client is not initialized.");
      }
      const response = await aiClient.models.generateContent({model: 'gemini-2.5-flash', contents: prompt });
      setGeneratedContent(response.text);
    } catch (e) {
      console.error(e);
      setGeneratedContent('Sorry, an error occurred while generating the content.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center"><WandIcon className="w-6 h-6 mr-2 text-purple-600"/>Automated Actions</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-3xl font-light">&times;</button>
        </div>
        
        <div className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-lg mb-4 flex-shrink-0">
            <p className="text-sm"><span className="font-semibold">Source Report #{report.id}:</span> "{report.report_text.substring(0, 150)}..."</p>
        </div>

        <div className="flex items-center space-x-2 mb-4 flex-shrink-0">
          <button onClick={() => handleGenerate('parent_email')} className="flex-1 py-2 px-3 bg-blue-500/10 text-blue-800 dark:text-blue-300 font-semibold rounded-lg hover:bg-blue-500/20">Draft Parent Email</button>
          <button onClick={() => handleGenerate('internal_summary')} className="flex-1 py-2 px-3 bg-green-500/10 text-green-800 dark:text-green-300 font-semibold rounded-lg hover:bg-green-500/20">Internal Summary</button>
          <button onClick={() => handleGenerate('action_plan')} className="flex-1 py-2 px-3 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold rounded-lg hover:bg-amber-500/20">Suggest Action Plan</button>
        </div>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="h-full flex justify-center items-center bg-slate-500/10 rounded-lg">
                <Spinner />
            </div>
          ) : (
            <textarea
              readOnly
              value={generatedContent}
              className="w-full h-full p-3 border rounded-md bg-slate-500/10 border-slate-500/20"
              placeholder="Select an action above to generate content here..."
            />
          )}
        </div>
        
         <div className="flex justify-end space-x-3 pt-4 flex-shrink-0">
            <button onClick={handleCopy} disabled={!generatedContent} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 disabled:bg-slate-300">
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">Close</button>
        </div>
      </div>
    </div>
  );
};

export default AutomatedCommunicationModal;