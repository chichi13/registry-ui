/**
 * Utility functions for validating environment variables and API data
 * using Zod schemas.
 *
 * This module defines Zod schemas for environment variables, Docker
 * repository names, tag names, and manifest digests. It also provides
 * helper functions to validate and parse these inputs, throwing
 * detailed validation errors when necessary.
 */

import { z } from 'zod'
import { envLogger } from './logger'

// ============================================
// Environment Variables Validation
// ============================================

/**
 * Schema for validating environment variables on server startup
 *
 * SECURITY IMPLICATIONS:
 * - HOST: Must be 127.0.0.1 in production (prevent direct internet access)
 * - REGISTRY_PASSWORD: Never log or expose in responses
 */
export const envSchema = z.object({
  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging Configuration
  // LOG_LEVEL: Server-side log level (0=silent, 1=error, 2=warn, 3=info, 4=debug, 5=trace)
  LOG_LEVEL: z
    .string()
    .regex(/^[0-5]$/, 'LOG_LEVEL must be a number between 0 and 5')
    .optional()
    .transform(val => (val ? Number(val) : undefined)),

  // NUXT_PUBLIC_LOG_LEVEL: Client-side log level (same scale as LOG_LEVEL)
  NUXT_PUBLIC_LOG_LEVEL: z
    .string()
    .regex(/^[0-5]$/, 'NUXT_PUBLIC_LOG_LEVEL must be a number between 0 and 5')
    .optional()
    .transform(val => (val ? Number(val) : undefined)),

  HOST: z.string().default('127.0.0.1'),

  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a number')
    .default('3000')
    .transform(Number)
    .refine(val => val > 0 && val < 65536, 'PORT must be between 1 and 65535'),

  // Docker Registry Configuration
  REGISTRY_URL: z
    .string()
    .url('REGISTRY_URL must be a valid URL')
    .refine(
      url => url.startsWith('http://') || url.startsWith('https://'),
      'REGISTRY_URL must start with http:// or https://'
    )
    .default('http://localhost:5000'), // Default for development

  // Public-facing Docker Registry URL for pull commands (without protocol)
  // Example: registry.example.com or registry.example.com:5000
  // Safe: Input is validated and limited to domain/hostname format, preventing catastrophic backtracking
  REGISTRY_PUBLIC_URL: z
    .string()
    .regex(
      /^[a-z0-9]+([-.][a-z0-9]+)*(\.[a-z]{2,})?(:[0-9]{1,5})?$/,
      'Invalid registry public URL format (e.g., registry.example.com or registry.example.com:5000)'
    )
    .optional(),

  REGISTRY_USERNAME: z.string().default(''),

  REGISTRY_PASSWORD: z.string().default(''),

  REGISTRY_AUTH_METHOD: z.enum(['basic', 'bearer', 'none']).optional(),

  REGISTRY_TOKEN_CACHE_TTL: z
    .string()
    .regex(/^\d+$/, 'REGISTRY_TOKEN_CACHE_TTL must be a number')
    .default('300')
    .transform(Number)
    .refine(
      val => val >= 60 && val <= 3600,
      'REGISTRY_TOKEN_CACHE_TTL must be between 60 and 3600 seconds'
    ),

  REGISTRY_REQUEST_TIMEOUT: z
    .string()
    .regex(/^\d+$/, 'REGISTRY_REQUEST_TIMEOUT must be a number')
    .default('10000')
    .transform(Number)
    .refine(
      val => val >= 1000 && val <= 60000,
      'REGISTRY_REQUEST_TIMEOUT must be between 1000 and 60000 milliseconds'
    ),

  REGISTRY_MAX_RETRIES: z
    .string()
    .regex(/^\d+$/, 'REGISTRY_MAX_RETRIES must be a number')
    .default('3')
    .transform(Number)
    .refine(val => val >= 0 && val <= 5, 'REGISTRY_MAX_RETRIES must be between 0 and 5'),

  // Optional Features
  ENABLE_USER_LOGGING: z
    .string()
    .default('false')
    .transform(val => val === 'true'),
})

export type Env = Omit<z.infer<typeof envSchema>, 'REGISTRY_AUTH_METHOD'> & {
  REGISTRY_AUTH_METHOD: 'basic' | 'bearer' | 'none'
}

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    envLogger.error('Environment validation failed:')
    envLogger.error(result.error.format())
    throw new Error('Invalid environment configuration')
  }

  const data = result.data

  if (!data.REGISTRY_AUTH_METHOD) {
    const hasCredentials = Boolean(data.REGISTRY_USERNAME && data.REGISTRY_PASSWORD)
    data.REGISTRY_AUTH_METHOD = hasCredentials ? 'basic' : 'none'
  }

  return data as Env
}

// ============================================
// Docker Registry Data Validation
// ============================================

/**
 * Validates Docker repository names
 * Format: lowercase alphanumeric with dashes, underscores, dots, and slashes
 * Examples: my-app, my-app/backend, registry.io/my-app
 */
// Safe: Input is validated and limited to 255 chars, preventing catastrophic backtracking
export const repositoryNameSchema = z
  .string()
  .min(1, 'Repository name cannot be empty')
  .max(255, 'Repository name is too long')
  .regex(
    /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*$/,
    'Invalid repository name format (must be lowercase alphanumeric with optional dashes, dots, underscores, and slashes)'
  )

/**
 * Validates Docker tag names
 * Format: alphanumeric with dashes, underscores, dots (cannot start with . or -)
 * Examples: latest, v1.0.0, stable-2024
 */
export const tagNameSchema = z
  .string()
  .min(1, 'Tag name cannot be empty')
  .max(128, 'Tag name is too long')
  .regex(
    /^[a-zA-Z0-9_][a-zA-Z0-9._-]*$/,
    'Invalid tag name format (must start with alphanumeric or underscore, followed by alphanumeric, dots, dashes, or underscores)'
  )

/**
 * Validates Docker manifest digest
 * Format: sha256:followed by 64 hex characters
 * Example: sha256:abc123def456...
 */
export const digestSchema = z
  .string()
  .regex(
    /^sha256:[a-f0-9]{64}$/,
    'Invalid digest format (must be sha256:followed by 64 hex characters)'
  )

/**
 * Schema for validating delete manifest requests
 */
export const deleteManifestSchema = z.object({
  name: repositoryNameSchema,
  digest: digestSchema,
})

export type DeleteManifestParams = z.infer<typeof deleteManifestSchema>

/**
 * Schema for validating repository list requests
 */
export const listRepositoriesSchema = z.object({
  n: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine(val => val > 0 && val <= 1000)
    .optional(),
  last: repositoryNameSchema.optional(),
})

export type ListRepositoriesParams = z.infer<typeof listRepositoriesSchema>

/**
 * Schema for validating tag list requests
 */
export const listTagsSchema = z.object({
  name: repositoryNameSchema,
  n: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine(val => val > 0 && val <= 1000)
    .optional(),
  last: tagNameSchema.optional(),
})

export type ListTagsParams = z.infer<typeof listTagsSchema>

// ============================================
// API Response Validation
// ============================================

/**
 * Generic API response wrapper
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .optional(),
  })

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * Helper to create success response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  }
}

/**
 * Helper to create error response
 * @param code Error code
 * @param message Error message
 * @param statusCode HTTP status code (not included in response body, for reference only)
 * @param details Additional error details
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode?: number,
  details?: unknown
): ApiResponse<never> {
  // Note: statusCode parameter exists for API compatibility but is not used in response body
  // HTTP status should be set via setResponseStatus() in the event handler
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  }
}
