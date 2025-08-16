# Denshimon Monitoring Architecture

This document describes the monitoring architecture for the Denshimon application, including Prometheus integration, metrics collection, and dashboard data sources.

## Overview

Denshimon uses a hybrid monitoring approach:
- **Real metrics**: Collected via Prometheus when available
- **Mock data fallback**: Frontend-generated when Prometheus is unavailable
- **Graceful degradation**: No impact on core functionality when monitoring is down

## Architecture Components

### Prometheus Stack
The monitoring infrastructure consists of:

1. **Prometheus Server** (`prometheus-service.monitoring.svc.cluster.local:9090`)
   - Central metrics storage and query engine
   - 15-day retention policy
   - API-only access (no UI)

2. **Node Exporter** (DaemonSet on all nodes)
   - Host-level metrics: CPU, memory, disk, network interfaces
   - Exposes metrics on port 9100

3. **kube-state-metrics** (Single replica)
   - Kubernetes object metrics: pods, deployments, nodes
   - Exposes metrics on port 8080

4. **Storage Exporter** (Custom DaemonSet)
   - Volume-specific I/O metrics: IOPS, throughput, latency
   - Reads from `/proc/diskstats` and `/sys/block`
   - Exposes metrics on port 9101

### Backend Integration

The backend integrates with Prometheus through:

- **`internal/prometheus/client.go`**: Low-level HTTP client for Prometheus API
- **`internal/prometheus/service.go`**: High-level service for structured metrics
- **`internal/metrics/service.go`**: Main metrics service with Prometheus integration

## Data Flow

```
Kubernetes Cluster
├── Node Exporter (host metrics)
├── kube-state-metrics (K8s objects)
├── Storage Exporter (volume I/O)
└── Prometheus (collects & stores)
    └── Backend API (queries)
        └── Frontend (displays charts)
```

## Metrics Categories

### 1. Network Metrics

**Source**: node-exporter, container network stats  
**Endpoint**: `GET /api/metrics/network?duration=1h`  
**Dashboard**: Network Traffic page

Collected metrics:
- Ingress/egress bandwidth (bytes/second over time)
- Active TCP connections
- Top talking pods by traffic volume
- Protocol breakdown (HTTP/HTTPS, gRPC, TCP, UDP)

**Key PromQL Queries**:
```promql
# Network traffic rates
sum(rate(container_network_receive_bytes_total[5m])) by (pod)
sum(rate(container_network_transmit_bytes_total[5m])) by (pod)

# Connection count
sum(node_netstat_Tcp_CurrEstab)
```

### 2. Storage Metrics

**Source**: Custom storage-exporter  
**Endpoint**: `GET /api/metrics/storage`  
**Dashboard**: Storage I/O Metrics page

Collected metrics:
- Per-volume IOPS (read/write operations per second)
- Throughput (MB/s for read/write operations)
- Latency (milliseconds for read/write operations)
- Capacity usage (used/total/available bytes)
- Storage type classification (SSD/HDD/NVMe)

**Key PromQL Queries**:
```promql
# Volume IOPS
storage_volume_read_iops{volume="pvc-database-primary"}
storage_volume_write_iops{volume="pvc-database-primary"}

# Throughput
storage_volume_read_throughput_bytes{volume="pvc-cache-redis"}
storage_volume_write_throughput_bytes{volume="pvc-cache-redis"}

# Latency
storage_volume_read_latency_seconds{volume="pvc-logs-elasticsearch"}
storage_volume_write_latency_seconds{volume="pvc-logs-elasticsearch"}
```

### 3. Cluster Metrics

**Source**: node-exporter, kube-state-metrics  
**Endpoint**: `GET /api/metrics/cluster`  
**Dashboard**: Cluster Overview page

Collected metrics:
- CPU usage percentage over time
- Memory usage percentage over time
- Storage usage percentage over time
- Pod count trends
- Node count and health status

**Key PromQL Queries**:
```promql
# CPU usage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Storage usage
100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)

# Pod counts
count(kube_pod_info)
```

## Configuration

### Prometheus Service URL

The backend connects to Prometheus using the cluster-internal service:
```go
prometheusURL := "http://prometheus-service.monitoring.svc.cluster.local:9090"
```

### Fallback Behavior

When Prometheus is unavailable:
1. Backend methods return errors
2. Frontend detects errors and uses mock data
3. No impact on core application functionality
4. Users see simulated metrics instead of real data

### Health Checking

The backend continuously monitors Prometheus health:
```go
func (s *Service) IsHealthy(ctx context.Context) bool {
    return s.client.IsHealthy(ctx)
}
```

This enables automatic fallback and recovery when Prometheus becomes available.

## Deployment Requirements

### Resource Requirements
- **Prometheus**: 512Mi-2Gi memory, 200m-1000m CPU
- **Node Exporter**: 50Mi memory, 100m CPU per node
- **kube-state-metrics**: 130Mi memory, 10m CPU
- **Storage Exporter**: 50Mi memory, 50m CPU per node

### Kubernetes Manifests
Required manifests (deployed to `monitoring` namespace):
- `namespace.yaml` - Namespace and RBAC
- `prometheus-config.yaml` - Prometheus configuration
- `prometheus-deployment.yaml` - Prometheus server
- `node-exporter.yaml` - Node-level metrics
- `kube-state-metrics.yaml` - Kubernetes metrics
- `storage-exporter.yaml` - Storage I/O metrics

### Network Policies
All services use ClusterIP (internal-only access):
- No external exposure required
- Prometheus queries are backend-initiated
- No ingress or NodePort configurations

## Troubleshooting

### Common Issues

1. **Prometheus not accessible**
   - Check if monitoring namespace exists
   - Verify prometheus-service is running
   - Check backend logs for connection errors

2. **Missing metrics data**
   - Verify all exporters are running (DaemonSets)
   - Check Prometheus targets (if debugging needed)
   - Confirm scrape configurations

3. **High resource usage**
   - Adjust retention period in prometheus-config.yaml
   - Scale down non-essential exporters
   - Monitor memory usage of Prometheus pod

### Debugging Commands

```bash
# Check monitoring namespace status
kubectl get all -n monitoring

# Check Prometheus logs
kubectl logs -n monitoring deployment/prometheus

# Verify exporter health
kubectl get pods -n monitoring -l app=node-exporter
kubectl get pods -n monitoring -l app=storage-exporter

# Test backend connectivity (if needed)
kubectl port-forward -n monitoring svc/prometheus-service 9090:9090
```

## Future Enhancements

Potential monitoring improvements:
- Alerting rules for critical metrics
- Grafana dashboard integration
- Service mesh metrics (Istio/Linkerd)
- Custom application metrics
- Long-term storage with Thanos

## Security Considerations

- All monitoring services use least-privilege RBAC
- No external network access required
- Metrics data contains no sensitive information
- Service accounts limited to read-only operations
- No persistent storage (metrics stored in ephemeral volumes)