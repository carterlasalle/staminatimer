export interface ValidationRules {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
}

export class Validator {
  static validate(data: any, rules: Record<string, ValidationRules>): boolean {
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field]

      if (rule.required && (value === undefined || value === null || value === '')) {
        throw new Error(`${field} is required`)
      }

      if (value !== undefined && value !== null) {
        if (rule.min !== undefined && value < rule.min) {
          throw new Error(`${field} must be at least ${rule.min}`)
        }

        if (rule.max !== undefined && value > rule.max) {
          throw new Error(`${field} must be at most ${rule.max}`)
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          throw new Error(`${field} has invalid format`)
        }
      }
    }

    return true
  }
} 