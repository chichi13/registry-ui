/**
 * Authentication Context Helper
 *
 * Extracts user context from reverse proxy headers for audit logging and user tracking.
 * Never exposes sensitive proxy headers to the frontend.
 *
 * Security:
 * - Application has NO built-in authentication
 * - Relies on external reverse proxy (Nginx, Caddy, Traefik) with Basic Auth/OAuth
 * - Only reads username from X-Forwarded-User header
 * - Optional user logging controlled by ENABLE_USER_LOGGING env variable
 */

import type { H3Event } from 'h3'

const logger = authLogger

/**
 * User context extracted from request
 */
export interface UserContext {
  /**
   * Username from X-Forwarded-User header
   * Empty string if not authenticated or header not present
   */
  username: string

  /**
   * Whether user is authenticated (has username)
   */
  isAuthenticated: boolean

  /**
   * Timestamp when context was created
   */
  timestamp: Date

  /**
   * Request IP address (for audit logging)
   */
  ipAddress: string | undefined
}

/**
 * Extract user context from H3Event (Nitro request)
 */
export function getUserContext(event: H3Event): UserContext {
  // Extract username from X-Forwarded-User header (set by reverse proxy)
  const username = getRequestHeader(event, 'x-forwarded-user') || ''

  // Extract IP address for audit logging
  const ipAddress =
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0].trim() ||
    getRequestHeader(event, 'x-real-ip') ||
    event.node.req.socket.remoteAddress

  return {
    username: username.trim(),
    isAuthenticated: username.trim().length > 0,
    timestamp: new Date(),
    ipAddress,
  }
}

/**
 * Get username from user context
 * Returns 'anonymous' if not authenticated
 */
export function getUsername(context: UserContext): string {
  return context.username || 'anonymous'
}

/**
 * Log user action (if enabled via ENABLE_USER_LOGGING)
 */
export function logUserAction(
  context: UserContext,
  action: string,
  resource?: string,
  details?: Record<string, unknown>
): void {
  const env = validateEnv()

  // User logging disabled
  if (!env.ENABLE_USER_LOGGING) {
    return
  }

  const logEntry = {
    timestamp: context.timestamp.toISOString(),
    user: getUsername(context),
    ipAddress: context.ipAddress,
    action,
    resource,
    ...details,
  }

  logger.info(`[User Action]`, logEntry)
}

/**
 * Log authentication event (always logged regardless of ENABLE_USER_LOGGING)
 */
export function logAuthEvent(
  context: UserContext,
  event: 'login' | 'logout' | 'unauthorized',
  details?: Record<string, unknown>
): void {
  const logEntry = {
    timestamp: context.timestamp.toISOString(),
    user: getUsername(context),
    ipAddress: context.ipAddress,
    event,
    ...details,
  }

  if (event === 'unauthorized') {
    logger.warn(`[Auth Event]`, logEntry)
  } else {
    logger.info(`[Auth Event]`, logEntry)
  }
}
