import React from 'react';

interface HtmlRendererProps {
  htmlString: string;
  className?: string;
}

/**
 * A component to safely render a string of HTML content.
 * It uses a basic 'prose' class for styling, defined in index.css.
 */
const HtmlRenderer: React.FC<HtmlRendererProps> = ({ htmlString, className }) => {
  // Basic sanitization: this is not a full XSS-proof sanitizer,
  // but it prevents simple script injection for this trusted-source context.
  // For production with untrusted HTML, use a library like DOMPurify.
  const sanitizedHtml = htmlString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return (
    <div
      className={`prose ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default HtmlRenderer;