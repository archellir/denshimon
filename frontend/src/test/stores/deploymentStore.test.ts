import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useDeploymentStore from '@stores/deploymentStore'
import { RegistryStatus, RegistryType, DeploymentStatus } from '@constants'
import type { Registry, ContainerImage, Deployment, DeploymentRequest } from '@/types/deployments'

// Mock the API service
vi.mock('@services/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message)
    }
  },
}))

// Mock the mock data
vi.mock('@mocks', () => ({
  mockApiResponse: vi.fn(),
  mockRegistries: [],
  MOCK_ENABLED: false,
}))

const { apiService } = await import('@services/api')

describe('DeploymentStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { result } = renderHook(() => useDeploymentStore())
    act(() => {
      result.current.setSelectedRegistry(null)
      result.current.setSelectedNamespace('default')
      result.current.setImageFilter('')
      // Reset arrays and loading states
      result.current.registries = []
      result.current.images = []
      result.current.deployments = []
      result.current.nodes = []
      result.current.history = []
      result.current.loading = {
        registries: false,
        images: false,
        deployments: false,
        nodes: false,
        history: false,
        creating: false,
        deploying: false,
      }
      result.current.error = null
    })
    
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDeploymentStore())
      
      expect(result.current.registries).toEqual([])
      expect(result.current.images).toEqual([])
      expect(result.current.deployments).toEqual([])
      expect(result.current.nodes).toEqual([])
      expect(result.current.history).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.selectedRegistry).toBeNull()
      expect(result.current.selectedNamespace).toBe('default')
      expect(result.current.imageFilter).toBe('')
      
      expect(result.current.loading).toEqual({
        registries: false,
        images: false,
        deployments: false,
        nodes: false,
        history: false,
        creating: false,
        deploying: false,
      })
    })
  })

  describe('registry management', () => {
    it('should fetch registries successfully', async () => {
      const mockRegistries: Registry[] = [
        {
          id: '1',
          name: 'DockerHub',
          type: RegistryType.DOCKERHUB,
          config: {
            url: 'https://registry-1.docker.io',
          },
          status: RegistryStatus.CONNECTED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      vi.mocked(apiService.get).mockResolvedValue({ success: true, data: mockRegistries })

      const { result } = renderHook(() => useDeploymentStore())

      await act(async () => {
        await result.current.fetchRegistries()
      })

      expect(result.current.registries).toEqual(mockRegistries)
      expect(result.current.loading.registries).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch registries error', async () => {
      const errorMessage = 'Failed to fetch registries'
      vi.mocked(apiService.get).mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useDeploymentStore())

      await act(async () => {
        await result.current.fetchRegistries()
      })

      expect(result.current.registries).toEqual([])
      expect(result.current.loading.registries).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })

    it('should add registry successfully', async () => {
      const newRegistry = {
        name: 'New Registry',
        type: RegistryType.GENERIC,
        config: {
          url: 'https://new-registry.com',
          namespace: '',
          username: 'user',
          password: 'pass',
        },
        status: RegistryStatus.PENDING,
      }

      const createdRegistry: Registry = {
        id: '2',
        name: newRegistry.name,
        type: newRegistry.type,
        config: newRegistry.config,
        status: newRegistry.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(apiService.post).mockResolvedValue({ success: true, data: createdRegistry })

      const { result } = renderHook(() => useDeploymentStore())

      await act(async () => {
        await result.current.addRegistry(newRegistry)
      })

      expect(result.current.registries).toContainEqual(createdRegistry)
      expect(result.current.loading.creating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should delete registry successfully', async () => {
      const registry: Registry = {
        id: '1',
        name: 'Test Registry',
        type: RegistryType.DOCKERHUB,
        config: {
          url: 'https://registry.com',
        },
        status: RegistryStatus.CONNECTED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(apiService.delete).mockResolvedValue({ success: true, data: {} })

      const { result } = renderHook(() => useDeploymentStore())
      
      // Add registry first
      act(() => {
        result.current.registries = [registry]
      })

      await act(async () => {
        await result.current.deleteRegistry('1')
      })

      expect(result.current.registries).not.toContainEqual(registry)
      expect(result.current.error).toBeNull()
    })

    it('should test registry connection', async () => {
      vi.mocked(apiService.post).mockResolvedValue({ success: true, data: { connected: true } })

      const { result } = renderHook(() => useDeploymentStore())

      const isConnected = await act(async () => {
        return await result.current.testRegistry('1')
      })

      expect(isConnected).toBe(true)
      expect(apiService.post).toHaveBeenCalledWith('/deployments/registries/1/test')
    })
  })

  describe('image management', () => {
    it('should fetch images successfully', async () => {
      const mockImages: ContainerImage[] = [
        {
          registry: 'dockerhub',
          repository: 'library/nginx',
          tag: 'latest',
          digest: 'sha256:abc123',
          size: 104857600, // 100MB in bytes
          created: new Date().toISOString(),
          platform: 'linux/amd64',
          fullName: 'docker.io/library/nginx:latest',
        },
      ]

      vi.mocked(apiService.get).mockResolvedValue({ success: true, data: mockImages })

      const { result } = renderHook(() => useDeploymentStore())

      await act(async () => {
        await result.current.fetchImages('registry-1', 'library')
      })

      expect(result.current.images).toEqual(mockImages)
      expect(result.current.loading.images).toBe(false)
      expect(result.current.error).toBeNull()
      expect(apiService.get).toHaveBeenCalledWith(
        '/deployments/images?registryId=registry-1&namespace=library'
      )
    })

    it('should search images with filter', async () => {
      const mockImages: ContainerImage[] = [
        {
          registry: 'dockerhub',
          repository: 'library/nginx',
          tag: 'latest',
          digest: 'sha256:abc123',
          size: 104857600, // 100MB in bytes
          created: new Date().toISOString(),
          platform: 'linux/amd64',
          fullName: 'docker.io/library/nginx:latest',
        },
      ]

      vi.mocked(apiService.get).mockResolvedValue({ success: true, data: mockImages })

      const { result } = renderHook(() => useDeploymentStore())

      await act(async () => {
        await result.current.searchImages('nginx')
      })

      expect(result.current.images).toEqual(mockImages)
      expect(apiService.get).toHaveBeenCalledWith('/deployments/images/search?q=nginx')
    })
  })

  describe('deployment management', () => {
    it('should fetch deployments successfully', async () => {
      const mockDeployments: Deployment[] = [
        {
          id: '1',
          name: 'test-app',
          namespace: 'default',
          image: 'nginx:latest',
          registryId: 'registry-1',
          replicas: 3,
          availableReplicas: 3,
          readyReplicas: 3,
          updatedReplicas: 3,
          strategy: {
            type: 'RollingUpdate' as any,
            nodeSpread: false,
            zoneSpread: false,
          },
          status: DeploymentStatus.RUNNING,
          pods: [],
          nodeDistribution: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      vi.mocked(apiService.get).mockResolvedValue({ success: true, data: mockDeployments })

      const { result } = renderHook(() => useDeploymentStore())

      await act(async () => {
        await result.current.fetchDeployments('default')
      })

      expect(result.current.deployments).toEqual(mockDeployments)
      expect(result.current.loading.deployments).toBe(false)
      expect(apiService.get).toHaveBeenCalledWith('/deployments?namespace=default')
    })

    it('should create deployment successfully', async () => {
      const deploymentRequest: DeploymentRequest = {
        name: 'new-app',
        namespace: 'default',
        image: 'nginx:latest',
        replicas: 2,
        resources: {
          requests: { cpu: '100m', memory: '128Mi' },
          limits: { cpu: '500m', memory: '512Mi' },
        },
      }

      const createdDeployment: Deployment = {
        id: '2',
        name: deploymentRequest.name,
        namespace: deploymentRequest.namespace,
        image: deploymentRequest.image,
        registryId: deploymentRequest.registryId || 'default-registry',
        replicas: deploymentRequest.replicas,
        availableReplicas: 0,
        readyReplicas: 0,
        updatedReplicas: 0,
        strategy: deploymentRequest.strategy || {
          type: 'RollingUpdate' as any,
          nodeSpread: false,
          zoneSpread: false,
        },
        resources: deploymentRequest.resources,
        status: DeploymentStatus.PENDING,
        pods: [],
        nodeDistribution: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(apiService.post).mockResolvedValue({ success: true, data: createdDeployment })

      const { result } = renderHook(() => useDeploymentStore())

      await act(async () => {
        await result.current.createDeployment(deploymentRequest)
      })

      expect(result.current.deployments).toContainEqual(createdDeployment)
      expect(result.current.loading.creating).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should scale deployment successfully', async () => {
      const deployment: Deployment = {
        id: '1',
        name: 'test-app',
        namespace: 'default',
        image: 'nginx:latest',
        registryId: 'registry-1',
        replicas: 3,
        availableReplicas: 3,
        readyReplicas: 3,
        updatedReplicas: 3,
        strategy: {
          type: 'RollingUpdate' as any,
          nodeSpread: false,
          zoneSpread: false,
        },
        status: DeploymentStatus.RUNNING,
        pods: [],
        nodeDistribution: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedDeployment = { ...deployment, replicas: 5 }

      vi.mocked(apiService.put).mockResolvedValue({ success: true, data: updatedDeployment })

      const { result } = renderHook(() => useDeploymentStore())
      
      // Add deployment first
      act(() => {
        result.current.deployments = [deployment]
      })

      await act(async () => {
        await result.current.scaleDeployment('1', 5)
      })

      expect(result.current.deployments[0].replicas).toBe(5)
      expect(apiService.put).toHaveBeenCalledWith('/deployments/1/scale', { replicas: 5 })
    })

    it('should delete deployment successfully', async () => {
      const deployment: Deployment = {
        id: '1',
        name: 'test-app',
        namespace: 'default',
        image: 'nginx:latest',
        registryId: 'registry-1',
        replicas: 3,
        availableReplicas: 3,
        readyReplicas: 3,
        updatedReplicas: 3,
        strategy: {
          type: 'RollingUpdate' as any,
          nodeSpread: false,
          zoneSpread: false,
        },
        status: DeploymentStatus.RUNNING,
        pods: [],
        nodeDistribution: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(apiService.delete).mockResolvedValue({ success: true, data: {} })

      const { result } = renderHook(() => useDeploymentStore())
      
      // Add deployment first
      act(() => {
        result.current.deployments = [deployment]
      })

      await act(async () => {
        await result.current.deleteDeployment('1')
      })

      expect(result.current.deployments).not.toContainEqual(deployment)
      expect(apiService.delete).toHaveBeenCalledWith('/deployments/1')
    })
  })

  describe('filter management', () => {
    it('should set selected registry', () => {
      const { result } = renderHook(() => useDeploymentStore())

      act(() => {
        result.current.setSelectedRegistry('registry-1')
      })

      expect(result.current.selectedRegistry).toBe('registry-1')
    })

    it('should set selected namespace', () => {
      const { result } = renderHook(() => useDeploymentStore())

      act(() => {
        result.current.setSelectedNamespace('production')
      })

      expect(result.current.selectedNamespace).toBe('production')
    })

    it('should set image filter', () => {
      const { result } = renderHook(() => useDeploymentStore())

      act(() => {
        result.current.setImageFilter('nginx')
      })

      expect(result.current.imageFilter).toBe('nginx')
    })
  })

  describe('derived data', () => {
    it('should filter deployments by namespace', () => {
      const deployments: Deployment[] = [
        {
          id: '1',
          name: 'app-1',
          namespace: 'default',
          image: 'nginx:latest',
          registryId: 'registry-1',
          replicas: 3,
          availableReplicas: 3,
          readyReplicas: 3,
          updatedReplicas: 3,
          strategy: {
            type: 'RollingUpdate' as any,
            nodeSpread: false,
            zoneSpread: false,
          },
          status: DeploymentStatus.RUNNING,
          pods: [],
          nodeDistribution: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'app-2',
          namespace: 'production',
          image: 'nginx:latest',
          registryId: 'registry-1',
          replicas: 3,
          availableReplicas: 3,
          readyReplicas: 3,
          updatedReplicas: 3,
          strategy: {
            type: 'RollingUpdate' as any,
            nodeSpread: false,
            zoneSpread: false,
          },
          status: DeploymentStatus.RUNNING,
          pods: [],
          nodeDistribution: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      const { result } = renderHook(() => useDeploymentStore())

      act(() => {
        result.current.deployments = deployments
        result.current.setSelectedNamespace('default')
      })

      const filteredDeployments = result.current.deployments.filter(
        d => d.namespace === result.current.selectedNamespace
      )

      expect(filteredDeployments).toHaveLength(1)
      expect(filteredDeployments[0].name).toBe('app-1')
    })

    it('should filter images by search term', () => {
      const images: ContainerImage[] = [
        {
          registry: 'dockerhub',
          repository: 'library/nginx',
          tag: 'latest',
          digest: 'sha256:abc123',
          size: 104857600, // 100MB in bytes
          created: new Date().toISOString(),
          platform: 'linux/amd64',
          fullName: 'docker.io/library/nginx:latest',
        },
        {
          registry: 'dockerhub',
          repository: 'library/apache',
          tag: 'latest',
          digest: 'sha256:def456',
          size: 209715200, // 200MB in bytes
          created: new Date().toISOString(),
          platform: 'linux/amd64',
          fullName: 'docker.io/library/apache:latest',
        },
      ]

      const { result } = renderHook(() => useDeploymentStore())

      act(() => {
        result.current.images = images
        result.current.setImageFilter('nginx')
      })

      const filteredImages = result.current.images.filter(
        img => img.repository.toLowerCase().includes(result.current.imageFilter.toLowerCase())
      )

      expect(filteredImages).toHaveLength(1)
      expect(filteredImages[0].repository).toBe('library/nginx')
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error'
      vi.mocked(apiService.get).mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useDeploymentStore())

      await act(async () => {
        await result.current.fetchRegistries()
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.loading.registries).toBe(false)
    })

    it('should clear error when new request succeeds', async () => {
      const { result } = renderHook(() => useDeploymentStore())

      // Set initial error
      act(() => {
        result.current.error = 'Previous error'
      })

      // Mock successful response
      vi.mocked(apiService.get).mockResolvedValue({ success: true, data: [] })

      await act(async () => {
        await result.current.fetchRegistries()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('loading states', () => {
    it('should set loading state during async operations', async () => {
      // Mock a delayed response
      vi.mocked(apiService.get).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      )

      const { result } = renderHook(() => useDeploymentStore())

      // Start the async operation
      const promise = act(async () => {
        return result.current.fetchRegistries()
      })

      // Check loading state is true during operation
      expect(result.current.loading.registries).toBe(true)

      // Wait for completion
      await promise

      // Check loading state is false after completion
      expect(result.current.loading.registries).toBe(false)
    })
  })
})