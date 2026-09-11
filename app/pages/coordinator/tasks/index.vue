<script setup lang="ts">
interface Customer {
  id: number
  customer_code: string
  name: string
  phone: string
}

interface Vehicle {
  id: number
  registration_number: string
  make: string
  model: string
  variant?: string | null
}

interface JobCard {
  id: number
  job_card_number: string
  customer: Customer
  vehicle: Vehicle
  complaint?: string | null
}

interface Department {
  id: number
  name: string
}

interface Bay {
  id: number
  name: string
  code: string
  type: string
}

interface Employee {
  id: number
  user_id: string
  employee_code: string
  designation?: string | null
  department_id: number
  status: string
  user?: {
    id: string
    name: string
  }
}

interface JobCardPart {
  id: number
  part_id: number
  quantity: string | number
  status: 'pending' | 'issued' | 'returned' | 'cancelled'
  part: {
    id: number
    part_number: string
    name: string
    category?: string | null
    brand?: string | null
    unit: string
  }
}

interface CoordinatorTask {
  id: number
  job_card_id: number
  department_id: number
  bay_id?: number | null
  assigned_to?: number | null
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
  labour_cost?: string | number | null
  started_at?: string | null
  completed_at?: string | null
  notes?: string | null

  job_card: JobCard
  department: Department
  bay?: Bay | null
  assigned_employee?: Employee | null
  parts?: JobCardPart[]
}



const api = useApi()
const route = useRoute()

const tasks = ref<CoordinatorTask[]>([])
const departments = ref<Department[]>([])
const bays = ref<Bay[]>([])

const loading = ref(true)
const error = ref('')

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

const filters = ref({
  status: typeof route.query.status === 'string'
    ? route.query.status
    : '',
  department_id: '',
  bay_id: '',
})

/*
|--------------------------------------------------------------------------
| Fetch Tasks
|--------------------------------------------------------------------------
*/

const fetchTasks = async () => {
  loading.value = true
  error.value = ''

  try {
    const params = new URLSearchParams()

    if (filters.value.status) {
      params.append('status', filters.value.status)
    }

    if (filters.value.department_id) {
      params.append(
        'department_id',
        filters.value.department_id
      )
    }

    if (filters.value.bay_id) {
      params.append(
        'bay_id',
        filters.value.bay_id
      )
    }

    const query = params.toString()

    const response = await api(
      `/api/admin/coordinator/tasks${query ? `?${query}` : ''}`
    )

    const data = response.data

    // console.log('Fetched tasks:', data);

    tasks.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load workshop tasks.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Fetch Departments
|--------------------------------------------------------------------------
*/

const fetchDepartments = async () => {
  try {
    const response = await api(
      '/api/admin/departments'
    )

    const data = response.data

    departments.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
  } catch (err) {
    console.error(
      'Unable to load departments',
      err
    )
  }
}

/*
|--------------------------------------------------------------------------
| Fetch Bays
|--------------------------------------------------------------------------
*/

const fetchBays = async () => {
  try {
    const response = await api(
      '/api/admin/bays'
    )

    const data = response.data

    bays.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
  } catch (err) {
    console.error(
      'Unable to load bays',
      err
    )
  }
}

/*
|--------------------------------------------------------------------------
| Filtered Bays
|--------------------------------------------------------------------------
*/

const filteredBays = computed(() => {
  if (!filters.value.department_id) {
    return bays.value
  }

  return bays.value.filter(
    bay =>
      bay.department_id ===
      Number(filters.value.department_id)
  )
})

/*
|--------------------------------------------------------------------------
| Reset Bay when Department changes
|--------------------------------------------------------------------------
*/

watch(
  () => filters.value.department_id,
  () => {
    if (
      filters.value.bay_id &&
      !filteredBays.value.some(
        bay =>
          bay.id ===
          Number(filters.value.bay_id)
      )
    ) {
      filters.value.bay_id = ''
    }
  }
)

watch(
  () => route.query.status,
  (status) => {
    filters.value.status =
      typeof status === 'string'
        ? status
        : ''

    fetchTasks()
  }
)

/*
|--------------------------------------------------------------------------
| Status Helpers
|--------------------------------------------------------------------------
*/

const statusLabel = (
  status: CoordinatorTask['status']
) => {
  return status.replace('_', ' ')
}

const statusClass = (
  status: CoordinatorTask['status']
) => {
  switch (status) {
    case 'pending':
      return 'badge-ghost'

    case 'assigned':
      return 'badge-info'

    case 'in_progress':
      return 'badge-success'

    case 'on_hold':
      return 'badge-warning'

    case 'completed':
      return 'badge-success'

    case 'cancelled':
      return 'badge-error'

    default:
      return 'badge-ghost'
  }
}

/*
|--------------------------------------------------------------------------
| Summary Counts
|--------------------------------------------------------------------------
*/

const taskCounts = computed(() => {
  return {
    total: tasks.value.length,

    pending: tasks.value.filter(
      task => task.status === 'pending'
    ).length,

    assigned: tasks.value.filter(
      task => task.status === 'assigned'
    ).length,

    in_progress: tasks.value.filter(
      task => task.status === 'in_progress'
    ).length,

    on_hold: tasks.value.filter(
      task => task.status === 'on_hold'
    ).length,

    completed: tasks.value.filter(
      task => task.status === 'completed'
    ).length,

    cancelled: tasks.value.filter(
      task => task.status === 'cancelled'
    ).length,
  }
})

/*
|--------------------------------------------------------------------------
| Clear Filters
|--------------------------------------------------------------------------
*/

const clearFilters = async () => {
  filters.value = {
    status: '',
    department_id: '',
    bay_id: '',
  }

  await fetchTasks()
}

/*
|--------------------------------------------------------------------------
| Initial Load
|--------------------------------------------------------------------------
*/

onMounted(async () => {
  await Promise.all([
    fetchDepartments(),
    fetchBays(),
  ])

  await fetchTasks()
})
</script>

<template>
  <div class="min-h-full p-4 md:p-6">

    <!-- Header -->
    <div
      class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <NuxtLink to="/coordinator">
        <button class="bg-gray-200 w-10 h-10 rounded-xl flex items-center justify-center">
          <Icon name="i-lucide-house" class="text-gray-800" />
        </button>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold">
          Mechanic Coordinator
        </h1>

        <p class="text-sm text-base-content/60">
          Workshop task control
        </p>
      </div>

      <button
        class="btn btn-outline"
        :disabled="loading"
        @click="fetchTasks"
      >
        <span
          v-if="loading"
          class="loading loading-spinner loading-sm"
        />

        Refresh
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="alert alert-error mb-6"
    >
      <span>{{ error }}</span>
    </div>

    <!-- Summary -->
    <div
      class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >

      <!-- Total -->
      <div class="stat rounded-box border border-base-300 bg-base-200">
        <div class="stat-title">
          Total
        </div>

        <div class="stat-value text-2xl">
          {{ taskCounts.total }}
        </div>
      </div>

      <!-- Assigned -->
      <div class="stat rounded-box border border-base-300 bg-base-200">
        <div class="stat-title">
          Assigned
        </div>

        <div class="stat-value text-2xl text-info">
          {{ taskCounts.assigned }}
        </div>
      </div>

      <!-- In Progress -->
      <div class="stat rounded-box border border-base-300 bg-base-200">
        <div class="stat-title">
          In Progress
        </div>

        <div class="stat-value text-2xl text-success">
          {{ taskCounts.in_progress }}
        </div>
      </div>

      <!-- On Hold -->
      <div class="stat rounded-box border border-base-300 bg-base-200">
        <div class="stat-title">
          On Hold
        </div>

        <div class="stat-value text-2xl text-warning">
          {{ taskCounts.on_hold }}
        </div>
      </div>

      <!-- Completed -->
      <div class="stat rounded-box border border-base-300 bg-base-200">
        <div class="stat-title">
          Completed
        </div>

        <div class="stat-value text-2xl">
          {{ taskCounts.completed }}
        </div>
      </div>

      <!-- Cancelled -->
      <div class="stat rounded-box border border-base-300 bg-base-200">
        <div class="stat-title">
          Cancelled
        </div>

        <div class="stat-value text-2xl text-error">
          {{ taskCounts.cancelled }}
        </div>
      </div>

    </div>

    <!-- Filters -->
    <div class="mb-6 rounded-box border border-base-300 bg-base-200 p-4">

      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-semibold">
          Filters
        </h2>

        <button
          class="btn btn-ghost btn-xs"
          @click="clearFilters"
        >
          Clear
        </button>
      </div>

      <div class="grid gap-3 md:grid-cols-3">

        <!-- Status -->
        <select
          v-model="filters.status"
          class="select select-bordered w-full"
          @change="fetchTasks"
        >
          <option value="">
            All Statuses
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="assigned">
            Assigned
          </option>

          <option value="in_progress">
            In Progress
          </option>

          <option value="on_hold">
            On Hold
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>

        <!-- Department -->
        <select
          v-model="filters.department_id"
          class="select select-bordered w-full"
          @change="fetchTasks"
        >
          <option value="">
            All Departments
          </option>

          <option
            v-for="department in departments"
            :key="department.id"
            :value="String(department.id)"
          >
            {{ department.name }}
          </option>
        </select>

        <!-- Bay -->
        <select
          v-model="filters.bay_id"
          class="select select-bordered w-full"
          :disabled="!filters.department_id"
          @change="fetchTasks"
        >
          <option value="">
            All Bays
          </option>

          <option
            v-for="bay in filteredBays"
            :key="bay.id"
            :value="String(bay.id)"
          >
            {{ bay.name }} ({{ bay.code }})
          </option>
        </select>

      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex justify-center py-16"
    >
      <span
        class="loading loading-spinner loading-lg"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="tasks.length === 0"
      class="rounded-box border border-base-300 bg-base-200 p-12 text-center"
    >
      <h2 class="text-lg font-semibold">
        No tasks found
      </h2>

      <p class="mt-1 text-sm text-base-content/60">
        There are no tasks matching the selected filters.
      </p>
    </div>

    <!-- Tasks -->
    <div
      v-else
      class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >

      <div
        v-for="task in tasks"
        :key="task.id"
        class="card border border-base-300 bg-base-200 shadow-sm transition hover:shadow-md"
      >
        <div class="card-body shadow-xl border border-gray-300 rounded-box">

          <!-- Top -->
          <div class="flex items-start justify-between gap-3">

            <div>
              <div class="text-xs text-base-content/50">
                Job Card
              </div>

              <div class="font-bold">
                {{ task.job_card.job_card_number }}
              </div>
            </div>

            <span
              class="badge badge-sm capitalize"
              :class="statusClass(task.status)"
            >
              {{ statusLabel(task.status) }}
            </span>

          </div>

          <!-- Vehicle -->
          <div class="mt-3">

            <div class="text-lg font-bold">
              {{ task.job_card.vehicle.registration_number }}
            </div>

            <div class="text-sm text-base-content/60">
              {{ task.job_card.vehicle.make }}
              {{ task.job_card.vehicle.model }}

              <span
                v-if="task.job_card.vehicle.variant"
              >
                · {{ task.job_card.vehicle.variant }}
              </span>
            </div>

          </div>

          <div class="divider my-1" />

          <!-- Task -->
          <div>

            <div class="font-semibold">
              {{ task.title }}
            </div>

            <p
              v-if="task.description"
              class="mt-1 line-clamp-2 text-sm text-base-content/60"
            >
              {{ task.description }}
            </p>

          </div>

          <!-- Assignment -->
          <div class="mt-3 space-y-2 text-sm">

            <div class="flex justify-between gap-3">
              <span class="text-base-content/50">
                Department
              </span>

              <span class="font-medium text-right">
                {{ task.department?.name || '—' }}
              </span>
            </div>

            <div class="flex justify-between gap-3">
              <span class="text-base-content/50">
                Bay
              </span>

              <span class="font-medium text-right">
                {{ task.bay?.name || 'Not assigned' }}
              </span>
            </div>

            <div class="flex justify-between gap-3">
              <span class="text-base-content/50">
                Mechanic
              </span>

              <span class="font-medium text-right">
                {{ task.assigned_employee?.user?.name || 'Not assigned' }}
              </span>
            </div>

          </div>

          <!-- Timing -->
          <div
            v-if="task.estimated_minutes"
            class="mt-2 text-sm text-base-content/60"
          >
            Estimated:
            <span class="font-medium text-base-content">
              {{ task.estimated_minutes }} min
            </span>
          </div>

          <!-- Parts -->
          <div
            v-if="task.parts?.length"
            class="mt-3 rounded-lg border border-gray-300 shadow-xl p-3"
          >
            <div class="mb-2 flex items-center justify-between border-b pb-2 border-gray-300">
              <span class="text-sm font-medium">
                Parts
              </span>

              <span class="">
                {{ task.parts.length }}
              </span>
            </div>

            <div class="space-y-2">
              <div
                v-for="part in task.parts"
                :key="part.id"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <div class="min-w-0">
                  <div class="truncate font-medium">
                    {{ part.part.name }}
                  </div>

                  <div class="text-xs text-base-content/50">
                    {{ part.part.part_number }}
                  </div>
                </div>

                <div class="shrink-0 text-right">
                  <div class="font-medium">
                    {{ part.quantity }} {{ part.part.unit }}
                  </div>

                  <div
                    class="text-xs capitalize"
                    :class="
                      part.status === 'issued'
                        ? 'text-success'
                        : part.status === 'returned'
                          ? 'text-warning'
                          : part.status === 'cancelled'
                            ? 'text-error'
                            : 'text-base-content/50'
                    "
                  >
                    {{ part.status }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action -->
          <div class="card-actions mt-4">

            <NuxtLink
              :to="`/coordinator/tasks/${task.id}`"
              class="btn btn-primary w-full"
            >
              Open Task
            </NuxtLink>

          </div>

        </div>
      </div>

    </div>

  </div>
</template>