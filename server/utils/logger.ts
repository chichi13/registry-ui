/**
 * Server-side logging utility using Consola
 *
 * This module provides typed logger instances for different server contexts.
 * Each logger is tagged for easy identification in logs.
 *
 * Based on Consola (used by Nuxt/Nitro internally)
 * Levels: 0=silent, 1=error, 2=warn, 3=info, 4=debug, 5=trace
 */

import { consola } from 'consola'

// Configure global log level from environment variable
// LOG_LEVEL for backend, NUXT_PUBLIC_LOG_LEVEL for frontend
const logLevel = process.env.LOG_LEVEL
  ? parseInt(process.env.LOG_LEVEL)
  : process.env.NODE_ENV === 'production'
    ? 1
    : 4

consola.level = logLevel

/**
 * Create a tagged logger instance for server-side logging
 * @param tag - Context tag for the logger (e.g., 'registry', 'auth')
 */
export function createServerLogger(tag: string) {
  return consola.withTag(tag)
}

// Pre-configured logger instances for common contexts
export const registryLogger = createServerLogger('registry')
export const envLogger = createServerLogger('env')
export const authLogger = createServerLogger('auth')
export const apiLogger = createServerLogger('api')
