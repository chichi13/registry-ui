<template>
  <Card variant="bordered" clickable @click="handleClick">
    <div class="flex flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-lg font-semibold text-gray-900 dark:text-white">
            {{ repository.name }}
          </h3>
          <div
            class="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <div class="flex items-center gap-1">
              <Icon name="heroicons:tag" class="h-4 w-4" />
              <span>{{ tagCountText }}</span>
            </div>
            <span v-if="repository.lastUpdated" class="flex items-center gap-1">
              <Icon name="heroicons:clock" class="h-4 w-4" />
              <span>{{ formatDate(repository.lastUpdated) }}</span>
            </span>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="h-5 w-5 flex-shrink-0 text-gray-400" />
      </div>

      <div class="flex justify-end">
        <Button variant="outline-primary" size="sm" @click.stop="handleViewDetails">
          <Icon name="heroicons:eye" class="h-4 w-4" />
          {{ $t('actions.view-details') }}
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
interface Props {
  repository: Repository
}

const props = defineProps<Props>()

const { t } = useI18n()
const router = useRouter()
const { formatDate } = useDockerRegistry()

const tagCountText = computed(() => {
  const count = props.repository.tagCount
  if (count === undefined) {
    return '...'
  }
  return t('registry.repository.tags.count', { count }, `${count} tag${count !== 1 ? 's' : ''}`)
})

const handleClick = () => {
  router.push(`/${encodeURIComponent(props.repository.name)}`)
}

const handleViewDetails = () => {
  router.push(`/${encodeURIComponent(props.repository.name)}`)
}
</script>
