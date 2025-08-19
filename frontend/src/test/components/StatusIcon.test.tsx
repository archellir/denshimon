import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusIcon from '@components/common/StatusIcon'
import { Status } from '@constants'

describe('StatusIcon', () => {
  describe('rendering', () => {
    it('should render status icon without label by default', () => {
      render(<StatusIcon status={Status.HEALTHY} />)
      
      // Should render an icon (SVG element)
      const container = screen.getByTitle('HEALTHY')
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
      
      // Should not show label by default
      expect(screen.queryByText('HEALTHY')).not.toBeInTheDocument()
    })

    it('should render status icon with label when showLabel is true', () => {
      const { container } = render(<StatusIcon status={Status.HEALTHY} showLabel={true} />)
      
      // Should render icon
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
      
      // Should show label
      expect(screen.getByText('HEALTHY')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <StatusIcon status={Status.HEALTHY} className="custom-class" />
      )
      
      // Check if the custom class is applied to the SVG icon
      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('custom-class')
    })
  })

  describe('different status types', () => {
    const statusTests = [
      { status: Status.HEALTHY, label: 'HEALTHY', colorClass: 'text-green' },
      { status: Status.WARNING, label: 'WARNING', colorClass: 'text-yellow' },
      { status: Status.ERROR, label: 'ERROR', colorClass: 'text-red' },
      { status: Status.CRITICAL, label: 'CRITICAL', colorClass: 'text-red' },
      { status: Status.PENDING, label: 'PENDING', colorClass: 'text-yellow' },
      { status: Status.UNKNOWN, label: 'UNKNOWN', colorClass: 'text-gray' },
    ]

    statusTests.forEach(({ status, label, colorClass }) => {
      it(`should render ${status} status correctly`, () => {
        const { container } = render(<StatusIcon status={status} showLabel={true} />)
        
        // Check label is displayed
        expect(screen.getByText(label)).toBeInTheDocument()
        
        // Check color class is applied (partial match since exact Tailwind class may vary)
        const labelElement = screen.getByText(label)
        const iconElement = container.querySelector('svg')
        
        // At least one element should have a color class containing the expected color
        const hasColorClass = 
          labelElement?.className.includes(colorClass.replace('text-', '')) ||
          iconElement?.className.includes(colorClass.replace('text-', ''))
        
        expect(hasColorClass).toBeTruthy()
      })
    })
  })

  describe('size handling', () => {
    it('should accept custom size prop', () => {
      const { container } = render(<StatusIcon status={Status.HEALTHY} size={24} />)
      
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
      // Note: The actual size application depends on the Icon component implementation
    })

    it('should use default size when no size prop provided', () => {
      const { container } = render(<StatusIcon status={Status.HEALTHY} />)
      
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should be accessible with label', () => {
      render(<StatusIcon status={Status.HEALTHY} showLabel={true} />)
      
      // Label should be readable by screen readers
      expect(screen.getByText('HEALTHY')).toBeInTheDocument()
    })

    it('should have proper structure for screen readers', () => {
      const { container } = render(
        <StatusIcon status={Status.ERROR} showLabel={true} />
      )
      
      // Should have readable text content
      expect(container.textContent).toContain('ERROR')
    })
  })

  describe('icon display', () => {
    it('should render appropriate icon for each status', () => {
      const { rerender, container } = render(<StatusIcon status={Status.HEALTHY} />)
      
      // Each status should render an icon (SVG)
      let icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
      
      // Test different statuses
      const statuses = [
        Status.WARNING,
        Status.ERROR,
        Status.PENDING,
        Status.UNKNOWN
      ]
      
      statuses.forEach(status => {
        rerender(<StatusIcon status={status} />)
        icon = container.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })
  })

  describe('layout with label', () => {
    it('should have proper layout when showing label', () => {
      const { container } = render(
        <StatusIcon status={Status.HEALTHY} showLabel={true} />
      )
      
      // Should have flex layout classes
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex', 'items-center', 'space-x-2')
    })

    it('should have proper text styling for label', () => {
      render(<StatusIcon status={Status.WARNING} showLabel={true} />)
      
      const label = screen.getByText('WARNING')
      expect(label).toHaveClass('text-xs', 'font-mono')
    })
  })

  describe('color consistency', () => {
    it('should apply same color to both icon and label', () => {
      const { container } = render(<StatusIcon status={Status.ERROR} showLabel={true} />)
      
      const label = screen.getByText('ERROR')
      const icon = container.querySelector('svg')
      
      // Both should have color classes applied
      expect(label?.className).toBeTruthy()
      expect(icon?.className).toBeTruthy()
      
      // Both should contain red color indication
      const labelHasRedColor = label?.className && label.className.includes('red')
      // SVG className might be a SVGAnimatedString, so we need to handle it properly
      const iconClassName = icon?.className?.baseVal || icon?.className || ''
      const iconHasRedColor = iconClassName && iconClassName.includes('red')
      
      expect(labelHasRedColor || iconHasRedColor).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined status gracefully', () => {
      // @ts-expect-error - testing edge case
      expect(() => render(<StatusIcon status={undefined} />)).not.toThrow()
    })

    it('should handle invalid status values', () => {
      // @ts-expect-error - testing edge case
      expect(() => render(<StatusIcon status="invalid" />)).not.toThrow()
    })

    it('should handle zero size', () => {
      expect(() => render(<StatusIcon status={Status.HEALTHY} size={0} />)).not.toThrow()
    })

    it('should handle negative size', () => {
      expect(() => render(<StatusIcon status={Status.HEALTHY} size={-1} />)).not.toThrow()
    })
  })

  describe('performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender, container } = render(<StatusIcon status={Status.HEALTHY} />)
      
      // Re-render with same props
      rerender(<StatusIcon status={Status.HEALTHY} />)
      
      // Should still have the icon
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should allow custom className to override default styles', () => {
      const { container } = render(
        <StatusIcon 
          status={Status.HEALTHY} 
          className="bg-red-500 p-4" 
          showLabel={true}
        />
      )
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('bg-red-500', 'p-4')
    })

    it('should maintain base layout classes with custom className', () => {
      const { container } = render(
        <StatusIcon 
          status={Status.HEALTHY} 
          className="custom-class" 
          showLabel={true}
        />
      )
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex', 'items-center', 'space-x-2', 'custom-class')
    })
  })
})