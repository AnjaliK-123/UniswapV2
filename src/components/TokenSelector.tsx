import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ChevronDown } from 'lucide-react';
import { SAMPLE_TOKENS } from '../constants/addresses';
import ERC20_ABI from '../abis/ERC20.json';
import { useWeb3 } from '../context/Web3Context';

interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
}

interface TokenSelectorProps {
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  excludeAddress?: string;
}

export function TokenSelector({ selectedToken, onSelectToken, excludeAddress }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>(SAMPLE_TOKENS);
  const { provider } = useWeb3();

  // Filter out the excluded token if provided
  const filteredTokens = tokens.filter(token => token.address !== excludeAddress);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
      >
        {selectedToken ? (
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xs">{selectedToken.symbol.charAt(0)}</span>
            </div>
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span>Select Token</span>
        )}
        <ChevronDown className="ml-2 h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute mt-1 w-full z-10 bg-white dark:bg-gray-800 shadow-lg rounded-md max-h-60 overflow-auto border border-gray-200 dark:border-gray-700">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select a token</div>
            <div className="space-y-1">
              {filteredTokens.map((token) => (
                <button
                  key={token.address}
                  type="button"
                  className="w-full text-left px-3 py-2 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-150"
                  onClick={() => handleSelectToken(token)}
                >
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span>{token.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{token.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}