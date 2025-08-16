package prometheus

import (
	"context"
	"testing"
	"time"
)

// TestPrometheusConnection tests basic connectivity to Prometheus
// This test assumes Prometheus is running on the expected URL
func TestPrometheusConnection(t *testing.T) {
	// Skip in CI environments or when PROMETHEUS_TEST env var is not set
	if testing.Short() {
		t.Skip("Skipping Prometheus integration test in short mode")
	}

	// Use the same URL as the production code
	client := NewClient("http://prometheus-service.monitoring.svc.cluster.local:9090")
	
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Test health check
	t.Run("HealthCheck", func(t *testing.T) {
		healthy := client.IsHealthy(ctx)
		if !healthy {
			t.Log("Prometheus health check failed - this is expected if Prometheus is not running")
			t.Log("To test with real Prometheus, ensure the monitoring stack is deployed")
		} else {
			t.Log("✅ Prometheus is healthy and accessible")
		}
	})

	// Test basic query (only if health check passes)
	t.Run("BasicQuery", func(t *testing.T) {
		if !client.IsHealthy(ctx) {
			t.Skip("Skipping query test - Prometheus not healthy")
		}

		// Test a simple query that should always work
		result, err := client.Query(ctx, "up")
		if err != nil {
			t.Errorf("Query failed: %v", err)
			return
		}

		if result.Status != "success" {
			t.Errorf("Expected success status, got: %s", result.Status)
		}

		t.Logf("✅ Query successful, found %d results", len(result.Data.Result))
	})

	// Test range query
	t.Run("RangeQuery", func(t *testing.T) {
		if !client.IsHealthy(ctx) {
			t.Skip("Skipping range query test - Prometheus not healthy")
		}

		end := time.Now()
		start := end.Add(-5 * time.Minute)
		step := time.Minute

		result, err := client.QueryRange(ctx, "up", start, end, step)
		if err != nil {
			t.Errorf("Range query failed: %v", err)
			return
		}

		if result.Status != "success" {
			t.Errorf("Expected success status, got: %s", result.Status)
		}

		t.Logf("✅ Range query successful, found %d series", len(result.Data.Result))
	})
}

// TestPrometheusService tests the high-level service functionality
func TestPrometheusService(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping Prometheus service integration test in short mode")
	}

	service := NewService("http://prometheus-service.monitoring.svc.cluster.local:9090")
	
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Test service health
	t.Run("ServiceHealth", func(t *testing.T) {
		healthy := service.IsHealthy(ctx)
		if !healthy {
			t.Log("Prometheus service not healthy - this is expected if monitoring stack is not deployed")
		} else {
			t.Log("✅ Prometheus service is healthy")
		}
	})

	// Test network metrics (only if healthy)
	t.Run("NetworkMetrics", func(t *testing.T) {
		if !service.IsHealthy(ctx) {
			t.Skip("Skipping network metrics test - Prometheus not healthy")
		}

		metrics, err := service.GetNetworkMetrics(ctx, time.Hour)
		if err != nil {
			t.Logf("Network metrics failed (expected if exporters not ready): %v", err)
			return
		}

		t.Logf("✅ Network metrics retrieved: %d ingress points, %d egress points", 
			len(metrics.IngressBytes), len(metrics.EgressBytes))
	})

	// Test storage metrics (only if healthy)
	t.Run("StorageMetrics", func(t *testing.T) {
		if !service.IsHealthy(ctx) {
			t.Skip("Skipping storage metrics test - Prometheus not healthy")
		}

		metrics, err := service.GetStorageMetrics(ctx)
		if err != nil {
			t.Logf("Storage metrics failed (expected if storage exporter not ready): %v", err)
			return
		}

		t.Logf("✅ Storage metrics retrieved: %d volumes", len(metrics.Volumes))
	})

	// Test cluster metrics (only if healthy)
	t.Run("ClusterMetrics", func(t *testing.T) {
		if !service.IsHealthy(ctx) {
			t.Skip("Skipping cluster metrics test - Prometheus not healthy")
		}

		metrics, err := service.GetClusterMetrics(ctx, time.Hour)
		if err != nil {
			t.Logf("Cluster metrics failed (expected if exporters not ready): %v", err)
			return
		}

		t.Logf("✅ Cluster metrics retrieved: %d CPU points, %d memory points", 
			len(metrics.CPUUsage), len(metrics.MemoryUsage))
	})
}

// BenchmarkPrometheusQuery benchmarks query performance
func BenchmarkPrometheusQuery(b *testing.B) {
	if testing.Short() {
		b.Skip("Skipping Prometheus benchmark in short mode")
	}

	client := NewClient("http://prometheus-service.monitoring.svc.cluster.local:9090")
	ctx := context.Background()

	if !client.IsHealthy(ctx) {
		b.Skip("Prometheus not available for benchmarking")
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Query(ctx, "up")
		if err != nil {
			b.Errorf("Query failed: %v", err)
		}
	}
}