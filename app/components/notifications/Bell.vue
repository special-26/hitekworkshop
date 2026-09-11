<script setup lang="ts">
interface NotificationItem {
  id: string
  type: string
  data: {
    type?: string
    title?: string
    message?: string
    job_card_id?: number
    job_card_number?: string
  }
  read_at?: string | null
  created_at: string
}

const api = useApi()
const router = useRouter()

const notifications = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const loading = ref(false)
const open = ref(false)

const fetchUnreadCount = async () => {
  try {
    const response = await api(
      '/api/admin/notifications/unread-count'
    )

    unreadCount.value =
      response.data?.count ??
      response.count ??
      0
  } catch (error) {
    console.error(
      'Unable to load notification count:',
      error
    )
  }
}

const fetchNotifications = async () => {
  loading.value = true

  try {
    const response = await api('/api/admin/notifications')

    const data =
      response.data?.data ??
      response.data ??
      []

    notifications.value = Array.isArray(data)
      ? data
      : []
  } catch (error) {
    console.error(
      'Unable to load notifications:',
      error
    )
  } finally {
    loading.value = false
  }
}

const toggleNotifications = async () => {
  open.value = !open.value

  if (open.value) {
    await fetchNotifications()
  }
}

const markAsRead = async (
  notification: NotificationItem
) => {
  if (!notification.read_at) {
    try {
      await api(
        `/api/admin/notifications/${notification.id}/read`,
        {
          method: 'PATCH',
        }
      )

      notification.read_at = new Date().toISOString()

      unreadCount.value = Math.max(
        0,
        unreadCount.value - 1
      )
    } catch (error) {
      console.error(
        'Unable to mark notification as read:',
        error
      )
    }
  }

  if (notification.data.task_id) {
    open.value = false

    await router.push(
      `/coordinator/tasks/${notification.data.task_id}`
    )

    return
  }

  if (notification.data.job_card_id) {
    open.value = false

    await router.push(
      `/job-cards/${notification.data.job_card_id}`
    )
  }
}

const formatTime = (date: string) => {
  const value = new Date(date)

  if (Number.isNaN(value.getTime())) {
    return ''
  }

  return value.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchUnreadCount()
})
</script>

<template>
  <div class="relative">
    <!-- Bell -->
    <button
      class="w-6 h-6 rounded-full relative"
      type="button"
      @click="toggleNotifications"
    >
      <Icon name="lucide:bell" class="w-6 h-6" />

      <span
        v-if="unreadCount > 0"
        class="badge badge-sm bg-red-500 absolute -right-2 -top-2 rounded-full w-4 h-5 text-white font-bold text-xs flex items-center justify-center"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
      <span
        v-else
        class="badge badge-sm bg-green-500 absolute -right-2 -top-2 rounded-full w-4 h-5 text-white font-bold text-xs flex items-center justify-center"
      >
        0
      </span>
    </button>

    <!-- Dropdown -->
    <div
      v-if="open"
      class="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-box border-2 border-gray-300 bg-base-100 shadow-xl"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-gray-300 px-4 py-3"
      >
        <div>
          <h3 class="font-semibold">
            Notifications
          </h3>

          <p
            v-if="unreadCount"
            class="text-xs text-base-content/50"
          >
            {{ unreadCount }} unread
          </p>
        </div>

        <button
          class="btn btn-ghost btn-xs bg-red-500 text-white"
          type="button"
          @click="open = false"
        >
          ✕
        </button>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex justify-center p-6"
      >
        <span class="loading loading-spinner" />
      </div>

      <!-- Empty -->
      <div
        v-else-if="notifications.length === 0"
        class="p-8 text-center text-sm text-base-content/50"
      >
        No notifications yet.
      </div>

      <!-- Notifications -->
      <div
        v-else
        class="max-h-96 overflow-y-auto"
      >
        <button
          v-for="notification in notifications"
          :key="notification.id"
          type="button"
          class="w-full border-b border-gray-300 px-4 py-3 text-left transition hover:bg-base-200"
          :class="{
            'bg-base-200/60':
              !notification.read_at,
          }"
          @click="markAsRead(notification)"
        >
          <div class="flex gap-3">
            <div class="pt-0.5">
              <span
                v-if="!notification.read_at"
                class="block h-2.5 w-2.5 rounded-full bg-primary"
              />
              <span
                v-else
                class="block h-2.5 w-2.5"
              />
            </div>

            <div class="min-w-0 flex-1">
              <p
                class="text-sm"
                :class="{
                  'font-semibold':
                    !notification.read_at,
                }"
              >
                {{
                  notification.data.title ||
                  'Notification'
                }}
              </p>

              <p
                class="mt-1 text-xs text-base-content/60"
              >
                {{
                  notification.data.message ||
                  ''
                }}
              </p>

              <p
                class="mt-2 text-[11px] text-base-content/40"
              >
                {{ formatTime(notification.created_at) }}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>