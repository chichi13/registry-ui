/**
 * Get Manifest
 *
 * GET /api/registry/v2/{name}/manifests/{reference}
 *
 * Retrieves the manifest for a specific image reference (tag or digest).
 * Returns both the manifest content and the digest from response headers.
 *
 * This endpoint is critical for the delete workflow:
 * 1. Get manifest by tag to retrieve digest
 * 2. Delete by digest (not by tag)
 */

import type { H3Event } from 'h3'

interface ManifestResponse {
  repository: string
  reference: string
  digest: string
  manifest: {
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
  totalSize: number
}

export default defineEventHandler(
  defineApiHandler<ManifestResponse>(
    async (event: H3Event) => {
      const repositoryName = getRepositoryName(event)
      const reference = getRouteParam(event, 'digest')

      if (!reference) {
        throw new ValidationError('Missing reference (tag or digest)', 'VALIDATION_ERROR', {
          hint: 'Provide either a tag name or digest in the URL',
        })
      }

      const registryClient = useRegistryClient()
      const { manifest, digest } = await registryClient.getManifest(repositoryName, reference)
      const totalSize =
        manifest.config.size + manifest.layers.reduce((sum, layer) => sum + layer.size, 0)

      return {
        repository: repositoryName,
        reference,
        digest,
        manifest,
        totalSize,
      }
    },
    {
      logActions: true,
      actionName: 'get_manifest',
    }
  )
)
