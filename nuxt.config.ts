// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  //ssr:false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      // Public registry URL for frontend (docker pull commands)
      // Override at runtime with NUXT_PUBLIC_REGISTRY_URL env var
      registryUrl: 'localhost:5000',
      // Log level for client-side logging
      // 0=silent, 1=error, 2=warn, 3=info, 4=debug, 5=trace
      // Default: 1 (error only) in production, 4 (debug) in development
      logLevel: process.env.NUXT_PUBLIC_LOG_LEVEL
        ? parseInt(process.env.NUXT_PUBLIC_LOG_LEVEL)
        : process.env.NODE_ENV === 'production'
          ? 1
          : 4,
    },
  },
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/device',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
  ],
  nitro: {
    compressPublicAssets: true,
    logLevel: 4,
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
    exposeConfig: false,
    viewer: true,
  },

  postcss: {
    plugins: {
      'postcss-import': {},
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  imports: {
    dirs: ['app/stores'],
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'color-mode',
    storage: 'localStorage',
    disableTransition: false,
  },

  image: {
    provider: 'ipx',
    quality: 80,
    format: ['webp', 'png', 'jpeg'],
  },

  googleFonts: {
    families: {
      Inter: true,
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
  },

  i18n: {
    defaultLocale: 'en-US',
    langDir: './locales',
    strategy: 'no_prefix',
    locales: [
      { code: 'en-US', iso: 'en-US', file: 'en-US.json' },
      { code: 'fr-FR', iso: 'fr-FR', file: 'fr-FR.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'nuxt-lang',
      redirectOn: 'root',
    },
  },
})
