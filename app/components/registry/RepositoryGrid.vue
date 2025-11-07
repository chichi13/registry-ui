<template>
  <div>
    <LoadingSpinner v-if="loading" centered :label="$t('registry.repository.loading')" />

    <ErrorAlert v-else-if="error" :message="error" show-retry @retry="$emit('retry')" />

    <EmptyState
      v-else-if="!repositories || repositories.length === 0"
      icon="heroicons:cube"
      :title="$t('registry.repository.empty.title')"
      :description="$t('registry.repository.empty.description')"
    >
      <template #action>
        <Button @click="$emit('retry')">
          {{ $t('actions.refresh') }}
        </Button>
      </template>
    </EmptyState>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RepositoryCard
        v-for="repository in repositories"
        :key="repository.name"
        :repository="repository"
        @delete="handleDelete"
      />
    </div>

    <DeleteConfirmDialog
      v-if="repositoryToDelete"
      :open="showDeleteDialog"
      :item-type="'repository'"
      :item-name="repositoryToDelete.name"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
      @update:open="showDeleteDialog = $event"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  repositories: Repository[]
  loading?: boolean
  error?: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  retry: []
  delete: [repository: Repository]
}>()

const showDeleteDialog = ref(false)
const repositoryToDelete = ref<Repository | null>(null)
const deleting = ref(false)

const handleDelete = (repository: Repository) => {
  repositoryToDelete.value = repository
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!repositoryToDelete.value) {
    return
  }

  deleting.value = true
  emit('delete', repositoryToDelete.value)
}

const cancelDelete = () => {
  showDeleteDialog.value = false
  repositoryToDelete.value = null
  deleting.value = false
}

defineExpose({
  cancelDelete,
})
</script>
