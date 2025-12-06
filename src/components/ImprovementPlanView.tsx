import React, { useState } from 'react';
import type { SchoolImprovementPlan } from '../types';
import Spinner from './common/Spinner';

interface ImprovementPlanViewProps {
  plan: SchoolImprovementPlan | null;
  onGenerate: () => Promise<void>;
}

const ImprovementPlanView: React.FC<ImprovementPlanViewProps> = ({ plan, onGenerate }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        await onGenerate();
        setIsLoading(false);
    }
    
    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 animate-fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">School Improvement Plan</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">AI-generated strategic guidance for the next quarter.</p>
                </div>
                 <button 
                    onClick={handleGenerate} 
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center min-w-[200px] justify-center"
                >
                    {isLoading ? <Spinner size="sm" /> : (plan ? 'Regenerate Plan' : 'Generate Plan')}
                </button>
            </div>
            
            {isLoading && !plan && (
                 <div className="text-center py-20">
                    <Spinner size="lg"/>
                    <p className="mt-4 text-slate-600 dark:text-slate-300">Analyzing school data... this may take a moment.</p>
                </div>
            )}
            
            {!isLoading && !plan && (
                <div className="text-center py-20 bg-slate-500/10 rounded-lg">
                    <p className="text-3xl mb-2">🚀</p>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Ready to build your strategy?</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Click "Generate Plan" to have the AI synthesize reports, tasks, and trends into a strategic draft.</p>
                </div>
            )}
            
            {plan && (
                <div className="space-y-8 animate-fade-in">
                    <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg">
                        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200">Executive Summary</h2>
                        <p className="mt-2 text-slate-700 dark:text-slate-300">{plan.executive_summary}</p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Strategic Goals</h2>
                        <div className="space-y-6">
                            {plan.strategic_goals.map((goal, index) => (
                                <div key={index} className="p-4 border border-slate-200/60 dark:border-slate-700/60 rounded-lg bg-slate-500/5">
                                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{index + 1}. {goal.goal}</h3>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-500/10 p-3 rounded-md">
                                            <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-300">Actionable Initiatives</h4>
                                            <ul className="list-disc list-inside mt-2 text-sm text-slate-700 dark:text-slate-200 space-y-1">
                                                {goal.initiatives.map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                         <div className="bg-green-500/10 p-3 rounded-md">
                                            <h4 className="font-semibold text-sm text-green-700 dark:text-green-300">Key Performance Indicator (KPI)</h4>
                                            <p className="mt-2 text-sm text-green-800 dark:text-green-200">{goal.kpi}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                     <div className="p-4 bg-slate-500/10 border border-slate-200/60 dark:border-slate-700/60 rounded-lg">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Data Summary Used for Analysis</h2>
                         <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-6 gap-y-2">
                            <span><strong>Total Reports:</strong> {plan.data_summary.total_reports}</span>
                            {plan.data_summary.key_themes && <span><strong>Key Themes:</strong> {plan.data_summary.key_themes.join(', ')}</span>}
                         </div>
                         <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Generated on {new Date(plan.generated_at).toLocaleString()}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImprovementPlanView;