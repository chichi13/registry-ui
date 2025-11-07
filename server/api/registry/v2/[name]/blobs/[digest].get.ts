/**
 * Get Blob (Config or Layer)
 *
 * GET /api/registry/v2/{name}/blobs/{digest}
 *
 * Retrieves a blob from the registry by its digest.
 * Typically used to fetch image configuration with metadata like:
 * - architecture, os, created date
 * - environment variables, exposed ports
 * - layer history and Dockerfile commands
 *
 * Response structure follows Docker Image Specification v1.2
 * https://github.com/moby/moby/blob/master/image/spec/v1.2.md
 */

import type { H3Event } from 'h3'

/**
 * Docker Image Config Blob structure
 * Based on https://github.com/opencontainers/image-spec/blob/main/config.md
 */
interface ImageConfig {
  architecture: string // e.g., "amd64", "arm64"
  os: string // e.g., "linux", "windows"
  created?: string // ISO 8601 timestamp
  author?: string
  config?: {
    User?: string
    ExposedPorts?: Record<string, object>
    Env?: string[] // ["PATH=/usr/local/bin", ...]
    Cmd?: string[]
    Entrypoint?: string[]
    WorkingDir?: string
    Labels?: Record<string, string>
  }
  rootfs: {
    type: string // "layers"
    diff_ids: string[] // Uncompressed layer digests
  }
  history?: Array<{
    created?: string
    created_by?: string // Dockerfile command
    empty_layer?: boolean
  }>
}

interface BlobResponse {
  repository: string
  digest: string
  config: ImageConfig
}

export default defineEventHandler(
  defineApiHandler<BlobResponse>(
    async (event: H3Event) => {
      const repositoryName = getRepositoryName(event)
      const digest = getDigest(event)
      const registryClient = useRegistryClient()

      const config = await registryClient.getBlob<ImageConfig>(repositoryName, digest)

      return {
        repository: repositoryName,
        digest,
        config,
      }
    },
    {
      logActions: true,
      actionName: 'get_blob',
    }
  )
)
