// Timer Constants
export const TIMER_CONSTANTS = {
  TICK_INTERVAL_MS: 1000,
  MIN_SESSION_DURATION_MS: 30000, // 30 seconds
  CONFIRMATION_THRESHOLD_MS: 30000,
} as const

// Gamification Constants
export const GAMIFICATION_CONSTANTS = {
  XP_PER_LEVEL: 100,
  STREAK_GRACE_PERIOD_HOURS: 24,
  MAX_STREAK_DISPLAY: 999,
} as const

// API Constants
export const API_CONSTANTS = {
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 60,
  AUTH_RATE_LIMIT_MAX: 10,
  AI_RATE_LIMIT_MAX: 10,
  MAX_SESSIONS_PER_FETCH: 20,
  MAX_SHARE_SESSIONS: 100,
} as const

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION_MS: 5000,
  ANIMATION_DURATION_MS: 300,
  DEBOUNCE_DELAY_MS: 300,
  VIRTUAL_LIST_OVERSCAN: 5,
  LEVEL_UP_ANIMATION_DURATION_MS: 3000,
} as const

// Validation Constants
export const VALIDATION_CONSTANTS = {
  MAX_INPUT_LENGTH: 1000,
  MAX_WORDS: 200,
  MAX_GOAL_DAYS: 365,
  MIN_GOAL_DAYS: 1,
  MAX_AI_PROMPT_LENGTH: 10000,
  HIGH_ENTROPY_THRESHOLD: 5.5,
} as const

// Share Duration Map (in milliseconds)
export const SHARE_DURATION_MAP = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'infinite': null,
} as const

// Daily Goal Constraints
export const DAILY_GOAL_CONSTANTS = {
  MIN_MINUTES: 5,
  INCREMENT_MINUTES: 5,
} as const
