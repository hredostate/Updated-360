import React, { useState } from 'react';
import type { AbsenceRequest } from '../types';
import { XIcon, CheckCircleIcon, XCircleIcon, UserIcon, CalendarIcon, FileTextIcon } from './common/icons';

interface AbsenceRequestReviewProps {
  request: AbsenceRequest;
  canReview: boolean;
  onApprove: (requestId: number, notes: string) => Promise<void>;
  onDeny: (requestId: number, notes: string) => Promise<void>;
  onClose: () => void;
}

const AbsenceRequestReview: React.FC<AbsenceRequestReviewProps> = ({
  request,
  canReview,
  onApprove,
  onDeny,
  onClose
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isPending = request.status === 'pending';
  const showReviewActions = canReview && isPending;

  const handleApprove = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await onApprove(request.id, reviewNotes.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!reviewNotes.trim()) {
      setError('Please provide a reason for denying this request');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onDeny(request.id, reviewNotes.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    const badges = {
      pending: { class: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Pending Review' },
      approved: { class: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Approved' },
      denied: { class: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Denied' }
    };
    const badge = badges[request.status];
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sick: 'Sick Leave',
      family: 'Family Emergency',
      appointment: 'Medical Appointment',
      vacation: 'Vacation',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const calculateDuration = () => {
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-panel rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Absence Request Details</h2>
            {getStatusBadge()}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <XIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Student Information */}
          <div className="glass-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Student Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Name:</span>
                <span className="text-white font-medium">{request.student?.name || 'Unknown'}</span>
              </div>
              {request.student?.admission_number && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Admission Number:</span>
                  <span className="text-white font-medium">{request.student.admission_number}</span>
                </div>
              )}
              {request.student?.class && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Class:</span>
                  <span className="text-white font-medium">
                    {request.student.class.name}
                    {request.student.arm && ` - ${request.student.arm.name}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="glass-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Request Details
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-400">Request Type:</span>
                <p className="text-white font-medium mt-1">{getRequestTypeLabel(request.request_type)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-400">Start Date:</span>
                  <p className="text-white mt-1">{formatDate(request.start_date)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">End Date:</span>
                  <p className="text-white mt-1">{formatDate(request.end_date)}</p>
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-400">Duration:</span>
                <p className="text-white font-medium mt-1">{calculateDuration()}</p>
              </div>

              <div>
                <span className="text-sm text-gray-400">Reason:</span>
                <p className="text-white mt-1 whitespace-pre-wrap">{request.reason}</p>
              </div>

              {request.supporting_document_url && (
                <div>
                  <span className="text-sm text-gray-400">Supporting Document:</span>
                  <a
                    href={request.supporting_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/30 w-fit"
                  >
                    <FileTextIcon className="h-4 w-4" />
                    View Document
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Requester Information */}
          <div className="glass-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Request Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Requested by:</span>
                <span className="text-white">{request.requester?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Submitted on:</span>
                <span className="text-white">
                  {new Date(request.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Review Information (if already reviewed) */}
          {!isPending && (
            <div className="glass-panel rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Review Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Reviewed by:</span>
                  <span className="text-white">{request.reviewer?.name || 'Unknown'}</span>
                </div>
                {request.reviewed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Reviewed on:</span>
                    <span className="text-white">
                      {new Date(request.reviewed_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {request.review_notes && (
                  <div>
                    <span className="text-gray-300">Review Notes:</span>
                    <p className="text-white mt-1 whitespace-pre-wrap">{request.review_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Section (if pending and can review) */}
          {showReviewActions && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Review Notes {request.status === 'pending' && <span className="text-gray-500">(Optional for approval, required for denial)</span>}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add any notes or comments about this decision..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleDeny}
                  className="px-6 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors border border-red-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <XCircleIcon className="h-5 w-5" />
                  {isSubmitting ? 'Processing...' : 'Deny Request'}
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-6 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg font-medium transition-colors border border-green-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  {isSubmitting ? 'Processing...' : 'Approve Request'}
                </button>
              </div>
            </div>
          )}

          {/* Close button for non-reviewable requests */}
          {!showReviewActions && (
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium text-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbsenceRequestReview;
