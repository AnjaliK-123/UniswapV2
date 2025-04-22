import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import { UNISWAP_FACTORY_ADDRESS } from '../constants/addresses';
import FACTORY_ABI from '../abis/UniswapV2Factory.json';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  factoryContract: ethers.Contract | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  isConnecting: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum !== undefined;

  // Initialize provider
  useEffect(() => {
    if (isMetaMaskInstalled) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      
      // Setup contracts
      if (UNISWAP_FACTORY_ADDRESS) {
        const factory = new ethers.Contract(
          UNISWAP_FACTORY_ADDRESS,
          FACTORY_ABI,
          browserProvider
        );
        setFactoryContract(factory);
      }
    }
  }, [isMetaMaskInstalled]);

  // Handle account and chain changes
  useEffect(() => {
    if (isMetaMaskInstalled) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      };

      // Initial fetch
      provider?.getSigner().then(setSigner);
      provider?.getNetwork().then(network => setChainId(Number(network.chainId)));
      
      // Subscribe to events
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Auto-fetch accounts if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch((err: Error) => console.error(err));

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [provider, isMetaMaskInstalled]);

  // Connect wallet function
  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      alert('Please install MetaMask to use this application!');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const newSigner = await provider?.getSigner();
        setSigner(newSigner || null);
      }
    } catch (error) {
      console.error('Error connecting to MetaMask', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        factoryContract,
        isConnected: !!account,
        connectWallet,
        isConnecting
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};