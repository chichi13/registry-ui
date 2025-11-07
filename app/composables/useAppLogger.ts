/**
 * Client-side logging composable using Consola
 *
 * This composable provides a consistent logging API for the frontend,
 * with support for tags, log levels, and production optimization.
 *
 * Usage:
 *   const logger = useAppLogger('component:name')
 *   logger.info('Message')
 *   logger.warn('Warning')
 *   logger.error('Error')
 *
 * Log levels (default: 4 in dev, 1 in prod):
 *   0=silent, 1=error, 2=warn, 3=info, 4=debug, 5=trace
 */

import { createConsola } from 'consola/browser'
import type { ConsolaInstance } from 'consola'

let logger: ConsolaInstance | null = null

/**
 * Get or create a logger instance for client-side logging
 * @param tag - Optional context tag (e.g., 'pages:index', 'store:registry')
 * @returns Consola logger instance
 */
export function useAppLogger(tag?: string): ConsolaInstance {
  if (!logger) {
    const logLevel = import.meta.env.NUXT_PUBLIC_LOG_LEVEL
      ? parseInt(import.meta.env.NUXT_PUBLIC_LOG_LEVEL as string)
      : import.meta.env.PROD
        ? 1
        : 4

    logger = createConsola({
      level: logLevel,
      formatOptions: {
        date: true,
        colors: true,
      },
    })
  }

  return tag ? logger.withTag(tag) : logger
}
