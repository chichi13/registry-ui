/**
 * List Tags for Repository
 *
 * GET /api/registry/v2/{name}/tags/list
 *
 * Returns a list of all tags for a specific repository.
 */

import type { H3Event } from 'h3'

interface TagsResponse {
  repository: string
  tags: string[]
  count: number
}

export default defineEventHandler(
  defineApiHandler<TagsResponse>(
    async (event: H3Event) => {
      const repositoryName = getRepositoryName(event)
      const registryClient = useRegistryClient()
      const tags = await registryClient.listTags(repositoryName)

      return {
        repository: repositoryName,
        tags,
        count: tags.length,
      }
    },
    {
      logActions: true,
      actionName: 'list_tags',
    }
  )
)
