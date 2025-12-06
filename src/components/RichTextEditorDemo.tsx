import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import PdfPreviewModal from './PdfPreviewModal';
import Spinner from './common/Spinner';

const RichTextEditorDemo = () => {
  const [title, setTitle] = useState('');
  const [bodyHtml, setBodyHtml] = useState('<p>Welcome to TinyMCE!</p>');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Clean up the blob URL when the modal is closed to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);
  
  const handleSave = async () => {
    // This function simulates saving to a standard Express backend.
    // In a real scenario, you would replace this with your actual API client (e.g., Supabase client).
    setSaveMessage('Saving...');
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, bodyHtml }),
      });

      if (!response.ok) {
        // Since we don't have a real backend, we'll simulate a failure for demonstration.
        throw new Error('Simulated network error: POST /api/report failed');
      }
      setSaveMessage('Report saved successfully!');
    } catch (error: any) {
        // In this demo, the fetch will always fail. We'll show a message explaining this.
        console.error('Save error:', error);
        setSaveMessage(`Save failed. Note: This is a demo. The backend route /api/report needs to be implemented separately. Error: ${error.message}`);
    } finally {
        setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const generatePdf = async () => {
    // This function calls the backend route responsible for PDF generation.
    // NOTE: For this to work, you must deploy the Express route code provided separately.
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: bodyHtml, title }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF generation failed: ${errorText}`);
      }
      return response.blob();
    } catch (error: any) {
      console.error('PDF generation error:', error);
      alert(`Error generating PDF. Make sure your /api/export-pdf backend route is running. Details: ${error.message}`);
      return null;
    }
  };
  
  const handleDownloadPdf = async () => {
    setIsLoadingPdf(true);
    const pdfBlob = await generatePdf();
    setIsLoadingPdf(false);

    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/ /g, '_') || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePreviewPdf = async () => {
    setIsLoadingPdf(true);
    setIsPreviewOpen(true); // Open modal immediately to show loading state
    setPdfUrl(null); // Clear previous PDF

    const pdfBlob = await generatePdf();
    setIsLoadingPdf(false);

    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } else {
      // If PDF generation fails, close the modal
      setIsPreviewOpen(false);
    }
  };
  
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPdfUrl(null);
  };

  const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

  if (!TINYMCE_API_KEY || TINYMCE_API_KEY === 'no-api-key') {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="font-bold text-red-800">TinyMCE API Key Missing</p>
        <p className="text-sm text-red-700">Please get a free API key from tiny.cloud and add it to your .env file as <code>VITE_TINYMCE_API_KEY</code>.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6 bg-gray-50 dark:bg-slate-800/50 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rich Text Editor &amp; PDF Demo</h1>
      
      <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200">
        <p className="font-bold">Developer Note:</p>
        <p className="text-sm">The "Download" and "Preview" buttons require the provided Express backend route to be running on a separate server to handle PDF generation. The frontend is wired to call <code>/api/export-pdf</code> as requested.</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Report Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., Q3 Financial Summary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Report Body
        </label>
        <div className="mt-1 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
           <Editor
            apiKey={TINYMCE_API_KEY}
            value={bodyHtml}
            onEditorChange={setBodyHtml}
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
                'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'ai', 'uploadcare', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown','importword', 'exportword', 'exportpdf'
              ],
              toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat | importword exportword exportpdf',
              tinycomments_mode: 'embedded',
              tinycomments_author: 'Author name',
              mergetags_list: [
                { value: 'First.Name', title: 'First Name' },
                { value: 'Email', title: 'Email' },
              ],
              ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
              uploadcare_public_key: '9d0546a4ce7f8f747be4',
              skin: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "oxide-dark" : "oxide",
              content_css: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "dark" : "default",
            }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-600 dark:text-slate-400">{saveMessage}</div>
        <div className="flex justify-end space-x-4">
            <button
            onClick={handlePreviewPdf}
            disabled={isLoadingPdf || !bodyHtml}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50"
            >
            {isLoadingPdf ? <Spinner size="sm" /> : 'Preview PDF'}
            </button>
            <button
            onClick={handleDownloadPdf}
            disabled={isLoadingPdf || !bodyHtml}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
            {isLoadingPdf ? <Spinner size="sm" /> : 'Download as PDF'}
            </button>
            <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
            Save Report
            </button>
        </div>
      </div>

      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        pdfBlobUrl={pdfUrl}
      />
    </div>
  );
};

export default RichTextEditorDemo;