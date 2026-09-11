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
  is_active?: boolean
  department_id: number
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

interface CoordinatorTask {
  id: number
  job_card_id: number
  department_id: number
  bay_id?: number | null
  assigned_to?: number | null

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
  assigned_employee?: Employee | null
  
  parts?: JobCardPart[]
}

const route = useRoute()
const router = useRouter()
const api = useApi()

const task = ref<CoordinatorTask | null>(null)

const departments = ref<Department[]>([])
const bays = ref<Bay[]>([])
const employees = ref<Employee[]>([])

const loading = ref(true)
const lookupLoading = ref(false)
const savingAssignment = ref(false)
const updatingStatus = ref(false)

const error = ref('')

const assignmentModalOpen = ref(false)

const assignmentForm = ref({
  department_id: '',
  bay_id: '',
  assigned_to: '',
})

const taskId = route.params.id

/*
|--------------------------------------------------------------------------
| Fetch Task
|--------------------------------------------------------------------------
*/

const fetchTask = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/coordinator/tasks/${taskId}`
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

/*
|--------------------------------------------------------------------------
| Fetch Lookups
|--------------------------------------------------------------------------
*/

const fetchDepartments = async () => {
  try {
    const response = await api('/api/admin/departments')

    const data = response.data

    departments.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
  } catch (err) {
    console.error('Unable to load departments', err)
  }
}

const fetchBays = async () => {
  try {
    const response = await api('/api/admin/bays')

    const data = response.data

    bays.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
  } catch (err) {
    console.error('Unable to load bays', err)
  }
}

const fetchEmployees = async () => {
  try {
    const response = await api('/api/admin/employees')

    const data = response.data

    employees.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
  } catch (err) {
    console.error('Unable to load employees', err)
  }
}

const fetchLookups = async () => {
  lookupLoading.value = true

  await Promise.all([
    fetchDepartments(),
    fetchBays(),
    fetchEmployees(),
  ])

  lookupLoading.value = false
}

/*
|--------------------------------------------------------------------------
| Filtered Bays / Employees
|--------------------------------------------------------------------------
*/

const selectedDepartmentId = computed(() => {
  return Number(assignmentForm.value.department_id)
})

const assignmentBays = computed(() => {
  if (!selectedDepartmentId.value) {
    return []
  }

  return bays.value.filter(
    bay =>
      bay.department_id === selectedDepartmentId.value &&
      bay.is_active !== false
  )
})

const assignmentEmployees = computed(() => {
  if (!selectedDepartmentId.value) {
    return []
  }

  return employees.value.filter(
    employee =>
      employee.department_id === selectedDepartmentId.value &&
      employee.status === 'active'
  )
})

/*
|--------------------------------------------------------------------------
| Department watcher
|--------------------------------------------------------------------------
*/

watch(
  () => assignmentForm.value.department_id,
  () => {
    assignmentForm.value.bay_id = ''
    assignmentForm.value.assigned_to = ''
  }
)

/*
|--------------------------------------------------------------------------
| Open Assignment Modal
|--------------------------------------------------------------------------
*/

const openAssignmentModal = async () => {
  if (!task.value) {
    return
  }

  if (!departments.value.length) {
    await fetchLookups()
  }

  assignmentForm.value = {
    department_id: String(task.value.department_id),
    bay_id: task.value.bay_id
      ? String(task.value.bay_id)
      : '',
    assigned_to: task.value.assigned_to
      ? String(task.value.assigned_to)
      : '',
  }

  assignmentModalOpen.value = true
}

const closeAssignmentModal = () => {
  if (savingAssignment.value) {
    return
  }

  assignmentModalOpen.value = false
}

/*
|--------------------------------------------------------------------------
| Save Assignment
|--------------------------------------------------------------------------
*/

const saveAssignment = async () => {
  if (!task.value) {
    return
  }

  savingAssignment.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/coordinator/tasks/${task.value.id}/assignment`,
      {
        method: 'PATCH',
        body: {
          department_id: Number(
            assignmentForm.value.department_id
          ),

          bay_id: assignmentForm.value.bay_id
            ? Number(assignmentForm.value.bay_id)
            : null,

          assigned_to: assignmentForm.value.assigned_to
            ? Number(assignmentForm.value.assigned_to)
            : null,
        },
      }
    )

    task.value = response.data?.data ?? response.data

    assignmentModalOpen.value = false
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to update task assignment.'
  } finally {
    savingAssignment.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

const statusLabel = (status?: string | null) => {
  if (!status) {
    return '—'
  }

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

const availableActions = computed(() => {
  if (!task.value) {
    return []
  }

  switch (task.value.status) {
    case 'pending':
      return [
        {
          status: 'assigned',
          label: 'Assign',
          class: 'btn-info',
        },
        {
          status: 'cancelled',
          label: 'Cancel',
          class: 'btn-error btn-outline',
        },
      ]

    case 'assigned':
      return [
        {
          status: 'in_progress',
          label: 'Start Task',
          class: 'btn-success',
        },
        {
          status: 'pending',
          label: 'Move to Pending',
          class: 'btn-warning btn-outline',
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

/*
|--------------------------------------------------------------------------
| Status Confirmation
|--------------------------------------------------------------------------
*/

const statusConfirmOpen = ref(false)
const statusConfirmValue = ref<
  'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | ''
>('')
const statusConfirmLabel = ref('')

const requestStatusChange = (
  newStatus: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
) => {
  if (!task.value) {
    return
  }

  if (['completed', 'cancelled'].includes(newStatus)) {
    const action = availableActions.value.find(
      item => item.status === newStatus
    )

    statusConfirmValue.value = newStatus
    statusConfirmLabel.value =
      action?.label || 'Change Status'

    statusConfirmOpen.value = true

    return
  }

  updateStatus(newStatus)
}

const updateStatus = async (
  newStatus: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
) => {
  
  if (!task.value) {
    return
  }

  updatingStatus.value = true
  error.value = ''
  

  try {
    const response = await api(
      `/api/admin/coordinator/tasks/${task.value.id}/status`,
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
  router.push('/coordinator/tasks')
}

onMounted(async () => {
  await fetchTask()
  await fetchLookups()
})
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
          {{ task.job_card?.job_card_number ?? '—' }}
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

      <!-- Error -->
      <div
        v-if="error"
        class="alert alert-error mb-4"
      >
        <span>{{ error }}</span>
      </div>

      <div class="mx-auto max-w-4xl space-y-4">

        <!-- Status -->
        <div class="card border border-base-300 bg-base-200">
          <div class="card-body">

            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div class="text-xs text-base-content/50">
                  Current Status
                </div>

                <span
                  class="badge mt-1 capitalize"
                  :class="statusClass(task.status)"
                >
                  {{ statusLabel(task.status) }}
                </span>
              </div>

              <div
                v-if="availableActions.length"
                class="grid gap-2 sm:flex"
              >
                <button
                  v-for="action in availableActions"
                  :key="action.status"
                  class="btn btn-sm"
                  :class="action.class"
                  :disabled="updatingStatus"
                  @click="requestStatusChange(action.status)"
                >
                  <span
                    v-if="updatingStatus"
                    class="loading loading-spinner loading-xs"
                  />

                  {{ action.label }}
                </button>
              </div>

            </div>

          </div>
        </div>

        <!-- Vehicle + Customer -->
        <div class="grid gap-4 md:grid-cols-2">

          <!-- Vehicle -->
          <div class="card border border-base-300 bg-base-200">
            <div class="card-body">
              <h2 class="card-title text-lg">
                Vehicle
              </h2>

              <div class="mt-2 text-lg font-bold">
                {{ task.job_card?.vehicle?.registration_number ?? '—' }}
              </div>

              <div class="text-base-content/70">
                {{ task.job_card?.vehicle?.make ?? '—' }}
                {{ task.job_card?.vehicle?.model ?? '—' }}

                <span v-if="task.job_card?.vehicle?.variant">
                  · {{ task.job_card?.vehicle?.variant ?? '—' }}
                </span>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div class="text-xs text-base-content/50">
                    Fuel
                  </div>

                  {{ task.job_card?.vehicle?.fuel_type ?? '—' }}
                </div>

                <div>
                  <div class="text-xs text-base-content/50">
                    Odometer
                  </div>

                  {{ task.job_card?.vehicle?.current_odometer ?? '—' }}
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

              <div class="mt-2 font-semibold">
                {{ task.job_card?.customer?.name ?? '—' }}
              </div>

              <div class="text-sm text-base-content/60">
                {{ task.job_card?.customer?.phone ?? '—' }}
              </div>
            </div>
          </div>

        </div>

        <!-- Task -->
        <div class="card border border-base-300 bg-base-200">
          <div class="card-body">

            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div class="text-xs text-base-content/50">
                  Service / Task
                </div>

                <h2 class="mt-1 text-xl font-bold">
                  {{ task.title }}
                </h2>
              </div>

              <button
                class="btn btn-primary btn-sm"
                @click="openAssignmentModal"
              >
                Change Assignment
              </button>
            </div>

            <p
              v-if="task.description"
              class="mt-3 text-sm text-base-content/70"
            >
              {{ task.description }}
            </p>

          </div>
        </div>

        <!-- Assignment -->
        <div class="card border border-base-300 bg-base-200">
          <div class="card-body">

            <h2 class="card-title text-lg">
              Assignment
            </h2>

            <div class="grid gap-4 sm:grid-cols-3">

              <div>
                <div class="text-xs text-base-content/50">
                  Department
                </div>

                <div class="mt-1 font-medium">
                  {{ task.department?.name || 'Not assigned' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-base-content/50">
                  Bay
                </div>

                <div class="mt-1 font-medium">
                  {{ task.bay?.name || 'Not assigned' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-base-content/50">
                  Mechanic
                </div>

                <div class="mt-1 font-medium">
                  {{ task.assigned_employee?.user?.name || 'Not assigned' }}
                </div>

                <div
                  v-if="task.assigned_employee?.employee_code"
                  class="text-xs text-base-content/50"
                >
                  {{ task.assigned_employee.employee_code }}
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

            <div class="grid gap-4 sm:grid-cols-3 text-sm">

              <div>
                <div class="text-xs text-base-content/50">
                  Estimated
                </div>

                <div class="font-medium">
                  {{ task.estimated_minutes
                    ? `${task.estimated_minutes} min`
                    : '—' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-base-content/50">
                  Started
                </div>

                <div class="font-medium">
                  {{ task.started_at || 'Not started' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-base-content/50">
                  Actual
                </div>

                <div class="font-medium">
                  {{ task.actual_minutes
                    ? `${task.actual_minutes} min`
                    : '—' }}
                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- Parts -->
        <div
          v-if="task?.parts?.length"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body">
            <h2 class="card-title text-base">
              Parts
            </h2>

            <div
              v-for="jobCardPart in task.parts"
              :key="jobCardPart.id"
              class="flex items-center justify-between gap-3 border-b border-base-300 py-3 last:border-0"
            >
              <div class="min-w-0">
                <p class="font-medium">
                  {{ jobCardPart.part.name }}
                </p>

                <p class="text-sm text-base-content/60">
                  {{ jobCardPart.part.part_number }}
                  · Qty: {{ jobCardPart.quantity }} {{ jobCardPart.part.unit }}
                </p>
              </div>

              <span
                class="badge badge-sm"
                :class="{
                  'badge-warning': jobCardPart.status === 'pending',
                  'badge-success': jobCardPart.status === 'issued',
                  'badge-info': jobCardPart.status === 'returned',
                  'badge-error': jobCardPart.status === 'cancelled'
                }"
              >
                {{ jobCardPart.status }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- Assignment Modal -->
    <dialog
      class="modal"
      :class="{ 'modal-open': assignmentModalOpen }"
    >
      <div class="modal-box max-w-lg">

        <h3 class="text-lg font-bold">
          Change Assignment
        </h3>

        <p class="mt-1 text-sm text-base-content/60">
          {{ task?.title }}
        </p>

        <div
          v-if="lookupLoading"
          class="flex justify-center py-8"
        >
          <span class="loading loading-spinner" />
        </div>

        <div
          v-else
          class="mt-5 space-y-4"
        >

          <!-- Department -->
          <div>
            <label class="label">
              <span class="label-text">
                Department
              </span>
            </label>

            <select
              v-model="assignmentForm.department_id"
              class="select select-bordered w-full"
            >
              <option value="">
                Select department
              </option>

              <option
                v-for="department in departments"
                :key="department.id"
                :value="String(department.id)"
              >
                {{ department.name }}
              </option>
            </select>
          </div>

          <!-- Bay -->
          <div>
            <label class="label">
              <span class="label-text">
                Bay
              </span>
            </label>

            <select
              v-model="assignmentForm.bay_id"
              class="select select-bordered w-full"
              :disabled="!assignmentForm.department_id"
            >
              <option value="">
                No bay
              </option>

              <option
                v-for="bay in assignmentBays"
                :key="bay.id"
                :value="String(bay.id)"
              >
                {{ bay.name }} ({{ bay.code }})
              </option>
            </select>
          </div>

          <!-- Mechanic -->
          <div>
            <label class="label">
              <span class="label-text">
                Mechanic
              </span>
            </label>

            <select
              v-model="assignmentForm.assigned_to"
              class="select select-bordered w-full"
              :disabled="!assignmentForm.department_id"
            >
              <option value="">
                Unassigned
              </option>

              <option
                v-for="employee in assignmentEmployees"
                :key="employee.id"
                :value="String(employee.id)"
              >
                {{ employee.user?.name || employee.employee_code }}
                — {{ employee.employee_code }}
              </option>
            </select>
          </div>

        </div>

        <div class="modal-action">

          <button
            class="btn btn-ghost"
            :disabled="savingAssignment"
            @click="closeAssignmentModal"
          >
            Cancel
          </button>

          <button
            class="btn btn-primary"
            :disabled="
              savingAssignment ||
              !assignmentForm.department_id
            "
            @click="saveAssignment"
          >
            <span
              v-if="savingAssignment"
              class="loading loading-spinner loading-sm"
            />

            Save Assignment
          </button>

        </div>
      </div>

      <div
        class="modal-backdrop"
        @click="closeAssignmentModal"
      />
    </dialog>

    <!-- Status Confirmation -->
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

  </div>
</template>