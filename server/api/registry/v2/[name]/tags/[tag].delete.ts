/**
 * DELETE /api/registry/v2/:name/tags/:tag
 *
 * Delete a specific tag by name using intelligent fallback strategies:
 * 1. Try OCI Tag Delete API (future-proof)
 * 2. Try Dummy Manifest Workaround (Docker Registry v2.x compatible)
 * 3. Fallback to digest deletion with warning (last resort)
 *
 * This endpoint properly handles the case where multiple tags point to the same digest.
 */
export default defineEventHandler(async event => {
  const { name: repositoryName, tag: tagName } = getRouterParams(event)

  if (!repositoryName || !tagName) {
    throw createError({
      statusCode: 400,
      message: 'Repository name and tag name are required',
    })
  }

  const client = getRegistryClient()

  try {
    const result = await deleteTag(client, repositoryName, tagName)

    return {
      success: true,
      method: result.method,
      message: getSuccessMessage(result.method),
      affectedTags: result.affectedTags || [tagName],
    }
  } catch (error) {
    console.error(`Failed to delete tag ${repositoryName}:${tagName}:`, error)

    const statusCode =
      error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : 500

    throw createError({
      statusCode,
      message: error instanceof Error ? error.message : 'Failed to delete tag',
    })
  }
})

/**
 * Get user-friendly success message based on deletion method
 */
function getSuccessMessage(method: string): string {
  switch (method) {
    case 'oci':
      return 'Tag deleted successfully using OCI Tag Delete API'
    case 'dummy-manifest':
      return 'Tag deleted successfully (other tags pointing to the same image are preserved)'
    case 'digest':
      return 'Tag deleted (note: other tags pointing to the same image may also be affected)'
    default:
      return 'Tag deleted successfully'
  }
}
