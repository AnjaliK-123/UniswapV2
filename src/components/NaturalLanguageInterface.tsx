import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface NaturalLanguageInterfaceProps {
  onSubmit: (input: string, modelUrl?: string) => Promise<void>;
  openAiResponse: string | null;
  openSourceResponse: string | null;
  isProcessing: boolean;
  openSourceModelUrl: string;
  setOpenSourceModelUrl: (url: string) => void;
}

export function NaturalLanguageInterface({
  onSubmit,
  openAiResponse,
  openSourceResponse,
  isProcessing,
  openSourceModelUrl,
  setOpenSourceModelUrl
}: NaturalLanguageInterfaceProps) {
  const [input, setInput] = useState('');
  const [showModelConfig, setShowModelConfig] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSubmit(input, openSourceModelUrl);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Natural Language Interface</h3>
          <button
            onClick={() => setShowModelConfig(!showModelConfig)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showModelConfig ? 'Hide Model Config' : 'Model Config'}
          </button>
        </div>

        {showModelConfig && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Open Source Model URL
            </label>
            <input
              type="text"
              value={openSourceModelUrl}
              onChange={(e) => setOpenSourceModelUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm"
              placeholder="http://localhost:11434/api/generate"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the URL for your local or hosted open source LLM API
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md min-h-[150px]">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">OpenAI Response:</div>
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">
              {isProcessing ? (
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : openAiResponse ? (
                openAiResponse
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Submit a query to see the response</span>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md min-h-[150px]">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Open Source Model Response:</div>
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">
              {isProcessing ? (
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : openSourceResponse ? (
                openSourceResponse
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Submit a query to see the response</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter natural language command (e.g., 'swap 10 USDC for WETH')"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              disabled={isProcessing}
            />
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isProcessing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}