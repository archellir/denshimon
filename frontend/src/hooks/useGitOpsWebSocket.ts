import { useEffect } from 'react';
import useGitOpsStore from '@/stores/gitopsStore';

/**
 * Custom hook to initialize GitOps WebSocket subscriptions
 * This should be used in components that need real-time GitOps updates
 */
export const useGitOpsWebSocket = () => {
  const { initializeWebSocket, cleanupWebSocket } = useGitOpsStore();

  useEffect(() => {
    // Initialize WebSocket subscriptions for GitOps events
    initializeWebSocket();

    // Cleanup subscriptions when component unmounts
    return () => {
      cleanupWebSocket();
    };
  }, [initializeWebSocket, cleanupWebSocket]);
};

export default useGitOpsWebSocket;