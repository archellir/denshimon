import * as k8s from '@kubernetes/client-node'
import { config } from '@/config/config'

class KubernetesClient {
  private kc: k8s.KubeConfig
  private k8sApi: k8s.CoreV1Api
  private appsApi: k8s.AppsV1Api
  private networkingApi: k8s.NetworkingV1Api
  private metricsApi: k8s.Metrics

  constructor() {
    this.kc = new k8s.KubeConfig()
    
    // Load kubeconfig
    if (config.NODE_ENV === 'development') {
      this.kc.loadFromDefault()
    } else {
      this.kc.loadFromCluster()
    }
    
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api)
    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api)
    this.networkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api)
    this.metricsApi = new k8s.Metrics(this.kc)
  }

  // Namespace operations
  async getNamespace(name: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.k8sApi.readNamespace(name)
      return response.body
    } catch (error) {
      throw new Error(`Failed to get namespace ${name}: ${error}`)
    }
  }

  // Pod operations
  async getPods(namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.k8sApi.listNamespacedPod(namespace)
      return response.body.items
    } catch (error) {
      throw new Error(`Failed to get pods: ${error}`)
    }
  }

  async getPodsByLabel(labelSelector: string, namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.k8sApi.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, labelSelector)
      return response.body.items
    } catch (error) {
      throw new Error(`Failed to get pods by label ${labelSelector}: ${error}`)
    }
  }

  async getPodLogs(podName: string, namespace: string = config.K8S_NAMESPACE, container?: string) {
    try {
      const response = await this.k8sApi.readNamespacedPodLog(podName, namespace, container)
      return response.body
    } catch (error) {
      throw new Error(`Failed to get logs for pod ${podName}: ${error}`)
    }
  }

  // Service operations
  async getServices(namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.k8sApi.listNamespacedService(namespace)
      return response.body.items
    } catch (error) {
      throw new Error(`Failed to get services: ${error}`)
    }
  }

  // Deployment operations
  async getDeployments(namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.appsApi.listNamespacedDeployment(namespace)
      return response.body.items
    } catch (error) {
      throw new Error(`Failed to get deployments: ${error}`)
    }
  }

  async getDeployment(name: string, namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.appsApi.readNamespacedDeployment(name, namespace)
      return response.body
    } catch (error) {
      throw new Error(`Failed to get deployment ${name}: ${error}`)
    }
  }

  async scaleDeployment(name: string, replicas: number, namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.appsApi.patchNamespacedDeploymentScale(
        name,
        namespace,
        { spec: { replicas } },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      )
      return response.body
    } catch (error) {
      throw new Error(`Failed to scale deployment ${name}: ${error}`)
    }
  }

  // StatefulSet operations
  async getStatefulSets(namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.appsApi.listNamespacedStatefulSet(namespace)
      return response.body.items
    } catch (error) {
      throw new Error(`Failed to get statefulsets: ${error}`)
    }
  }

  async getStatefulSet(name: string, namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.appsApi.readNamespacedStatefulSet(name, namespace)
      return response.body
    } catch (error) {
      throw new Error(`Failed to get statefulset ${name}: ${error}`)
    }
  }

  // Ingress operations
  async getIngresses(namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.networkingApi.listNamespacedIngress(namespace)
      return response.body.items
    } catch (error) {
      throw new Error(`Failed to get ingresses: ${error}`)
    }
  }

  // ConfigMap operations
  async getConfigMaps(namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.k8sApi.listNamespacedConfigMap(namespace)
      return response.body.items
    } catch (error) {
      throw new Error(`Failed to get configmaps: ${error}`)
    }
  }

  // Secret operations
  async getSecrets(namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.k8sApi.listNamespacedSecret(namespace)
      return response.body.items
    } catch (error) {
      throw new Error(`Failed to get secrets: ${error}`)
    }
  }

  // Metrics operations
  async getPodMetrics(namespace: string = config.K8S_NAMESPACE) {
    try {
      const response = await this.metricsApi.getPodMetrics(namespace)
      return response.items
    } catch (error) {
      console.warn('Metrics server not available:', error)
      return []
    }
  }

  async getNodeMetrics() {
    try {
      const response = await this.metricsApi.getNodeMetrics()
      return response.items
    } catch (error) {
      console.warn('Metrics server not available:', error)
      return []
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.k8sApi.listNamespace()
      return { status: 'healthy', timestamp: new Date().toISOString() }
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() }
    }
  }
}

export const k8sClient = new KubernetesClient()