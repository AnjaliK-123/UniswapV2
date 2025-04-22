import React, { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Home, BarChart2, List, Sun, Moon } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import WalletButton from './WalletButton';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(false);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <header className="border-b sticky top-0 z-10 bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">UniswapV2</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <NavLink to="/" icon={<Home size={18} />} label="Home" />
            <NavLink to="/swap" icon={<BarChart2 size={18} />} label="Swap" />
            <NavLink to="/test-cases" icon={<List size={18} />} label="Test Cases" />
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {children}
      </div>

      <footer className="mt-auto border-t py-6 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>UniswapV2 Implementation with NL Interface</p>
        </div>
      </footer>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavLink({ to, icon, label }: NavLinkProps) {
  return (
    <Link 
      to={to} 
      className="flex items-center text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
    >
      <span className="mr-2">{icon}</span>
      {label}
    </Link>
  );
}