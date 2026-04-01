import React from 'react'
import { render, screen } from '@testing-library/react'
import { AlertTriangle } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import StatCard from '@/app/dashboard/components/stat-card'

describe('StatCard component', () => {
  it('renders title, value, description, and icon', () => {
    const { container } = render(
      <StatCard
        title="Open Requests"
        value={12}
        description="Across active disasters"
        icon={AlertTriangle}
      />
    )

    expect(screen.getByText('Open Requests')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Across active disasters')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
