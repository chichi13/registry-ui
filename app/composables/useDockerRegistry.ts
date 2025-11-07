import { useRegistryStore } from '~/stores/registry'

const logger = useAppLogger('composable:docker-registry')

export function useDockerRegistry() {
  const store = useRegistryStore()
  const { t } = useI18n()

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {
      return '0 B'
    }

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    const sizeLabel = sizes[i]

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizeLabel}`
  }

  const formatDate = (date?: Date): string => {
    if (!date) {
      return '-'
    }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return t('common.just-now', 'Just now')
    }
    if (diffMins < 60) {
      return t('common.minutes-ago', { count: diffMins }, `${diffMins}m ago`)
    }
    if (diffHours < 24) {
      return t('common.hours-ago', { count: diffHours }, `${diffHours}h ago`)
    }
    if (diffDays < 7) {
      return t('common.days-ago', { count: diffDays }, `${diffDays}d ago`)
    }

    return date.toLocaleDateString()
  }

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return t('error.unauthorized')
      }
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        return t('error.forbidden')
      }
      if (error.message.includes('404') || error.message.includes('not found')) {
        return t('error.not-found')
      }
      if (error.message.includes('405') || error.message.includes('delete')) {
        return t('error.delete-disabled')
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return t('error.network')
      }

      return error.message
    }

    return t('error.unexpected')
  }

  const listRepositories = async (): Promise<void> => {
    try {
      await store.fetchRepositories()
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const getRepository = async (name: string) => {
    try {
      if (!store.repositoriesWithTags.has(name)) {
        await store.fetchTags(name)
      }
      return store.getRepositoryByName(name)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const getTags = async (repositoryName: string) => {
    try {
      await store.fetchTags(repositoryName)
      return store.getTagsByRepository(repositoryName)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const deleteTag = async (repositoryName: string, tagName: string): Promise<void> => {
    try {
      const response = await $fetch<{
        success: boolean
        method: string
        message: string
        affectedTags?: string[]
      }>(
        `/api/registry/v2/${encodeURIComponent(repositoryName)}/tags/${encodeURIComponent(tagName)}`,
        {
          method: 'DELETE',
        }
      )

      if (import.meta.dev) {
        logger.info(`Tag deleted using method: ${response.method}`)
      }

      if (response.affectedTags && response.affectedTags.length > 1) {
        logger.warn(`Multiple tags affected: ${response.affectedTags.join(', ')}`)
      }

      await store.fetchTags(repositoryName)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const deleteRepository = async (repositoryName: string): Promise<void> => {
    try {
      await store.deleteRepository(repositoryName)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  return {
    store,
    formatBytes,
    formatDate,
    getErrorMessage,
    listRepositories,
    getRepository,
    getTags,
    deleteTag,
    deleteRepository,
  }
}
