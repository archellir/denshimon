export const config = {
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // PASETO Configuration
  PASETO_SECRET_KEY: process.env.PASETO_SECRET_KEY || 'your-32-byte-secret-key-change-in-production-now',
  TOKEN_EXPIRES_IN: process.env.TOKEN_EXPIRES_IN || '24h',
  
  // Redis Configuration (for sessions/cache)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // PostgreSQL Configuration (for audit logs)
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/k8s_webui',
  
  // Kubernetes Configuration
  KUBECONFIG_PATH: process.env.KUBECONFIG_PATH || process.env.HOME + '/.kube/config',
  K8S_NAMESPACE: 'base-infrastructure',
  
  // Infrastructure Services (from k8s manifests)
  INFRASTRUCTURE_SERVICES: {
    postgresql: {
      name: 'postgresql',
      type: 'StatefulSet',
      port: 5432,
      path: '/postgresql',
      description: 'PostgreSQL Database Server'
    },
    gitea: {
      name: 'gitea',
      type: 'Deployment',
      port: 3000,
      path: '/gitea',
      description: 'Git Repository Hosting',
      domain: 'git.arcbjorn.com'
    },
    umami: {
      name: 'umami',
      type: 'Deployment',
      port: 3000,
      path: '/umami',
      description: 'Web Analytics Platform',
      domain: 'analytics.arcbjorn.com'
    },
    memos: {
      name: 'memos',
      type: 'Deployment',
      port: 5230,
      path: '/memos',
      description: 'Notes and Memos Service',
      domain: 'memos.arcbjorn.com'
    },
    'uptime-kuma': {
      name: 'uptime-kuma',
      type: 'Deployment',
      port: 3001,
      path: '/uptime-kuma',
      description: 'Uptime Monitoring Dashboard',
      domain: 'uptime.arcbjorn.com'
    },
    filebrowser: {
      name: 'filebrowser',
      type: 'Deployment',
      port: 8080,
      path: '/filestash',
      description: 'File Browser and Management',
      domain: 'server.arcbjorn.com'
    },
    dozzle: {
      name: 'dozzle',
      type: 'Deployment',
      port: 8080,
      path: '/dozzle',
      description: 'Container Logs Viewer',
      domain: 'logs.arcbjorn.com'
    }
  } as const,
  
  // Ingress Configuration
  INGRESS_DOMAINS: [
    'git.arcbjorn.com',
    'analytics.arcbjorn.com', 
    'uptime.arcbjorn.com',
    'server.arcbjorn.com',
    'logs.arcbjorn.com',
    'memos.arcbjorn.com'
  ] as const,
  
  // Multipass VM Configuration
  MULTIPASS_VM_NAME: process.env.MULTIPASS_VM_NAME || 'k8s-master',
  MULTIPASS_VM_IP: process.env.MULTIPASS_VM_IP || '192.168.64.2'
}

export type InfrastructureServiceName = keyof typeof config.INFRASTRUCTURE_SERVICES
export type InfrastructureService = typeof config.INFRASTRUCTURE_SERVICES[InfrastructureServiceName]