
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BatchManager from './components/BatchManager';
import StakeholderManager from './components/StakeholderManager';
import TraceVisualizer from './components/TraceVisualizer';
import Assistant from './components/Assistant';
import LandingPage from './components/LandingPage';
import Signup from './components/Signup';
import UserProfile from './components/UserProfile';
import ProductVerifier from './components/ProductVerifier';
import FinancialRecords from './components/FinancialRecords';
import BlockchainExplorer from './components/BlockchainExplorer';
import { User } from './types';
import { ToastContainer } from 'react-toastify';

const SESSION_KEY = 'eledger_active_session';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedSession = localStorage.getItem(SESSION_KEY);
      return storedSession ? JSON.parse(storedSession) : null;
    } catch (error) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  });

  const handleLogin = (user: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} theme="colored" />
      <Routes>
        <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route
          path="/*"
          element={
            currentUser ? (
              <Layout user={currentUser} onLogout={handleLogout}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard user={currentUser} />} />
                  <Route path="/batches" element={<BatchManager user={currentUser} />} />
                  <Route path="/stakeholders" element={<StakeholderManager user={currentUser} />} />
                  <Route path="/trace/:id" element={<TraceVisualizer user={currentUser} />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/financials" element={<FinancialRecords user={currentUser} />} />
                  <Route path="/blockchain" element={<BlockchainExplorer />} />
                  <Route path="/verify" element={<ProductVerifier />} />
                  <Route path="/profile" element={<UserProfile user={currentUser} onUpdate={setCurrentUser} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
