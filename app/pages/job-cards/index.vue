<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

interface Customer {
  id: number
  customer_code: string
  name: string
  phone: string
}

interface Vehicle {
  id: number
  customer_id: number
  registration_number: string
  make: string
  model: string
  variant: string | null
}

interface Department {
  id: number
  name: string
}

interface Bay {
  id: number
  name: string
  code: string
}

interface Advisor {
  id: number
  user_id: string | number | null
  user?: {
    id: string | number
    name: string
  }
}

interface JobCard {
  id: number
  job_card_number: string
  customer_id: number
  vehicle_id: number
  department_id: number
  bay_id: number | null
  advisor_id: number | null
  complaint: string
  customer_notes: string | null
  estimated_cost: string | number | null
  estimated_completion_at: string | null
  status: string
  is_active: boolean

  customer?: Customer
  vehicle?: Vehicle
  department?: Department
  bay?: Bay
  advisor?: Advisor
}

const api = useApi()
const router = useRouter()

const { hasPermission } = usePermissions()

const jobCards = ref<JobCard[]>([])

const loading = ref(true)
const error = ref('')
const success = ref('')

const search = ref('')
const statusFilter = ref('all')

const statusLoading = ref<number | null>(null)

/*
|--------------------------------------------------------------------------
| Status Confirmation
|--------------------------------------------------------------------------
*/

const showStatusModal = ref(false)
const selectedJobCard = ref<JobCard | null>(null)

/*
|--------------------------------------------------------------------------
| Fetch Job Cards
|--------------------------------------------------------------------------
*/

const fetchJobCards = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      '/api/admin/job-cards'
    )

    jobCards.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load job cards.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Search + Filter
|--------------------------------------------------------------------------
*/

const filteredJobCards = computed(() => {
  const query = search.value.trim().toLowerCase()

  return jobCards.value.filter(jobCard => {
    const matchesSearch =
      !query ||
      jobCard.job_card_number
        .toLowerCase()
        .includes(query) ||

      jobCard.customer?.name
        ?.toLowerCase()
        .includes(query) ||

      jobCard.customer?.customer_code
        ?.toLowerCase()
        .includes(query) ||

      jobCard.customer?.phone
        ?.toLowerCase()
        .includes(query) ||

      jobCard.vehicle?.registration_number
        ?.toLowerCase()
        .includes(query) ||

      jobCard.vehicle?.make
        ?.toLowerCase()
        .includes(query) ||

      jobCard.vehicle?.model
        ?.toLowerCase()
        .includes(query) ||

      jobCard.department?.name
        ?.toLowerCase()
        .includes(query)

    const matchesStatus =
      statusFilter.value === 'all' ||
      jobCard.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

/*
|--------------------------------------------------------------------------
| Status Label
|--------------------------------------------------------------------------
*/

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return labels[status] || status
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

const statusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    in_progress: 'badge-primary',
    on_hold: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-error',
  }

  return classes[status] || 'badge-ghost'
}

/*
|--------------------------------------------------------------------------
| Format Cost
|--------------------------------------------------------------------------
*/

const formatCost = (
  value: string | number | null
) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '—'
  }

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

/*
|--------------------------------------------------------------------------
| Format Date
|--------------------------------------------------------------------------
*/

const formatDate = (
  value: string | null
) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/*
|--------------------------------------------------------------------------
| Open Status Confirmation
|--------------------------------------------------------------------------
*/

const confirmStatusChange = (
  jobCard: JobCard
) => {
  selectedJobCard.value = jobCard
  showStatusModal.value = true
}

/*
|--------------------------------------------------------------------------
| Close Status Modal
|--------------------------------------------------------------------------
*/

const closeStatusModal = () => {
  if (statusLoading.value !== null) {
    return
  }

  showStatusModal.value = false
  selectedJobCard.value = null
}

/*
|--------------------------------------------------------------------------
| Toggle Active Status
|--------------------------------------------------------------------------
*/

const toggleStatus = async () => {
  if (!selectedJobCard.value) {
    return
  }

  const jobCard = selectedJobCard.value

  statusLoading.value = jobCard.id
  error.value = ''
  success.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.id}/status`,
      {
        method: 'PATCH',

        body: {
          is_active: !jobCard.is_active,
        },
      }
    )

    const updatedJobCard = response.data

    const index = jobCards.value.findIndex(
      item => item.id === jobCard.id
    )

    if (index !== -1) {
      jobCards.value[index] = {
        ...jobCards.value[index],
        ...updatedJobCard,
      }
    }

    success.value =
      updatedJobCard.is_active
        ? 'Job card activated successfully.'
        : 'Job card deactivated successfully.'

    showStatusModal.value = false
    selectedJobCard.value = null
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update job card status.'
  } finally {
    statusLoading.value = null
  }
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const createJobCard = () => {
  router.push('/job-cards/create')
}

const viewJobCard = (
  jobCard: JobCard
) => {
  router.push(
    `/job-cards/${jobCard.id}`
  )
}

const editJobCard = (
  jobCard: JobCard
) => {
  router.push(
    `/job-cards/${jobCard.id}/edit`
  )
}

onMounted(() => {
  fetchJobCards()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-base-content">
          Job Cards
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Manage workshop jobs, vehicles and service progress.
        </p>
      </div>

      <button
        v-if="hasPermission('job-cards.create')"
        type="button"
        class="btn btn-primary"
        @click="createJobCard"
      >
        <Icon
          name="lucide:clipboard-plus"
          class="size-5"
        />

        Create Job Card
      </button>
    </div>

    <!-- Success -->
    <div
      v-if="success"
      class="alert alert-success mt-6"
    >
      <Icon
        name="lucide:circle-check"
        class="size-5"
      />

      <span>{{ success }}</span>

      <button
        type="button"
        class="btn btn-ghost btn-xs ml-auto"
        @click="success = ''"
      >
        <Icon
          name="lucide:x"
          class="size-4"
        />
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="alert alert-error mt-6"
    >
      <Icon
        name="lucide:circle-alert"
        class="size-5"
      />

      <span>{{ error }}</span>

      <button
        type="button"
        class="btn btn-ghost btn-xs ml-auto"
        @click="error = ''"
      >
        <Icon
          name="lucide:x"
          class="size-4"
        />
      </button>
    </div>

    <!-- Search + Filter -->
    <div class="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <label class="input input-bordered flex w-full items-center gap-2 lg:max-w-lg">
        <Icon
          name="lucide:search"
          class="size-4 text-base-content/50"
        />

        <input
          v-model="search"
          type="search"
          placeholder="Search job card, customer, registration..."
        />

        <button
          v-if="search"
          type="button"
          class="btn btn-ghost btn-xs"
          @click="search = ''"
        >
          <Icon
            name="lucide:x"
            class="size-4"
          />
        </button>
      </label>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          v-model="statusFilter"
          class="select select-bordered"
        >
          <option value="all">
            All Statuses
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="confirmed">
            Confirmed
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

        <div class="text-sm text-base-content/50">
          {{ filteredJobCards.length }}

          {{
            filteredJobCards.length === 1
              ? 'job card'
              : 'job cards'
          }}
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card mt-4 overflow-hidden border border-base-300 bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Job Card</th>
              <th>Vehicle</th>
              <th>Customer</th>
              <th>Department / Bay</th>
              <th>Cost</th>
              <th>Workflow</th>
              <th>Status</th>
              <th class="text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading -->
            <tr v-if="loading">
              <td
                colspan="8"
                class="py-16 text-center"
              >
                <span class="loading loading-spinner loading-lg" />

                <p class="mt-3 text-sm text-base-content/60">
                  Loading job cards...
                </p>
              </td>
            </tr>

            <!-- Empty -->
            <tr
              v-else-if="filteredJobCards.length === 0"
            >
              <td
                colspan="8"
                class="py-16 text-center"
              >
                <Icon
                  name="lucide:clipboard-list"
                  class="mx-auto size-12 text-base-content/30"
                />

                <p class="mt-3 font-medium">
                  {{
                    search || statusFilter !== 'all'
                      ? 'No job cards match your filters.'
                      : 'No job cards found.'
                  }}
                </p>

                <p class="mt-1 text-sm text-base-content/60">
                  {{
                    search || statusFilter !== 'all'
                      ? 'Try changing your search or status filter.'
                      : 'Create your first job card to get started.'
                  }}
                </p>
              </td>
            </tr>

            <!-- Job Cards -->
            <tr
              v-for="jobCard in filteredJobCards"
              v-else
              :key="jobCard.id"
            >
              <!-- Job Card -->
              <td>
                <div>
                  <code class="rounded bg-base-200 px-2 py-1 text-sm font-semibold">
                    {{ jobCard.job_card_number }}
                  </code>

                  <p class="mt-2 text-xs text-base-content/50">
                    #{{ jobCard.id }}
                  </p>
                </div>
              </td>

              <!-- Vehicle -->
              <td>
                <div
                  v-if="jobCard.vehicle"
                  class="min-w-40"
                >
                  <p class="font-semibold">
                    {{ jobCard.vehicle.make }}
                    {{ jobCard.vehicle.model }}
                  </p>

                  <div class="mt-1 flex flex-wrap items-center gap-2">
                    <code class="text-xs text-base-content/60">
                      {{ jobCard.vehicle.registration_number }}
                    </code>

                    <span
                      v-if="jobCard.vehicle.variant"
                      class="text-xs text-base-content/40"
                    >
                      {{ jobCard.vehicle.variant }}
                    </span>
                  </div>
                </div>

                <span
                  v-else
                  class="text-base-content/40"
                >
                  —
                </span>
              </td>

              <!-- Customer -->
              <td>
                <div
                  v-if="jobCard.customer"
                  class="min-w-36"
                >
                  <p class="font-medium">
                    {{ jobCard.customer.name }}
                  </p>

                  <p class="text-xs text-base-content/50">
                    {{ jobCard.customer.customer_code }}
                  </p>

                  <p class="text-xs text-base-content/50">
                    {{ jobCard.customer.phone }}
                  </p>
                </div>

                <span
                  v-else
                  class="text-base-content/40"
                >
                  —
                </span>
              </td>

              <!-- Department / Bay -->
              <td>
                <div>
                  <p
                    v-if="jobCard.department"
                    class="font-medium"
                  >
                    {{ jobCard.department.name }}
                  </p>

                  <p
                    v-if="jobCard.bay"
                    class="mt-1 text-xs text-base-content/50"
                  >
                    {{ jobCard.bay.name }}
                    <span v-if="jobCard.bay.code">
                      · {{ jobCard.bay.code }}
                    </span>
                  </p>

                  <p
                    v-else
                    class="mt-1 text-xs text-base-content/40"
                  >
                    Bay not assigned
                  </p>
                </div>
              </td>

              <!-- Cost -->
              <td>
                <span class="font-medium">
                  {{ formatCost(jobCard.estimated_cost) }}
                </span>
              </td>

              <!-- Workflow -->
              <td>
                <span
                  class="badge"
                  :class="statusClass(jobCard.status)"
                >
                  {{ statusLabel(jobCard.status) }}
                </span>
              </td>

              <!-- Active Status -->
              <td>
                <span
                  class="badge"
                  :class="
                    jobCard.is_active
                      ? 'badge-success'
                      : 'badge-error'
                  "
                >
                  {{
                    jobCard.is_active
                      ? 'Active'
                      : 'Inactive'
                  }}
                </span>
              </td>

              <!-- Actions -->
              <td>
                <div class="flex justify-end gap-1">
                  <!-- View -->
                  <button
                    v-if="hasPermission('job-cards.view')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    title="View Job Card"
                    @click="viewJobCard(jobCard)"
                  >
                    <Icon
                      name="lucide:eye"
                      class="size-4"
                    />
                  </button>

                  <!-- Edit -->
                  <button
                    v-if="hasPermission('job-cards.update')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    title="Edit Job Card"
                    @click="editJobCard(jobCard)"
                  >
                    <Icon
                      name="lucide:pencil"
                      class="size-4"
                    />
                  </button>

                  <!-- Activate / Deactivate -->
                  <button
                    v-if="hasPermission('job-cards.status.update')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    :title="
                      jobCard.is_active
                        ? 'Deactivate'
                        : 'Activate'
                    "
                    @click="confirmStatusChange(jobCard)"
                  >
                    <Icon
                      :name="
                        jobCard.is_active
                          ? 'lucide:power-off'
                          : 'lucide:power'
                      "
                      class="size-4"
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Status Confirmation Modal -->
    <dialog
      class="modal"
      :class="{ 'modal-open': showStatusModal }"
    >
      <div class="modal-box border border-base-300 bg-base-100">
        <div class="flex items-start gap-4">
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-full"
            :class="
              selectedJobCard?.is_active
                ? 'bg-error/10 text-error'
                : 'bg-success/10 text-success'
            "
          >
            <Icon
              :name="
                selectedJobCard?.is_active
                  ? 'lucide:power-off'
                  : 'lucide:power'
              "
              class="size-6"
            />
          </div>

          <div>
            <h3 class="text-lg font-bold">
              {{
                selectedJobCard?.is_active
                  ? 'Deactivate Job Card'
                  : 'Activate Job Card'
              }}
            </h3>

            <p class="mt-2 text-sm text-base-content/60">
              Are you sure you want to
              {{
                selectedJobCard?.is_active
                  ? 'deactivate'
                  : 'activate'
              }}
              this job card?
            </p>
          </div>
        </div>

        <!-- Job Card Info -->
        <div
          v-if="selectedJobCard"
          class="mt-5 rounded-lg border border-base-300 bg-base-200 p-4"
        >
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon
                name="lucide:clipboard-list"
                class="size-5 text-primary"
              />
            </div>

            <div>
              <p class="font-semibold">
                {{ selectedJobCard.job_card_number }}
              </p>

              <p class="text-sm text-base-content/60">
                {{
                  selectedJobCard.vehicle?.registration_number ||
                  'Vehicle unavailable'
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="statusLoading !== null"
            @click="closeStatusModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn"
            :class="
              selectedJobCard?.is_active
                ? 'btn-error'
                : 'btn-success'
            "
            :disabled="statusLoading !== null"
            @click="toggleStatus"
          >
            <span
              v-if="statusLoading !== null"
              class="loading loading-spinner loading-sm"
            />

            <Icon
              v-else
              :name="
                selectedJobCard?.is_active
                  ? 'lucide:power-off'
                  : 'lucide:power'
              "
              class="size-4"
            />

            {{
              selectedJobCard?.is_active
                ? 'Deactivate'
                : 'Activate'
            }}
          </button>
        </div>
      </div>

      <!-- Backdrop -->
      <form
        method="dialog"
        class="modal-backdrop"
        @click="closeStatusModal"
      >
        <button type="button">
          close
        </button>
      </form>
    </dialog>
  </div>
</template>