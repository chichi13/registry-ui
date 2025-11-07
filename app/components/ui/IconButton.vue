<template>
  <Button
    v-bind="buttonProps"
    :icon-only="true"
    :icon-position="'only'"
    :aria-label="ariaLabel || label"
    :title="label"
  >
    <Icon :name="icon" :class="iconSizeClass" />
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from './Button.vue'

type IconButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'outline-primary'
  | 'outline-secondary'
  | 'outline-danger'
  | 'soft-primary'
  | 'soft-secondary'
  | 'soft-success'
  | 'soft-warning'
  | 'soft-danger'

type IconButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  /**
   * Icon name from @nuxt/icon (e.g., 'lucide:sun', 'heroicons:moon')
   */
  icon: string

  /**
   * Accessible label for screen readers and tooltip
   * Required for accessibility
   */
  label: string

  /**
   * Visual style variant of the button
   * @default 'ghost'
   */
  variant?: IconButtonVariant

  /**
   * Size of the button
   * @default 'md'
   */
  size?: IconButtonSize

  /**
   * HTML button type attribute
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset'

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Whether the button is in loading state
   * @default false
   */
  loading?: boolean

  /**
   * Whether to use rounded-full for circular button
   * @default false
   */
  rounded?: boolean

  /**
   * Custom aria-label (overrides label prop)
   */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ghost',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  rounded: false,
  ariaLabel: undefined,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonProps = computed(() => ({
  variant: props.variant,
  size: props.size,
  type: props.type,
  disabled: props.disabled,
  loading: props.loading,
  rounded: props.rounded,
  onClick: (event: MouseEvent) => emit('click', event),
}))

const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-4 w-4'
    case 'lg':
      return 'h-6 w-6'
    case 'md':
    default:
      return 'h-5 w-5'
  }
})
</script>
