/**
 * OCI Image Manifest structure
 * @see https://github.com/opencontainers/image-spec/blob/main/manifest.md
 */
export interface OciManifest {
  schemaVersion: number
  mediaType: string
  artifactType?: string
  config: {
    mediaType: string
    digest: string
    size: number
  }
  layers: Array<{
    mediaType: string
    digest: string
    size: number
  }>
  annotations?: Record<string, string>
}

/**
 * Create a unique temporary OCI manifest
 * Used for the dummy manifest workaround to delete a single tag
 * without affecting other tags pointing to the same digest
 *
 * @returns A unique OCI manifest that can be safely deleted
 */
export function createDummyManifest(): OciManifest {
  const timestamp = Date.now()

  return {
    schemaVersion: 2,
    mediaType: 'application/vnd.oci.image.manifest.v1+json',
    // Make artifact type unique using timestamp to ensure different digest
    artifactType: `application/vnd.registry-ui.temp.${timestamp}+json`,
    config: {
      mediaType: EMPTY_BLOB.mediaType,
      digest: EMPTY_BLOB.digest,
      size: EMPTY_BLOB.size,
    },
    layers: [
      {
        mediaType: EMPTY_BLOB.mediaType,
        digest: EMPTY_BLOB.digest,
        size: EMPTY_BLOB.size,
      },
    ],
    annotations: {
      'org.opencontainers.image.created': new Date().toISOString(),
      'org.registry-ui.temp': 'true',
      'org.registry-ui.temp.timestamp': timestamp.toString(),
      description: 'Temporary manifest for tag deletion - will be deleted immediately',
    },
  }
}

/**
 * Validate that a manifest is a dummy manifest created by this tool
 */
export function isDummyManifest(manifest: OciManifest): boolean {
  return manifest.annotations?.['org.registry-ui.temp'] === 'true'
}
