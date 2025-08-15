import type { DeploymentHistory } from '@/types/deployments';
import { DeploymentAction } from '@constants';
import { MASTER_DEPLOYMENT_HISTORY, MASTER_APPLICATIONS } from '../masterData';

// Convert master data to DeploymentHistory type
export const mockDeploymentHistory: DeploymentHistory[] = MASTER_DEPLOYMENT_HISTORY.map(record => {
  const baseRecord = {
    id: record.id,
    deploymentId: record.deploymentId,
    action: record.action,
    timestamp: record.timestamp,
    user: record.user,
    success: record.success,
    metadata: {
      triggeredBy: record.action === 'create' ? 'manual' : 'api',
      duration: record.success ? Math.floor(Math.random() * 300) + 30 : undefined,
    },
  } as DeploymentHistory;

  // Add optional fields based on record properties  
  if ('image' in record && 'image' in baseRecord) (baseRecord as any).image = record.image;
  if ('oldImage' in record && 'oldImage' in baseRecord) (baseRecord as any).oldImage = record.oldImage;
  if ('newImage' in record && 'newImage' in baseRecord) (baseRecord as any).newImage = record.newImage;
  if ('replicas' in record && 'replicas' in baseRecord) (baseRecord as any).replicas = record.replicas;
  if ('oldReplicas' in record && 'oldReplicas' in baseRecord) (baseRecord as any).oldReplicas = record.oldReplicas;
  if ('newReplicas' in record) {
    baseRecord.newReplicas = record.newReplicas;
    baseRecord.metadata!.affectedPods = Math.abs(record.newReplicas - (record.oldReplicas || 0));
  }
  if ('error' in record) baseRecord.error = record.error;

  return baseRecord;
});

// Generate additional history for all deployments
export const generateMockHistoryForDeployment = (deploymentId: string): DeploymentHistory[] => {
  const baseHistory = mockDeploymentHistory.filter(h => h.deploymentId === deploymentId);
  const deployment = MASTER_APPLICATIONS.find(app => app.name === deploymentId);
  
  if (!deployment) return baseHistory;
  
  // Generate additional history records
  const additionalHistory: DeploymentHistory[] = [];
  const actions = [DeploymentAction.SCALE, DeploymentAction.RESTART, DeploymentAction.UPDATE] as const;
  
  for (let i = 0; i < Math.floor(Math.random() * 5) + 3; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const timestamp = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * Math.random() * 7).toISOString();
    const success = Math.random() > 0.15; // 85% success rate
    
    const record: DeploymentHistory = {
      id: `hist-${deploymentId}-${i + 10}`,
      deploymentId,
      action,
      timestamp,
      user: ['admin', 'devops', 'developer'][Math.floor(Math.random() * 3)],
      success,
      metadata: {
        triggeredBy: Math.random() > 0.3 ? 'api' : 'manual',
        duration: success ? Math.floor(Math.random() * 200) + 20 : undefined,
      },
    };
    
    if (action === 'scale') {
      const oldReplicas = Math.floor(Math.random() * 5) + 1;
      const newReplicas = Math.floor(Math.random() * 5) + 1;
      record.oldReplicas = oldReplicas;
      record.newReplicas = newReplicas;
      record.metadata!.affectedPods = Math.abs(newReplicas - oldReplicas);
    } else if (action === 'update') {
      record.oldImage = `${deployment.name}:v1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`;
      record.newImage = `${deployment.name}:v1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`;
      if (!success) {
        record.error = ['ImagePullBackOff: authentication required', 'ErrImagePull: manifest unknown', 'CrashLoopBackOff: application failed to start'][Math.floor(Math.random() * 3)];
      }
    }
    
    additionalHistory.push(record);
  }
  
  return [...baseHistory, ...additionalHistory].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};