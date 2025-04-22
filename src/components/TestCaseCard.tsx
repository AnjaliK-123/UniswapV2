import React, { useState } from 'react';
import { Play, Check, X, Loader2 } from 'lucide-react';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHardCase: boolean;
}

interface TestCaseCardProps {
  testCase: TestCase;
  onRun: (input: string) => Promise<void>;
  openAiResponse: string | null;
  openSourceResponse: string | null;
  isProcessing: boolean;
}

export function TestCaseCard({
  testCase,
  onRun,
  openAiResponse,
  openSourceResponse,
  isProcessing
}: TestCaseCardProps) {
  const handleRunTest = () => {
    if (!isProcessing) {
      onRun(testCase.input);
    }
  };

  // Determine if responses match expected output
  const openAiMatches = openAiResponse && 
    openAiResponse.toLowerCase().includes(testCase.expectedOutput.toLowerCase());
  
  const openSourceMatches = openSourceResponse && 
    openSourceResponse.toLowerCase().includes(testCase.expectedOutput.toLowerCase());

  return (
    <div className={`
      border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800
      ${testCase.isHardCase ? 'border-orange-300 dark:border-orange-800' : 'border-blue-300 dark:border-blue-800'}
    `}>
      <div className={`
        p-3 border-b 
        ${testCase.isHardCase 
          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}
      `}>
        <div className="flex justify-between items-center">
          <h3 className="font-medium">
            {testCase.isHardCase ? '🧠 Hard Test Case' : '✓ Standard Test Case'}
          </h3>
          <button
            onClick={handleRunTest}
            disabled={isProcessing}
            className={`
              px-3 py-1 rounded-md text-sm flex items-center space-x-1
              ${testCase.isHardCase 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'}
              ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                <span>Run Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</p>
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-800 dark:text-gray-200 text-sm">
            {testCase.input}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output:</p>
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-800 dark:text-gray-200 text-sm">
            {testCase.expectedOutput}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">OpenAI Response:</p>
              {openAiResponse && (
                <div className="ml-2">
                  {openAiMatches ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded min-h-[80px] text-sm">
              {openAiResponse ? (
                <div className="text-gray-800 dark:text-gray-200 text-sm line-clamp-3">
                  {openAiResponse}
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Not yet processed</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center mb-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Open Source Response:</p>
              {openSourceResponse && (
                <div className="ml-2">
                  {openSourceMatches ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded min-h-[80px] text-sm">
              {openSourceResponse ? (
                <div className="text-gray-800 dark:text-gray-200 text-sm line-clamp-3">
                  {openSourceResponse}
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Not yet processed</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}