import React, { useState } from 'react';
import type { TeamPulse, UserProfile, Team, TeamFeedback } from '../types';
import Spinner from './common/Spinner';

interface TeamPulseSummaryProps {
  teamPulse: TeamPulse[];
  userProfile: UserProfile;
  teams: Team[];
  teamFeedback: TeamFeedback[];
  onSaveTeamFeedback: (teamId: number, rating: number, comments: string | null) => Promise<boolean>;
}

// --- Helper: Get Monday of the current week ---
const getWeekStartDate = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay(); // Sunday - 0, Monday - 1
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
}

// --- Helper: Feedback Form Component ---
const TeamFeedbackForm: React.FC<{
    teamId: number;
    teamName: string;
    onSave: (teamId: number, rating: number, comments: string | null) => Promise<boolean>;
    latestFeedbackForWeek: TeamFeedback | undefined;
}> = ({ teamId, teamName, onSave, latestFeedbackForWeek }) => {
    const [rating, setRating] = useState(latestFeedbackForWeek?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSaving(true);
        await onSave(teamId, rating, null);
        setIsSaving(false);
    }
    
    if (latestFeedbackForWeek) {
        return (
             <div className="mt-3 p-3 bg-green-500/10 rounded-lg text-center">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">Weekly Feedback Submitted</h4>
                <p className="text-sm text-green-700 dark:text-green-400">You rated your team's performance this week:</p>
                <div className="text-3xl mt-1">{'★'.repeat(latestFeedbackForWeek.rating)}{'☆'.repeat(5 - latestFeedbackForWeek.rating)}</div>
            </div>
        )
    }

    return (
        <div className="mt-3 p-3 bg-slate-500/10 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Submit Weekly Feedback for {teamName}</h4>
            <div className="my-2 flex justify-center text-3xl cursor-pointer">
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                    >
                        ★
                    </span>
                ))}
            </div>
            <button
                onClick={handleSubmit}
                disabled={isSaving || rating === 0}
                className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center"
            >
                {isSaving ? <Spinner size="sm" /> : 'Submit Rating'}
            </button>
        </div>
    )
}


const MetricBar: React.FC<{ label: string; score: number; weight: number; helpText: string; }> = ({ label, score, weight, helpText }) => {
    const barColor = score > 80 ? 'bg-green-500' : score > 50 ? 'bg-blue-500' : 'bg-yellow-500';
    return (
        <div className="group relative">
            <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{label} ({weight}%)</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{score}/100</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs text-white bg-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                {helpText}
            </div>
        </div>
    )
}


const TeamPulseSummary: React.FC<TeamPulseSummaryProps> = ({ teamPulse, userProfile, teams, teamFeedback, onSaveTeamFeedback }) => {
    const myTeam = teams.find(team => team.members.some(member => member.user_id === userProfile.id) || team.lead_id === userProfile.id);
    const myTeamPulse = myTeam ? teamPulse.find(pulse => pulse.teamId === myTeam.id) : undefined;
    const isMyTeamLead = myTeam?.lead_id === userProfile.id;

    const currentWeekStart = getWeekStartDate(new Date());
    const myTeamFeedbackForWeek = myTeam ? teamFeedback.find(f => f.team_id === myTeam.id && f.week_start_date === currentWeekStart) : undefined;
    
    // Render view for team members/leads
    if(myTeamPulse) {
        return (
             <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
                {/* My Team's Detailed View */}
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">My Team's Pulse <span className="text-xs font-normal text-slate-500">(Last 7 Days)</span></h3>
                    <div className="mt-3 p-4 bg-blue-500/10 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{myTeamPulse.teamName}</p>
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Rank {myTeamPulse.rank} of {teamPulse.length}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-semibold text-slate-500">Overall Score</p>
                             <p className="text-4xl font-bold text-slate-800 dark:text-white">{myTeamPulse.overallScore}</p>
                        </div>
                    </div>
                    <div className="mt-3 p-3 bg-slate-500/5 rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Why this score?</h4>
                        <div className="space-y-3">
                            <MetricBar label="Reporting Compliance" score={myTeamPulse.reportingCompliance} weight={30} helpText="Consistency of daily reporting from each team member." />
                            <MetricBar label="Task Completion" score={myTeamPulse.taskCompletion} weight={25} helpText="Percentage of assigned tasks that have been completed." />
                            <MetricBar label="Positive Sentiment" score={myTeamPulse.positiveSentiment} weight={15} helpText="AI-analyzed morale based on the tone of reports." />
                            <MetricBar label="Lead Engagement" score={myTeamPulse.leadEngagement} weight={15} helpText="How often the Team Lead comments on and engages with reports." />
                            <MetricBar label="Weekly Lead Feedback" score={myTeamPulse.leadFeedbackScore} weight={15} helpText="The weekly performance rating submitted by the Team Lead." />
                        </div>
                    </div>
                    
                    {isMyTeamLead && myTeam && (
                        <TeamFeedbackForm 
                            teamId={myTeam.id}
                            teamName={myTeam.team_name}
                            onSave={onSaveTeamFeedback}
                            latestFeedbackForWeek={myTeamFeedbackForWeek}
                        />
                    )}
                </div>

                {/* Leaderboard View */}
                <div className="mt-4">
                     <h3 className="font-bold text-slate-900 dark:text-white mb-2">School-wide Leaderboard</h3>
                     <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                        {teamPulse.map(pulse => (
                             <div key={pulse.teamId} className={`flex items-center justify-between p-2 rounded-lg ${pulse.teamId === myTeamPulse.teamId ? 'bg-blue-500/20' : 'bg-slate-500/5'}`}>
                                <div className="flex items-center">
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 w-6">{pulse.rank}.</span>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{pulse.teamName}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Lead: {pulse.leadName}</p>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-slate-800 dark:text-white">{pulse.overallScore}</div>
                             </div>
                        ))}
                    </div>
                </div>
             </div>
        )
    }

  // Default view for users not on a team (e.g., Admins)
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3">Team Pulse Leaderboard <span className="text-xs font-normal text-slate-500">(Last 7 Days)</span></h3>
      <div className="max-h-64 overflow-y-auto pr-2">
        <div className="space-y-2">
          {teamPulse.length > 0 ? (
            teamPulse.map(pulse => (
              <div key={pulse.teamId} className="flex items-center justify-between p-2 bg-slate-500/5 rounded-lg">
                <div className="flex items-center">
                    <span className="font-bold text-lg text-slate-800 dark:text-slate-200 w-8">{pulse.rank}.</span>
                    <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{pulse.teamName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Lead: {pulse.leadName}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{pulse.overallScore}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Overall Score</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              No team activity data available yet. Create teams in Team Management.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPulseSummary;