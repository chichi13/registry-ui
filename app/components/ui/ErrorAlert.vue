<template>
  <div
    v-if="!dismissed"
    class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
    role="alert"
  >
    <Icon
      name="heroicons:exclamation-circle"
      class="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
    />
    <div class="min-w-0 flex-1">
      <h4 class="text-sm font-semibold text-red-800 dark:text-red-300">
        {{ title }}
      </h4>
      <p class="mt-1 text-sm text-red-700 dark:text-red-400">
        {{ message }}
      </p>
      <div v-if="showRetry" class="mt-3">
        <Button variant="soft-danger" size="sm" @click="handleRetry">
          <Icon name="heroicons:arrow-path" class="h-4 w-4" />
          {{ retryText || $t('common.retry') }}
        </Button>
      </div>
    </div>
    <IconButton
      v-if="dismissible"
      icon="heroicons:x-mark"
      :label="$t('common.close')"
      variant="ghost"
      size="sm"
      class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
      @click="handleDismiss"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title?: string
  message: string
  dismissible?: boolean
  showRetry?: boolean
  retryText?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Error',
  dismissible: true,
  showRetry: false,
  retryText: undefined,
})

const emit = defineEmits<{
  dismiss: []
  retry: []
}>()

const dismissed = ref(false)

const handleDismiss = () => {
  dismissed.value = true
  emit('dismiss')
}

const handleRetry = () => {
  emit('retry')
}
</script>
