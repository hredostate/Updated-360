
import React, { useState, useRef } from 'react';
import { DownloadIcon, UploadCloudIcon } from './common/icons';
import Spinner from './common/Spinner';
import type { CreatedCredential } from '../types';
import { exportToCsv } from '../utils/export';

interface DataUploaderProps {
  onBulkAddStudents: (students: any[]) => Promise<{ success: boolean; message: string; credentials?: CreatedCredential[] }>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ResultsModal: React.FC<{
    results: CreatedCredential[];
    onClose: () => void;
}> = ({ results, onClose }) => {
    const handleExport = () => {
        exportToCsv(results, 'new_student_credentials.csv');
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-3xl m-4 flex flex-col max-h-[90vh]">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Upload Results</h2>
                
                <div className="my-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                    <p className="font-bold">Important: Download Credentials Now</p>
                    <p className="text-sm mt-1">For security, temporary passwords are shown only once. Please export the CSV and store it securely before closing this window. Passwords cannot be recovered after this step.</p>
                </div>

                <div className="flex-grow my-4 overflow-y-auto border-y border-slate-200/60 dark:border-slate-700/60">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-slate-500/10 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Password</th>
                                <th className="px-4 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((res, index) => (
                                <tr key={index} className="border-b border-slate-200/60 dark:border-slate-700/60">
                                    <td className="px-4 py-2 font-medium">{res.name}</td>
                                    <td className="px-4 py-2">{res.email || '-'}</td>
                                    <td className="px-4 py-2 font-mono">{res.password || 'N/A'}</td>
                                    <td className="px-4 py-2">
                                        {res.status === 'Failed' || res.status === 'Error' ? (
                                            <div className="flex flex-col">
                                                <span className="text-red-600 font-bold">Failed</span>
                                                {/* @ts-ignore - Error prop might exist on failed items */}
                                                <span className="text-xs text-red-500">{res.error || 'Unknown error'}</span>
                                            </div>
                                        ) : (
                                            <span className="text-green-600 font-semibold">{res.status}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex-shrink-0 flex justify-end gap-4">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
                        <DownloadIcon className="w-5 h-5" />
                        Export CSV
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-500/20 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-500/30">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const DataUploader: React.FC<DataUploaderProps> = ({ onBulkAddStudents, addToast }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<CreatedCredential[] | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);

        try {
            const text = await file.text();
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                throw new Error("CSV file must have a header row and at least one data row.");
            }
            
            const headers = lines[0].split(',').map(h => h.trim());
            const studentsData = lines.slice(1).map(line => {
                // Improved CSV splitting to handle quoted strings (e.g., "Doe, John")
                const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                return headers.reduce((obj, header, index) => {
                    let value = values[index]?.trim() || '';
                    // Remove surrounding quotes if present
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    (obj as any)[header] = value;
                    return obj;
                }, {});
            });

            const { success, message, credentials } = await onBulkAddStudents(studentsData);
            addToast(message, success ? 'success' : 'error');
            if (credentials) {
                setResults(credentials);
            }
        } catch (error: any) {
            addToast(error.message, 'error');
        }

        setIsLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const downloadTemplate = () => {
        const headers = ['name', 'admission_number', 'class_name', 'arm_name', 'email', 'date_of_birth', 'parent_phone_number_1'];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bulk Data Uploader</h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Create student accounts by uploading a CSV file. Existing students (matched by Admission No. or Name) will be reset.</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40">
                    <h2 className="text-xl font-bold">Upload Student Data</h2>
                    <p className="text-sm text-slate-500 mt-2">
                        Recommended headers: <code>name</code>, <code>admission_number</code>, <code>class_name</code>, <code>arm_name</code>.
                        <br/>
                        The 'class_name' should match a class in the system (e.g., "JSS 1"). If <code>admission_number</code> matches an existing record, it will be overwritten.
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                        <button onClick={downloadTemplate} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
                            <DownloadIcon className="w-5 h-5" />
                            Download Template
                        </button>
                        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer">
                            <UploadCloudIcon className="w-5 h-5" />
                            <span>{isLoading ? 'Processing...' : 'Upload CSV File'}</span>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" disabled={isLoading} />
                        </label>
                        {isLoading && <Spinner />}
                    </div>
                </div>
            </div>
            {results && <ResultsModal results={results} onClose={() => setResults(null)} />}
        </>
    );
};

export default DataUploader;
