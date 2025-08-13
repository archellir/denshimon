import { useEffect, useRef } from 'react';
import { getWebSocketInstance } from '@services/websocket';
import { WebSocketEventType } from '@/constants';
import { PipelineStatus } from '@/types/gitops';
import type { GitHubWebhookPayload, GiteaWebhookPayload, PipelineUpdatePayload } from '@/types/gitops';
import useGitOpsStore from '@stores/gitopsStore';

export interface GitOpsWebhookCallbacks {
  onGitHubWebhook?: (payload: GitHubWebhookPayload) => void;
  onGiteaWebhook?: (payload: GiteaWebhookPayload) => void;
  onPipelineUpdate?: (payload: PipelineUpdatePayload) => void;
}

export const useGitOpsWebhooks = (callbacks: GitOpsWebhookCallbacks = {}) => {
  const subscriptionIdsRef = useRef<string[]>([]);
  const { 
    fetchRepositories, 
    fetchApplications, 
    fetchGiteaActions, 
    fetchContainerImages, 
    fetchDeploymentHistory 
  } = useGitOpsStore();

  useEffect(() => {
    const ws = getWebSocketInstance();
    if (!ws) return;

    // Subscribe to GitHub webhooks
    const githubSubId = ws.subscribe(WebSocketEventType.GITHUB_WEBHOOK, (payload: GitHubWebhookPayload) => {
      console.log('GitHub webhook received:', payload);
      
      // Handle GitHub webhook events
      switch (payload.action) {
        case 'push':
          // Repository was updated, trigger mirror sync check
          fetchRepositories();
          break;
        case 'create':
        case 'delete':
          // Branch/tag created or deleted
          fetchRepositories();
          break;
      }

      // Call user-provided callback
      callbacks.onGitHubWebhook?.(payload);
    });

    // Subscribe to Gitea webhooks
    const giteaSubId = ws.subscribe(WebSocketEventType.GITEA_WEBHOOK, (payload: GiteaWebhookPayload) => {
      console.log('Gitea webhook received:', payload);
      
      // Handle Gitea webhook events
      if (payload.workflow_run) {
        // Gitea Action status update
        fetchGiteaActions();
        
        if (payload.workflow_run.status === PipelineStatus.SUCCESS) {
          // Build completed, check for new images
          fetchContainerImages();
        }
      }

      if (payload.package) {
        // New container image published
        fetchContainerImages();
      }

      // Call user-provided callback
      callbacks.onGiteaWebhook?.(payload);
    });

    // Subscribe to pipeline updates
    const pipelineSubId = ws.subscribe(WebSocketEventType.PIPELINE_UPDATE, (payload: PipelineUpdatePayload) => {
      console.log('Pipeline update received:', payload);
      
      // Handle different types of pipeline updates
      switch (payload.type) {
        case 'mirror_sync':
          fetchRepositories();
          break;
        case 'action_status':
          fetchGiteaActions();
          break;
        case 'image_push':
          fetchContainerImages();
          break;
        case 'deployment_status':
          fetchApplications();
          fetchDeploymentHistory();
          break;
      }

      // Call user-provided callback
      callbacks.onPipelineUpdate?.(payload);
    });

    // Store subscription IDs for cleanup
    subscriptionIdsRef.current = [githubSubId, giteaSubId, pipelineSubId];

    // Cleanup function
    return () => {
      subscriptionIdsRef.current.forEach(id => {
        ws.unsubscribe(id);
      });
      subscriptionIdsRef.current = [];
    };
  }, [callbacks.onGitHubWebhook, callbacks.onGiteaWebhook, callbacks.onPipelineUpdate, 
      fetchRepositories, fetchApplications, fetchGiteaActions, fetchContainerImages, fetchDeploymentHistory]);

  return {
    // Return current subscription status
    isSubscribed: subscriptionIdsRef.current.length > 0
  };
};

export default useGitOpsWebhooks;