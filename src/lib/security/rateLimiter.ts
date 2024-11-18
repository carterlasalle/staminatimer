export class RateLimiter {
  private attempts = new Map<string, number[]>()
  private readonly limit: number
  private readonly window: number

  constructor(limit = 5, windowMs = 60000) {
    this.limit = limit
    this.window = windowMs
  }

  check(key: string): boolean {
    const now = Date.now()
    const timestamps = this.attempts.get(key) ?? []
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(t => now - t < this.window)
    
    if (validTimestamps.length >= this.limit) {
      return false
    }

    validTimestamps.push(now)
    this.attempts.set(key, validTimestamps)
    return true
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
} 