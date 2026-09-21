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

const config = useRuntimeConfig()
const getImageUrl = (path: string | null | undefined) => {
  if (!path) {
    return null
  }

  // Already a complete URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Laravel storage image
  return `${config.public.apiBaseUrl}/storage/${path}`
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

/**
|----------------------------------------
|  Request Parts for task
|---------------------------------------- 
*/
interface AvailablePart {
  id: number
  part_number: string
  name: string
  category?: string | null
  brand?: string | null
  unit: string
  selling_price?: string | number | null
}

interface SelectedPartRequest {
  part_id: string
  quantity: string
  unit_price: string
  discount: string
  notes: string
}

const partsModalOpen = ref(false)
const availableParts = ref<AvailablePart[]>([])
const vehicleBrands = ref<any[]>([])
const selectedPartRequests = ref<SelectedPartRequest[]>([])
const partSearch = ref('')
const partLoading = ref(false)
const partSaving = ref(false)
const partsError = ref('')

const selectedVehicleBrandId = ref('')
const vehicleModels = ref<any[]>([])
const selectedVehicleModelId = ref('')

const partCategories = ref<any[]>([])
const selectedPartCategoryId = ref('')

const selectedPartId = ref('')
const selectedPart = ref<any | null>(null)

const brandSectionOpen = ref(true)
const modelSectionOpen = ref(false)
const categorySectionOpen = ref(true)

const modelLoading = ref(false)

const fetchAvailableParts = async () => {
  if (!selectedVehicleModelId.value) {
    availableParts.value = []
    return
  }

  partLoading.value = true
  partsError.value = ''

  try {
    const response = await api(
      `/api/admin/vehicles/catalog/models/${selectedVehicleModelId.value}/available-parts`,
      {
        query: {
          category_id:
            selectedPartCategoryId.value || undefined,

          search:
            partSearch.value.trim() || undefined,
        },
      }
    )

    const result = response.data

    availableParts.value = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : []
  } catch (err: any) {
    console.error('Unable to load available parts', err)

    partsError.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load available parts.'
  } finally {
    partLoading.value = false
  }
}
// Fetch Vehicle Brand
const fetchVehicleBrands = async () => {
  try {
    const response = await api(
      '/api/admin/vehicles/catalog/brands'
    )

    const result = response.data

    vehicleBrands.value = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : []
  } catch (err: any) {
    console.error('Unable to load vehicle brands', err)

    partsError.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load vehicle brands.'
  }
}
// Fetch Vehicle Model
const fetchVehicleModels = async (
  brandId: number | string
) => {
  if (!brandId) {
    vehicleModels.value = []
    return
  }

  modelLoading.value = true
  partsError.value = ''

  try {
    const response = await api(
      `/api/admin/vehicles/catalog/brands/${brandId}/models`
    )

    const result = response.data

    vehicleModels.value = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : []
  } catch (err: any) {
    console.error('Unable to load vehicle models', err)

    partsError.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load vehicle models.'
  } finally {
    modelLoading.value = false
  }
}
// Fetch Part Categories
const fetchPartCategories = async () => {
  try {
    const response = await api(
      '/api/admin/vehicles/catalog/part-categories'
    )

    const result = response.data

    partCategories.value = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : []
  } catch (err: any) {
    console.error('Unable to load part categories', err)

    partsError.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load part categories.'
  }
}
const handlePartCategoryChange = async () => {
  if (!selectedVehicleModelId.value) {
    return
  }

  if (!selectedPartCategoryId.value) {
    availableParts.value = []
    return
  }

  await fetchAvailableParts()
}

// New
const selectVehicleBrand = async (brand: any) => {
  selectedVehicleBrandId.value = String(brand.id)

  selectedVehicleModelId.value = ''
  selectedPartCategoryId.value = ''

  vehicleModels.value = []
  availableParts.value = []
  partSearch.value = ''

  // Collapse brand and open model selection
  brandSectionOpen.value = false
  modelSectionOpen.value = true

  await fetchVehicleModels(brand.id)
}
const selectVehicleModel = (model: any) => {
  selectedVehicleModelId.value = String(model.id)

  // Clear previous category and parts
  selectedPartCategoryId.value = ''
  availableParts.value = []
  partSearch.value = ''

  // Collapse model after selection
  modelSectionOpen.value = false
  categorySectionOpen.value = true
}
const selectPartCategory = async (category: any) => {
  selectedPartCategoryId.value = String(category.id)

  // Clear previous search and results
  partSearch.value = ''
  availableParts.value = []

  // Collapse category section after selection
  categorySectionOpen.value = false

  // Fetch parts only after category selection
  await fetchAvailableParts()
}
const selectPart = (part: any) => {
  const existingPart = selectedPartRequests.value.find(
    (item: any) =>
      String(item.part_id) === String(part.id)
  )

  if (existingPart) {
    return
  }

  selectedPartRequests.value.push({
    part_id: part.id,
    name: part.name,
    part_number: part.part_number,
    brand: part.brand,
    image: part.image,
    unit: part.unit,

    quantity: 1,
    unit_price: Number(part.selling_price || 0),
    discount: 0,
    notes: '',
  })
}

const isPartSelected = (partId: number | string) => {
  return selectedPartRequests.value.some(
    (item) => String(item.part_id) === String(partId)
  )
}

const getSelectedPartRequest = (
  partId: number | string
) => {
  return selectedPartRequests.value.find(
    (item) => String(item.part_id) === String(partId)
  )
}

const addPartToSelection = (part: AvailablePart) => {
  if (isPartSelected(part.id)) {
    return
  }

  selectedPartRequests.value.push({
    part_id: String(part.id),
    quantity: '1',
    unit_price: String(part.selling_price ?? '0'),
    discount: '0',
    notes: '',
  })
}

const removePartFromSelection = (
  partId: number | string
) => {
  selectedPartRequests.value =
    selectedPartRequests.value.filter(
      (item) => String(item.part_id) !== String(partId)
    )
}

const updateSelectedPart = (
  partId: number | string,
  field: keyof SelectedPartRequest,
  value: string
) => {
  const selected = getSelectedPartRequest(partId)

  if (!selected) {
    return
  }

  selected[field] = value
}

const getSelectedPartDetails = (
  partId: number | string
) => {
  return availableParts.value.find(
    (part) => String(part.id) === String(partId)
  ) || null
}
const resetPartForm = () => {
  selectedPartRequests.value = []

  partSearch.value = ''

  selectedVehicleBrandId.value = ''
  selectedVehicleModelId.value = ''
  selectedPartCategoryId.value = ''

  vehicleModels.value = []
  availableParts.value = []

  partsError.value = ''

  brandSectionOpen.value = true
  modelSectionOpen.value = false
  categorySectionOpen.value = true
}

const openPartsModal = async () => {
  if (!task.value) {
    return
  }

  resetPartForm()

  if (!vehicleBrands.value.length) {
    await fetchVehicleBrands()
  }

  if (!partCategories.value.length) {
    await fetchPartCategories()
  }

  partsModalOpen.value = true
}

const closePartsModal = () => {
  if (partSaving.value) {
    return
  }

  partsModalOpen.value = false
}

const savePart = async () => {
  if (!task.value) return

  if (!selectedPartRequests.value.length) {
    partsError.value = 'Please select at least one part.'
    return
  }

  partSaving.value = true
  partsError.value = ''

  try {
    for (const part of selectedPartRequests.value) {
      if (!part.part_id || Number(part.quantity) <= 0) {
        throw new Error(
          'Please enter a valid part and quantity.'
        )
      }

      await api(
        `/api/admin/job-cards/${task.value.job_card_id}/parts`,
        {
          method: 'POST',
          body: {
            part_id: Number(part.part_id),
            job_card_task_id: task.value.id,
            quantity: Number(part.quantity),
            unit_price: Number(part.unit_price),
            discount: Number(part.discount || 0),
            notes: part.notes || null,
          },
        }
      )
    }

    partsModalOpen.value = false
    resetPartForm()

    await fetchTask()
  } catch (err: any) {
    console.error('Unable to request parts', err)

    partsError.value =
      err?.data?.message ||
      err?.message ||
      'Unable to request parts.'
  } finally {
    partSaving.value = false
  }
}

/*
|----------------------------------------
|  Request Parts Ends
|---------------------------------------- 
*/

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
          class="text-sm text-gray-content/60"
        >
          {{ task.job_card?.job_card_number ?? '—' }}
        </p>
      </div>
    </div>

    hh
    <!-- <img src="/images/vehicle-brands/honda.webp" alt=""> -->

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
        <div class="card border border-gray-300 bg-gray-200">
          <div class="card-body">

            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div class="text-xs text-gray-content/50">
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
          <div class="card border border-gray-300 bg-gray-200">
            <div class="card-body">
              <h2 class="card-title text-lg">
                Vehicle
              </h2>

              <div class="mt-2 text-lg font-bold">
                {{ task.job_card?.vehicle?.registration_number ?? '—' }}
              </div>

              <div class="text-gray-content/70">
                {{ task.job_card?.vehicle?.make ?? '—' }}
                {{ task.job_card?.vehicle?.model ?? '—' }}

                <span v-if="task.job_card?.vehicle?.variant">
                  · {{ task.job_card?.vehicle?.variant ?? '—' }}
                </span>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div class="text-xs text-gray-content/50">
                    Fuel
                  </div>

                  {{ task.job_card?.vehicle?.fuel_type ?? '—' }}
                </div>

                <div>
                  <div class="text-xs text-gray-content/50">
                    Odometer
                  </div>

                  {{ task.job_card?.vehicle?.current_odometer ?? '—' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Customer -->
          <div class="card border border-gray-300 bg-gray-200">
            <div class="card-body">
              <h2 class="card-title text-lg">
                Customer
              </h2>

              <div class="mt-2 font-semibold">
                {{ task.job_card?.customer?.name ?? '—' }}
              </div>

              <div class="text-sm text-gray-content/60">
                {{ task.job_card?.customer?.phone ?? '—' }}
              </div>
            </div>
          </div>

        </div>

        <!-- Task -->
        <div class="card border border-gray-300 bg-gray-200">
          <div class="card-body">

            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div class="text-xs text-gray-content/50">
                  Service / Task
                </div>

                <h2 class="mt-1 text-xl font-bold">
                  {{ task.title }}
                </h2>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  class="btn btn-secondary btn-sm flex items-center gap-1"
                  @click="openPartsModal"
                >
                  <Icon name="i-lucide-cog" class="w-6 h-6" />
                  Request Parts
                </button>

                <button
                  class="btn btn-primary btn-sm flex items-center gap-1"
                  @click="openAssignmentModal"
                >
                  <Icon name="i-lucide-user-plus" class="w-5 h-5" />
                  Change Assignment
                </button>
              </div>
            </div>

            <p
              v-if="task.description"
              class="mt-3 text-sm text-gray-content/70"
            >
              {{ task.description }}
            </p>

          </div>
        </div>

        <!-- Assignment -->
        <div class="card border border-gray-300 bg-gray-200">
          <div class="card-body">

            <h2 class="card-title text-lg">
              Assignment
            </h2>

            <div class="grid gap-4 sm:grid-cols-3">

              <div>
                <div class="text-xs text-gray-content/50">
                  Department
                </div>

                <div class="mt-1 font-medium">
                  {{ task.department?.name || 'Not assigned' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-gray-content/50">
                  Bay
                </div>

                <div class="mt-1 font-medium">
                  {{ task.bay?.name || 'Not assigned' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-gray-content/50">
                  Mechanic
                </div>

                <div class="mt-1 font-medium">
                  {{ task.assigned_employee?.user?.name || 'Not assigned' }}
                </div>

                <div
                  v-if="task.assigned_employee?.employee_code"
                  class="text-xs text-gray-content/50"
                >
                  {{ task.assigned_employee.employee_code }}
                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- Timing -->
        <div class="card border border-gray-300 bg-gray-200">
          <div class="card-body">

            <h2 class="card-title text-lg">
              Timing
            </h2>

            <div class="grid gap-4 sm:grid-cols-3 text-sm">

              <div>
                <div class="text-xs text-gray-content/50">
                  Estimated
                </div>

                <div class="font-medium">
                  {{ task.estimated_minutes
                    ? `${task.estimated_minutes} min`
                    : '—' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-gray-content/50">
                  Started
                </div>

                <div class="font-medium">
                  {{ task.started_at || 'Not started' }}
                </div>
              </div>

              <div>
                <div class="text-xs text-gray-content/50">
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
          class="card bg-gray-200 shadow-sm"
        >
          <div class="card-body">
            <h2 class="card-title text-base">
              Parts
            </h2>

            <div
              v-for="jobCardPart in task.parts"
              :key="jobCardPart.id"
              class="flex items-center justify-between gap-3 border-b border-gray-300 py-3 last:border-0"
            >
              <div class="min-w-0">
                <p class="font-medium">
                  {{ jobCardPart.part.name }}
                </p>

                <p class="text-sm text-gray-content/60">
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

        <p class="mt-1 text-sm text-gray-content/60">
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

        <p class="py-4 text-sm text-gray-content/70">
          Are you sure you want to change this task from
          <span class="font-semibold capitalize">
            {{ task?.status?.replace('_', ' ') }}
          </span>
          to
          <span class="font-semibold capitalize">
            {{ statusConfirmValue.replace('_', ' ') }}
          </span>?
        </p>

        <div class="rounded-lg bg-gray-300 p-3">
          <div class="text-xs text-gray-content/50">
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

    <!-- Request Parts Modal -->
    <dialog
      class="modal"
      :class="{ 'modal-open': partsModalOpen }"
    >
      <div class="flex flex-col modal-box max-w-7xl h-[95vh] p-0 overflow-hidden">

        <!-- Fixed Header -->
        <div class="flex flex-none items-center justify-between border-b border-gray-300 px-6 py-3 bg-zinc-800">
          <div class="text-white">
            <h2 class="text-xl font-bold">
              Request Parts
            </h2>

            <p class="text-sm text-gray-300">
              Select vehicle, category and parts to request.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-circle btn-ghost btn-sm text-white hover:text-black"
            @click="partsModalOpen = false"
          >
            <Icon name="i-lucide-x" class="h-5 w-5" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <section class="min-h-0 flex-1 overflow-y-auto px-5 py-4 body-section">
          <p class="mt-1 text-gray-800">
            <span class="font-bold">Task: </span>
            {{ task?.title }}
          </p>

          <!-- Error -->
          <div
            v-if="partsError"
            class="alert alert-error mt-4"
          >
            <span>{{ partsError }}</span>
          </div>

          <!-- Result Section -->
          <div class="mt-5">

            <!-- Select Vehicle Brands -->
            <div class="mb-4 rounded-xl border border-gray-300 bg-gray-200/30">
              <button
                type="button"
                class="flex w-full items-center justify-between px-4 py-3 text-left"
                @click="brandSectionOpen = !brandSectionOpen"
              >
                <div>
                  <p class="text-xs text-gray-content/60">
                    1. Vehicle Brand
                  </p>

                  <p class="font-semibold">
                    {{
                      vehicleBrands.find(
                        (brand) =>
                          String(brand.id) === String(selectedVehicleBrandId)
                      )?.name || 'Select Brand'
                    }}
                  </p>
                </div>

                <Icon
                  :name="
                    categorySectionOpen
                      ? 'mdi:chevron-up'
                      : 'mdi:chevron-down'
                  "
                  size="sm"
                />
              </button>

              <div
                v-if="brandSectionOpen"
                class="border-t border-gray-300 p-4"
              >
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold">
                      Select Vehicle Brand
                    </h3>

                    <span class="text-sm text-gray-content/60">
                      {{ vehicleBrands.length }} brands
                    </span>
                  </div>

                  <div
                    v-if="!vehicleBrands.length"
                    class="text-sm text-gray-content/60"
                  >
                    No vehicle brands available.
                  </div>

                  <div
                    v-else
                    class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
                  >
                    <button
                      v-for="brand in vehicleBrands"
                      :key="brand.id"
                      type="button"
                      class="card border transition-all"
                      :class="
                        String(selectedVehicleBrandId) === String(brand.id)
                          ? 'border-primary bg-primary/10 ring-2 ring-primary'
                          : 'border-gray-300 bg-gray-100 hover:border-primary'
                      "
                      @click="selectVehicleBrand(brand)"
                    >
                      <div class="card-body items-center gap-2 p-3 text-center">
                        <div
                          class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gray-200"
                        >
                          <img
                            v-if="brand.logo"
                            :src="getImageUrl(brand.logo)"
                            :alt="brand.name"
                            class="h-full w-full object-contain"
                          />

                          <span
                            v-else
                            class="text-xl font-bold text-gray-content/50"
                          >
                            {{ brand.name?.charAt(0) }}
                          </span>
                        </div>

                        <span class="text-sm font-medium">
                          {{ brand.name }}
                        </span>

                        <span
                          v-if="brand.models_count !== undefined"
                          class="text-xs text-gray-content/60"
                        >
                          {{ brand.models_count }} models
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Select Vehicle Models -->
            <div
              v-if="selectedVehicleBrandId"
              class="mb-4 rounded-xl border border-gray-300 bg-gray-200/30"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between px-4 py-3 text-left"
                @click="modelSectionOpen = !modelSectionOpen"
              >
                <div>
                  <p class="text-xs text-gray-content/60">
                    2. Vehicle Model
                  </p>

                  <p class="font-semibold">
                    {{
                      vehicleModels.find(
                        (model) =>
                          String(model.id) === String(selectedVehicleModelId)
                      )?.name || 'Select Model'
                    }}
                  </p>
                </div>

                <Icon
                  :name="
                    categorySectionOpen
                      ? 'mdi:chevron-up'
                      : 'mdi:chevron-down'
                  "
                  size="sm"
                />
              </button>

              <div
                v-if="modelSectionOpen"
                class="border-t border-gray-300 p-4"
              >
                <!-- Content -->
                <div
                  v-if="selectedVehicleBrandId"
                  class="mt-5 space-y-3"
                >
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold">
                      Select Vehicle Model
                    </h3>

                    <span class="text-sm text-gray-content/60">
                      {{ vehicleModels.length }} models
                    </span>
                  </div>

                  <!-- Loading -->
                  <div
                    v-if="modelLoading"
                    class="flex items-center justify-center py-6"
                  >
                    <span class="loading loading-spinner loading-md"></span>
                  </div>

                  <!-- Models -->
                  <div
                    v-else-if="vehicleModels.length"
                    class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
                  >
                    <button
                      v-for="model in vehicleModels"
                      :key="model.id"
                      type="button"
                      class="card border transition-all"
                      :class="
                        String(selectedVehicleModelId) === String(model.id)
                          ? 'border-primary bg-primary/10 ring-2 ring-primary'
                          : 'border-gray-300 bg-gray-100 hover:border-primary'
                      "
                      @click="selectVehicleModel(model)"
                    >
                      <div class="card-body items-center gap-2 p-3 text-center">
                        <div
                          class="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-200"
                        >
                          <img
                            v-if="model.image"
                            :src="getImageUrl(model.image)"
                            :alt="model.name"
                            class="h-full w-full object-contain"
                          />

                          <span
                            v-else
                            class="text-2xl font-bold text-gray-content/40"
                          >
                            {{ model.name?.charAt(0) }}
                          </span>
                        </div>

                        <span class="text-sm font-medium">
                          {{ model.name }}
                        </span>
                      </div>
                    </button>
                  </div>

                  <!-- Empty -->
                  <div
                    v-else
                    class="py-6 text-center text-sm text-gray-content/60"
                  >
                    No vehicle models found.
                  </div>
                </div>
              </div>
            </div>

            <!-- Select Part Categories -->
            <div
              v-if="selectedVehicleModelId"
              class="mt-4 rounded-xl border border-gray-300 bg-gray-200/30"
            >
              <!-- Category Header -->
              <button
                type="button"
                class="flex w-full items-center justify-between px-4 py-3 text-left"
                @click="categorySectionOpen = !categorySectionOpen"
              >
                <div>
                  <p class="text-xs text-gray-content/60">
                    3. Part Category
                  </p>

                  <p class="font-semibold">
                    {{
                      partCategories.find(
                        (category) =>
                          String(category.id) ===
                          String(selectedPartCategoryId)
                      )?.name || 'Select Category'
                    }}
                  </p>
                </div>

                <Icon
                  :name="
                    categorySectionOpen
                      ? 'mdi:chevron-up'
                      : 'mdi:chevron-down'
                  "
                  size="sm"
                />
              </button>

              <!-- Category Cards -->
              <div
                v-if="categorySectionOpen"
                class="border-t border-gray-300 p-4"
              >
                <div class="mb-3 flex items-center justify-between">
                  <h3 class="font-semibold">
                    Select Part Category
                  </h3>

                  <span class="text-sm text-gray-content/60">
                    {{ partCategories.length }} categories
                  </span>
                </div>

                <div
                  v-if="!partCategories.length"
                  class="py-6 text-center text-sm text-gray-content/60"
                >
                  No part categories available.
                </div>

                <div
                  v-else
                  class="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5"
                >
                  <button
                    v-for="category in partCategories"
                    :key="category.id"
                    type="button"
                    class="card border transition-all"
                    :class="
                      String(selectedPartCategoryId) ===
                      String(category.id)
                        ? 'border-primary bg-primary/10 ring-2 ring-primary'
                        : 'border-gray-300 bg-gray-100 hover:border-primary'
                    "
                    @click="selectPartCategory(category)"
                  >
                    <div
                      class="items-center gap-2 text-center"
                    >
                      <div
                        class="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gray-200"
                      >
                        <img
                          v-if="category.image"
                          :src="getImageUrl(category.image)"
                          :alt="category.name"
                          class="h-full w-full object-cover"
                        />

                        <span
                          v-else
                          class="text-2xl font-bold text-gray-content/40"
                        >
                          {{ category.name?.charAt(0) }}
                        </span>
                      </div>

                      <!-- <span class="text-sm font-medium">
                        {{ category.name }}
                      </span> -->
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Available Parts -->
            <div
              v-if="selectedPartCategoryId"
              class="mt-5 space-y-4"
            >
              <!-- Header & Search -->
              <div
                class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 class="font-semibold">
                    Select Parts
                  </h3>

                  <p class="text-sm text-gray-content/60">
                    Choose the required parts from the list below.
                  </p>
                </div>

                <span class="text-sm text-gray-content/60">
                  {{ availableParts.length }} parts found
                </span>
              </div>

              <input
                v-model="partSearch"
                type="text"
                placeholder="Search part name or part number..."
                class="input input-bordered w-full"
                @input="fetchAvailableParts"
              />

              <!-- Loading -->
              <div
                v-if="partLoading"
                class="flex justify-center py-8"
              >
                <span class="loading loading-spinner loading-md"></span>
              </div>

              <!-- Error -->
              <div
                v-else-if="partsError"
                class="alert alert-error text-sm"
              >
                {{ partsError }}
              </div>

              <!-- Empty -->
              <div
                v-else-if="!availableParts.length"
                class="rounded-xl bg-gray-200 py-10 text-center text-sm text-gray-content/60"
              >
                No parts found for this category.
              </div>

              <!-- Parts Grid -->
              <div
                v-else
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
              >
                <div
                  v-for="part in availableParts"
                  :key="part.id"
                  class="card overflow-hidden border border-gray-300 bg-gray-100 transition-all hover:border-primary hover:shadow-md"
                  :class="
                    selectedPartRequests.some(
                      (item: any) =>
                        String(item.part_id) === String(part.id)
                    )
                      ? 'border-primary ring-2 ring-primary/30'
                      : ''
                  "
                >
                  <!-- Image -->
                  <figure class="h-40 bg-gray-200 p-3">
                    <img
                      v-if="part.image"
                      :src="part.image"
                      :alt="part.name"
                      class="h-full w-full object-contain"
                    />

                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center"
                    >
                      <span class="text-5xl font-bold text-gray-content/20">
                        {{ part.name?.charAt(0)?.toUpperCase() }}
                      </span>
                    </div>
                  </figure>

                  <!-- Details -->
                  <div class="card-body gap-2 p-4">
                    <h4 class="line-clamp-2 font-semibold">
                      {{ part.name }}
                    </h4>

                    <p class="text-xs text-gray-content/60">
                      {{ part.part_number || 'No part number' }}
                    </p>

                    <p class="text-xs text-gray-content/60">
                      Brand: {{ part.brand || 'Generic' }}
                    </p>

                    <div class="flex items-center justify-between gap-2">
                      <span class="font-bold text-primary">
                        ₹{{ Number(part.selling_price || 0).toLocaleString('en-IN') }}
                      </span>

                      <span
                        class="text-xs"
                        :class="
                          Number(part.current_stock) > 0
                            ? 'text-success'
                            : 'text-error'
                        "
                      >
                        {{ Number(part.current_stock) }} in stock
                      </span>
                    </div>

                    <!-- Action -->
                    <button
                      type="button"
                      class="btn btn-primary btn-sm mt-2 w-full"
                      :disabled="
                        selectedPartRequests.some(
                          (item: any) =>
                            String(item.part_id) === String(part.id)
                        )
                      "
                      @click="selectPart(part)"
                    >
                      {{
                        selectedPartRequests.some(
                          (item: any) =>
                            String(item.part_id) === String(part.id)
                        )
                          ? 'Added'
                          : 'Add Part'
                      }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected Parts Summary -->
            <div
              v-if="selectedPartRequests.length"
              class="mt-5 rounded-xl border border-gray-300 bg-gray-200 p-3"
            >
              <!-- Header -->
              <div class="mb-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="rounded-lg bg-primary/10 p-2">
                    <icon
                      name="clipboard-check"
                      size="sm"
                      class="text-primary"
                    />
                  </div>

                  <div>
                    <h3 class="text-sm font-bold">
                      Selected Parts
                    </h3>

                    <p class="text-xs text--gray-800/60">
                      {{ selectedPartRequests.length }} items selected
                    </p>
                  </div>
                </div>

                <span class="badge badge-primary badge-sm">
                  Request Summary
                </span>
              </div>

              <!-- Compact List -->
              <div class="space-y-2">
                <div
                  v-for="(part, index) in selectedPartRequests"
                  :key="part.part_id"
                  class="flex items-center gap-3 rounded-lg border border-gray-300 bg-gray-100 p-2"
                >
                  <!-- Thumbnail -->
                  <div
                    class="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-lg bg-gray-200"
                  >
                    <img
                      v-if="part.image"
                      :src="part.image"
                      :alt="part.name"
                      class="h-full w-full object-contain"
                    />

                    <span
                      v-else
                      class="text-xl font-bold text--gray-800/30"
                    >
                      {{ part.name?.charAt(0)?.toUpperCase() }}
                    </span>
                  </div>

                  <!-- Part Details -->
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold">
                      {{ part.name }}
                    </p>

                    <p class="truncate text-xs text--gray-800/60">
                      {{ part.part_number || 'No part number' }}
                    </p>

                    <p class="text-xs text--gray-800/60">
                      ₹{{ Number(part.unit_price).toLocaleString('en-IN') }}
                      / {{ part.unit || 'pcs' }}
                    </p>
                  </div>

                  <!-- Quantity -->
                  <div class="flex flex-none items-center gap-1">
                    <button
                      type="button"
                      class="btn btn-square btn-ghost btn-xs"
                      :disabled="Number(part.quantity) <= 1"
                      @click="part.quantity = Math.max(1, Number(part.quantity) - 1)"
                    >
                      −
                    </button>

                    <input
                      v-model.number="part.quantity"
                      type="number"
                      min="1"
                      class="input input-bordered input-xs w-12 text-center"
                    />

                    <button
                      type="button"
                      class="btn btn-square btn-ghost btn-xs"
                      @click="part.quantity = Number(part.quantity) + 1"
                    >
                      +
                    </button>
                  </div>

                  <!-- Item Total -->
                  <div class="hidden w-24 flex-none text-right sm:block">
                    <p class="text-sm font-bold">
                      ₹{{
                        (
                          Number(part.unit_price || 0) *
                          Number(part.quantity || 0)
                        ).toLocaleString('en-IN')
                      }}
                    </p>
                  </div>

                  <!-- Remove -->
                  <button
                    type="button"
                    class="btn btn-square btn-ghost btn-sm text-error"
                    @click="selectedPartRequests.splice(index, 1)"
                  >
                    <icon name="trash-2" size="sm"/>
                  </button>
                </div>
              </div>

              <!-- Summary Footer -->
              <div
                class="mt-3 flex items-center justify-between border-t border-primary/20 pt-3"
              >
                <span class="text-xs text--gray-800/60">
                  Estimated parts total
                </span>

                <span class="font-bold text-primary">
                  ₹{{
                    selectedPartRequests
                      .reduce(
                        (total: number, part: any) =>
                          total +
                          Number(part.unit_price || 0) *
                          Number(part.quantity || 0) -
                          Number(part.discount || 0),
                        0
                      )
                      .toLocaleString('en-IN')
                  }}
                </span>
              </div>
            </div>

          </div>

        </section>

        <!-- Fixed Footer -->
        <div class="flex flex-none flex-wrap items-center justify-end gap-3 border-t border-gray-300 bg-gray-100 px-5 py-4 ">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="partSaving"
            @click="closePartsModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="partSaving || !selectedPartRequests.length"
            @click="savePart"
          >
            <span
              v-if="partSaving"
              class="loading loading-spinner loading-sm"
            ></span>

            Request Parts
          </button>
        </div>

      </div>

      <div
        class="modal-backdrop"
      ></div>
    </dialog>

  </div>
</template>