import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { normalizeApiError } from '@/lib/normalize-api-error'
import { mapChatbotResponse } from '@/lib/utils/mapChatbotResponse'

describe('mapChatbotResponse', () => {
  it('trims string payload responses', () => {
    const result = mapChatbotResponse('  hello world  ')

    expect(result.text).toBe('hello world')
    expect(result.structured).toBeNull()
  })

  it('selects first non-empty structured field based on preference order', () => {
    const result = mapChatbotResponse({
      message: '   ',
      reply: '',
      response: ' Answer from response ',
      text: 'fallback',
    })

    expect(result.text).toBe('Answer from response')
    expect(result.structured).not.toBeNull()
  })

  it('returns empty normalized payload for invalid response shape', () => {
    const result = mapChatbotResponse(42 as any)

    expect(result).toEqual({ text: '', raw: 42, structured: null })
  })
})

describe('normalizeApiError', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  it('normalizes axios-like errors from response detail/message', () => {
    const axiosLikeError = {
      isAxiosError: true,
      message: 'Request failed',
      response: {
        status: 500,
        data: { detail: 'Internal API failure' },
      },
    }

    const result = normalizeApiError(axiosLikeError)

    expect(result.message).toBe('Internal API failure')
    expect(result.status).toBe(500)
    expect(result.data).toEqual({ detail: 'Internal API failure' })
    expect(errorSpy).toHaveBeenCalled()
  })

  it('normalizes native Error instances', () => {
    const result = normalizeApiError(new Error('Boom'))

    expect(result).toEqual({ message: 'Boom' })
    expect(errorSpy).toHaveBeenCalled()
  })

  it('returns default message for nullish input', () => {
    const result = normalizeApiError(null)

    expect(result.message).toBe('Something went wrong. Please try again.')
    expect(errorSpy).toHaveBeenCalled()
  })
})
