<template>
  <div>
    <LoadingSpinner v-if="loading" centered :label="$t('registry.repository.tags.loading')" />

    <ErrorAlert v-else-if="error" :message="error" show-retry @retry="$emit('retry')" />

    <EmptyState
      v-else-if="!tags || tags.length === 0"
      icon="heroicons:tag"
      :title="$t('registry.repository.tags.empty.title')"
      :description="$t('registry.repository.tags.empty.description')"
    />

    <div v-else class="space-y-3">
      <TagRowExpandable
        v-for="tag in tags"
        :key="tag.digest || tag.name"
        :tag="tag"
        :repository-name="repositoryName"
        @delete="handleDelete"
      />
    </div>

    <DeleteConfirmDialog
      v-if="tagToDelete"
      :open="showDeleteDialog"
      :item-type="'tag'"
      :item-name="tagToDelete.name"
      :repository-name="repositoryName"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
      @update:open="showDeleteDialog = $event"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  tags: Tag[]
  repositoryName: string
  loading?: boolean
  error?: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  retry: []
  delete: [tag: Tag]
}>()

const showDeleteDialog = ref(false)
const tagToDelete = ref<Tag | null>(null)

const handleDelete = (tag: Tag) => {
  tagToDelete.value = tag
  showDeleteDialog.value = true
}

const confirmDelete = () => {
  if (!tagToDelete.value) {
    return
  }

  emit('delete', tagToDelete.value)

  // Immediately reset dialog state - parent will handle the actual deletion
  showDeleteDialog.value = false
  tagToDelete.value = null
}

const cancelDelete = () => {
  showDeleteDialog.value = false
  tagToDelete.value = null
}

defineExpose({
  cancelDelete,
})
</script>
