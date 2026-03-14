/**
 * Test Integration Page
 * 
 * Simple diagnostic page to verify frontend-backend connection
 */

import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { UserData } from '@/services/api';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: unknown;
}

export default function TestIntegration() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [testEmail] = useState('frontend-test@alumni.com');
  const [testPassword] = useState('Test123!@#');

  const addResult = (test: string, status: TestResult['status'], message: string, data?: unknown) => {
    setResults(prev => [...prev, { test, status, message, data }]);
  };

  const testBackendHealth = async () => {
    addResult('Backend Health', 'pending', 'Checking backend status...');
    
    try {
      const response = await fetch('http://localhost:5000/api/status/health');
      const data = await response.json();
      
      if (data.success) {
        addResult('Backend Health', 'success', `Backend is healthy (uptime: ${data.uptime}s)`, data);
      } else {
        addResult('Backend Health', 'error', 'Backend returned unhealthy status', data);
      }
    } catch (error) {
      addResult('Backend Health', 'error', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testLogin = async () => {
    addResult('Login', 'pending', `Logging in as ${testEmail}...`);
    
    try {
      const response = await api.login({
        email: testEmail,
        password: testPassword,
      });
      
      if (response.success && response.user) {
        setIsLoggedIn(true);
        setCurrentUser(response.user);
        addResult('Login', 'success', `Logged in as ${response.user.name}`, response);
      } else {
        addResult('Login', 'error', response.message || 'Login failed', response);
      }
    } catch (error) {
      addResult('Login', 'error', `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testGetCurrentUser = async () => {
    addResult('Get Current User', 'pending', 'Fetching user profile...');
    
    try {
      const response = await api.getCurrentUser();
      
      if (response.success && response.user) {
        setCurrentUser(response.user);
        addResult('Get Current User', 'success', `Fetched profile for ${response.user.name}`, response.user);
      } else {
        addResult('Get Current User', 'error', response.message || 'Failed to fetch user', response);
      }
    } catch (error) {
      addResult('Get Current User', 'error', `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testGetDirectory = async () => {
    addResult('Get Directory', 'pending', 'Fetching alumni directory...');
    
    try {
      const response = await api.getAlumniDirectory();
      
      if (response.success && response.users) {
        addResult('Get Directory', 'success', `Found ${response.users.length} alumni`, response.users);
      } else {
        addResult('Get Directory', 'error', response.message || 'Failed to fetch directory', response);
      }
    } catch (error) {
      addResult('Get Directory', 'error', `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testLogout = async () => {
    addResult('Logout', 'pending', 'Logging out...');
    
    try {
      const response = await api.logout();
      setIsLoggedIn(false);
      setCurrentUser(null);
      addResult('Logout', 'success', 'Logged out successfully', response);
    } catch (error) {
      addResult('Logout', 'error', `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    await testBackendHealth();
    await testLogin();
    await testGetCurrentUser();
    await testGetDirectory();
  };

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Frontend-Backend Integration Test</h1>
        <p className="text-muted-foreground mb-8">Diagnostic tool to verify API connection</p>

        {/* Status Panel */}
        <div className=" rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Authentication</p>
              <p className={`font-semibold ${isLoggedIn ? 'text-green-600' : 'text-red-600'}`}>
                {isLoggedIn ? 'Logged In' : 'Not Logged In'}
              </p>
            </div>
            
            {currentUser && (
              <div>
                <p className="text-sm text-muted-foreground">Current User</p>
                <p className="font-semibold">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Test Controls */}
        <div className=" rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runAllTests}
              className="px-4 py-2 bg-primary/90 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run All Tests
            </button>
            
            <button
              onClick={testBackendHealth}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Test Backend Health
            </button>
            
            <button
              onClick={testLogin}
              disabled={isLoggedIn}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Login
            </button>
            
            <button
              onClick={testGetCurrentUser}
              disabled={!isLoggedIn}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Get User
            </button>
            
            <button
              onClick={testGetDirectory}
              disabled={!isLoggedIn}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Directory
            </button>
            
            <button
              onClick={testLogout}
              disabled={!isLoggedIn}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Logout
            </button>
            
            <button
              onClick={() => setResults([])}
              className="px-4 py-2 bg-gray-300  rounded-lg hover:bg-gray-400 transition-colors"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className=" rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {results.length === 0 ? (
            <p className="text-muted-foreground italic">No tests run yet. Click "Run All Tests" to start.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-500'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{result.test}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        result.status === 'success'
                          ? 'bg-green-200 text-green-800'
                          : result.status === 'error'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">{result.message}</p>
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:">
                        Show Response Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4 text-xs font-mono">
          <p className="font-semibold mb-2">Debug Info:</p>
          <p>API Base URL: http://localhost:5000/api</p>
          <p>Test Account: {testEmail}</p>
          <p>Access Token: {localStorage.getItem('accessToken') ? 'Present' : 'Not set'}</p>
          <p>Refresh Token: {localStorage.getItem('refreshToken') ? 'Present' : 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}
