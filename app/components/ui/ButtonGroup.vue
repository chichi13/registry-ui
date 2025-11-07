<template>
  <div :class="groupClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Orientation = 'horizontal' | 'vertical'
type Spacing = 'none' | 'sm' | 'md' | 'lg'
type JustifyContent = 'start' | 'center' | 'end' | 'between'

interface Props {
  /**
   * Layout direction of the button group
   * @default 'horizontal'
   */
  orientation?: Orientation

  /**
   * Spacing between buttons
   * Use 'none' for attached buttons
   * @default 'md'
   */
  spacing?: Spacing

  /**
   * Whether buttons should be attached (no spacing, rounded corners only on edges)
   * @default false
   */
  attached?: boolean

  /**
   * Horizontal alignment of buttons
   * @default 'start'
   */
  justify?: JustifyContent

  /**
   * Whether buttons should take full width of container
   * @default false
   */
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  spacing: 'md',
  attached: false,
  justify: 'start',
  fullWidth: false,
})

const groupClasses = computed(() => {
  const classes = ['flex']

  // Orientation
  if (props.orientation === 'vertical') {
    classes.push('flex-col')
  } else {
    classes.push('flex-row')
  }

  // Spacing (only if not attached)
  if (!props.attached) {
    const spacingMap: Record<Spacing, string> = {
      none: 'gap-0',
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-3',
    }
    classes.push(spacingMap[props.spacing])
  }

  // Justify content
  const justifyMap: Record<JustifyContent, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  }
  classes.push(justifyMap[props.justify])

  // Full width
  if (props.fullWidth) {
    classes.push('w-full')
    // Make children fill available space
    classes.push('[&>*]:flex-1')
  }

  // Attached mode: remove rounded corners between buttons
  if (props.attached) {
    if (props.orientation === 'horizontal') {
      // Remove right rounded corners from all but last
      classes.push('[&>*:not(:last-child)]:rounded-r-none')
      // Remove left rounded corners from all but first
      classes.push('[&>*:not(:first-child)]:rounded-l-none')
      // Remove left border from all but first (to prevent double borders)
      classes.push('[&>*:not(:first-child)]:-ml-px')
    } else {
      // Vertical attached
      // Remove bottom rounded corners from all but last
      classes.push('[&>*:not(:last-child)]:rounded-b-none')
      // Remove top rounded corners from all but first
      classes.push('[&>*:not(:first-child)]:rounded-t-none')
      // Remove top border from all but first (to prevent double borders)
      classes.push('[&>*:not(:first-child)]:-mt-px')
    }
  }

  return classes.join(' ')
})
</script>
