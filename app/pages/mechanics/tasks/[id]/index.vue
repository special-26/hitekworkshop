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
  fuel_type?: string | null
  current_odometer?: number | null
}

interface JobCard {
  id: number
  job_card_number: string
  complaint?: string | null
  customer_notes?: string | null
  customer: Customer
  vehicle: Vehicle
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

interface MechanicTask {
  id: number
  job_card_id: number
  department_id: number
  bay_id?: number | null
  assigned_to: number
  title: string
  description?: string | null
  status: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  estimated_minutes?: number | null
  actual_minutes?: number | null
  labour_cost?: string | number | null
  started_at?: string | null
  completed_at?: string | null
  notes?: string | null

  job_card: JobCard
  department: Department
  bay?: Bay | null
  parts?: JobCardPart[]
}

interface JobCardPart {
  id: number
  part_id: number
  quantity: string | number
  unit_price?: string | number | null
  discount?: string | number | null
  total?: string | number | null
  status: 'pending' | 'issued' | 'returned' | 'cancelled'
  notes?: string | null
  part: {
    id: number
    part_number: string
    name: string
    category?: string | null
    brand?: string | null
    unit: string
  }
}

const route = useRoute()
const router = useRouter()
const api = useApi()

const task = ref<MechanicTask | null>(null)

const loading = ref(true)
const updatingStatus = ref(false)
const error = ref('')

const statusConfirmOpen = ref(false)
const statusConfirmValue = ref('')
const statusConfirmLabel = ref('')

const taskId = route.params.id

const fetchTask = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/mechanic/tasks/${taskId}`
    )

    task.value = response.data?.data ?? response.data
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load task.'
  } finally {
    loading.value = false
  }
}

const statusLabel = (status: string) => {
  return status.replace('_', ' ')
}

const statusClass = (status: string) => {
  switch (status) {
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
| Available actions
|--------------------------------------------------------------------------
*/

const availableActions = computed(() => {
  if (!task.value) {
    return []
  }

  switch (task.value.status) {
    case 'assigned':
      return [
        {
          status: 'in_progress',
          label: 'Start Task',
          class: 'btn-success',
        },
        {
          status: 'cancelled',
          label: 'Cancel Task',
          class: 'btn-error btn-outline',
        },
      ]

    case 'in_progress':
      return [
        {
          status: 'on_hold',
          label: 'Put On Hold',
          class: 'btn-warning',
        },
        {
          status: 'completed',
          label: 'Complete Task',
          class: 'btn-success',
        },
      ]

    case 'on_hold':
      return [
        {
          status: 'in_progress',
          label: 'Resume Task',
          class: 'btn-success',
        },
        {
          status: 'completed',
          label: 'Complete Task',
          class: 'btn-success',
        },
        {
          status: 'cancelled',
          label: 'Cancel Task',
          class: 'btn-error btn-outline',
        },
      ]

    default:
      return []
  }
})

const requestStatusChange = (newStatus: string) => {
  if (!task.value) {
    return
  }

  // Only require confirmation for important/destructive actions.
  if (['completed', 'cancelled'].includes(newStatus)) {
    const action = availableActions.value.find(
      item => item.status === newStatus
    )

    statusConfirmValue.value = newStatus
    statusConfirmLabel.value = action?.label || 'Change Status'
    statusConfirmOpen.value = true

    return
  }

  updateStatus(newStatus)
}

const updateStatus = async (newStatus: string) => {
  if (!task.value) {
    return
  }

  updatingStatus.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/mechanic/tasks/${task.value.id}/status`,
      {
        method: 'PATCH',
        body: {
          status: newStatus,
        },
      }
    )

    task.value = response.data?.data ?? response.data
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to update task status.'
  } finally {
    updatingStatus.value = false
  }
}

const confirmStatusChange = async () => {
  if (!statusConfirmValue.value) {
    return
  }

  statusConfirmOpen.value = false

  await updateStatus(statusConfirmValue.value)

  statusConfirmValue.value = ''
  statusConfirmLabel.value = ''
}

const closeStatusConfirmation = () => {
  if (updatingStatus.value) {
    return
  }

  statusConfirmOpen.value = false
  statusConfirmValue.value = ''
  statusConfirmLabel.value = ''
}

const goBack = () => {
  router.push('/mechanics/tasks')
}

onMounted(fetchTask)
</script>

<template>
  <div class="min-h-full p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-3">
      <button
        class="btn btn-ghost btn-sm"
        @click="goBack"
      >
        ← Back
      </button>

      <div>
        <h1 class="text-xl font-bold md:text-2xl">
          Task Details
        </h1>

        <p
          v-if="task"
          class="text-sm text-base-content/60"
        >
          {{ task.job_card.job_card_number }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex justify-center py-16"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error && !task"
      class="alert alert-error"
    >
      <span>{{ error }}</span>
    </div>

    <template v-else-if="task">
      <!-- Error during status update -->
      <div
        v-if="error"
        class="alert alert-error mb-4"
      >
        <span>{{ error }}</span>
      </div>

      <div class="mx-auto max-w-3xl space-y-4">

        <!-- Current Status -->
        <div class="card border border-base-300 bg-base-200">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-base-content/50">
                  Current Status
                </div>

                <div class="mt-1">
                  <span
                    class="badge capitalize"
                    :class="statusClass(task.status)"
                  >
                    {{ statusLabel(task.status) }}
                  </span>
                </div>
              </div>

              <div
                v-if="task.estimated_minutes"
                class="text-right"
              >
                <div class="text-xs text-base-content/50">
                  Estimated
                </div>

                <div class="font-semibold">
                  {{ task.estimated_minutes }} min
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vehicle -->
        <div class="card border border-base-300 bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">
              Vehicle
            </h2>

            <div class="mt-2">
              <div class="text-lg font-bold">
                {{ task.job_card.vehicle.registration_number }}
              </div>

              <div class="text-base-content/70">
                {{ task.job_card.vehicle.make }}
                {{ task.job_card.vehicle.model }}

                <span v-if="task.job_card.vehicle.variant">
                  · {{ task.job_card.vehicle.variant }}
                </span>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-xs text-base-content/50">
                  Fuel
                </div>

                <div>
                  {{ task.job_card.vehicle.fuel_type || '—' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-base-content/50">
                  Odometer
                </div>

                <div>
                  {{ task.job_card.vehicle.current_odometer || '—' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer -->
        <div class="card border border-base-300 bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">
              Customer
            </h2>

            <div class="mt-2">
              <div class="font-semibold">
                {{ task.job_card.customer.name }}
              </div>

              <div class="text-sm text-base-content/60">
                {{ task.job_card.customer.phone }}
              </div>
            </div>
          </div>
        </div>

        <!-- Task -->
        <div class="card border border-base-300 bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">
              Service / Task
            </h2>

            <div class="mt-3">
              <div class="text-lg font-semibold">
                {{ task.title }}
              </div>

              <p
                v-if="task.description"
                class="mt-2 text-sm leading-relaxed text-base-content/70"
              >
                {{ task.description }}
              </p>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-xs text-base-content/50">
                  Department
                </div>

                <div>
                  {{ task.department?.name || '—' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-base-content/50">
                  Bay
                </div>

                <div>
                  {{ task.bay?.name || 'Not assigned' }}
                </div>
              </div>
            </div>

            <div
              v-if="task.notes"
              class="mt-4"
            >
              <div class="text-xs text-base-content/50">
                Notes
              </div>

              <div class="mt-1 text-sm">
                {{ task.notes }}
              </div>
            </div>
          </div>
        </div>

                <!-- Parts Used -->
        <div
          v-if="task.parts?.length"
          class="card border border-base-300 bg-base-200"
        >
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="card-title text-lg">
                Parts
              </h2>

              <span class="badge badge-neutral">
                {{ task.parts.length }}
              </span>
            </div>

            <div class="mt-3 space-y-3">
              <div
                v-for="part in task.parts"
                :key="part.id"
                class="rounded-lg border border-base-300 bg-base-100 p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="font-semibold">
                      {{ part.part.name }}
                    </div>

                    <div class="mt-1 text-xs text-base-content/60">
                      {{ part.part.part_number }}
                      <span v-if="part.part.brand">
                        · {{ part.part.brand }}
                      </span>
                    </div>
                  </div>

                  <span
                    class="badge capitalize"
                    :class="
                      part.status === 'issued'
                        ? 'badge-success'
                        : part.status === 'returned'
                          ? 'badge-warning'
                          : part.status === 'cancelled'
                            ? 'badge-error'
                            : 'badge-ghost'
                    "
                  >
                    {{ part.status }}
                  </span>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div class="text-xs text-base-content/50">
                      Quantity
                    </div>

                    <div class="font-medium">
                      {{ part.quantity }} {{ part.part.unit }}
                    </div>
                  </div>

                  <div v-if="part.total !== null && part.total !== undefined">
                    <div class="text-xs text-base-content/50">
                      Total
                    </div>

                    <div class="font-medium">
                      ₹{{ part.total }}
                    </div>
                  </div>
                </div>

                <div
                  v-if="part.notes"
                  class="mt-3 text-sm text-base-content/70"
                >
                  {{ part.notes }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timing -->
        <div class="card border border-base-300 bg-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg">
              Timing
            </h2>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-xs text-base-content/50">
                  Started
                </div>

                <div>
                  {{ task.started_at || 'Not started' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-base-content/50">
                  Completed
                </div>

                <div>
                  {{ task.completed_at || '—' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-base-content/50">
                  Actual Time
                </div>

                <div>
                  <span v-if="task.actual_minutes">
                    {{ task.actual_minutes }} min
                  </span>

                  <span v-else>
                    —
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div
          v-if="availableActions.length"
          class="card border border-base-300 bg-base-200"
        >
          <div class="card-body">
            <h2 class="card-title text-lg">
              Task Actions
            </h2>

            <div class="mt-3 grid gap-3">
              <button
                v-for="action in availableActions"
                :key="action.status"
                class="btn w-full"
                :class="action.class"
                :disabled="updatingStatus"
                @click="requestStatusChange(action.status)"
              >
                <span
                  v-if="updatingStatus"
                  class="loading loading-spinner loading-sm"
                />

                {{ action.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Completed / Cancelled -->
        <div
          v-else
          class="alert"
          :class="task.status === 'completed'
            ? 'alert-success'
            : 'alert-error'"
        >
          <span>
            This task is {{ statusLabel(task.status) }}.
          </span>
        </div>

      </div>
    </template>
  </div>

  <!-- Status Confirmation Modal -->
    <dialog
        class="modal"
        :class="{ 'modal-open': statusConfirmOpen }"
    >
    <div class="modal-box">
        <h3 class="text-lg font-bold">
            Confirm Status Change
        </h3>

        <p class="py-4 text-sm text-base-content/70">
            Are you sure you want to change this task from
            <span class="font-semibold capitalize">
                {{ task?.status?.replace('_', ' ') }}
            </span>
            to
            <span class="font-semibold capitalize">
                {{ statusConfirmValue.replace('_', ' ') }}
            </span>?
        </p>

        <div class="rounded-lg bg-base-300 p-3">
            <div class="text-xs text-base-content/50">
                Task
            </div>

            <div class="font-semibold">
                {{ task?.title }}
            </div>
        </div>

        <div class="modal-action">
            <button
                class="btn btn-ghost"
                :disabled="updatingStatus"
                @click="closeStatusConfirmation"
            >
                Cancel
            </button>

            <button
                class="btn"
                :class="
                statusConfirmValue === 'cancelled'
                    ? 'btn-error'
                    : 'btn-success'
                "
                :disabled="updatingStatus"
                @click="confirmStatusChange"
            >
                <span
                v-if="updatingStatus"
                class="loading loading-spinner loading-sm"
                />

                {{ statusConfirmLabel || 'Confirm' }}
            </button>
        </div>
    </div>

    <div
        class="modal-backdrop"
        @click="closeStatusConfirmation"
    />
    </dialog>
</template>