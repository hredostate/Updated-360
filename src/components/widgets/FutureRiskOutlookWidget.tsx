import React, { useState } from 'react';
import type { FutureRiskPrediction } from '../../types';
import Spinner from '../common/Spinner';

interface FutureRiskOutlookWidgetProps {
    futureRiskOutlook: FutureRiskPrediction[] | null;
    onAnalyzeFutureRisks: () => Promise<void>;
}

const riskLevelClasses: Record<FutureRiskPrediction['risk_level'], string> = {
    Critical: 'bg-red-200 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    High: 'bg-orange-200 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    Elevated: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    Low: 'bg-green-200 text-green-800 dark:bg-green-500/20 dark:text-green-300',
};

const FutureRiskOutlookWidget: React.FC<FutureRiskOutlookWidgetProps> = ({ futureRiskOutlook, onAnalyzeFutureRisks }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        setIsLoading(true);
        await onAnalyzeFutureRisks();
        setIsLoading(false);
    };

    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3">Future Risk Outlook</h3>
            {futureRiskOutlook === null && (
                <div className="text-center py-8">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Analyze historical report data to predict which students may be on a negative trajectory.</p>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center"
                    >
                        {isLoading ? <Spinner size="sm" /> : "Run Predictive Analysis"}
                    </button>
                </div>
            )}
            
            {futureRiskOutlook && futureRiskOutlook.length === 0 && (
                <div className="text-center py-8">
                     <p className="text-sm text-slate-600 dark:text-slate-300">Analysis complete. No students are currently projected to be at high risk based on available data.</p>
                </div>
            )}
            
            {futureRiskOutlook && futureRiskOutlook.length > 0 && (
                <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                    {futureRiskOutlook.map((prediction, index) => (
                        <div key={index} className="p-3 bg-slate-500/10 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                             <div className="flex justify-between items-center">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{prediction.student_name}</p>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${riskLevelClasses[prediction.risk_level]}`}>{prediction.risk_level} Risk</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">"{prediction.rationale}"</p>
                        </div>
                    ))}
                     <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full mt-4 bg-blue-600/20 text-blue-800 dark:text-blue-300 py-2 px-4 rounded-lg hover:bg-blue-600/30 disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? <Spinner size="sm" /> : "Re-analyze"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FutureRiskOutlookWidget;
