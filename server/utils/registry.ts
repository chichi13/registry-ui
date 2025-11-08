/**
 * Docker Registry V2 API Client
 *
 * Supports both Basic Auth (htpasswd) and Bearer Token (OAuth2) authentication.
 * Authentication method is configured via REGISTRY_AUTH_METHOD environment variable.
 * Reference: https://docs.docker.com/registry/spec/api/
 */

/**
 * Authentication result with token and method
 */
interface AuthResult {
  token: string
  method: AuthMethod
}

/**
 * Bearer token response from registry
 */
interface TokenResponse {
  token?: string
  access_token?: string
  expires_in?: number
  issued_at?: string
}

/**
 * Repository list response
 */
interface RepositoriesResponse {
  repositories: string[]
}

/**
 * Tags list response
 */
interface TagsResponse {
  name: string
  tags: string[]
}

/**
 * Manifest response (simplified)
 */
interface ManifestResponse {
  schemaVersion: number
  mediaType: string
  config: {
    digest: string
    size: number
  }
  layers: Array<{
    digest: string
    size: number
  }>
}

/**
 * Registry client configuration
 */
interface RegistryClientConfig {
  registryUrl: string
  username?: string
  password?: string
  requestTimeout: number
  maxRetries: number
}

export class RegistryClient {
  private readonly config: RegistryClientConfig
  private readonly tokenCache = getTokenCache()

  constructor(config: RegistryClientConfig) {
    this.config = {
      ...config,
      registryUrl: config.registryUrl.replace(/\/$/, ''), // Remove trailing slash
    }
  }

  static fromEnv(env: Env): RegistryClient {
    return new RegistryClient({
      registryUrl: env.REGISTRY_URL,
      username: env.REGISTRY_USERNAME || undefined,
      password: env.REGISTRY_PASSWORD || undefined,
      requestTimeout: env.REGISTRY_REQUEST_TIMEOUT,
      maxRetries: env.REGISTRY_MAX_RETRIES,
    })
  }

  private async parseErrorResponse(response: Response): Promise<unknown> {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.config.registryUrl}/v2/`, {
        method: 'GET',
      })

      return response.ok
    } catch (error) {
      registryLogger.error('ping() failed:', error)
      return false
    }
  }

  private async authenticate(scope?: string): Promise<AuthResult> {
    const cacheKey = createCacheKey(this.config.registryUrl, scope)

    if (!this.tokenCache.shouldRefresh(cacheKey)) {
      const cached = this.tokenCache.get(cacheKey)
      if (cached) {
        return { token: cached.token, method: cached.authMethod }
      }
    }

    const env = validateEnv()
    const method = env.REGISTRY_AUTH_METHOD

    if (!this.config.username || !this.config.password) {
      return { token: '', method: 'none' }
    }

    try {
      if (method === 'none') {
        return { token: '', method: 'none' }
      }

      if (method === 'basic') {
        const basicToken = btoa(`${this.config.username}:${this.config.password}`)
        this.tokenCache.set(cacheKey, basicToken, 'basic')
        return { token: basicToken, method: 'basic' }
      }

      if (method === 'bearer') {
        const bearerToken = await this.fetchBearerToken(scope)
        this.tokenCache.set(cacheKey, bearerToken, 'bearer')
        return { token: bearerToken, method: 'bearer' }
      }

      throw new AuthError(
        `Unsupported authentication method: ${method}`,
        401,
        ErrorCodes.AUTH_FAILED
      )
    } catch (error) {
      if (error instanceof AuthError) {
        logError(error, 'RegistryClient.authenticate')
        throw error
      }

      const appError = new AuthError(
        'Authentication failed',
        401,
        ErrorCodes.REGISTRY_AUTH_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.authenticate')
      throw appError
    }
  }

  private async fetchBearerToken(scope?: string): Promise<string> {
    const initialResponse = await this.fetchWithTimeout(`${this.config.registryUrl}/v2/`, {
      method: 'GET',
    })

    const authHeader = initialResponse.headers.get('www-authenticate')
    if (!authHeader || !authHeader.toLowerCase().includes('bearer')) {
      throw new AuthError(
        'Registry does not support bearer token authentication',
        401,
        ErrorCodes.AUTH_FAILED,
        { authHeader }
      )
    }

    const realmMatch = authHeader.match(/realm="([^"]+)"/)
    const serviceMatch = authHeader.match(/service="([^"]+)"/)

    if (!realmMatch) {
      throw new AuthError(
        'Invalid bearer token challenge from registry',
        401,
        ErrorCodes.AUTH_FAILED,
        { authHeader }
      )
    }

    const realm = realmMatch[1]
    const service = serviceMatch?.[1]

    const tokenUrl = new URL(realm)
    if (service) {
      tokenUrl.searchParams.set('service', service)
    }
    if (scope) {
      tokenUrl.searchParams.set('scope', scope)
    }

    const tokenResponse = await this.fetchWithTimeout(tokenUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
      },
    })

    if (!tokenResponse.ok) {
      throw new AuthError(
        'Failed to obtain bearer token from OAuth2 server',
        tokenResponse.status,
        ErrorCodes.AUTH_FAILED
      )
    }

    const tokenData: TokenResponse = await tokenResponse.json()
    const token = tokenData.token || tokenData.access_token

    if (!token) {
      throw new AuthError('OAuth2 server returned empty token', 401, ErrorCodes.TOKEN_INVALID)
    }

    return token
  }

  private createAuthHeader(token: string, method: AuthMethod): Record<string, string> {
    if (method === 'none' || !token) {
      return {}
    }

    if (method === 'basic') {
      return { Authorization: `Basic ${token}` }
    }

    if (method === 'bearer') {
      return { Authorization: `Bearer ${token}` }
    }

    return {}
  }

  /**
   * List all repositories in the registry
   */
  async listRepositories(): Promise<string[]> {
    const auth = await this.authenticate('registry:catalog:*')

    try {
      const response = await this.fetchWithRetry(`${this.config.registryUrl}/v2/_catalog`, {
        method: 'GET',
        headers: {
          ...this.createAuthHeader(auth.token, auth.method),
        },
      })

      if (!response.ok) {
        const errorBody = await this.parseErrorResponse(response)
        throw mapRegistryError(response.status, 'Failed to list repositories', errorBody)
      }

      const data: RepositoriesResponse = await response.json()
      return data.repositories || []
    } catch (error) {
      if (error instanceof RegistryError || error instanceof AuthError) {
        throw error
      }

      const appError = new RegistryError(
        'Failed to fetch repository catalog',
        500,
        ErrorCodes.REGISTRY_UNAVAILABLE,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.listRepositories')
      throw appError
    }
  }

  /**
   * List tags for a specific repository
   */
  async listTags(repositoryName: string): Promise<string[]> {
    const scope = `repository:${repositoryName}:pull`
    const auth = await this.authenticate(scope)

    try {
      const response = await this.fetchWithRetry(
        `${this.config.registryUrl}/v2/${repositoryName}/tags/list`,
        {
          method: 'GET',
          headers: {
            ...this.createAuthHeader(auth.token, auth.method),
          },
        }
      )

      if (!response.ok) {
        const errorBody = await this.parseErrorResponse(response)
        throw mapRegistryError(
          response.status,
          `Failed to list tags for repository '${repositoryName}'`,
          {
            ...errorBody,
            repository: repositoryName,
          }
        )
      }

      const data: TagsResponse = await response.json()
      return data.tags || []
    } catch (error) {
      if (error instanceof RegistryError || error instanceof AuthError) {
        throw error
      }

      const appError = new RegistryError(
        `Failed to fetch tags for repository '${repositoryName}'`,
        500,
        ErrorCodes.REGISTRY_UNAVAILABLE,
        {
          repository: repositoryName,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.listTags')
      throw appError
    }
  }

  /**
   * Get manifest for a specific image reference (tag or digest)
   * Returns the manifest and its digest from response headers
   */
  async getManifest(
    repositoryName: string,
    reference: string
  ): Promise<{ manifest: ManifestResponse; digest: string }> {
    const scope = `repository:${repositoryName}:pull`
    const auth = await this.authenticate(scope)

    try {
      const response = await this.fetchWithRetry(
        `${this.config.registryUrl}/v2/${repositoryName}/manifests/${reference}`,
        {
          method: 'GET',
          headers: {
            ...this.createAuthHeader(auth.token, auth.method),
            Accept:
              'application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.oci.image.index.v1+json',
          },
        }
      )

      if (!response.ok) {
        const errorBody = await this.parseErrorResponse(response)
        throw mapRegistryError(
          response.status,
          `Failed to get manifest for '${repositoryName}:${reference}'`,
          {
            ...errorBody,
            repository: repositoryName,
            reference,
          }
        )
      }

      const digest = response.headers.get('docker-content-digest')
      if (!digest) {
        throw new RegistryError(
          'Registry did not return manifest digest',
          500,
          ErrorCodes.REGISTRY_INVALID_RESPONSE,
          {
            repository: repositoryName,
            reference,
            hint: 'Ensure registry supports manifest v2 format',
          }
        )
      }

      const manifest: ManifestResponse = await response.json()

      return { manifest, digest }
    } catch (error) {
      if (error instanceof RegistryError || error instanceof AuthError) {
        throw error
      }

      const appError = new RegistryError(
        `Failed to fetch manifest for '${repositoryName}:${reference}'`,
        500,
        ErrorCodes.REGISTRY_UNAVAILABLE,
        {
          repository: repositoryName,
          reference,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.getManifest')
      throw appError
    }
  }

  /**
   * Delete manifest by digest or tag reference
   * Can be used for both traditional digest deletion and OCI tag deletion
   *
   * @param repositoryName - Repository name
   * @param reference - Either a digest (sha256:xxx) or a tag name
   * @returns Response object (status code indicates success/failure)
   */
  async deleteManifest(repositoryName: string, reference: string): Promise<Response> {
    const scope = `repository:${repositoryName}:pull,push,delete`
    const auth = await this.authenticate(scope)

    try {
      const response = await this.fetchWithRetry(
        `${this.config.registryUrl}/v2/${repositoryName}/manifests/${reference}`,
        {
          method: 'DELETE',
          headers: {
            ...this.createAuthHeader(auth.token, auth.method),
          },
        }
      )

      // Return response for strategy detection
      // 202 = Success (OCI tag delete or digest delete)
      // 400/405 = Unsupported (OCI tag delete not supported)
      // Other = Error
      return response
    } catch (error) {
      if (error instanceof RegistryError || error instanceof AuthError) {
        throw error
      }

      const appError = new RegistryError(
        `Failed to delete manifest from repository '${repositoryName}'`,
        500,
        ErrorCodes.REGISTRY_UNAVAILABLE,
        {
          repository: repositoryName,
          reference,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.deleteManifest')
      throw appError
    }
  }

  /**
   * Get blob (config or layer) by digest
   * Used to fetch image configuration with metadata like architecture, OS, created date
   */
  async getBlob<T = unknown>(repositoryName: string, digest: string): Promise<T> {
    const scope = `repository:${repositoryName}:pull`
    const auth = await this.authenticate(scope)

    try {
      const response = await this.fetchWithRetry(
        `${this.config.registryUrl}/v2/${repositoryName}/blobs/${digest}`,
        {
          method: 'GET',
          headers: {
            ...this.createAuthHeader(auth.token, auth.method),
            Accept: 'application/vnd.docker.container.image.v1+json',
          },
        }
      )

      if (!response.ok) {
        const errorBody = await this.parseErrorResponse(response)
        throw mapRegistryError(
          response.status,
          `Failed to get blob '${digest}' from repository '${repositoryName}'`,
          {
            ...errorBody,
            repository: repositoryName,
            digest,
          }
        )
      }

      const blob: T = await response.json()
      return blob
    } catch (error) {
      if (error instanceof RegistryError || error instanceof AuthError) {
        throw error
      }

      const appError = new RegistryError(
        `Failed to fetch blob from repository '${repositoryName}'`,
        500,
        ErrorCodes.REGISTRY_UNAVAILABLE,
        {
          repository: repositoryName,
          digest,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.getBlob')
      throw appError
    }
  }

  /**
   * Check if a blob exists in the registry (HEAD request)
   */
  async headBlob(repositoryName: string, digest: string): Promise<void> {
    const scope = `repository:${repositoryName}:pull`
    const auth = await this.authenticate(scope)

    try {
      const response = await this.fetchWithRetry(
        `${this.config.registryUrl}/v2/${repositoryName}/blobs/${digest}`,
        {
          method: 'HEAD',
          headers: {
            ...this.createAuthHeader(auth.token, auth.method),
          },
        }
      )

      if (!response.ok) {
        const errorBody = await this.parseErrorResponse(response)
        throw mapRegistryError(
          response.status,
          `Blob '${digest}' not found in repository '${repositoryName}'`,
          {
            ...errorBody,
            repository: repositoryName,
            digest,
          }
        )
      }
    } catch (error) {
      if (error instanceof RegistryError || error instanceof AuthError) {
        throw error
      }

      const appError = new RegistryError(
        `Failed to check blob existence in repository '${repositoryName}'`,
        500,
        ErrorCodes.REGISTRY_UNAVAILABLE,
        {
          repository: repositoryName,
          digest,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.headBlob')
      throw appError
    }
  }

  /**
   * Initiate blob upload
   * Returns the upload URL for subsequent PUT request
   */
  async initiateUpload(repositoryName: string): Promise<string> {
    const scope = `repository:${repositoryName}:pull,push`
    const auth = await this.authenticate(scope)

    try {
      const response = await this.fetchWithRetry(
        `${this.config.registryUrl}/v2/${repositoryName}/blobs/uploads/`,
        {
          method: 'POST',
          headers: {
            ...this.createAuthHeader(auth.token, auth.method),
            'Content-Length': '0',
          },
        }
      )

      if (!response.ok) {
        const errorBody = await this.parseErrorResponse(response)
        throw mapRegistryError(
          response.status,
          `Failed to initiate blob upload for repository '${repositoryName}'`,
          {
            ...errorBody,
            repository: repositoryName,
          }
        )
      }

      const uploadUrl = response.headers.get('Location')
      if (!uploadUrl) {
        throw new RegistryError(
          'Registry did not return upload URL',
          500,
          ErrorCodes.REGISTRY_UNAVAILABLE,
          { repository: repositoryName }
        )
      }

      if (uploadUrl.startsWith('/')) {
        return `${this.config.registryUrl}${uploadUrl}`
      }

      return uploadUrl
    } catch (error) {
      if (error instanceof RegistryError || error instanceof AuthError) {
        throw error
      }

      const appError = new RegistryError(
        `Failed to initiate blob upload for repository '${repositoryName}'`,
        500,
        ErrorCodes.REGISTRY_UNAVAILABLE,
        {
          repository: repositoryName,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.initiateUpload')
      throw appError
    }
  }

  /**
   * Upload blob content
   */
  async uploadBlob(uploadUrl: string, content: string, digest: string): Promise<void> {
    // No need to authenticate again - token is in uploadUrl
    try {
      const finalUrl = `${uploadUrl}&digest=${digest}`

      const response = await this.fetchWithRetry(finalUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': content.length.toString(),
        },
        body: content,
      })

      if (!response.ok) {
        throw new RegistryError(
          `Failed to upload blob`,
          response.status,
          ErrorCodes.REGISTRY_UNAVAILABLE,
          { digest }
        )
      }
    } catch (error) {
      if (error instanceof RegistryError || error instanceof AuthError) {
        throw error
      }

      const appError = new RegistryError(
        `Failed to upload blob`,
        500,
        ErrorCodes.REGISTRY_UNAVAILABLE,
        {
          digest,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.uploadBlob')
      throw appError
    }
  }

  /**
   * PUT manifest to a tag
   * Used for the dummy manifest workaround
   *
   * @returns Object containing the digest of the uploaded manifest
   */
  async putManifest(
    repositoryName: string,
    tag: string,
    manifest: unknown
  ): Promise<{ digest: string }> {
    const scope = `repository:${repositoryName}:pull,push`
    const auth = await this.authenticate(scope)

    try {
      const manifestJson = JSON.stringify(manifest)

      const response = await this.fetchWithRetry(
        `${this.config.registryUrl}/v2/${repositoryName}/manifests/${tag}`,
        {
          method: 'PUT',
          headers: {
            ...this.createAuthHeader(auth.token, auth.method),
            'Content-Type': 'application/vnd.oci.image.manifest.v1+json',
            'Content-Length': manifestJson.length.toString(),
          },
          body: manifestJson,
        }
      )

      if (!response.ok) {
        const errorBody = await this.parseErrorResponse(response)
        throw mapRegistryError(
          response.status,
          `Failed to PUT manifest to '${tag}' in repository '${repositoryName}'`,
          {
            ...errorBody,
            repository: repositoryName,
            tag,
          }
        )
      }

      const digest = response.headers.get('Docker-Content-Digest')
      if (!digest) {
        throw new RegistryError(
          'Registry did not return manifest digest',
          500,
          ErrorCodes.REGISTRY_UNAVAILABLE,
          { repository: repositoryName, tag }
        )
      }

      return { digest }
    } catch (error) {
      if (error instanceof RegistryError || error instanceof AuthError) {
        throw error
      }

      const appError = new RegistryError(
        `Failed to PUT manifest to repository '${repositoryName}'`,
        500,
        ErrorCodes.REGISTRY_UNAVAILABLE,
        {
          repository: repositoryName,
          tag,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
      logError(appError, 'RegistryClient.putManifest')
      throw appError
    }
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)

      // Timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableError('Docker Registry', {
          reason: 'Request timeout',
          timeout: this.config.requestTimeout,
        })
      }

      throw error
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    try {
      return await this.fetchWithTimeout(url, options)
    } catch (error) {
      const isRetryable =
        error instanceof ServiceUnavailableError ||
        (error instanceof Error && error.message.includes('ECONNREFUSED'))

      if (isRetryable && retryCount < this.config.maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))

        return this.fetchWithRetry(url, options, retryCount + 1)
      }

      throw error
    }
  }
}

/**
 * Create a singleton registry client instance
 */
let globalRegistryClient: RegistryClient | null = null

/**
 * Get or create the global registry client instance
 */
export function getRegistryClient(): RegistryClient {
  if (!globalRegistryClient) {
    const env = validateEnv()
    globalRegistryClient = RegistryClient.fromEnv(env)
  }

  return globalRegistryClient
}
