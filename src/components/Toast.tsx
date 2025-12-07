import React, { useEffect, useState } from 'react';
import type { ToastMessage } from '../types';
import { CloseIcon } from './common/icons';

interface SingleToastProps extends ToastMessage {
  onClose: (id: number) => void;
}

const SingleToast: React.FC<SingleToastProps> = ({ id, message, type, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in
    setShow(true);
    // Note: The parent component now handles the timeout for removal from the array.
    // This component just handles its own show/hide animation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose(id), 300); 
  };

  const baseClasses = "relative flex items-center w-full max-w-xs p-4 space-x-4 text-slate-600 bg-white/80 backdrop-blur-md divide-x divide-slate-200 rounded-lg shadow-lg ring-1 ring-slate-200 transition-all duration-300 ease-in-out dark:bg-slate-800/80 dark:text-slate-200 dark:divide-slate-700 dark:ring-slate-700";
  const transitionClasses = show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0';
  
  const typeStyles = {
    success: { icon: '✅', bar: 'bg-green-500' },
    error: { icon: '❌', bar: 'bg-red-500' },
    info: { icon: 'ℹ️', bar: 'bg-blue-500' },
    warning: { icon: '⚠️', bar: 'bg-yellow-500' }
  };

  const { icon, bar } = typeStyles[type] || typeStyles.info;

  return (
    <div className={`${baseClasses} ${transitionClasses}`} role="alert">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${bar} rounded-l-lg`}></div>
      <div className="pl-3 text-2xl">{icon}</div>
      <div className="pl-4 text-sm font-normal">{message}</div>
      <button
        type="button"
        className="p-1.5 -m-1.5 ml-auto inline-flex h-8 w-8 text-slate-400 bg-transparent rounded-lg hover:text-slate-900 focus:ring-2 focus:ring-slate-300 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-700"
        onClick={handleClose}
      >
        <span className="sr-only">Close</span>
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <SingleToast key={toast.id} {...toast} onClose={removeToast} />
            ))}
        </div>
    );
};

export default ToastContainer;