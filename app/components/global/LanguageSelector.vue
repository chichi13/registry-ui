<template>
  <DropdownMenuRoot v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="md" :class="isOpen ? 'bg-gray-100 dark:bg-slate-700' : ''">
        <Icon name="ph:translate" class="h-5 w-5" />
        <span>{{ t('locale.' + locale) }}</span>
        <Icon
          name="ph:caret-down"
          class="h-4 w-4 transition-all duration-200"
          :class="{ 'rotate-180': isOpen }"
        />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :side-offset="4"
        align="end"
        class="z-50 min-w-32 rounded-lg border border-gray-100 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-700"
      >
        <DropdownMenuItem
          v-for="lang in availableLocales"
          :key="lang"
          :class="[
            'cursor-pointer rounded-md px-4 py-2 text-gray-600 outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-white dark:hover:bg-slate-600 dark:focus:bg-slate-600',
            { 'bg-gray-100 dark:bg-slate-600': locale === lang },
          ]"
          @select="switchLanguage(lang)"
        >
          {{ t('locale.' + lang) }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'reka-ui'

const { locale, t, availableLocales, setLocale } = useI18n()
const isOpen = ref(false)

function switchLanguage(lang: string) {
  if (setLocale) {
    setLocale(lang)
  } else {
    locale.value = lang
  }
}
</script>
