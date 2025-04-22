import React, { useState, useEffect } from 'react';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { TokenSelector } from '../components/TokenSelector';
import { SAMPLE_TOKENS, UNISWAP_ROUTER_ADDRESS } from '../constants/addresses';
import ROUTER_ABI from '../abis/UniswapV2Router02.json';
import ERC20_ABI from '../abis/ERC20.json';

interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
}

function SwapPage() {
  const { account, provider, signer } = useWeb3();
  
  const [fromToken, setFromToken] = useState<Token | null>(SAMPLE_TOKENS[0]);
  const [toToken, setToToken] = useState<Token | null>(SAMPLE_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if address is valid (not zero address)
  const isValidAddress = (address: string) => {
    return address && address !== "0x0000000000000000000000000000000000000000";
  };

  // Check approval status when tokens or account changes
  useEffect(() => {
    async function checkApproval() {
      if (!fromToken || !account || !provider || !signer || !fromAmount || parseFloat(fromAmount) === 0) {
        setIsApproved(false);
        return;
      }

      if (!isValidAddress(fromToken.address) || !isValidAddress(UNISWAP_ROUTER_ADDRESS)) {
        setIsApproved(false);
        return;
      }

      try {
        const tokenContract = new ethers.Contract(fromToken.address, ERC20_ABI, provider);
        const allowance = await tokenContract.allowance(account, UNISWAP_ROUTER_ADDRESS);
        const requiredAmount = ethers.parseUnits(fromAmount, fromToken.decimals);
        setIsApproved(allowance.gte(requiredAmount));
      } catch (error) {
        console.error('Error checking approval:', error);
        setIsApproved(false);
      }
    }

    checkApproval();
  }, [fromToken, account, provider, signer, fromAmount]);

  // Calculate output amount when input changes
  useEffect(() => {
    async function calculateOutputAmount() {
      if (!fromToken || !toToken || !fromAmount || !provider || parseFloat(fromAmount) === 0) {
        setToAmount('');
        setExchangeRate(null);
        return;
      }

      if (!isValidAddress(fromToken.address) || !isValidAddress(toToken.address) || !isValidAddress(UNISWAP_ROUTER_ADDRESS)) {
        const mockRate = 1.5;
        const calculatedAmount = (parseFloat(fromAmount) * mockRate).toFixed(toToken.decimals);
        setToAmount(calculatedAmount);
        setExchangeRate(`1 ${fromToken.symbol} ≈ ${mockRate.toFixed(6)} ${toToken.symbol} (simulated)`);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const routerContract = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, ROUTER_ABI, provider);
        
        const path = [fromToken.address, toToken.address];
        const inputAmount = ethers.parseUnits(fromAmount, fromToken.decimals);
        
        const amounts = await routerContract.getAmountsOut(inputAmount, path);
        
        if (amounts && amounts.length > 1) {
          const outputAmount = ethers.formatUnits(amounts[1], toToken.decimals);
          setToAmount(outputAmount);
          
          const rate = parseFloat(outputAmount) / parseFloat(fromAmount);
          setExchangeRate(`1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`);
        } else {
          throw new Error("Invalid amounts returned from router");
        }
      } catch (error) {
        console.error('Error calculating output:', error);
        setToAmount('');
        setExchangeRate(null);
        setErrorMessage("Cannot calculate swap at this time. This pair may not exist.");
      } finally {
        setIsLoading(false);
      }
    }

    calculateOutputAmount();
  }, [fromToken, toToken, fromAmount, provider]);

  // Swap tokens
  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !signer || !account) return;
    
    if (!isValidAddress(fromToken.address) || !isValidAddress(toToken.address) || !isValidAddress(UNISWAP_ROUTER_ADDRESS)) {
      setErrorMessage("Cannot swap with invalid token addresses. Please use valid tokens.");
      return;
    }
    
    setIsSwapping(true);
    setErrorMessage(null);
    try {
      const routerContract = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, ROUTER_ABI, signer);
      
      const path = [fromToken.address, toToken.address];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const inputAmount = ethers.parseUnits(fromAmount, fromToken.decimals);
      
      const slippageTolerance = 0.005;
      const amounts = await routerContract.getAmountsOut(inputAmount, path);
      const minOutputAmount = amounts[1] * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / BigInt(1000);
      
      const tx = await routerContract.swapExactTokensForTokens(
        inputAmount,
        minOutputAmount,
        path,
        account,
        deadline
      );
      
      await tx.wait();
      setTransactionHash(tx.hash);
      
      setFromAmount('');
      setToAmount('');
    } catch (error: any) {
      console.error('Error swapping tokens:', error);
      if (error.code === 4001 || (error.message && error.message.includes("user rejected"))) {
        setErrorMessage("Transaction was rejected in your wallet.");
      } else if (error.message && error.message.includes("TRANSFER_FROM_FAILED")) {
        setErrorMessage("Token transfer failed. Please approve the token again with a higher amount.");
        setIsApproved(false); // Reset approval state
      } else {
        setErrorMessage("Failed to swap tokens. Please try again.");
      }
    } finally {
      setIsSwapping(false);
    }
  };

  // Approve token spending
  const handleApprove = async () => {
    if (!fromToken || !signer || !account || !fromAmount) return;
    
    if (!isValidAddress(fromToken.address) || !isValidAddress(UNISWAP_ROUTER_ADDRESS)) {
      setErrorMessage("Cannot approve invalid token address. Please use valid tokens.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const tokenContract = new ethers.Contract(fromToken.address, ERC20_ABI, signer);
      
      // Use maximum possible allowance (type(uint256).max)
      const maxUint256 = ethers.MaxUint256;
      const tx = await tokenContract.approve(UNISWAP_ROUTER_ADDRESS, maxUint256);
      
      await tx.wait();
      setIsApproved(true);
    } catch (error: any) {
      console.error('Error approving token:', error);
      
      if (error.code === 4001 || (error.message && error.message.includes("user rejected"))) {
        setErrorMessage("You rejected the approval transaction. Approval is required to swap tokens.");
      } else {
        setErrorMessage("Failed to approve token. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Swap from and to tokens
  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Swap Tokens</h1>
        <p className="text-gray-600 dark:text-gray-400">Exchange tokens at the current market rate</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
              {account && <button 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => fromToken && setFromAmount(fromToken.symbol === 'ETH' ? '0.01' : '10')}
              >
                Max
              </button>}
            </div>
            
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={!account}
                />
              </div>
              <TokenSelector
                selectedToken={fromToken}
                onSelectToken={setFromToken}
                excludeAddress={toToken?.address}
              />
            </div>
          </div>

          <div className="flex justify-center my-4">
            <button
              onClick={handleSwitchTokens}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
            >
              <ArrowDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <TokenSelector
                selectedToken={toToken}
                onSelectToken={setToToken}
                excludeAddress={fromToken?.address}
              />
            </div>
          </div>

          {exchangeRate && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Exchange Rate</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{exchangeRate}</span>
                  <button className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          {!account ? (
            <button
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled
            >
              Connect Wallet to Swap
            </button>
          ) : !isApproved ? (
            <button
              onClick={handleApprove}
              disabled={isLoading || !fromToken || !fromAmount}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (isLoading || !fromToken || !fromAmount) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Approving...' : 'Approve'}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={isSwapping || isLoading || !fromToken || !toToken || !fromAmount || !toAmount}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (isSwapping || isLoading || !fromToken || !toToken || !fromAmount || !toAmount) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSwapping ? 'Swapping...' : 'Swap'}
            </button>
          )}

          {transactionHash && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md text-sm">
              Transaction successful! View on{' '}
              <a
                href={`https://etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-900 dark:hover:text-green-100"
              >
                Etherscan
              </a>
            </div>
          )}
        </div>
      </div>
      
      {(!isValidAddress(UNISWAP_ROUTER_ADDRESS) || 
        !isValidAddress(fromToken?.address) || 
        !isValidAddress(toToken?.address)) && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
          <p className="font-medium">Development Mode</p>
          <p className="mt-1">Using mock swap calculations because contract addresses are not configured. Update token and router addresses in <code>src/constants/addresses.ts</code> to use real Uniswap functionality.</p>
        </div>
      )}
    </div>
  );
}

export default SwapPage;