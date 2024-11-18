export interface ValidationRules {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
}

export class Validator {
  static validate(data: Record<string, unknown>, rules: Record<string, ValidationRules>): boolean {
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field]

      if (rule.required && (value === undefined || value === null || value === '')) {
        throw new Error(`${field} is required`)
      }

      if (value !== undefined && value !== null) {
        // Convert value to number if it's a numeric string
        const numericValue = typeof value === 'string' ? parseFloat(value) : value
        
        // Check if value is actually a number before comparing
        if (typeof numericValue === 'number' && !isNaN(numericValue)) {
          if (rule.min !== undefined && numericValue < rule.min) {
            throw new Error(`${field} must be at least ${rule.min}`)
          }

          if (rule.max !== undefined && numericValue > rule.max) {
            throw new Error(`${field} must be at most ${rule.max}`)
          }
        } else if (rule.min !== undefined || rule.max !== undefined) {
          throw new Error(`${field} must be a number for min/max validation`)
        }

        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
          throw new Error(`${field} has invalid format`)
        }
      }
    }

    return true
  }

  static isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value)
  }
} 