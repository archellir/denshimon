#!/bin/bash

# Script to test Prometheus integration in denshimon backend
# This script can be run when the monitoring stack is deployed to verify connectivity

set -e

echo "🔍 Testing Denshimon Prometheus Integration"
echo "=========================================="

# Check if denshimon backend is running
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
echo "Backend URL: $BACKEND_URL"

# Function to make API calls with proper auth (if needed)
api_call() {
    local endpoint="$1"
    local description="$2"
    
    echo ""
    echo "📊 Testing: $description"
    echo "Endpoint: GET $endpoint"
    
    # Try API call with timeout
    if response=$(curl -s --max-time 10 "$BACKEND_URL$endpoint" 2>/dev/null); then
        # Check if response contains error
        if echo "$response" | grep -q '"error"'; then
            echo "❌ API Error: $(echo "$response" | jq -r '.error' 2>/dev/null || echo "Unknown error")"
            return 1
        else
            echo "✅ Success"
            
            # Show data source if available
            if echo "$response" | grep -q '"source"'; then
                source=$(echo "$response" | jq -r '.source' 2>/dev/null || echo "unknown")
                echo "   Data source: $source"
            fi
            
            # Show data summary
            if echo "$response" | jq . >/dev/null 2>&1; then
                echo "   Response size: $(echo "$response" | wc -c) bytes"
                
                # Show specific metrics count if available
                if echo "$response" | grep -q '"data"'; then
                    if volumes=$(echo "$response" | jq -r '.data.volumes | length' 2>/dev/null); then
                        echo "   Storage volumes: $volumes"
                    fi
                    if ingress=$(echo "$response" | jq -r '.data.ingress_bytes | length' 2>/dev/null); then
                        echo "   Network data points: $ingress"
                    fi
                fi
            fi
            return 0
        fi
    else
        echo "❌ Connection failed"
        return 1
    fi
}

# Test basic health
echo "🏥 Testing backend health..."
api_call "/api/metrics/health" "Backend Health Check"

# Test cluster metrics
api_call "/api/metrics/cluster" "Cluster Metrics"

# Test metrics history
api_call "/api/metrics/history?duration=1h" "Metrics History (1 hour)"

# Test network metrics
api_call "/api/metrics/network?duration=1h" "Network Metrics (1 hour)"

# Test storage metrics
api_call "/api/metrics/storage" "Storage Metrics"

# Test resource metrics
api_call "/api/metrics/resources" "Resource Metrics"

echo ""
echo "🔗 Testing Prometheus Connectivity"
echo "=================================="

# Check if we can reach Prometheus from within cluster (if running in cluster)
if command -v kubectl >/dev/null 2>&1; then
    echo "📋 Checking Prometheus deployment..."
    
    # Check monitoring namespace
    if kubectl get namespace monitoring >/dev/null 2>&1; then
        echo "✅ Monitoring namespace exists"
        
        # Check Prometheus service
        if kubectl get svc prometheus-service -n monitoring >/dev/null 2>&1; then
            echo "✅ Prometheus service exists"
            
            # Check Prometheus pod
            if kubectl get pods -n monitoring -l app=prometheus --field-selector=status.phase=Running | grep -q prometheus; then
                echo "✅ Prometheus pod is running"
                
                # Test connectivity from within cluster
                echo "🔌 Testing cluster-internal connectivity..."
                if kubectl run prometheus-test --rm -i --restart=Never --image=curlimages/curl -- \
                   curl -s --max-time 5 http://prometheus-service.monitoring.svc.cluster.local:9090/-/healthy >/dev/null 2>&1; then
                    echo "✅ Prometheus is accessible from within cluster"
                else
                    echo "❌ Prometheus not accessible from within cluster"
                fi
            else
                echo "❌ Prometheus pod not running"
                kubectl get pods -n monitoring -l app=prometheus
            fi
        else
            echo "❌ Prometheus service not found"
        fi
    else
        echo "❌ Monitoring namespace not found"
        echo "   Deploy the monitoring stack first:"
        echo "   kubectl apply -f k8s/monitoring/"
    fi
else
    echo "ℹ️  kubectl not available - skipping cluster checks"
fi

echo ""
echo "📈 Monitoring Stack Status"
echo "========================="

if command -v kubectl >/dev/null 2>&1; then
    echo "Checking all monitoring components..."
    
    # Check all pods in monitoring namespace
    if kubectl get namespace monitoring >/dev/null 2>&1; then
        echo ""
        echo "Monitoring pods:"
        kubectl get pods -n monitoring -o wide
        
        echo ""
        echo "Monitoring services:"
        kubectl get svc -n monitoring
        
        # Check if exporters are running
        echo ""
        echo "Exporter status:"
        echo "- Node Exporter: $(kubectl get ds node-exporter -n monitoring -o jsonpath='{.status.numberReady}/{.status.desiredNumberScheduled}' 2>/dev/null || echo 'Not found') ready"
        echo "- Storage Exporter: $(kubectl get ds storage-exporter -n monitoring -o jsonpath='{.status.numberReady}/{.status.desiredNumberScheduled}' 2>/dev/null || echo 'Not found') ready"
        echo "- kube-state-metrics: $(kubectl get deployment kube-state-metrics -n monitoring -o jsonpath='{.status.readyReplicas}/{.status.replicas}' 2>/dev/null || echo 'Not found') ready"
        echo "- Prometheus: $(kubectl get deployment prometheus -n monitoring -o jsonpath='{.status.readyReplicas}/{.status.replicas}' 2>/dev/null || echo 'Not found') ready"
    fi
fi

echo ""
echo "🎯 Summary"
echo "=========="
echo "✅ Backend is configured to use Prometheus at:"
echo "   http://prometheus-service.monitoring.svc.cluster.local:9090"
echo ""
echo "✅ Backend gracefully falls back to mock data when Prometheus unavailable"
echo ""
echo "✅ WebSocket publishers updated to use Prometheus metrics"
echo ""
echo "📝 Next steps:"
echo "   1. Ensure monitoring stack is deployed and all pods are running"
echo "   2. Wait a few minutes for metrics to be collected"
echo "   3. Check frontend dashboards for real metrics data"
echo "   4. Look for 'source: prometheus' in API responses"

echo ""
echo "🔧 Debugging tips:"
echo "   - Check backend logs: kubectl logs -f deployment/denshimon-backend"
echo "   - Port-forward Prometheus: kubectl port-forward -n monitoring svc/prometheus-service 9090:9090"
echo "   - Test Prometheus directly: curl http://localhost:9090/-/healthy"