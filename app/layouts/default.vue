<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
    <AppHeader />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>

    <footer class="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div
        class="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400 sm:px-6 lg:px-8"
      >
        <p>© {{ new Date().getFullYear() }} - {{ $t('site.name') }}</p>
      </div>
    </footer>

    <ToastContainer />
  </div>
</template>
