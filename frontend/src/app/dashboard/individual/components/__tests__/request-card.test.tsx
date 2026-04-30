import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import RequestCard, { type TrackableRequest } from '@/app/dashboard/individual/components/request-card'

const baseRequest: TrackableRequest = {
  id: 'req-100',
  title: 'Family needs evacuation',
  disasterId: 'd1',
  description: 'Water level is rising quickly around the house.',
  priority: 'High',
  status: 'Pending',
  location: {
    lat: 6.91234,
    lng: 79.85678,
  },
}

describe('RequestCard component', () => {
  it('renders key fields and calls onDelete with request id', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(<RequestCard request={baseRequest} onDelete={onDelete} />)

    expect(screen.getByRole('group')).toBeInTheDocument()
    expect(screen.getByText('Family needs evacuation')).toBeInTheDocument()
    expect(screen.getByText('(6.9123, 79.8568)')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('req-100')
  })

  it('shows deleting state and disables delete action', () => {
    const onDelete = vi.fn()
    const requestWithAddress: TrackableRequest = {
      ...baseRequest,
      location: {
        address: 'Main Street, Colombo',
      },
    }

    render(<RequestCard request={requestWithAddress} onDelete={onDelete} isDeleting />)

    const button = screen.getByRole('button', { name: 'Deleting...' })
    expect(button).toBeDisabled()
    expect(screen.getByText('Main Street, Colombo')).toBeInTheDocument()
  })
})
