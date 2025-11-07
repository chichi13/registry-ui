<template>
  <div ref="dropdownRef" class="w-auto">
    <Button
      variant="ghost"
      size="md"
      :class="[
        { 'flex-row-reverse': t('locale.dir') === 'rtl' },
        isOpen ? 'bg-gray-100 dark:bg-slate-700' : '',
      ]"
      @click="isOpen = !isOpen"
    >
      <Icon name="ph:translate" class="h-5 w-5" />
      <span>{{ t('locale.' + locale) }}</span>
      <Icon
        name="ph:caret-down"
        class="h-4 w-4 transition-all duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </Button>

    <div
      v-if="isOpen"
      class="absolute right-3 mt-1 min-w-32 rounded-lg border border-gray-100 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-700"
    >
      <ul>
        <li
          v-for="lang in availableLocales"
          :key="lang"
          :class="[
            'm-1 cursor-pointer rounded-md px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-white dark:hover:bg-slate-600',
            { 'bg-gray-100 dark:bg-slate-600': locale === lang },
            { 'text-right': t('locale.dir') === 'rtl' },
          ]"
          @click="switchLanguage(lang)"
        >
          <span class="block w-full cursor-pointer">{{ t('locale.' + lang) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const { locale, t, availableLocales, setLocale } = useI18n()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

onMounted(() => {
  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as Node
    if (dropdownRef.value && !dropdownRef.value.contains(target)) {
      isOpen.value = false
    }
  })
})

function switchLanguage(lang: string) {
  if (setLocale) {
    setLocale(lang)
  } else {
    locale.value = lang
  }
  isOpen.value = false
}
</script>
