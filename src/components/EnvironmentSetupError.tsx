import React from 'react';

interface EnvironmentSetupErrorProps {
  error: string;
}

const EnvironmentSetupError: React.FC<EnvironmentSetupErrorProps> = ({ error }) => {
  const exampleEnvContent = `VITE_SUPABASE_URL="YOUR_SUPABASE_URL_HERE"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"
VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"`;

  return (
    <div className="min-h-screen bg-red-50 flex flex-col justify-center items-center p-4 text-center">
      <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-lg border border-red-200">
        <h1 className="text-3xl font-bold text-red-800">🛡️ Application Configuration Error</h1>
        <p className="mt-4 text-md text-red-700">
          The application cannot connect to the backend because it's missing necessary environment variables.
        </p>
        <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-md text-left">
          <p className="font-semibold text-red-900">Error Details:</p>
          <p className="font-mono text-sm text-red-900 mt-2">{error}</p>
        </div>
        
        <div className="mt-6 text-left space-y-4">
          <h3 className="font-semibold text-slate-800 text-lg">How to Fix This:</h3>
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <p className="text-sm text-slate-700">
              You need to create a file named <code className="bg-slate-200 p-1 rounded">.env</code> in the root directory of this project.
              Refer to the <code className="bg-slate-200 p-1 rounded">README.md</code> file for detailed instructions.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800">Example <code className="bg-slate-200 p-1 rounded">.env</code> file contents:</h4>
            <pre className="bg-slate-900 text-white p-4 rounded-md mt-2 text-xs">
              <code>
                {exampleEnvContent}
              </code>
            </pre>
            <p className="text-xs text-slate-500 mt-2">
              Replace the placeholder values with your actual Supabase and Gemini API keys. You can find your Supabase keys in your project's dashboard under Project Settings &gt; API.
            </p>
          </div>

          <div className="text-center pt-4">
            <p className="text-slate-600">After creating and saving the <code className="bg-slate-200 p-1 rounded">.env</code> file, please <strong className="text-blue-700">restart the development server and refresh this page</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentSetupError;