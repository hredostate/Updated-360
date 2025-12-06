import React, { useState } from 'react';
import type { PolicyInquiry } from '../../types';
import Spinner from '../common/Spinner';
import { BookOpenIcon } from '../common/icons';

interface PolicyInquiryWidgetProps {
    inquiries: PolicyInquiry[];
    onGenerate: () => Promise<void>;
}

const PolicyInquiryWidget: React.FC<PolicyInquiryWidgetProps> = ({ inquiries, onGenerate }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        await onGenerate();
        setIsLoading(false);
    };

    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5" />
                AI Policy &amp; Practice Inquiry
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="flex justify-center items-center py-8"><Spinner /></div>
                ) : inquiries.length > 0 ? (
                    inquiries.map(inquiry => (
                         <div key={inquiry.id} className="p-3 bg-indigo-500/10 rounded-lg border-l-4 border-indigo-400">
                             <p className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-300">{inquiry.category}</p>
                             <p className="font-semibold text-sm text-slate-800 dark:text-white mt-1">{inquiry.question}</p>
                             <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-1">Context: {inquiry.context}</p>
                         </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500">No current inquiries.</p>
                        <p className="text-xs text-slate-400 mt-1">Click below to analyze recent data for potential policy gaps.</p>
                    </div>
                )}
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full mt-3 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center"
            >
                {isLoading ? <Spinner size="sm" /> : 'Analyze for Inquiries'}
            </button>
        </div>
    );
};

export default PolicyInquiryWidget;