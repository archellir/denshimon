import { Hono } from 'hono'
import { k8sClient } from '@/lib/kubernetes'
import { config, type InfrastructureServiceName } from '@/config/config'

export const infrastructureRoutes = new Hono()

// Get all infrastructure services overview
infrastructureRoutes.get('/services', async (c) => {
  try {
    const [pods, services, deployments, statefulsets] = await Promise.all([
      k8sClient.getPods(),
      k8sClient.getServices(),
      k8sClient.getDeployments(),
      k8sClient.getStatefulSets()
    ])

    const infraServices = Object.entries(config.INFRASTRUCTURE_SERVICES).map(([key, serviceConfig]) => {
      const serviceName = key as InfrastructureServiceName
      
      // Find related Kubernetes resources
      const relatedPods = pods.filter(pod => 
        pod.metadata?.labels?.app === serviceConfig.name
      )
      
      const relatedService = services.find(svc => 
        svc.metadata?.name === serviceConfig.name
      )
      
      const relatedDeployment = deployments.find(dep => 
        dep.metadata?.name === serviceConfig.name
      )
      
      const relatedStatefulSet = statefulsets.find(sts => 
        sts.metadata?.name === serviceConfig.name
      )

      // Calculate status
      let status = 'unknown'
      let replicas = { ready: 0, desired: 0 }
      
      if (relatedDeployment) {
        replicas.desired = relatedDeployment.spec?.replicas || 0
        replicas.ready = relatedDeployment.status?.readyReplicas || 0
        status = replicas.ready === replicas.desired && replicas.desired > 0 ? 'running' : 'degraded'
      } else if (relatedStatefulSet) {
        replicas.desired = relatedStatefulSet.spec?.replicas || 0
        replicas.ready = relatedStatefulSet.status?.readyReplicas || 0
        status = replicas.ready === replicas.desired && replicas.desired > 0 ? 'running' : 'degraded'
      }

      return {
        id: serviceName,
        name: serviceConfig.name,
        description: serviceConfig.description,
        type: serviceConfig.type,
        port: serviceConfig.port,
        domain: serviceConfig.domain,
        status,
        replicas,
        pods: relatedPods.length,
        hasService: !!relatedService,
        lastUpdated: relatedDeployment?.metadata?.creationTimestamp || 
                    relatedStatefulSet?.metadata?.creationTimestamp
      }
    })

    return c.json({
      services: infraServices,
      summary: {
        total: infraServices.length,
        running: infraServices.filter(s => s.status === 'running').length,
        degraded: infraServices.filter(s => s.status === 'degraded').length,
        unknown: infraServices.filter(s => s.status === 'unknown').length
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to get infrastructure services' }, 500)
  }
})

// Get specific infrastructure service details
infrastructureRoutes.get('/services/:serviceName', async (c) => {
  try {
    const serviceName = c.req.param('serviceName') as InfrastructureServiceName
    const serviceConfig = config.INFRASTRUCTURE_SERVICES[serviceName]
    
    if (!serviceConfig) {
      return c.json({ error: 'Service not found' }, 404)
    }

    const [pods, service, deployment, statefulset, configmaps, secrets] = await Promise.all([
      k8sClient.getPodsByLabel(`app=${serviceConfig.name}`),
      k8sClient.getServices().then(services => 
        services.find(s => s.metadata?.name === serviceConfig.name)
      ),
      serviceConfig.type === 'Deployment' ? 
        k8sClient.getDeployment(serviceConfig.name).catch(() => null) : null,
      serviceConfig.type === 'StatefulSet' ? 
        k8sClient.getStatefulSet(serviceConfig.name).catch(() => null) : null,
      k8sClient.getConfigMaps(),
      k8sClient.getSecrets()
    ])

    // Get related ConfigMaps and Secrets
    const relatedConfigMaps = configmaps.filter(cm => 
      cm.metadata?.name?.includes(serviceConfig.name)
    )
    const relatedSecrets = secrets.filter(secret => 
      secret.metadata?.name?.includes(serviceConfig.name) || 
      secret.metadata?.name === 'app-secrets'
    )

    return c.json({
      id: serviceName,
      config: serviceConfig,
      kubernetes: {
        pods,
        service,
        deployment,
        statefulset,
        configmaps: relatedConfigMaps,
        secrets: relatedSecrets.map(secret => ({
          ...secret,
          data: secret.data ? Object.keys(secret.data).reduce((acc, key) => {
            acc[key] = '[REDACTED]'
            return acc
          }, {} as Record<string, string>) : undefined
        }))
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to get service details' }, 500)
  }
})

// Get service logs
infrastructureRoutes.get('/services/:serviceName/logs', async (c) => {
  try {
    const serviceName = c.req.param('serviceName') as InfrastructureServiceName
    const serviceConfig = config.INFRASTRUCTURE_SERVICES[serviceName]
    
    if (!serviceConfig) {
      return c.json({ error: 'Service not found' }, 404)
    }

    const pods = await k8sClient.getPodsByLabel(`app=${serviceConfig.name}`)
    
    if (pods.length === 0) {
      return c.json({ error: 'No pods found for service' }, 404)
    }

    // Get logs from the first pod (in production, might want to get from all pods)
    const pod = pods[0]
    const logs = await k8sClient.getPodLogs(pod.metadata!.name!, config.K8S_NAMESPACE)
    
    return c.json({
      service: serviceName,
      pod: pod.metadata!.name!,
      logs: logs.split('\n').slice(-100) // Last 100 lines
    })
  } catch (error) {
    return c.json({ error: 'Failed to get service logs' }, 500)
  }
})

// Scale service (for deployments only)
infrastructureRoutes.patch('/services/:serviceName/scale', async (c) => {
  try {
    const serviceName = c.req.param('serviceName') as InfrastructureServiceName
    const serviceConfig = config.INFRASTRUCTURE_SERVICES[serviceName]
    const { replicas } = await c.req.json()
    
    if (!serviceConfig) {
      return c.json({ error: 'Service not found' }, 404)
    }

    if (serviceConfig.type !== 'Deployment') {
      return c.json({ error: 'Scaling only supported for Deployments' }, 400)
    }

    if (typeof replicas !== 'number' || replicas < 0) {
      return c.json({ error: 'Invalid replicas count' }, 400)
    }

    const result = await k8sClient.scaleDeployment(serviceConfig.name, replicas)
    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Failed to scale service' }, 500)
  }
})

// Get infrastructure domains and ingress status
infrastructureRoutes.get('/domains', async (c) => {
  try {
    const ingresses = await k8sClient.getIngresses()
    
    const domainStatus = config.INGRESS_DOMAINS.map(domain => {
      const ingress = ingresses.find(ing => 
        ing.spec?.rules?.some(rule => rule.host === domain)
      )
      
      return {
        domain,
        status: ingress ? 'configured' : 'missing',
        ingress: ingress?.metadata?.name,
        tls: ingress?.spec?.tls?.some(tls => 
          tls.hosts?.includes(domain)
        ) || false
      }
    })

    return c.json({
      domains: domainStatus,
      ingresses: ingresses.map(ing => ({
        name: ing.metadata?.name,
        hosts: ing.spec?.rules?.map(rule => rule.host) || [],
        tls: ing.spec?.tls?.map(tls => tls.hosts).flat() || []
      }))
    })
  } catch (error) {
    return c.json({ error: 'Failed to get domain status' }, 500)
  }
})