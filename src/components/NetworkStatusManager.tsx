import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NetworkStatusManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'online' | 'offline' | 'api-unreachable'>('online');
  const [checking, setChecking] = useState(false);

  const checkConnectivity = async () => {
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    setChecking(true);
    try {
      // Use a timeout to avoid hanging forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Ping our newly created health endpoint
      const response = await fetch('https://mpsajmer-connect-api.futurist-raghav.workers.dev/api/health', { 
        method: 'GET',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('api-unreachable');
      }
    } catch (e) {
      console.warn('API Unreachable:', e);
      setStatus('api-unreachable');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => checkConnectivity();
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnectivity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (status !== 'online') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background p-6 text-center animate-in fade-in duration-500">
        <div className="mb-6 rounded-full bg-destructive/10 p-4">
          {status === 'offline' ? (
            <WifiOff className="h-12 w-12 text-destructive" />
          ) : (
            <AlertTriangle className="h-12 w-12 text-destructive" />
          )}
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          {status === 'offline' ? 'No Internet Connection' : 'Server Unreachable'}
        </h1>
        <p className="mb-8 max-w-xs text-muted-foreground">
          {status === 'offline' 
            ? 'Please check your internet connection and try again.' 
            : 'We are having trouble connecting to the school network. Please try again later.'}
        </p>
        <Button 
          onClick={() => {
            checkConnectivity();
          }} 
          disabled={checking}
          variant="default" 
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Retry Connection'}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CRITICAL APP ERROR:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6 text-center">
          <div className="mb-6 rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Unexpected Error</h1>
          <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
            The application encountered a runtime error and needs to restart.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg text-xs text-left overflow-auto max-w-full max-h-32 font-mono">
            {this.state.error?.message}
          </div>
          <Button onClick={() => window.location.reload()} className="mt-6">
            Restart Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
