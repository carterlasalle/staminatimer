import { VALIDATION_CONSTANTS } from '@/lib/constants'

const { MAX_INPUT_LENGTH, MAX_WORDS, HIGH_ENTROPY_THRESHOLD } = VALIDATION_CONSTANTS

export interface SanitizationResult {
  sanitized: string
  flagged: boolean
  reason?: string
}

/**
 * Normalize unicode to catch encoded attacks
 */
function normalizeUnicode(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
}

/**
 * Calculate Shannon entropy of a string
 * Higher entropy may indicate obfuscated content
 */
function calculateEntropy(str: string): number {
  if (str.length === 0) return 0

  const freq: Record<string, number> = {}
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1
  }

  return Object.values(freq).reduce((entropy, count) => {
    const p = count / str.length
    return entropy - p * Math.log2(p)
  }, 0)
}

/**
 * Comprehensive injection patterns (case-insensitive, unicode-aware)
 */
const INJECTION_PATTERNS: RegExp[] = [
  // Role manipulation
  /(?:you\s*are|act\s*as|pretend|roleplay|behave\s*like|imagine\s*you'?re?)/i,
  // Instruction override
  /(?:ignore|disregard|forget|override|bypass|skip)\s*(?:all|any|previous|above|prior|system)/i,
  // System prompt extraction
  /(?:show|reveal|print|display|output|repeat)\s*(?:system|initial|original)\s*(?:prompt|instruction)/i,
  // Jailbreak attempts
  /(?:jailbreak|DAN|developer\s*mode|unrestricted\s*mode)/i,
  // Delimiter attacks
  /(?:```|<\/?system>|\[\[|\]\]|{{|}})/,
  // Base64/encoding attempts
  /(?:base64|atob|btoa|decode|encode)\s*[:(]/i,
  // New instruction injection
  /(?:new\s*instructions?:|system\s*prompt)/gi,
  // Persona switching
  /(?:you\s*are\s*now|from\s*now\s*on)/i,
]

/**
 * More comprehensive sanitization for AI input
 */
export function sanitizeAIInput(input: string): SanitizationResult {
  if (!input || typeof input !== 'string') {
    return { sanitized: '', flagged: false }
  }

  let processed = normalizeUnicode(input.trim())

  // Length validation
  if (processed.length > MAX_INPUT_LENGTH) {
    processed = processed.slice(0, MAX_INPUT_LENGTH)
  }

  // Word count validation
  const wordCount = processed.split(/\s+/).filter(Boolean).length
  if (wordCount > MAX_WORDS) {
    return {
      sanitized: '',
      flagged: true,
      reason: 'Input exceeds maximum word count',
    }
  }

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(processed)) {
      return {
        sanitized: '',
        flagged: true,
        reason: 'Potentially malicious input detected',
      }
    }
  }

  // Check for high entropy (potential obfuscation)
  const entropy = calculateEntropy(processed)
  if (entropy > HIGH_ENTROPY_THRESHOLD && processed.length > 50) {
    return {
      sanitized: '',
      flagged: true,
      reason: 'Input appears to be obfuscated',
    }
  }

  // Replace dangerous patterns with safe alternatives
  processed = processed
    .replace(/```/g, "'''") // Prevent code block manipulation
    .replace(/#+\s/g, '') // Remove markdown headers
    .replace(/<\/?[a-z][^>]*>/gi, '') // Remove HTML-like tags

  return { sanitized: processed, flagged: false }
}

/**
 * Validate and sanitize user input for the AI coach
 * Returns sanitized input or throws if input is malicious
 */
export function validateAIInput(input: string): string {
  const result = sanitizeAIInput(input)

  if (result.flagged) {
    throw new Error(result.reason || 'Invalid input')
  }

  return result.sanitized
}
