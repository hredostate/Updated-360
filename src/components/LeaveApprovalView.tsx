
import React, { useState, useMemo } from 'react';
// FIX: Import LeaveRequestStatus as a value, not just a type.
import type { LeaveRequest, UserProfile, Team } from '../types';
import { LeaveRequestStatus } from '../types';
import Spinner from './common/Spinner';

interface LeaveApprovalViewProps {
    currentUser: UserProfile;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    allRequests: LeaveRequest[];
    onUpdateStatus: (requestId: number, status: LeaveRequestStatus) => Promise<boolean>;
    teams: Team[];
}

const LeaveApprovalView: React.FC<LeaveApprovalViewProps> = ({ currentUser, addToast, allRequests, onUpdateStatus, teams }) => {
    const [loadingAction, setLoadingAction] = useState<Record<number, boolean>>({});

    const pendingRequests = useMemo(() => {
        const validRequests = allRequests.filter(Boolean);
        const isAdmin = ['Admin', 'Principal'].includes(currentUser.role);
        if (isAdmin) {
            return validRequests.filter(r => r.status === 'pending');
        }

        const myTeam = teams.find(t => t.lead_id === currentUser.id);
        if (myTeam) {
            const memberIds = new Set((myTeam.members || []).map(m => m.user_id));
            return validRequests.filter(r => r.status === 'pending' && memberIds.has(r.requester_id));
        }

        return [];
    }, [allRequests, currentUser, teams]);

    const handleAction = async (requestId: number, status: LeaveRequestStatus) => {
        setLoadingAction(prev => ({ ...prev, [requestId]: true }));
        await onUpdateStatus(requestId, status);
        setLoadingAction(prev => ({ ...prev, [requestId]: false }));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leave Approvals</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">Review and action pending staff leave requests.</p>
            </div>

            <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200/60 bg-white/60">
                        <p className="text-slate-500">No pending leave requests to review.</p>
                    </div>
                ) : (
                    pendingRequests.map(req => (
                        <div key={req.id} className="p-4 rounded-xl border bg-white/60 dark:bg-slate-900/40 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Requester</p>
                                    <p className="font-semibold">{req.requester?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Type</p>
                                    <p className="font-semibold">{req.leave_type?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Dates</p>
                                    <p className="font-semibold">
                                        {new Date(req.start_date + 'T00:00:00').toLocaleDateString()} - {new Date(req.end_date + 'T00:00:00').toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            {req.reason && <p className="text-sm mt-3 pt-3 border-t"><strong>Reason:</strong> {req.reason}</p>}
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    // FIX: Use enum member for status.
                                    onClick={() => handleAction(req.id, LeaveRequestStatus.Rejected)}
                                    disabled={loadingAction[req.id]}
                                    className="px-4 py-2 bg-red-500/10 text-red-700 font-semibold rounded-lg text-sm"
                                >
                                    Reject
                                </button>
                                <button
                                    // FIX: Use enum member for status.
                                    onClick={() => handleAction(req.id, LeaveRequestStatus.Approved)}
                                    disabled={loadingAction[req.id]}
                                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg text-sm flex items-center min-w-[100px] justify-center"
                                >
                                    {loadingAction[req.id] ? <Spinner size="sm" /> : 'Approve'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LeaveApprovalView;
