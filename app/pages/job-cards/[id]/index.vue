
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
  email?: string | null
}

interface Vehicle {
  id: number
  customer_id: number
  registration_number: string
  make: string
  model: string
  variant: string | null
  fuel_type: string | null
  manufacturing_year: number | null
  color: string | null
  current_odometer: number | null
}

interface Department {
  id: number
  name: string
}

interface Bay {
  id: number
  name: string
  code: string
  department_id?: number
  type?: string
  is_active?: boolean
}

interface Advisor {
  id: number
  user_id: string | number | null
  user?: {
    id: string | number
    name: string
  }
}

interface Employee {
  id: number
  user_id: string | number | null
  department_id: number | null
  employee_code: string
  designation: string | null
  status: string

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
interface JobCardTask {
  id: number
  job_card_id: number
  department_id: number
  bay_id: number | null
  assigned_to: number | null
  title: string
  description: string | null
  status: string
  estimated_minutes: number | null
  actual_minutes: number | null
  labour_cost: string | number | null
  started_at: string | null
  completed_at: string | null
  notes: string | null

  department?: Department
  bay?: Bay
  assignedEmployee?: {
    id: number
    employee_code: string
    designation: string | null
    user?: {
      id: string | number
      name: string
    }
  }
}

const route = useRoute()
const router = useRouter()
const api = useApi()

const { hasPermission } = usePermissions()

const jobCardId = route.params.id as string

const jobCard = ref<JobCard | null>(null)

const loading = ref(true)
const error = ref('')

const departments = ref<Department[]>([])
const bays = ref<Bay[]>([])
const employees = ref<Employee[]>([])

const statusLoading = ref(false)
const workflowLoading = ref(false)

const workflowConfirmOpen = ref(false)
const workflowConfirmStatus = ref('')
const workflowConfirmLoading = ref(false)

const taskStatusConfirmOpen = ref(false)
const taskStatusConfirmTask = ref<JobCardTask | null>(null)
const taskStatusConfirmValue = ref('')
const taskStatusConfirmLoading = ref(false)

// Job Card Tasks Starts
const tasks = ref<JobCardTask[]>([])
const tasksLoading = ref(false)
const taskSaving = ref(false)
const taskError = ref('')

const taskModalOpen = ref(false)
const editingTask = ref<JobCardTask | null>(null)
const taskForm = reactive({
  department_id: '',
  bay_id: '',
  assigned_to: '',
  title: '',
  description: '',
  estimated_minutes: '',
  labour_cost: '',
  notes: '',
})

const taskStatuses = [
  {
    value: 'pending',
    label: 'Pending',
  },
  {
    value: 'assigned',
    label: 'Assigned',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
  },
  {
    value: 'on_hold',
    label: 'On Hold',
  },
  {
    value: 'completed',
    label: 'Completed',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
  },
]

const taskStatusClass = (
  status: string
) => {
  const classes: Record<string, string> = {
    pending: 'badge-warning',
    assigned: 'badge-info',
    in_progress: 'badge-primary',
    on_hold: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-error',
  }

  return classes[status] || 'badge-ghost'
}

const taskStatusLabel = (
  status: string
) => {
  return (
    taskStatuses.find(
      item => item.value === status
    )?.label || status
  )
}

const fetchTasks = async () => {
  if (!jobCard.value) {
    return
  }

  tasksLoading.value = true
  taskError.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.value.id}/tasks`
    )

    tasks.value = Array.isArray(response.data)
      ? response.data
      : []
  } catch (err: any) {
    console.error(err)

    taskError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load job card tasks.'
  } finally {
    tasksLoading.value = false
  }
}

const resetTaskForm = () => {
  taskForm.department_id =
    jobCard.value?.department_id
      ? String(jobCard.value.department_id)
      : ''

  taskForm.bay_id =
    jobCard.value?.bay_id
      ? String(jobCard.value.bay_id)
      : ''

  taskForm.assigned_to =
    ''

  taskForm.title = ''
  taskForm.description = ''
  taskForm.estimated_minutes = ''
  taskForm.labour_cost = ''
  taskForm.notes = ''
}

const openCreateTask = () => {
  editingTask.value = null
  resetTaskForm()
  taskError.value = ''
  taskModalOpen.value = true
}

const openEditTask = (
  task: JobCardTask
) => {
  editingTask.value = task

  taskForm.department_id =
    String(task.department_id)

  taskForm.bay_id =
    task.bay_id
      ? String(task.bay_id)
      : ''

  taskForm.assigned_to =
    task.assigned_to
      ? String(task.assigned_to)
      : ''

  taskForm.title =
    task.title || ''

  taskForm.description =
    task.description || ''

  taskForm.estimated_minutes =
    task.estimated_minutes !== null
      ? String(task.estimated_minutes)
      : ''

  taskForm.labour_cost =
    task.labour_cost !== null
      ? String(task.labour_cost)
      : ''

  taskForm.notes =
    task.notes || ''

  taskError.value = ''
  taskModalOpen.value = true
}

const closeTaskModal = () => {
  if (taskSaving.value) {
    return
  }

  taskModalOpen.value = false
  editingTask.value = null
}
const saveTask = async () => {
  if (!jobCard.value) {
    return
  }

  taskSaving.value = true
  taskError.value = ''

  try {
    const body = {
      department_id: taskForm.department_id
        ? Number(taskForm.department_id)
        : null,

      bay_id: taskForm.bay_id
        ? Number(taskForm.bay_id)
        : null,

      assigned_to: taskForm.assigned_to
        ? Number(taskForm.assigned_to)
        : null,

      title: taskForm.title,

      description:
        taskForm.description || null,

      estimated_minutes:
        taskForm.estimated_minutes
          ? Number(taskForm.estimated_minutes)
          : null,

      labour_cost:
        taskForm.labour_cost
          ? Number(taskForm.labour_cost)
          : null,

      notes:
        taskForm.notes || null,
    }

    if (editingTask.value) {
      await api(
        `/api/admin/job-cards/${jobCard.value.id}/tasks/${editingTask.value.id}`,
        {
          method: 'PUT',
          body,
        }
      )
    } else {
      await api(
        `/api/admin/job-cards/${jobCard.value.id}/tasks`,
        {
          method: 'POST',
          body,
        }
      )
    }

    taskModalOpen.value = false
    editingTask.value = null

    await fetchTasks()
  } catch (err: any) {
    console.error(err)

    taskError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to save task.'
  } finally {
    taskSaving.value = false
  }
}
const openTaskStatusConfirmation = (
  task: JobCardTask,
  status: string
) => {
  if (task.status === status) {
    return
  }

  taskStatusConfirmTask.value = task
  taskStatusConfirmValue.value = status
  taskStatusConfirmOpen.value = true
}

const confirmTaskStatus = async () => {
  if (
    !jobCard.value ||
    !taskStatusConfirmTask.value ||
    !taskStatusConfirmValue.value
  ) {
    return
  }

  taskStatusConfirmLoading.value = true
  taskError.value = ''

  try {
    await api(
      `/api/admin/job-cards/${jobCard.value.id}/tasks/${taskStatusConfirmTask.value.id}/status`,
      {
        method: 'PATCH',
        body: {
          status: taskStatusConfirmValue.value,
        },
      }
    )

    taskStatusConfirmOpen.value = false
    taskStatusConfirmTask.value = null
    taskStatusConfirmValue.value = ''

    await fetchTasks()
  } catch (err: any) {
    console.error(err)

    taskError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update task status.'
  } finally {
    taskStatusConfirmLoading.value = false
  }
}

const closeTaskStatusConfirmation = () => {
  if (taskStatusConfirmLoading.value) {
    return
  }

  taskStatusConfirmOpen.value = false
  taskStatusConfirmTask.value = null
  taskStatusConfirmValue.value = ''
}

// JobCard Task Ends

/*
|--------------------------------------------------------------------------
| Workflow Statuses
|--------------------------------------------------------------------------
*/

const workflowStatuses = [
  {
    value: 'pending',
    label: 'Pending',
    description: 'Job card is waiting to be processed.',
  },
  {
    value: 'confirmed',
    label: 'Confirmed',
    description: 'Job has been confirmed for workshop processing.',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    description: 'Work is currently being performed.',
  },
  {
    value: 'on_hold',
    label: 'On Hold',
    description: 'Work is temporarily paused.',
  },
  {
    value: 'completed',
    label: 'Completed',
    description: 'Workshop work has been completed.',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'Job card has been cancelled.',
  },
]

/*
|--------------------------------------------------------------------------
| Workflow Transitions
|--------------------------------------------------------------------------
*/
const allowedWorkflowTransitions: Record<string, string[]> = {
  pending: [
    'confirmed',
    'cancelled',
  ],

  confirmed: [
    'pending',
    'in_progress',
    'cancelled',
  ],

  in_progress: [
    'confirmed',
    'on_hold',
    'completed',
  ],

  on_hold: [
    'in_progress',
    'completed', 
    'cancelled'
  ],

  completed: [],

  cancelled: [],
}
const isWorkflowStatusAllowed = (
  status: string
) => {
  if (!jobCard.value) {
    return false
  }

  return (
    status === jobCard.value.status ||
    allowedWorkflowTransitions[
      jobCard.value.status
    ]?.includes(status) === true
  )
}

const isCurrentWorkflowStatus = (
  status: string
) => {
  return jobCard.value?.status === status
}


/*
|--------------------------------------------------------------------------
| Fetch Job Card
|--------------------------------------------------------------------------
*/

const fetchJobCard = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCardId}`
    )

    jobCard.value = response.data
    await fetchTasks()

  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load job card.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Workflow Status
|--------------------------------------------------------------------------
*/

const workflowStatusLabel = (
  status: string
) => {
  return (
    workflowStatuses.find(
      item => item.value === status
    )?.label || status
  )
}

const workflowStatusClass = (
  status: string
) => {
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
| Advisor Name
|--------------------------------------------------------------------------
*/

const advisorName = (
  advisor?: Advisor
) => {
  if (!advisor) {
    return 'Not assigned'
  }

  return (
    advisor.user?.name ||
    `Employee #${advisor.id}`
  )
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const editJobCard = () => {
  if (!jobCard.value) {
    return
  }

  router.push(
    `/job-cards/${jobCard.value.id}/edit`
  )
}

const viewCustomer = () => {
  if (!jobCard.value?.customer) {
    return
  }

  router.push(
    `/customers/${jobCard.value.customer.id}`
  )
}

const viewVehicle = () => {
  if (!jobCard.value?.vehicle) {
    return
  }

  router.push(
    `/vehicles/${jobCard.value.vehicle.id}`
  )
}

/*
|--------------------------------------------------------------------------
| Activate / Deactivate
|--------------------------------------------------------------------------
*/

const toggleActiveStatus = async () => {
  if (!jobCard.value) {
    return
  }

  statusLoading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.value.id}/status`,
      {
        method: 'PATCH',

        body: {
          is_active: !jobCard.value.is_active,
        },
      }
    )

    jobCard.value = {
      ...jobCard.value,
      ...response.data,
    }
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update job card status.'
  } finally {
    statusLoading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Workflow Status Update
|--------------------------------------------------------------------------
*/

const openWorkflowConfirmation = (
  status: string
) => {
  if (!jobCard.value) {
    return
  }

  if (!isWorkflowStatusAllowed(status)) {
    return
  }

  if (isCurrentWorkflowStatus(status)) {
    return
  }

  workflowConfirmStatus.value = status
  workflowConfirmOpen.value = true
}

const confirmWorkflowStatus = async () => {
  if (!jobCard.value) {
    return
  }

  const status = workflowConfirmStatus.value

  if (!status) {
    return
  }

  workflowConfirmLoading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.value.id}/workflow-status`,
      {
        method: 'PATCH',

        body: {
          status,
        },
      }
    )

    jobCard.value = {
      ...jobCard.value,
      ...response.data,
    }

    workflowConfirmOpen.value = false
    workflowConfirmStatus.value = ''
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update workflow status.'
  } finally {
    workflowConfirmLoading.value = false
  }
}

const closeWorkflowConfirmation = () => {
  if (workflowConfirmLoading.value) {
    return
  }

  workflowConfirmOpen.value = false
  workflowConfirmStatus.value = ''
}

// Fetch department, bays, employees for task form
const fetchDepartments = async () => {
  const response = await api(
    '/api/admin/departments'
  )

  departments.value = Array.isArray(
    response.data
  )
    ? response.data
    : []
}

const fetchBays = async () => {
  const response = await api(
    '/api/admin/bays'
  )

  bays.value = Array.isArray(
    response.data
  )
    ? response.data
    : []
}

const fetchEmployees = async () => {
  const response = await api(
    '/api/admin/employees'
  )

  const data = response.data

  // Employee API is paginated
  employees.value = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : []
}

const taskDepartmentBays = computed(() => {
  if (!taskForm.department_id) {
    return []
  }

  return bays.value.filter(
    bay =>
      bay.department_id ===
        Number(taskForm.department_id) &&
      bay.is_active
  )
})

const taskDepartmentEmployees = computed(() => {
  if (!taskForm.department_id) {
    return []
  }

  return employees.value.filter(
    employee =>
      employee.status === 'active' &&
      employee.department_id ===
        Number(taskForm.department_id)
  )
})

watch(
  () => taskForm.department_id,
  () => {
    taskForm.bay_id = ''
    taskForm.assigned_to = ''
  }
)

onMounted(async () => {
  try {
    await Promise.all([
      fetchJobCard(),
      fetchDepartments(),
      fetchBays(),
      fetchEmployees(),
    ])
  } catch (err: any) {
    console.error(
      'Unable to load job card page data:',
      err
    )
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="breadcrumbs text-sm">
        <ul>
          <li>
            <NuxtLink
              to="/job-cards"
              class="hover:text-primary"
            >
              Job Cards
            </NuxtLink>
          </li>

          <li>
            Job Card Details
          </li>
        </ul>
      </div>

      <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">
            Job Card Details
          </h1>

          <p class="mt-1 text-sm text-base-content/60">
            View job card, vehicle and workshop information.
          </p>
        </div>

        <div
          v-if="jobCard"
          class="flex flex-wrap gap-2"
        >
          <!-- Edit -->
          <button
            v-if="hasPermission('job-cards.update')"
            type="button"
            class="btn btn-outline"
            @click="editJobCard"
          >
            <Icon
              name="lucide:pencil"
              class="size-4"
            />

            Edit
          </button>

          <!-- Active / Inactive -->
          <button
            v-if="hasPermission('job-cards.status.update')"
            type="button"
            class="btn"
            :class="
              jobCard.is_active
                ? 'btn-error'
                : 'btn-success'
            "
            :disabled="statusLoading"
            @click="toggleActiveStatus"
          >
            <span
              v-if="statusLoading"
              class="loading loading-spinner loading-sm"
            />

            <Icon
              v-else
              :name="
                jobCard.is_active
                  ? 'lucide:power-off'
                  : 'lucide:power'
              "
              class="size-4"
            />

            {{
              jobCard.is_active
                ? 'Deactivate'
                : 'Activate'
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="alert alert-error mb-6"
    >
      <Icon
        name="lucide:circle-alert"
        class="size-5"
      />

      <span>{{ error }}</span>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="card border border-base-300 bg-base-100 shadow-sm"
    >
      <div class="card-body flex items-center justify-center py-20">
        <span class="loading loading-spinner loading-lg" />

        <p class="mt-3 text-sm text-base-content/60">
          Loading job card details...
        </p>
      </div>
    </div>

    <!-- Job Card -->
    <template v-else-if="jobCard">
      <!-- Top Overview -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main -->
        <div class="card border border-base-300 bg-base-100 shadow-sm lg:col-span-2">
          <div class="card-body">
            <!-- Job Card Header -->
            <div class="flex items-start gap-4">
              <div class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon
                  name="lucide:clipboard-list"
                  class="size-7 text-primary"
                />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-xl font-bold">
                    {{ jobCard.job_card_number }}
                  </h2>

                  <span
                    class="badge"
                    :class="
                      workflowStatusClass(
                        jobCard.status
                      )
                    "
                  >
                    {{
                      workflowStatusLabel(
                        jobCard.status
                      )
                    }}
                  </span>

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
                </div>

                <p class="mt-1 text-sm text-base-content/50">
                  Job Card #{{ jobCard.id }}
                </p>
              </div>
            </div>

            <div class="divider" />

            <!-- Vehicle -->
            <div>
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-wide text-base-content/50">
                    Vehicle
                  </p>

                  <h3 class="mt-1 text-lg font-semibold">
                    {{ jobCard.vehicle?.make || '—' }}
                    {{ jobCard.vehicle?.model || '' }}
                  </h3>
                </div>

                <button
                  v-if="jobCard.vehicle"
                  type="button"
                  class="btn btn-outline btn-sm"
                  @click="viewVehicle"
                >
                  View Vehicle

                  <Icon
                    name="lucide:arrow-up-right"
                    class="size-4"
                  />
                </button>
              </div>

              <div
                v-if="jobCard.vehicle"
                class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
              >
                <div class="rounded-lg bg-base-200 p-4">
                  <p class="text-xs text-base-content/50">
                    Registration
                  </p>

                  <code class="mt-1 block font-semibold">
                    {{ jobCard.vehicle.registration_number }}
                  </code>
                </div>

                <div class="rounded-lg bg-base-200 p-4">
                  <p class="text-xs text-base-content/50">
                    Variant
                  </p>

                  <p class="mt-1 font-medium">
                    {{ jobCard.vehicle.variant || '—' }}
                  </p>
                </div>

                <div class="rounded-lg bg-base-200 p-4">
                  <p class="text-xs text-base-content/50">
                    Fuel Type
                  </p>

                  <p class="mt-1 font-medium">
                    {{ jobCard.vehicle.fuel_type || '—' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="divider" />

            <!-- Complaint -->
            <div>
              <p class="text-xs uppercase tracking-wide text-base-content/50">
                Customer Complaint / Requested Work
              </p>

              <div class="mt-3 rounded-lg border border-base-300 bg-base-200 p-5">
                <p class="whitespace-pre-line text-sm leading-6">
                  {{ jobCard.complaint }}
                </p>
              </div>
            </div>

            <!-- Customer Notes -->
            <div
              v-if="jobCard.customer_notes"
              class="mt-5"
            >
              <p class="text-xs uppercase tracking-wide text-base-content/50">
                Customer Notes
              </p>

              <div class="mt-3 rounded-lg border border-base-300 bg-base-200 p-5">
                <p class="whitespace-pre-line text-sm leading-6">
                  {{ jobCard.customer_notes }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Workflow -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-semibold">
                  Workflow Status
                </h2>

                <p class="mt-1 text-xs text-base-content/50">
                  Update the progress of this job card.
                </p>
              </div>

              <Icon
                name="lucide:activity"
                class="size-5 text-base-content/50"
              />
            </div>

            <div
              v-if="hasPermission('job-cards.status.update')"
              class="mt-5 space-y-2"
            >
              <div
                v-for="status in workflowStatuses"
                :key="status.value"
                class="rounded-lg border p-3 transition"
                :class="
                  isCurrentWorkflowStatus(status.value)
                    ? 'border-primary bg-primary/10'
                    : isWorkflowStatusAllowed(status.value)
                      ? 'border-base-300 bg-base-200'
                      : 'border-base-300/50 bg-base-200/40 opacity-50'
                "
              >
                <div class="flex items-center gap-3">
                  <!-- Status Icon -->
                  <div
                    class="flex size-9 shrink-0 items-center justify-center rounded-full"
                    :class="
                      isCurrentWorkflowStatus(status.value)
                        ? 'bg-primary text-primary-content'
                        : isWorkflowStatusAllowed(status.value)
                          ? 'bg-base-300 text-base-content'
                          : 'bg-base-300/50 text-base-content/30'
                    "
                  >
                    <Icon
                      v-if="isCurrentWorkflowStatus(status.value)"
                      name="lucide:check"
                      class="size-4"
                    />

                    <Icon
                      v-else
                      name="lucide:circle"
                      class="size-4"
                    />
                  </div>

                  <!-- Status Information -->
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium">
                      {{ status.label }}
                    </p>

                    <p class="mt-0.5 text-xs text-base-content/50">
                      {{ status.description }}
                    </p>
                  </div>

                  <!-- Action -->
                  <button
                    v-if="
                      isWorkflowStatusAllowed(status.value) &&
                      !isCurrentWorkflowStatus(status.value)
                    "
                    type="button"
                    class="btn btn-primary btn-xs"
                    :disabled="workflowLoading"
                    @click="
                      openWorkflowConfirmation(
                        status.value
                      )
                    "
                  >
                    <span
                      v-if="workflowLoading"
                      class="loading loading-spinner loading-xs"
                    />

                    <span v-else>
                      {{
                        status.value === 'cancelled'
                          ? 'Cancel'
                          : 'Move'
                      }}
                    </span>
                  </button>

                  <!-- Current -->
                  <span
                    v-else-if="
                      isCurrentWorkflowStatus(
                        status.value
                      )
                    "
                    class="badge badge-primary"
                  >
                    Current
                  </span>
                </div>
              </div>
            </div>

            <!-- No Permission -->
            <div
              v-else
              class="mt-5 rounded-lg border border-base-300 bg-base-200 p-4 text-sm text-base-content/60"
            >
              You do not have permission to update workflow status.
            </div>

            <!-- Workflow Complete -->
            <div
              v-if="
                jobCard.status === 'completed'
              "
              class="alert alert-success mt-4"
            >
              <Icon
                name="lucide:circle-check"
                class="size-5"
              />

              <div>
                <p class="font-medium">
                  Job Completed
                </p>

                <p class="text-xs opacity-70">
                  This job card has reached the completed status.
                </p>
              </div>
            </div>

            <!-- Workflow Cancelled -->
            <div
              v-if="
                jobCard.status === 'cancelled'
              "
              class="alert alert-error mt-4"
            >
              <Icon
                name="lucide:circle-x"
                class="size-5"
              />

              <div>
                <p class="font-medium">
                  Job Cancelled
                </p>

                <p class="text-xs opacity-70">
                  This job card has been cancelled and cannot be moved to another workflow status.
                </p>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      <!-- Customer + Workshop -->
      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Customer -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold">
                  Customer
                </h2>

                <p class="text-sm text-base-content/60">
                  Customer associated with this job card.
                </p>
              </div>

              <button
                v-if="jobCard.customer"
                type="button"
                class="btn btn-outline btn-sm"
                @click="viewCustomer"
              >
                View Customer

                <Icon
                  name="lucide:arrow-up-right"
                  class="size-4"
                />
              </button>
            </div>

            <div
              v-if="jobCard.customer"
              class="mt-5 rounded-lg border border-base-300 bg-base-200 p-5"
            >
              <div class="flex items-center gap-4">
                <div class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon
                    name="lucide:user"
                    class="size-5 text-primary"
                  />
                </div>

                <div class="min-w-0">
                  <p class="font-semibold">
                    {{ jobCard.customer.name }}
                  </p>

                  <div class="mt-1 flex flex-wrap gap-3 text-sm text-base-content/60">
                    <span>
                      {{ jobCard.customer.customer_code }}
                    </span>

                    <span>
                      {{ jobCard.customer.phone }}
                    </span>
                  </div>

                  <p
                    v-if="jobCard.customer.email"
                    class="mt-1 text-sm text-base-content/60"
                  >
                    {{ jobCard.customer.email }}
                  </p>
                </div>
              </div>
            </div>

            <div
              v-else
              class="mt-5 rounded-lg border border-base-300 bg-base-200 p-5 text-sm text-base-content/60"
            >
              Customer information is not available.
            </div>
          </div>
        </div>

        <!-- Workshop Assignment -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body">
            <div>
              <h2 class="text-lg font-semibold">
                Workshop Assignment
              </h2>

              <p class="text-sm text-base-content/60">
                Department, bay and advisor assigned to this job.
              </p>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <!-- Department -->
              <div class="rounded-lg border border-base-300 bg-base-200 p-4">
                <p class="text-xs text-base-content/50">
                  Department
                </p>

                <p class="mt-1 font-medium">
                  {{ jobCard.department?.name || '—' }}
                </p>
              </div>

              <!-- Bay -->
              <div class="rounded-lg border border-base-300 bg-base-200 p-4">
                <p class="text-xs text-base-content/50">
                  Bay
                </p>

                <p class="mt-1 font-medium">
                  {{ jobCard.bay?.name || 'Not assigned' }}
                </p>

                <p
                  v-if="jobCard.bay?.code"
                  class="mt-1 text-xs text-base-content/50"
                >
                  {{ jobCard.bay.code }}
                </p>
              </div>

              <!-- Advisor -->
              <div class="rounded-lg border border-base-300 bg-base-200 p-4">
                <p class="text-xs text-base-content/50">
                  Advisor
                </p>

                <p class="mt-1 font-medium">
                  {{ advisorName(jobCard.advisor) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estimate -->
      <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <div>
            <h2 class="text-lg font-semibold">
              Estimate
            </h2>

            <p class="text-sm text-base-content/60">
              Estimated cost and completion information.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="rounded-lg border border-base-300 bg-base-200 p-5">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon
                    name="lucide:indian-rupee"
                    class="size-5 text-primary"
                  />
                </div>

                <div>
                  <p class="text-xs text-base-content/50">
                    Estimated Cost
                  </p>

                  <p class="mt-1 text-lg font-bold">
                    {{ formatCost(jobCard.estimated_cost) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-base-300 bg-base-200 p-5">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon
                    name="lucide:calendar-clock"
                    class="size-5 text-primary"
                  />
                </div>

                <div>
                  <p class="text-xs text-base-content/50">
                    Estimated Completion
                  </p>

                  <p class="mt-1 font-medium">
                    {{
                      formatDate(
                        jobCard.estimated_completion_at
                      )
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks / Services -->
      <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold">
                Tasks / Services
              </h2>

              <p class="text-sm text-base-content/60">
                Work items assigned to this job card.
              </p>
            </div>

            <button
              v-if="hasPermission('job-card-tasks.create')"
              type="button"
              class="btn btn-primary btn-sm"
              @click="openCreateTask"
            >
              <Icon
                name="lucide:plus"
                class="size-4"
              />

              Add Task
            </button>
          </div>

          <!-- Task Error -->
          <div
            v-if="taskError"
            class="alert alert-error mt-5"
          >
            <Icon
              name="lucide:circle-alert"
              class="size-5"
            />

            <span>{{ taskError }}</span>
          </div>

          <!-- Loading -->
          <div
            v-if="tasksLoading"
            class="flex items-center justify-center py-12"
          >
            <span class="loading loading-spinner loading-md" />
          </div>

          <!-- Empty -->
          <div
            v-else-if="tasks.length === 0"
            class="mt-5 rounded-xl border border-dashed border-base-300 bg-base-200 p-10 text-center"
          >
            <div class="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Icon
                name="lucide:clipboard-list"
                class="size-6 text-primary"
              />
            </div>

            <h3 class="mt-4 font-semibold">
              No tasks added
            </h3>

            <p class="mt-1 text-sm text-base-content/60">
              Add the first task or service for this job card.
            </p>

            <button
              v-if="hasPermission('job-card-tasks.create')"
              type="button"
              class="btn btn-primary btn-sm mt-4"
              @click="openCreateTask"
            >
              <Icon
                name="lucide:plus"
                class="size-4"
              />

              Add Task
            </button>
          </div>

          <!-- Tasks -->
          <div
            v-else
            class="mt-5 space-y-3"
          >
            <div
              v-for="(task, index) in tasks"
              :key="task.id"
              class="rounded-xl border border-base-300 bg-base-200 p-4"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
                <!-- Number -->
                <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-base-300 text-sm font-semibold">
                  {{ index + 1 }}
                </div>

                <!-- Main -->
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-semibold">
                      {{ task.title }}
                    </h3>

                    <span
                      class="badge badge-sm"
                      :class="
                        taskStatusClass(
                          task.status
                        )
                      "
                    >
                      {{
                        taskStatusLabel(
                          task.status
                        )
                      }}
                    </span>
                  </div>

                  <p
                    v-if="task.description"
                    class="mt-2 whitespace-pre-line text-sm text-base-content/60"
                  >
                    {{ task.description }}
                  </p>

                  <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-base-content/50">
                    <span
                      v-if="task.department"
                      class="flex items-center gap-1.5"
                    >
                      <Icon
                        name="lucide:building-2"
                        class="size-3.5"
                      />

                      {{ task.department.name }}
                    </span>

                    <span
                      v-if="task.bay"
                      class="flex items-center gap-1.5"
                    >
                      <Icon
                        name="lucide:warehouse"
                        class="size-3.5"
                      />

                      {{ task.bay.name }}
                    </span>

                    <span
                      v-if="task.assignedEmployee"
                      class="flex items-center gap-1.5"
                    >
                      <Icon
                        name="lucide:user"
                        class="size-3.5"
                      />

                      {{
                        task.assignedEmployee.user?.name ||
                        task.assignedEmployee.employee_code
                      }}
                    </span>

                    <span
                      v-if="task.estimated_minutes"
                      class="flex items-center gap-1.5"
                    >
                      <Icon
                        name="lucide:clock-3"
                        class="size-3.5"
                      />

                      {{ task.estimated_minutes }} min
                    </span>

                    <span
                      v-if="task.labour_cost !== null"
                      class="flex items-center gap-1.5"
                    >
                      <Icon
                        name="lucide:indian-rupee"
                        class="size-3.5"
                      />

                      {{ formatCost(task.labour_cost) }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-wrap gap-2">
                  <button
                    v-if="hasPermission('job-card-tasks.update')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    @click="openEditTask(task)"
                  >
                    <Icon
                      name="lucide:pencil"
                      class="size-4"
                    />

                    Edit
                  </button>

                  <div
                    v-if="hasPermission('job-card-tasks.status.update')"
                    class="dropdown dropdown-end"
                  >
                    <button
                      tabindex="0"
                      type="button"
                      class="btn btn-outline btn-sm"
                    >
                      Status

                      <Icon
                        name="lucide:chevron-down"
                        class="size-4"
                      />
                    </button>

                    <ul
                      tabindex="0"
                      class="dropdown-content menu z-50 mt-2 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl"
                    >
                      <li
                        v-for="status in taskStatuses"
                        :key="status.value"
                      >
                        <button
                          type="button"
                          :disabled="
                            task.status ===
                            status.value
                          "
                          @click="
                            openTaskStatusConfirmation(
                              task,
                              status.value
                            )
                          "
                        >
                          <span
                            class="badge badge-xs"
                            :class="
                              taskStatusClass(
                                status.value
                              )
                            "
                          />

                          {{ status.label }}
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Back -->
      <div class="mt-6">
        <NuxtLink
          to="/job-cards"
          class="btn btn-ghost"
        >
          <Icon
            name="lucide:arrow-left"
            class="size-4"
          />

          Back to Job Cards
        </NuxtLink>
      </div>
    </template>

    <!-- Task Modal -->
    <dialog
      class="modal"
      :class="{
        'modal-open': taskModalOpen,
      }"
    >
      <div class="modal-box max-w-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold">
              {{
                editingTask
                  ? 'Edit Task'
                  : 'Add Task'
              }}
            </h3>

            <p class="mt-1 text-sm text-base-content/60">
              {{
                editingTask
                  ? 'Update this job card task.'
                  : 'Add a new task or service.'
              }}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-ghost btn-sm btn-circle"
            :disabled="taskSaving"
            @click="closeTaskModal"
          >
            <Icon
              name="lucide:x"
              class="size-4"
            />
          </button>
        </div>

        <!-- Modal Error -->
        <div
          v-if="taskError"
          class="alert alert-error mt-5"
        >
          <Icon
            name="lucide:circle-alert"
            class="size-5"
          />

          <span>{{ taskError }}</span>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <!-- Department -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Department
            </legend>

            <select
              v-model="taskForm.department_id"
              class="select select-bordered w-full"
            >
              <option
                value=""
                disabled
              >
                Select department
              </option>

              <option
                v-for="department in departments"
                :key="department.id"
                :value="department.id"
              >
                {{ department.name }}
              </option>
            </select>
          </fieldset>

          <!-- Bay -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Bay
            </legend>

            <select
              v-model="taskForm.bay_id"
              class="select select-bordered w-full"
            >
              <option value="">
                Select bay
              </option>

              <option
                v-for="bay in taskDepartmentBays"
                :key="bay.id"
                :value="bay.id"
              >
                {{ bay.name }}

                <template v-if="bay.code">
                  ({{ bay.code }})
                </template>
              </option>
            </select>
          </fieldset>

          <!-- Mechanic -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Assign Mechanic
            </legend>

            <select
              v-model="taskForm.assigned_to"
              class="select select-bordered w-full"
            >
              <option value="">
                Not assigned
              </option>

              <option
                v-for="employee in taskDepartmentEmployees"
                :key="employee.id"
                :value="employee.id"
              >
                {{
                  employee.user?.name ||
                  employee.employee_code
                }}
              </option>
            </select>
          </fieldset>

          <!-- Estimated Time -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Estimated Minutes
            </legend>

            <input
              v-model="taskForm.estimated_minutes"
              type="number"
              min="1"
              class="input input-bordered w-full"
              placeholder="e.g. 60"
            />
          </fieldset>

          <!-- Title -->
          <fieldset class="fieldset md:col-span-2">
            <legend class="fieldset-legend">
              Task / Service
            </legend>

            <input
              v-model="taskForm.title"
              type="text"
              class="input input-bordered w-full"
              placeholder="e.g. Engine Oil Change"
            />
          </fieldset>

          <!-- Description -->
          <fieldset class="fieldset md:col-span-2">
            <legend class="fieldset-legend">
              Description
            </legend>

            <textarea
              v-model="taskForm.description"
              class="textarea textarea-bordered min-h-24 w-full"
              placeholder="Describe the work to be performed..."
            />
          </fieldset>

          <!-- Labour Cost -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Labour Cost
            </legend>

            <label class="input input-bordered flex items-center gap-2">
              <span class="text-base-content/50">
                ₹
              </span>

              <input
                v-model="taskForm.labour_cost"
                type="number"
                min="0"
                step="0.01"
                class="grow"
                placeholder="0"
              />
            </label>
          </fieldset>

          <!-- Notes -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Notes
            </legend>

            <input
              v-model="taskForm.notes"
              type="text"
              class="input input-bordered w-full"
              placeholder="Optional notes"
            />
          </fieldset>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="taskSaving"
            @click="closeTaskModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="taskSaving"
            @click="saveTask"
          >
            <span
              v-if="taskSaving"
              class="loading loading-spinner loading-sm"
            />

            <Icon
              v-else
              name="lucide:save"
              class="size-4"
            />

            {{
              taskSaving
                ? 'Saving...'
                : editingTask
                  ? 'Save Changes'
                  : 'Add Task'
            }}
          </button>
        </div>
      </div>

      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button
          type="button"
          @click="closeTaskModal"
        >
          close
        </button>
      </form>
    </dialog>

    <!-- Workflow Confirmation Modal -->
    <dialog
      class="modal"
      :class="{
        'modal-open': workflowConfirmOpen,
      }"
    >
      <div class="modal-box">
        <div class="flex items-start gap-4">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Icon
              name="lucide:triangle-alert"
              class="size-6"
            />
          </div>

          <div>
            <h3 class="text-lg font-bold">
              Change Workflow Status?
            </h3>

            <p class="mt-2 text-sm text-base-content/60">
              Are you sure you want to change this job card's
              status?
            </p>
          </div>
        </div>

        <div
          v-if="jobCard"
          class="mt-5 rounded-lg border border-base-300 bg-base-200 p-4"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs text-base-content/50">
                Current Status
              </p>

              <p class="mt-1 font-semibold">
                {{
                  workflowStatusLabel(
                    jobCard.status
                  )
                }}
              </p>
            </div>

            <Icon
              name="lucide:arrow-right"
              class="size-5 text-base-content/40"
            />

            <div class="text-right">
              <p class="text-xs text-base-content/50">
                New Status
              </p>

              <p class="mt-1 font-semibold text-primary">
                {{
                  workflowStatusLabel(
                    workflowConfirmStatus
                  )
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="workflowConfirmLoading"
            @click="closeWorkflowConfirmation"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="workflowConfirmLoading"
            @click="confirmWorkflowStatus"
          >
            <span
              v-if="workflowConfirmLoading"
              class="loading loading-spinner loading-sm"
            />

            <Icon
              v-else
              name="lucide:check"
              class="size-4"
            />

            {{
              workflowConfirmLoading
                ? 'Updating...'
                : 'Confirm Change'
            }}
          </button>
        </div>
      </div>

      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button
          type="button"
          @click="closeWorkflowConfirmation"
        >
          close
        </button>
      </form>
    </dialog>

    <!-- Task Status Confirmation Modal -->
    <dialog
      class="modal"
      :class="{
        'modal-open': taskStatusConfirmOpen,
      }"
    >
      <div class="modal-box">
        <div class="flex items-start gap-4">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Icon
              name="lucide:triangle-alert"
              class="size-6"
            />
          </div>

          <div>
            <h3 class="text-lg font-bold">
              Change Task Status?
            </h3>

            <p class="mt-2 text-sm text-base-content/60">
              Are you sure you want to change this task's status?
            </p>
          </div>
        </div>

        <div
          v-if="taskStatusConfirmTask"
          class="mt-5 rounded-lg border border-base-300 bg-base-200 p-4"
        >
          <p class="font-semibold">
            {{ taskStatusConfirmTask.title }}
          </p>

          <div class="mt-4 flex items-center justify-between gap-4">
            <div>
              <p class="text-xs text-base-content/50">
                Current Status
              </p>

              <p class="mt-1 font-medium">
                {{
                  taskStatusLabel(
                    taskStatusConfirmTask.status
                  )
                }}
              </p>
            </div>

            <Icon
              name="lucide:arrow-right"
              class="size-5 text-base-content/40"
            />

            <div class="text-right">
              <p class="text-xs text-base-content/50">
                New Status
              </p>

              <p class="mt-1 font-semibold text-primary">
                {{
                  taskStatusLabel(
                    taskStatusConfirmValue
                  )
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="taskStatusConfirmLoading"
            @click="closeTaskStatusConfirmation"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="taskStatusConfirmLoading"
            @click="confirmTaskStatus"
          >
            <span
              v-if="taskStatusConfirmLoading"
              class="loading loading-spinner loading-sm"
            />

            <Icon
              v-else
              name="lucide:check"
              class="size-4"
            />

            {{
              taskStatusConfirmLoading
                ? 'Updating...'
                : 'Confirm Change'
            }}
          </button>
        </div>
      </div>

      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button
          type="button"
          @click="closeTaskStatusConfirmation"
        >
          close
        </button>
      </form>
    </dialog>
  </div>
</template>
