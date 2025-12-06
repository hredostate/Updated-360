import React, { useState, useEffect, useMemo } from 'react';
import type { UserProfile, Team, Task, ReportRecord, TeamPulse, TeamFeedback } from '../types';
import { TaskStatus } from '../types';
import Spinner from './common/Spinner';
import { ClipboardListIcon, FileTextIcon, UsersIcon } from './common/icons';
import TeamPulseSummary from './TeamPulseSummary';
import SearchableSelect from './common/SearchableSelect';

// --- Modals ---
interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (teamData: Partial<Omit<Team, 'members'>>) => Promise<void>;
    users: UserProfile[];
    existingTeam?: Team | null;
}

const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, onSave, users, existingTeam }) => {
    const [teamName, setTeamName] = useState('');
    const [leadId, setLeadId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if(existingTeam) {
            setTeamName(existingTeam.team_name);
            setLeadId(existingTeam.lead_id);
        } else {
            setTeamName('');
            setLeadId(null);
        }
    }, [existingTeam, isOpen]);

    const possibleLeads = users.filter(u => ['Admin', 'Principal', 'Team Lead'].includes(u.role));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName.trim()) return;
        setIsSaving(true);
        await onSave({
            id: existingTeam?.id,
            team_name: teamName,
            lead_id: leadId,
        });
        setIsSaving(false);
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-lg m-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{existingTeam ? 'Edit Team' : 'Create New Team'}</h2>
                    <div>
                        <label htmlFor="team-name" className="block text-sm font-medium">Team Name</label>
                        <input type="text" id="team-name" value={teamName} onChange={e => setTeamName(e.target.value)} required className="mt-1 w-full p-2 border rounded-md bg-white/50 dark:bg-slate-800/50" />
                    </div>
                     <div>
                        <label htmlFor="team-lead" className="block text-sm font-medium">Team Lead (Optional)</label>
                        <SearchableSelect
                            options={[{ value: '', label: 'None' }, ...possibleLeads.map(u => ({ value: u.id, label: u.name }))]}
                            value={leadId}
                            onChange={value => setLeadId(value ? (value as string) : null)}
                            placeholder="Select a lead"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center min-w-[100px] justify-center">{isSaving ? <Spinner size="sm" /> : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface EditMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (memberIds: string[]) => Promise<void>;
    team: Team;
    users: UserProfile[];
}

const EditMembersModal: React.FC<EditMembersModalProps> = ({ isOpen, onClose, onSave, team, users }) => {
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(team.members.map(m => m.user_id));
    const [isSaving, setIsSaving] = useState(false);
    
    const possibleMembers = users.filter(u => ['Teacher', 'Counselor', 'Team Lead'].includes(u.role));

    const handleToggleMember = (userId: string) => {
        setSelectedMemberIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(selectedMemberIds);
        setIsSaving(false);
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
             <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-md m-4 flex flex-col max-h-[90vh]">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Members for {team.team_name}</h2>
                <div className="my-4 flex-grow overflow-y-auto space-y-2 pr-2">
                    {possibleMembers.map(user => (
                        <label key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-500/10 cursor-pointer">
                            <input type="checkbox" checked={selectedMemberIds.includes(user.id)} onChange={() => handleToggleMember(user.id)} className="h-4 w-4 rounded" />
                            <span>{user.name} <span className="text-xs text-slate-500">({user.role})</span></span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center min-w-[100px] justify-center">{isSaving ? <Spinner size="sm"/> : 'Save'}</button>
                </div>
            </div>
        </div>
    );
}

// --- Main Component ---
interface TeamManagerProps {
  users: UserProfile[];
  currentUser: UserProfile;
  userPermissions: string[];
  teams: Team[];
  tasks: Task[];
  reports: ReportRecord[];
  teamPulse: TeamPulse[];
  teamFeedback: TeamFeedback[];
  onCreateTeam: (teamData: Omit<Team, 'id' | 'members'>) => Promise<Team | null>;
  onUpdateTeam: (teamId: number, teamData: Partial<Team>) => Promise<boolean>;
  onDeleteTeam: (teamId: number) => Promise<boolean>;
  onUpdateTeamMembers: (teamId: number, memberIds: string[]) => Promise<void>;
  onSaveTeamFeedback: (teamId: number, rating: number, comments: string | null) => Promise<boolean>;
}

const TeamManager: React.FC<TeamManagerProps> = ({ users, currentUser, userPermissions, teams, tasks, reports, teamPulse, teamFeedback, onCreateTeam, onUpdateTeam, onDeleteTeam, onUpdateTeamMembers, onSaveTeamFeedback }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingMembersTeam, setEditingMembersTeam] = useState<Team | null>(null);
    const [editingDetailsTeam, setEditingDetailsTeam] = useState<Team | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    const canManageTeams = userPermissions.includes('manage-teams') || userPermissions.includes('*');

    const handleSaveTeam = async (teamData: Partial<Omit<Team, 'members'>>) => {
        if (teamData.id) {
            await onUpdateTeam(teamData.id, teamData);
        } else {
            await onCreateTeam(teamData as Omit<Team, 'id' | 'members'>);
        }
    };

    const handleDelete = async (teamId: number) => {
        if(window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
            const success = await onDeleteTeam(teamId);
            if (success) {
                setSelectedTeam(null); // Go back to the main list view
            }
        }
    };
    
    useEffect(() => {
        if (selectedTeam) {
            const updatedTeam = teams.find(t => t.id === selectedTeam.id);
            if (updatedTeam) {
                setSelectedTeam(updatedTeam);
            } else {
                setSelectedTeam(null);
            }
        }
    }, [teams, selectedTeam]);


    const TeamDetailView: React.FC<{team: Team}> = ({ team }) => {
        const memberIds = useMemo(() => {
            const ids = new Set(team.members.map(m => m.user_id));
            if (team.lead_id) ids.add(team.lead_id);
            return ids;
        }, [team]);

        const teamTasks = useMemo(() => tasks.filter(task => memberIds.has(task.user_id)), [tasks, memberIds]);
        const openTasks = useMemo(() => teamTasks.filter(t => t.status !== TaskStatus.Completed && t.status !== TaskStatus.Archived), [teamTasks]);

        const teamReports = useMemo(() => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return reports.filter(r => memberIds.has(r.author_id) && new Date(r.created_at) >= sevenDaysAgo);
        }, [reports, memberIds]);


        return (
            <div className="animate-fade-in space-y-6">
                 <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{team.team_name}</h1>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">Lead: {team.lead?.name || 'None'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {canManageTeams && (
                            <>
                                <button onClick={() => setEditingDetailsTeam(team)} className="px-3 py-2 text-sm bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">Edit Team</button>
                                <button onClick={() => setEditingMembersTeam(team)} className="px-3 py-2 text-sm bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">Manage Members</button>
                                <button onClick={() => handleDelete(team.id)} className="px-3 py-2 text-sm bg-red-500/10 text-red-700 dark:text-red-300 font-semibold rounded-lg hover:bg-red-500/20">Delete Team</button>
                            </>
                        )}
                        <button onClick={() => setSelectedTeam(null)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Back to All Teams</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
                         <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><UsersIcon className="w-5 h-5"/> Members</h3>
                         <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                            {team.lead && (
                                <div className="flex items-center gap-3 p-2 bg-slate-500/10 rounded-lg">
                                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 ring-1 ring-blue-300/50" title={team.lead.name}>
                                        {team.lead.name.split(' ').map(n=>n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{team.lead.name}</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Team Lead</p>
                                    </div>
                                </div>
                            )}
                            {team.members.map(member => (
                                <div key={member.user_id} className="flex items-center gap-3 p-2">
                                     <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 ring-1 ring-slate-300/50" title={member.profile.name}>
                                        {member.profile.name.split(' ').map(n=>n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{member.profile.name}</p>
                                        <p className="text-xs text-slate-500">{users.find(u => u.id === member.user_id)?.role}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                         <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
                             <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><ClipboardListIcon className="w-5 h-5"/> Open Tasks ({openTasks.length})</h3>
                             <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                {openTasks.length > 0 ? openTasks.map(task => (
                                    <div key={task.id} className="p-2 bg-slate-500/10 rounded-md">
                                        <p className="font-semibold text-sm">{task.title}</p>
                                        <p className="text-xs text-slate-500">Due: {new Date(task.due_date).toLocaleDateString()} | Priority: {task.priority}</p>
                                    </div>
                                )) : <p className="text-sm text-slate-500 text-center py-4">No open tasks.</p>}
                             </div>
                        </div>
                         <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
                             <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><FileTextIcon className="w-5 h-5"/> Reports - Last 7 Days ({teamReports.length})</h3>
                             <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                {teamReports.length > 0 ? teamReports.map(report => (
                                    <div key={report.id} className="p-2 bg-slate-500/10 rounded-md">
                                        <p className="font-semibold text-sm">{report.report_type}: {report.analysis?.summary || report.report_text.substring(0, 50) + '...'}</p>
                                        <p className="text-xs text-slate-500">By: {report.author?.name} on {new Date(report.created_at).toLocaleDateString()}</p>
                                    </div>
                                )) : <p className="text-sm text-slate-500 text-center py-4">No reports in the last 7 days.</p>}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (selectedTeam) {
        return (
            <>
                <TeamDetailView team={selectedTeam} />
                {editingMembersTeam && <EditMembersModal isOpen={!!editingMembersTeam} onClose={() => setEditingMembersTeam(null)} onSave={(memberIds) => onUpdateTeamMembers(editingMembersTeam.id, memberIds)} team={editingMembersTeam} users={users} />}
                {editingDetailsTeam && <TeamModal isOpen={!!editingDetailsTeam} onClose={() => setEditingDetailsTeam(null)} onSave={handleSaveTeam} users={users} existingTeam={editingDetailsTeam}/>}
            </>
        )
    }
    
    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Management</h1>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">Create teams and manage their members and performance.</p>
                    </div>
                     {canManageTeams && <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Create New Team</button>}
                </div>
                
                <div className="mb-6">
                    <TeamPulseSummary 
                        teamPulse={teamPulse} 
                        userProfile={currentUser} 
                        teams={teams} 
                        teamFeedback={teamFeedback} 
                        onSaveTeamFeedback={onSaveTeamFeedback} 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map(team => {
                        const memberIds = new Set(team.members.map(m => m.user_id));
                        if (team.lead_id) memberIds.add(team.lead_id);
                        
                        const openTasks = tasks.filter(task => 
                            memberIds.has(task.user_id) && 
                            task.status !== TaskStatus.Completed && 
                            task.status !== TaskStatus.Archived
                        ).length;

                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                        const recentReports = reports.filter(report =>
                            memberIds.has(report.author_id) &&
                            new Date(report.created_at) >= sevenDaysAgo
                        ).length;

                        return (
                            <div key={team.id} onClick={() => setSelectedTeam(team)} className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 flex flex-col cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-400/50 dark:hover:border-blue-600/50">
                                <div className="flex-grow">
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{team.team_name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Lead: {team.lead?.name || 'None'}</p>
                            
                                    <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <ClipboardListIcon className="w-6 h-6 text-blue-500" />
                                            <div>
                                                <p className="text-xl font-bold text-slate-800 dark:text-white">{openTasks}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Open Tasks</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileTextIcon className="w-6 h-6 text-green-500" />
                                            <div>
                                                <p className="text-xl font-bold text-slate-800 dark:text-white">{recentReports}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Reports (7d)</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Members ({team.members.length})</h4>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {team.members.slice(0, 8).map(m => (
                                                <div key={m.user_id} className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 ring-1 ring-blue-300/50" title={m.profile.name}>
                                                    {m.profile.name.split(' ').map(n=>n[0]).join('')}
                                                </div>
                                            ))}
                                            {team.members.length > 8 && <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 ring-1 ring-slate-300">+{team.members.length-8}</div>}
                                        </div>
                                    </div>
                                </div>
                                 <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 text-right">
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); }} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">View Details</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <TeamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleSaveTeam} users={users} />
            {editingMembersTeam && <EditMembersModal isOpen={!!editingMembersTeam} onClose={() => setEditingMembersTeam(null)} onSave={(memberIds) => onUpdateTeamMembers(editingMembersTeam.id, memberIds)} team={editingMembersTeam} users={users} />}
            {editingDetailsTeam && <TeamModal isOpen={!!editingDetailsTeam} onClose={() => setEditingDetailsTeam(null)} onSave={handleSaveTeam} users={users} existingTeam={editingDetailsTeam}/>}
        </>
    );
};

export default TeamManager;