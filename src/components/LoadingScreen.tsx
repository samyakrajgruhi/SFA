import { useEffect, useState } from 'react';

export const LoadingScreen = ({ message = "Loading..." }: { message?: string }) => {
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-lg text-text-primary font-semibold">{message}</p>
        <p className="text-sm text-text-secondary">Please wait while we fetch your data</p>
        
        {showSlowMessage && (
          <div className="mt-6 p-4 bg-warning-light border border-warning rounded-lg">
            <p className="text-sm text-warning font-semibold mb-2">Taking longer than usual?</p>
            <p className="text-xs text-text-secondary mb-3">
              This might be due to network issues or ad blocker interference.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-warning text-white rounded-md hover:bg-warning/90 transition-colors text-sm"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};