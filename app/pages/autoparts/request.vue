<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

const api = useApi()

interface PendingPartRequest {
    id: number
    job_card_id: number
    quantity: string | number
    status: 'pending' | 'issued' | 'returned' | 'cancelled'

    job_card: {
        id: number
        job_card_number: string
        customer?: {
        id: number
        name: string
        phone?: string
        } | null
        vehicle?: {
        id: number
        registration_number: string
        make: string
        model: string
        } | null
    }

    task?: {
        id: number
        title: string
    } | null

    part: {
        id: number
        part_number: string
        name: string
        unit: string
        current_stock: string | number
    }

    activities?: {
        id: number
        action: string
        description?: string | null
        created_at: string
    }[]
}

const requests = ref<PendingPartRequest[]>([])
const loading = ref(false)
const issuingId = ref<number | null>(null)
const error = ref('')
const success = ref('')

const fetchRequests = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api('/api/admin/job-card-parts/pending')

    requests.value = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : []

    // Mark pending requests as viewed
    await Promise.all(
        requests.value.map(request =>
            api(
            `/api/admin/job-card-parts/${request.id}/viewed`,
            {
                method: 'PATCH',
            }
            ).catch(err => {
            console.error(
                `Unable to mark request ${request.id} as viewed:`,
                err
            )
            })
        )
    )
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load pending parts requests.'
  } finally {
    loading.value = false
  }
}

const issuePart = async (request: PendingPartRequest) => {
  if (issuingId.value) return

  issuingId.value = request.id
  error.value = ''
  success.value = ''

  try {
    await api(
      `/api/admin/job-cards/${request.job_card_id}/parts/${request.id}/issue`,
      {
        method: 'PATCH',
      }
    )

    success.value = `${request.part.name} issued successfully.`

    await fetchRequests()
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to issue part.'
  } finally {
    issuingId.value = null
  }
}

const waitingTime = (request: PendingPartRequest) => {
  const requestedActivity = request.activities?.find(
    activity => activity.action === 'requested'
  )

  if (!requestedActivity) {
    return 'Waiting'
  }

  const requestedAt = new Date(
    requestedActivity.created_at
  ).getTime()

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - requestedAt) / 60000)
  )

  if (minutes < 1) {
    return 'Just now'
  }

  if (minutes < 60) {
    return `Waiting ${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60

  return remaining
    ? `Waiting ${hours}h ${remaining}m`
    : `Waiting ${hours}h`
}

onMounted(() => {
  fetchRequests()
})
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Parts Requests
        </h1>

        <p class="text-sm text-base-content/60">
          Parts waiting to be issued for workshop jobs
        </p>
      </div>

      <button
        class="btn btn-outline"
        :class="{ loading: loading }"
        :disabled="loading"
        @click="fetchRequests"
      >
        Refresh
      </button>
    </div>

    <div
      v-if="error"
      class="alert alert-error mb-4"
    >
      <span>{{ error }}</span>
    </div>

    <div
      v-if="success"
      class="alert alert-success mb-4"
    >
      <span>{{ success }}</span>
    </div>

    <div
      v-if="loading && !requests.length"
      class="flex justify-center py-12"
    >
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div
      v-else-if="!requests.length"
      class="rounded-xl border border-base-300 bg-base-200/40 p-10 text-center"
    >
      <div class="text-4xl mb-3">
        ✓
      </div>

      <h2 class="text-lg font-semibold">
        No Pending Parts
      </h2>

      <p class="mt-1 text-sm text-base-content/60">
        All requested parts have been issued.
      </p>
    </div>

    <div
      v-else
      class="grid gap-4"
    >
      <div
        v-for="request in requests"
        :key="request.id"
        class="card border border-base-300 bg-base-100 shadow-sm"
      >
        <div class="card-body p-4">
          <!-- Job / Vehicle -->
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="text-xs text-base-content/50">
                Job Card
              </p>

              <h2 class="text-lg font-bold">
                {{ request.job_card.job_card_number }}
              </h2>

              <p
                v-if="request.job_card.vehicle"
                class="text-sm text-base-content/70"
              >
                {{ request.job_card.vehicle.registration_number }}
                ·
                {{ request.job_card.vehicle.make }}
                {{ request.job_card.vehicle.model }}
              </p>

              <p
                v-if="request.job_card.customer"
                class="text-sm text-base-content/60"
              >
                Customer: {{ request.job_card.customer.name }}
              </p>
            </div>

            <div class="flex flex-col items-end gap-1">
                <span class="badge badge-warning">
                    Pending
                </span>

                <span
                    class="text-xs"
                    :class="
                    waitingTime(request).includes('h') ||
                    (
                        Number(
                        request.activities?.find(
                            activity => activity.action === 'requested'
                        )
                            ? Math.floor(
                                (
                                Date.now() -
                                new Date(
                                    request.activities.find(
                                    activity => activity.action === 'requested'
                                    )!.created_at
                                ).getTime()
                                ) / 60000
                            )
                            : 0
                        ) >= 30
                    )
                        ? 'text-error font-semibold'
                        : 'text-base-content/60'
                    "
                >
                    ⏱ {{ waitingTime(request) }}
                </span>
            </div>
          </div>

          <div class="divider my-2"></div>

          <!-- Part details -->
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p class="text-xs text-base-content/50">
                Part
              </p>

              <p class="font-semibold">
                {{ request.part.name }}
              </p>

              <p class="text-xs text-base-content/50">
                {{ request.part.part_number }}
              </p>
            </div>

            <div>
              <p class="text-xs text-base-content/50">
                Task
              </p>

              <p class="font-medium">
                {{ request.task?.title || 'General' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-base-content/50">
                Requested
              </p>

              <p class="font-semibold">
                {{ request.quantity }} {{ request.part.unit }}
              </p>
            </div>

            <div>
              <p class="text-xs text-base-content/50">
                Current Stock
              </p>

              <p
                class="font-semibold"
                :class="{
                  'text-error':
                    Number(request.part.current_stock) <
                    Number(request.quantity),
                }"
              >
                {{ request.part.current_stock }}
                {{ request.part.unit }}
              </p>
            </div>
          </div>

          <!-- Action -->
          <div class="mt-4 flex justify-end">
            <button
              class="btn btn-primary"
              :disabled="issuingId !== null"
              :class="{
                loading: issuingId === request.id,
              }"
              @click="issuePart(request)"
            >
              Issue Part
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>