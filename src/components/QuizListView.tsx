import React from 'react';
import type { QuizWithQuestions } from '../types';

interface QuizListViewProps {
    quizzes: QuizWithQuestions[];
    onTakeQuiz: (quiz: QuizWithQuestions) => void;
    takenQuizIds: Set<number>;
}

const QuizListView: React.FC<QuizListViewProps> = ({ quizzes, onTakeQuiz, takenQuizIds }) => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Quizzes &amp; Surveys</h1>
                <p className="text-slate-600 mt-1">Available quizzes and surveys for you to complete.</p>
            </div>
            <div className="space-y-4">
                {quizzes.length > 0 ? quizzes.map(quiz => {
                    const isTaken = takenQuizIds.has(quiz.id);
                    return (
                        <div key={quiz.id} className="rounded-2xl border bg-white/60 p-4 flex justify-between items-center card-hover">
                            <div>
                                <h3 className="font-bold text-lg">{quiz.title}</h3>
                                <p className="text-sm text-slate-500">{quiz.description}</p>
                                <p className="text-xs text-slate-400">{quiz.questions.length} questions</p>
                            </div>
                            <button 
                                onClick={() => onTakeQuiz(quiz)} 
                                disabled={isTaken}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-green-600 disabled:cursor-not-allowed"
                            >
                                {isTaken ? '✓ Completed' : 'Take Quiz'}
                            </button>
                        </div>
                    );
                }) : (
                    <div className="text-center p-10 rounded-2xl border bg-white/60">
                        <p>No quizzes available for you at this time.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizListView;