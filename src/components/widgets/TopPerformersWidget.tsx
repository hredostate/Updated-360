import React, { useState } from 'react';
import type { StudentAward, UserProfile } from '../../types';
import Spinner from '../common/Spinner';

interface StudentSpotlightWidgetProps {
    studentAwards: StudentAward[];
    onGenerateStudentAwards: () => Promise<void>;
    userProfile: UserProfile;
}

const StudentSpotlightWidget: React.FC<StudentSpotlightWidgetProps> = ({ studentAwards, onGenerateStudentAwards, userProfile }) => {
    const [isLoading, setIsLoading] = useState(false);
    const canGenerateAwards = ['Admin', 'Principal', 'Team Lead'].includes(userProfile.role);
    const recentAwards = studentAwards.slice(0, 3);

    const handleGenerateClick = async () => {
        setIsLoading(true);
        try {
            await onGenerateStudentAwards();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-900 dark:text-white">Student Spotlight ⭐</h3>
                {canGenerateAwards && (
                    <button 
                        onClick={handleGenerateClick}
                        disabled={isLoading}
                        className="text-sm bg-amber-500 text-white px-3 py-1 rounded-lg hover:bg-amber-600 disabled:bg-amber-400 flex items-center justify-center min-w-[120px]"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Generate Awards'}
                    </button>
                )}
            </div>
            <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                {recentAwards.length > 0 ? (
                    recentAwards.map(award => (
                        <div key={award.id} className="p-3 bg-amber-500/10 rounded-lg border-l-4 border-amber-400">
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                <span className="font-bold text-slate-900 dark:text-white">{award.student?.name || 'A student'}</span> is recognized for:
                            </p>
                            <blockquote className="mt-1 text-sm italic text-amber-900 dark:text-amber-200">
                                "{award.reason}"
                            </blockquote>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400">No awards generated yet.</p>
                        {canGenerateAwards && (
                             <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click "Generate Awards" to recognize students!</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentSpotlightWidget;
