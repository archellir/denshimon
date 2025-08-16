import { KubernetesResource } from '@/types';

/**
 * Generates mock Kubernetes resources for demonstration
 */
export const generateMockKubernetesResources = (): KubernetesResource[] => {
  const namespaces = ['production', 'staging', 'default'];
  const resources: KubernetesResource[] = [];

  namespaces.forEach((ns, nsIndex) => {
    // Namespace
    const namespaceId = `ns-${nsIndex}`;
    resources.push({
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        uid: namespaceId,
        name: ns,
        creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
      },
      status: {
        phase: 'Active'
      }
    });

    // Deployments in each namespace
    for (let i = 0; i < 2; i++) {
      const deploymentId = `deploy-${nsIndex}-${i}`;
      const deploymentName = `${ns === 'production' ? 'web-app' : 'test-app'}-${i + 1}`;
      
      resources.push({
        kind: 'Deployment',
        metadata: {
          uid: deploymentId,
          name: deploymentName,
          namespace: ns,
          ownerReferences: [
            {
              apiVersion: 'v1',
              uid: namespaceId,
              kind: 'Namespace',
              name: ns
            }
          ],
          labels: {
            app: deploymentName,
            version: 'v1.0.0',
            tier: ns === 'production' ? 'production' : 'development'
          },
          creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        },
        status: {
          conditions: [
            {
              type: Math.random() > 0.8 ? 'Progressing' : 'Available'
            }
          ]
        }
      });

      // ReplicaSet for each Deployment
      const replicaSetId = `rs-${nsIndex}-${i}`;
      resources.push({
        kind: 'ReplicaSet',
        metadata: {
          uid: replicaSetId,
          name: `${deploymentName}-abc123`,
          namespace: ns,
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              uid: deploymentId,
              kind: 'Deployment',
              name: deploymentName
            }
          ],
          labels: {
            app: deploymentName
          },
          creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        },
        status: {
          conditions: [
            {
              type: 'Available'
            }
          ]
        }
      });

      // Pods for each ReplicaSet
      for (let j = 0; j < 3; j++) {
        const podId = `pod-${nsIndex}-${i}-${j}`;
        resources.push({
          kind: 'Pod',
          metadata: {
            uid: podId,
            name: `${deploymentName}-abc123-${generateRandomString(5)}`,
            namespace: ns,
            ownerReferences: [
              {
                apiVersion: 'apps/v1',
                uid: replicaSetId,
                kind: 'ReplicaSet',
                name: `${deploymentName}-abc123`
              }
            ],
            labels: {
              app: deploymentName
            },
            creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString()
          },
          status: {
            phase: Math.random() > 0.9 ? 'Pending' : 'Running',
            conditions: [
              {
                type: 'Ready'
              }
            ]
          }
        });
      }

      // Service for each Deployment
      resources.push({
        kind: 'Service',
        metadata: {
          uid: `svc-${nsIndex}-${i}`,
          name: `${deploymentName}-service`,
          namespace: ns,
          labels: {
            app: deploymentName
          },
          creationTimestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        }
      });
    }
  });

  return resources;
};

/**
 * Generates a random string for resource names
 */
const generateRandomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Gets the display name for a Kubernetes resource
 */
export const getResourceDisplayName = (resource: KubernetesResource): string => {
  return resource.metadata?.name || resource.kind || 'Unknown';
};

/**
 * Gets the namespace for a Kubernetes resource
 */
export const getResourceNamespace = (resource: KubernetesResource): string => {
  return resource.metadata?.namespace || 'default';
};

/**
 * Checks if a resource has owner references
 */
export const hasOwnerReferences = (resource: KubernetesResource): boolean => {
  return !!(resource.metadata?.ownerReferences && resource.metadata.ownerReferences.length > 0);
};

/**
 * Gets the creation timestamp for a resource
 */
export const getResourceAge = (resource: KubernetesResource): string => {
  if (!resource.metadata?.creationTimestamp) return 'Unknown';
  
  const created = new Date(resource.metadata.creationTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'Just now';
};

/**
 * Gets the status of a Kubernetes resource
 */
export const getResourceStatus = (resource: KubernetesResource): string => {
  if (resource.status?.phase) return resource.status.phase;
  if (resource.status?.conditions && resource.status.conditions.length > 0) {
    return resource.status.conditions[0].type || 'Unknown';
  }
  return 'Unknown';
};