"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTestUser, testSignIn, checkAuthConfig } from '@/lib/auth-test';

export default function AuthTestPage() {
  const [email, setEmail] = useState('admin@wasafinance.com');
  const [password, setPassword] = useState('admin123456');
  const [displayName, setDisplayName] = useState('Admin User');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleCheckConfig = () => {
    addLog('🔍 Checking Firebase configuration...');
    const isConfigValid = checkAuthConfig();
    if (isConfigValid) {
      addLog('✅ Firebase configuration is valid');
    } else {
      addLog('❌ Firebase configuration has issues');
    }
  };

  const handleCreateTestUser = async () => {
    setLoading(true);
    addLog(`👤 Creating test user: ${email}`);

    try {
      const result = await createTestUser(email, password, displayName);
      if (result.success) {
        addLog(`✅ ${result.message}`);
        addLog(`📧 Email: ${email}`);
        addLog(`🔑 Password: ${password}`);
        addLog(`👤 Role: admin`);
      } else {
        addLog(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Unexpected error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSignIn = async () => {
    setLoading(true);
    addLog(`🔑 Testing sign in with: ${email}`);

    try {
      const result = await testSignIn(email, password);
      if (result.success) {
        addLog(`✅ ${result.message}`);
        addLog(`🆔 User ID: ${result.user.uid}`);
        addLog(`📧 Email: ${result.user.email}`);
      } else {
        addLog(`❌ ${result.error}`);
        if (result.code) {
          addLog(`🔍 Error code: ${result.code}`);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Unexpected error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Firebase Auth Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Check */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Check</CardTitle>
              <CardDescription>Verify Firebase configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCheckConfig} className="w-full">
                Check Firebase Config
              </Button>
            </CardContent>
          </Card>

          {/* Test User Creation */}
          <Card>
            <CardHeader>
              <CardTitle>Create Test User</CardTitle>
              <CardDescription>Create a test user for development</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wasafinance.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Admin User"
                />
              </div>
              <Button
                onClick={handleCreateTestUser}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Test User'}
              </Button>
            </CardContent>
          </Card>

          {/* Sign In Test */}
          <Card>
            <CardHeader>
              <CardTitle>Test Sign In</CardTitle>
              <CardDescription>Test authentication with existing user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleTestSignIn}
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Test Sign In'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common test scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmail('admin@wasafinance.com');
                  setPassword('admin123456');
                  setDisplayName('Admin User');
                  addLog('📝 Set default admin credentials');
                }}
              >
                Use Default Admin Credentials
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearLogs}
              >
                Clear Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Logs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Logs</CardTitle>
            <CardDescription>Real-time authentication testing output</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Run some tests to see output...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. First, check Firebase configuration</p>
            <p>2. Create a test user (if none exists)</p>
            <p>3. Test sign in with the created user</p>
            <p>4. Check the logs for any errors</p>
            <p className="text-amber-600 font-semibold">
              Note: Make sure Email/Password authentication is enabled in Firebase Console
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}