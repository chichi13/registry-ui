<template>
  <div
    class="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-600 md:flex-row md:items-center md:justify-between md:gap-4"
  >
    <div class="min-w-0 flex-1 space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <Badge variant="info" size="md">
          {{ tag.name }}
        </Badge>
        <span v-if="tag.architecture || tag.os" class="text-sm text-gray-600 dark:text-gray-400">
          {{ tag.os }}/{{ tag.architecture }}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <span class="flex items-center gap-1">
          <Icon name="heroicons:cube" class="h-4 w-4" />
          {{ formatBytes(tag.size) }}
        </span>
        <span v-if="tag.createdAt" class="flex items-center gap-1">
          <Icon name="heroicons:clock" class="h-4 w-4" />
          {{ formatDate(tag.createdAt) }}
        </span>
      </div>

      <div v-if="tag.digest" class="flex items-center gap-2">
        <code
          class="truncate rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        >
          {{ tag.digest.substring(0, 19) }}...
        </code>
        <IconButton
          :icon="copied ? 'heroicons:check' : 'heroicons:clipboard'"
          :label="$t('actions.copy-digest')"
          variant="ghost"
          size="sm"
          @click="copyDigest"
        />
      </div>
    </div>

    <div class="flex items-center gap-2 md:flex-shrink-0">
      <IconButton
        icon="heroicons:trash"
        :label="$t('actions.delete-tag')"
        variant="outline-danger"
        size="sm"
        @click="$emit('delete', tag)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  tag: Tag
}

const props = defineProps<Props>()

defineEmits<{
  delete: [tag: Tag]
}>()

const logger = useAppLogger('component:tag-row')

const { formatBytes, formatDate } = useDockerRegistry()
const copied = ref(false)

const copyDigest = async () => {
  if (!props.tag.digest) {
    return
  }

  try {
    await navigator.clipboard.writeText(props.tag.digest)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    logger.error('Failed to copy digest:', error)
  }
}
</script>
