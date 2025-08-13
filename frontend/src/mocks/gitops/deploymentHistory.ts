import type { DeploymentHistory, ContainerImage } from '@/types/gitops';
import { DeploymentStatus } from '@/types/gitops';
import { mockContainerImages } from './containerImages';

// Helper function to get image by ID
const getImageById = (id: string): ContainerImage => {
  return mockContainerImages.find(img => img.id === id) || mockContainerImages[0];
};

export const mockDeploymentHistory: DeploymentHistory[] = [
  {
    id: 'deploy-1',
    application_id: 'app-1',
    image: getImageById('image-1'), // k8s-configs:latest
    status: DeploymentStatus.SUCCESS,
    triggered_by: 'auto',
    triggered_by_user: undefined,
    started_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
    completed_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    duration: 180, // 3 minutes
    error_message: null,
    rollback_target: null
  },
  {
    id: 'deploy-2',
    application_id: 'app-2',
    image: getImageById('image-3'), // api-service:latest
    status: DeploymentStatus.SUCCESS,
    triggered_by: 'auto',
    triggered_by_user: undefined,
    started_at: new Date(Date.now() - 105 * 60 * 1000).toISOString(), // 1h 45m ago
    completed_at: new Date(Date.now() - 100 * 60 * 1000).toISOString(), // 1h 40m ago
    duration: 300, // 5 minutes
    error_message: null,
    rollback_target: null
  },
  {
    id: 'deploy-3',
    application_id: 'app-3',
    image: getImageById('image-7'), // monitoring-stack:v3.1.0
    status: DeploymentStatus.FAILURE,
    triggered_by: 'manual',
    triggered_by_user: 'ops-engineer1',
    started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    completed_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // 40 minutes ago
    duration: 300,
    error_message: 'Failed to deploy: image not found in registry',
    rollback_target: null
  },
  {
    id: 'deploy-4',
    application_id: 'app-4',
    image: getImageById('image-5'), // api-service:v1.2.2
    status: DeploymentStatus.SUCCESS,
    triggered_by: 'manual',
    triggered_by_user: 'developer1',
    started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
    completed_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    duration: 300,
    error_message: null,
    rollback_target: 'deploy-7' // Rolled back to previous version
  },
  {
    id: 'deploy-5',
    application_id: 'app-5',
    image: getImageById('image-8'), // postgresql:v14.8-alpine
    status: DeploymentStatus.IN_PROGRESS,
    triggered_by: 'manual',
    triggered_by_user: 'dba-admin',
    started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    completed_at: null,
    duration: undefined,
    error_message: null,
    rollback_target: null
  },
  {
    id: 'deploy-6',
    application_id: 'app-1',
    image: getImageById('image-2'), // k8s-configs:v2.1.0
    status: DeploymentStatus.SUCCESS,
    triggered_by: 'auto',
    triggered_by_user: undefined,
    started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(), // 2 days ago + 4 minutes
    duration: 240, // 4 minutes
    error_message: null,
    rollback_target: null
  },
  {
    id: 'deploy-7',
    application_id: 'app-4',
    image: getImageById('image-4'), // api-service:v1.2.3 (this was rolled back from)
    status: DeploymentStatus.FAILURE,
    triggered_by: 'auto',
    triggered_by_user: undefined,
    started_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 minutes ago
    completed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    duration: 300,
    error_message: 'Deployment failed: health check timeout',
    rollback_target: null
  },
  {
    id: 'deploy-8',
    application_id: 'app-2',
    image: getImageById('image-5'), // api-service:v1.2.2 (previous version)
    status: DeploymentStatus.SUCCESS,
    triggered_by: 'auto',
    triggered_by_user: undefined,
    started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(), // 5 days ago + 6 minutes
    duration: 360, // 6 minutes
    error_message: null,
    rollback_target: null
  },
  {
    id: 'deploy-9',
    application_id: 'app-1',
    image: getImageById('image-6'), // nginx-app:latest
    status: DeploymentStatus.CANCELLED,
    triggered_by: 'manual',
    triggered_by_user: 'developer2',
    started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(), // 3 days ago + 2 minutes
    duration: 120, // 2 minutes before cancellation
    error_message: null,
    rollback_target: null
  },
  {
    id: 'deploy-10',
    application_id: 'app-3',
    image: getImageById('image-7'), // monitoring-stack:v3.1.0 (previous attempt)
    status: DeploymentStatus.SUCCESS,
    triggered_by: 'manual',
    triggered_by_user: 'ops-engineer2',
    started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(), // 7 days ago + 8 minutes
    duration: 480, // 8 minutes
    error_message: null,
    rollback_target: null
  }
];