import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../types';
import Spinner from './common/Spinner';

interface CommentFormProps {
  onSubmit: (commentText: string) => Promise<void>;
  users: UserProfile[];
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, users }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = mentionQuery
    ? users.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setComment(text);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setMentionQuery(mentionMatch[1]);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionClick = (user: UserProfile) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = comment.substring(0, cursorPos);
    const textAfterCursor = comment.substring(cursorPos);
    
    const textBeforeMention = textBeforeCursor.replace(/@\w*$/, '');
    const newText = `${textBeforeMention}@${user.name.replace(/\s+/g, '')} ${textAfterCursor}`;
    
    setComment(newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    await onSubmit(comment);
    setIsSubmitting(false);
    setComment('');
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex items-start space-x-3">
        <textarea
          ref={textareaRef}
          value={comment}
          onChange={handleInputChange}
          placeholder="Add a comment... Type @ to mention a user."
          rows={2}
          className="flex-1 p-2 border rounded-lg shadow-sm bg-white/50 dark:bg-slate-800/50 border-slate-300/60 dark:border-slate-700/60 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !comment.trim()}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isSubmitting ? <Spinner size="sm" /> : 'Post'}
        </button>
      </form>
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full mb-1 w-full max-w-sm bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto z-10">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => handleMentionClick(user)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm"
            >
              <span className="font-semibold">{user.name}</span>
              <span className="text-slate-500 dark:text-slate-400 ml-2">{user.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentForm;