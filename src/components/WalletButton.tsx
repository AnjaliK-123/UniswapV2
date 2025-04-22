import React from 'react';
import { useWeb3 } from '../context/Web3Context';

function WalletButton() {
  const { account, connectWallet, isConnecting } = useWeb3();

  // Format account address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className={`
        px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
        ${account 
          ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800'
          : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
        }
        ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}
      `}
    >
      {isConnecting 
        ? 'Connecting...' 
        : (account ? formatAddress(account) : 'Connect Wallet')}
    </button>
  );
}

export default WalletButton;