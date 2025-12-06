import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextFieldProps {
  value: string;
  onChange: (newHtmlString: string) => void;
  height?: number;
  toolbarPreset?: 'simple' | 'default';
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A rich text editor component that can be used as a drop-in replacement
 * for a textarea. It provides a toolbar for basic formatting and outputs HTML.
 */
const RichTextField: React.FC<RichTextFieldProps> = ({
  value,
  onChange,
  height = 200,
  toolbarPreset = 'default',
  placeholder,
  disabled = false,
}) => {
  const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

  if (!TINYMCE_API_KEY || TINYMCE_API_KEY === 'no-api-key') {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="font-bold text-red-800">TinyMCE API Key Missing</p>
        <p className="text-sm text-red-700">Please get a free API key from tiny.cloud and add it to your .env file as <code>VITE_TINYMCE_API_KEY</code>.</p>
      </div>
    );
  }

  const toolbars = {
    simple: 'undo redo | bold italic | bullist numlist',
    default: 'undo redo | blocks | bold italic underline | bullist numlist link',
  };

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
      <Editor
        apiKey={TINYMCE_API_KEY}
        value={value}
        onEditorChange={(newValue) => onChange(newValue)}
        disabled={disabled}
        init={{
          height: height,
          menubar: false,
          plugins: 'lists advlist autolink link code',
          toolbar: toolbars[toolbarPreset],
          placeholder,
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              font-size: 14px;
            }
          `,
          skin: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "oxide-dark" : "oxide",
          content_css: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "dark" : "default",
        }}
      />
    </div>
  );
};

export default RichTextField;
