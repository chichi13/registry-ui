/**
 * List Repositories
 *
 * GET /api/registry/v2/_catalog
 *
 * Returns a list of all repositories in the Docker Registry.
 * Supports pagination via query parameters (n, last).
 */

import type { H3Event } from 'h3'
import { z } from 'zod'

// Query parameters schema
const catalogQuerySchema = z.object({
  n: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined))
    .refine(val => val === undefined || (val > 0 && val <= 1000), {
      message: 'Parameter n must be between 1 and 1000',
    }),
  last: z.string().optional(),
})

interface CatalogResponse {
  repositories: string[]
  count: number
}

export default defineEventHandler(
  defineApiHandler<CatalogResponse>(
    async (event: H3Event) => {
      const _query = validateQuery(event, catalogQuerySchema)
      const registryClient = useRegistryClient()

      // TODO: Implement pagination using n and last parameters
      const repositories = await registryClient.listRepositories()

      return {
        repositories,
        count: repositories.length,
      }
    },
    {
      logActions: true,
      actionName: 'list_repositories',
    }
  )
)
