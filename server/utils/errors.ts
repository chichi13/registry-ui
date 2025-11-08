import type { H3Error } from 'h3'

export const ErrorCodes = {
  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Authentication
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  AUTH_ERROR: 'AUTH_ERROR',

  // Registry
  REGISTRY_UNAVAILABLE: 'REGISTRY_UNAVAILABLE',
  REGISTRY_AUTH_FAILED: 'REGISTRY_AUTH_FAILED',
  REGISTRY_TIMEOUT: 'REGISTRY_TIMEOUT',
  REGISTRY_INVALID_RESPONSE: 'REGISTRY_INVALID_RESPONSE',
  REGISTRY_DELETE_DISABLED: 'REGISTRY_DELETE_DISABLED',
  REGISTRY_ERROR: 'REGISTRY_ERROR',

  // Resources
  REPOSITORY_NOT_FOUND: 'REPOSITORY_NOT_FOUND',
  TAG_NOT_FOUND: 'TAG_NOT_FOUND',
  MANIFEST_NOT_FOUND: 'MANIFEST_NOT_FOUND',

  // Validation
  INVALID_REPOSITORY_NAME: 'INVALID_REPOSITORY_NAME',
  INVALID_TAG_NAME: 'INVALID_TAG_NAME',
  INVALID_DIGEST: 'INVALID_DIGEST',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export interface ParsedRegistryError {
  code?: string
  message?: string
  detail?: unknown
}

export interface RegistryErrorDetail {
  code: string
  message: string
  detail?: unknown
}

export interface RegistryErrorResponse {
  errors?: RegistryErrorDetail[]
}

export interface ResponseBodyWithMeta {
  repository?: string
  reference?: string
  tag?: string
  digest?: string
}

interface ErrorDetailsWithHint extends Record<string, unknown> {
  hint?: string
  registryError?: ParsedRegistryError
}

function isResponseBodyWithMeta(value: unknown): value is ResponseBodyWithMeta {
  return typeof value === 'object' && value !== null
}

function hasHintProperty(details: unknown): details is ErrorDetailsWithHint {
  return (
    typeof details === 'object' &&
    details !== null &&
    'hint' in details &&
    typeof (details as ErrorDetailsWithHint).hint === 'string'
  )
}

function mergeErrorDetails(
  responseBody: unknown,
  registryError: ParsedRegistryError | null,
  additionalDetails?: Record<string, unknown>
): Record<string, unknown> {
  const base: Record<string, unknown> = { registryError }

  if (isResponseBodyWithMeta(responseBody)) {
    if (responseBody.repository) base.repository = responseBody.repository
    if (responseBody.reference) base.reference = responseBody.reference
    if (responseBody.tag) base.tag = responseBody.tag
    if (responseBody.digest) base.digest = responseBody.digest
  }

  return { ...base, ...additionalDetails }
}

function extractResourceName(
  registryError: ParsedRegistryError | null,
  responseBody: unknown
): string {
  if (registryError?.code) {
    return registryError.code
  }

  if (isResponseBodyWithMeta(responseBody)) {
    return responseBody.repository || responseBody.reference || 'unknown'
  }

  return 'unknown'
}

export function parseRegistryErrorResponse(responseBody: unknown): ParsedRegistryError | null {
  if (
    !responseBody ||
    typeof responseBody !== 'object' ||
    !('errors' in responseBody) ||
    !Array.isArray(responseBody.errors) ||
    responseBody.errors.length === 0
  ) {
    return null
  }

  const registryError = responseBody.errors[0] as RegistryErrorDetail
  return {
    code: registryError.code,
    message: registryError.message,
    detail: registryError.detail,
  }
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode
  public readonly details?: unknown
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class RegistryError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCodes.REGISTRY_ERROR,
    details?: unknown
  ) {
    super(message, statusCode, code, details)
  }
}

export class AuthError extends AppError {
  constructor(
    message: string,
    statusCode: number = 401,
    code: ErrorCode = ErrorCodes.AUTH_ERROR,
    details?: unknown
  ) {
    super(message, statusCode, code, details)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCodes.VALIDATION_ERROR, details?: unknown) {
    super(message, 400, code, details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier ? `${resource} '${identifier}' not found` : `${resource} not found`
    super(message, 404, ErrorCodes.NOT_FOUND, { resource, identifier })
  }
}

export class MethodNotAllowedError extends AppError {
  constructor(message: string = 'Method not allowed', details?: unknown) {
    super(message, 405, ErrorCodes.METHOD_NOT_ALLOWED, details)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: unknown) {
    super(`${service} is temporarily unavailable`, 503, ErrorCodes.SERVICE_UNAVAILABLE, {
      service,
      ...details,
    })
  }
}

const statusCodeMessages: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

export function toAppError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error
  }

  // H3Error from Nuxt
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const h3Error = error as H3Error
    return new AppError(
      h3Error.message || statusCodeMessages[h3Error.statusCode] || 'Unknown error',
      h3Error.statusCode || 500,
      h3Error.data?.code || ErrorCodes.INTERNAL_ERROR,
      h3Error.data
    )
  }

  // Standard Error
  if (error instanceof Error) {
    return new AppError(error.message, 500, ErrorCodes.INTERNAL_ERROR, {
      originalError: error.name,
    })
  }

  // Unknown error type
  return new AppError('An unknown error occurred', 500, ErrorCodes.INTERNAL_ERROR, {
    error: String(error),
  })
}

export function mapRegistryError(
  statusCode: number,
  message?: string,
  responseBody?: unknown
): AppError {
  const defaultMessage = message || statusCodeMessages[statusCode] || 'Registry request failed'
  const registryError = parseRegistryErrorResponse(responseBody)

  switch (statusCode) {
    case 401:
      return new AuthError(
        registryError?.message || 'Registry authentication failed',
        401,
        ErrorCodes.REGISTRY_AUTH_FAILED,
        mergeErrorDetails(responseBody, registryError)
      )

    case 403:
      return new AuthError(
        registryError?.message || 'Access to registry resource forbidden',
        403,
        ErrorCodes.FORBIDDEN,
        mergeErrorDetails(responseBody, registryError)
      )

    case 404:
      return new NotFoundError(
        'Registry resource',
        extractResourceName(registryError, responseBody)
      )

    case 405:
      return new MethodNotAllowedError(
        registryError?.message ||
          'Delete operation not enabled on registry. Set REGISTRY_STORAGE_DELETE_ENABLED=true',
        mergeErrorDetails(responseBody, registryError, {
          hint: 'Contact registry administrator to enable deletion',
        })
      )

    case 408:
    case 504:
      return new RegistryError(
        registryError?.message || 'Registry request timed out',
        statusCode,
        ErrorCodes.REGISTRY_TIMEOUT,
        mergeErrorDetails(responseBody, registryError)
      )

    case 500:
    case 502:
    case 503:
      return new ServiceUnavailableError(
        'Docker Registry',
        mergeErrorDetails(responseBody, registryError, {
          statusCode,
          message: registryError?.message || defaultMessage,
        })
      )

    default:
      return new RegistryError(
        registryError?.message || defaultMessage,
        statusCode,
        ErrorCodes.REGISTRY_INVALID_RESPONSE,
        mergeErrorDetails(responseBody, registryError)
      )
  }
}

export function logError(error: AppError, context?: string): void {
  const logPrefix = context ? `[${context}]` : ''
  const errorInfo = {
    code: error.code,
    statusCode: error.statusCode,
    message: error.message,
    details: error.details,
  }

  // Critical security events
  if (error instanceof AuthError) {
    apiLogger.error(`${logPrefix} Authentication Error:`, errorInfo)
    return
  }

  // Service availability issues
  if (error instanceof ServiceUnavailableError) {
    apiLogger.error(`${logPrefix} Service Unavailable:`, errorInfo)
    return
  }

  // Method not allowed (registry configuration issues)
  if (error instanceof MethodNotAllowedError) {
    apiLogger.warn(`${logPrefix} Method Not Allowed:`, errorInfo)
    return
  }

  // Validation errors (user input issues)
  if (error instanceof ValidationError) {
    apiLogger.warn(`${logPrefix} Validation Error:`, errorInfo)
    return
  }

  // Not found errors (informational, not logged in production)
  if (error instanceof NotFoundError) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      apiLogger.info(`${logPrefix} Not Found:`, errorInfo)
    }
    return
  }

  // All other errors
  apiLogger.error(`${logPrefix} Error:`, errorInfo)

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    apiLogger.error('Stack trace:', error.stack)
  }
}

export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

export function getUserFriendlyMessage(error: AppError): string {
  // Security errors - generic message
  if (error instanceof AuthError) {
    return 'Authentication failed. Please check your credentials.'
  }

  // Service unavailable
  if (error instanceof ServiceUnavailableError) {
    return 'The service is temporarily unavailable. Please try again later.'
  }

  // Method not allowed - provide helpful guidance
  if (error instanceof MethodNotAllowedError) {
    if (hasHintProperty(error.details)) {
      return error.details.hint || error.message
    }
    return error.message
  }

  // Validation errors - can expose details safely
  if (error instanceof ValidationError) {
    return error.message
  }

  // Not found errors
  if (error instanceof NotFoundError) {
    return error.message
  }

  // Registry errors
  if (error instanceof RegistryError) {
    // Don't expose internal registry details in production
    if (process.env.NODE_ENV === 'production') {
      return 'An error occurred while communicating with the registry.'
    }
    return error.message
  }

  // Generic error for anything else
  return 'An unexpected error occurred. Please try again.'
}
