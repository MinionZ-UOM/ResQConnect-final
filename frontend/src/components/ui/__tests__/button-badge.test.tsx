import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

describe('Button component', () => {
  it('renders a native button and triggers click handler', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={onClick}>Submit</Button>)

    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).toHaveClass('inline-flex')

    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders anchor when using asChild', () => {
    render(
      <Button asChild>
        <a href="/help">Help</a>
      </Button>
    )

    const link = screen.getByRole('link', { name: 'Help' })
    expect(link).toHaveAttribute('href', '/help')
    expect(link).toHaveClass('inline-flex')
  })
})

describe('Badge component', () => {
  it('applies variant and custom classes', () => {
    render(
      <Badge variant="destructive" className="custom-badge">
        Error
      </Badge>
    )

    const badge = screen.getByText('Error')
    expect(badge).toHaveClass('custom-badge')
    expect(badge.className).toContain('bg-destructive')
  })
})
