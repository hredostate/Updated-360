import React, { useState } from 'react';
import Spinner from './common/Spinner';
import { MegaphoneIcon } from './common/icons';

interface EmergencyBroadcastProps {
  onSendBroadcast: (title: string, message: string) => Promise<void>;
}

const EmergencyBroadcast: React.FC<EmergencyBroadcastProps> = ({ onSendBroadcast }) => {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('Urgent School-Wide Alert');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !title.trim()) return;
    setShowConfirmation(false);
    setIsLoading(true);
    await onSendBroadcast(title, message);
    setIsLoading(false);
    setMessage('');
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <MegaphoneIcon className="w-8 h-8 mr-3 text-red-600"/>
            Emergency Broadcast
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Send an urgent alert to all staff members. This should be used for critical information only.</p>
      </div>

      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-xl shadow-xl dark:border-red-500/40 dark:bg-red-900/20">
        <div className="space-y-4">
           <div>
              <label htmlFor="broadcast-title" className="block text-sm font-medium text-red-800 dark:text-red-200">Broadcast Title</label>
              <input 
                id="broadcast-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full p-2 bg-white/50 dark:bg-slate-800/50 border border-red-300/60 dark:border-red-700/60 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>
          <div>
            <label htmlFor="broadcast-message" className="block text-sm font-medium text-red-800 dark:text-red-200">Message</label>
            <textarea
              id="broadcast-message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Example: The school is now under lockdown. Please follow all safety protocols immediately."
              className="mt-1 w-full p-2 bg-white/50 dark:bg-slate-800/50 border border-red-300/60 dark:border-red-700/60 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={isLoading || !message.trim() || !title.trim()}
            className="w-full px-6 py-3 bg-red-600 text-white font-bold text-lg rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center justify-center"
          >
            {isLoading ? <Spinner /> : 'SEND BROADCAST'}
          </button>
        </div>
      </div>
      
      {showConfirmation && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="rounded-xl bg-white dark:bg-slate-800 p-6 shadow-lg max-w-sm w-full">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Are you absolutely sure?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">This will send an alert to <strong className="text-red-600 dark:text-red-400">all staff members immediately</strong>. This action cannot be undone.</p>
                <div className="flex justify-end space-x-3 mt-4">
                    <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-md">Cancel</button>
                    <button onClick={handleSend} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md">Yes, Send Alert</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default EmergencyBroadcast;
