/**
 * Event Handler Utilities
 *
 * Standardized patterns for H3 event handlers with validation, error handling, and user context.
 */

import type { H3Event } from 'h3'
import { getQuery, getRouterParams } from 'h3'
import type { ZodSchema } from 'zod'

/**
 * Options for event handler wrapper
 */
interface HandlerOptions {
  /**
   * Require authentication (X-Forwarded-User header)
   */
  requireAuth?: boolean

  /**
   * Log user actions (if ENABLE_USER_LOGGING is true)
   */
  logActions?: boolean

  /**
   * Action name for logging
   */
  actionName?: string
}

/**
 * Wrap an event handler with standardized error handling and response formatting
 */
export function defineApiHandler<T = unknown>(
  handler: (event: H3Event, userContext: UserContext) => Promise<T>,
  options: HandlerOptions = {}
): (event: H3Event) => Promise<ApiResponse<T>> {
  return async (event: H3Event): Promise<ApiResponse<T>> => {
    let userContext: UserContext | undefined

    try {
      // Extract user context
      userContext = getUserContext(event)

      // Check authentication if required
      if (options.requireAuth && !userContext.isAuthenticated) {
        throw new ValidationError('Authentication required', 'UNAUTHORIZED', {
          hint: 'Configure reverse proxy with X-Forwarded-User header',
        })
      }

      // Execute handler
      const result = await handler(event, userContext)

      // Log user action if enabled
      if (options.logActions && options.actionName && userContext) {
        logUserAction(userContext, options.actionName, event.path, {
          method: event.method,
          success: true,
        })
      }

      return successResponse(result)
    } catch (error) {
      // Convert to AppError
      const appError = toAppError(error)

      // Log error
      logError(appError, options.actionName || 'API Handler')

      // Log failed user action
      if (options.logActions && options.actionName && userContext) {
        logUserAction(userContext, options.actionName, event.path, {
          method: event.method,
          success: false,
          error: appError.code,
        })
      }

      // Return error response
      return errorResponse(
        appError.code,
        getUserFriendlyMessage(appError),
        appError.statusCode,
        appError.details
      )
    }
  }
}

/**
 * Validate request parameters with Zod schema
 * Throws ValidationError if validation fails
 */
export function validateParams<T>(schema: ZodSchema<T>, params: unknown, context?: string): T {
  const result = schema.safeParse(params)

  if (!result.success) {
    const errorMessages = result.error.issues
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ')

    throw new ValidationError(
      `Invalid ${context || 'parameters'}: ${errorMessages}`,
      'VALIDATION_ERROR',
      {
        errors: result.error.issues,
      }
    )
  }

  return result.data
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T>(event: H3Event, schema: ZodSchema<T>): T {
  const query = getQuery(event)
  return validateParams(schema, query, 'query parameters')
}

/**
 * Get validated route parameter by name
 */
export function getRouteParam(event: H3Event, name: string): string {
  const params = getRouterParams(event)
  const value = params[name]

  if (!value) {
    throw new ValidationError(`Missing required route parameter: ${name}`, 'VALIDATION_ERROR', {
      parameter: name,
    })
  }

  return value
}

export function useRegistryClient() {
  return getRegistryClient()
}

/**
 * Helper to extract and validate repository name from route
 */
export function getRepositoryName(event: H3Event): string {
  const name = getRouteParam(event, 'name')

  // Decode URL-encoded repository name (handles %2F for slashes)
  const repositoryName = decodeURIComponent(name)

  // Validate repository name format
  const result = repositoryNameSchema.safeParse(repositoryName)

  if (!result.success) {
    throw new ValidationError(
      `Invalid repository name format: ${repositoryName}`,
      'INVALID_REPOSITORY_NAME',
      {
        name: repositoryName,
        errors: result.error.issues,
      }
    )
  }

  return result.data
}

/**
 * Helper to extract and validate digest from route
 */
export function getDigest(event: H3Event): string {
  const digest = getRouteParam(event, 'digest')

  // Validate digest format
  const result = digestSchema.safeParse(digest)

  if (!result.success) {
    throw new ValidationError(`Invalid digest format: ${digest}`, 'INVALID_DIGEST', {
      digest,
      errors: result.error.issues,
    })
  }

  return result.data
}
