import React, { useState } from 'react';
import type { StudentAward, RewardStoreItem } from '../types';
import Spinner from './common/Spinner';

interface StudentSpotlightViewProps {
  studentAwards: StudentAward[];
  onGenerateStudentAwards: () => Promise<void>;
  rewards: RewardStoreItem[];
}

const StudentSpotlightView: React.FC<StudentSpotlightViewProps> = ({ studentAwards, onGenerateStudentAwards, rewards }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateClick = async () => {
    setIsLoading(true);
    await onGenerateStudentAwards();
    setIsLoading(false);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Spotlight & Rewards</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">Recognize student achievements and see available rewards.</p>
        </div>
        <button 
            onClick={handleGenerateClick}
            disabled={isLoading}
            className="text-sm bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:bg-amber-400 flex items-center justify-center min-w-[150px]"
        >
            {isLoading ? <Spinner size="sm" /> : '✨ Generate Awards'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Spotlights */}
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Recent Spotlights 🏆</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {studentAwards.length > 0 ? (
                studentAwards.map(award => (
                    <div key={award.id} className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-lg dark:border-slate-800/60 dark:bg-slate-900/40">
                    <div className="p-3 bg-amber-500/10 rounded-lg border-l-4 border-amber-400">
                        <p className="font-bold text-amber-700 dark:text-amber-200">{award.award_type}</p>
                        <p className="text-sm text-slate-800 dark:text-amber-300 mt-2">
                            Awarded to <span className="font-bold text-slate-900 dark:text-white">{award.student?.name || 'A student'}</span> for:
                        </p>
                        <blockquote className="mt-1 text-sm italic text-amber-900 dark:text-amber-200">
                            "{award.reason}"
                        </blockquote>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            +10 Reward Points
                        </p>
                    </div>
                    </div>
                ))
                ) : (
                <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/40">
                    <p className="text-slate-500 dark:text-slate-400">No student awards have been generated yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Generate Awards" to recognize deserving students!</p>
                </div>
                )}
            </div>
        </div>

        {/* Right Column: Rewards Store */}
        <div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-white">Rewards Store 🛍️</h2>
             <div className="mt-4 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {rewards.map(reward => (
                    <div key={reward.id} className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-800 to-slate-900 p-4 shadow-lg text-white text-center flex flex-col items-center justify-center">
                        <div className="text-4xl">{reward.icon}</div>
                        <p className="font-bold mt-2 text-sm">{reward.name}</p>
                        <p className="text-xs font-semibold mt-1 px-2 py-0.5 bg-amber-500 text-black rounded-full">{reward.cost} Points</p>
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSpotlightView;