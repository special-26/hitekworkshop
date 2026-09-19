
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
    is_active?: boolean
    roles?: {
      uuid: string
      name: string
    }[]
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
interface ServiceTaskPart {
  id: number
  part_id: number
  default_quantity: number | string
  is_required: boolean

  part?: {
    id: number
    part_number: string
    name: string
    category: string | null
    brand: string | null
    unit: string
    selling_price: string | number
  }
}

interface ServiceTask {
  id: number
  name: string
  slug: string
  description: string | null
  instructions: string | null
  part_category_id: number | null
  is_active: boolean

  part_category?: {
    id: number
    name: string
  }

  task_parts?: ServiceTaskPart[]
}
interface JobCardTask {
  id: number
  job_card_id: number
  service_task_id: number | null
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

  service_task?: ServiceTask | null

  department?: Department
  bay?: Bay
  assigned_employee?: {
    id: number
    employee_code: string
    designation: string | null
    user?: {
      id: string | number
      name: string
    }
  }
}

interface JobCardPart {
  id: number
  job_card_id: number
  part_id: number
  job_card_task_id: number | null
  quantity: string | number
  unit_price: string | number
  discount: string | number
  total: string | number
  status: 'pending' | 'issued' | 'returned' | 'cancelled'
  issued_by: string | number | null
  issued_at: string | null
  notes: string | null

  part?: {
    id: number
    part_number: string
    name: string
    category: string | null
    brand: string | null
    unit: string
    selling_price: string | number
    current_stock: string | number
  }

  task?: {
    id: number
    title: string
  }

  issued_by_user?: {
    id: string | number
    name: string
  }
}

interface JobCardEstimateItem {
  id: number
  job_card_estimate_id: number
  item_type: 'labour' | 'part'
  description: string
  quantity: string | number
  unit_price: string | number
  discount: string | number
  total: string | number
}

interface JobCardEstimate {
  id: number
  job_card_id: number
  estimate_number: string
  subtotal: string | number
  discount: string | number
  tax: string | number
  total: string | number
  status: string
  created_by: string | number | null
  items: JobCardEstimateItem[]
}

interface JobCardInvoiceItem {
  id: number
  job_card_invoice_id: number
  item_type: 'labour' | 'part'
  description: string
  quantity: string | number
  unit_price: string | number
  discount: string | number
  total: string | number
}

interface JobCardInvoice {
  id: number
  job_card_id: number
  invoice_number: string
  subtotal: string | number
  discount: string | number
  tax: string | number
  total: string | number
  status: string
  created_by: string | number | null
  items: JobCardInvoiceItem[]
}

interface SelectedPartRequest {
  part_id: string
  job_card_task_id: string
  quantity: string
  unit_price: string
  discount: string
  notes: string
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

const serviceTasks = ref<ServiceTask[]>([])
const serviceTasksLoading = ref(false)
const serviceTaskMode = ref<'predefined' | 'custom'>('predefined')

// Fetch Predefined Service Tasks
const fetchServiceTasks = async () => {
  serviceTasksLoading.value = true

  try {
    const response = await api('/api/admin/service-tasks', {
      query: {
        is_active: true,
        per_page: 100,
      },
    })

    const data = response.data

    serviceTasks.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
  } catch (err: any) {
    console.error('Unable to load service tasks:', err)

    taskError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load predefined tasks.'
  } finally {
    serviceTasksLoading.value = false
  }
}
const selectedServiceTask = computed(() => {
  if (!taskForm.service_task_id) {
    return null
  }

  return serviceTasks.value.find(
    task => String(task.id) === String(taskForm.service_task_id)
  ) || null
})
const applyServiceTask = (serviceTask: ServiceTask | null) => {
  if (!serviceTask) {
    return
  }

  taskForm.title = serviceTask.name
  taskForm.description = serviceTask.description || ''
}

// Job Card Parts
const parts = ref<JobCardPart[]>([])
const partsLoading = ref(false)
const partsError = ref('')

// Estimated Bill
const estimate = ref<JobCardEstimate | null>(null)
const estimateLoading = ref(false)
const estimateSaving = ref(false)
const estimateError = ref('')

const estimateItems = ref<JobCardEstimateItem[]>([])

const estimateForm = reactive({
  discount: '0',
  tax: '0',
})

const newEstimateItem = reactive({
  item_type: 'labour' as 'labour' | 'part',
  description: '',
  quantity: '1',
  unit_price: '',
  discount: '0',
})

const estimateItemTotal = (
  item: {
    quantity: string | number
    unit_price: string | number
    discount: string | number
  }
) => {
  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unit_price) || 0
  const discount = Number(item.discount) || 0

  return Math.max(
    0,
    quantity * unitPrice - discount
  )
}

const estimateSubtotal = computed(() => {
  return estimateItems.value.reduce(
    (sum, item) => sum + estimateItemTotal(item),
    0
  )
})

const estimateDiscount = computed(() => {
  return Math.max(
    0,
    Number(estimateForm.discount) || 0
  )
})

const estimateTax = computed(() => {
  return Math.max(
    0,
    Number(estimateForm.tax) || 0
  )
})

const estimateTotal = computed(() => {
  return Math.max(
    0,
    estimateSubtotal.value -
      estimateDiscount.value +
      estimateTax.value
  )
})

const addEstimateItem = () => {
  if (!newEstimateItem.description.trim()) {
    estimateError.value = 'Please enter an item description.'
    return
  }

  if (
    !newEstimateItem.quantity ||
    Number(newEstimateItem.quantity) <= 0
  ) {
    estimateError.value = 'Quantity must be greater than 0.'
    return
  }

  if (
    newEstimateItem.unit_price === '' ||
    Number(newEstimateItem.unit_price) < 0
  ) {
    estimateError.value = 'Please enter a valid unit price.'
    return
  }

  estimateError.value = ''

  estimateItems.value.push({
    id: Date.now(),
    job_card_estimate_id: estimate.value?.id || 0,
    item_type: newEstimateItem.item_type,
    description: newEstimateItem.description.trim(),
    quantity: Number(newEstimateItem.quantity),
    unit_price: Number(newEstimateItem.unit_price),
    discount: Number(newEstimateItem.discount) || 0,
    total: estimateItemTotal(newEstimateItem),
  })

  newEstimateItem.item_type = 'labour'
  newEstimateItem.description = ''
  newEstimateItem.quantity = '1'
  newEstimateItem.unit_price = ''
  newEstimateItem.discount = '0'
}

const removeEstimateItem = (index: number) => {
  estimateItems.value.splice(index, 1)
}

const saveEstimate = async () => {
  console.log('SAVE ESTIMATE CLICKED')

  if (!jobCard.value) {
    console.log('NO JOB CARD')
    estimateError.value = 'Job card not loaded.'
    return
  }

  if (estimateItems.value.length === 0) {
    console.log('NO ESTIMATE ITEMS')
    estimateError.value = 'Please add at least one estimate item.'
    return
  }

  const payload = {
    items: estimateItems.value.map(item => ({
      item_type: item.item_type,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      discount: Number(item.discount) || 0,
    })),

    discount: estimateDiscount.value,
    tax: estimateTax.value,
  }

  console.log('ESTIMATE PAYLOAD:', payload)

  estimateSaving.value = true
  estimateError.value = ''

  try {
    const url = `/api/admin/job-cards/${jobCard.value.id}/estimate`

    console.log('POST URL:', url)

    const response = await api(url, {
      method: 'POST',
      body: payload,
    })

    console.log('SAVE ESTIMATE RESPONSE:', response)

    estimate.value = response.data

    estimateItems.value = [
      ...estimate.value.items,
    ]

    estimateForm.discount = String(
      estimate.value.discount ?? 0
    )

    estimateForm.tax = String(
      estimate.value.tax ?? 0
    )

    console.log('ESTIMATE SAVED SUCCESSFULLY')

  } catch (err: any) {
    console.error('SAVE ESTIMATE ERROR:', err)

    console.error(
      'ERROR DATA:',
      err?.data
    )

    console.error(
      'ERROR RESPONSE:',
      err?.response?._data
    )

    estimateError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      err?.message ||
      'Unable to save estimated bill.'

  } finally {
    estimateSaving.value = false
  }
}
// Estimated Bill Ends
// Final Bill
const invoice = ref<JobCardInvoice | null>(null)
const invoiceLoading = ref(false)
const invoiceSaving = ref(false)
const invoiceError = ref('')

const invoiceItems = ref<JobCardInvoiceItem[]>([])

const invoiceForm = reactive({
  discount: '0',
  tax: '0',
})

const newInvoiceItem = reactive({
  item_type: 'labour' as 'labour' | 'part',
  description: '',
  quantity: '1',
  unit_price: '',
  discount: '0',
})
const invoiceItemTotal = (
  item: {
    quantity: string | number
    unit_price: string | number
    discount: string | number
  }
) => {
  const quantity = Number(item.quantity) || 0
  const unitPrice = Number(item.unit_price) || 0
  const discount = Number(item.discount) || 0

  return Math.max(
    0,
    quantity * unitPrice - discount
  )
}

const invoiceSubtotal = computed(() => {
  return invoiceItems.value.reduce(
    (sum, item) => sum + invoiceItemTotal(item),
    0
  )
})

const invoiceDiscount = computed(() => {
  return Math.max(
    0,
    Number(invoiceForm.discount) || 0
  )
})

const invoiceTax = computed(() => {
  return Math.max(
    0,
    Number(invoiceForm.tax) || 0
  )
})

const invoiceTotal = computed(() => {
  return Math.max(
    0,
    invoiceSubtotal.value -
      invoiceDiscount.value +
      invoiceTax.value
  )
})
const addInvoiceItem = () => {
  if (!newInvoiceItem.description.trim()) {
    invoiceError.value =
      'Please enter an item description.'

    return
  }

  if (
    !newInvoiceItem.quantity ||
    Number(newInvoiceItem.quantity) <= 0
  ) {
    invoiceError.value =
      'Quantity must be greater than 0.'

    return
  }

  if (
    newInvoiceItem.unit_price === '' ||
    Number(newInvoiceItem.unit_price) < 0
  ) {
    invoiceError.value =
      'Please enter a valid unit price.'

    return
  }

  invoiceError.value = ''

  invoiceItems.value.push({
    id: Date.now(),

    job_card_invoice_id:
      invoice.value?.id || 0,

    item_type:
      newInvoiceItem.item_type,

    description:
      newInvoiceItem.description.trim(),

    quantity:
      Number(newInvoiceItem.quantity),

    unit_price:
      Number(newInvoiceItem.unit_price),

    discount:
      Number(newInvoiceItem.discount) || 0,

    total:
      invoiceItemTotal(newInvoiceItem),
  })

  newInvoiceItem.item_type = 'labour'
  newInvoiceItem.description = ''
  newInvoiceItem.quantity = '1'
  newInvoiceItem.unit_price = ''
  newInvoiceItem.discount = '0'
}

const saveInvoice = async () => {
  console.log('SAVE FINAL BILL CLICKED')

  if (!jobCard.value) {
    invoiceError.value =
      'Job card not loaded.'

    return
  }

  if (invoiceItems.value.length === 0) {
    invoiceError.value =
      'Please add at least one final bill item.'

    return
  }

  invoiceSaving.value = true
  invoiceError.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.value.id}/invoice`,
      {
        method: 'POST',

        body: {
          items: invoiceItems.value.map(item => ({
            item_type: item.item_type,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            discount: Number(item.discount) || 0,
          })),

          discount: invoiceDiscount.value,
          tax: invoiceTax.value,
        },
      }
    )

    console.log(
      'FINAL BILL SAVED:',
      response
    )

    invoice.value = response.data

    invoiceItems.value = [
      ...invoice.value.items,
    ]

    invoiceForm.discount = String(
      invoice.value.discount ?? 0
    )

    invoiceForm.tax = String(
      invoice.value.tax ?? 0
    )

  } catch (err: any) {
    console.error(
      'SAVE FINAL BILL ERROR:',
      err
    )

    invoiceError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      err?.message ||
      'Unable to save final bill.'

  } finally {
    invoiceSaving.value = false
  }
}
const invoiceGenerating = ref(false)
const generateInvoice = async () => {
  if (!jobCard.value) {
    invoiceError.value = 'Job card not loaded.'
    return
  }

  invoiceGenerating.value = true
  invoiceError.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.value.id}/invoice/generate`,
      {
        method: 'POST',
      }
    )

    const generated = response.data

    invoiceItems.value = (generated.items || []).map(
      (item: any, index: number) => ({
        id: Date.now() + index,
        job_card_invoice_id: invoice.value?.id || 0,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
      })
    )

    invoiceForm.discount = String(
      generated.discount ?? 0
    )

    invoiceForm.tax = String(
      generated.tax ?? 0
    )

  } catch (err: any) {
    console.error(
      'GENERATE FINAL BILL ERROR:',
      err
    )

    invoiceError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      err?.message ||
      'Unable to generate final bill.'

  } finally {
    invoiceGenerating.value = false
  }
}
// Final Bill Ends


// Part Requested
const filteredAvailableParts = computed(() => {
  const search = partSearch.value.trim().toLowerCase()

  if (!search) {
    return availableParts.value
  }

  return availableParts.value.filter((part) => {
    return [
      part.part_number,
      part.name,
      part.brand,
      part.category,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(search)
      )
  })
})
const isPartSelected = (partId: number | string) => {
  return selectedPartRequests.value.some(
    (item) => String(item.part_id) === String(partId)
  )
}

const getSelectedPartRequest = (partId: number | string) => {
  return selectedPartRequests.value.find(
    (item) => String(item.part_id) === String(partId)
  )
}

const addPartToSelection = (part: any) => {
  if (isPartSelected(part.id)) {
    return
  }

  selectedPartRequests.value.push({
    part_id: String(part.id),
    job_card_task_id: '',
    quantity: '1',
    unit_price: String(part.selling_price ?? '0'),
    discount: '0',
    notes: '',
  })
}

const removePartFromSelection = (partId: number | string) => {
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

const getSelectedPartDetails = (partId: number | string) => {
  return availableParts.value.find(
    (part) => String(part.id) === String(partId)
  ) || null
}

const getSelectedPartTotal = (
  selected: SelectedPartRequest
) => {
  const quantity = Number(selected.quantity) || 0
  const unitPrice = Number(selected.unit_price) || 0
  const discount = Number(selected.discount) || 0

  return Math.max(
    0,
    quantity * unitPrice - discount
  )
}

const closePartModal = () => {
  if (partSaving.value) {
    return
  }

  partsModalOpen.value = false
}
const savePart = async () => {
  if (!jobCard.value) {
    return
  }

  if (selectedPartRequests.value.length === 0) {
    partsError.value = 'Please select at least one part.'
    return
  }

  for (const selected of selectedPartRequests.value) {
    if (!selected.quantity || Number(selected.quantity) <= 0) {
      partsError.value = 'Quantity must be greater than zero.'
      return
    }

    if (
      selected.discount &&
      Number(selected.discount) < 0
    ) {
      partsError.value = 'Discount cannot be negative.'
      return
    }

    if (
      selected.unit_price &&
      Number(selected.unit_price) < 0
    ) {
      partsError.value = 'Unit price cannot be negative.'
      return
    }

    const total = getSelectedPartTotal(selected)

    if (total < 0) {
      partsError.value = 'Invalid part total.'
      return
    }
  }

  partSaving.value = true
  partsError.value = ''

  try {
    for (const selected of selectedPartRequests.value) {
      await api(
        `/api/admin/job-cards/${jobCard.value.id}/parts`,
        {
          method: 'POST',
          body: {
            part_id: Number(selected.part_id),

            job_card_task_id:
              selected.job_card_task_id
                ? Number(selected.job_card_task_id)
                : null,

            quantity: Number(selected.quantity),

            unit_price:
              selected.unit_price
                ? Number(selected.unit_price)
                : null,

            discount:
              selected.discount
                ? Number(selected.discount)
                : 0,

            notes:
              selected.notes.trim() || null,
          },
        }
      )
    }

    partsModalOpen.value = false
    resetPartForm()

    await fetchParts()
  } catch (err: any) {
    console.error(err)

    partsError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to add one or more parts.'
  } finally {
    partSaving.value = false
  }
}

const selectedPartsTotal = computed(() => {
  return selectedPartRequests.value.reduce(
    (total, selected) => {
      return total + getSelectedPartTotal(selected)
    },
    0
  )
})

// Request parts
const availableParts = ref<any[]>([])
const partsModalOpen = ref(false)
const partSaving = ref(false)
const partSearch = ref('')

const selectedPartRequests = ref<SelectedPartRequest[]>([])

// Open/close modal of Add Parts
const resetPartForm = () => {
  selectedPartRequests.value = []
  partSearch.value = ''
}

const openCreatePart = async () => {
  resetPartForm()
  partsError.value = ''

  if (availableParts.value.length === 0) {
    await fetchAvailableParts()
  }

  partsModalOpen.value = true
}

const taskModalOpen = ref(false)
const editingTask = ref<JobCardTask | null>(null)
const taskForm = reactive({
  service_task_id: '',
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

// Fetching added Parts
const fetchAvailableParts = async () => {
  try {
    const response = await api('/api/admin/parts', {
      query: {
        is_active: true,
        per_page: 100,
      },
    })

    const data = response.data

    availableParts.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
  } catch (err: any) {
    console.error(err)

    partsError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load parts.'
  }
}
const issuePart = async (partId: number) => {
  if (!jobCard.value) return

  if (!confirm('Issue this part from stock?')) return

  try {
    await api(
      `/api/admin/job-cards/${jobCard.value.id}/parts/${partId}/issue`,
      {
        method: 'PATCH',
      }
    )

    await Promise.all([
      fetchParts(),
      fetchJobCard(),
    ])
  } catch (err: any) {
    alert(
      err?.data?.message ||
      'Failed to issue part.'
    )
  }
}
const returnPart = async (partId: number) => {
  if (!jobCard.value) return

  if (!confirm('Return this part to stock?')) return

  try {
    await api(
      `/api/admin/job-cards/${jobCard.value.id}/parts/${partId}/return`,
      {
        method: 'PATCH',
      }
    )

    await Promise.all([
      fetchParts(),
      fetchJobCard(),
    ])
  } catch (err: any) {
    alert(
      err?.data?.message ||
      'Failed to return part.'
    )
  }
}
// Parts ends

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

const fetchParts = async () => {
  if (!jobCard.value) {
    return
  }

  partsLoading.value = true
  partsError.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.value.id}/parts`
    )

    parts.value = Array.isArray(response.data)
      ? response.data
      : []
  } catch (err: any) {
    console.error(err)

    partsError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load job card parts.'
  } finally {
    partsLoading.value = false
  }
}

const fetchEstimate = async () => {
  if (!jobCard.value) {
    return
  }

  estimateLoading.value = true
  estimateError.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.value.id}/estimate`
    )

    estimate.value = response.data || null

    if (estimate.value) {
      estimateItems.value = [...estimate.value.items]

      estimateForm.discount = String(
        estimate.value.discount ?? 0
      )

      estimateForm.tax = String(
        estimate.value.tax ?? 0
      )
    } else {
      estimateItems.value = []

      estimateForm.discount = '0'
      estimateForm.tax = '0'
    }
  } catch (err: any) {
    console.error(err)

    estimateError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load estimated bill.'
  } finally {
    estimateLoading.value = false
  }
}

const fetchInvoice = async () => {
  if (!jobCard.value) {
    return
  }

  invoiceLoading.value = true
  invoiceError.value = ''

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.value.id}/invoice`
    )

    invoice.value = response.data || null

    if (invoice.value) {
      invoiceItems.value = [
        ...invoice.value.items,
      ]

      invoiceForm.discount = String(
        invoice.value.discount ?? 0
      )

      invoiceForm.tax = String(
        invoice.value.tax ?? 0
      )
    } else {
      invoiceItems.value = []

      invoiceForm.discount = '0'
      invoiceForm.tax = '0'
    }
  } catch (err: any) {
    console.error(err)

    invoiceError.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load final bill.'
  } finally {
    invoiceLoading.value = false
  }
}

const resetTaskForm = () => {
  taskForm.service_task_id = ''
  serviceTaskMode.value = 'predefined'

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

const openCreateTask = async () => {
  editingTask.value = null
  resetTaskForm()
  taskError.value = ''

  if (serviceTasks.value.length === 0) {
    await fetchServiceTasks()
  }

  taskModalOpen.value = true
}

const openEditTask = (
  task: JobCardTask
) => {
  editingTask.value = task
  serviceTaskMode.value = 'custom'

  taskForm.service_task_id = ''
  taskForm.department_id = String(task.department_id)

  taskForm.bay_id = task.bay_id
    ? String(task.bay_id)
    : ''

  taskForm.assigned_to = task.assigned_to
    ? String(task.assigned_to)
    : ''

  taskForm.title = task.title || ''
  taskForm.description = task.description || ''

  taskForm.estimated_minutes =
    task.estimated_minutes !== null
      ? String(task.estimated_minutes)
      : ''

  taskForm.labour_cost =
    task.labour_cost !== null
      ? String(task.labour_cost)
      : ''

  taskForm.notes = task.notes || ''

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
      service_task_id:
        serviceTaskMode.value === 'predefined' &&
        taskForm.service_task_id
          ? Number(taskForm.service_task_id)
          : null,

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

      description: taskForm.description || null,

      estimated_minutes: taskForm.estimated_minutes
        ? Number(taskForm.estimated_minutes)
        : null,

      labour_cost: taskForm.labour_cost
        ? Number(taskForm.labour_cost)
        : null,

      notes: taskForm.notes || null,
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

    await Promise.all([
      fetchTasks(),
      fetchParts(),
      fetchEstimate(),
      fetchInvoice(),
    ])

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

const partStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'badge-warning',
    issued: 'badge-success',
    returned: 'badge-info',
    cancelled: 'badge-error',
  }

  return classes[status] || 'badge-ghost'
}

const partStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    issued: 'Issued',
    returned: 'Returned',
    cancelled: 'Cancelled',
  }

  return labels[status] || status
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

  const data = response.data.data

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
  const departmentId = Number(taskForm.department_id)

  if (!departmentId || !Array.isArray(employees.value)) {
    return []
  }

  return employees.value.filter(employee => {
    return (
      employee.status === 'active' &&
      employee.department_id === departmentId &&
      employee.user?.roles?.some(
        role => role.name === 'Mechanic'
      ) === true
    )
  })
})

// Whatsapp Methods
const openWhatsApp = async (type: string) => {
  if (!jobCard.value?.id) {
    return
  }

  try {
    const response = await api(
      `/api/admin/job-cards/${jobCard.value.id}/whatsapp`,
      {
        method: 'POST',
        body: {
          type,
        },
      }
    )

    const url = response?.url

    if (!url) {
      console.error(
        'WhatsApp URL missing from response:',
        response
      )

      alert('WhatsApp URL was not returned by the server.')
      return
    }

    window.open(url, '_blank')
  } catch (error: any) {
    console.error('WhatsApp error:', error)

    alert(
      error?.response?.data?.message ||
      'Unable to open WhatsApp.'
    )
  }
}

watch(
  () => taskForm.department_id,
  () => {
    taskForm.bay_id = ''
    taskForm.assigned_to = ''
  }
)
// Watch Service task
watch(
  () => taskForm.service_task_id,
  (serviceTaskId) => {
    if (serviceTaskMode.value !== 'predefined') {
      return
    }

    if (!serviceTaskId) {
      return
    }

    const serviceTask = serviceTasks.value.find(
      task => String(task.id) === String(serviceTaskId)
    )

    applyServiceTask(serviceTask || null)
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
          <h1 class="text-2xl font-bold text-gray-content">
            Job Card Details
          </h1>

          <p class="mt-1 text-sm text-gray-content/60">
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
      class="card border border-gray-300 bg-gray-100 shadow-xl"
    >
      <div class="card-body flex items-center justify-center py-20">
        <span class="loading loading-spinner loading-lg" />

        <p class="mt-3 text-sm text-gray-content/60">
          Loading job card details...
        </p>
      </div>
    </div>

    <!-- Job Card -->
    <template v-else-if="jobCard">
      <!-- Top Overview -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main -->
        <div class="card border border-gray-300 bg-gray-100 shadow-xl lg:col-span-2">
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

                <p class="mt-1 text-sm text-gray-content/50">
                  Job Card #{{ jobCard.id }}
                </p>
              </div>
            </div>

            <div class="divider" />

            <!-- Vehicle -->
            <div>
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-wide text-gray-200">
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
                <div class="rounded-lg bg-gray-200 p-4">
                  <p class="text-xs text-gray-content/50">
                    Registration
                  </p>

                  <code class="mt-1 block font-semibold">
                    {{ jobCard.vehicle.registration_number }}
                  </code>
                </div>

                <div class="rounded-lg bg-gray-200 p-4">
                  <p class="text-xs text-gray-content/50">
                    Variant
                  </p>

                  <p class="mt-1 font-medium">
                    {{ jobCard.vehicle.variant || '—' }}
                  </p>
                </div>

                <div class="rounded-lg bg-gray-200 p-4">
                  <p class="text-xs text-gray-content/50">
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
              <p class="text-xs uppercase tracking-wide text-gray-content/50">
                Customer Complaint / Requested Work
              </p>

              <div class="mt-3 rounded-lg border border-gray-300 bg-gray-200 p-5">
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
              <p class="text-xs uppercase tracking-wide text-gray-content/50">
                Customer Notes
              </p>

              <div class="mt-3 rounded-lg border border-gray-300 bg-gray-200 p-5">
                <p class="whitespace-pre-line text-sm leading-6">
                  {{ jobCard.customer_notes }}
                </p>
              </div>
            </div>

            <!-- Estimated Completion -->
            <div class="mt-5 rounded-lg border border-gray-300 bg-gray-100 p-4">
              <div class="text-sm text-gray-content/60">
                Estimated Completion
              </div>

              <div class="mt-1 font-medium">
                {{ jobCard?.estimated_completion_at || 'Not specified' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Workflow  Status-->
        <div class="card border border-gray-300 bg-gray-100 shadow-xl">
          <!-- temporary whatsapp actions -->
          <div class=""whatsapp-action mb-4 border-b>
            <button
              type="button"
              class="btn btn-success"
              @click="openWhatsApp('job_card_created')"
            >
              <span>💬</span>
              WhatsApp Customer
            </button>
          </div>

          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-semibold">
                  Workflow Status
                </h2>

                <p class="mt-1 text-xs text-gray-content/50">
                  Update the progress of this job card.
                </p>
              </div>

              <Icon
                name="lucide:activity"
                class="size-5 text-gray-content/50"
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
                      ? 'border-gray-300 bg-gray-200'
                      : 'border-gray-300/50 bg-gray-200/40 opacity-50'
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
                          ? 'bg-gray-300 text-gray-content'
                          : 'bg-gray-300/50 text-gray-content/30'
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

                    <p class="mt-0.5 text-xs text-gray-content/50">
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
              class="mt-5 rounded-lg border border-gray-300 bg-gray-200 p-4 text-sm text-gray-content/60"
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
        <div class="card border border-gray-300 bg-gray-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="text-lg font-semibold">
                  Customer
                </h2>

                <p class="text-sm text-gray-content/60">
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
              class="mt-5 rounded-lg border border-gray-300 bg-gray-200 p-5"
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

                  <div class="mt-1 flex flex-wrap gap-3 text-sm text-gray-content/60">
                    <span>
                      {{ jobCard.customer.customer_code }}
                    </span>

                    <span>
                      {{ jobCard.customer.phone }}
                    </span>
                  </div>

                  <p
                    v-if="jobCard.customer.email"
                    class="mt-1 text-sm text-gray-content/60"
                  >
                    {{ jobCard.customer.email }}
                  </p>
                </div>
              </div>
            </div>

            <div
              v-else
              class="mt-5 rounded-lg border border-gray-300 bg-gray-200 p-5 text-sm text-gray-content/60"
            >
              Customer information is not available.
            </div>
          </div>
        </div>

        <!-- Workshop Assignment -->
        <div class="card border border-gray-300 bg-gray-100 shadow-xl">
          <div class="card-body">
            <div>
              <h2 class="text-lg font-semibold">
                Workshop Assignment
              </h2>

              <p class="text-sm text-gray-content/60">
                Department, bay and advisor assigned to this job.
              </p>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <!-- Department -->
              <div class="rounded-lg border border-gray-300 bg-gray-200 p-4">
                <p class="text-xs text-gray-content/50">
                  Department
                </p>

                <p class="mt-1 font-medium">
                  {{ jobCard.department?.name || '—' }}
                </p>
              </div>

              <!-- Bay -->
              <div class="rounded-lg border border-gray-300 bg-gray-200 p-4">
                <p class="text-xs text-gray-content/50">
                  Bay
                </p>

                <p class="mt-1 font-medium">
                  {{ jobCard.bay?.name || 'Not assigned' }}
                </p>

                <p
                  v-if="jobCard.bay?.code"
                  class="mt-1 text-xs text-gray-content/50"
                >
                  {{ jobCard.bay.code }}
                </p>
              </div>

              <!-- Advisor -->
              <div class="rounded-lg border border-gray-300 bg-gray-200 p-4">
                <p class="text-xs text-gray-content/50">
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

      <!-- Billing Grid -->
      <div class="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">

        <!-- Estimate Bill -->
        <div class="card mt-4 border border-gray-300 bg-gray-100 shadow-md">
          <div class="card-body p-3 sm:p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="card-title">
                  Estimated Bill
                </h2>

                <p class="text-sm text-gray-content/60">
                  Prepare and save the estimated bill for this job card.
                </p>
              </div>

              <div
                v-if="estimate"
                class="badge badge-outline"
              >
                {{ estimate.estimate_number }}
              </div>
            </div>

            <!-- Loading -->
            <div
              v-if="estimateLoading"
              class="flex justify-center py-8"
            >
              <span class="loading loading-spinner loading-md"></span>
            </div>

            <template v-else>
              <!-- Error -->
              <div
                v-if="estimateError"
                class="alert alert-error mt-4"
              >
                <span>{{ estimateError }}</span>
              </div>

              <!-- Add Estimate Item -->
              <div class="collapse rounded-lg border border-gray-300">
                <input type="checkbox" />
                <h3 class="collapse-title flex items-center justify-between text-sm font-semibold bg-gray-200 p-3 border-b border-gray-300">
                  Add Estimate Item
                  <Icon name="i-lucide-chevron-down" class="text-xl" />
                </h3>

                <div class="grid grid-cols-6 gap-2 p-3 collapse-content">

                  <!-- Type -->
                  <div class="col-span-3">
                    <label class="label py-1">
                      <span class="label-text text-xs">Type</span>
                    </label>

                    <select
                      v-model="newEstimateItem.item_type"
                      class="select select-bordered select-sm w-full"
                    >
                      <option value="labour">Labour</option>
                      <option value="part">Part</option>
                    </select>
                  </div>

                  <!-- Description -->
                  <div class="col-span-3">
                    <label class="label py-1">
                      <span class="label-text text-xs">Description</span>
                    </label>

                    <input
                      v-model="newEstimateItem.description"
                      type="text"
                      class="input input-bordered input-sm w-full"
                      placeholder="e.g. Engine oil change"
                      @keyup.enter="addEstimateItem"
                    />
                  </div>

                  <!-- Quantity -->
                  <div class="col-span-2">
                    <label class="label py-1">
                      <span class="label-text text-xs">Qty</span>
                    </label>

                    <input
                      v-model="newEstimateItem.quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      class="input input-bordered input-sm w-full"
                    />
                  </div>

                  <!-- Unit Price -->
                  <div class="col-span-2">
                    <label class="label py-1">
                      <span class="label-text text-xs">Unit Price</span>
                    </label>

                    <input
                      v-model="newEstimateItem.unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input input-bordered input-sm w-full"
                      placeholder="0.00"
                    />
                  </div>

                  <!-- Discount -->
                  <div class="col-span-2">
                    <label class="label py-1">
                      <span class="label-text text-xs">Discount</span>
                    </label>

                    <input
                      v-model="newEstimateItem.discount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input input-bordered input-sm w-full"
                      placeholder="0"
                    />
                  </div>

                  <!-- Add Button -->
                  <div class="col-span-2">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm w-full"
                      @click="addEstimateItem"
                    >
                      + Add Estimate Item
                    </button>
                  </div>

                </div>
              </div>

              <!-- Estimate Items -->
              <div class="mt-3">

                <div class="mb-2 flex items-center justify-between">
                  <h3 class="text-sm font-semibold">
                    Estimate Items
                  </h3>

                  <span class="text-xs text-gray-content/60">
                    {{ estimateItems.length }} items
                  </span>
                </div>

                <div
                  v-if="estimateItems.length"
                  class="space-y-2"
                >
                  <div
                    v-for="item in estimateItems"
                    :key="item.id"
                    class="rounded-lg border border-gray-300 bg-base-100 p-3 relative"
                  >

                    <!-- Item Header -->
                    <div class="flex items-start justify-between gap-2">

                      <div class="min-w-0">
                        <div class="text-sm font-semibold">
                          {{ item.description }}
                        </div>

                        <div class="text-xs bg-pink-500 text-center rounded px-2 text-white">
                          {{ item.item_type === 'labour' ? 'Labour' : 'Part' }}
                        </div>
                      </div>

                      <button
                        type="button"
                        class="btn border border-red-600  btn-xs text-red-500"
                        @click="removeEstimateItem(item)"
                      >
                        Remove
                      </button>

                    </div>

                    <!-- Item Details -->
                    <div class="mt-2 overflow-x-auto">
                      <table class="table table-xs">
                        <thead class="bg-gray-200">
                          <tr>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Discount</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{{ item.quantity }}</td>
                            <td>₹{{ Number(item.unit_price).toFixed(2) }}</td>
                            <td>₹{{ Number(item.discount || 0).toFixed(2) }}</td>
                            <td>₹{{ estimateItemTotal(item).toFixed(2) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>

                <div
                  v-else
                  class="rounded-lg border border-dashed border-gray-300 py-5 text-center text-xs text-gray-content/60"
                >
                  No estimate items added yet.
                </div>

              </div>

              <!-- Estimate Summary -->
              <div class="mt-3 rounded-lg border border-gray-300 bg-base-100 p-3">

                <div class="flex justify-between py-1 text-xs">
                  <span class="text-gray-content/70">Subtotal</span>
                  <span class="font-medium">
                    ₹{{ estimateSubtotal.toFixed(2) }}
                  </span>
                </div>

                <div class="flex items-center justify-between gap-2 py-1">
                  <span class="text-xs text-gray-content/70">
                    Overall Discount
                  </span>

                  <input
                    v-model="estimateForm.discount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input input-bordered input-sm w-24 text-right"
                  />
                </div>

                <div class="flex items-center justify-between gap-2 py-1">
                  <span class="text-xs text-gray-content/70">
                    Tax
                  </span>

                  <input
                    v-model="estimateForm.tax"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input input-bordered input-sm w-24 text-right"
                  />
                </div>

                <div class="divider my-1"></div>

                <div class="flex justify-between text-base font-bold">
                  <span>Estimated Total</span>
                  <span>₹{{ estimateTotal.toFixed(2) }}</span>
                </div>

              </div>

              <!-- Estimate Actions -->
              <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">

                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  :disabled="estimateSaving || estimateItems.length === 0"
                  @click="saveEstimate"
                >
                  <span
                    v-if="estimateSaving"
                    class="loading loading-spinner loading-xs"
                  ></span>

                  {{ estimateSaving ? 'Saving...' : 'Save Estimate' }}
                </button>

                <button
                  type="button"
                  class="btn bg-green-600 btn-sm text-white"
                  :disabled="!estimate"
                  @click="openWhatsApp('estimate')"
                >
                  <Icon name="ic:baseline-whatsapp" size="20"/>
                  Share Estimate
                </button>

              </div>

            </template>
          </div>
        </div>

        <!-- Final Bill -->
        <div class="card mt-4 border border-gray-300 bg-gray-100 shadow-md">
          <div class="card-body p-3 sm:p-4">

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="card-title">
                  Final Bill
                </h2>

                <p class="text-sm text-base-content/60">
                  Final amount based on the actual work and parts used.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <div
                  v-if="invoice"
                  class="badge badge-outline"
                >
                  {{ invoice.invoice_number }}
                </div>

                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  :disabled="invoiceGenerating"
                  @click="generateInvoice"
                >
                  <span
                    v-if="invoiceGenerating"
                    class="loading loading-spinner loading-xs"
                  ></span>

                  {{
                    invoiceGenerating
                      ? 'Generating...'
                      : 'Generate from Job Card'
                  }}
                </button>
              </div>
            </div>

            <!-- Loading -->
            <div
              v-if="invoiceLoading"
              class="flex justify-center py-8"
            >
              <span class="loading loading-spinner loading-md"></span>
            </div>

            <template v-else>

              <!-- Error -->
              <div
                v-if="invoiceError"
                class="alert alert-error mt-4"
              >
                <span>{{ invoiceError }}</span>
              </div>

              <!-- Add Final Bill Item -->
              <div class="collapse rounded-lg border border-gray-300">
                <input type="checkbox" />
                <h3 class="collapse-title flex items-center justify-between text-sm font-semibold bg-gray-200 p-3 border-b border-gray-300">
                  Add Final Bill Item
                  <Icon name="i-lucide-chevron-down" class="text-xl" />
                </h3>

                <div class="grid grid-cols-6 gap-2 p-3 collapse-content">

                  <!-- Type -->
                  <div class="md:col-span-2">
                    <label class="label py-1">
                      <span class="label-text text-xs">Type</span>
                    </label>

                    <select
                      v-model="newInvoiceItem.item_type"
                      class="select select-bordered w-full select-sm"
                    >
                      <option value="labour">
                        Labour
                      </option>

                      <option value="part">
                        Part
                      </option>
                    </select>
                  </div>

                  <!-- Description -->
                  <div class="md:col-span-4">
                    <label class="label">
                      <span class="label-text text-xs">Description</span>
                    </label>

                    <input
                      v-model="newInvoiceItem.description"
                      type="text"
                      class="input input-bordered w-full input-sm"
                      placeholder="e.g. Engine oil change"
                      @keyup.enter="addInvoiceItem"
                    />
                  </div>

                  <!-- Quantity -->
                  <div class="md:col-span-1">
                    <label class="label">
                      <span class="label-text text-xs">Qty</span>
                    </label>

                    <input
                      v-model="newInvoiceItem.quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      class="input input-sm input-bordered w-full"
                    />
                  </div>

                  <!-- Unit Price -->
                  <div class="md:col-span-2">
                    <label class="label">
                      <span class="label-text text-xs">Unit Price</span>
                    </label>

                    <input
                      v-model="newInvoiceItem.unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input input-bordered w-full input-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <!-- Discount -->
                  <div class="md:col-span-1">
                    <label class="label">
                      <span class="label-text text-xs">Discount</span>
                    </label>

                    <input
                      v-model="newInvoiceItem.discount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input input-sm input-bordered w-full"
                      placeholder="0"
                    />
                  </div>

                  <!-- Add -->
                  <div class="flex items-end md:col-span-2">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm w-full"
                      @click="addInvoiceItem"
                    >
                      + Add Item
                    </button>
                  </div>

                </div>
              </div>

              <!-- Invoice Items -->
              <div class="mt-5">

                <div class="mb-3 flex items-center justify-between">
                  <h3 class="font-semibold">
                    Final Bill Items
                  </h3>

                  <span class="text-sm text-gray-content/60">
                    {{ invoiceItems.length }}
                    item{{ invoiceItems.length === 1 ? '' : 's' }}
                  </span>
                </div>

                <!-- Desktop -->
                <div
                  v-if="invoiceItems.length"
                  class="hidden overflow-x-auto rounded-lg border border-gray-300 md:block"
                >
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Description</th>
                        <th class="w-24">Qty</th>
                        <th class="w-32">Unit Price</th>
                        <th class="w-32">Discount</th>
                        <th class="text-right">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr
                        v-for="item in invoiceItems"
                        :key="item.id"
                      >
                        <td>
                          <select
                            v-model="item.item_type"
                            class="select select-bordered select-sm w-full"
                          >
                            <option value="labour">
                              Labour
                            </option>

                            <option value="part">
                              Part
                            </option>
                          </select>
                        </td>

                        <td>
                          <input
                            v-model="item.description"
                            type="text"
                            class="input input-bordered input-sm w-full"
                          />
                        </td>

                        <td>
                          <input
                            v-model="item.quantity"
                            type="number"
                            min="0.01"
                            step="0.01"
                            class="input input-bordered input-sm w-full"
                          />
                        </td>

                        <td>
                          <input
                            v-model="item.unit_price"
                            type="number"
                            min="0"
                            step="0.01"
                            class="input input-bordered input-sm w-full"
                          />
                        </td>

                        <td>
                          <input
                            v-model="item.discount"
                            type="number"
                            min="0"
                            step="0.01"
                            class="input input-bordered input-sm w-full"
                          />
                        </td>

                        <td class="text-right font-semibold">
                          ₹{{ invoiceItemTotal(item).toFixed(2) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Mobile -->
                <div
                  v-if="invoiceItems.length"
                  class="space-y-3 md:hidden"
                >
                  <div
                    v-for="item in invoiceItems"
                    :key="item.id"
                    class="rounded-lg border border-gray-300 bg-gray-100 p-4"
                  >
                    <div class="grid grid-cols-2 gap-3">

                      <div class="col-span-2">
                        <label class="label">
                          <span class="label-text">Type</span>
                        </label>

                        <select
                          v-model="item.item_type"
                          class="select select-bordered w-full"
                        >
                          <option value="labour">
                            Labour
                          </option>

                          <option value="part">
                            Part
                          </option>
                        </select>
                      </div>

                      <div class="col-span-2">
                        <label class="label">
                          <span class="label-text">Description</span>
                        </label>

                        <input
                          v-model="item.description"
                          type="text"
                          class="input input-bordered w-full"
                        />
                      </div>

                      <div>
                        <label class="label">
                          <span class="label-text">Qty</span>
                        </label>

                        <input
                          v-model="item.quantity"
                          type="number"
                          min="0.01"
                          step="0.01"
                          class="input input-bordered w-full"
                        />
                      </div>

                      <div>
                        <label class="label">
                          <span class="label-text">Unit Price</span>
                        </label>

                        <input
                          v-model="item.unit_price"
                          type="number"
                          min="0"
                          step="0.01"
                          class="input input-bordered w-full"
                        />
                      </div>

                      <div>
                        <label class="label">
                          <span class="label-text">Discount</span>
                        </label>

                        <input
                          v-model="item.discount"
                          type="number"
                          min="0"
                          step="0.01"
                          class="input input-bordered w-full"
                        />
                      </div>

                      <div class="flex items-end justify-end">
                        <div class="text-right">
                          <div class="text-xs text-gray-content/60">
                            Total
                          </div>

                          <div class="font-bold">
                            ₹{{ invoiceItemTotal(item).toFixed(2) }}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <!-- Empty -->
                <div
                  v-else
                  class="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-content/60"
                >
                  No final bill items added yet.
                </div>

              </div>

              <!-- Invoice Summary -->
              <div class="mt-5 flex justify-end">
                <div class="w-full rounded-lg border border-gray-300 bg-gray-100 p-4">

                  <div class="flex justify-between py-1">
                    <span class="text-gray-content/70">
                      Subtotal
                    </span>

                    <span class="font-medium">
                      ₹{{ invoiceSubtotal.toFixed(2) }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between gap-4 py-2">
                    <span class="text-gray-content/70 text-sm">
                      Overall Discount
                    </span>

                    <input
                      v-model="invoiceForm.discount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input input-bordered input-sm w-32 text-right"
                    />
                  </div>

                  <div class="flex items-center justify-between gap-4 py-2">
                    <span class="text-gray-content/70 text-sm">
                      Tax
                    </span>

                    <input
                      v-model="invoiceForm.tax"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input input-bordered input-sm w-32 text-right"
                    />
                  </div>

                  <div class="divider my-2"></div>

                  <div class="flex justify-between text-sm font-bold">
                    <span>
                      Final Total
                    </span>

                    <span>
                      ₹{{ invoiceTotal.toFixed(2) }}
                    </span>
                  </div>

                </div>
              </div>

              <!-- Estimated vs Final -->
              <div
                v-if="estimate"
                class="mt-5 rounded-lg border border-gray-300 bg-gray-100 p-4"
              >
                <h3 class="font-semibold">
                  Estimate vs Final
                </h3>

                <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <div>
                    <div class="text-sm text-gray-content/60">
                      Estimated Bill
                    </div>

                    <div class="text-lg font-bold">
                      ₹{{ Number(estimate.total).toFixed(2) }}
                    </div>
                  </div>

                  <div>
                    <div class="text-sm text-gray-content/60">
                      Final Bill
                    </div>

                    <div class="text-lg font-bold">
                      ₹{{ invoiceTotal.toFixed(2) }}
                    </div>
                  </div>

                  <div>
                    <div class="text-sm text-gray-content/60">
                      Difference
                    </div>

                    <div class="text-lg font-bold">
                      ₹{{
                        (
                          invoiceTotal -
                          Number(estimate.total)
                        ).toFixed(2)
                      }}
                    </div>
                  </div>

                </div>
              </div>

              <!-- Save -->
              <div class="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  :disabled="
                    invoiceSaving ||
                    invoiceItems.length === 0
                  "
                  @click="saveInvoice"
                >
                  <span
                    v-if="invoiceSaving"
                    class="loading loading-spinner loading-sm"
                  ></span>

                  {{
                    invoiceSaving
                      ? 'Saving...'
                      : 'Save Final Bill'
                  }}
                </button>

                <button
                  type="button"
                  class="btn bg-green-600 btn-sm text-white"
                  :disabled="
                    invoiceSaving ||
                    invoiceItems.length === 0
                  "
                  @click="openWhatsApp('final')"
                >
                  <Icon name="ic:baseline-whatsapp" size="20"/>
                  Share Final Bill
                </button>
              </div>

            </template>
          </div>
        </div>

      </div>

      <!-- Tasks / Services -->
      <div class="card mt-6 border border-gray-300 bg-gray-100 shadow-xl">
        <div class="card-body">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold">
                Tasks / Services
              </h2>

              <p class="text-sm text-gray-content/60">
                Work items assigned to this job card.
              </p>
            </div>

            <button
              v-if="hasPermission('job-cards-tasks.create')"
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
            class="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-200 p-10 text-center"
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

            <p class="mt-1 text-sm text-gray-content/60">
              Add the first task or service for this job card.
            </p>

            <button
              v-if="hasPermission('job-cards-tasks.create')"
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

          <!-- Tasks Listing -->
          <div
            v-else
            class="mt-5 space-y-3"
          >
            <div
              v-for="(task, index) in tasks"
              :key="task.id"
              class="rounded-xl border border-gray-300 bg-gray-200 p-4"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
                <!-- Number -->
                <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-300 text-sm font-semibold">
                  {{ index + 1 }}
                </div>

                <!-- Main -->
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-semibold">
                      {{ task.title }}
                    </h3>

                    <span
                      v-if="task.service_task"
                      class="badge badge-sm badge-outline"
                    >
                      Predefined
                    </span>

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
                    class="mt-2 whitespace-pre-line text-sm text-gray-content/60"
                  >
                    {{ task.description }}
                  </p>

                  <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-content/50">
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
                      v-if="task.assigned_employee"
                      class="flex items-center gap-1.5"
                    >
                      <Icon
                        name="lucide:user"
                        class="size-3.5"
                      />

                      {{
                        task.assigned_employee.user?.name ||
                        task.assigned_employee.employee_code
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
                    v-if="hasPermission('job-cards-tasks.update')"
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
                    v-if="hasPermission('job-cards-tasks.status.update')"
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
                      class="dropdown-content menu z-50 mt-2 w-48 rounded-box border border-gray-300 bg-gray-100 p-2 shadow-xl"
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

      <!-- Parts -->
      <div class="card mt-6 border border-gray-300 bg-gray-100 shadow-xl">
        <div class="card-body">

          <!-- Header -->
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold">
                Parts
              </h2>

              <p class="text-sm text-gray-content/60">
                Parts required and issued for this job card.
              </p>
            </div>

            <button
              v-if="hasPermission('parts.create')"
              type="button"
              class="btn btn-primary btn-sm"
              @click="openCreatePart"
            >
              <Icon
                name="lucide:plus"
                class="size-4"
              />

              Add Part
            </button>
          </div>

          <!-- Error -->
          <div
            v-if="partsError"
            class="alert alert-error mt-5"
          >
            <Icon
              name="lucide:circle-alert"
              class="size-5"
            />

            <span>
              {{ partsError }}
            </span>
          </div>

          <!-- Loading -->
          <div
            v-if="partsLoading"
            class="flex items-center justify-center py-12"
          >
            <span class="loading loading-spinner loading-md"></span>
          </div>

          <!-- Empty -->
          <div
            v-else-if="parts.length === 0"
            class="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-200 p-10 text-center"
          >
            <div
              class="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10"
            >
              <Icon
                name="lucide:package"
                class="size-6 text-primary"
              />
            </div>

            <h3 class="mt-4 font-semibold">
              No parts added
            </h3>

            <p class="mt-1 text-sm text-gray-content/60">
              No parts have been added to this job card yet.
            </p>
          </div>

          <!-- Parts -->
          <div
            v-else
            class="mt-5 space-y-3"
          >
            <div
              v-for="(jobCardPart, index) in parts"
              :key="jobCardPart.id"
              class="rounded-xl border border-gray-300 bg-gray-200 p-4"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
                <!-- Number -->
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-300 text-sm font-semibold"
                >
                  {{ index + 1 }}
                </div>

                <!-- Main -->
                <div class="min-w-0 flex-1">

                  <!-- Part name + status -->
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-semibold">
                      {{ jobCardPart.part?.name || 'Part' }}
                    </h3>

                    <span
                      class="badge badge-sm"
                      :class="partStatusClass(jobCardPart.status)"
                    >
                      {{ partStatusLabel(jobCardPart.status) }}
                    </span>
                  </div>

                  <!-- Part number / brand -->
                  <div
                    v-if="jobCardPart.part"
                    class="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-content/50"
                  >
                    <span class="flex items-center gap-1.5">
                      <Icon
                        name="lucide:package"
                        class="size-3.5"
                      />

                      {{ jobCardPart.part.part_number }}
                    </span>

                    <span
                      v-if="jobCardPart.part.brand"
                      class="flex items-center gap-1.5"
                    >
                      <Icon
                        name="lucide:tag"
                        class="size-3.5"
                      />

                      {{ jobCardPart.part.brand }}
                    </span>

                    <span
                      v-if="jobCardPart.task"
                      class="flex items-center gap-1.5"
                    >
                      <Icon
                        name="lucide:clipboard-list"
                        class="size-3.5"
                      />

                      {{ jobCardPart.task.title }}
                    </span>
                  </div>

                  <!-- Quantity / Price / Total -->
                  <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

                    <div class="rounded-lg bg-gray-100 p-3">
                      <p class="text-xs text-gray-content/50">
                        Quantity
                      </p>

                      <p class="mt-1 font-semibold">
                        {{ jobCardPart.quantity }}
                        {{ jobCardPart.part?.unit || 'pcs' }}
                      </p>
                    </div>

                    <div class="rounded-lg bg-gray-100 p-3">
                      <p class="text-xs text-gray-content/50">
                        Unit Price
                      </p>

                      <p class="mt-1 font-semibold">
                        {{ formatCost(jobCardPart.unit_price) }}
                      </p>
                    </div>

                    <div class="rounded-lg bg-gray-100 p-3">
                      <p class="text-xs text-gray-content/50">
                        Discount
                      </p>

                      <p class="mt-1 font-semibold">
                        {{ formatCost(jobCardPart.discount) }}
                      </p>
                    </div>

                    <div class="rounded-lg bg-gray-100 p-3">
                      <p class="text-xs text-gray-content/50">
                        Total
                      </p>

                      <p class="mt-1 font-semibold text-primary">
                        {{ formatCost(jobCardPart.total) }}
                      </p>
                    </div>

                  </div>

                                    <!-- Part Actions -->
                  <div class="mt-4 flex flex-wrap justify-end gap-2">
                    <!-- Pending → Issue -->
                    <button
                      v-if="jobCardPart.status === 'pending'"
                      type="button"
                      class="btn btn-primary btn-sm"
                      @click="issuePart(jobCardPart.id)"
                    >
                      <Icon
                        name="lucide:package-check"
                        class="size-4"
                      />

                      Issue Part
                    </button>

                    <!-- Issued → Return -->
                    <button
                      v-else-if="jobCardPart.status === 'issued'"
                      type="button"
                      class="btn btn-warning btn-sm"
                      @click="returnPart(jobCardPart.id)"
                    >
                      <Icon
                        name="lucide:package-minus"
                        class="size-4"
                      />

                      Return Part
                    </button>

                    <!-- Returned -->
                    <span
                      v-else-if="jobCardPart.status === 'returned'"
                      class="badge badge-info gap-1 py-3"
                    >
                      <Icon
                        name="lucide:rotate-ccw"
                        class="size-3.5"
                      />

                      Returned to Stock
                    </span>
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

            <p class="mt-1 text-sm text-gray-content/60">
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
          <!-- Task Type -->
          <fieldset class="fieldset md:col-span-2">
            <legend class="fieldset-legend">
              Task Type
            </legend>

            <div class="flex flex-wrap gap-3">
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="serviceTaskMode"
                  type="radio"
                  value="predefined"
                  class="radio radio-primary"
                  :disabled="!!editingTask"
                />

                <span>Predefined Task</span>
              </label>

              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="serviceTaskMode"
                  type="radio"
                  value="custom"
                  class="radio radio-primary"
                  :disabled="!!editingTask"
                />

                <span>Custom Task</span>
              </label>
            </div>
          </fieldset>

          <!-- Predefined Task -->
          <fieldset
            v-if="serviceTaskMode === 'predefined'"
            class="fieldset md:col-span-2"
          >
            <legend class="fieldset-legend">
              Select Predefined Task
            </legend>

            <div
              v-if="serviceTasksLoading"
              class="flex items-center gap-2 text-sm text-gray-content/60"
            >
              <span class="loading loading-spinner loading-sm" />
              Loading predefined tasks...
            </div>

            <select
              v-else
              v-model="taskForm.service_task_id"
              class="select select-bordered w-full"
            >
              <option value="">
                Select a predefined task
              </option>

              <option
                v-for="serviceTask in serviceTasks"
                :key="serviceTask.id"
                :value="String(serviceTask.id)"
              >
                {{ serviceTask.name }}
              </option>
            </select>

            <p
              v-if="selectedServiceTask"
              class="mt-2 text-xs text-gray-content/60"
            >
              Suggested parts will be added automatically when this task is saved.
            </p>
          </fieldset>


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
                :value="String(department.id)"
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
              <span class="text-gray-content/50">
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

    <!-- Request Parts Modal -->
    <dialog
      class="modal"
      :class="{
        'modal-open': partsModalOpen,
      }"
    >
      <div class="modal-box max-w-5xl">

        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold">
              Request Parts
            </h3>

            <p class="mt-1 text-sm text-gray-content/60">
              Select multiple parts and submit them for store approval.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-ghost btn-sm btn-circle"
            :disabled="partSaving"
            @click="closePartModal"
          >
            <Icon
              name="lucide:x"
              class="size-4"
            />
          </button>
        </div>

        <!-- Error -->
        <div
          v-if="partsError"
          class="alert alert-error mt-5"
        >
          <Icon
            name="lucide:circle-alert"
            class="size-5"
          />

          <span>
            {{ partsError }}
          </span>
        </div>

        <!-- Search -->
        <div class="mt-5">
          <label class="fieldset">
            <legend class="fieldset-legend">
              Search Parts
            </legend>

            <div class="relative">
              <Icon
                name="i-lucide:search"
                class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
              />

              <input
                v-model="partSearch"
                type="text"
                class="input input-bordered w-full pl-9"
                placeholder="Search part number, name or brand..."
              />
            </div>
          </label>
        </div>

        <!-- Available Parts -->
        <div class="mt-5">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="font-semibold">
              Available Parts
            </h4>

            <span class="text-xs text-gray-content/60">
              {{ selectedPartRequests.length }} selected
            </span>
          </div>

          <div
            v-if="filteredAvailableParts.length === 0"
            class="rounded-lg border border-base-300 p-6 text-center text-sm text-gray-content/60"
          >
            No parts found.
          </div>

          <div
            v-else
            class="max-h-64 overflow-y-auto rounded-lg border border-base-300"
          >
            <div
              v-for="part in filteredAvailableParts"
              :key="part.id"
              class="flex items-center justify-between gap-3 border-b border-base-300 p-3 last:border-b-0"
            >
              <div class="min-w-0">
                <p class="font-medium">
                  {{ part.name }}
                </p>

                <p class="text-xs text-gray-content/60">
                  {{ part.part_number }}

                  <template v-if="part.brand">
                    · {{ part.brand }}
                  </template>
                </p>

                <p class="mt-1 text-xs text-gray-content/60">
                  Stock: {{ part.current_stock }}
                  {{ part.unit }}
                  · Price: {{ formatCost(part.selling_price) }}
                </p>
              </div>

              <button
                type="button"
                class="btn btn-sm"
                :class="{
                  'btn-success': isPartSelected(part.id),
                  'btn-outline': !isPartSelected(part.id),
                }"
                :disabled="isPartSelected(part.id)"
                @click="addPartToSelection(part)"
              >
                <Icon
                  v-if="isPartSelected(part.id)"
                  name="lucide:check"
                  class="size-4"
                />

                <Icon
                  v-else
                  name="lucide:plus"
                  class="size-4"
                />

                <span>
                  {{ isPartSelected(part.id) ? 'Selected' : 'Add' }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Parts -->
        <div class="mt-6">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="font-semibold">
              Selected Parts
            </h4>

            <span class="text-sm font-semibold text-primary">
              {{ formatCost(selectedPartsTotal) }}
            </span>
          </div>

          <div
            v-if="selectedPartRequests.length === 0"
            class="rounded-lg border border-dashed border-base-300 p-6 text-center text-sm text-gray-content/60"
          >
            Select parts from the list above.
          </div>

          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="selected in selectedPartRequests"
              :key="selected.part_id"
              class="rounded-xl border border-base-300 p-4"
            >
              <!-- Selected Part Header -->
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h5 class="font-semibold">
                    {{ getSelectedPartDetails(selected.part_id)?.name }}
                  </h5>

                  <p class="text-xs text-gray-content/60">
                    {{ getSelectedPartDetails(selected.part_id)?.part_number }}
                  </p>
                </div>

                <button
                  type="button"
                  class="btn btn-ghost btn-sm btn-circle text-error"
                  :disabled="partSaving"
                  @click="removePartFromSelection(selected.part_id)"
                >
                  <Icon
                    name="lucide:trash-2"
                    class="size-4"
                  />
                </button>
              </div>

              <!-- Part Fields -->
              <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                <!-- Task -->
                <fieldset class="fieldset md:col-span-2">
                  <legend class="fieldset-legend">
                    Related Task / Service
                  </legend>

                  <select
                    :value="selected.job_card_task_id"
                    class="select select-bordered w-full"
                    @change="updateSelectedPart(
                      selected.part_id,
                      'job_card_task_id',
                      ($event.target as HTMLSelectElement).value
                    )"
                  >
                    <option value="">
                      Not linked to a specific task
                    </option>

                    <option
                      v-for="task in tasks"
                      :key="task.id"
                      :value="task.id"
                    >
                      {{ task.title }}
                    </option>
                  </select>
                </fieldset>

                <!-- Quantity -->
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    Quantity
                  </legend>

                  <input
                    :value="selected.quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    class="input input-bordered w-full"
                    @input="updateSelectedPart(
                      selected.part_id,
                      'quantity',
                      ($event.target as HTMLInputElement).value
                    )"
                  />
                </fieldset>

                <!-- Unit Price -->
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    Unit Price
                  </legend>

                  <input
                    :value="selected.unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input input-bordered w-full"
                    @input="updateSelectedPart(
                      selected.part_id,
                      'unit_price',
                      ($event.target as HTMLInputElement).value
                    )"
                  />
                </fieldset>

                <!-- Discount -->
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">
                    Discount
                  </legend>

                  <input
                    :value="selected.discount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input input-bordered w-full"
                    @input="updateSelectedPart(
                      selected.part_id,
                      'discount',
                      ($event.target as HTMLInputElement).value
                    )"
                  />
                </fieldset>

                <!-- Total -->
                <div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p class="text-xs text-gray-content/50">
                    Total
                  </p>

                  <p class="mt-1 text-xl font-bold text-primary">
                    {{ formatCost(getSelectedPartTotal(selected)) }}
                  </p>
                </div>

                <!-- Notes -->
                <fieldset class="fieldset md:col-span-2">
                  <legend class="fieldset-legend">
                    Notes
                  </legend>

                  <textarea
                    :value="selected.notes"
                    class="textarea textarea-bordered min-h-20 w-full"
                    placeholder="Optional notes..."
                    @input="updateSelectedPart(
                      selected.part_id,
                      'notes',
                      ($event.target as HTMLTextAreaElement).value
                    )"
                  ></textarea>
                </fieldset>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div
          v-if="selectedPartRequests.length > 0"
          class="mt-5 flex items-center justify-between rounded-lg bg-base-200 p-4"
        >
          <div>
            <p class="text-sm font-medium">
              Total Parts
            </p>

            <p class="text-xs text-gray-content/60">
              {{ selectedPartRequests.length }} part request(s)
            </p>
          </div>

          <p class="text-xl font-bold text-primary">
            {{ formatCost(selectedPartsTotal) }}
          </p>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="partSaving"
            @click="closePartModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="
              partSaving ||
              selectedPartRequests.length === 0
            "
            @click="savePart"
          >
            <span
              v-if="partSaving"
              class="loading loading-spinner loading-sm"
            ></span>

            <span v-else>
              Submit Requests
            </span>
          </button>
        </div>
      </div>

      <form
        method="dialog"
        class="modal-backdrop"
        @click.prevent="closePartModal"
      >
        <button>close</button>
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

            <p class="mt-2 text-sm text-gray-content/60">
              Are you sure you want to change this job card's
              status?
            </p>
          </div>
        </div>

        <div
          v-if="jobCard"
          class="mt-5 rounded-lg border border-gray-300 bg-gray-200 p-4"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs text-gray-content/50">
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
              class="size-5 text-gray-content/40"
            />

            <div class="text-right">
              <p class="text-xs text-gray-content/50">
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

            <p class="mt-2 text-sm text-gray-content/60">
              Are you sure you want to change this task's status?
            </p>
          </div>
        </div>

        <div
          v-if="taskStatusConfirmTask"
          class="mt-5 rounded-lg border border-gray-300 bg-gray-200 p-4"
        >
          <p class="font-semibold">
            {{ taskStatusConfirmTask.title }}
          </p>

          <div class="mt-4 flex items-center justify-between gap-4">
            <div>
              <p class="text-xs text-gray-content/50">
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
              class="size-5 text-gray-content/40"
            />

            <div class="text-right">
              <p class="text-xs text-gray-content/50">
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
