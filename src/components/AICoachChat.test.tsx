// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AICoachChat } from './AICoachChat'

const sendMessage = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useAICoach', () => ({
  useAICoach: () => ({
    messages: [],
    isLoading: false,
    sendMessage,
    clearChat: vi.fn(),
    generateInitialInsights: vi.fn(),
  }),
}))

afterEach(() => {
  cleanup()
})

describe('AICoachChat', () => {
  it('waits for IME composition to finish before submitting with Enter', () => {
    render(<AICoachChat />)
    const input = screen.getByLabelText('Ask about your training')

    fireEvent.change(input, { target: { value: 'How am I progressing?' } })

    expect(fireEvent.keyDown(input, { key: 'Enter', isComposing: true })).toBe(true)
    expect(sendMessage).not.toHaveBeenCalled()

    expect(fireEvent.keyDown(input, { key: 'Enter', isComposing: false })).toBe(false)
    expect(sendMessage).toHaveBeenCalledWith('How am I progressing?')
  })
})
