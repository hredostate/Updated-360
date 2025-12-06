// This file is intended for a separate Node.js/Express backend server.
// It is NOT part of the Vite frontend build.
// You will need to install express and axios: `npm install express axios`

import express from 'express';
import axios from 'axios';

const router = express.Router();

// --- IMPORTANT ---
// Store these securely in your backend's .env file.
// Get your credentials from https://pdfgeneratorapi.com/
const PDF_API_KEY = process.env.PDF_API_KEY;
const PDF_API_SECRET = process.env.PDF_API_SECRET;
const PDF_API_WORKSPACE = process.env.PDF_API_WORKSPACE;

router.post('/export-pdf', async (req, res) => {
  if (!PDF_API_KEY || !PDF_API_SECRET || !PDF_API_WORKSPACE) {
    console.error('PDF generation service is not configured on the server.');
    return res.status(500).send('PDF generation service is not configured.');
  }

  const { html, title } = req.body;

  if (!html) {
    return res.status(400).send('HTML content is required.');
  }
  
  // A basic HTML wrapper can improve styling consistency.
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf8">
        <title>${title || 'Document'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          h1, h2, h3 { color: #111; }
          ul, ol { padding-left: 20px; }
          p { margin: 10px 0; }
          strong { font-weight: bold; }
          em { font-style: italic; }
          u { text-decoration: underline; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
  
  const endpoint = 'https://us1.pdfgeneratorapi.com/api/v4/documents/generate';

  const payload = {
    // Using "content" directly without a pre-made template
    template: {
      "format": "html",
      "content": fullHtml,
    },
    format: "pdf",
    output: "url", // The API will generate the PDF and give us a temporary URL to download it from.
    name: title || "generated-document"
  };

  try {
    // PDF Generator API uses a Bearer token with a base64 encoded Key:Secret
    const authToken = Buffer.from(`${PDF_API_KEY}:${PDF_API_SECRET}`).toString('base64');
    
    // 1. Tell the API to generate the document
    const generationResponse = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Auth-Workspace': PDF_API_WORKSPACE,
      },
    });
    
    const pdfUrl = generationResponse.data.response;

    if (!pdfUrl) {
      throw new Error('PDF Generator API did not return a file URL.');
    }

    // 2. Fetch the binary PDF content from the temporary URL provided by the API
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: 'arraybuffer', // This is crucial for handling binary file data
    });

    // 3. Send the binary PDF data back to the frontend client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.pdf"`);
    res.send(pdfResponse.data);

  } catch (error) {
    // Log detailed error from the external API if available
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('PDF Generation Error:', errorMessage);
    res.status(500).json({ message: 'Failed to generate PDF.', details: errorMessage });
  }
});

export default router;

/*
// --- Example usage in your main Express server file (e.g., server.js) ---
//
// import express from 'express';
// import pdfExportRoute from './api/export-pdf.js';
//
// const app = express();
// app.use(express.json({ limit: '10mb' })); // Use JSON middleware and increase payload limit for large HTML
//
// // Use a proxy or specific path for your API routes
// app.use('/api', pdfExportRoute);
//
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
//
*/