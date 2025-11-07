/**
 * Delete Manifest
 *
 * DELETE /api/registry/v2/{name}/manifests/{digest}
 *
 * Deletes a manifest from the registry by its digest.
 *
 * CRITICAL IMPLEMENTATION NOTES:
 * - Must delete by digest, NOT by tag name
 * - Registry must have REGISTRY_STORAGE_DELETE_ENABLED=true
 * - Returns 202 Accepted or 204 No Content on success
 * - Returns 405 Method Not Allowed if deletion is disabled
 *
 * Workflow:
 * 1. Frontend calls GET /manifests/{tag} to get digest
 * 2. Frontend calls DELETE /manifests/{digest} to delete
 */

import type { H3Event } from 'h3'

interface DeleteResponse {
  repository: string
  digest: string
  deleted: boolean
  timestamp: string
}

export default defineEventHandler(
  defineApiHandler<DeleteResponse>(
    async (event: H3Event) => {
      const repositoryName = getRepositoryName(event)
      const digest = getDigest(event)
      const registryClient = useRegistryClient()

      await registryClient.deleteManifest(repositoryName, digest)

      return {
        repository: repositoryName,
        digest,
        deleted: true,
        timestamp: new Date().toISOString(),
      }
    },
    {
      logActions: true,
      actionName: 'delete_manifest',
    }
  )
)
