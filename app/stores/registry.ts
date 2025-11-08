import { defineStore } from 'pinia'

const logger = useAppLogger('store:registry')

export interface Repository {
  name: string
  tagCount?: number
  lastUpdated?: Date
}

export interface Tag {
  name: string
  digest: string
  size: number
  createdAt?: Date
  architecture?: string
  os?: string
  hasError?: boolean
  errorMessage?: string
  manifestDetails?: {
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
  configDetails?: {
    architecture: string
    os: string
    created?: string
    author?: string
    config?: {
      Env?: string[]
      Cmd?: string[]
      Entrypoint?: string[]
      ExposedPorts?: Record<string, object>
      Labels?: Record<string, string>
    }
    history?: Array<{
      created?: string
      created_by?: string
      empty_layer?: boolean
    }>
  }
  isLoadingConfig?: boolean
}

export interface RepositoryWithTags {
  name: string
  tags: Tag[]
}

interface RegistryState {
  repositories: Repository[]
  repositoriesWithTags: Map<string, Tag[]>
  isLoadingRepositories: boolean
  isLoadingTags: Map<string, boolean>
  repositoriesError: string | null
  tagsError: Map<string, string | null>
  hideEmptyRepositories: boolean
}

export const useRegistryStore = defineStore('registry', {
  state: (): RegistryState => ({
    repositories: [],
    repositoriesWithTags: new Map(),
    isLoadingRepositories: false,
    isLoadingTags: new Map(),
    repositoriesError: null,
    tagsError: new Map(),
    hideEmptyRepositories: true,
  }),

  getters: {
    getRepositoryByName:
      state =>
      (name: string): Repository | undefined => {
        return state.repositories.find(repo => repo.name === name)
      },

    getTagsByRepository:
      state =>
      (repositoryName: string): Tag[] => {
        return state.repositoriesWithTags.get(repositoryName) || []
      },

    isRepositoryLoading:
      state =>
      (repositoryName: string): boolean => {
        return state.isLoadingTags.get(repositoryName) || false
      },

    getRepositoryError:
      state =>
      (repositoryName: string): string | null => {
        return state.tagsError.get(repositoryName) || null
      },

    repositoryCount: (state): number => {
      return state.repositories.length
    },

    totalTagCount: (state): number => {
      return Array.from(state.repositoriesWithTags.values()).reduce(
        (total, tags) => total + tags.length,
        0
      )
    },

    visibleRepositories: (state): Repository[] => {
      if (!state.hideEmptyRepositories) {
        return state.repositories
      }
      return state.repositories.filter(repo => (repo.tagCount ?? 0) > 0)
    },

    hiddenRepositoryCount: (state): number => {
      if (!state.hideEmptyRepositories) {
        return 0
      }
      return state.repositories.filter(repo => (repo.tagCount ?? 0) === 0).length
    },
  },

  actions: {
    async fetchTagsCount(repositoryName: string): Promise<number> {
      try {
        const response = await $fetch<{
          success: boolean
          data: { repository: string; tags: string[] }
        }>(`/api/registry/v2/${encodeURIComponent(repositoryName)}/tags/list`)

        const tagCount = response.data.tags?.length || 0

        const repo = this.repositories.find(r => r.name === repositoryName)
        if (repo) {
          repo.tagCount = tagCount
        }

        return tagCount
      } catch (error) {
        logger.warn(`Failed to fetch tag count for ${repositoryName}:`, error)
        return 0
      }
    },

    async fetchRepositories(): Promise<void> {
      this.isLoadingRepositories = true
      this.repositoriesError = null

      try {
        const response = await $fetch<{ success: boolean; data: { repositories: string[] } }>(
          '/api/registry/v2/_catalog'
        )

        this.repositories = response.data.repositories.map(name => ({
          name,
          tagCount: undefined,
        }))

        await Promise.allSettled(response.data.repositories.map(name => this.fetchTagsCount(name)))
      } catch (error) {
        logger.error('Failed to fetch repositories:', error)
        this.repositoriesError =
          error instanceof Error ? error.message : 'Failed to fetch repositories'
        throw error
      } finally {
        this.isLoadingRepositories = false
      }
    },

    async fetchTags(repositoryName: string): Promise<void> {
      this.isLoadingTags.set(repositoryName, true)
      this.tagsError.set(repositoryName, null)

      try {
        const response = await $fetch<{
          success: boolean
          data: { repository: string; tags: string[] }
        }>(`/api/registry/v2/${encodeURIComponent(repositoryName)}/tags/list`)

        const tagsWithDetails: Tag[] = []

        for (const tagName of response.data.tags || []) {
          try {
            const manifestResponse = await $fetch<{
              success: boolean
              data: {
                repository: string
                reference: string
                digest: string
                manifest: {
                  schemaVersion: number
                  mediaType: string
                  config: { digest: string; size: number }
                  layers: Array<{ digest: string; size: number }>
                }
                totalSize: number
              }
            }>(
              `/api/registry/v2/${encodeURIComponent(repositoryName)}/manifests/${encodeURIComponent(tagName)}`
            )

            const { data: manifestData } = manifestResponse

            if (!manifestData) {
              throw new Error('Manifest data is null or undefined')
            }

            if (!manifestData.digest) {
              const availableKeys = Object.keys(manifestData).join(', ')
              throw new Error(
                `Missing digest in manifest response. Available keys: ${availableKeys || 'none'}`
              )
            }

            if (typeof manifestData.totalSize !== 'number') {
              throw new Error(
                `Invalid totalSize: expected number, got ${typeof manifestData.totalSize} (value: ${manifestData.totalSize})`
              )
            }

            if (!manifestData.manifest) {
              throw new Error('Missing manifest object in response')
            }

            if (!manifestData.manifest.config) {
              throw new Error('Missing manifest.config in response')
            }

            if (!manifestData.manifest.layers) {
              throw new Error('Missing manifest.layers in response')
            }

            const digest = manifestData.digest
            const size = manifestData.totalSize

            tagsWithDetails.push({
              name: tagName,
              digest,
              size,
              createdAt: undefined,
              architecture: undefined,
              os: undefined,
              hasError: false,
              manifestDetails: {
                schemaVersion: manifestData.manifest.schemaVersion,
                mediaType: manifestData.manifest.mediaType,
                config: manifestData.manifest.config,
                layers: manifestData.manifest.layers,
              },
            })
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to fetch manifest data'
            logger.error(`Failed to fetch manifest for tag ${tagName}:`, error)

            tagsWithDetails.push({
              name: tagName,
              digest: '',
              size: 0,
              hasError: true,
              errorMessage,
            })
          }
        }

        this.repositoriesWithTags.set(repositoryName, tagsWithDetails)

        // Preload all config details in background
        const storedTags = this.repositoriesWithTags.get(repositoryName) || []
        storedTags.forEach(tag => {
          if (!tag.hasError && tag.manifestDetails?.config.digest) {
            this.fetchConfigBlob(repositoryName, tag).catch(error => {
              logger.warn(`Failed to preload config for ${repositoryName}:${tag.name}:`, error)
            })
          }
        })

        const repo = this.repositories.find(r => r.name === repositoryName)
        if (repo) {
          repo.tagCount = tagsWithDetails.length
          repo.lastUpdated = tagsWithDetails[0]?.createdAt
        }
      } catch (error) {
        logger.error(`Failed to fetch tags for ${repositoryName}:`, error)
        this.tagsError.set(
          repositoryName,
          error instanceof Error ? error.message : 'Failed to fetch tags'
        )
        throw error
      } finally {
        this.isLoadingTags.set(repositoryName, false)
      }
    },

    async deleteTag(repositoryName: string, tagName: string): Promise<void> {
      try {
        await $fetch(
          `/api/registry/v2/${encodeURIComponent(repositoryName)}/tags/${encodeURIComponent(tagName)}`,
          {
            method: 'DELETE',
          }
        )

        const tags = this.repositoriesWithTags.get(repositoryName) || []
        const updatedTags = tags.filter(tag => tag.name !== tagName)
        this.repositoriesWithTags.set(repositoryName, updatedTags)

        const repo = this.repositories.find(r => r.name === repositoryName)
        if (repo) {
          repo.tagCount = updatedTags.length
        }

        if (updatedTags.length === 0) {
          this.repositories = this.repositories.filter(r => r.name !== repositoryName)
          this.repositoriesWithTags.delete(repositoryName)
        }
      } catch (error) {
        logger.error(`Failed to delete tag ${tagName} from ${repositoryName}:`, error)
        throw error
      }
    },

    async deleteRepository(repositoryName: string): Promise<void> {
      const tags = this.repositoriesWithTags.get(repositoryName) || []
      const errors: Array<{ tag: string; error: string }> = []

      for (const tag of tags) {
        try {
          await this.deleteTag(repositoryName, tag.name)
        } catch (error) {
          errors.push({
            tag: tag.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      this.repositories = this.repositories.filter(r => r.name !== repositoryName)
      this.repositoriesWithTags.delete(repositoryName)
      this.isLoadingTags.delete(repositoryName)
      this.tagsError.delete(repositoryName)

      if (errors.length > 0) {
        const errorMessage = `Failed to delete ${errors.length} tag(s): ${errors.map(e => e.tag).join(', ')}`
        logger.error(`Repository ${repositoryName}: ${errorMessage}`)
        throw new Error(errorMessage)
      }
    },

    async fetchConfigBlob(repositoryName: string, tag: Tag): Promise<void> {
      if (!tag.manifestDetails?.config.digest) {
        logger.warn(
          `Cannot fetch config blob: missing config digest for ${repositoryName}:${tag.name}`
        )
        return
      }

      // Skip if already loaded or currently loading (avoid duplicate API calls)
      if (tag.configDetails || tag.isLoadingConfig) {
        return
      }

      tag.isLoadingConfig = true

      try {
        const response = await $fetch<{
          success: boolean
          data: {
            repository: string
            digest: string
            config: {
              architecture: string
              os: string
              created?: string
              author?: string
              config?: {
                Env?: string[]
                Cmd?: string[]
                Entrypoint?: string[]
                ExposedPorts?: Record<string, object>
                Labels?: Record<string, string>
              }
              history?: Array<{
                created?: string
                created_by?: string
                empty_layer?: boolean
              }>
            }
          }
        }>(
          `/api/registry/v2/${encodeURIComponent(repositoryName)}/blobs/${tag.manifestDetails.config.digest}`
        )

        tag.configDetails = response.data.config
        tag.architecture = response.data.config.architecture
        tag.os = response.data.config.os
        if (response.data.config.created) {
          tag.createdAt = new Date(response.data.config.created)
        }
      } catch (error) {
        logger.error(`Failed to fetch config blob for ${repositoryName}:${tag.name}:`, error)
        throw error
      } finally {
        tag.isLoadingConfig = false
      }
    },

    clearRepositoryError(repositoryName?: string): void {
      if (repositoryName) {
        this.tagsError.delete(repositoryName)
      } else {
        this.repositoriesError = null
      }
    },

    toggleEmptyRepositories(): void {
      this.hideEmptyRepositories = !this.hideEmptyRepositories
      if (import.meta.client) {
        localStorage.setItem('hideEmptyRepositories', String(this.hideEmptyRepositories))
      }
    },

    initPreferences(): void {
      if (import.meta.client) {
        const saved = localStorage.getItem('hideEmptyRepositories')
        this.hideEmptyRepositories = saved !== 'false'
      }
    },

    resetStore(): void {
      this.repositories = []
      this.repositoriesWithTags.clear()
      this.isLoadingRepositories = false
      this.isLoadingTags.clear()
      this.repositoriesError = null
      this.tagsError.clear()
      // Don't reset hideEmptyRepositories - it's a user preference
    },
  },
})
