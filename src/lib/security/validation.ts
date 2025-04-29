export type ValidationRules = {
  [key: string]: {
    required?: boolean
    min?: number
    max?: number
    pattern?: RegExp
  }
}

export class Validator {
  static validate(data: Record<string, unknown>, rules: ValidationRules): void {
    const errors: string[] = []

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`)
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rule.min !== undefined) {
          if (typeof value !== 'number') {
            errors.push(`${field} must be a number to check min value`);
          } else if (value < rule.min) {
            errors.push(`${field} must be at least ${rule.min}`)
          }
        }

        if (rule.max !== undefined) {
          if (typeof value !== 'number') {
             errors.push(`${field} must be a number to check max value`);
          } else if (value > rule.max) {
            errors.push(`${field} must be at most ${rule.max}`)
          }
        }

        if (rule.pattern) {
          if (typeof value !== 'string') {
            errors.push(`${field} must be a string to check pattern`);
          } else if (!rule.pattern.test(value)) {
            errors.push(`${field} has an invalid format`)
          }
        }
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