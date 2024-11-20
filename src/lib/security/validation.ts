export interface ValidationRules {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
}

export class Validator {
  static validate(data: any, rules: ValidationRules) {
    const errors: string[] = []

    for (const [field, rule] of Object.entries(rules)) {
      if (rule.required && !data[field]) {
        errors.push(`${field} is required`)
      }

      if (rule.min !== undefined && data[field] < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`)
      }

      if (rule.max !== undefined && data[field] > rule.max) {
        errors.push(`${field} must be at most ${rule.max}`)
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }
  }

  static isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value)
  }
} 