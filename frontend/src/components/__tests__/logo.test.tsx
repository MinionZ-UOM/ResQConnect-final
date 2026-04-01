import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Logo from '@/components/logo'

describe('Logo component', () => {
  it('renders an accessible decorative svg with default and custom classes', () => {
    const { container } = render(<Logo data-testid="app-logo" className="text-blue-500" />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveClass('h-6', 'w-6', 'text-blue-500')
    expect(screen.getByTestId('app-logo')).toBeInTheDocument()
  })
})
