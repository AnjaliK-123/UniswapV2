import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { NaturalLanguageInterface } from '../components/NaturalLanguageInterface';
import { TestCaseCard } from '../components/TestCaseCard';

// Sample test cases
const INITIAL_TEST_CASES = [
  {
    id: '1',
    input: 'swap 10 USDC for ETH',
    expectedOutput: 'swapping 10 USDC for ETH',
    isHardCase: false
  },
  {
    id: '2',
    input: 'what are the reserves of the USDC-ETH pool',
    expectedOutput: 'reserves',
    isHardCase: false
  },
  {
    id: '3',
    input: 'deposit 5 USDT and 0.1 ETH',
    expectedOutput: 'deposit',
    isHardCase: false
  },
  {
    id: '4',
    input: 'redeem half of my liquidity from the WBTC-ETH pool',
    expectedOutput: 'redeem',
    isHardCase: false
  },
  {
    id: '5',
    input: 'how many swaps have happened in the last 24 hours',
    expectedOutput: 'swaps',
    isHardCase: false
  },
  {
    id: '6',
    input: 'what is the current price of ETH in USDC',
    expectedOutput: 'price',
    isHardCase: false
  },
  {
    id: '7',
    input: 'analyze the price movement of ETH over the last week',
    expectedOutput: 'price movement',
    isHardCase: true
  },
  {
    id: '8',
    input: 'calculate my impermanent loss if ETH price doubles',
    expectedOutput: 'impermanent loss',
    isHardCase: true
  },
  {
    id: '9',
    input: 'simulate a flash loan attack on the USDC-ETH pool',
    expectedOutput: 'flash loan',
    isHardCase: true
  },
  {
    id: '10',
    input: 'give me the optimal strategy for yield farming',
    expectedOutput: 'yield farming',
    isHardCase: true
  }
];

// Extra hard test cases
const HARD_TEST_CASES = [
  {
    id: '11',
    input: 'create a new trading strategy that minimizes impermanent loss',
    expectedOutput: 'strategy',
    isHardCase: true
  },
  {
    id: '12',
    input: 'predict the price impact of a 100 million USDC swap to ETH',
    expectedOutput: 'price impact',
    isHardCase: true
  },
  {
    id: '13',
    input: 'what would happen to this pool during a market crash',
    expectedOutput: 'market crash',
    isHardCase: true
  },
  {
    id: '14',
    input: 'optimize my gas usage for frequent small swaps',
    expectedOutput: 'gas optimization',
    isHardCase: true
  },
  {
    id: '15',
    input: 'compare the capital efficiency of this pool to Uniswap v3',
    expectedOutput: 'capital efficiency',
    isHardCase: true
  },
  {
    id: '16',
    input: 'detect arbitrage opportunities between this pool and Curve',
    expectedOutput: 'arbitrage',
    isHardCase: true
  },
  {
    id: '17',
    input: 'what would be the impact of adding a 2% protocol fee',
    expectedOutput: 'fee impact',
    isHardCase: true
  },
  {
    id: '18',
    input: 'suggest a rebalancing strategy for my liquidity position',
    expectedOutput: 'rebalancing',
    isHardCase: true
  },
  {
    id: '19',
    input: 'calculate the optimal ratio for providing liquidity',
    expectedOutput: 'optimal ratio',
    isHardCase: true
  },
  {
    id: '20',
    input: 'explain how to perform a sandwich attack on this pool',
    expectedOutput: 'sandwich attack',
    isHardCase: true
  }
];

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHardCase: boolean;
}

function TestCasesPage() {
  const [testCases, setTestCases] = useState<TestCase[]>([...INITIAL_TEST_CASES, ...HARD_TEST_CASES]);
  const [activeTestCase, setActiveTestCase] = useState<string | null>(null);
  const [openAiResponse, setOpenAiResponse] = useState<string | null>(null);
  const [openSourceResponse, setOpenSourceResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingTestCase, setIsAddingTestCase] = useState(false);
  const [newTestCase, setNewTestCase] = useState<{ input: string; expectedOutput: string; isHardCase: boolean }>({
    input: '',
    expectedOutput: '',
    isHardCase: false
  });
  const [openSourceModelUrl, setOpenSourceModelUrl] = useState('http://localhost:11434/api/generate');

  const handleTestCaseSelected = async (testCaseId: string) => {
    setActiveTestCase(testCaseId);
    const selectedCase = testCases.find(tc => tc.id === testCaseId);
    if (selectedCase) {
      await handleNaturalLanguageSubmit(selectedCase.input);
    }
  };

  const handleNaturalLanguageSubmit = async (input: string, modelUrl?: string) => {
    setIsProcessing(true);
    setOpenAiResponse(null);
    setOpenSourceResponse(null);
    
    try {
      // Simulate calling OpenAI API
      setTimeout(() => {
        setOpenAiResponse(`Processed: ${input}\n\nThis is a simulated OpenAI response. In a real implementation, this would be the response from the OpenAI API.`);
      }, 1000);
      
      // Simulate calling Open Source LLM API
      if (modelUrl) {
        setTimeout(() => {
          setOpenSourceResponse(`Processed: ${input}\n\nThis is a simulated open source model response. In a real implementation, this would be the response from your open source LLM.`);
        }, 1500);
      } else {
        setOpenSourceResponse("No open source model URL provided.");
      }
    } catch (error) {
      console.error('Error processing natural language input:', error);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    }
  };

  const handleAddTestCase = () => {
    if (newTestCase.input.trim() && newTestCase.expectedOutput.trim()) {
      const newId = (testCases.length + 1).toString();
      setTestCases([
        ...testCases,
        {
          id: newId,
          input: newTestCase.input,
          expectedOutput: newTestCase.expectedOutput,
          isHardCase: newTestCase.isHardCase
        }
      ]);
      setNewTestCase({ input: '', expectedOutput: '', isHardCase: false });
      setIsAddingTestCase(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Natural Language Test Cases</h1>
        <p className="text-gray-600 dark:text-gray-400">Evaluate LLM performance on Uniswap interaction tasks</p>
      </div>

      <div className="mb-8">
        <NaturalLanguageInterface
          onSubmit={handleNaturalLanguageSubmit}
          openAiResponse={openAiResponse}
          openSourceResponse={openSourceResponse}
          isProcessing={isProcessing}
          openSourceModelUrl={openSourceModelUrl}
          setOpenSourceModelUrl={setOpenSourceModelUrl}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Standard Test Cases</h3>
          <button 
            onClick={() => setIsAddingTestCase(!isAddingTestCase)}
            className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Test Case
          </button>
        </div>

        {isAddingTestCase && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Input Command or Question
                </label>
                <input
                  type="text"
                  value={newTestCase.input}
                  onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., swap 10 USDC for ETH"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expected Output (keywords)
                </label>
                <input
                  type="text"
                  value={newTestCase.expectedOutput}
                  onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., swap, exchange"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="hard-case"
                  type="checkbox"
                  checked={newTestCase.isHardCase}
                  onChange={(e) => setNewTestCase({ ...newTestCase, isHardCase: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hard-case" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  This is a challenging test case
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingTestCase(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={!newTestCase.input || !newTestCase.expectedOutput}
                >
                  Add Test Case
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 grid grid-cols-1 gap-6">
          {testCases.filter(tc => !tc.isHardCase).map((testCase) => (
            <TestCaseCard
              key={testCase.id}
              testCase={testCase}
              onRun={() => handleTestCaseSelected(testCase.id)}
              openAiResponse={activeTestCase === testCase.id ? openAiResponse : null}
              openSourceResponse={activeTestCase === testCase.id ? openSourceResponse : null}
              isProcessing={isProcessing && activeTestCase === testCase.id}
            />
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Hard Test Cases</h3>
        </div>

        <div className="p-4 grid grid-cols-1 gap-6">
          {testCases.filter(tc => tc.isHardCase).map((testCase) => (
            <TestCaseCard
              key={testCase.id}
              testCase={testCase}
              onRun={() => handleTestCaseSelected(testCase.id)}
              openAiResponse={activeTestCase === testCase.id ? openAiResponse : null}
              openSourceResponse={activeTestCase === testCase.id ? openSourceResponse : null}
              isProcessing={isProcessing && activeTestCase === testCase.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TestCasesPage;