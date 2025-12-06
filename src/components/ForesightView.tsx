import React, { useState } from 'react';
import { EyeIcon } from './common/icons';
import Spinner from './common/Spinner';
import type { FutureRiskPrediction } from '../types';

interface ForesightViewProps {
    onGenerateForesight: () => Promise<void>;
    futureRiskOutlook: FutureRiskPrediction[] | null;
}

const riskLevelClasses: Record<FutureRiskPrediction['risk_level'], string> = {
    Critical: 'bg-red-200 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    High: 'bg-orange-200 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    Elevated: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    Low: 'bg-green-200 text-green-800 dark:bg-green-500/20 dark:text-green-300',
};

const ForesightView: React.FC<ForesightViewProps> = ({ onGenerateForesight, futureRiskOutlook }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        await onGenerateForesight();
        setIsLoading(false);
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
                    <EyeIcon className="w-8 h-8 mr-3 text-indigo-500"/>
                    Strategic Foresight Center
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">Run predictive analysis on school data to reveal hidden trends and predict future outcomes.</p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Future Risk Outlook</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Analyze historical report data to predict which students may be on a negative trajectory.</p>
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center min-w-[200px] justify-center">
                        {isLoading ? <Spinner /> : 'Run Predictive Analysis'}
                    </button>
                </div>
            </div>
            
            {(isLoading || futureRiskOutlook) && (
                 <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
                    <h2 className="font-bold text-slate-800 dark:text-white text-xl mb-4">Analysis Results</h2>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center min-h-[200px]">
                            <Spinner size="lg" />
                            <p className="mt-4 text-slate-500">Synthesizing school-wide data...</p>
                        </div>
                    )}
                    {!isLoading && futureRiskOutlook && futureRiskOutlook.length > 0 && (
                        <div className="space-y-3">
                            {futureRiskOutlook.map((prediction, index) => (
                                <div key={index} className="p-3 bg-slate-500/10 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{prediction.student_name}</p>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${riskLevelClasses[prediction.risk_level]}`}>{prediction.risk_level} Risk</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">"{prediction.rationale}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                     {!isLoading && futureRiskOutlook && futureRiskOutlook.length === 0 && (
                        <p className="text-center p-4 text-slate-500">Analysis complete. No students are currently projected to be at high risk.</p>
                     )}
                </div>
            )}
        </div>
    );
};

export default ForesightView;