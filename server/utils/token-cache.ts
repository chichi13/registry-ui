interface CachedToken {
  token: string
  expiresAt: number // Unix timestamp in milliseconds
  issuedAt: number // Unix timestamp in milliseconds
}

interface TokenCacheOptions {
  /**
   * Time-to-live for cached tokens in seconds
   * Default: 300 seconds (5 minutes)
   */
  ttl?: number

  /**
   * Refresh buffer in seconds before expiration
   * Default: 30 seconds
   */
  refreshBuffer?: number
}

export class TokenCache {
  private cache: Map<string, CachedToken> = new Map()
  private readonly ttl: number
  private readonly refreshBuffer: number

  constructor(options: TokenCacheOptions = {}) {
    this.ttl = (options.ttl || 300) * 1000 // Convert to milliseconds
    this.refreshBuffer = (options.refreshBuffer || 30) * 1000 // Convert to milliseconds
  }

  get(key: string): string | null {
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    const now = Date.now()

    // Token expired - remove and return null
    if (now >= cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached.token
  }

  set(key: string, token: string): void {
    const now = Date.now()
    const expiresAt = now + this.ttl

    this.cache.set(key, {
      token,
      expiresAt,
      issuedAt: now,
    })
  }

  shouldRefresh(key: string): boolean {
    const cached = this.cache.get(key)

    if (!cached) {
      return true // No token - needs refresh
    }

    const now = Date.now()

    // Already expired
    if (now >= cached.expiresAt) {
      return true
    }

    // Within refresh buffer before expiration
    return now >= cached.expiresAt - this.refreshBuffer
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): number {
    const now = Date.now()
    let removed = 0

    this.cache.forEach((cached, key) => {
      if (now >= cached.expiresAt) {
        this.cache.delete(key)
        removed++
      }
    })

    return removed
  }
}

export function createCacheKey(registryUrl: string, scope?: string): string {
  const normalized = registryUrl.replace(/\/$/, '') // Remove trailing slash
  return scope ? `${normalized}:${scope}` : normalized
}

let globalTokenCache: TokenCache | null = null

export function getTokenCache(options?: TokenCacheOptions): TokenCache {
  if (!globalTokenCache) {
    // Get TTL from environment or use default
    const env = validateEnv()
    const ttl = options?.ttl || env.REGISTRY_TOKEN_CACHE_TTL

    globalTokenCache = new TokenCache({ ...options, ttl })

    // Setup periodic cleanup (every 5 minutes)
    if (typeof setInterval !== 'undefined') {
      setInterval(
        () => {
          if (globalTokenCache) {
            const removed = globalTokenCache.cleanup()
            if (removed > 0 && process.env.NODE_ENV === 'development') {
              registryLogger.info(`Token cache cleanup: removed ${removed} expired token(s)`)
            }
          }
        },
        5 * 60 * 1000
      ) // 5 minutes
    }
  }

  return globalTokenCache
}
