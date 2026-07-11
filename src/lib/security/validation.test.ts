import { describe, expect, it } from 'vitest'

import { Validator } from './validation'

describe('Validator', () => {
  it('accepts valid values', () => {
    expect(() =>
      Validator.validate(
        { duration: 30, label: 'training' },
        {
          duration: { required: true, min: 1, max: 60 },
          label: { required: true, pattern: /^[a-z]+$/ },
        }
      )
    ).not.toThrow()
  })

  it('reports all invalid fields together', () => {
    expect(() =>
      Validator.validate(
        { duration: 0, label: 'bad value' },
        {
          duration: { min: 1 },
          label: { pattern: /^[a-z]+$/ },
          userId: { required: true },
        }
      )
    ).toThrow('duration must be at least 1, label has an invalid format, userId is required')
  })
})
