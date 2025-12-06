import React from 'react';
import type { SocialMediaAnalytics } from '../../types';

interface SocialMediaSummaryWidgetProps {
  socialMediaAnalytics: SocialMediaAnalytics[];
  onNavigate: (view: string) => void;
}

const SocialMediaSummaryWidget: React.FC<SocialMediaSummaryWidgetProps> = ({ socialMediaAnalytics, onNavigate }) => {
  const totalFollowers = socialMediaAnalytics.reduce((acc, platform) => acc + platform.followers, 0);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3">Social Media Performance</h3>
      <div className="text-center mb-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Total Followers</p>
        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalFollowers.toLocaleString()}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center mb-4">
        {socialMediaAnalytics.map(acc => (
            <div key={acc.platform} className="p-2 bg-slate-500/10 rounded">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{acc.platform}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{acc.followers.toLocaleString()}</p>
            </div>
        ))}
      </div>
      <button 
        onClick={() => onNavigate('Social Media Hub')}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
      >
        🚀 Go to Social Media Hub
      </button>
    </div>
  );
};

export default SocialMediaSummaryWidget;