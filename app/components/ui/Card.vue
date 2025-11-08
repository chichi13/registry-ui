<template>
  <div :class="cardClasses">
    <div
      v-if="$slots.header"
      class="border-b border-gray-200 px-4 py-3 dark:border-gray-600 sm:px-6"
    >
      <slot name="header" />
    </div>
    <div :class="bodyClasses">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="border-t border-gray-200 px-4 py-3 dark:border-gray-600 sm:px-6"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  clickable: false,
})

const baseClasses = 'rounded-lg bg-white dark:bg-gray-800'

const variantClasses = {
  default: '',
  bordered: 'border border-gray-200 dark:border-gray-600',
  elevated: 'shadow-md hover:shadow-lg transition-shadow',
}

const paddingClasses = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
}

const cardClasses = computed(() => {
  return [
    baseClasses,
    variantClasses[props.variant],
    props.clickable
      ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors'
      : '',
  ]
    .filter(Boolean)
    .join(' ')
})

const bodyClasses = computed(() => {
  return paddingClasses[props.padding]
})
</script>
