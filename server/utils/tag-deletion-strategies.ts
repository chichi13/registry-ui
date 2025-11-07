/**
 * Tag Deletion Strategies for Container Image Registry
 *
 * This module implements multiple strategies for deleting tags from a container image registry.
 * It includes:
 * 1. OCI Tag Delete API (preferred method)
 * 2. Dummy Manifest Workaround (safe alternative)
 * 3. Digest Deletion with Warning (last resort)
 *
 * Each strategy is encapsulated in its own function, and a unified `deleteTag` function
 * attempts these strategies in order, providing a robust tag deletion mechanism.
 */

const logger = registryLogger

export type DeletionMethod = 'oci' | 'dummy-manifest' | 'digest'

export interface DeletionResult {
  success: boolean
  method: DeletionMethod
  affectedTags?: string[]
  error?: string
}

/**
 * Strategy 1: Try OCI Tag Delete API
 * This is the future-proof approach that properly deletes a tag by name
 * without affecting other tags pointing to the same manifest
 *
 * @see https://github.com/opencontainers/distribution-spec/blob/main/spec.md#deleting-tags
 */
export async function deleteTagOCI(
  client: RegistryClient,
  repositoryName: string,
  tagName: string
): Promise<boolean> {
  try {
    // Try to delete by tag name (OCI Distribution Spec v1.0+)
    const response = await client.deleteManifest(repositoryName, tagName)

    // 202 Accepted = Tag deleted successfully
    if (response.status === 202) {
      logger.info(`[OCI] Tag ${tagName} deleted successfully using OCI Tag Delete API`)
      return true
    }

    // 400/405 with UNSUPPORTED = Registry doesn't support tag deletion
    if (response.status === 400 || response.status === 405) {
      logger.warn(`[OCI] Registry doesn't support OCI Tag Delete API (status: ${response.status})`)
      return false
    }

    throw new Error(`Unexpected response from OCI tag delete: ${response.status}`)
  } catch (error) {
    logger.warn(`[OCI] Tag delete failed:`, error)
    return false
  }
}

/**
 * Strategy 2: Dummy Manifest Workaround
 * This is the proven approach used by professional tools like regctl
 * Works with Docker Registry v2.x
 *
 * How it works:
 * 1. Upload an empty blob (if not exists)
 * 2. Create a unique temporary manifest pointing to the empty blob
 * 3. PUT the temporary manifest to the target tag (overwrites tag reference)
 * 4. DELETE the temporary manifest by its digest
 * 5. Original manifest remains untouched, other tags pointing to it are safe
 *
 * @see https://github.com/regclient/regclient/blob/main/docs/regctl.md#tag-delete
 */
export async function deleteTagDummyManifest(
  client: RegistryClient,
  repositoryName: string,
  tagName: string
): Promise<boolean> {
  try {
    logger.info(`[DUMMY] Starting dummy manifest workaround for tag ${tagName}`)

    // Step 1: Ensure empty blob exists in registry
    await ensureEmptyBlobExists(client, repositoryName)
    logger.info(`[DUMMY] Empty blob verified for ${repositoryName}`)

    // Step 2: Create unique temporary manifest
    const dummyManifest = createDummyManifest()
    logger.info(
      `[DUMMY] Created temporary manifest with artifactType: ${dummyManifest.artifactType}`
    )

    // Step 3: PUT temporary manifest to the tag (overwrites tag reference)
    const putResult = await client.putManifest(repositoryName, tagName, dummyManifest)
    const dummyDigest = putResult.digest
    logger.info(`[DUMMY] Temporary manifest PUT to tag ${tagName}, digest: ${dummyDigest}`)

    // Step 4: DELETE the temporary manifest by digest
    await client.deleteManifest(repositoryName, dummyDigest)
    logger.info(`[DUMMY] Temporary manifest deleted, tag ${tagName} successfully removed`)

    return true
  } catch (error) {
    logger.error(`[DUMMY] Dummy manifest workaround failed:`, error)
    return false
  }
}

/**
 * Strategy 3: Delete by Digest with Warning
 * This is the traditional approach that deletes the underlying manifest
 * WARNING: This will affect ALL tags pointing to the same manifest
 *
 * This strategy should only be used as a last resort when:
 * - OCI Tag Delete API is not supported
 * - Dummy Manifest workaround fails
 * - User explicitly confirms they understand the consequences
 */
export async function deleteTagByDigest(
  client: RegistryClient,
  repositoryName: string,
  digest: string
): Promise<boolean> {
  try {
    logger.warn(`[DIGEST] Deleting by digest ${digest} - this may affect multiple tags`)
    await client.deleteManifest(repositoryName, digest)
    return true
  } catch (error) {
    logger.error(`[DIGEST] Delete by digest failed:`, error)
    throw error
  }
}

/**
 * Unified tag deletion with automatic fallback
 * Tries strategies in order: OCI → Dummy Manifest → Digest
 *
 * @param client - Registry client instance
 * @param repositoryName - Repository name
 * @param tagName - Tag name to delete
 * @returns Deletion result with method used
 */
export async function deleteTag(
  client: RegistryClient,
  repositoryName: string,
  tagName: string
): Promise<DeletionResult> {
  logger.info(`Starting tag deletion for ${repositoryName}:${tagName}`)

  // Strategy 1: Try OCI Tag Delete API
  try {
    const ociSuccess = await deleteTagOCI(client, repositoryName, tagName)
    if (ociSuccess) {
      return {
        success: true,
        method: 'oci',
      }
    }
  } catch (_error) {
    logger.warn('OCI tag delete not supported, trying fallback methods')
  }

  // Strategy 2: Try Dummy Manifest Workaround
  try {
    const dummySuccess = await deleteTagDummyManifest(client, repositoryName, tagName)
    if (dummySuccess) {
      return {
        success: true,
        method: 'dummy-manifest',
      }
    }
  } catch (_error) {
    logger.error('Dummy manifest approach failed:', _error)
  }

  // Strategy 3: Fallback to digest deletion (requires user confirmation)
  // Get the digest for this tag first
  const { digest } = await client.getManifest(repositoryName, tagName)

  // This should be handled by the API endpoint with user confirmation
  // For now, we throw an error requiring explicit confirmation
  throw new Error(
    `Tag deletion requires manual confirmation. ` +
      `Deleting by digest (${digest}) may affect other tags. ` +
      `Please use the digest deletion endpoint with explicit confirmation.`
  )
}
