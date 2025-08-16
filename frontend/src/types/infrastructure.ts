export interface BaseInfrastructureRepo {
  id: string;
  name: string;
  url: string;
  branch: string;
  status: 'active' | 'syncing' | 'error';
  last_sync?: string;
  sync_status: 'synced' | 'out_of_sync' | 'error';
  health: 'healthy' | 'degraded' | 'unknown';
}

export interface SyncMetrics {
  last_sync_time?: string;
  total_applications: number;
  synced_applications: number;
  out_of_sync_applications: number;
  recent_deployments: number;
}