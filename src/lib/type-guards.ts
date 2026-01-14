import type { DBSession } from './types'

/**
 * Type guard for DBSession
 */
export function isDBSession(value: unknown): value is DBSession {
  if (!value || typeof value !== 'object') return false

  const session = value as Record<string, unknown>

  return (
    typeof session.id === 'string' &&
    typeof session.start_time === 'string' &&
    typeof session.total_duration === 'number' &&
    typeof session.active_duration === 'number' &&
    typeof session.edge_duration === 'number' &&
    typeof session.finished_during_edge === 'boolean' &&
    typeof session.created_at === 'string'
  )
}

/**
 * Type guard for EdgeEvent
 */
export function isValidEdgeEvent(value: unknown): value is {
  id: string
  start_time: string
  end_time: string | null
  duration: number | null
} {
  if (!value || typeof value !== 'object') return false

  const event = value as Record<string, unknown>

  return (
    typeof event.id === 'string' &&
    typeof event.start_time === 'string' &&
    (event.end_time === null || typeof event.end_time === 'string') &&
    (event.duration === null || typeof event.duration === 'number')
  )
}

/**
 * Type guard for arrays of DBSession
 */
export function isDBSessionArray(value: unknown): value is DBSession[] {
  if (!Array.isArray(value)) return false
  return value.every(isDBSession)
}

/**
 * Type guard for non-null values
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard for string values
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Type guard for number values
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Type guard for valid UUID strings
 */
export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Type guard for valid ISO date strings
 */
export function isISODateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return !isNaN(date.getTime()) && value.includes('T')
}
