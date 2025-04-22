import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import HomePage from './pages/HomePage';
import PoolPage from './pages/PoolPage';
import SwapPage from './pages/SwapPage';
import TestCasesPage from './pages/TestCasesPage';

// Components
import { Layout } from './components/Layout';
import { Web3Provider } from './context/Web3Context';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pool/:address" element={<PoolPage />} />
              <Route path="/swap" element={<SwapPage />} />
              <Route path="/test-cases" element={<TestCasesPage />} />
            </Routes>
          </Layout>
        </Router>
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default App;