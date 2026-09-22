import { describe, expect, it, vi } from 'vitest'
import { supabase } from './client'

describe('SSR no-op Supabase client', () => {
  it('emits an anonymous initial session and keeps unsubscribe available', () => {
    const listener = vi.fn()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(listener)

    expect(listener).toHaveBeenCalledWith('INITIAL_SESSION', null)
    expect(() => subscription.unsubscribe()).not.toThrow()
  })
})
