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
  MASTER_REGISTRIES,
  MASTER_IMAGES,
  MASTER_DEPLOYMENT_HISTORY,
  MASTER_REPOSITORIES
} from './masterData';

import type { Deployment, DeploymentHistory } from '@/types/deployments';
import { DeploymentStatus, DeploymentStrategy, DeploymentAction, Status, EventCategory } from '@constants';
import type { SystemChangesTimelineData, SystemChange, SystemChangeGroup } from '@/types/systemChangesTimeline';
import type { PodLifecycleMetrics, PodLifecycleEvent, LifecycleTimelineEvent } from '@/types/podLifecycle';

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
      action: hist.action as DeploymentAction,
      oldImage: 'oldImage' in hist ? hist.oldImage : '',
      newImage: 'newImage' in hist ? hist.newImage : 'image' in hist ? hist.image : '',
      oldReplicas: 'oldReplicas' in hist ? hist.oldReplicas : 0,
      newReplicas: 'newReplicas' in hist ? hist.newReplicas : 'replicas' in hist ? hist.replicas : 0,
      success: hist.success,
      error: 'error' in hist ? hist.error : '',
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

  private getPodPhase(_pod: any, deploymentStatus: DeploymentStatus): string {
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

  // Generate system changes timeline data based on unified data
  public generateSystemChangesTimelineData(hours: number = 24): SystemChangesTimelineData {
    const events: SystemChange[] = [];
    const now = Date.now();
    const timeSpan = hours * 60 * 60 * 1000;

    // Generate events based on actual deployment data
    this.deployments.forEach(deployment => {
      const eventCount = Math.floor(Math.random() * 3) + 1; // 1-3 events per deployment
      
      for (let i = 0; i < eventCount; i++) {
        const timestamp = new Date(now - Math.random() * timeSpan).toISOString();
        const categories = [EventCategory.POD, EventCategory.SERVICE, EventCategory.CONFIG, EventCategory.NETWORK];
        const severities = [Status.INFO, Status.SUCCESS, Status.WARNING, Status.CRITICAL];
        
        // More likely to have info/success events than critical
        const severityWeights = [0.4, 0.3, 0.2, 0.1];
        const randomSev = Math.random();
        let severity = Status.INFO;
        let cumulative = 0;
        for (let j = 0; j < severityWeights.length; j++) {
          cumulative += severityWeights[j];
          if (randomSev <= cumulative) {
            severity = severities[j];
            break;
          }
        }

        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Generate realistic events based on deployment state
        const eventTemplates = this.getEventTemplates(deployment, category, severity);
        const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
        
        events.push({
          id: `event-${deployment.name}-${i}-${Math.random().toString(36).substring(2, 8)}`,
          timestamp,
          category,
          severity,
          title: template.title,
          description: template.description,
          source: {
            type: 'deployment',
            name: deployment.name,
            namespace: deployment.namespace
          },
          impact: template.impact,
          duration: template.duration,
          resolved: template.resolved,
          metadata: {
            deploymentId: deployment.id,
            image: deployment.image,
            replicas: deployment.replicas
          }
        });
      }
    });

    // Add some system-level events
    const systemEventCount = Math.floor(hours / 6); // One system event every 6 hours on average
    for (let i = 0; i < systemEventCount; i++) {
      const timestamp = new Date(now - Math.random() * timeSpan).toISOString();
      const systemTemplates = this.getSystemEventTemplates();
      const template = systemTemplates[Math.floor(Math.random() * systemTemplates.length)];
      
      events.push({
        id: `system-event-${i}-${Math.random().toString(36).substring(2, 8)}`,
        timestamp,
        category: template.category,
        severity: template.severity,
        title: template.title,
        description: template.description,
        source: template.source,
        impact: template.impact,
        duration: template.duration,
        resolved: template.resolved
      });
    }

    // Sort events by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Group events by hour
    const groups = this.groupEventsByHour(events);

    // Calculate statistics
    const statistics = this.calculateEventStatistics(events);

    return {
      events,
      groups,
      statistics,
      filters: {
        categories: Object.values(EventCategory),
        severities: Object.values(Status),
        timeRange: `${hours}h`
      }
    };
  }

  private getEventTemplates(deployment: Deployment, category: EventCategory, severity: Status) {
    const templates = [];
    const deploymentName = deployment.name;
    const namespace = deployment.namespace;
    
    switch (category) {
      case EventCategory.POD:
        if (severity === Status.CRITICAL) {
          templates.push({
            title: `Pod crash detected`,
            description: `Pod ${deploymentName}-${Math.random().toString(36).substring(2, 8)} crashed with exit code 1`,
            impact: { affected: 1, total: deployment.replicas, unit: 'pods' },
            duration: Math.random() * 1800000, // 0-30 minutes
            resolved: Math.random() > 0.3
          });
        } else if (severity === Status.WARNING) {
          templates.push({
            title: `Pod restart threshold exceeded`,
            description: `Pod ${deploymentName}-${Math.random().toString(36).substring(2, 8)} has restarted ${Math.floor(Math.random() * 5) + 3} times`,
            impact: { affected: 1, total: deployment.replicas, unit: 'pods' },
            duration: Math.random() * 600000, // 0-10 minutes
            resolved: Math.random() > 0.2
          });
        } else {
          templates.push({
            title: `Pod scheduled successfully`,
            description: `New pod ${deploymentName}-${Math.random().toString(36).substring(2, 8)} scheduled on cluster-main`,
            duration: Math.random() * 120000, // 0-2 minutes
            resolved: true
          });
        }
        break;
        
      case EventCategory.SERVICE:
        if (severity === Status.CRITICAL) {
          templates.push({
            title: `Service endpoint unavailable`,
            description: `Service ${deploymentName} has no available endpoints`,
            impact: { affected: 0, total: deployment.replicas, unit: 'endpoints' },
            duration: Math.random() * 3600000, // 0-60 minutes
            resolved: Math.random() > 0.4
          });
        } else {
          templates.push({
            title: `Service endpoint updated`,
            description: `Service ${deploymentName} endpoints updated to ${deployment.readyReplicas} replicas`,
            resolved: true
          });
        }
        break;
        
      case EventCategory.CONFIG:
        templates.push({
          title: `ConfigMap updated`,
          description: `Configuration updated for ${deploymentName}`,
          resolved: true
        });
        break;
        
      case EventCategory.NETWORK:
        if (severity === Status.WARNING) {
          templates.push({
            title: `Network policy violation`,
            description: `Blocked connection attempt to ${deploymentName} from external source`,
            resolved: true
          });
        } else {
          templates.push({
            title: `Network route established`,
            description: `Traffic routing established for ${deploymentName}`,
            resolved: true
          });
        }
        break;
        
      default:
        templates.push({
          title: `${category} event`,
          description: `${severity} level event for ${deploymentName} in ${namespace}`,
          resolved: Math.random() > 0.3
        });
    }
    
    return templates;
  }

  private getSystemEventTemplates() {
    return [
      {
        category: EventCategory.NODE,
        severity: Status.INFO,
        title: `Node health check passed`,
        description: `Cluster node cluster-main passed all health checks`,
        source: { type: 'node', name: 'cluster-main' },
        impact: undefined,
        duration: undefined,
        resolved: true
      },
      {
        category: EventCategory.SECURITY,
        severity: Status.WARNING,
        title: `Certificate expiring soon`,
        description: `TLS certificate for cluster-main expires in 30 days`,
        source: { type: 'certificate', name: 'cluster-tls' },
        impact: undefined,
        duration: Math.random() * 86400000, // 0-24 hours
        resolved: false
      },
      {
        category: EventCategory.STORAGE,
        severity: Status.INFO,
        title: `Persistent volume provisioned`,
        description: `New PV pv-${Math.random().toString(36).substring(2, 8)} provisioned (10Gi)`,
        source: { type: 'storage', name: 'local-path-provisioner' },
        impact: undefined,
        duration: undefined,
        resolved: true
      }
    ];
  }

  private groupEventsByHour(events: SystemChange[]): SystemChangeGroup[] {
    const groups: Record<string, SystemChange[]> = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();
      
      if (!groups[hourKey]) {
        groups[hourKey] = [];
      }
      groups[hourKey].push(event);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([hour, events]) => ({
        hour,
        events,
        summary: {
          critical: events.filter(e => e.severity === Status.CRITICAL).length,
          warning: events.filter(e => e.severity === Status.WARNING).length,
          info: events.filter(e => e.severity === Status.INFO).length,
          success: events.filter(e => e.severity === Status.SUCCESS).length,
        }
      }));
  }

  private calculateEventStatistics(events: SystemChange[]) {
    const bySeverity: Partial<Record<Status, number>> = {};
    const byCategory: Record<EventCategory, number> = {} as Record<EventCategory, number>;
    
    // Initialize counters
    Object.values(Status).forEach(status => {
      bySeverity[status] = 0;
    });
    Object.values(EventCategory).forEach(category => {
      byCategory[category] = 0;
    });
    
    // Count events
    events.forEach(event => {
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;
    });
    
    const resolvedEvents = events.filter(e => e.resolved && e.duration).length;
    const avgResolutionTime = resolvedEvents > 0 
      ? events.filter(e => e.resolved && e.duration)
          .reduce((sum, e) => sum + (e.duration || 0), 0) / resolvedEvents / 60000 // minutes
      : 5;
    
    const unresolvedCritical = events.filter(e => e.severity === Status.CRITICAL && !e.resolved).length;
    
    return {
      total: events.length,
      bySeverity,
      byCategory,
      recentTrend: 'stable' as const,
      averageResolutionTime: Math.round(avgResolutionTime),
      unresolvedCritical
    };
  }

  // Generate pod lifecycle metrics based on unified data
  public generatePodLifecycleMetrics(timeRange: string = '1h'): PodLifecycleMetrics {
    const hours = this.parseTimeRangeToHours(timeRange);
    const now = Date.now();
    const timeSpan = hours * 60 * 60 * 1000;
    
    // Generate churn data points
    const churnData = [];
    for (let i = 0; i < Math.min(hours, 24); i++) {
      const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString();
      churnData.push({
        timestamp,
        created: Math.floor(Math.random() * 5) + 1,
        terminated: Math.floor(Math.random() * 3),
        failed: Math.floor(Math.random() * 2),
        netChange: Math.floor(Math.random() * 6) - 2
      });
    }
    
    // Generate restart patterns based on actual deployments
    const restartPatterns = this.deployments.flatMap(deployment => 
      deployment.pods?.slice(0, 3).map(pod => ({
        podName: pod.name,
        namespace: deployment.namespace,
        containerName: deployment.name.split('-')[0],
        restartCount: pod.restarts || Math.floor(Math.random() * 5),
        lastRestartTime: new Date(now - Math.random() * timeSpan).toISOString(),
        restartReasons: [
          {
            reason: 'Error',
            count: Math.floor(Math.random() * 3),
            lastOccurrence: new Date(now - Math.random() * timeSpan).toISOString()
          }
        ],
        crashLoopBackOff: Math.random() > 0.8,
        averageUptime: Math.random() * 86400 // 0-24 hours
      })) || []
    );

    // Generate scheduling metrics
    const schedulingMetrics = [];
    for (let i = 0; i < Math.min(hours, 12); i++) {
      const timestamp = new Date(now - i * 2 * 60 * 60 * 1000).toISOString();
      schedulingMetrics.push({
        timestamp,
        pendingPods: Math.floor(Math.random() * 3),
        schedulingDelay: Math.random() * 30, // 0-30 seconds
        schedulingFailures: Math.floor(Math.random() * 2),
        nodeResourceConstraints: Math.floor(Math.random() * 2),
        imagePackFailures: Math.floor(Math.random() * 1)
      });
    }

    // Generate failure analysis based on deployments
    const failureReasons = [
      { reason: 'ImagePullBackOff', color: '#FF4444', trend: 'stable' },
      { reason: 'CrashLoopBackOff', color: '#FF8800', trend: 'decreasing' },
      { reason: 'OutOfMemory', color: '#FFAA00', trend: 'increasing' },
      { reason: 'NodeResourcesUnavailable', color: '#AA44FF', trend: 'stable' }
    ];

    const failureAnalysis = failureReasons.map(reason => ({
      reason: reason.reason,
      count: Math.floor(Math.random() * 10) + 1,
      percentage: Math.random() * 25 + 5, // 5-30%
      recentOccurrences: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
        new Date(now - Math.random() * timeSpan).toISOString()
      ),
      trend: reason.trend as 'increasing' | 'decreasing' | 'stable',
      color: reason.color,
      affectedNamespaces: [...new Set(this.deployments.map(d => d.namespace))].slice(0, Math.floor(Math.random() * 3) + 1)
    }));

    // Generate image pull metrics
    const imagePullMetrics = MASTER_IMAGES.map(image => ({
      imageName: image.fullName,
      registry: image.registry,
      pullCount: Math.floor(Math.random() * 50) + 10,
      averagePullTime: Math.random() * 120 + 30, // 30-150 seconds
      failureRate: Math.random() * 15, // 0-15%
      size: image.size,
      lastPullTime: new Date(now - Math.random() * timeSpan).toISOString()
    }));

    return {
      churnData,
      restartPatterns,
      schedulingMetrics,
      failureAnalysis,
      imagePullMetrics,
      totalEvents: churnData.reduce((sum, d) => sum + d.created + d.terminated + d.failed, 0),
      averagePodLifespan: Math.random() * 86400 * 7, // 0-7 days in seconds
      crashLoopPods: restartPatterns.filter(p => p.crashLoopBackOff).length,
      pendingPods: Math.floor(Math.random() * 3),
      evictedPods: Math.floor(Math.random() * 2),
      lastUpdated: new Date().toISOString()
    };
  }

  // Generate pod lifecycle events
  public generatePodLifecycleEvents(timeRange: string = '1h'): PodLifecycleEvent[] {
    const hours = this.parseTimeRangeToHours(timeRange);
    const now = Date.now();
    const timeSpan = hours * 60 * 60 * 1000;
    const events: PodLifecycleEvent[] = [];

    // Generate events based on deployments
    this.deployments.forEach(deployment => {
      const eventCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < eventCount; i++) {
        const pod = deployment.pods?.[Math.floor(Math.random() * (deployment.pods?.length || 1))];
        if (!pod) continue;

        events.push({
          timestamp: new Date(now - Math.random() * timeSpan).toISOString(),
          podName: pod.name,
          namespace: deployment.namespace,
          eventType: ['created', 'started', 'pulled', 'killed'][Math.floor(Math.random() * 4)] as any,
          reason: 'Normal',
          message: `Successfully ${['created', 'started', 'pulled image for', 'terminated'][Math.floor(Math.random() * 4)]} ${pod.name}`,
          node: pod.nodeName,
          phase: pod.phase as any
        });
      }
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Generate lifecycle timeline events
  public generateLifecycleTimelineEvents(timeRange: string = '1h'): LifecycleTimelineEvent[] {
    const hours = this.parseTimeRangeToHours(timeRange);
    const now = Date.now();
    const timeSpan = hours * 60 * 60 * 1000;
    const events: LifecycleTimelineEvent[] = [];

    // Generate timeline events based on deployments
    const eventTypes = [
      'pod_scheduled', 'container_created', 'image_pulled', 
      'container_started', 'readiness_probe_succeeded', 'pod_terminated'
    ];
    
    const severityLevels = ['low', 'medium', 'high', 'critical'];

    for (let i = 0; i < Math.min(hours * 2, 20); i++) { // 2 events per hour, max 20
      const timestamp = new Date(now - Math.random() * timeSpan).toISOString();
      const deployment = this.deployments[Math.floor(Math.random() * this.deployments.length)];
      
      events.push({
        timestamp,
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)] as any,
        description: `${eventTypes[Math.floor(Math.random() * eventTypes.length)].replace('_', ' ')} for ${deployment.name}`,
        severity: severityLevels[Math.floor(Math.random() * severityLevels.length)] as any,
        affectedPods: Math.floor(Math.random() * deployment.replicas) + 1,
        duration: Math.random() > 0.3 ? Math.random() * 300 : undefined // 0-5 minutes or undefined
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private parseTimeRangeToHours(timeRange: string): number {
    const match = timeRange.match(/(\d+)([mhd])/);
    if (!match) return 1;
    
    const [, value, unit] = match;
    const numValue = parseInt(value);
    
    switch (unit) {
      case 'm': return numValue / 60;
      case 'h': return numValue;
      case 'd': return numValue * 24;
      default: return 1;
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
export const generateSystemChangesTimelineData = (hours?: number) => unifiedMockData.generateSystemChangesTimelineData(hours);
export const generatePodLifecycleMetrics = (timeRange?: string) => unifiedMockData.generatePodLifecycleMetrics(timeRange);
export const generatePodLifecycleEvents = (timeRange?: string) => unifiedMockData.generatePodLifecycleEvents(timeRange);
export const generateLifecycleTimelineEvents = (timeRange?: string) => unifiedMockData.generateLifecycleTimelineEvents(timeRange);

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