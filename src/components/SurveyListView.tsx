
import React from 'react';
import type { SurveyWithQuestions } from '../types';

interface SurveyListViewProps {
    surveys: SurveyWithQuestions[];
    onTakeSurvey: (survey: SurveyWithQuestions) => void;
    takenSurveyIds: Set<number>;
}

const SurveyListView: React.FC<SurveyListViewProps> = ({ surveys, onTakeSurvey, takenSurveyIds }) => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Surveys &amp; Polls</h1>
                <p className="text-slate-600 mt-1">Available surveys for you to complete.</p>
            </div>
            <div className="space-y-4">
                {surveys.length > 0 ? surveys.map(survey => {
                    const isTaken = takenSurveyIds.has(survey.id);
                    return (
                        <div key={survey.id} className="rounded-2xl border bg-white/60 p-4 flex justify-between items-center card-hover">
                            <div>
                                <h3 className="font-bold text-lg">{survey.title}</h3>
                                <p className="text-sm text-slate-500">{survey.description}</p>
                                <p className="text-xs text-slate-400">{survey.questions.length} questions</p>
                            </div>
                            <button 
                                onClick={() => onTakeSurvey(survey)} 
                                disabled={isTaken}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-green-600 disabled:cursor-not-allowed"
                            >
                                {isTaken ? '✓ Completed' : 'Start Survey'}
                            </button>
                        </div>
                    );
                }) : (
                    <div className="text-center p-10 rounded-2xl border bg-white/60">
                        <p>No surveys available for you at this time.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SurveyListView;