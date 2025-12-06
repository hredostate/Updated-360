
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ReportRecord, UserProfile, ReportComment, Task, Student } from '../types';
import { ReportType } from '../types';
import AutomatedCommunicationModal from './AutomatedCommunicationModal';
import ReportAnalysis from './ReportAnalysis';
import CommentForm from './CommentForm';
import { WandIcon, TrashIcon, SearchIcon, CalendarIcon } from './common/icons';
import Spinner from './common/Spinner';
import AIResponseModal from './AIResponseModal';
import Pagination from './common/Pagination';

// --- Bulk Action Bar Component ---
const BulkActionBar: React.FC<{
    selectedCount: number;
    users: UserProfile[];
    onClear: () => void;
    onAssign: (assigneeId: string | null) => Promise<void>;
    onUpdateStatus: (status: 'pending' | 'treated') => Promise<void>;
    onDelete: () => Promise<void>;
    onOpenAIBulkResponseModal: () => void;
}> = ({ selectedCount, users, onClear, onAssign, onUpdateStatus, onDelete, onOpenAIBulkResponseModal }) => {
    const [assigneeId, setAssigneeId] = useState('');
    const [status, setStatus] = useState<'pending' | 'treated'>('treated');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const assignableUsers = users.filter(u => ['Admin', 'Principal', 'Team Lead', 'Counselor', 'Teacher'].includes(u.role));

    const handleAssign = async () => {
        setIsAssigning(true);
        await onAssign(assigneeId || null);
        setIsAssigning(false);
    };

    const handleUpdateStatus = async () => {
        setIsUpdatingStatus(true);
        await onUpdateStatus(status);
        setIsUpdatingStatus(false);
    };
    
    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
    }

    return (
        <div className="sticky top-2 z-10 bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg shadow-md mb-4 flex items-center justify-between gap-4 animate-fade-in flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-slate-800 dark:text-white">{selectedCount} selected</span>
                
                {/* Assign action */}
                <div className="flex items-center gap-2">
                    <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="text-xs p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                        <option value="">Assign to...</option>
                        {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button onClick={handleAssign} disabled={!assigneeId || isAssigning} className="px-3 py-1.5 text-xs bg-slate-600 text-white rounded-md disabled:opacity-50">
                        {isAssigning ? <Spinner size="sm" /> : 'Assign'}
                    </button>
                </div>
                
                {/* Status action */}
                <div className="flex items-center gap-2">
                    <select value={status} onChange={e => setStatus(e.target.value as any)} className="text-xs p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
                        <option value="treated">Mark as Treated</option>
                        <option value="pending">Mark as Pending</option>
                    </select>
                    <button onClick={handleUpdateStatus} disabled={isUpdatingStatus} className="px-3 py-1.5 text-xs bg-slate-600 text-white rounded-md disabled:opacity-50">
                        {isUpdatingStatus ? <Spinner size="sm" /> : 'Apply'}
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={onOpenAIBulkResponseModal} className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-md flex items-center gap-1 disabled:opacity-50">
                    <WandIcon className="w-4 h-4" />
                    AI Bulk Response
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md flex items-center gap-1 disabled:opacity-50">
                    {isDeleting ? <Spinner size="sm" /> : <><TrashIcon className="w-4 h-4" /> Delete</>}
                </button>
                <button onClick={onClear} className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline">Clear</button>
            </div>
        </div>
    );
};


const AssigneeDropdown: React.FC<{
    report: ReportRecord;
    users: UserProfile[];
    onAssignReport: (reportId: number, assigneeId: string | null) => void;
}> = ({ report, users, onAssignReport }) => {
    const assignableUsers = users.filter(u => ['Admin', 'Principal', 'Team Lead', 'Counselor', 'Teacher'].includes(u.role));
    return (
        <select
            value={report.assignee_id || ''}
            onChange={(e) => onAssignReport(report.id, e.target.value || null)}
            className="text-xs border-slate-300/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 rounded-md p-1"
        >
            <option value="">Unassigned</option>
            {assignableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
            ))}
        </select>
    );
};

const ReportCard: React.FC<{
    report: ReportRecord;
    users: UserProfile[];
    currentUser: UserProfile;
    onViewAnalysis: (report: ReportRecord) => void;
    onGenerateCommunication: (report: ReportRecord) => void;
    onAssignReport: (reportId: number, assigneeId: string | null) => void;
    onAddComment: (reportId: number, commentText: string) => Promise<void>;
    userPermissions: string[];
    onDeleteReport: (reportId: number) => Promise<void>;
    onRespond: (report: ReportRecord) => void;
    onMoveToPending: (reportId: number) => Promise<boolean>;
    isSelected: boolean;
    onSelect: (id: number) => void;
}> = ({ report, users, currentUser, onViewAnalysis, onGenerateCommunication, onAssignReport, onAddComment, userPermissions, onDeleteReport, onRespond, onMoveToPending, isSelected, onSelect }) => {
    const { analysis, comments = [] } = report;
    const canAssign = userPermissions.includes('assign-reports') || userPermissions.includes('*');
    const canComment = userPermissions.includes('comment-on-reports') || userPermissions.includes('*');

    const canDeleteAnyReport = userPermissions.includes('delete-any-report');
    const isAuthor = report.author_id === currentUser.id;
    const reportDate = new Date(report.created_at);
    const now = new Date();
    const minutesSinceCreation = (now.getTime() - reportDate.getTime()) / (1000 * 60);
    const isWithinDeletionWindow = minutesSinceCreation < 10;
    
    const canDelete = canDeleteAnyReport || (isAuthor && isWithinDeletionWindow);
    const minutesLeft = Math.ceil(10 - minutesSinceCreation);

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to permanently delete this report? This action cannot be undone.')) {
            onDeleteReport(report.id);
        }
    };

    const sentimentColors = {
        Positive: 'bg-green-500/20 text-green-800 dark:text-green-300 border-green-400',
        Negative: 'bg-red-500/20 text-red-800 dark:text-red-300 border-red-400',
        Neutral: 'bg-slate-500/20 text-slate-800 dark:text-slate-300 border-slate-400',
    };
    const urgencyColors = {
        Critical: 'bg-red-600 text-white',
        High: 'bg-orange-500 text-white',
        Medium: 'bg-yellow-500 text-yellow-900',
        Low: 'bg-blue-500 text-white',
    };

    return (
        <div className={`rounded-2xl border bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 card-hover flex gap-4 transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200/60'}`}>
            <div className="flex-shrink-0 pt-1">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(report.id)}
                    className="h-5 w-5 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                />
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">{report.report_type} Report #{report.id}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">By {report.author?.name || 'Unknown'} on {new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold flex-shrink-0">
                        {analysis && <span className={`px-2 py-1 rounded-full border ${sentimentColors[analysis.sentiment]}`}>{analysis.sentiment}</span>}
                        {analysis && <span className={`px-2 py-1 rounded-full ${urgencyColors[analysis.urgency]}`}>{analysis.urgency}</span>}
                        {report.status === 'treated' && <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-800 dark:text-green-300">Treated ✅</span>}
                    </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-3 whitespace-pre-wrap">{report.report_text}</p>
                
                {report.response && (
                    <div className="mt-4 p-3 bg-green-500/10 rounded-lg border-l-4 border-green-500">
                        <h4 className="font-semibold text-sm text-green-800 dark:text-green-300">Response & Action Taken</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 whitespace-pre-wrap">{report.response}</p>
                    </div>
                )}
                
                <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2">Assigned To:</label>
                        {canAssign ? (
                            <AssigneeDropdown report={report} users={users} onAssignReport={onAssignReport} />
                        ) : (
                            <span className="text-sm font-medium text-slate-800 dark:text-white">{report.assignee?.name || 'Unassigned'}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                         {report.status === 'treated' ? (
                            <button onClick={() => onMoveToPending(report.id)} className="px-3 py-1 bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-lg hover:bg-yellow-500/30">To Pending</button>
                         ) : (
                            <button onClick={() => onRespond(report)} className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">Respond</button>
                         )}
                        <button
                            onClick={() => onGenerateCommunication(report)}
                            className="flex items-center gap-2 px-3 py-1 bg-slate-500/20 text-slate-800 dark:text-white text-xs font-semibold rounded-lg hover:bg-slate-500/30"
                        >
                            <WandIcon className="w-3 h-3" />
                            Auto
                        </button>
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                title="Delete Report"
                                className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-semibold rounded-lg hover:bg-red-500/20"
                            >
                                <TrashIcon className="w-3 h-3" />
                                {isAuthor && isWithinDeletionWindow && !canDeleteAnyReport && `(${minutesLeft}m)`}
                            </button>
                        )}
                        <button
                            onClick={() => onViewAnalysis(report)}
                            className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700"
                        >
                            AI Summary
                        </button>
                    </div>
                </div>

                {canComment && (
                    <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Comments ({comments.length})</h4>
                        {comments.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-3">
                                {comments.map(comment => (
                                    <div key={comment.id} className="text-xs p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{comment.author?.name || 'Unknown'}: </span>
                                        <span className="text-slate-600 dark:text-slate-300">{comment.comment_text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <CommentForm onSubmit={(text) => onAddComment(report.id, text)} users={users} />
                    </div>
                )}
            </div>
        </div>
    );
};

interface ReportFeedProps {
  reports: ReportRecord[];
  users: UserProfile[];
  tasks: Task[];
  currentUser: UserProfile;
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onAssignReport: (reportId: number, assigneeId: string | null) => void;
  onAddComment: (reportId: number, commentText: string) => Promise<void>;
  onDeleteReport: (reportId: number) => Promise<void>;
  onUpdateReportStatusAndResponse: (reportId: number, status: 'pending' | 'treated', responseText: string | null) => Promise<boolean>;
  userPermissions: string[];
  onBulkDeleteReports: (reportIds: number[]) => Promise<void>;
  onBulkAssignReports: (reportIds: number[], assigneeId: string | null) => Promise<void>;
  onBulkUpdateReportStatus: (reportIds: number[], status: 'pending' | 'treated') => Promise<void>;
  onOpenAIBulkResponseModal: (reportIds: number[]) => void;
  students: Student[];
}

const ReportFeed: React.FC<ReportFeedProps> = (props) => {
    const { reports, addToast, tasks, users, currentUser, onAssignReport, onAddComment, userPermissions, onDeleteReport, onUpdateReportStatusAndResponse, onBulkDeleteReports, onBulkAssignReports, onBulkUpdateReportStatus, onOpenAIBulkResponseModal } = props;
    const [reportToAnalyze, setReportToAnalyze] = useState<ReportRecord | null>(null);
    const [reportForCommunication, setReportForCommunication] = useState<ReportRecord | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'treated'>('pending');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'urgency-desc'>('date-desc');
    const [respondingTo, setRespondingTo] = useState<ReportRecord | null>(null);
    const [selectedReportIds, setSelectedReportIds] = useState<Set<number>>(new Set());
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
    
    // Search & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const urgencyOrder: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

    const { pendingReports, treatedReports } = useMemo(() => {
        const pending = reports.filter(r => r.status === 'pending' || !r.status);
        const treated = reports.filter(r => r.status === 'treated');
        return { pendingReports: pending, treatedReports: treated };
    }, [reports]);

    // 1. Filter by Tab
    const reportsInTab = activeTab === 'pending' ? pendingReports : treatedReports;

    // 2. Filter by Search & Date, then Sort
    const processedReports = useMemo(() => {
        let filtered = reportsInTab;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(r => 
                r.report_text.toLowerCase().includes(q) || 
                r.author?.name.toLowerCase().includes(q) ||
                r.report_type.toLowerCase().includes(q)
            );
        }

        if (searchDate) {
            filtered = filtered.filter(r => r.created_at.startsWith(searchDate));
        }

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'urgency-desc':
                    return (urgencyOrder[b.analysis?.urgency || 'Low'] || 0) - (urgencyOrder[a.analysis?.urgency || 'Low'] || 0);
                case 'date-asc':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'date-desc':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });
    }, [reportsInTab, searchQuery, searchDate, sortBy]);

    // 3. Paginate
    const totalPages = Math.ceil(processedReports.length / ITEMS_PER_PAGE);
    const paginatedReports = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedReports.slice(start, start + ITEMS_PER_PAGE);
    }, [processedReports, currentPage]);

    useEffect(() => {
        setSelectedReportIds(new Set());
        setCurrentPage(1); // Reset to first page on tab/filter change
    }, [activeTab, searchQuery, searchDate]);

    // Update Checkbox Logic (applies to currently visible page)
    useEffect(() => {
        if (paginatedReports.length === 0) {
             if(selectAllCheckboxRef.current) {
                 selectAllCheckboxRef.current.checked = false;
                 selectAllCheckboxRef.current.indeterminate = false;
             }
             return;
        }
        const allOnPageSelected = paginatedReports.every(r => selectedReportIds.has(r.id));
        const someOnPageSelected = paginatedReports.some(r => selectedReportIds.has(r.id));

        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.checked = allOnPageSelected;
            selectAllCheckboxRef.current.indeterminate = someOnPageSelected && !allOnPageSelected;
        }
    }, [selectedReportIds, paginatedReports]);

    const handleSelectReport = (id: number) => {
        setSelectedReportIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleSelectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const newSet = new Set(selectedReportIds);
            paginatedReports.forEach(r => newSet.add(r.id));
            setSelectedReportIds(newSet);
        } else {
            const newSet = new Set(selectedReportIds);
            paginatedReports.forEach(r => newSet.delete(r.id));
            setSelectedReportIds(newSet);
        }
    };
    
    if (reportToAnalyze) {
        return <ReportAnalysis report={reportToAnalyze} allTasks={tasks} onBack={() => setReportToAnalyze(null)} />
    }
    
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Report Feed</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">View and action all submitted reports.</p>
            </div>
            
             {/* Toolbar: Tabs + Filters + Sort */}
             <div className="flex flex-col gap-4">
                <div className="flex border-b border-slate-200/60 dark:border-slate-700/60">
                    <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${activeTab === 'pending' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:border-slate-300'}`}>
                        Pending ({pendingReports.length})
                    </button>
                    <button onClick={() => setActiveTab('treated')} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${activeTab === 'treated' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:border-slate-300'}`}>
                        Treated ({treatedReports.length})
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                     <div className="flex items-center gap-4 flex-grow w-full md:w-auto">
                         <div className="relative flex-grow max-w-md">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search reports..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                         </div>
                         <div className="relative">
                             <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                                type="date" 
                                value={searchDate} 
                                onChange={e => setSearchDate(e.target.value)} 
                                className="pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                             />
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                ref={selectAllCheckboxRef}
                                onChange={handleSelectAllVisible}
                                className="h-4 w-4 rounded border-slate-400"
                                id="select-all-page"
                            />
                            <label htmlFor="select-all-page" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">Select Page</label>
                        </div>
                        <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="p-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 outline-none">
                            <option value="date-desc">Newest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="urgency-desc">By Urgency</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {selectedReportIds.size > 0 && (
                <BulkActionBar 
                    selectedCount={selectedReportIds.size}
                    users={users}
                    onClear={() => setSelectedReportIds(new Set())}
                    onAssign={async (assigneeId) => {
                        await onBulkAssignReports(Array.from(selectedReportIds), assigneeId);
                        setSelectedReportIds(new Set());
                    }}
                    onUpdateStatus={async (status) => {
                        await onBulkUpdateReportStatus(Array.from(selectedReportIds), status);
                        setSelectedReportIds(new Set());
                    }}
                    onDelete={async () => {
                        if(window.confirm(`Are you sure you want to delete ${selectedReportIds.size} reports? This cannot be undone.`)){
                            await onBulkDeleteReports(Array.from(selectedReportIds));
                            setSelectedReportIds(new Set());
                        }
                    }}
                    onOpenAIBulkResponseModal={() => {
                        onOpenAIBulkResponseModal(Array.from(selectedReportIds));
                    }}
                />
            )}
            
            <div className="space-y-4">
                {paginatedReports.length > 0 ? (
                    paginatedReports.map(report => (
                        <ReportCard 
                          key={report.id} 
                          report={report}
                          users={users}
                          currentUser={currentUser}
                          onViewAnalysis={setReportToAnalyze}
                          onGenerateCommunication={setReportForCommunication}
                          onAssignReport={onAssignReport}
                          onAddComment={onAddComment}
                          userPermissions={userPermissions}
                          onDeleteReport={onDeleteReport}
                          onRespond={setRespondingTo}
                          onMoveToPending={(id) => onUpdateReportStatusAndResponse(id, 'pending', null)}
                          isSelected={selectedReportIds.has(report.id)}
                          onSelect={handleSelectReport}
                        />
                    ))
                ) : (
                    <div className="text-center py-16 rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
                        <p className="text-slate-500 dark:text-slate-400">No reports found matching your criteria.</p>
                    </div>
                )}
            </div>
            
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={processedReports.length}
            />

            <AutomatedCommunicationModal
                isOpen={!!reportForCommunication}
                onClose={() => setReportForCommunication(null)}
                report={reportForCommunication}
            />
            <AIResponseModal
                report={respondingTo}
                onClose={() => setRespondingTo(null)}
                onSave={async (reportId, responseText) => {
                    const success = await onUpdateReportStatusAndResponse(reportId, 'treated', responseText);
                    if (success) {
                        setRespondingTo(null);
                    }
                    return success;
                }}
                users={users}
            />
        </div>
    );
};

export default ReportFeed;
