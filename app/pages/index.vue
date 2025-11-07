<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          {{ $t('registry.repository.title') }}
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ repositoryCountText }}
        </p>
      </div>

      <!-- Toggle to show/hide empty repositories -->
      <label
        class="dark:hover:bg-gray-750 flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
      >
        <input
          type="checkbox"
          :checked="!store.hideEmptyRepositories"
          class="h-4 w-4 rounded border-gray-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:focus-visible:ring-offset-gray-800"
          @change="store.toggleEmptyRepositories()"
        />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ $t('registry.repository.show-empty') }}
        </span>
        <span
          v-if="store.hiddenRepositoryCount > 0 && store.hideEmptyRepositories"
          class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400"
        >
          {{ store.hiddenRepositoryCount }}
        </span>
      </label>
    </div>

    <RepositoryGrid
      :repositories="store.visibleRepositories"
      :loading="store.isLoadingRepositories"
      :error="store.repositoriesError"
      @retry="fetchRepositories"
      @delete="handleDeleteRepository"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRegistryStore } from '~/stores/registry'
import type { Repository } from '~/stores/registry'

const store = useRegistryStore()
const { t } = useI18n()
const { deleteRepository } = useDockerRegistry()
const toast = useToast()
const logger = useAppLogger('pages:index')

const repositoryCountText = computed(() => {
  const count = store.visibleRepositories.length
  return t('registry.repository.count', { count })
})

const fetchRepositories = async () => {
  try {
    await store.fetchRepositories()
  } catch (error) {
    logger.error('Failed to fetch repositories:', error)
    toast.error(error instanceof Error ? error.message : t('error.unexpected'))
  }
}

const handleDeleteRepository = async (repository: Repository) => {
  try {
    await deleteRepository(repository.name)
    toast.success(t('registry.repository.delete.success'))
    // Info message about garbage collection
    setTimeout(() => {
      toast.info(t('registry.repository.delete.gc-info'))
    }, 500)
    await fetchRepositories()
  } catch (error) {
    logger.error('Failed to delete repository:', error)
    toast.error(error instanceof Error ? error.message : t('registry.repository.delete.error'))
  }
}

useSeoMeta({
  title: t('registry.repository.title'),
  description: t('registry.repository.title'),
})

onMounted(() => {
  store.initPreferences()
  fetchRepositories()
})
</script>
