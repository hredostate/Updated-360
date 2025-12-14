import React, { useState, useEffect, useMemo } from 'react';
import type { ZeroScoreEntry } from '../types';
import { supa as supabase } from '../offline/client';
import Spinner from './common/Spinner';
import { CheckCircleIcon, XCircleIcon, TrashIcon, UserMinusIcon, FilterIcon } from './common/icons';

interface ZeroScoreReviewPanelProps {
    termId: number;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    userPermissions: string[];
}

const ZeroScoreReviewPanel: React.FC<ZeroScoreReviewPanelProps> = ({ termId, addToast, userPermissions }) => {
    const [zeroScores, setZeroScores] = useState<ZeroScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterSubject, setFilterSubject] = useState<string>('all');
    const [filterReviewed, setFilterReviewed] = useState<'all' | 'reviewed' | 'unreviewed'>('unreviewed');
    const [selectedEntry, setSelectedEntry] = useState<ZeroScoreEntry | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    const [showUnenrollConfirm, setShowUnenrollConfirm] = useState<ZeroScoreEntry | null>(null);

    useEffect(() => {
        fetchZeroScores();
    }, [termId]);

    const fetchZeroScores = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('zero_score_entries')
                .select(`
                    *,
                    student:students(id, name),
                    teacher:user_profiles!teacher_user_id(id, name),
                    academic_class:academic_classes(id, name)
                `)
                .eq('term_id', termId)
                .order('entry_date', { ascending: false })
                .limit(5000);

            if (error) throw error;
            setZeroScores(data || []);
        } catch (error: any) {
            addToast(`Error loading zero score entries: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkReviewed = async (entryId: number) => {
        setIsProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('zero_score_entries')
                .update({
                    reviewed: true,
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                    review_notes: reviewNotes || null
                })
                .eq('id', entryId);

            if (error) throw error;

            addToast('Entry marked as reviewed', 'success');
            setSelectedEntry(null);
            setReviewNotes('');
            await fetchZeroScores();
        } catch (error: any) {
            addToast(`Error updating entry: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkReview = async () => {
        if (selectedEntries.size === 0) {
            addToast('No entries selected', 'info');
            return;
        }

        setIsProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('zero_score_entries')
                .update({
                    reviewed: true,
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString()
                })
                .in('id', Array.from(selectedEntries));

            if (error) throw error;

            addToast(`${selectedEntries.size} entries marked as reviewed`, 'success');
            setSelectedEntries(new Set());
            await fetchZeroScores();
        } catch (error: any) {
            addToast(`Error updating entries: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnenrollStudent = async (entry: ZeroScoreEntry) => {
        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('score_entries')
                .delete()
                .eq('student_id', entry.student_id)
                .eq('subject_name', entry.subject_name)
                .eq('term_id', entry.term_id);

            if (error) throw error;

            addToast('Student unenrolled from subject', 'success');
            setShowUnenrollConfirm(null);
            await fetchZeroScores();
        } catch (error: any) {
            addToast(`Error unenrolling student: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteEntry = async (entryId: number) => {
        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('zero_score_entries')
                .delete()
                .eq('id', entryId);

            if (error) throw error;

            addToast('Zero score entry deleted', 'success');
            setShowDeleteConfirm(null);
            await fetchZeroScores();
        } catch (error: any) {
            addToast(`Error deleting entry: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleSelection = (id: number) => {
        const newSelection = new Set(selectedEntries);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedEntries(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedEntries.size === filteredEntries.length) {
            setSelectedEntries(new Set());
        } else {
            setSelectedEntries(new Set(filteredEntries.map(e => e.id)));
        }
    };

    const filteredEntries = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return [];
        
        let filtered = [...zeroScores];

        if (filterReviewed === 'reviewed') {
            filtered = filtered.filter(e => e.reviewed);
        } else if (filterReviewed === 'unreviewed') {
            filtered = filtered.filter(e => !e.reviewed);
        }

        if (filterClass !== 'all') {
            const classId = Number(filterClass);
            if (!isNaN(classId)) {
                filtered = filtered.filter(e => e.academic_class_id === classId);
            }
        }

        if (filterSubject !== 'all') {
            filtered = filtered.filter(e => e.subject_name === filterSubject);
        }

        return filtered;
    }, [zeroScores, filterReviewed, filterClass, filterSubject]);

    const uniqueClasses = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return [];
        const classMap = new Map();
        zeroScores.forEach(z => {
            if (z.academic_class && !classMap.has(z.academic_class_id)) {
                classMap.set(z.academic_class_id, z.academic_class);
            }
        });
        return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [zeroScores]);

    const uniqueSubjects = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return [];
        return [...new Set(zeroScores.map(z => z.subject_name))].sort();
    }, [zeroScores]);

    const stats = useMemo(() => {
        if (!zeroScores || !Array.isArray(zeroScores)) return { total: 0, reviewed: 0, unreviewed: 0, bySubject: {} };
        
        const total = zeroScores.length;
        const reviewed = zeroScores.filter(z => z.reviewed).length;
        const unreviewed = total - reviewed;
        
        const bySubject: Record<string, number> = {};
        zeroScores.filter(z => !z.reviewed).forEach(z => {
            bySubject[z.subject_name] = (bySubject[z.subject_name] || 0) + 1;
        });
        
        return { total, reviewed, unreviewed, bySubject };
    }, [zeroScores]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Zero Scores</h3>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Unreviewed</h3>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.unreviewed}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Reviewed</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.reviewed}</p>
                </div>
            </div>

            {/* Subject Breakdown */}
            {stats.unreviewed > 0 && Object.keys(stats.bySubject).length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Unreviewed by Subject</h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.bySubject)
                            .sort(([, a], [, b]) => b - a)
                            .map(([subject, count]) => (
                                <span
                                    key={subject}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                >
                                    {subject}: <span className="font-bold text-orange-600 dark:text-orange-400">{count}</span>
                                </span>
                            ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <FilterIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Review Status
                        </label>
                        <select
                            value={filterReviewed}
                            onChange={(e) => setFilterReviewed(e.target.value as any)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">All</option>
                            <option value="unreviewed">Unreviewed</option>
                            <option value="reviewed">Reviewed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Class
                        </label>
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">All Classes</option>
                            {uniqueClasses.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Subject
                        </label>
                        <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">All Subjects</option>
                            {uniqueSubjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedEntries.size > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {selectedEntries.size} {selectedEntries.size === 1 ? 'entry' : 'entries'} selected
                        </span>
                        <button
                            onClick={handleBulkReview}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : 'Mark as Reviewed'}
                        </button>
                    </div>
                </div>
            )}

            {/* Entries Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-3 py-2 text-left">
                                    <input
                                        type="checkbox"
                                        checked={filteredEntries.length > 0 && selectedEntries.size === filteredEntries.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300 dark:border-slate-600"
                                    />
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Class
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Score
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Teacher
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No zero score entries found
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-3 py-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedEntries.has(entry.id)}
                                                onChange={() => toggleSelection(entry.id)}
                                                className="rounded border-slate-300 dark:border-slate-600"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-900 dark:text-white">
                                            {entry.student?.name || 'Unknown'}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-900 dark:text-white">
                                            {entry.subject_name}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-900 dark:text-white">
                                            {entry.academic_class?.name || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-900 dark:text-white">
                                            {entry.total_score}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(entry.entry_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-slate-900 dark:text-white">
                                            {entry.teacher?.name || 'Unknown'}
                                        </td>
                                        <td className="px-3 py-2 text-sm">
                                            {entry.reviewed ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                    <CheckCircleIcon className="w-3 h-3" />
                                                    Reviewed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                                                    <XCircleIcon className="w-3 h-3" />
                                                    Unreviewed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex gap-1">
                                                {!entry.reviewed && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedEntry(entry);
                                                            setReviewNotes('');
                                                        }}
                                                        className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                                        title="Review"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setShowUnenrollConfirm(entry)}
                                                    className="p-1 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                                                    title="Unenroll Student"
                                                >
                                                    <UserMinusIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(entry.id)}
                                                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    title="Delete Entry"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                Review Zero Score Entry
                            </h2>
                            
                            <div className="space-y-3 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Student</label>
                                        <p className="text-sm text-slate-900 dark:text-white">{selectedEntry.student?.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Subject</label>
                                        <p className="text-sm text-slate-900 dark:text-white">{selectedEntry.subject_name}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Class</label>
                                        <p className="text-sm text-slate-900 dark:text-white">{selectedEntry.academic_class?.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Score</label>
                                        <p className="text-sm text-slate-900 dark:text-white">{selectedEntry.total_score}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Teacher</label>
                                        <p className="text-sm text-slate-900 dark:text-white">{selectedEntry.teacher?.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Entry Date</label>
                                        <p className="text-sm text-slate-900 dark:text-white">
                                            {new Date(selectedEntry.entry_date).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                {selectedEntry.teacher_comment && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher Comment</label>
                                        <p className="text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 p-2 rounded">
                                            {selectedEntry.teacher_comment}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Review Notes (Optional)
                                    </label>
                                    <textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        placeholder="Enter your review notes..."
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedEntry(null);
                                        setReviewNotes('');
                                    }}
                                    className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleMarkReviewed(selectedEntry.id)}
                                    disabled={isProcessing}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? 'Marking...' : 'Mark as Reviewed'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Zero Score Entry</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            Are you sure you want to delete this zero score entry? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteEntry(showDeleteConfirm)}
                                disabled={isProcessing}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unenroll Confirmation Modal */}
            {showUnenrollConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Unenroll Student</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            Are you sure you want to unenroll <strong>{showUnenrollConfirm.student?.name}</strong> from{' '}
                            <strong>{showUnenrollConfirm.subject_name}</strong>? This will delete their score entry for this subject.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowUnenrollConfirm(null)}
                                className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUnenrollStudent(showUnenrollConfirm)}
                                disabled={isProcessing}
                                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Unenrolling...' : 'Unenroll'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZeroScoreReviewPanel;
