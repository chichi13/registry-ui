<template>
  <div
    class="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 sm:bottom-4 sm:right-4"
  >
    <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="toastClasses(toast.type)"
        class="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg p-4 shadow-md"
        role="alert"
      >
        <Icon
          :name="getIcon(toast.type)"
          :class="iconClasses(toast.type)"
          class="h-5 w-5 flex-shrink-0"
        />
        <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
        <button
          type="button"
          class="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Close"
          @click="remove(toast.id)"
        >
          <Icon name="heroicons:x-mark" class="h-4 w-4" />
          <span class="sr-only">{{ $t('common.close') }}</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { ToastType } from '~/composables/useToast'

const { toasts, remove } = useToast()

const toastClasses = (type: ToastType) => {
  const classes = {
    success:
      'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    error:
      'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    warning:
      'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    info: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  }
  return classes[type]
}

const iconClasses = (type: ToastType) => {
  const classes = {
    success: 'text-green-600 dark:text-green-300',
    error: 'text-red-600 dark:text-red-300',
    warning: 'text-yellow-600 dark:text-yellow-300',
    info: 'text-blue-600 dark:text-blue-300',
  }
  return classes[type]
}

const getIcon = (type: ToastType) => {
  const icons = {
    success: 'heroicons:check-circle',
    error: 'heroicons:exclamation-circle',
    warning: 'heroicons:exclamation-triangle',
    info: 'heroicons:information-circle',
  }
  return icons[type]
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
