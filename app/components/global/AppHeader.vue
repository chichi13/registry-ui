<template>
  <header
    class="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center gap-6">
          <NuxtLink to="/" class="flex items-center gap-3">
            <Icon name="logos:docker-icon" class="h-8 w-8" />
            <span class="text-xl font-bold text-gray-900 dark:text-white">
              {{ $t('site.name') }}
            </span>
          </NuxtLink>
        </div>

        <div class="flex items-center gap-2">
          <ThemeSwitcher
            class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          />
          <LanguageSelector />
        </div>
      </div>

      <div class="flex pb-2 md:hidden">
        <ul class="flex items-center gap-1">
          <li>
            <NuxtLink
              to="/"
              class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {{ $t('registry.repository.title') }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </header>
</template>
