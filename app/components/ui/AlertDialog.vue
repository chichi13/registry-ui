<template>
  <AlertDialogRoot v-model:open="isOpen">
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />
      <AlertDialogContent
        class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <AlertDialogTitle class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="mb-4 text-gray-600 dark:text-gray-400">
          {{ description }}
        </AlertDialogDescription>
        <ButtonGroup spacing="md" justify="end">
          <AlertDialogCancel as-child>
            <Button variant="outline-secondary" :disabled="loading" @click="handleCancel">
              {{ cancelText || $t('common.cancel') }}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <Button
              :variant="confirmVariant"
              :loading="loading"
              :disabled="loading"
              @click="handleConfirm"
            >
              {{ confirmText || $t('common.confirm') }}
            </Button>
          </AlertDialogAction>
        </ButtonGroup>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from 'reka-ui'

interface Props {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: undefined,
  cancelText: undefined,
  confirmVariant: 'primary',
  open: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:open': [value: boolean]
}>()

const isOpen = ref(props.open)
const loading = ref(false)

const handleConfirm = async () => {
  loading.value = true
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}

watch(
  () => props.open,
  newValue => {
    isOpen.value = newValue
    loading.value = false
  }
)

watch(isOpen, newValue => {
  emit('update:open', newValue)
})
</script>
