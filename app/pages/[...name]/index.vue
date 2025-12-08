<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <NuxtLink
          to="/"
          class="mb-2 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Icon name="heroicons:arrow-left" class="h-4 w-4" />
          {{ $t('actions.go-to-repositories') }}
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          {{ repositoryName }}
        </h1>
        <p class="mt-1 text-gray-600 dark:text-gray-400">
          {{ tagCountText }}
        </p>
      </div>

      <ButtonGroup spacing="md">
        <Button variant="outline-secondary" @click="fetchTags">
          <Icon name="heroicons:arrow-path" class="h-4 w-4" />
          {{ $t('actions.refresh') }}
        </Button>
        <Button variant="soft-danger" @click="handleDeleteRepository">
          <Icon name="heroicons:trash" class="h-4 w-4" />
          {{ $t('actions.delete-repository') }}
        </Button>
      </ButtonGroup>
    </div>

    <TagList
      :tags="tags"
      :repository-name="repositoryName"
      :loading="store.isRepositoryLoading(repositoryName)"
      :error="store.getRepositoryError(repositoryName)"
      @retry="fetchTags"
      @delete="handleDeleteTag"
    />

    <DeleteConfirmDialog
      v-if="showDeleteRepositoryDialog"
      :open="showDeleteRepositoryDialog"
      :item-type="'repository'"
      :item-name="repositoryName"
      :loading="deletingRepository"
      @confirm="confirmDeleteRepository"
      @cancel="cancelDeleteRepository"
      @update:open="showDeleteRepositoryDialog = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRegistryStore } from '~/stores/registry'
import type { Tag } from '~/stores/registry'

const route = useRoute()
const router = useRouter()
const store = useRegistryStore()
const { t } = useI18n()
const { deleteTag, deleteRepository } = useDockerRegistry()
const toast = useToast()
const logger = useAppLogger('pages:repository')

const repositoryName = computed(() => {
  const name = route.params.name
  if (!name) return ''
  return Array.isArray(name) ? name.join('/') : name
})

const tags = computed(() => store.getTagsByRepository(repositoryName.value))

const tagCountText = computed(() => {
  const count = tags.value.length
  return t('registry.repository.tags.count', { count })
})

const showDeleteRepositoryDialog = ref(false)
const deletingRepository = ref(false)

const fetchTags = async () => {
  try {
    await store.fetchTags(repositoryName.value)
  } catch (error) {
    logger.error('Failed to fetch tags:', error)
    toast.error(error instanceof Error ? error.message : t('error.unexpected'))
  }
}

const handleDeleteTag = async (tag: Tag) => {
  try {
    await deleteTag(repositoryName.value, tag.name)
    toast.success(t('registry.tag.delete.success'))
    setTimeout(() => {
      toast.info(t('registry.tag.delete.gc-info'))
    }, 500)
    await fetchTags()
  } catch (error) {
    logger.error('Failed to delete tag:', error)
    toast.error(error instanceof Error ? error.message : t('registry.tag.delete.error'))
  }
}

const handleDeleteRepository = () => {
  showDeleteRepositoryDialog.value = true
}

const confirmDeleteRepository = async () => {
  deletingRepository.value = true
  try {
    await deleteRepository(repositoryName.value)
    toast.success(t('registry.repository.delete.success'))
    router.push('/')
  } catch (error) {
    logger.error('Failed to delete repository:', error)
    toast.error(error instanceof Error ? error.message : t('registry.repository.delete.error'))
    deletingRepository.value = false
  }
}

const cancelDeleteRepository = () => {
  showDeleteRepositoryDialog.value = false
  deletingRepository.value = false
}

useSeoMeta({
  title: `${repositoryName.value} - ${t('registry.repository.title')}`,
  description: `${t('registry.repository.tags.title')} - ${repositoryName.value}`,
})

onMounted(() => {
  fetchTags()
})
</script>
