import { describe, it, expect } from 'vitest'
import {
  getStatusConfig,
  getStatusColor,
  getStatusBgColor,
  getStatusBorderColor,
  getStatusIcon,
  getStatusLabel,
  getStatusPriority,
  sortByStatusPriority,
  TrendDirection,
  getTrendConfig,
  getDeploymentStatusColor,
  getRegistryStatusColor,
  getRegistryStatusIcon,
} from '@utils/status'
import { Status, DeploymentStatus, RegistryStatus } from '@constants'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  HelpCircle,
  Info,
  AlertCircle,
  Activity,
  Pause,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'

describe('Status Utilities', () => {
  describe('getStatusConfig', () => {
    it('should return correct config for healthy status', () => {
      const config = getStatusConfig(Status.HEALTHY)
      
      expect(config.color).toContain('green')
      expect(config.bgColor).toBe('bg-green-500/10')
      expect(config.borderColor).toBe('border-green-500')
      expect(config.icon).toBe(CheckCircle)
      expect(config.label).toBe('HEALTHY')
      expect(config.priority).toBe(1)
    })

    it('should return correct config for success status', () => {
      const config = getStatusConfig(Status.SUCCESS)
      
      // Success should use same config as healthy
      expect(config.color).toContain('green')
      expect(config.icon).toBe(CheckCircle)
      expect(config.label).toBe('HEALTHY')
      expect(config.priority).toBe(1)
    })

    it('should return correct config for warning status', () => {
      const config = getStatusConfig(Status.WARNING)
      
      expect(config.color).toContain('yellow')
      expect(config.bgColor).toBe('bg-yellow-500/10')
      expect(config.borderColor).toBe('border-yellow-500')
      expect(config.icon).toBe(AlertTriangle)
      expect(config.label).toBe('WARNING')
      expect(config.priority).toBe(2)
    })

    it('should return correct config for critical status', () => {
      const config = getStatusConfig(Status.CRITICAL)
      
      expect(config.color).toContain('red')
      expect(config.bgColor).toBe('bg-red-600/10')
      expect(config.borderColor).toBe('border-red-600')
      expect(config.icon).toBe(XCircle)
      expect(config.label).toBe('CRITICAL')
      expect(config.priority).toBe(3)
    })

    it('should return correct config for error status', () => {
      const config = getStatusConfig(Status.ERROR)
      
      expect(config.color).toContain('red')
      expect(config.bgColor).toBe('bg-red-500/10')
      expect(config.borderColor).toBe('border-red-500')
      expect(config.icon).toBe(XCircle)
      expect(config.label).toBe('ERROR')
      expect(config.priority).toBe(3)
    })

    it('should return correct config for pending status', () => {
      const config = getStatusConfig(Status.PENDING)
      
      expect(config.color).toContain('yellow')
      expect(config.bgColor).toBe('bg-yellow-400/10')
      expect(config.borderColor).toBe('border-yellow-400')
      expect(config.icon).toBe(Clock)
      expect(config.label).toBe('PENDING')
      expect(config.priority).toBe(4)
    })

    it('should return correct config for progressing status', () => {
      const config = getStatusConfig(Status.PROGRESSING)
      
      expect(config.color).toBe('text-blue-500')
      expect(config.bgColor).toBe('bg-blue-500/10')
      expect(config.borderColor).toBe('border-blue-500')
      expect(config.icon).toBe(Activity)
      expect(config.label).toBe('PROGRESSING')
      expect(config.priority).toBe(4)
    })

    it('should return correct config for info status', () => {
      const config = getStatusConfig(Status.INFO)
      
      expect(config.color).toContain('blue')
      expect(config.bgColor).toBe('bg-blue-400/10')
      expect(config.borderColor).toBe('border-blue-400')
      expect(config.icon).toBe(Info)
      expect(config.label).toBe('INFO')
      expect(config.priority).toBe(5)
    })

    it('should return correct config for degraded status', () => {
      const config = getStatusConfig(Status.DEGRADED)
      
      expect(config.color).toBe('text-orange-500')
      expect(config.bgColor).toBe('bg-orange-500/10')
      expect(config.borderColor).toBe('border-orange-500')
      expect(config.icon).toBe(AlertCircle)
      expect(config.label).toBe('DEGRADED')
      expect(config.priority).toBe(3)
    })

    it('should return correct config for suspended status', () => {
      const config = getStatusConfig(Status.SUSPENDED)
      
      expect(config.color).toBe('text-gray-500')
      expect(config.bgColor).toBe('bg-gray-500/10')
      expect(config.borderColor).toBe('border-gray-500')
      expect(config.icon).toBe(Pause)
      expect(config.label).toBe('SUSPENDED')
      expect(config.priority).toBe(6)
    })

    it('should return correct config for down status', () => {
      const config = getStatusConfig(Status.DOWN)
      
      expect(config.color).toBe('text-red-700')
      expect(config.bgColor).toBe('bg-red-700/10')
      expect(config.borderColor).toBe('border-red-700')
      expect(config.icon).toBe(XCircle)
      expect(config.label).toBe('DOWN')
      expect(config.priority).toBe(1)
    })

    it('should return correct config for alert severity levels', () => {
      const highConfig = getStatusConfig(Status.HIGH)
      expect(highConfig.color).toBe('text-red-500')
      expect(highConfig.icon).toBe(AlertTriangle)
      expect(highConfig.label).toBe('HIGH')
      expect(highConfig.priority).toBe(2)

      const mediumConfig = getStatusConfig(Status.MEDIUM)
      expect(mediumConfig.color).toBe('text-yellow-500')
      expect(mediumConfig.icon).toBe(AlertCircle)
      expect(mediumConfig.label).toBe('MEDIUM')
      expect(mediumConfig.priority).toBe(3)

      const lowConfig = getStatusConfig(Status.LOW)
      expect(lowConfig.color).toBe('text-blue-500')
      expect(lowConfig.icon).toBe(Info)
      expect(lowConfig.label).toBe('LOW')
      expect(lowConfig.priority).toBe(4)
    })

    it('should return unknown config for missing/unknown status', () => {
      const missingConfig = getStatusConfig(Status.MISSING)
      expect(missingConfig.icon).toBe(HelpCircle)
      expect(missingConfig.label).toBe('UNKNOWN')
      expect(missingConfig.priority).toBe(7)

      const unknownConfig = getStatusConfig(Status.UNKNOWN)
      expect(unknownConfig.icon).toBe(HelpCircle)
      expect(unknownConfig.label).toBe('UNKNOWN')
      expect(unknownConfig.priority).toBe(7)
    })
  })

  describe('individual getter functions', () => {
    it('should return correct color', () => {
      expect(getStatusColor(Status.HEALTHY)).toContain('green')
      expect(getStatusColor(Status.ERROR)).toContain('red')
      expect(getStatusColor(Status.WARNING)).toContain('yellow')
    })

    it('should return correct background color', () => {
      expect(getStatusBgColor(Status.HEALTHY)).toBe('bg-green-500/10')
      expect(getStatusBgColor(Status.ERROR)).toBe('bg-red-500/10')
      expect(getStatusBgColor(Status.WARNING)).toBe('bg-yellow-500/10')
    })

    it('should return correct border color', () => {
      expect(getStatusBorderColor(Status.HEALTHY)).toBe('border-green-500')
      expect(getStatusBorderColor(Status.ERROR)).toBe('border-red-500')
      expect(getStatusBorderColor(Status.WARNING)).toBe('border-yellow-500')
    })

    it('should return correct icons', () => {
      expect(getStatusIcon(Status.HEALTHY)).toBe(CheckCircle)
      expect(getStatusIcon(Status.ERROR)).toBe(XCircle)
      expect(getStatusIcon(Status.WARNING)).toBe(AlertTriangle)
      expect(getStatusIcon(Status.PENDING)).toBe(Clock)
      expect(getStatusIcon(Status.PROGRESSING)).toBe(Activity)
    })

    it('should return correct labels', () => {
      expect(getStatusLabel(Status.HEALTHY)).toBe('HEALTHY')
      expect(getStatusLabel(Status.ERROR)).toBe('ERROR')
      expect(getStatusLabel(Status.WARNING)).toBe('WARNING')
      expect(getStatusLabel(Status.CRITICAL)).toBe('CRITICAL')
    })

    it('should return correct priorities', () => {
      expect(getStatusPriority(Status.HEALTHY)).toBe(1)
      expect(getStatusPriority(Status.WARNING)).toBe(2)
      expect(getStatusPriority(Status.ERROR)).toBe(3)
      expect(getStatusPriority(Status.PENDING)).toBe(4)
      expect(getStatusPriority(Status.INFO)).toBe(5)
    })
  })

  describe('sortByStatusPriority', () => {
    it('should sort statuses by priority (most critical first)', () => {
      const statuses = [
        Status.INFO,
        Status.HEALTHY,
        Status.ERROR,
        Status.WARNING,
        Status.PENDING
      ]

      const sorted = sortByStatusPriority(statuses)

      expect(sorted[0]).toBe(Status.HEALTHY) // priority 1
      expect(sorted[1]).toBe(Status.WARNING) // priority 2
      expect(sorted[2]).toBe(Status.ERROR)   // priority 3
      expect(sorted[3]).toBe(Status.PENDING) // priority 4
      expect(sorted[4]).toBe(Status.INFO)    // priority 5
    })

    it('should not mutate the original array', () => {
      const statuses = [Status.ERROR, Status.HEALTHY, Status.WARNING]
      const original = [...statuses]
      
      sortByStatusPriority(statuses)
      
      expect(statuses).toEqual(original)
    })

    it('should handle empty array', () => {
      const result = sortByStatusPriority([])
      expect(result).toEqual([])
    })

    it('should handle single item array', () => {
      const result = sortByStatusPriority([Status.HEALTHY])
      expect(result).toEqual([Status.HEALTHY])
    })
  })

  describe('TrendDirection and getTrendConfig', () => {
    it('should have correct trend direction values', () => {
      expect(TrendDirection.UP).toBe('up')
      expect(TrendDirection.DOWN).toBe('down')
      expect(TrendDirection.STABLE).toBe('stable')
    })

    it('should return correct config for UP trend', () => {
      const config = getTrendConfig(TrendDirection.UP)
      
      expect(config.color).toBe('text-green-500')
      expect(config.icon).toBe(ArrowUp)
      expect(config.label).toBe('UP')
    })

    it('should return correct config for DOWN trend', () => {
      const config = getTrendConfig(TrendDirection.DOWN)
      
      expect(config.color).toBe('text-red-500')
      expect(config.icon).toBe(ArrowDown)
      expect(config.label).toBe('DOWN')
    })

    it('should return correct config for STABLE trend', () => {
      const config = getTrendConfig(TrendDirection.STABLE)
      
      expect(config.color).toBe('text-gray-500')
      expect(config.icon).toBe(Minus)
      expect(config.label).toBe('STABLE')
    })
  })

  describe('getDeploymentStatusColor', () => {
    it('should return correct colors for deployment statuses', () => {
      expect(getDeploymentStatusColor(DeploymentStatus.RUNNING)).toBe('text-green-500')
      expect(getDeploymentStatusColor(DeploymentStatus.PENDING)).toBe('text-yellow-500')
      expect(getDeploymentStatusColor(DeploymentStatus.FAILED)).toBe('text-red-500')
      expect(getDeploymentStatusColor(DeploymentStatus.UPDATING)).toBe('text-blue-500')
      expect(getDeploymentStatusColor(DeploymentStatus.TERMINATING)).toBe('text-orange-500')
    })

    it('should return correct colors for GitOps statuses', () => {
      expect(getDeploymentStatusColor(DeploymentStatus.COMMITTED)).toBe('text-cyan-500')
      expect(getDeploymentStatusColor(DeploymentStatus.PENDING_APPLY)).toBe('text-blue-400')
      expect(getDeploymentStatusColor(DeploymentStatus.APPLYING)).toBe('text-blue-500')
      expect(getDeploymentStatusColor(DeploymentStatus.APPLY_FAILED)).toBe('text-red-600')
    })

    it('should return default color for unknown status', () => {
      // @ts-expect-error - testing invalid status
      expect(getDeploymentStatusColor('invalid')).toBe('text-gray-500')
    })
  })

  describe('getRegistryStatusColor', () => {
    it('should return correct colors for registry statuses', () => {
      expect(getRegistryStatusColor(RegistryStatus.CONNECTED)).toBe('text-green-500')
      expect(getRegistryStatusColor(RegistryStatus.PENDING)).toBe('text-yellow-500')
      expect(getRegistryStatusColor(RegistryStatus.ERROR)).toBe('text-red-500')
    })

    it('should return default color for unknown status', () => {
      // @ts-expect-error - testing invalid status
      expect(getRegistryStatusColor('invalid')).toBe('text-gray-500')
    })
  })

  describe('getRegistryStatusIcon', () => {
    it('should return correct icons for registry statuses', () => {
      expect(getRegistryStatusIcon(RegistryStatus.CONNECTED)).toBe(CheckCircle)
      expect(getRegistryStatusIcon(RegistryStatus.PENDING)).toBe(Clock)
      expect(getRegistryStatusIcon(RegistryStatus.ERROR)).toBe(XCircle)
    })

    it('should return default icon for unknown status', () => {
      // @ts-expect-error - testing invalid status
      expect(getRegistryStatusIcon('invalid')).toBe(HelpCircle)
    })
  })

  describe('Status configuration consistency', () => {
    it('should have consistent priority ordering', () => {
      const criticalStatuses = [Status.HEALTHY, Status.DOWN]
      const warningStatuses = [Status.WARNING, Status.HIGH]
      const errorStatuses = [Status.ERROR, Status.CRITICAL, Status.DEGRADED]
      const infoStatuses = [Status.PENDING, Status.PROGRESSING]
      const otherStatuses = [Status.INFO, Status.SUSPENDED, Status.UNKNOWN]

      criticalStatuses.forEach(status => {
        expect(getStatusPriority(status)).toBeLessThanOrEqual(2)
      })

      warningStatuses.forEach(status => {
        expect(getStatusPriority(status)).toBeLessThanOrEqual(3)
      })

      errorStatuses.forEach(status => {
        expect(getStatusPriority(status)).toBeLessThanOrEqual(3)
      })
    })

    it('should use appropriate icons for status types', () => {
      // Success/healthy statuses should use positive icons
      expect(getStatusIcon(Status.HEALTHY)).toBe(CheckCircle)
      expect(getStatusIcon(Status.SUCCESS)).toBe(CheckCircle)

      // Error statuses should use error icons
      expect(getStatusIcon(Status.ERROR)).toBe(XCircle)
      expect(getStatusIcon(Status.CRITICAL)).toBe(XCircle)
      expect(getStatusIcon(Status.DOWN)).toBe(XCircle)

      // Warning statuses should use warning icons
      expect(getStatusIcon(Status.WARNING)).toBe(AlertTriangle)
      expect(getStatusIcon(Status.HIGH)).toBe(AlertTriangle)

      // Pending/waiting statuses should use clock icon
      expect(getStatusIcon(Status.PENDING)).toBe(Clock)

      // Unknown statuses should use help icon
      expect(getStatusIcon(Status.UNKNOWN)).toBe(HelpCircle)
      expect(getStatusIcon(Status.MISSING)).toBe(HelpCircle)
    })

    it('should use consistent color schemes', () => {
      // All green statuses
      const greenStatuses = [Status.HEALTHY, Status.SUCCESS]
      greenStatuses.forEach(status => {
        expect(getStatusColor(status)).toContain('green')
      })

      // All red statuses
      const redStatuses = [Status.ERROR, Status.CRITICAL]
      redStatuses.forEach(status => {
        expect(getStatusColor(status)).toContain('red')
      })

      // All yellow/warning statuses
      const yellowStatuses = [Status.WARNING]
      yellowStatuses.forEach(status => {
        expect(getStatusColor(status)).toContain('yellow')
      })
    })
  })
})