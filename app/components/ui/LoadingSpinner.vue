<template>
  <div class="flex items-center justify-center" :class="containerClasses">
    <div :class="spinnerClasses" role="status" aria-live="polite">
      <span class="sr-only">{{ label || $t('common.loading') }}</span>
    </div>
    <span v-if="label" class="ml-2 text-gray-600 dark:text-gray-400" :class="labelSizeClasses">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  label?: string
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  label: undefined,
  centered: false,
})

const containerClasses = computed(() => {
  return props.centered ? 'min-h-[200px]' : ''
})

const spinnerSizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
}

const labelSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

const spinnerClasses = computed(() => {
  return [
    'inline-block animate-spin rounded-full border-blue-600 border-t-transparent dark:border-blue-400',
    spinnerSizes[props.size],
  ].join(' ')
})

const labelSizeClasses = computed(() => {
  return labelSizes[props.size]
})
</script>
