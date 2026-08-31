import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { 
    enabled: true 
  },
  devServer: {
    host: '0.0.0.0',
    port: 3000
  },
  modules: ['@qirolab/nuxt-sanctum-authentication', '@nuxt/icon','@nuxtjs/color-mode'],
  ssr: false,

  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://127.0.0.1:8000'
    }
  },

  laravelSanctum: {
    apiUrl: 'http://127.0.0.1:8000',
    authMode: "cookie",

    sanctumEndpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/api/login',
      logout: '/api/logout',
      user: '/api/user',
    },
    
    redirect: {
      enableIntendedRedirect: false,
      loginPath: '/auth/login',
      guestOnlyRedirect: '/',
      redirectToAfterLogin: '/',
      redirectToAfterLogout: '/',
    },
  },

  icon: {
    mode: 'css',
    cssLayer: 'base'
  },

  vite: {
    plugins: [tailwindcss() as any],
  },
  css: ['~/assets/css/main.css'],
})