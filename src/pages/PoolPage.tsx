import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { ArrowLeft, Plus, Minus, RefreshCw } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import PAIR_ABI from '../abis/UniswapV2Pair.json';
import ERC20_ABI from '../abis/ERC20.json';
import ROUTER_ABI from '../abis/UniswapV2Router02.json';
import { UNISWAP_ROUTER_ADDRESS } from '../constants/addresses';
import { ReservesCurveChart } from '../components/ReservesCurveChart';
import { SwapPriceChart } from '../components/SwapPriceChart';
import { NaturalLanguageInterface } from '../components/NaturalLanguageInterface';

function PoolPage() {
  const { address } = useParams<{ address: string }>();
  const { provider, signer, account } = useWeb3();
  
  const [poolData, setPoolData] = useState<{
    token0: { symbol: string; name: string; address: string; decimals: number };
    token1: { symbol: string; name: string; address: string; decimals: number };
    reserves: { reserve0: string; reserve1: string };
    totalSupply: string;
    userLpBalance: string;
  } | null>(null);
  
  const [swapEvents, setSwapEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // NL Interface state
  const [openAiResponse, setOpenAiResponse] = useState<string | null>(null);
  const [openSourceResponse, setOpenSourceResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openSourceModelUrl, setOpenSourceModelUrl] = useState('http://localhost:11434/api/generate');

  useEffect(() => {
    if (!provider || !address) return;

    async function fetchPoolData() {
      try {
        setIsLoading(true);
        const pairContract = new ethers.Contract(address, PAIR_ABI, provider);
        
        // Get token addresses
        const token0Address = await pairContract.token0();
        const token1Address = await pairContract.token1();
        
        // Get token details
        const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, provider);
        const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, provider);
        
        const [
          token0Symbol, 
          token0Name, 
          token0Decimals,
          token1Symbol, 
          token1Name,
          token1Decimals,
          reserves,
          totalSupply,
          userLpBalance
        ] = await Promise.all([
          token0Contract.symbol(),
          token0Contract.name(),
          token0Contract.decimals(),
          token1Contract.symbol(),
          token1Contract.name(),
          token1Contract.decimals(),
          pairContract.getReserves(),
          pairContract.totalSupply(),
          account ? pairContract.balanceOf(account) : '0'
        ]);
        
        setPoolData({
          token0: {
            symbol: token0Symbol,
            name: token0Name,
            address: token0Address,
            decimals: token0Decimals
          },
          token1: {
            symbol: token1Symbol,
            name: token1Name,
            address: token1Address,
            decimals: token1Decimals
          },
          reserves: {
            reserve0: ethers.formatUnits(reserves[0], token0Decimals),
            reserve1: ethers.formatUnits(reserves[1], token1Decimals)
          },
          totalSupply: ethers.formatEther(totalSupply),
          userLpBalance: ethers.formatEther(userLpBalance)
        });
        
        // Fetch swap events
        const swapFilter = pairContract.filters.Swap();
        const events = await pairContract.queryFilter(swapFilter, -10000); // Last 10000 blocks
        
        // Process events
        const processedEvents = await Promise.all(events.map(async (event) => {
          const block = await provider.getBlock(event.blockNumber);
          return {
            timestamp: block?.timestamp || 0,
            amount0In: ethers.formatUnits(event.args?.amount0In || 0, token0Decimals),
            amount1In: ethers.formatUnits(event.args?.amount1In || 0, token1Decimals),
            amount0Out: ethers.formatUnits(event.args?.amount0Out || 0, token0Decimals),
            amount1Out: ethers.formatUnits(event.args?.amount1Out || 0, token1Decimals),
            reserve0: ethers.formatUnits(event.args?.reserve0 || reserves[0], token0Decimals),
            reserve1: ethers.formatUnits(event.args?.reserve1 || reserves[1], token1Decimals)
          };
        }));
        
        setSwapEvents(processedEvents);
      } catch (error) {
        console.error('Error fetching pool data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPoolData();
  }, [provider, address, account]);

  const handleNaturalLanguageSubmit = async (input: string, modelUrl?: string) => {
    if (!poolData || !address) return;
    
    setIsProcessing(true);
    setOpenAiResponse(null);
    setOpenSourceResponse(null);
    
    try {
      // Call OpenAI API
      const openAiResult = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          poolAddress: address,
          token0: poolData.token0,
          token1: poolData.token1,
          reserves: poolData.reserves
        })
      });
      
      const openAiData = await openAiResult.json();
      setOpenAiResponse(openAiData.response);
      
      // Call Open Source LLM API (if URL provided)
      if (modelUrl) {
        try {
          const openSourceResult = await fetch(modelUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: "llama3",
              prompt: `You are a helpful assistant that understands Uniswap operations.
              The user is interacting with a Uniswap V2 pool with the following details:
              - Pool address: ${address}
              - Token0: ${poolData.token0.symbol} (${poolData.token0.address})
              - Token1: ${poolData.token1.symbol} (${poolData.token1.address})
              - Current reserves: ${poolData.reserves.reserve0} ${poolData.token0.symbol} and ${poolData.reserves.reserve1} ${poolData.token1.symbol}
              
              Help the user with this request: ${input}`,
              stream: false,
              max_tokens: 500
            })
          });
          
          const openSourceData = await openSourceResult.json();
          setOpenSourceResponse(openSourceData.response || openSourceData.content || "Could not process response");
        } catch (error) {
          console.error('Error calling open source model:', error);
          setOpenSourceResponse("Error: Could not connect to the open source model. Please check the URL and try again.");
        }
      } else {
        setOpenSourceResponse("No open source model URL provided.");
      }
    } catch (error) {
      console.error('Error processing natural language input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pool data...</p>
      </div>
    );
  }

  if (!poolData) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-700 dark:text-gray-300">Pool not found or error loading data</p>
        <Link to="/" className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pools
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {poolData.token0.symbol} / {poolData.token1.symbol} Pool
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {poolData.token0.name} / {poolData.token1.name}
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Reserve {poolData.token0.symbol}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {parseFloat(poolData.reserves.reserve0).toFixed(4)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Reserve {poolData.token1.symbol}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {parseFloat(poolData.reserves.reserve1).toFixed(4)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total LP Tokens</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {parseFloat(poolData.totalSupply).toFixed(4)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Your LP Balance</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {account ? parseFloat(poolData.userLpBalance).toFixed(4) : '-'}
              </p>
            </div>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'actions'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('actions')}
            >
              Actions
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'natural-language'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('natural-language')}
            >
              Natural Language
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <ReservesCurveChart
                reserve0={poolData.reserves.reserve0}
                reserve1={poolData.reserves.reserve1}
                token0Symbol={poolData.token0.symbol}
                token1Symbol={poolData.token1.symbol}
              />
              
              <SwapPriceChart
                swapEvents={swapEvents}
                token0Symbol={poolData.token0.symbol}
                token1Symbol={poolData.token1.symbol}
              />
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Swap</h3>
                  <RefreshCw className="h-5 w-5 text-gray-400" />
                </div>
                <Link
                  to="/swap"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Swap
                </Link>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Liquidity</h3>
                  <Plus className="h-5 w-5 text-gray-400" />
                </div>
                <button
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Add Liquidity
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Remove Liquidity</h3>
                  <Minus className="h-5 w-5 text-gray-400" />
                </div>
                <button
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={!account || parseFloat(poolData.userLpBalance) === 0}
                >
                  Remove Liquidity
                </button>
              </div>
            </div>
          )}

          {activeTab === 'natural-language' && (
            <NaturalLanguageInterface
              onSubmit={handleNaturalLanguageSubmit}
              openAiResponse={openAiResponse}
              openSourceResponse={openSourceResponse}
              isProcessing={isProcessing}
              openSourceModelUrl={openSourceModelUrl}
              setOpenSourceModelUrl={setOpenSourceModelUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PoolPage;