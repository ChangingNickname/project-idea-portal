// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-27',
  devtools: { enabled: true },

  devServer: {
    port: 4000,
    host: '0.0.0.0'
  },
  ssr: false,
  app: {
    head: {
      title: 'Project Ideas Portal',
      meta: [
        { name: 'description', content: 'Project Ideas Portal' }
      ]
    }
  },
  modules: [
    '@nuxt/ui', 
    '@nuxt/eslint', 
    '@nuxtjs/i18n'],

  css: ['~/assets/css/main.css'],

  future: {
    compatibilityVersion: 4
  },

  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID
    },
    jwtSecret: process.env.JWT_SECRET
  },

  i18n: {
    bundle: {
      optimizeTranslationDirective: true
    },

    strategy: 'prefix',
    defaultLocale: 'ru',
    baseUrl: 'http://localhost:3000',
    lazy: true,
    locales: [
      {code: 'en', name: "English", language: 'en', file: 'en.ts', icon: 'i-flag-gb-4x3'},
      {code: 'es', name: "Español", language: 'es', file: 'es.ts', icon: 'i-flag-es-4x3'},
      {code: 'fr', name: "Français", language: 'fr', file: 'fr.ts', icon: 'i-flag-fr-4x3'},
      {code: 'de', name: "Deutsch", language: 'de', file: 'de.ts', icon: 'i-flag-de-4x3'},
      {code: 'ja', name: "日本語", language: 'ja', file: 'ja.ts', icon: 'i-flag-jp-4x3'},
      {code: 'it', name: "Italiano", language: 'it', file: 'it.ts', icon: 'i-flag-it-4x3'},
      {code: 'ko', name: "한국어", language: 'ko', file: 'ko.ts', icon: 'i-flag-kr-4x3'},
      {code: 'zh', name: "中文", language: 'zh', file: 'zh.ts', icon: 'i-flag-cn-4x3'},
      {code: 'pt', name: "Português", language: 'pt', file: 'pt.ts', icon: 'i-flag-pt-4x3'},
      {code: 'hi', name: "हिन्दी", language: 'hi', file: 'hi.ts', icon: 'i-flag-in-4x3'},
      {code: 'kk', name: "Қазақша", language: 'kk', file: 'kk.ts', icon: 'i-flag-kz-4x3'},
      {code: 'ru', name: "Русский", language: 'ru', file: 'ru.ts', icon: 'i-flag-ru-4x3'}
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18nRed',
      redirectOn: 'root',
    },
  }
})