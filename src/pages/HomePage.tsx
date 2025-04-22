import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { ChevronRight, ArrowRight, AlertTriangle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import PAIR_ABI from '../abis/UniswapV2Pair.json';
import ERC20_ABI from '../abis/ERC20.json';
import { UNISWAP_FACTORY_ADDRESS } from '../constants/addresses';

interface Pool {
  address: string;
  token0: {
    symbol: string;
    name: string;
    address: string;
  };
  token1: {
    symbol: string;
    name: string;
    address: string;
  };
  reserves: {
    reserve0: string;
    reserve1: string;
  };
}

function HomePage() {
  const { provider, factoryContract } = useWeb3();
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isZeroAddress = (address: string) => {
    return address === "0x0000000000000000000000000000000000000000";
  };

  const isValidContract = async (address: string, provider: ethers.Provider) => {
    try {
      const code = await provider.getCode(address);
      return code !== '0x';
    } catch {
      return false;
    }
  };

  const getTokenInfo = async (tokenAddress: string, provider: ethers.Provider) => {
    try {
      // First check if the contract exists
      const isValid = await isValidContract(tokenAddress, provider);
      if (!isValid) {
        return {
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          address: tokenAddress
        };
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      try {
        const [symbol, name] = await Promise.all([
          tokenContract.symbol(),
          tokenContract.name()
        ]);
        
        return {
          symbol,
          name,
          address: tokenAddress
        };
      } catch {
        // If we can't get the symbol/name, return placeholder values
        return {
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          address: tokenAddress
        };
      }
    } catch {
      return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        address: tokenAddress
      };
    }
  };

  useEffect(() => {
    async function fetchPools() {
      // Reset error state
      setError(null);
      
      // Check if factory address is the zero address
      if (isZeroAddress(UNISWAP_FACTORY_ADDRESS)) {
        setError("Factory contract address is not configured. Please deploy the contracts and update the address in src/constants/addresses.ts");
        setIsLoading(false);
        return;
      }

      if (!provider || !factoryContract) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Check if factory contract exists
        const isFactoryValid = await isValidContract(UNISWAP_FACTORY_ADDRESS, provider);
        if (!isFactoryValid) {
          setError("Factory contract not found. Please ensure the contracts are deployed and the addresses are correct.");
          setIsLoading(false);
          return;
        }

        // Get total number of pairs
        const pairsLength = await factoryContract.allPairsLength();
        const pairPromises = [];
        
        // Fetch all pair addresses (up to a reasonable limit)
        const limit = Math.min(Number(pairsLength), 10);
        
        for (let i = 0; i < limit; i++) {
          pairPromises.push(factoryContract.allPairs(i));
        }
        
        const pairAddresses = await Promise.all(pairPromises);
        
        // Fetch details for each pair
        const poolDetailsPromises = pairAddresses.map(async (pairAddress) => {
          try {
            const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
            
            // Get token addresses
            const [token0Address, token1Address] = await Promise.all([
              pairContract.token0(),
              pairContract.token1()
            ]);
            
            // Get token details with error handling
            const [token0Info, token1Info, reserves] = await Promise.all([
              getTokenInfo(token0Address, provider),
              getTokenInfo(token1Address, provider),
              pairContract.getReserves()
            ]);
            
            return {
              address: pairAddress,
              token0: token0Info,
              token1: token1Info,
              reserves: {
                reserve0: ethers.formatEther(reserves[0]),
                reserve1: ethers.formatEther(reserves[1])
              }
            };
          } catch (error) {
            console.warn(`Failed to fetch details for pair ${pairAddress}:`, error);
            return null;
          }
        });
        
        const poolDetails = (await Promise.all(poolDetailsPromises)).filter(Boolean);
        setPools(poolDetails);
      } catch (error) {
        console.error('Error fetching pools:', error);
        setError('Failed to fetch pools. Please check that the contract addresses are correctly configured and you are connected to the correct network.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPools();
  }, [provider, factoryContract]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Uniswap V2 Interface</h1>
        <p className="text-gray-600 dark:text-gray-400">Select a pool to view, swap, deposit, or redeem liquidity</p>
      </div>

      {error && (
        <div className="mb-8 p-4 border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Configuration Error</h3>
              <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                <p>{error}</p>
                <p className="mt-2">
                  Please check the foundry/README.md for instructions on deploying the contracts, 
                  then update the addresses in src/constants/addresses.ts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-4">Swap Tokens</h2>
          <p className="mb-4">Exchange tokens at the current market rate based on liquidity pool reserves</p>
          <Link 
            to="/swap" 
            className="flex items-center font-medium text-sm text-white hover:underline"
          >
            Go to Swap <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-lg p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-4">Natural Language</h2>
          <p className="mb-4">Interact with Uniswap using natural language commands</p>
          <Link 
            to="/test-cases" 
            className="flex items-center font-medium text-sm text-white hover:underline"
          >
            Try Test Cases <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Available Pools</h3>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading pools...</p>
          </div>
        ) : pools.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pools.map((pool) => (
              <Link
                key={pool.address}
                to={`/pool/${pool.address}`}
                className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                        {pool.token0.symbol} / {pool.token1.symbol}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {pool.token0.name} / {pool.token1.name}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4 text-right">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {parseFloat(pool.reserves.reserve0).toFixed(4)} {pool.token0.symbol}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {parseFloat(pool.reserves.reserve1).toFixed(4)} {pool.token1.symbol}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No pools available</p>
            {!factoryContract && !error && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Connect your wallet and deploy the Uniswap contracts to create pools
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;