import { QueryResult, SavedQuery } from '@/types/database';

export const mockQueryResults: Record<string, QueryResult> = {
  'SELECT * FROM users LIMIT 5': {
    columns: ['id', 'username', 'email', 'role', 'is_active', 'last_login', 'created_at', 'first_name', 'last_name', 'phone', 'department', 'manager_id', 'salary', 'hire_date', 'address', 'city', 'country', 'postal_code', 'emergency_contact', 'skills', 'certifications', 'performance_rating', 'notes'],
    rows: [
      [1, 'admin', 'admin@denshimon.local', 'admin', true, '2024-01-20T14:25:00Z', '2024-01-01T10:00:00Z', 'System', 'Administrator', '+1-555-0001', 'IT', null, 120000, '2024-01-01', '123 Main St', 'New York', 'USA', '10001', 'Jane Doe +1-555-9999', 'Python,Kubernetes,PostgreSQL,React', 'CKA,CKAD,AWS Solutions Architect', 9.5, 'Primary system administrator with full cluster access'],
      [2, 'john_doe', 'john@company.com', 'operator', true, '2024-01-20T13:45:00Z', '2024-01-02T09:15:00Z', 'John', 'Doe', '+1-555-0002', 'Operations', 1, 85000, '2024-01-02', '456 Oak Ave', 'Boston', 'USA', '02101', 'Mary Smith +1-555-8888', 'Docker,Prometheus,Grafana,Linux', 'Docker Certified Associate', 8.7, 'Experienced operations engineer specializing in monitoring and alerting systems'],
      [3, 'jane_smith', 'jane@company.com', 'viewer', true, '2024-01-20T12:30:00Z', '2024-01-02T10:30:00Z', 'Jane', 'Smith', '+1-555-0003', 'Development', 1, 95000, '2024-01-02', '789 Pine Rd', 'Seattle', 'USA', '98101', 'Bob Johnson +1-555-7777', 'JavaScript,TypeScript,React,Node.js', 'AWS Developer Associate', 9.1, 'Full-stack developer with expertise in modern web technologies'],
      [4, 'mike_wilson', 'mike@company.com', 'operator', true, '2024-01-19T16:20:00Z', '2024-01-03T11:45:00Z', 'Michael', 'Wilson', '+1-555-0004', 'Security', 1, 110000, '2024-01-03', '321 Elm St', 'Austin', 'USA', '73301', 'Lisa Brown +1-555-6666', 'Security,Penetration Testing,SIEM', 'CISSP,CEH', 9.3, 'Senior security engineer responsible for vulnerability assessments and security monitoring'],
      [5, 'sarah_connor', 'sarah@company.com', 'viewer', false, null, '2024-01-03T14:20:00Z', 'Sarah', 'Connor', '+1-555-0005', 'QA', 1, 75000, '2024-01-03', '654 Maple Dr', 'Portland', 'USA', '97201', 'Tom Wilson +1-555-5555', 'Test Automation,Selenium,Jest', 'ISTQB Foundation', 8.2, 'Quality assurance engineer focusing on automated testing frameworks and CI/CD integration'],
      [6, 'alex_rodriguez', 'alex@company.com', 'operator', true, '2024-01-19T15:30:00Z', '2024-01-04T08:00:00Z', 'Alexander', 'Rodriguez', '+1-555-0006', 'DevOps', 1, 105000, '2024-01-04', '987 Cedar Ln', 'Denver', 'USA', '80201', 'Maria Garcia +1-555-4444', 'Terraform,Ansible,Jenkins,AWS', 'Terraform Associate,Jenkins Engineer', 9.0, 'DevOps engineer specializing in infrastructure as code and CI/CD pipeline automation'],
      [7, 'emma_davis', 'emma@company.com', 'viewer', true, '2024-01-19T14:15:00Z', '2024-01-05T09:30:00Z', 'Emma', 'Davis', '+1-555-0007', 'Data Science', 2, 115000, '2024-01-05', '147 Birch Ave', 'San Francisco', 'USA', '94101', 'David Kim +1-555-3333', 'Python,R,Machine Learning,SQL', 'Google Cloud Data Engineer', 9.4, 'Senior data scientist working on predictive analytics and machine learning models for system optimization'],
      [8, 'robert_taylor', 'robert@company.com', 'operator', true, '2024-01-19T13:00:00Z', '2024-01-06T10:45:00Z', 'Robert', 'Taylor', '+1-555-0008', 'Platform', 1, 98000, '2024-01-06', '258 Spruce St', 'Chicago', 'USA', '60601', 'Jennifer Lee +1-555-2222', 'Kubernetes,Helm,Istio,Prometheus', 'CKS,Prometheus Certified', 8.9, 'Platform engineer maintaining Kubernetes clusters and service mesh infrastructure'],
      [9, 'lisa_anderson', 'lisa@company.com', 'admin', true, '2024-01-19T12:45:00Z', '2024-01-07T11:15:00Z', 'Lisa', 'Anderson', '+1-555-0009', 'Engineering', null, 140000, '2024-01-07', '369 Willow Way', 'Miami', 'USA', '33101', 'Chris Parker +1-555-1111', 'Leadership,Architecture,Cloud Native', 'Enterprise Architect,TOGAF', 9.6, 'Engineering manager overseeing platform architecture and technical strategy'],
      [10, 'kevin_white', 'kevin@company.com', 'viewer', true, '2024-01-19T11:30:00Z', '2024-01-08T12:00:00Z', 'Kevin', 'White', '+1-555-0010', 'Support', 3, 65000, '2024-01-08', '741 Poplar Pl', 'Phoenix', 'USA', '85001', 'Sandra Miller +1-555-0000', 'Customer Support,Documentation,Jira', 'ITIL Foundation', 8.5, 'Technical support specialist handling customer inquiries and documentation'],
      [11, 'amy_martinez', 'amy@company.com', 'operator', true, '2024-01-19T10:15:00Z', '2024-01-09T13:30:00Z', 'Amy', 'Martinez', '+1-555-0011', 'Monitoring', 2, 92000, '2024-01-09', '852 Aspen Ct', 'Las Vegas', 'USA', '89101', 'Michael Brown +1-555-1234', 'Grafana,Prometheus,Elasticsearch,Kibana', 'Elastic Certified Engineer', 8.8, 'Monitoring and observability engineer responsible for metrics collection and alerting systems'],
      [12, 'daniel_garcia', 'daniel@company.com', 'viewer', true, '2024-01-19T09:00:00Z', '2024-01-10T14:45:00Z', 'Daniel', 'Garcia', '+1-555-0012', 'Frontend', 4, 88000, '2024-01-10', '963 Hickory Dr', 'Atlanta', 'USA', '30301', 'Ashley Davis +1-555-5678', 'React,Vue.js,Angular,CSS,HTML', 'Google UX Design Certificate', 8.6, 'Frontend developer creating responsive user interfaces and improving user experience'],
      [13, 'melissa_johnson', 'melissa@company.com', 'operator', true, '2024-01-19T08:45:00Z', '2024-01-11T15:00:00Z', 'Melissa', 'Johnson', '+1-555-0013', 'Backend', 4, 96000, '2024-01-11', '159 Sycamore St', 'Detroit', 'USA', '48201', 'Ryan Wilson +1-555-9876', 'Java,Spring Boot,Microservices,Kafka', 'Oracle Java Certified Professional', 9.2, 'Backend developer building scalable microservices and API integrations'],
      [14, 'brian_lee', 'brian@company.com', 'admin', true, '2024-01-19T07:30:00Z', '2024-01-12T16:15:00Z', 'Brian', 'Lee', '+1-555-0014', 'Database', null, 125000, '2024-01-12', '357 Magnolia Ave', 'Houston', 'USA', '77001', 'Kelly Thompson +1-555-4567', 'PostgreSQL,MongoDB,Redis,Database Tuning', 'PostgreSQL Certified Professional', 9.7, 'Database administrator managing high-performance database clusters and optimization'],
      [15, 'stephanie_brown', 'stephanie@company.com', 'viewer', false, null, '2024-01-13T17:30:00Z', 'Stephanie', 'Brown', '+1-555-0015', 'Compliance', 5, 78000, '2024-01-13', '468 Dogwood Ln', 'Philadelphia', 'USA', '19101', 'Mark Anderson +1-555-7890', 'Compliance,Risk Management,Auditing', 'Certified Risk Management Professional', 8.0, 'Compliance specialist ensuring adherence to security policies and regulatory requirements']
    ],
    rowCount: 15,
    duration: 12.45
  },
  'SELECT * FROM pods WHERE status = \'Running\' LIMIT 10': {
    columns: ['id', 'name', 'namespace', 'node_name', 'status', 'cpu_usage', 'memory_usage', 'created_at', 'updated_at', 'restart_count', 'pod_ip', 'host_ip', 'phase', 'qos_class', 'service_account', 'priority', 'dns_policy', 'restart_policy', 'termination_grace_period', 'image_pull_policy', 'security_context', 'volume_mounts', 'environment_vars', 'resource_requests', 'resource_limits', 'labels', 'annotations', 'owner_references', 'finalizers'],
    rows: [
      [1, 'denshimon-web-7d4f8b9c-x8k2m', 'default', 'node-1', 'Running', 0.25, 268435456, '2024-01-20T10:00:00Z', '2024-01-20T14:25:00Z', 0, '10.244.1.15', '192.168.1.101', 'Running', 'BestEffort', 'default', 0, 'ClusterFirst', 'Always', 30, 'IfNotPresent', '{"runAsNonRoot":true,"runAsUser":1000}', '/app/config:/etc/config,/app/logs:/var/log', 'NODE_ENV=production,PORT=3000,DB_HOST=postgresql', '{"cpu":"100m","memory":"128Mi"}', '{"cpu":"500m","memory":"512Mi"}', '{"app":"denshimon-web","version":"v1.2.3","tier":"frontend"}', '{"deployment.kubernetes.io/revision":"3","kubectl.kubernetes.io/last-applied-configuration":"..."}', '[{"apiVersion":"apps/v1","kind":"ReplicaSet","name":"denshimon-web-7d4f8b9c"}]', '["finalizer.resources.gardener.cloud"]'],
      [2, 'denshimon-api-8f9g2h3-y9l3n', 'default', 'node-2', 'Running', 0.35, 536870912, '2024-01-20T10:05:00Z', '2024-01-20T14:20:00Z', 1, '10.244.2.23', '192.168.1.102', 'Running', 'Guaranteed', 'api-service-account', 100, 'ClusterFirst', 'Always', 30, 'Always', '{"runAsNonRoot":true,"runAsUser":2000,"fsGroup":2000}', '/app/secrets:/etc/secrets,/app/cache:/var/cache', 'NODE_ENV=production,API_VERSION=v2,LOG_LEVEL=info,REDIS_URL=redis://redis-cache:6379', '{"cpu":"200m","memory":"256Mi"}', '{"cpu":"1000m","memory":"1Gi"}', '{"app":"denshimon-api","version":"v2.1.0","tier":"backend","component":"api"}', '{"prometheus.io/scrape":"true","prometheus.io/port":"8080","deployment.kubernetes.io/revision":"5"}', '[{"apiVersion":"apps/v1","kind":"ReplicaSet","name":"denshimon-api-8f9g2h3"}]', '[]'],
      [3, 'postgresql-master-6c7d8e9f-z0m4o', 'database', 'node-3', 'Running', 0.80, 2147483648, '2024-01-20T09:30:00Z', '2024-01-20T14:15:00Z', 0, '10.244.3.5', '192.168.1.103', 'Running', 'Guaranteed', 'postgresql-sa', 1000, 'ClusterFirst', 'Always', 60, 'IfNotPresent', '{"runAsUser":999,"fsGroup":999}', '/var/lib/postgresql/data:/var/lib/postgresql/data,/etc/postgresql:/etc/postgresql', 'POSTGRES_DB=denshimon,POSTGRES_USER=admin,PGDATA=/var/lib/postgresql/data/pgdata', '{"cpu":"500m","memory":"1Gi"}', '{"cpu":"2000m","memory":"4Gi"}', '{"app":"postgresql","role":"master","tier":"database","version":"15.4"}', '{"postgresql.org/cluster":"main","backup.postgresql.org/enabled":"true"}', '[{"apiVersion":"apps/v1","kind":"StatefulSet","name":"postgresql-master"}]', '["postgresql.finalizers/cleanup"]'],
      [4, 'redis-cache-5b6c7d8e-a1n5p', 'cache', 'node-1', 'Running', 0.15, 134217728, '2024-01-20T09:45:00Z', '2024-01-20T14:10:00Z', 0, '10.244.1.45', '192.168.1.101', 'Running', 'BestEffort', 'redis-sa', 0, 'ClusterFirst', 'Always', 30, 'IfNotPresent', '{"runAsUser":999}', '/data:/data,/etc/redis:/usr/local/etc/redis', 'REDIS_PORT=6379,REDIS_MAXMEMORY=100mb,REDIS_MAXMEMORY_POLICY=allkeys-lru', '{"cpu":"50m","memory":"64Mi"}', '{"cpu":"200m","memory":"256Mi"}', '{"app":"redis","role":"cache","tier":"cache","version":"7.0"}', '{"redis.io/cluster":"main","monitoring.coreos.com/enabled":"true"}', '[{"apiVersion":"apps/v1","kind":"Deployment","name":"redis-cache"}]', '[]'],
      [5, 'nginx-ingress-4a5b6c7d-b2o6q', 'ingress', 'node-2', 'Running', 0.20, 67108864, '2024-01-20T09:15:00Z', '2024-01-20T14:05:00Z', 0, '10.244.2.8', '192.168.1.102', 'Running', 'BestEffort', 'nginx-ingress-serviceaccount', 0, 'ClusterFirst', 'Always', 30, 'IfNotPresent', '{"runAsUser":101,"capabilities":{"add":["NET_BIND_SERVICE"],"drop":["ALL"]}}', '/etc/nginx:/etc/nginx,/var/log/nginx:/var/log/nginx', 'POD_NAME=$(POD_NAME),POD_NAMESPACE=$(POD_NAMESPACE),POD_IP=$(POD_IP)', '{"cpu":"100m","memory":"90Mi"}', '{"cpu":"500m","memory":"256Mi"}', '{"app":"nginx-ingress","component":"controller","tier":"ingress"}', '{"nginx.ingress.kubernetes.io/ssl-redirect":"true","cert-manager.io/cluster-issuer":"letsencrypt-prod"}', '[{"apiVersion":"apps/v1","kind":"DaemonSet","name":"nginx-ingress"}]', '[]'],
      [6, 'prometheus-server-3z4y5x6w-c3p7r', 'monitoring', 'node-3', 'Running', 0.45, 1073741824, '2024-01-20T08:30:00Z', '2024-01-20T14:00:00Z', 0, '10.244.3.12', '192.168.1.103', 'Running', 'Guaranteed', 'prometheus', 0, 'ClusterFirst', 'Always', 30, 'IfNotPresent', '{"runAsUser":65534,"runAsNonRoot":true,"fsGroup":65534}', '/prometheus:/prometheus,/etc/prometheus:/etc/prometheus', 'PROMETHEUS_RETENTION_TIME=15d,PROMETHEUS_STORAGE_PATH=/prometheus', '{"cpu":"200m","memory":"512Mi"}', '{"cpu":"1000m","memory":"2Gi"}', '{"app":"prometheus","component":"server","version":"v2.45.0"}', '{"prometheus.io/scrape":"false","backup.velero.io/backup-volumes":"prometheus-storage"}', '[{"apiVersion":"apps/v1","kind":"StatefulSet","name":"prometheus-server"}]', '["prometheus.finalizers/cleanup"]'],
      [7, 'grafana-dashboard-2y3x4w5v-d4q8s', 'monitoring', 'node-1', 'Running', 0.30, 536870912, '2024-01-20T08:45:00Z', '2024-01-20T13:55:00Z', 0, '10.244.1.67', '192.168.1.101', 'Running', 'BestEffort', 'grafana', 0, 'ClusterFirst', 'Always', 30, 'IfNotPresent', '{"runAsUser":472,"runAsNonRoot":true}', '/var/lib/grafana:/var/lib/grafana,/etc/grafana:/etc/grafana', 'GF_SECURITY_ADMIN_PASSWORD=admin123,GF_INSTALL_PLUGINS=grafana-piechart-panel', '{"cpu":"100m","memory":"128Mi"}', '{"cpu":"500m","memory":"1Gi"}', '{"app":"grafana","component":"dashboard","tier":"monitoring"}', '{"grafana.com/dashboards":"kubernetes,prometheus","backup.velero.io/backup-volumes":"grafana-storage"}', '[{"apiVersion":"apps/v1","kind":"Deployment","name":"grafana-dashboard"}]', '[]'],
      [8, 'loki-logs-1x2w3v4u-e5r9t', 'monitoring', 'node-2', 'Running', 0.25, 805306368, '2024-01-20T08:20:00Z', '2024-01-20T13:50:00Z', 0, '10.244.2.34', '192.168.1.102', 'Running', 'Guaranteed', 'loki', 0, 'ClusterFirst', 'Always', 30, 'IfNotPresent', '{"runAsUser":10001,"runAsNonRoot":true,"fsGroup":10001}', '/loki:/loki,/etc/loki:/etc/loki', 'LOKI_CONFIG_FILE=/etc/loki/local-config.yaml', '{"cpu":"100m","memory":"256Mi"}', '{"cpu":"500m","memory":"1Gi"}', '{"app":"loki","component":"server","version":"v2.9.0"}', '{"loki.grafana.com/scrape":"true","prometheus.io/port":"3100"}', '[{"apiVersion":"apps/v1","kind":"StatefulSet","name":"loki-logs"}]', '["loki.finalizers/cleanup"]'],
      [9, 'vault-secrets-0w1v2u3t-f6s0u', 'security', 'node-3', 'Running', 0.10, 134217728, '2024-01-20T07:30:00Z', '2024-01-20T13:45:00Z', 0, '10.244.3.89', '192.168.1.103', 'Running', 'BestEffort', 'vault', 1000, 'ClusterFirst', 'Always', 30, 'IfNotPresent', '{"runAsUser":100,"runAsNonRoot":true,"capabilities":{"add":["IPC_LOCK"]}}', '/vault/data:/vault/data,/vault/config:/vault/config', 'VAULT_DEV_ROOT_TOKEN_ID=myroot,VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200', '{"cpu":"50m","memory":"64Mi"}', '{"cpu":"500m","memory":"256Mi"}', '{"app":"vault","component":"server","version":"v1.15.0"}', '{"vault.hashicorp.com/agent-inject":"true","prometheus.io/scrape":"true","prometheus.io/port":"8200"}', '[{"apiVersion":"apps/v1","kind":"StatefulSet","name":"vault-secrets"}]', '["vault.finalizers/cleanup"]'],
      [10, 'cert-manager-9v0u1t2s-g7t1v', 'security', 'node-1', 'Running', 0.05, 67108864, '2024-01-20T07:45:00Z', '2024-01-20T13:40:00Z', 0, '10.244.1.98', '192.168.1.101', 'Running', 'BestEffort', 'cert-manager', 0, 'ClusterFirst', 'Always', 30, 'IfNotPresent', '{"runAsNonRoot":true}', '/tmp:/tmp', 'POD_NAMESPACE=$(POD_NAMESPACE)', '{"cpu":"10m","memory":"32Mi"}', '{"cpu":"100m","memory":"128Mi"}', '{"app":"cert-manager","component":"controller","version":"v1.13.0"}', '{"cert-manager.io/cluster-issuer":"letsencrypt-prod","prometheus.io/scrape":"true","prometheus.io/port":"9402"}', '[{"apiVersion":"apps/v1","kind":"Deployment","name":"cert-manager"}]', '[]'],
      [11, 'elasticsearch-data-7k8l9m0n-p1q2r', 'logging', 'node-2', 'Running', 0.60, 3221225472, '2024-01-20T07:00:00Z', '2024-01-20T13:35:00Z', 0, '10.244.2.56', '192.168.1.102', 'Running', 'Guaranteed', 'elasticsearch', 0, 'ClusterFirst', 'Always', 60, 'IfNotPresent', '{"runAsUser":1000,"fsGroup":1000}', '/usr/share/elasticsearch/data:/usr/share/elasticsearch/data,/usr/share/elasticsearch/config:/usr/share/elasticsearch/config', 'ES_JAVA_OPTS=-Xms2g -Xmx2g,discovery.type=zen,cluster.name=denshimon-logs', '{"cpu":"500m","memory":"2Gi"}', '{"cpu":"2000m","memory":"4Gi"}', '{"app":"elasticsearch","role":"data","cluster":"denshimon-logs","version":"8.10.0"}', '{"elasticsearch.k8s.elastic.co/cluster-name":"denshimon","co.elastic.logs/enabled":"false"}', '[{"apiVersion":"apps/v1","kind":"StatefulSet","name":"elasticsearch-data"}]', '["elasticsearch.finalizers/cleanup"]'],
      [12, 'kibana-ui-6j7k8l9m-n0o1p', 'logging', 'node-3', 'Running', 0.35, 1073741824, '2024-01-20T06:45:00Z', '2024-01-20T13:30:00Z', 0, '10.244.3.78', '192.168.1.103', 'Running', 'BestEffort', 'kibana', 0, 'ClusterFirst', 'Always', 30, 'IfNotPresent', '{"runAsUser":1000,"runAsNonRoot":true}', '/usr/share/kibana/config:/usr/share/kibana/config,/usr/share/kibana/data:/usr/share/kibana/data', 'ELASTICSEARCH_HOSTS=http://elasticsearch:9200,KIBANA_SYSTEM_PASSWORD=kibana123', '{"cpu":"200m","memory":"512Mi"}', '{"cpu":"1000m","memory":"2Gi"}', '{"app":"kibana","component":"ui","version":"8.10.0"}', '{"kibana.k8s.elastic.co/cluster-name":"denshimon","co.elastic.logs/enabled":"false"}', '[{"apiVersion":"apps/v1","kind":"Deployment","name":"kibana-ui"}]', '[]']
    ],
    rowCount: 12,
    duration: 8.92
  },
  'SELECT metric_name, AVG(value) as avg_value FROM metrics WHERE timestamp >= NOW() - INTERVAL \'1 hour\' GROUP BY metric_name': {
    columns: ['metric_name', 'avg_value'],
    rows: [
      ['cpu_usage_percent', 34.56],
      ['memory_usage_percent', 67.89],
      ['disk_usage_percent', 45.23],
      ['network_bytes_in', 1234567.89],
      ['network_bytes_out', 987654.32],
      ['pod_count', 156.0],
      ['node_count', 12.0],
      ['error_rate', 0.023]
    ],
    rowCount: 8,
    duration: 25.73
  },
  'SELECT COUNT(*) as total_users, COUNT(CASE WHEN is_active THEN 1 END) as active_users FROM users': {
    columns: ['total_users', 'active_users'],
    rows: [
      [15420, 14892]
    ],
    rowCount: 1,
    duration: 3.21
  },
  'SHOW TABLES': {
    columns: ['table_name'],
    rows: [
      ['users'],
      ['pods'],
      ['nodes'],
      ['deployments'],
      ['metrics'],
      ['logs'],
      ['events'],
      ['auth_sessions'],
      ['user_preferences'],
      ['cluster_health_view']
    ],
    rowCount: 10,
    duration: 2.15
  },
  'SELECT * FROM cache_entries ORDER BY created_at DESC LIMIT 5': {
    columns: ['id', 'key', 'expires_at', 'created_at', 'size_bytes'],
    rows: [
      [45623, 'user:session:abc123', 1705764600, 1705761000, 1024],
      [45622, 'metrics:cpu:node-1', 1705764300, 1705760700, 2048],
      [45621, 'pods:namespace:default', 1705764000, 1705760400, 4096],
      [45620, 'config:ingress:rules', 1705763700, 1705760100, 512],
      [45619, 'auth:permissions:admin', 1705763400, 1705759800, 256]
    ],
    rowCount: 5,
    duration: 1.23
  },
  'SELECT * FROM system_metrics_detailed ORDER BY timestamp DESC LIMIT 50': {
    columns: ['id', 'timestamp', 'node_name', 'pod_name', 'namespace', 'container_name', 'cpu_usage_cores', 'cpu_usage_percent', 'memory_usage_bytes', 'memory_usage_percent', 'memory_limit_bytes', 'disk_usage_bytes', 'disk_usage_percent', 'network_rx_bytes', 'network_tx_bytes', 'network_rx_packets', 'network_tx_packets', 'filesystem_usage_bytes', 'filesystem_available_bytes', 'load_average_1m', 'load_average_5m', 'load_average_15m', 'uptime_seconds', 'boot_time', 'processes_running', 'processes_blocked', 'context_switches_total', 'interrupts_total', 'forks_total', 'open_files', 'max_files', 'tcp_connections', 'udp_connections', 'kernel_version', 'os_version', 'architecture', 'cpu_model', 'cpu_cores', 'cpu_threads', 'memory_total_bytes', 'swap_usage_bytes', 'swap_total_bytes'],
    rows: [
      [1, '2024-01-20T14:30:00Z', 'node-1', 'denshimon-web-7d4f8b9c-x8k2m', 'default', 'denshimon-web', 0.25, 12.5, 268435456, 6.25, 4294967296, 1073741824, 15.3, 1234567890, 987654321, 123456, 98765, 536870912, 3758096384, 1.2, 1.8, 2.1, 864000, 1705747200, 145, 2, 1250000, 980000, 15432, 1024, 65536, 89, 45, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 4, 8, 8589934592, 0, 2147483648],
      [2, '2024-01-20T14:29:00Z', 'node-1', 'denshimon-web-7d4f8b9c-x8k2m', 'default', 'denshimon-web', 0.23, 11.5, 251658240, 5.85, 4294967296, 1073741824, 15.3, 1223456789, 976543210, 122345, 97654, 536870912, 3758096384, 1.1, 1.7, 2.0, 863940, 1705747200, 143, 1, 1249800, 979800, 15431, 1020, 65536, 88, 44, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 4, 8, 8589934592, 0, 2147483648],
      [3, '2024-01-20T14:28:00Z', 'node-2', 'denshimon-api-8f9g2h3-y9l3n', 'default', 'denshimon-api', 0.35, 17.5, 536870912, 12.5, 4294967296, 2147483648, 30.2, 2345678901, 1876543210, 234567, 187654, 1073741824, 2684354560, 2.4, 2.1, 2.3, 864060, 1705747140, 189, 3, 1780000, 1320000, 18567, 1512, 65536, 156, 78, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 8, 16, 17179869184, 104857600, 4294967296],
      [4, '2024-01-20T14:27:00Z', 'node-3', 'postgresql-master-6c7d8e9f-z0m4o', 'database', 'postgresql', 0.80, 40.0, 2147483648, 50.0, 4294967296, 8589934592, 45.7, 3456789012, 2765432109, 345678, 276543, 4294967296, 4294967296, 3.2, 3.5, 3.8, 864120, 1705747080, 234, 5, 2340000, 1890000, 23456, 2048, 65536, 234, 123, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 8, 16, 34359738368, 536870912, 8589934592],
      [5, '2024-01-20T14:26:00Z', 'node-1', 'redis-cache-5b6c7d8e-a1n5p', 'cache', 'redis', 0.15, 7.5, 134217728, 3.125, 4294967296, 268435456, 3.8, 567890123, 456789012, 56789, 45678, 134217728, 4160749568, 0.8, 1.2, 1.5, 863880, 1705747200, 98, 1, 890000, 720000, 9876, 512, 65536, 45, 23, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 4, 8, 8589934592, 0, 2147483648],
      [6, '2024-01-20T14:25:00Z', 'node-2', 'nginx-ingress-4a5b6c7d-b2o6q', 'ingress', 'nginx', 0.20, 10.0, 67108864, 1.56, 4294967296, 134217728, 1.9, 678901234, 567890123, 67890, 56789, 67108864, 4227858432, 1.5, 1.8, 2.0, 864000, 1705747140, 123, 2, 1120000, 890000, 12345, 768, 65536, 67, 34, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 8, 16, 17179869184, 104857600, 4294967296],
      [7, '2024-01-20T14:24:00Z', 'node-3', 'prometheus-server-3z4y5x6w-c3p7r', 'monitoring', 'prometheus', 0.45, 22.5, 1073741824, 25.0, 4294967296, 2147483648, 28.4, 789012345, 678901234, 78901, 67890, 2147483648, 2147483648, 2.8, 2.5, 2.7, 864180, 1705747080, 178, 4, 1890000, 1450000, 18901, 1280, 65536, 134, 67, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 8, 16, 34359738368, 536870912, 8589934592],
      [8, '2024-01-20T14:23:00Z', 'node-1', 'grafana-dashboard-2y3x4w5v-d4q8s', 'monitoring', 'grafana', 0.30, 15.0, 536870912, 12.5, 4294967296, 1073741824, 18.7, 890123456, 789012345, 89012, 78901, 1073741824, 3221225472, 1.8, 2.2, 2.4, 863940, 1705747200, 156, 3, 1340000, 1120000, 15678, 1024, 65536, 89, 45, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 4, 8, 8589934592, 0, 2147483648],
      [9, '2024-01-20T14:22:00Z', 'node-2', 'loki-logs-1x2w3v4u-e5r9t', 'monitoring', 'loki', 0.25, 12.5, 805306368, 18.75, 4294967296, 1610612736, 23.1, 901234567, 890123456, 90123, 89012, 1610612736, 2684354560, 2.0, 2.3, 2.5, 864060, 1705747140, 167, 3, 1560000, 1230000, 16789, 1152, 65536, 112, 56, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 8, 16, 17179869184, 104857600, 4294967296],
      [10, '2024-01-20T14:21:00Z', 'node-3', 'vault-secrets-0w1v2u3t-f6s0u', 'security', 'vault', 0.10, 5.0, 134217728, 3.125, 4294967296, 268435456, 4.2, 123456789, 123456789, 12345, 12345, 268435456, 4026531840, 0.5, 0.8, 1.1, 864240, 1705747080, 87, 1, 670000, 540000, 8765, 384, 65536, 34, 17, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 8, 16, 34359738368, 536870912, 8589934592],
      [11, '2024-01-20T14:20:00Z', 'node-1', 'cert-manager-9v0u1t2s-g7t1v', 'security', 'cert-manager', 0.05, 2.5, 67108864, 1.56, 4294967296, 134217728, 2.1, 234567890, 234567890, 23456, 23456, 134217728, 4160749568, 0.3, 0.5, 0.8, 863880, 1705747200, 65, 0, 450000, 360000, 5432, 256, 65536, 23, 12, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 4, 8, 8589934592, 0, 2147483648],
      [12, '2024-01-20T14:19:00Z', 'node-2', 'elasticsearch-data-7k8l9m0n-p1q2r', 'logging', 'elasticsearch', 0.60, 30.0, 3221225472, 75.0, 4294967296, 8589934592, 67.8, 345678901, 345678901, 34567, 34567, 8589934592, 0, 4.5, 4.2, 4.8, 864000, 1705747140, 298, 7, 3450000, 2890000, 34567, 2560, 65536, 289, 145, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 8, 16, 17179869184, 1073741824, 4294967296],
      [13, '2024-01-20T14:18:00Z', 'node-3', 'kibana-ui-6j7k8l9m-n0o1p', 'logging', 'kibana', 0.35, 17.5, 1073741824, 25.0, 4294967296, 2147483648, 34.5, 456789012, 456789012, 45678, 45678, 2147483648, 2147483648, 2.8, 3.1, 3.4, 864060, 1705747080, 189, 4, 2340000, 1890000, 23456, 1536, 65536, 167, 84, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 8, 16, 34359738368, 536870912, 8589934592],
      [14, '2024-01-20T14:17:00Z', 'node-1', 'fluentd-collector-5i6j7k8l-m9n0o', 'logging', 'fluentd', 0.20, 10.0, 268435456, 6.25, 4294967296, 536870912, 8.9, 567890123, 567890123, 56789, 56789, 536870912, 3758096384, 1.2, 1.5, 1.8, 863940, 1705747200, 134, 2, 1120000, 890000, 14567, 768, 65536, 78, 39, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 4, 8, 8589934592, 0, 2147483648],
      [15, '2024-01-20T14:16:00Z', 'node-2', 'jaeger-query-4h5i6j7k-l8m9n', 'tracing', 'jaeger', 0.25, 12.5, 536870912, 12.5, 4294967296, 1073741824, 15.7, 678901234, 678901234, 67890, 67890, 1073741824, 3221225472, 1.8, 2.1, 2.4, 864000, 1705747140, 145, 3, 1340000, 1080000, 15678, 896, 65536, 89, 45, 'Linux 5.15.0-78-generic', 'Ubuntu 22.04.3 LTS', 'x86_64', 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz', 8, 16, 17179869184, 104857600, 4294967296]
    ],
    rowCount: 15,
    duration: 45.67
  }
};

export const mockQueryHistory = [
  {
    id: '1',
    sql: 'SELECT * FROM users WHERE role = \'admin\'',
    timestamp: '2024-01-20T14:25:00Z',
    duration: 15.23,
    rowCount: 12,
    status: 'success'
  },
  {
    id: '2',
    sql: 'SELECT COUNT(*) FROM pods WHERE status = \'Running\'',
    timestamp: '2024-01-20T14:20:00Z',
    duration: 8.45,
    rowCount: 1,
    status: 'success'
  },
  {
    id: '3',
    sql: 'UPDATE users SET last_login = NOW() WHERE id = 1',
    timestamp: '2024-01-20T14:15:00Z',
    duration: 3.21,
    rowCount: 1,
    status: 'success'
  },
  {
    id: '4',
    sql: 'SELECT * FROM nonexistent_table',
    timestamp: '2024-01-20T14:10:00Z',
    duration: 0.12,
    rowCount: 0,
    status: 'error'
  },
  {
    id: '5',
    sql: 'SELECT metric_name, AVG(value) FROM metrics WHERE timestamp >= NOW() - INTERVAL \'24 hours\' GROUP BY metric_name ORDER BY AVG(value) DESC',
    timestamp: '2024-01-20T14:05:00Z',
    duration: 125.67,
    rowCount: 45,
    status: 'success'
  }
];

export const mockSavedQueries: SavedQuery[] = [
  {
    id: 'saved-1',
    name: 'Active Users',
    sql: 'SELECT * FROM users WHERE is_active = true ORDER BY last_login DESC',
    connectionId: 'pg-main',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'saved-2', 
    name: 'Running Pods',
    sql: 'SELECT name, namespace, status, node_name FROM pods WHERE status = \'Running\'',
    connectionId: 'pg-main',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 'saved-3',
    name: 'Database Tables',
    sql: 'SHOW TABLES',
    connectionId: 'pg-main',
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z'
  },
  {
    id: 'saved-4',
    name: 'Daily Metrics Summary',
    sql: 'SELECT metric_name, AVG(value) as avg_value, MAX(value) as max_value FROM metrics WHERE timestamp >= CURRENT_DATE GROUP BY metric_name ORDER BY avg_value DESC',
    connectionId: 'pg-metrics',
    createdAt: '2024-01-18T16:45:00Z',
    updatedAt: '2024-01-19T11:30:00Z'
  },
  {
    id: 'saved-5',
    name: 'Recent Errors',
    sql: 'SELECT * FROM logs WHERE level = \'ERROR\' AND timestamp >= NOW() - INTERVAL \'1 hour\' ORDER BY timestamp DESC',
    connectionId: 'pg-logs',
    createdAt: '2024-01-19T13:20:00Z',
    updatedAt: '2024-01-19T13:20:00Z'
  }
];