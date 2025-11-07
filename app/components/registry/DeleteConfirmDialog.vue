<template>
  <AlertDialog
    :open="open"
    :title="dialogTitle"
    :description="dialogDescription"
    :confirm-text="confirmText"
    confirm-variant="danger"
    :loading="loading"
    @confirm="$emit('confirm')"
    @cancel="$emit('cancel')"
    @update:open="$emit('update:open', $event)"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
  </AlertDialog>
</template>

<script setup lang="ts">
interface Props {
  itemType: 'repository' | 'tag'
  itemName: string
  repositoryName?: string
  open?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  repositoryName: undefined,
  open: false,
  loading: false,
})

defineEmits<{
  confirm: []
  cancel: []
  'update:open': [value: boolean]
}>()

const { t } = useI18n()

const dialogTitle = computed(() => {
  return props.itemType === 'repository'
    ? t('registry.repository.delete.title')
    : t('registry.tag.delete.title')
})

const dialogDescription = computed(() => {
  if (props.itemType === 'repository') {
    return t('registry.repository.delete.description', { name: props.itemName })
  }

  return t('registry.tag.delete.description', {
    tag: props.itemName,
    repository: props.repositoryName || '',
  })
})

const confirmText = computed(() => {
  return props.itemType === 'repository'
    ? t('registry.repository.delete.confirm')
    : t('registry.tag.delete.confirm')
})
</script>
