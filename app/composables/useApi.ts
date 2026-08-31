export const useApi = () => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    credentials: 'include',

    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    },

    async onRequest({ options }) {
      if (!import.meta.client) {
        return
      }

      const method = String(options.method || 'GET').toUpperCase()

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrfToken = useCookie('XSRF-TOKEN')

        if (!csrfToken.value) {
          await $fetch('/sanctum/csrf-cookie', {
            baseURL: config.public.apiBaseUrl,
            credentials: 'include'
          })
        }

        const token = useCookie('XSRF-TOKEN').value

        if (token) {
          options.headers = new Headers(options.headers)

          options.headers.set(
            'X-XSRF-TOKEN',
            decodeURIComponent(token)
          )
        }
      }
    }
  })

  return api
}