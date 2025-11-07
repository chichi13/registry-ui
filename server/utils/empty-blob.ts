/**
 * Empty blob constants for OCI manifests
 * This is a standard empty JSON object used in temporary manifests
 * @see https://github.com/opencontainers/image-spec/blob/main/descriptor.md
 */
export const EMPTY_BLOB = {
  digest: 'sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a',
  content: '{}',
  size: 2,
  mediaType: 'application/vnd.oci.empty.v1+json',
} as const

/**
 * Check if the empty blob exists in the registry
 */
export async function blobExists(
  client: RegistryClient,
  repositoryName: string,
  digest: string
): Promise<boolean> {
  try {
    await client.headBlob(repositoryName, digest)
    return true
  } catch (_error) {
    return false
  }
}

/**
 * Ensure the empty blob exists in the registry
 * Uploads it if it doesn't exist yet
 */
export async function ensureEmptyBlobExists(
  client: RegistryClient,
  repositoryName: string
): Promise<void> {
  const exists = await blobExists(client, repositoryName, EMPTY_BLOB.digest)

  if (!exists) {
    await uploadEmptyBlob(client, repositoryName)
  }
}

/**
 * Upload the empty blob to the registry
 * This blob is used in temporary manifests for tag deletion
 */
export async function uploadEmptyBlob(
  client: RegistryClient,
  repositoryName: string
): Promise<void> {
  try {
    // Initiate blob upload
    const uploadUrl = await client.initiateUpload(repositoryName)

    // Upload the empty blob content
    await client.uploadBlob(uploadUrl, EMPTY_BLOB.content, EMPTY_BLOB.digest)
  } catch (error) {
    console.error(`Failed to upload empty blob for ${repositoryName}:`, error)
    throw error
  }
}
