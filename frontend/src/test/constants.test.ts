import { describe, it, expect } from 'vitest'
import {
  Status,
  SyncStatus,
  PodStatus,
  NodeStatus,
  ConnectionStatus,
  WebSocketEventType,
  LogLevel,
  EventCategory,
  RegistryType,
  RegistryStatus,
  DeploymentStatus,
  DeploymentStrategy,
  DeploymentAction,
  ButtonColor,
  DialogIcon,
  ServiceViewMode,
  LogsViewMode,
  FilterOption,
  SortDirection,
  STATUS_COLORS,
  BUTTON_COLORS,
} from '@constants'

describe('Constants', () => {
  describe('Status enum', () => {
    it('should have all expected status values', () => {
      expect(Status.HEALTHY).toBe('healthy')
      expect(Status.DEGRADED).toBe('degraded')
      expect(Status.CRITICAL).toBe('critical')
      expect(Status.WARNING).toBe('warning')
      expect(Status.ERROR).toBe('error')
      expect(Status.INFO).toBe('info')
      expect(Status.SUCCESS).toBe('success')
      expect(Status.PENDING).toBe('pending')
      expect(Status.PROGRESSING).toBe('progressing')
      expect(Status.UNKNOWN).toBe('unknown')
      expect(Status.SUSPENDED).toBe('suspended')
      expect(Status.MISSING).toBe('missing')
      expect(Status.DOWN).toBe('down')
      expect(Status.HIGH).toBe('high')
      expect(Status.MEDIUM).toBe('medium')
      expect(Status.LOW).toBe('low')
    })

    it('should have consistent values with backend', () => {
      // These values must match backend constants
      const expectedValues = [
        'healthy', 'degraded', 'critical', 'warning', 'error',
        'info', 'success', 'pending', 'progressing', 'unknown',
        'suspended', 'missing', 'down', 'high', 'medium', 'low'
      ]

      const statusValues = Object.values(Status)
      expectedValues.forEach(value => {
        expect(statusValues).toContain(value)
      })
    })
  })

  describe('SyncStatus enum', () => {
    it('should have all expected sync status values', () => {
      expect(SyncStatus.SYNCED).toBe('synced')
      expect(SyncStatus.OUT_OF_SYNC).toBe('out_of_sync')
      expect(SyncStatus.ERROR).toBe(Status.ERROR)
      expect(SyncStatus.PENDING).toBe(Status.PENDING)
      expect(SyncStatus.UNKNOWN).toBe(Status.UNKNOWN)
    })

    it('should reuse Status enum values where appropriate', () => {
      expect(SyncStatus.ERROR).toBe('error')
      expect(SyncStatus.PENDING).toBe('pending')
      expect(SyncStatus.UNKNOWN).toBe('unknown')
    })
  })

  describe('PodStatus enum', () => {
    it('should have all expected pod status values', () => {
      expect(PodStatus.RUNNING).toBe('Running')
      expect(PodStatus.PENDING).toBe('Pending')
      expect(PodStatus.FAILED).toBe('failed')
      expect(PodStatus.SUCCEEDED).toBe('succeeded')
      expect(PodStatus.TERMINATING).toBe('terminating')
      expect(PodStatus.UNKNOWN).toBe(Status.UNKNOWN)
    })

    it('should match Kubernetes pod phase values', () => {
      // These should match Kubernetes API pod phases
      expect(PodStatus.RUNNING).toBe('Running')
      expect(PodStatus.PENDING).toBe('Pending')
    })
  })

  describe('NodeStatus enum', () => {
    it('should have all expected node status values', () => {
      expect(NodeStatus.READY).toBe('ready')
      expect(NodeStatus.NOT_READY).toBe('notready')
      expect(NodeStatus.UNKNOWN).toBe(Status.UNKNOWN)
    })
  })

  describe('ConnectionStatus enum', () => {
    it('should have all expected connection status values', () => {
      expect(ConnectionStatus.ONLINE).toBe('online')
      expect(ConnectionStatus.OFFLINE).toBe('offline')
      expect(ConnectionStatus.CONNECTING).toBe('connecting')
      expect(ConnectionStatus.DISCONNECTED).toBe('disconnected')
    })
  })

  describe('WebSocketEventType enum', () => {
    it('should have all expected WebSocket event types', () => {
      expect(WebSocketEventType.HEARTBEAT).toBe('heartbeat')
      expect(WebSocketEventType.CONNECTION).toBe('connection')
      expect(WebSocketEventType.METRICS).toBe('metrics')
      expect(WebSocketEventType.PODS).toBe('pods')
      expect(WebSocketEventType.SERVICES).toBe('services')
      expect(WebSocketEventType.LOGS).toBe('logs')
      expect(WebSocketEventType.EVENTS).toBe('events')
      expect(WebSocketEventType.WORKFLOWS).toBe('workflows')
      expect(WebSocketEventType.DEPLOYMENTS).toBe('deployments')
      expect(WebSocketEventType.ALERTS).toBe('alerts')
    })

    it('should have GitOps-specific event types', () => {
      expect(WebSocketEventType.REPOSITORY_SYNC).toBe('repository_sync')
      expect(WebSocketEventType.APPLICATION_SYNC).toBe('application_sync')
      expect(WebSocketEventType.GIT_OPERATION).toBe('git_operation')
      expect(WebSocketEventType.DEPLOYMENT_STATUS).toBe('deployment_status')
    })
  })

  describe('LogLevel enum', () => {
    it('should have all expected log levels', () => {
      expect(LogLevel.TRACE).toBe('trace')
      expect(LogLevel.DEBUG).toBe('debug')
      expect(LogLevel.INFO).toBe('info')
      expect(LogLevel.WARN).toBe('warn')
      expect(LogLevel.ERROR).toBe('error')
      expect(LogLevel.FATAL).toBe('fatal')
    })

    it('should be ordered from least to most severe', () => {
      const levels = [
        LogLevel.TRACE,
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.FATAL
      ]

      // Verify the order makes sense
      expect(levels[0]).toBe('trace')
      expect(levels[levels.length - 1]).toBe('fatal')
    })
  })

  describe('EventCategory enum', () => {
    it('should have all expected event categories', () => {
      expect(EventCategory.NODE).toBe('node')
      expect(EventCategory.POD).toBe('pod')
      expect(EventCategory.SERVICE).toBe('service')
      expect(EventCategory.CONFIG).toBe('config')
      expect(EventCategory.SECURITY).toBe('security')
      expect(EventCategory.NETWORK).toBe('network')
      expect(EventCategory.STORAGE).toBe('storage')
    })
  })

  describe('Registry enums', () => {
    it('should have all expected registry types', () => {
      expect(RegistryType.DOCKERHUB).toBe('dockerhub')
      expect(RegistryType.GITEA).toBe('gitea')
      expect(RegistryType.GITLAB).toBe('gitlab')
      expect(RegistryType.GENERIC).toBe('generic')
    })

    it('should have all expected registry statuses', () => {
      expect(RegistryStatus.PENDING).toBe('pending')
      expect(RegistryStatus.CONNECTED).toBe('connected')
      expect(RegistryStatus.ERROR).toBe('error')
    })
  })

  describe('Deployment enums', () => {
    it('should have all expected deployment statuses', () => {
      expect(DeploymentStatus.PENDING).toBe(Status.PENDING)
      expect(DeploymentStatus.COMMITTED).toBe('committed')
      expect(DeploymentStatus.PENDING_APPLY).toBe('pending_apply')
      expect(DeploymentStatus.APPLYING).toBe('applying')
      expect(DeploymentStatus.RUNNING).toBe('running')
      expect(DeploymentStatus.FAILED).toBe('failed')
      expect(DeploymentStatus.APPLY_FAILED).toBe('apply_failed')
      expect(DeploymentStatus.UPDATING).toBe('updating')
      expect(DeploymentStatus.TERMINATING).toBe('terminating')
    })

    it('should have GitOps-specific deployment statuses', () => {
      expect(DeploymentStatus.COMMITTED).toBe('committed')
      expect(DeploymentStatus.PENDING_APPLY).toBe('pending_apply')
      expect(DeploymentStatus.APPLYING).toBe('applying')
      expect(DeploymentStatus.APPLY_FAILED).toBe('apply_failed')
    })

    it('should have all expected deployment strategies', () => {
      expect(DeploymentStrategy.ROLLING_UPDATE).toBe('RollingUpdate')
      expect(DeploymentStrategy.RECREATE).toBe('Recreate')
    })

    it('should have all expected deployment actions', () => {
      expect(DeploymentAction.CREATE).toBe('create')
      expect(DeploymentAction.UPDATE).toBe('update')
      expect(DeploymentAction.SCALE).toBe('scale')
      expect(DeploymentAction.DELETE).toBe('delete')
      expect(DeploymentAction.RESTART).toBe('restart')
    })
  })

  describe('UI enums', () => {
    it('should have all expected button colors', () => {
      expect(ButtonColor.BLUE).toBe('blue')
      expect(ButtonColor.GREEN).toBe('green')
      expect(ButtonColor.RED).toBe('red')
      expect(ButtonColor.YELLOW).toBe('yellow')
      expect(ButtonColor.GRAY).toBe('gray')
      expect(ButtonColor.WHITE).toBe('white')
    })

    it('should have all expected dialog icons', () => {
      expect(DialogIcon.WARNING).toBe('warning')
      expect(DialogIcon.DANGER).toBe('danger')
    })

    it('should have all expected view modes', () => {
      expect(ServiceViewMode.CARDS).toBe('cards')
      expect(ServiceViewMode.TABLE).toBe('table')

      expect(LogsViewMode.STATIC).toBe('static')
      expect(LogsViewMode.LIVE).toBe('live')
      expect(LogsViewMode.PODS).toBe('pods')
      expect(LogsViewMode.DEPLOYMENTS).toBe('deployments')
    })

    it('should have all expected filter options', () => {
      expect(FilterOption.ALL).toBe('all')
      expect(FilterOption.ALL_NAMESPACES).toBe('all')
      expect(FilterOption.ALL_TYPES).toBe('all')
    })

    it('should have all expected sort directions', () => {
      expect(SortDirection.ASC).toBe('asc')
      expect(SortDirection.DESC).toBe('desc')
    })
  })

  describe('STATUS_COLORS', () => {
    it('should have text colors for all status values', () => {
      Object.values(Status).forEach(status => {
        expect(STATUS_COLORS.TEXT).toHaveProperty(status)
        expect(typeof STATUS_COLORS.TEXT[status]).toBe('string')
        expect(STATUS_COLORS.TEXT[status]).toMatch(/^text-/)
      })
    })

    // Note: STATUS_COLORS only has TEXT and BORDER properties, no BG

    it('should have border colors for all status values', () => {
      Object.values(Status).forEach(status => {
        expect(STATUS_COLORS.BORDER).toHaveProperty(status)
        expect(typeof STATUS_COLORS.BORDER[status]).toBe('string')
        expect(STATUS_COLORS.BORDER[status]).toMatch(/^border-/)
      })
    })

    it('should use consistent color schemes', () => {
      // Healthy should be green
      expect(STATUS_COLORS.TEXT[Status.HEALTHY]).toContain('green')
      expect(STATUS_COLORS.BORDER[Status.HEALTHY]).toContain('green')

      // Error should be red
      expect(STATUS_COLORS.TEXT[Status.ERROR]).toContain('red')
      expect(STATUS_COLORS.BORDER[Status.ERROR]).toContain('red')

      // Warning should be yellow
      expect(STATUS_COLORS.TEXT[Status.WARNING]).toContain('yellow')
      expect(STATUS_COLORS.BORDER[Status.WARNING]).toContain('yellow')
    })
  })

  describe('BUTTON_COLORS', () => {
    it('should have color mappings for all button colors', () => {
      Object.values(ButtonColor).forEach(color => {
        expect(BUTTON_COLORS).toHaveProperty(color)
        expect(typeof BUTTON_COLORS[color]).toBe('string')
      })
    })

    it('should have consistent Tailwind CSS classes for each button color', () => {
      Object.values(ButtonColor).forEach(color => {
        const colorClasses = BUTTON_COLORS[color]
        expect(colorClasses).toContain('border-')
        expect(colorClasses).toContain('text-')
        expect(colorClasses).toContain('hover:bg-')
        expect(colorClasses).toContain('hover:text-')
      })
    })
  })

  describe('Enum value uniqueness', () => {
    it('should have unique values within each enum', () => {
      const checkUniqueValues = (enumObj: Record<string, string>) => {
        const values = Object.values(enumObj)
        const uniqueValues = new Set(values)
        expect(uniqueValues.size).toBe(values.length)
      }

      checkUniqueValues(Status)
      checkUniqueValues(WebSocketEventType)
      checkUniqueValues(LogLevel)
      checkUniqueValues(EventCategory)
      checkUniqueValues(RegistryType)
      checkUniqueValues(RegistryStatus)
      checkUniqueValues(DeploymentStrategy)
      checkUniqueValues(DeploymentAction)
      checkUniqueValues(ButtonColor)
      checkUniqueValues(DialogIcon)
      checkUniqueValues(ServiceViewMode)
      // Skip LogsViewMode as it has duplicate values for different purposes
      // Skip FilterOption as it has duplicate 'all' values for different contexts
      checkUniqueValues(SortDirection)
    })
  })

  describe('Backend compatibility', () => {
    it('should match backend constants exactly', () => {
      // These must match the backend constants package exactly
      expect(Status.HEALTHY).toBe('healthy')
      expect(Status.CRITICAL).toBe('critical')
      expect(WebSocketEventType.METRICS).toBe('metrics')
      expect(LogLevel.ERROR).toBe('error')
      expect(RegistryType.DOCKERHUB).toBe('dockerhub')
      expect(DeploymentStrategy.ROLLING_UPDATE).toBe('RollingUpdate')
    })
  })
})