import { Hono } from 'hono'
import { k8sClient } from '@/lib/kubernetes'
import { config } from '@/config/config'

export const kubernetesRoutes = new Hono()

// Health check
kubernetesRoutes.get('/health', async (c) => {
  try {
    const health = await k8sClient.healthCheck()
    return c.json(health)
  } catch (error) {
    return c.json({ error: 'Failed to check cluster health' }, 500)
  }
})

// Get cluster overview
kubernetesRoutes.get('/overview', async (c) => {
  try {
    const [namespace, pods, services, deployments, statefulsets, ingresses] = await Promise.all([
      k8sClient.getNamespace(),
      k8sClient.getPods(),
      k8sClient.getServices(),
      k8sClient.getDeployments(),
      k8sClient.getStatefulSets(),
      k8sClient.getIngresses()
    ])

    return c.json({
      namespace,
      summary: {
        pods: pods.length,
        services: services.length,
        deployments: deployments.length,
        statefulsets: statefulsets.length,
        ingresses: ingresses.length
      },
      resources: {
        pods,
        services,
        deployments,
        statefulsets,
        ingresses
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to get cluster overview' }, 500)
  }
})

// Pods
kubernetesRoutes.get('/pods', async (c) => {
  try {
    const pods = await k8sClient.getPods()
    return c.json(pods)
  } catch (error) {
    return c.json({ error: 'Failed to get pods' }, 500)
  }
})

kubernetesRoutes.get('/pods/:name/logs', async (c) => {
  try {
    const podName = c.req.param('name')
    const container = c.req.query('container')
    const logs = await k8sClient.getPodLogs(podName, config.K8S_NAMESPACE, container)
    return c.json({ logs })
  } catch (error) {
    return c.json({ error: 'Failed to get pod logs' }, 500)
  }
})

// Services
kubernetesRoutes.get('/services', async (c) => {
  try {
    const services = await k8sClient.getServices()
    return c.json(services)
  } catch (error) {
    return c.json({ error: 'Failed to get services' }, 500)
  }
})

// Deployments
kubernetesRoutes.get('/deployments', async (c) => {
  try {
    const deployments = await k8sClient.getDeployments()
    return c.json(deployments)
  } catch (error) {
    return c.json({ error: 'Failed to get deployments' }, 500)
  }
})

kubernetesRoutes.get('/deployments/:name', async (c) => {
  try {
    const name = c.req.param('name')
    const deployment = await k8sClient.getDeployment(name)
    return c.json(deployment)
  } catch (error) {
    return c.json({ error: 'Failed to get deployment' }, 500)
  }
})

kubernetesRoutes.patch('/deployments/:name/scale', async (c) => {
  try {
    const name = c.req.param('name')
    const { replicas } = await c.req.json()
    
    if (typeof replicas !== 'number' || replicas < 0) {
      return c.json({ error: 'Invalid replicas count' }, 400)
    }
    
    const result = await k8sClient.scaleDeployment(name, replicas)
    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Failed to scale deployment' }, 500)
  }
})

// StatefulSets
kubernetesRoutes.get('/statefulsets', async (c) => {
  try {
    const statefulsets = await k8sClient.getStatefulSets()
    return c.json(statefulsets)
  } catch (error) {
    return c.json({ error: 'Failed to get statefulsets' }, 500)
  }
})

kubernetesRoutes.get('/statefulsets/:name', async (c) => {
  try {
    const name = c.req.param('name')
    const statefulset = await k8sClient.getStatefulSet(name)
    return c.json(statefulset)
  } catch (error) {
    return c.json({ error: 'Failed to get statefulset' }, 500)
  }
})

// Ingresses
kubernetesRoutes.get('/ingresses', async (c) => {
  try {
    const ingresses = await k8sClient.getIngresses()
    return c.json(ingresses)
  } catch (error) {
    return c.json({ error: 'Failed to get ingresses' }, 500)
  }
})

// ConfigMaps
kubernetesRoutes.get('/configmaps', async (c) => {
  try {
    const configmaps = await k8sClient.getConfigMaps()
    return c.json(configmaps)
  } catch (error) {
    return c.json({ error: 'Failed to get configmaps' }, 500)
  }
})

// Secrets (without data for security)
kubernetesRoutes.get('/secrets', async (c) => {
  try {
    const secrets = await k8sClient.getSecrets()
    // Remove sensitive data from response
    const sanitizedSecrets = secrets.map(secret => ({
      ...secret,
      data: secret.data ? Object.keys(secret.data).reduce((acc, key) => {
        acc[key] = '[REDACTED]'
        return acc
      }, {} as Record<string, string>) : undefined
    }))
    return c.json(sanitizedSecrets)
  } catch (error) {
    return c.json({ error: 'Failed to get secrets' }, 500)
  }
})

// Metrics
kubernetesRoutes.get('/metrics/pods', async (c) => {
  try {
    const metrics = await k8sClient.getPodMetrics()
    return c.json(metrics)
  } catch (error) {
    return c.json({ error: 'Failed to get pod metrics' }, 500)
  }
})

kubernetesRoutes.get('/metrics/nodes', async (c) => {
  try {
    const metrics = await k8sClient.getNodeMetrics()
    return c.json(metrics)
  } catch (error) {
    return c.json({ error: 'Failed to get node metrics' }, 500)
  }
})