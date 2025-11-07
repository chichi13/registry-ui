<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <span v-if="loading && iconPosition === 'left'" :class="spinnerClasses" />
    <slot v-if="!loading && iconPosition === 'left'" name="icon-left" />
    <slot />
    <slot v-if="!loading && iconPosition === 'right'" name="icon-right" />
    <span v-if="loading && iconPosition === 'right'" :class="spinnerClasses" />
  </Primitive>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from 'reka-ui'

type ButtonVariant =
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
  | 'link'

type ButtonSize = 'sm' | 'md' | 'lg'
type IconPosition = 'left' | 'right' | 'only'

interface Props {
  /**
   * Visual style variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant

  /**
   * Size of the button
   * @default 'md'
   */
  size?: ButtonSize

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
   * Shows a spinner and prevents interaction
   * @default false
   */
  loading?: boolean

  /**
   * Whether the button should take full width of its container
   * @default false
   */
  fullWidth?: boolean

  /**
   * Whether this is an icon-only button (no text)
   * Automatically adjusts sizing to be square
   * @default false
   */
  iconOnly?: boolean

  /**
   * Position of the icon relative to text
   * Use 'only' when iconOnly is true
   * @default 'left'
   */
  iconPosition?: IconPosition

  /**
   * Whether to use rounded-full for circular buttons
   * Only applies when iconOnly is true
   * @default false
   */
  rounded?: boolean

  /**
   * The element or component this should render as
   * @default 'button'
   */
  as?: string

  /**
   * Change the default rendered element for the one passed as a child
   * @default false
   */
  asChild?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false,
  iconOnly: false,
  iconPosition: 'left',
  rounded: false,
  as: 'button',
  asChild: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const baseClasses =
  'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  // Primary: Dark gray/white with subtle contrast
  primary:
    'bg-gray-900 text-white shadow-sm hover:bg-gray-800 focus-visible:ring-gray-500 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200',

  // Secondary: Light gray backgrounds
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',

  // Danger: Minimal red, only for critical actions
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700',

  // Ghost: Transparent with hover
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800',

  // Outline variants: Subtle borders
  'outline-primary':
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750',

  'outline-secondary':
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750',

  'outline-danger':
    'border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-400 dark:border-red-900/50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/10',

  // Soft variants: Very light tinted backgrounds (like badges)
  'soft-primary':
    'bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',

  'soft-secondary':
    'bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',

  'soft-success':
    'bg-green-50 text-green-700 hover:bg-green-100 focus-visible:ring-green-400 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30',

  'soft-warning':
    'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 focus-visible:ring-yellow-400 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/30',

  'soft-danger':
    'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-400 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30',

  link: 'bg-transparent text-gray-700 hover:text-gray-900 hover:underline focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:text-gray-100',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 w-8 p-0',
  md: 'h-10 w-10 p-0',
  lg: 'h-12 w-12 p-0',
}

const gapClasses: Record<ButtonSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2',
}

const buttonClasses = computed(() => {
  const classes = [baseClasses, variantClasses[props.variant]]

  if (props.iconOnly) {
    classes.push(iconOnlySizeClasses[props.size])
    if (props.rounded) {
      classes.push('rounded-full')
    } else {
      classes.push('rounded-md')
    }
    if (props.variant === 'ghost' || props.variant.startsWith('outline-')) {
      classes.push('hover:scale-105')
    }
  } else {
    classes.push(sizeClasses[props.size])
    classes.push(gapClasses[props.size])
    classes.push('rounded-md')
  }

  if (props.fullWidth) {
    classes.push('w-full')
  }

  return classes.join(' ')
})

const spinnerClasses = computed(() => {
  const size = props.size === 'sm' ? 'h-3 w-3' : props.size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  return `inline-block ${size} animate-spin rounded-full border-2 border-current border-t-transparent`
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
