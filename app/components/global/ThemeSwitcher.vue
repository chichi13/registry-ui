<template>
  <ClientOnly>
    <IconButton
      v-if="name"
      v-bind="$attrs"
      :icon="name"
      label="Toggle color modes"
      variant="ghost"
      size="md"
      @click="toggleColorMode"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

type ThemeMode = 'dark' | 'system' | 'light'

const themeConfig: Record<ThemeMode, { next: ThemeMode; icon: string }> = {
  dark: { next: 'system', icon: 'ph:moon' },
  system: { next: 'light', icon: 'ph:sun-horizon' },
  light: { next: 'dark', icon: 'ph:sun' },
}

const name = ref<string | null>(null)

const toggleColorMode = () => {
  const currentMode = colorMode.preference as ThemeMode
  const { next } = themeConfig[currentMode]
  Object.assign(colorMode, { preference: next, value: next })
  name.value = themeConfig[next].icon
}

onMounted(() => {
  const currentMode = colorMode.preference as ThemeMode
  name.value = themeConfig[currentMode].icon
})
</script>
