/**
 * Registry Connectivity Check
 *
 * GET /api/registry/v2/
 *
 * Tests connection to the Docker Registry and returns basic information.
 * This endpoint verifies that the registry is accessible and authentication is working.
 */

import type { H3Event } from 'h3'

interface ConnectivityResponse {
  connected: boolean
  registryUrl: string
  authenticated: boolean
  timestamp: string
}

export default defineEventHandler(
  defineApiHandler<ConnectivityResponse>(async (_event: H3Event) => {
    const registryClient = useRegistryClient()
    const env = validateEnv()

    const connected = await registryClient.ping()

    return {
      connected,
      registryUrl: env.REGISTRY_URL,
      authenticated: !!(env.REGISTRY_USERNAME && env.REGISTRY_PASSWORD),
      timestamp: new Date().toISOString(),
    }
  })
)
