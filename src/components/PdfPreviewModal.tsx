import React from 'react';

/**
 * A modal component to display a PDF preview from a blob URL.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Whether the modal is visible.
 * @param {() => void} props.onClose - Callback to close the modal.
 * @param {string | null} props.pdfBlobUrl - The URL created from URL.createObjectURL().
 */
const PdfPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  pdfBlobUrl: string | null;
}> = ({ isOpen, onClose, pdfBlobUrl }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-4">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">PDF Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white text-2xl font-bold"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="flex-grow">
          {pdfBlobUrl ? (
            <object
              data={pdfBlobUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              className="rounded-b-lg"
            >
              <p className="p-4 text-center text-red-600">
                It appears your browser does not support embedding PDFs.
                Please <a href={pdfBlobUrl} download="preview.pdf" className="text-blue-600 underline">download the PDF</a> to view it.
              </p>
            </object>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Generating PDF preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;