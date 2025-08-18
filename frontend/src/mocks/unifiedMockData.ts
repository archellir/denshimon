/**
 * Unified Mock Data System
 * 
 * This module provides a comprehensive, interconnected mock data system that ensures
 * consistency across all frontend components. All data is derived from masterData.ts
 * and maintains proper relationships between different entities.
 */

import { 
  MASTER_APPLICATIONS, 
  MASTER_PODS, 
  MASTER_SERVICES, 
  MASTER_NAMESPACES,
  MASTER_NODES,
  MASTER_DEPLOYMENTS,
  MASTER_REGISTRIES,
  MASTER_IMAGES,
  MASTER_DEPLOYMENT_HISTORY,
  MASTER_REPOSITORIES
} from './masterData';

import type { Deployment, DeploymentHistory } from '@/types/deployments';
import { DeploymentStatus, DeploymentStrategy } from '@constants';

// Generate consistent, interconnected mock data
class UnifiedMockDataService {
  private deployments: Deployment[] = [];
  private pendingDeployments: Deployment[] = [];
  private deploymentHistory: DeploymentHistory[] = [];
  
  constructor() {
    this.generateDeployments();
    this.generatePendingDeployments();
    this.generateDeploymentHistory();
  }

  private generateDeployments() {
    this.deployments = MASTER_APPLICATIONS.map(app => {
      // Find related pods for this application
      const appPods = MASTER_PODS.filter(pod => {
        if (typeof app.pods === 'object' && Array.isArray(app.pods)) {
          return app.pods.includes(pod.name);
        }
        return pod.app === app.name.split('-')[0]; // fallback matching
      });

      // Calculate realistic replica states
      const availableReplicas = Math.min(appPods.length, app.replicas);
      const readyReplicas = Math.floor(availableReplicas * (0.8 + Math.random() * 0.2)); // 80-100% ready
      
      // Determine status based on replica health
      let status: DeploymentStatus = DeploymentStatus.RUNNING;
      if (readyReplicas === 0) status = DeploymentStatus.FAILED;
      else if (readyReplicas < app.replicas) status = DeploymentStatus.PENDING;
      else if (Math.random() > 0.9) status = DeploymentStatus.UPDATING;

      // Find matching registry and image
      const isCustomApp = app.name.includes('api-server') || app.name.includes('frontend');
      const registry = isCustomApp ? 
        MASTER_REGISTRIES.find(r => r.type === 'gitea') : 
        MASTER_REGISTRIES.find(r => r.type === 'dockerhub');

      const image = this.getImageForApp(app.name);
      
      // Calculate node distribution
      const nodeDistribution: Record<string, number> = {};
      appPods.forEach(pod => {
        nodeDistribution[pod.node] = (nodeDistribution[pod.node] || 0) + 1;
      });

      // Create service type mapping
      const serviceType = this.getServiceTypeForApp(app.name);

      return {
        id: `dep-${app.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(36).substring(2, 8)}`,
        name: app.name,
        namespace: app.namespace,
        image: image,
        registryId: registry?.id || 'dockerhub-registry',
        replicas: app.replicas,
        availableReplicas,
        readyReplicas,
        updatedReplicas: readyReplicas,
        status,
        strategy: {
          type: DeploymentStrategy.ROLLING_UPDATE,
          maxSurge: 1,
          maxUnavailable: 0,
          nodeSpread: true,
          zoneSpread: false,
        },
        nodeDistribution,
        // GitOps fields
        source: 'internal',
        author: 'denshimon-ui',
        git_commit_sha: `sha-${Math.random().toString(36).substring(2, 12)}`,
        manifest_path: `k8s/${app.namespace}/${app.name}.yaml`,
        service_type: serviceType,
        applied_by: 'admin',
        applied_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        pods: appPods.map(pod => ({
          name: pod.name,
          phase: this.getPodPhase(pod, status),
          ready: Math.random() > 0.1,
          restarts: Math.floor(Math.random() * 3),
          nodeName: pod.node,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          ip: `10.244.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254) + 1}`,
          labels: {
            app: pod.app,
            version: 'v1.0.0',
            'infra/service-type': serviceType,
            'infra/deployment-id': `dep-${app.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(36).substring(2, 8)}`,
          },
        })),
      };
    });
  }

  private generatePendingDeployments() {
    // Create 3 pending deployments from existing applications
    const pendingApps = MASTER_APPLICATIONS.slice(0, 3);
    
    this.pendingDeployments = pendingApps.map((app, index) => {
      const baseDeployment = this.deployments.find(d => d.name === app.name) || this.deployments[0];
      const isExternal = index === 0; // First one is external
      
      return {
        ...baseDeployment,
        id: `pending-${app.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${index}`,
        status: 'pending_apply' as const,
        source: isExternal ? 'external' : 'internal',
        author: isExternal ? 'external-dev' : 'denshimon-ui',
        git_commit_sha: `${isExternal ? 'ext' : 'int'}${index}${Math.random().toString(36).substring(2, 8)}`,
        manifest_path: `k8s/${app.namespace}/${app.name}.yaml`,
        applied_by: undefined,
        applied_at: undefined,
        createdAt: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(), // 1-3 hours ago
        updatedAt: new Date(Date.now() - (index + 1) * 30 * 60 * 1000).toISOString(), // 30min-1.5hrs ago
      };
    });
  }

  private generateDeploymentHistory() {
    this.deploymentHistory = MASTER_DEPLOYMENT_HISTORY.map(hist => ({
      id: hist.id,
      deploymentId: hist.deploymentId,
      action: hist.action,
      oldImage: hist.oldImage || '',
      newImage: hist.newImage || hist.image || '',
      oldReplicas: hist.oldReplicas || 0,
      newReplicas: hist.newReplicas || hist.replicas || 0,
      success: hist.success,
      error: hist.error || '',
      user: hist.user,
      timestamp: hist.timestamp,
      metadata: {}
    }));
  }

  private getImageForApp(appName: string): string {
    // Find matching image from MASTER_IMAGES based on app name
    const lowerName = appName.toLowerCase();
    
    if (lowerName.includes('nginx')) {
      return MASTER_IMAGES.find(img => img.repository === 'nginx')?.repository + ':latest' || 'nginx:latest';
    }
    if (lowerName.includes('api-server')) {
      return MASTER_IMAGES.find(img => img.repository === 'denshimon/api-server')?.repository + ':v1.2.3' || 'denshimon/api-server:v1.2.3';
    }
    if (lowerName.includes('redis')) {
      return MASTER_IMAGES.find(img => img.repository === 'redis')?.repository + ':7-alpine' || 'redis:7-alpine';
    }
    if (lowerName.includes('postgres')) {
      return MASTER_IMAGES.find(img => img.repository === 'postgres')?.repository + ':15' || 'postgres:15';
    }
    if (lowerName.includes('frontend')) {
      return MASTER_IMAGES.find(img => img.repository === 'denshimon/frontend')?.repository + ':v2.1.0' || 'denshimon/frontend:v2.1.0';
    }
    if (lowerName.includes('grafana')) {
      return 'grafana/grafana:latest';
    }
    if (lowerName.includes('prometheus')) {
      return 'prom/prometheus:latest';
    }
    
    return 'nginx:latest'; // fallback
  }

  private getServiceTypeForApp(appName: string): string {
    const lowerName = appName.toLowerCase();
    
    // Match with MASTER_SERVICES serviceType
    const relatedService = MASTER_SERVICES.find(svc => 
      lowerName.includes(svc.name.split('-')[0]) || 
      svc.name.includes(appName.split('-')[0])
    );
    
    if (relatedService) {
      return relatedService.serviceType;
    }
    
    // Fallback logic
    if (lowerName.includes('frontend') || lowerName.includes('grafana')) return 'frontend';
    if (lowerName.includes('api') || lowerName.includes('prometheus')) return 'backend';
    if (lowerName.includes('postgres') || lowerName.includes('database')) return 'database';
    if (lowerName.includes('redis') || lowerName.includes('cache')) return 'cache';
    if (lowerName.includes('nginx') || lowerName.includes('gateway')) return 'gateway';
    
    return 'backend'; // default
  }

  private getPodPhase(pod: any, deploymentStatus: DeploymentStatus): string {
    // Align pod phase with deployment status
    if (deploymentStatus === DeploymentStatus.FAILED) {
      return Math.random() > 0.7 ? 'Failed' : 'Pending';
    }
    if (deploymentStatus === DeploymentStatus.UPDATING) {
      return Math.random() > 0.5 ? 'Running' : 'Pending';
    }
    if (deploymentStatus === DeploymentStatus.PENDING) {
      return Math.random() > 0.6 ? 'Pending' : 'Running';
    }
    
    // For running deployments, most pods should be running
    return Math.random() > 0.9 ? 'Pending' : 'Running';
  }

  // Public API
  public getDeployments(): Deployment[] {
    return [...this.deployments];
  }

  public getPendingDeployments(): Deployment[] {
    return [...this.pendingDeployments];
  }

  public getDeploymentsByNamespace(namespace: string): Deployment[] {
    if (namespace === 'all') return this.getDeployments();
    return this.deployments.filter(d => d.namespace === namespace);
  }

  public getDeploymentHistory(deploymentId?: string): DeploymentHistory[] {
    if (deploymentId) {
      return this.deploymentHistory.filter(h => h.deploymentId === deploymentId);
    }
    return [...this.deploymentHistory];
  }

  public getDeploymentById(id: string): Deployment | undefined {
    return this.deployments.find(d => d.id === id) || 
           this.pendingDeployments.find(d => d.id === id);
  }

  // Generate consistent metrics that align with deployment data
  public getMetrics() {
    const totalDeployments = this.deployments.length;
    const runningDeployments = this.deployments.filter(d => d.status === DeploymentStatus.RUNNING).length;
    const failedDeployments = this.deployments.filter(d => d.status === DeploymentStatus.FAILED).length;
    const pendingCount = this.pendingDeployments.length;
    
    return {
      totalDeployments,
      runningDeployments,
      failedDeployments,
      pendingDeployments: pendingCount,
      successRate: totalDeployments > 0 ? Math.round((runningDeployments / totalDeployments) * 100) : 100,
      totalPods: this.deployments.reduce((sum, d) => sum + (d.pods?.length || 0), 0),
      totalNamespaces: new Set(this.deployments.map(d => d.namespace)).size,
    };
  }

  // Simulate applying deployments (for testing UI)
  public applyPendingDeployment(deploymentId: string): { success: boolean; error?: string } {
    const deployment = this.pendingDeployments.find(d => d.id === deploymentId);
    if (!deployment) {
      return { success: false, error: 'Deployment not found' };
    }

    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      // Move from pending to active deployments
      deployment.status = DeploymentStatus.RUNNING;
      deployment.applied_by = 'admin';
      deployment.applied_at = new Date().toISOString();
      
      // Remove from pending list
      this.pendingDeployments = this.pendingDeployments.filter(d => d.id !== deploymentId);
      
      // Add to active deployments (or update existing)
      const existingIndex = this.deployments.findIndex(d => d.name === deployment.name);
      if (existingIndex >= 0) {
        this.deployments[existingIndex] = deployment;
      } else {
        this.deployments.push(deployment);
      }
      
      return { success: true };
    } else {
      return { success: false, error: 'ImagePullBackOff: registry authentication failed' };
    }
  }
}

// Create singleton instance
const unifiedMockData = new UnifiedMockDataService();

// Export the service instance and helper functions
export default unifiedMockData;

// Export individual data getters for backward compatibility
export const getUnifiedDeployments = () => unifiedMockData.getDeployments();
export const getUnifiedPendingDeployments = () => unifiedMockData.getPendingDeployments();
export const getUnifiedDeploymentHistory = (deploymentId?: string) => unifiedMockData.getDeploymentHistory(deploymentId);
export const getUnifiedMetrics = () => unifiedMockData.getMetrics();

// Export namespaces and other master data for consistency
export { 
  MASTER_NAMESPACES as unifiedNamespaces,
  MASTER_NODES as unifiedNodes,
  MASTER_REGISTRIES as unifiedRegistries,
  MASTER_IMAGES as unifiedImages,
  MASTER_SERVICES as unifiedServices,
  MASTER_PODS as unifiedPods,
  MASTER_REPOSITORIES as unifiedRepositories
};