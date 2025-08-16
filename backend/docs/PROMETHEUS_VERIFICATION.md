# Prometheus Integration Verification

This document provides verification steps and troubleshooting guidance for the denshimon Prometheus integration.

## Quick Verification Checklist

### ✅ 1. Monitoring Stack Deployed
```bash
# Check if monitoring namespace exists
kubectl get namespace monitoring

# Check all monitoring components are running
kubectl get all -n monitoring

# Expected components:
# - prometheus (deployment)
# - node-exporter (daemonset)
# - kube-state-metrics (deployment)  
# - storage-exporter (daemonset)
```

### ✅ 2. Prometheus Connectivity
```bash
# Test Prometheus health from within cluster
kubectl run prometheus-test --rm -i --restart=Never --image=curlimages/curl -- \
  curl -s http://prometheus-service.monitoring.svc.cluster.local:9090/-/healthy

# Should return: Prometheus is Healthy.
```

### ✅ 3. Backend Integration
```bash
# Run the integration test script
./scripts/test_prometheus_integration.sh

# Or manually test API endpoints
curl http://localhost:8080/api/metrics/health
curl http://localhost:8080/api/metrics/network?duration=1h
curl http://localhost:8080/api/metrics/storage
```

### ✅ 4. Real Data Verification
Look for `"source": "prometheus"` in API responses instead of `"source": "k8s_basic"` or frontend mock data.

## Detailed Verification Steps

### Step 1: Infrastructure Verification

**Check Monitoring Namespace:**
```bash
kubectl get namespace monitoring
```
Expected: `monitoring   Active   <age>`

**Check All Pods Running:**
```bash
kubectl get pods -n monitoring
```
Expected all pods in `Running` status:
- `prometheus-xxx`
- `node-exporter-xxx` (one per node)
- `kube-state-metrics-xxx`
- `storage-exporter-xxx` (one per node)

**Check Services:**
```bash
kubectl get svc -n monitoring
```
Expected services:
- `prometheus-service` (ClusterIP on port 9090)
- `node-exporter` (ClusterIP None)
- `kube-state-metrics` (ClusterIP on port 8080)
- `storage-exporter` (ClusterIP None)

### Step 2: Prometheus Server Verification

**Test Prometheus Health:**
```bash
kubectl port-forward -n monitoring svc/prometheus-service 9090:9090 &
curl http://localhost:9090/-/healthy
# Should return: Prometheus is Healthy.
```

**Check Prometheus Targets:**
```bash
# Visit http://localhost:9090/targets
# All targets should be UP (green)
```

**Test Basic Query:**
```bash
curl "http://localhost:9090/api/v1/query?query=up"
# Should return JSON with "status": "success"
```

### Step 3: Backend Integration Verification

**Check Backend Logs:**
```bash
kubectl logs -f deployment/denshimon-backend | grep -i prometheus
```
Look for:
- Prometheus connection attempts
- Query successes/failures
- Fallback behavior

**Test API Endpoints:**

1. **Health Check:**
```bash
curl http://localhost:8080/api/metrics/health
```
Expected: JSON response with backend health info

2. **Network Metrics:**
```bash
curl "http://localhost:8080/api/metrics/network?duration=1h"
```
Expected: JSON with `"source": "prometheus"` (if working) or `"source": "k8s_basic"` (fallback)

3. **Storage Metrics:**
```bash
curl http://localhost:8080/api/metrics/storage
```
Expected: JSON with volume metrics from storage-exporter

4. **Cluster Metrics:**
```bash
curl http://localhost:8080/api/metrics/cluster
```
Expected: JSON with real cluster resource data

### Step 4: WebSocket Data Verification

**Connect to WebSocket:**
```javascript
// In browser console on denshimon frontend
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data.type, data.data?.source);
};
```

Look for messages with:
- `type: "network"` and `data.source: "prometheus"`
- `type: "storage"` and `data.source: "prometheus"`

### Step 5: Frontend Dashboard Verification

**Network Dashboard:**
- Visit `/dashboard/infrastructure/network` 
- Look for real-time bandwidth charts
- Check if data updates every 5 seconds
- Verify protocol breakdown and top talkers

**Storage Dashboard:**
- Visit `/dashboard/infrastructure/storage`
- Look for volume IOPS and throughput metrics
- Check latency measurements
- Verify capacity usage data

**Cluster Overview:**
- Visit `/dashboard/metrics/cluster`
- Look for time-series CPU/memory charts
- Check historical data over selected time ranges

## Troubleshooting Guide

### Problem: "Prometheus not available" in API responses

**Symptoms:**
- API returns `"source": "k8s_basic"` or errors
- Backend logs show Prometheus connection failures
- Frontend shows mock data

**Debugging Steps:**

1. **Check Prometheus Pod:**
```bash
kubectl get pods -n monitoring -l app=prometheus
kubectl logs -n monitoring deployment/prometheus
```

2. **Check Service DNS:**
```bash
kubectl run debug --rm -i --restart=Never --image=nicolaka/netshoot -- \
  nslookup prometheus-service.monitoring.svc.cluster.local
```

3. **Test Connectivity:**
```bash
kubectl run debug --rm -i --restart=Never --image=curlimages/curl -- \
  curl -v http://prometheus-service.monitoring.svc.cluster.local:9090/-/healthy
```

4. **Check Backend Configuration:**
```bash
# Verify backend is using correct URL
kubectl logs deployment/denshimon-backend | grep "prometheus"
```

### Problem: Empty metrics data

**Symptoms:**
- Prometheus is healthy but returns no data
- API responses have empty arrays
- Charts show no data points

**Debugging Steps:**

1. **Check Exporters:**
```bash
kubectl get pods -n monitoring | grep -E "(node-exporter|kube-state|storage-exporter)"
```

2. **Check Prometheus Targets:**
```bash
kubectl port-forward -n monitoring svc/prometheus-service 9090:9090
# Visit http://localhost:9090/targets
```

3. **Test Individual Exporters:**
```bash
# Node exporter
kubectl get pods -n monitoring -l app=node-exporter -o wide
# Pick a node and test: http://NODE_IP:9100/metrics

# Storage exporter  
kubectl get pods -n monitoring -l app=storage-exporter -o wide
# Pick a node and test: http://NODE_IP:9101/metrics
```

4. **Check Scrape Configs:**
```bash
kubectl get cm prometheus-config -n monitoring -o yaml
```

### Problem: High resource usage

**Symptoms:**
- Prometheus pod using excessive memory/CPU
- Node performance degraded
- Backend timeouts

**Solutions:**

1. **Reduce Retention:**
```yaml
# In prometheus-deployment.yaml
args:
  - '--storage.tsdb.retention.time=7d'  # Reduce from 15d
```

2. **Adjust Scrape Intervals:**
```yaml
# In prometheus-config.yaml
global:
  scrape_interval: 30s  # Increase from 15s
```

3. **Scale Resources:**
```yaml
# In prometheus-deployment.yaml
resources:
  limits:
    memory: 4Gi  # Increase from 2Gi
    cpu: 2000m   # Increase from 1000m
```

### Problem: WebSocket data not updating

**Symptoms:**
- API endpoints work but WebSocket shows old data
- Frontend charts not updating in real-time
- WebSocket source shows "k8s_basic" instead of "prometheus"

**Debugging Steps:**

1. **Check WebSocket Publisher:**
```bash
kubectl logs deployment/denshimon-backend | grep -i "websocket\|publisher"
```

2. **Verify WebSocket Connection:**
```bash
# In browser console
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

3. **Check Publisher Errors:**
```bash
kubectl logs deployment/denshimon-backend | grep -E "(network|storage) metrics"
```

## Performance Expectations

### Normal Operation:
- **API Response Time**: < 2 seconds for most queries
- **WebSocket Updates**: Every 5-10 seconds
- **Memory Usage**: 
  - Prometheus: 500MB - 2GB
  - Backend: +50MB for Prometheus client
- **CPU Usage**: 
  - Prometheus: 200m - 1000m
  - Exporters: 50m - 200m each

### Scaling Guidelines:
- **Small clusters** (< 10 nodes): Default resources sufficient
- **Medium clusters** (10-50 nodes): Increase Prometheus memory to 4GB
- **Large clusters** (50+ nodes): Consider Prometheus federation or Thanos

## Expected Data Sources

When everything is working correctly, you should see:

**API Responses:**
```json
{
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00Z",
  "source": "prometheus"
}
```

**WebSocket Messages:**
```json
{
  "type": "network",
  "data": {
    "source": "prometheus",
    "ingress_bytes": [...],
    "egress_bytes": [...]
  }
}
```

**Frontend Indicators:**
- Real-time data updates
- Detailed IOPS/latency metrics in storage dashboard
- Bandwidth charts with actual network traffic
- No "mock data" warnings or indicators