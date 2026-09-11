<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

const api = useApi()

interface Activity {
  id: number
  action: 'requested' | 'viewed' | 'issued' | 'returned' | 'cancelled'
  description?: string | null
  created_at: string

  user: {
    id: string
    name: string
  }

  job_card_part: {
    id: number
    quantity: string | number
    status: string

    job_card: {
      id: number
      job_card_number: string

      vehicle?: {
        registration_number: string
        make: string
        model: string
      } | null
    }

    part: {
      part_number: string
      name: string
      unit: string
    }

    task?: {
      id: number
      title: string
    } | null
  }
}

const activities = ref<Activity[]>([])
const loading = ref(false)
const error = ref('')

const fetchActivities = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      '/api/admin/store-manager/activity-history'
    )

    activities.value = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : []
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load Store Manager activity history.'
  } finally {
    loading.value = false
  }
}

const getIssueDelay = (activity: Activity) => {
  if (activity.action !== 'issued') {
    return null
  }

  const requestedActivity = activities.value.find(
    item =>
      item.job_card_part?.id === activity.job_card_part?.id &&
      item.action === 'requested'
  )

  if (!requestedActivity) {
    return null
  }

  const requestedAt = new Date(
    requestedActivity.created_at
  ).getTime()

  const issuedAt = new Date(
    activity.created_at
  ).getTime()

  return Math.max(
    0,
    Math.floor((issuedAt - requestedAt) / 60000)
  )
}

const getViewedDelay = (activity: Activity) => {
  if (activity.action !== 'viewed') {
    return null
  }

  const requestedActivity = activities.value.find(
    item =>
      item.job_card_part?.id === activity.job_card_part?.id &&
      item.action === 'requested'
  )

  if (!requestedActivity) {
    return null
  }

  const requestedAt = new Date(
    requestedActivity.created_at
  ).getTime()

  const viewedAt = new Date(
    activity.created_at
  ).getTime()

  return Math.max(
    0,
    Math.floor((viewedAt - requestedAt) / 60000)
  )
}

const getProcessingDelay = (activity: Activity) => {
  if (activity.action !== 'issued') {
    return null
  }

  const viewedActivity = activities.value.find(
    item =>
      item.job_card_part?.id === activity.job_card_part?.id &&
      item.action === 'viewed'
  )

  if (!viewedActivity) {
    return null
  }

  const viewedAt = new Date(
    viewedActivity.created_at
  ).getTime()

  const issuedAt = new Date(
    activity.created_at
  ).getTime()

  return Math.max(
    0,
    Math.floor((issuedAt - viewedAt) / 60000)
  )
}

const formatDelay = (minutes: number | null) => {
  if (minutes === null) {
    return '-'
  }

  if (minutes < 1) {
    return '< 1 min'
  }

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60

  return remaining
    ? `${hours}h ${remaining}m`
    : `${hours}h`
}

const actionLabel = (action: string) => {
  const labels: Record<string, string> = {
    requested: 'Part Requested',
    viewed: 'Request Viewed',
    issued: 'Part Issued',
    returned: 'Part Returned',
    cancelled: 'Request Cancelled',
  }

  return labels[action] || action
}

const actionClass = (action: string) => {
  const classes: Record<string, string> = {
    requested: 'badge-warning',
    viewed: 'badge-info',
    issued: 'badge-success',
    returned: 'badge-info',
    cancelled: 'badge-error',
  }

  return classes[action] || 'badge-ghost'
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchActivities()
})
</script>

<template>
  <div class="p-4 md:p-6">
    <div
      class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold">
          Store Manager Activity
        </h1>

        <p class="text-sm text-gray-800/60">
          Track parts requests, views, issues and returns
        </p>
      </div>

      <button
        class="btn btn-outline"
        :class="{ loading: loading }"
        :disabled="loading"
        @click="fetchActivities"
      >
        Refresh
      </button>
    </div>

    <div
      v-if="error"
      class="alert alert-error mb-4"
    >
      {{ error }}
    </div>

    <div
      v-if="loading && !activities.length"
      class="flex justify-center py-12"
    >
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div
      v-else-if="!activities.length"
      class="rounded-xl border border-gray-300 bg-gray-200/40 p-10 text-center"
    >
      <h2 class="text-lg font-semibold">
        No Activity Yet
      </h2>

      <p class="mt-1 text-sm text-gray-800/60">
        Store Manager activity will appear here.
      </p>
    </div>

    <div
      v-else
      class="overflow-x-auto rounded-xl border border-gray-300 bg-gray-100"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Activity</th>
            <th>Issue Delay</th>
            <th>Response Delay</th>
            <th>Processing Delay</th>
            <th>Performed By</th>
            <th>Job Card</th>
            <th>Vehicle</th>
            <th>Part</th>
            <th>Task</th>
            <th>Qty</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="activity in activities"
            :key="activity.id"
          >
            <td class="whitespace-nowrap">
              {{ formatDateTime(activity.created_at) }}
            </td>

            <td>
              <span
                class="badge"
                :class="actionClass(activity.action)"
              >
                {{ actionLabel(activity.action) }}
              </span>
            </td>

            <td>
                <template v-if="activity.action === 'issued'">
                    <span
                        class="badge"
                        :class="{
                            'badge-success':
                            (getIssueDelay(activity) ?? 0) <= 15,

                            'badge-warning':
                            (getIssueDelay(activity) ?? 0) > 15 &&
                            (getIssueDelay(activity) ?? 0) <= 30,

                            'badge-error':
                            (getIssueDelay(activity) ?? 0) > 30,
                        }"
                        >
                        {{ formatDelay(getIssueDelay(activity)) }}
                    </span>
                </template>

                <span v-else class="text-gray-800">--</span>
            </td>

            <td>
                <template v-if="activity.action === 'viewed'">
                    <span
                        class="badge"
                        :class="{
                            'badge-success':
                            (getViewedDelay(activity) ?? 0) <= 15,

                            'badge-warning':
                            (getViewedDelay(activity) ?? 0) > 15 &&
                            (getViewedDelay(activity) ?? 0) <= 30,

                            'badge-error':
                            (getViewedDelay(activity) ?? 0) > 30,
                        }"
                    >
                    {{ formatDelay(getViewedDelay(activity)) }}
                    </span>
                </template>

                <span
                    v-else
                    class="text-base-content/30"
                >
                    -
                </span>
            </td>

            <td>
                <template v-if="activity.action === 'issued'">
                    <span
                    class="badge"
                    :class="{
                        'badge-success':
                        (getProcessingDelay(activity) ?? 0) <= 15,

                        'badge-warning':
                        (getProcessingDelay(activity) ?? 0) > 15 &&
                        (getProcessingDelay(activity) ?? 0) <= 30,

                        'badge-error':
                        (getProcessingDelay(activity) ?? 0) > 30,
                    }"
                    >
                    {{ formatDelay(getProcessingDelay(activity)) }}
                    </span>
                </template>

                <span
                    v-else
                    class="text-base-content/30"
                >
                    -
                </span>
            </td>

            <td class="font-medium">
              {{ activity.user?.name || 'Unknown' }}
            </td>

            <td class="font-semibold">
              {{ activity.job_card_part?.job_card?.job_card_number || '-' }}
            </td>

            <td>
              <div
                v-if="activity.job_card_part?.job_card?.vehicle"
              >
                <p class="font-medium">
                  {{
                    activity.job_card_part.job_card.vehicle
                      .registration_number
                  }}
                </p>

                <p class="text-xs text-gray-800/50">
                  {{
                    activity.job_card_part.job_card.vehicle.make
                  }}
                  {{
                    activity.job_card_part.job_card.vehicle.model
                  }}
                </p>
              </div>

              <span v-else>-</span>
            </td>

            <td>
              <p class="font-medium">
                {{ activity.job_card_part?.part?.name || '-' }}
              </p>

              <p class="text-xs text-gray-800/50">
                {{
                  activity.job_card_part?.part?.part_number || ''
                }}
              </p>
            </td>

            <td>
              {{ activity.job_card_part?.task?.title || 'General' }}
            </td>

            <td>
              {{ activity.job_card_part?.quantity }}
              {{ activity.job_card_part?.part?.unit }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>