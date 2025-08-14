import type { LogEntry } from '@/types/logs';
import { LogLevel } from '@/constants';

const logMessages = {
  auth: [
    'User authentication successful',
    'Token validation completed',
    'Session expired, requesting refresh',
    'Invalid credentials provided',
    'Rate limit exceeded for IP {ip}',
    'Two-factor authentication enabled',
    'Password changed successfully'
  ],
  api: [
    'API request processed successfully',
    'Rate limiting applied to endpoint',
    'Request timeout after 30s',
    'Invalid request parameters',
    'Database connection restored',
    'Cache miss for key: {key}',
    'API version deprecated warning'
  ],
  k8s: [
    'Pod {pod} started successfully',
    'Failed to connect to Kubernetes cluster',
    'Node {node} marked as NotReady',
    'Deployment {deployment} rolled out',
    'ConfigMap {configmap} updated',
    'Service {service} endpoint changed',
    'Persistent volume claim bound',
    'Resource quota exceeded in namespace {namespace}'
  ],
  gitops: [
    'GitOps repository sync completed',
    'Application {app} health check passed',
    'Sync policy updated for {app}',
    'Git repository authentication failed',
    'Manifest validation error in {file}',
    'Auto-sync triggered for {app}',
    'Rollback completed for {app}'
  ],
  metrics: [
    'Metrics collection updated',
    'High memory usage detected on node {node}',
    'CPU threshold exceeded: {percent}%',
    'Storage space running low',
    'Prometheus scrape failed',
    'Alert rule triggered: {rule}',
    'Metric retention policy applied'
  ],
  database: [
    'Database connection established',
    'Query execution completed in {duration}ms',
    'Connection pool exhausted',
    'Slow query detected: {query}',
    'Database migration completed',
    'Backup completed successfully',
    'Transaction rolled back due to error'
  ]
};

const users = ['admin', 'operator', 'viewer', 'system', 'ci-bot'];
const actions = ['login', 'logout', 'create', 'update', 'delete', 'sync', 'deploy', 'rollback'];

export const generateMockLogs = (count: number = 100): LogEntry[] => {
  const logs: LogEntry[] = [];
  const sources = Object.keys(logMessages);
  
  for (let i = 0; i < count; i++) {
    const source = sources[Math.floor(Math.random() * sources.length)];
    const sourceMessages = logMessages[source as keyof typeof logMessages];
    const rawMessage = sourceMessages[Math.floor(Math.random() * sourceMessages.length)];
    
    // Replace placeholders with realistic values
    const message = rawMessage
      .replace('{pod}', `app-${Math.floor(Math.random() * 100)}-${Math.random().toString(36).substr(2, 5)}`)
      .replace('{node}', `worker-node-${Math.floor(Math.random() * 3) + 1}`)
      .replace('{deployment}', `nginx-deployment`)
      .replace('{configmap}', `app-config`)
      .replace('{service}', `api-service`)
      .replace('{namespace}', ['default', 'production', 'staging'][Math.floor(Math.random() * 3)])
      .replace('{app}', `sample-app-${Math.floor(Math.random() * 5) + 1}`)
      .replace('{file}', `deployment.yaml`)
      .replace('{percent}', (80 + Math.floor(Math.random() * 20)).toString())
      .replace('{rule}', 'HighCPUUsage')
      .replace('{duration}', (100 + Math.floor(Math.random() * 1000)).toString())
      .replace('{query}', 'SELECT * FROM metrics WHERE...')
      .replace('{key}', `cache_key_${Math.random().toString(36).substr(2, 8)}`)
      .replace('{ip}', `192.168.1.${Math.floor(Math.random() * 255)}`);
    
    // Determine log level based on message content
    let level: LogEntry['level'] = LogLevel.INFO;
    if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('invalid')) {
      level = LogLevel.ERROR;
    } else if (message.toLowerCase().includes('warning') || message.toLowerCase().includes('exceeded') || message.toLowerCase().includes('slow')) {
      level = LogLevel.WARN;
    } else if (message.toLowerCase().includes('debug') || message.toLowerCase().includes('trace')) {
      level = LogLevel.DEBUG;
    }
    
    const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    const user = Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : undefined;
    const action = Math.random() > 0.4 ? actions[Math.floor(Math.random() * actions.length)] : undefined;
    
    logs.push({
      id: `log-${Date.now()}-${i}`,
      timestamp,
      level,
      source,
      message,
      user,
      action,
      metadata: {
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        duration: Math.floor(Math.random() * 5000),
        ...(level === 'error' && { error_code: `ERR_${Math.floor(Math.random() * 9999)}` }),
        ...(source === 'k8s' && { cluster: 'production' }),
        ...(source === 'gitops' && { repository: 'git@github.com:company/k8s-configs.git' })
      }
    });
  }
  
  // Sort by timestamp (most recent first)
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const mockLogs = generateMockLogs();