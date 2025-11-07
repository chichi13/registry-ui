<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div v-if="icon" class="mb-4 text-gray-400 dark:text-gray-600">
      <Icon :name="icon" class="h-16 w-16 sm:h-20 sm:w-20" />
    </div>
    <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
      {{ title }}
    </h3>
    <p class="mb-6 max-w-md text-sm text-gray-600 dark:text-gray-400 sm:text-base">
      {{ description }}
    </p>
    <div v-if="$slots.action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  icon?: string
}

defineProps<Props>()
</script>
