<script setup lang="ts">
const route = useRoute()
const api = useApi()

interface Vehicle {
  id: number
  registration_number: string
  make: string
  model: string
  variant?: string | null
  fuel_type?: string | null
  current_odometer?: number | null
}

interface Task {
  id: number
  title: string
  description?: string | null
  status:
    | 'pending'
    | 'assigned'
    | 'in_progress'
    | 'on_hold'
    | 'completed'
    | 'cancelled'
  estimated_minutes?: number | null
  actual_minutes?: number | null
  started_at?: string | null
  completed_at?: string | null
  department?: {
    id: number
    name: string
  } | null
  bay?: {
    id: number
    name: string
    code: string
    type: string
  } | null
}

interface Part {
  id: number
  quantity: string | number
  status: string
  part: {
    part_number: string
    name: string
    unit: string
  }
}

interface JobCard {
  id: number
  job_card_number: string
  complaint: string
  estimated_cost?: string | number | null
  estimated_completion_at?: string | null
  status:
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'on_hold'
    | 'completed'
    | 'cancelled'
  created_at: string

  vehicle?: Vehicle | null

  department?: {
    id: number
    name: string
  } | null

  bay?: {
    id: number
    name: string
    code: string
    type: string
  } | null

  tasks: Task[]
  parts: Part[]
}

interface Customer {
  id: number
  customer_code: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  vehicles: Vehicle[]
  job_cards: JobCard[]
}

const customer = ref<Customer | null>(null)
const loading = ref(true)
const error = ref('')

const token = computed(() => String(route.params.token))

const fetchCustomer = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/public/customer/${token.value}`
    )

    customer.value = response.data?.data ?? response.data
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load customer information.'
  } finally {
    loading.value = false
  }
}

const activeJobCards = computed(() => {
  return (
    customer.value?.job_cards.filter(
      jobCard =>
        !['completed', 'cancelled'].includes(jobCard.status)
    ) || []
  )
})

const serviceHistory = computed(() => {
  return (
    customer.value?.job_cards.filter(
      jobCard =>
        ['completed', 'cancelled'].includes(jobCard.status)
    ) || []
  )
})

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
    assigned: 'Assigned',
  }

  return labels[status] || status
}

const statusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    assigned: 'badge-info',
    in_progress: 'badge-success',
    on_hold: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-error',
  }

  return classes[status] || 'badge-ghost'
}

const formatDate = (date?: string | null) => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getProgress = (jobCard: JobCard) => {
  const tasks = jobCard.tasks || []

  if (!tasks.length) {
    return 0
  }

  const completed = tasks.filter(
    task => task.status === 'completed'
  ).length

  return Math.round((completed / tasks.length) * 100)
}

onMounted(() => {
  fetchCustomer()
})
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Header -->
    <header class="border-b border-base-300 bg-base-100">
      <div class="mx-auto max-w-5xl px-4 py-4 md:px-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold">
              HITEK MOTORZ
            </h1>

            <p class="text-xs text-base-content/50">
              Vehicle Service Tracking
            </p>
          </div>

          <div class="text-right">
            <p class="text-xs text-base-content/50">
              Customer
            </p>

            <p class="font-semibold">
              {{ customer?.name || '...' }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <!-- Loading -->
      <div
        v-if="loading"
        class="flex justify-center py-20"
      >
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="mx-auto max-w-lg py-20"
      >
        <div class="alert alert-error">
          <span>{{ error }}</span>
        </div>
      </div>

      <template v-else-if="customer">
        <!-- Customer -->
        <section class="mb-6">
          <div class="card border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-base-content/50">
                    Welcome
                  </p>

                  <h2 class="text-2xl font-bold">
                    {{ customer.name }}
                  </h2>

                  <p class="text-sm text-base-content/60">
                    Customer ID: {{ customer.customer_code }}
                  </p>
                </div>

                <div class="text-sm sm:text-right">
                  <p v-if="customer.phone">
                    {{ customer.phone }}
                  </p>

                  <p
                    v-if="customer.email"
                    class="text-base-content/60"
                  >
                    {{ customer.email }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Active Services -->
        <section
          v-if="activeJobCards.length"
          class="mb-8"
        >
          <div class="mb-4">
            <h2 class="text-xl font-bold">
              Current Service
            </h2>

            <p class="text-sm text-base-content/60">
              Live status of your vehicle service
            </p>
          </div>

          <div class="grid gap-5">
            <div
              v-for="jobCard in activeJobCards"
              :key="jobCard.id"
              class="card border border-base-300 bg-base-100 shadow-sm"
            >
              <div class="card-body">
                <!-- Job Card Header -->
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="text-xs text-base-content/50">
                      Job Card
                    </p>

                    <h3 class="text-xl font-bold">
                      {{ jobCard.job_card_number }}
                    </h3>

                    <p
                      v-if="jobCard.vehicle"
                      class="mt-1 text-sm"
                    >
                      <span class="font-semibold">
                        {{ jobCard.vehicle.registration_number }}
                      </span>

                      ·
                      {{ jobCard.vehicle.make }}
                      {{ jobCard.vehicle.model }}

                      <span v-if="jobCard.vehicle.variant">
                        · {{ jobCard.vehicle.variant }}
                      </span>
                    </p>
                  </div>

                  <span
                    class="badge badge-lg"
                    :class="statusClass(jobCard.status)"
                  >
                    {{ statusLabel(jobCard.status) }}
                  </span>
                </div>

                <!-- Progress -->
                <div class="mt-5">
                  <div class="mb-2 flex justify-between text-sm">
                    <span class="font-medium">
                      Service Progress
                    </span>

                    <span class="text-base-content/60">
                      {{ getProgress(jobCard) }}%
                    </span>
                  </div>

                  <progress
                    class="progress progress-primary w-full"
                    :value="getProgress(jobCard)"
                    max="100"
                  ></progress>
                </div>

                <!-- Service details -->
                <div class="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p class="text-xs text-base-content/50">
                      Complaint
                    </p>

                    <p class="font-medium">
                      {{ jobCard.complaint }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs text-base-content/50">
                      Department
                    </p>

                    <p class="font-medium">
                      {{ jobCard.department?.name || '-' }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs text-base-content/50">
                      Expected Completion
                    </p>

                    <p class="font-medium">
                      {{ formatDate(jobCard.estimated_completion_at) }}
                    </p>
                  </div>
                </div>

                <!-- Tasks -->
                <div
                  v-if="jobCard.tasks?.length"
                  class="mt-6"
                >
                  <h4 class="mb-3 font-semibold">
                    Service Tasks
                  </h4>

                  <div class="space-y-2">
                    <div
                      v-for="task in jobCard.tasks"
                      :key="task.id"
                      class="flex items-center justify-between rounded-lg border border-base-300 p-3"
                    >
                      <div class="min-w-0">
                        <p class="font-medium">
                          {{ task.title }}
                        </p>

                        <p
                          v-if="task.department"
                          class="text-xs text-base-content/50"
                        >
                          {{ task.department.name }}

                          <span v-if="task.bay">
                            · {{ task.bay.name }}
                          </span>
                        </p>
                      </div>

                      <span
                        class="badge badge-sm shrink-0"
                        :class="statusClass(task.status)"
                      >
                        {{ statusLabel(task.status) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Parts -->
                <div
                  v-if="jobCard.parts?.length"
                  class="mt-6 border-t border-base-300 pt-5"
                >
                  <h4 class="mb-3 font-semibold">
                    Parts
                  </h4>

                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="part in jobCard.parts"
                      :key="part.id"
                      class="badge badge-outline"
                    >
                      {{ part.part.name }}
                      × {{ part.quantity }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Vehicles -->
        <section class="mb-8">
          <div class="mb-4">
            <h2 class="text-xl font-bold">
              My Vehicles
            </h2>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="vehicle in customer.vehicles"
              :key="vehicle.id"
              class="card border border-base-300 bg-base-100 shadow-sm"
            >
              <div class="card-body">
                <p class="text-lg font-bold">
                  {{ vehicle.registration_number }}
                </p>

                <p>
                  {{ vehicle.make }}
                  {{ vehicle.model }}

                  <span v-if="vehicle.variant">
                    · {{ vehicle.variant }}
                  </span>
                </p>

                <p
                  v-if="vehicle.current_odometer"
                  class="text-xs text-base-content/50"
                >
                  Odometer: {{ vehicle.current_odometer }} km
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Service History -->
        <section>
          <div class="mb-4">
            <h2 class="text-xl font-bold">
              Service History
            </h2>

            <p class="text-sm text-base-content/60">
              Previous services at HITEK MOTORZ
            </p>
          </div>

          <div
            v-if="serviceHistory.length"
            class="space-y-3"
          >
            <div
              v-for="jobCard in serviceHistory"
              :key="jobCard.id"
              class="rounded-xl border border-base-300 bg-base-100 p-4"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="font-semibold">
                    {{ jobCard.job_card_number }}
                  </p>

                  <p class="text-sm">
                    {{
                      jobCard.vehicle?.registration_number
                    }}
                    ·
                    {{ jobCard.vehicle?.make }}
                    {{ jobCard.vehicle?.model }}
                  </p>

                  <p class="text-xs text-base-content/50">
                    {{ formatDate(jobCard.created_at) }}
                  </p>
                </div>

                <span
                  class="badge"
                  :class="statusClass(jobCard.status)"
                >
                  {{ statusLabel(jobCard.status) }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-else
            class="rounded-xl border border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/60"
          >
            No previous service history.
          </div>
        </section>
      </template>
    </main>
  </div>
</template>