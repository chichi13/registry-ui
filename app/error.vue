<script setup lang="ts">
defineProps({ error: { type: Object, default: null } })
</script>
<template>
  <div class="p-20 text-slate-900 dark:bg-slate-900 dark:text-white">
    <div class="relative flex flex-col justify-center gap-y-4 text-center sm:h-40 sm:gap-y-5">
      <p class="mb-[-1em] font-semibold text-slate-500 dark:text-slate-300">
        {{ error.statusCode }}
      </p>
      <h1 class="text-xl font-medium">
        <template v-if="error.statusCode == 404">
          {{ $t('error.page-not-found') }}
        </template>
        <template v-else>
          {{ error.message }}
        </template>
      </h1>
      <Button
        variant="secondary"
        size="md"
        class="mx-auto mt-3"
        @click="clearError({ redirect: '/' })"
      >
        <Icon name="ph:arrow-left-bold" class="h-5 w-5" />
        {{ $t('error.return') }}
      </Button>
    </div>
  </div>
</template>
