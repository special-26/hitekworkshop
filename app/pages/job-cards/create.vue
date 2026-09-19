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
}

interface Department {
  id: number
  name: string
  is_active?: boolean
}

interface Bay {
  id: number
  name: string
  code: string
  department_id: number
  type: string
  is_active: boolean
}

interface Employee {
  id: number
  user_id: string | number | null
  user?: {
    id: string | number
    name: string
  }
  department_id?: number | null
  department?: Department
  is_active?: boolean
}

const router = useRouter()
const route = useRoute()
const api = useApi()

const { hasPermission } = usePermissions()

const loading = ref(true)
const saving = ref(false)

const error = ref('')

const validationErrors = ref<Record<string, string[]>>({})

const customers = ref<Customer[]>([])
const vehicles = ref<Vehicle[]>([])
const departments = ref<Department[]>([])
const bays = ref<Bay[]>([])
const employees = ref<Employee[]>([])

// Step 1 - Customer search
const customerPhone = ref('')
const customerSearchLoading = ref(false)
const customerSearchError = ref('')
const customerSearched = ref(false)
const showCustomerModal = ref(false)
const customerNotFound = ref(false)

/*
|--------------------------------------------------------------------------
| Form
|--------------------------------------------------------------------------
*/

const form = reactive({
  customer_id: '',
  vehicle_id: '',
  department_id: '',
  bay_id: '',
  advisor_id: '',
  complaint: '',
  customer_notes: '',
  estimated_cost: '',
  estimated_completion_at: '',
})

/*
|--------------------------------------------------------------------------
| Field Error
|--------------------------------------------------------------------------
*/

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

/*
|--------------------------------------------------------------------------
| Customer Vehicles
|--------------------------------------------------------------------------
*/

const customerVehicles = computed(() => {
  if (!form.customer_id) {
    return []
  }

  return vehicles.value.filter(
    vehicle =>
      vehicle.customer_id ===
      Number(form.customer_id)
  )
})

/*
|--------------------------------------------------------------------------
| Department Bays
|--------------------------------------------------------------------------
*/

const departmentBays = computed(() => {
  if (!form.department_id) {
    return []
  }

  return bays.value.filter(
    bay =>
      bay.department_id ===
        Number(form.department_id) &&
      bay.is_active
  )
})

/*
|--------------------------------------------------------------------------
| Department Advisors
|--------------------------------------------------------------------------
*/

const departmentAdvisors = computed(() => {

  if (!form.department_id || !Array.isArray(employees.value)) {
    return []
  }

  return employees.value.filter(employee => {
    if (employee.user?.is_active === false) {
      return false
    }

    if (
      employee.department_id === undefined ||
      employee.department_id === null
    ) {
      return true
    }

    return (
      employee.department_id ===
      Number(form.department_id)
    )
  })
})

/*
|--------------------------------------------------------------------------
| Selected Customer
|--------------------------------------------------------------------------
*/

const selectedCustomer = computed(() => {
  return customers.value.find(
    customer =>
      customer.id ===
      Number(form.customer_id)
  )
})

/*
|--------------------------------------------------------------------------
| Selected Vehicle
|--------------------------------------------------------------------------
*/

const selectedVehicle = computed(() => {
  return vehicles.value.find(
    vehicle =>
      vehicle.id ===
      Number(form.vehicle_id)
  )
})

/*
|--------------------------------------------------------------------------
| Customer Changed
|--------------------------------------------------------------------------
*/

watch(
  () => form.customer_id,
  () => {
    form.vehicle_id = ''
  }
)

/*
|--------------------------------------------------------------------------
| Department Changed
|--------------------------------------------------------------------------
*/

watch(
  () => form.department_id,
  () => {
    form.bay_id = ''
    form.advisor_id = ''
  }
)

// Search Cutomers
const searchCustomer = () => {
  customerSearchError.value = ''
  customerSearched.value = false
  customerNotFound.value = false

  const phone = customerPhone.value
    .replace(/\D/g, '')
    .slice(-10)

  customerPhone.value = phone

  form.customer_id = ''
  form.vehicle_id = ''

  if (phone.length !== 10) {
    customerSearchError.value =
      'Please enter a valid 10-digit mobile number.'

    customerSearched.value = true
    return
  }

  customerSearchLoading.value = true

  try {

    const customer = customers.value.find(customer => {
      const savedPhone = customer.phone
        ?.replace(/\D/g, '')
        .slice(-10)

      return savedPhone === phone
    })

    if (customer) {
      form.customer_id = String(customer.id)
      form.vehicle_id = ''

      customerSearched.value = true
      customerNotFound.value = false

      return
    }

    // Customer does not exist
    customerSearched.value = true
    customerNotFound.value = true

  } catch (err) {
    console.error('Customer search error:', err)

    customerSearchError.value =
      'Unable to search customer. Please try again.'

    customerSearched.value = true
    customerNotFound.value = false

  } finally {
    customerSearchLoading.value = false
  }
}

const handleCustomerCreated = (customer: Customer) => {
  console.log('HANDLE CUSTOMER CREATED:', customer)

  if (!customer?.id) {
    console.error(
      'Created customer does not contain an ID:',
      customer
    )

    return
  }

  // Add the new customer to the local customer list
  const existingIndex = customers.value.findIndex(
    item => item.id === customer.id
  )

  if (existingIndex === -1) {
    customers.value.push(customer)
  } else {
    customers.value[existingIndex] = customer
  }

  // Select the newly created customer
  form.customer_id = String(customer.id)

  // Reset vehicle selection
  form.vehicle_id = ''

  // Set the searched phone number
  customerPhone.value = customer.phone || ''

  // Update search states
  customerSearched.value = true
  customerNotFound.value = false
  customerSearchError.value = ''

  // Close the modal
  showCustomerModal.value = false
}
// add new Vehicle
const showVehicleModal = ref(false)
const handleVehicleCreated = (vehicle: Vehicle) => {
  vehicles.value.push(vehicle)

  form.vehicle_id = String(vehicle.id)

  showVehicleModal.value = false
}

/*
|--------------------------------------------------------------------------
| Fetch Customers
|--------------------------------------------------------------------------
*/

const fetchCustomers = async () => {
  const response = await api(
    '/api/admin/customers'
  )

  const customerData = response.data

  customers.value = Array.isArray(customerData)
    ? customerData
    : Array.isArray(customerData?.data)
      ? customerData.data
      : []
}

/*
|--------------------------------------------------------------------------
| Fetch Vehicles
|--------------------------------------------------------------------------
*/

const fetchVehicles = async () => {
  const response = await api(
    '/api/admin/vehicles'
  )

  vehicles.value = response.data
}

/*
|--------------------------------------------------------------------------
| Fetch Departments
|--------------------------------------------------------------------------
*/

const fetchDepartments = async () => {
  const response = await api(
    '/api/admin/departments'
  )

  departments.value = response.data.filter(
    (department: Department) =>
      department.is_active !== false
  )
}

/*
|--------------------------------------------------------------------------
| Fetch Bays
|--------------------------------------------------------------------------
*/

const fetchBays = async () => {
  const response = await api(
    '/api/admin/bays'
  )

  bays.value = response.data
}

/*
|--------------------------------------------------------------------------
| Fetch Employees
|--------------------------------------------------------------------------
|
| We use employees for selecting the advisor.
|
*/

const fetchEmployees = async () => {
  const response = await api('/api/admin/employees')
  employees.value = response.data.data
}

/*
|--------------------------------------------------------------------------
| Load Initial Data
|--------------------------------------------------------------------------
*/

const fetchInitialData = async () => {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([
      fetchCustomers(),
      fetchVehicles(),
      fetchDepartments(),
      fetchBays(),
      fetchEmployees(),
    ])
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load job card data.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Employee Name
|--------------------------------------------------------------------------
*/

const employeeName = (
  employee: Employee
) => {
  return (
    employee.user?.name ||
    `Employee #${employee.id}`
  )
}

/*
|--------------------------------------------------------------------------
| Submit
|--------------------------------------------------------------------------
*/

const submit = async () => {
  saving.value = true
  error.value = ''
  validationErrors.value = {}

  try {
    const response = await api(
      '/api/admin/job-cards',
      {
        method: 'POST',

        body: {
          customer_id: form.customer_id
            ? Number(form.customer_id)
            : null,

          vehicle_id: form.vehicle_id
            ? Number(form.vehicle_id)
            : null,

          department_id: form.department_id
            ? Number(form.department_id)
            : null,

          bay_id: form.bay_id
            ? Number(form.bay_id)
            : null,

          advisor_id: form.advisor_id
            ? Number(form.advisor_id)
            : null,

          complaint: form.complaint,

          customer_notes:
            form.customer_notes || null,

          estimated_cost:
            form.estimated_cost
              ? Number(form.estimated_cost)
              : null,

          estimated_completion_at:
            form.estimated_completion_at ||
            null,
        },
      }
    )

    await router.push(
      `/job-cards/${response.data.id}`
    )
  } catch (err: any) {
    console.error(err)

    if (
      err?.status === 422 ||
      err?.response?.status === 422
    ) {
      validationErrors.value =
        err?.data?.errors ||
        err?.response?._data?.errors ||
        {}
    }

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to create job card.'
  } finally {
    saving.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Cancel
|--------------------------------------------------------------------------
*/

const cancel = () => {
  router.push('/job-cards')
}

onMounted(() => {
  const customerId = route.query.customer_id

  if (customerId) {
    form.customer_id = String(customerId)
  }

  fetchInitialData()
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
            Create Job Card
          </li>
        </ul>
      </div>

      <div class="mt-3">
        <h1 class="text-2xl font-bold text-base-content">
          Create Job Card
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Create a new workshop job for a customer vehicle.
        </p>
      </div>
    </div>

    <!-- Permission -->
    <div
      v-if="!hasPermission('job-cards.create')"
      class="alert alert-error"
    >
      <Icon
        name="lucide:shield-alert"
        class="size-5"
      />

      <span>
        You do not have permission to create job cards.
      </span>
    </div>

    <template v-else>
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
            Loading job card data...
          </p>
        </div>
      </div>

      <!-- Form -->
      <form
        v-else
        class="card border border-base-300 bg-base-100 shadow-sm"
        @submit.prevent="submit"
      >
        <div class="card-body">
          <!-- Customer & Vehicle -->
          <div>
            <div>
              <h2 class="text-lg font-semibold">
                Customer & Vehicle
              </h2>

              <p class="text-sm text-base-content/60">
                Search the customer by mobile number and select their vehicle.
              </p>
            </div>

            <!-- Customer Search -->
            <div class="mt-5">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Customer Mobile Number
                </legend>

                <div class="flex flex-col gap-3 sm:flex-row">
                  <label
                    class="input input-bordered flex flex-1 items-center gap-2"
                    :class="{
                      'input-error': customerSearchError,
                    }"
                  >
                    <Icon
                      name="lucide:phone"
                      class="size-5 text-base-content/50"
                    />

                    <input
                      v-model="customerPhone"
                      type="tel"
                      inputmode="numeric"
                      maxlength="10"
                      class="grow"
                      placeholder="Enter 10-digit mobile number"
                      @keyup.enter="searchCustomer"
                    />
                  </label>

                  <button
                    type="button"
                    class="btn btn-primary"
                    :disabled="customerSearchLoading"
                    @click="searchCustomer"
                  >
                    <span
                      v-if="customerSearchLoading"
                      class="loading loading-spinner loading-sm"
                    />

                    <Icon
                      v-else
                      name="lucide:search"
                      class="size-4"
                    />

                    Search
                  </button>
                </div>

                <p
                  v-if="customerSearchError"
                  class="label text-error"
                >
                  {{ customerSearchError }}
                </p>
              </fieldset>
            </div>

            <!-- If customer not found -->
            <div
              v-if="customerNotFound"
              class="alert alert-warning mt-4"
            >
              <div>
                <h3 class="font-bold">
                  Customer not found
                </h3>

                <p class="text-sm">
                  No customer exists with this mobile number.
                </p>
              </div>

              <button
                type="button"
                class="btn btn-primary btn-sm"
                @click="showCustomerModal = true"
              >
                Create Customer
              </button>
            </div>

            <!-- Customer Found -->
            <div
              v-if="selectedCustomer"
              class="mt-5 rounded-xl border border-success/30 bg-success/5 p-5"
            >
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div class="flex items-center gap-4">
                  <div
                    class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Icon
                      name="lucide:user"
                      class="size-6 text-primary"
                    />
                  </div>

                  <div>
                    <p class="font-semibold text-base-content">
                      {{ selectedCustomer.name }}
                    </p>

                    <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/60">
                      <span class="flex items-center gap-1">
                        <Icon
                          name="lucide:phone"
                          class="size-3.5"
                        />
                        {{ selectedCustomer.phone }}
                      </span>

                      <span>
                        {{ selectedCustomer.customer_code }}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="
                    customerPhone = '',
                    form.customer_id = '',
                    form.vehicle_id = '',
                    customerSearched = false,
                    customerSearchError = ''
                  "
                >
                  Change
                </button>

              </div>
            </div>

            <!-- Vehicle Selection -->
            <div
              v-if="selectedCustomer"
              class="mt-6"
            >
              <div class="mb-3">
                <h3 class="font-semibold">
                  Select Vehicle
                </h3>

                <p class="text-sm text-base-content/60">
                  Choose the vehicle for this service.
                </p>
              </div>

              <!-- Vehicles -->
              <div
                v-if="customerVehicles.length"
                class="grid grid-cols-1 gap-3 lg:grid-cols-2"
              >
                <button
                  v-for="vehicle in customerVehicles"
                  :key="vehicle.id"
                  type="button"
                  class="rounded-xl border p-4 text-left transition hover:border-primary hover:bg-primary/5"
                  :class="
                    Number(form.vehicle_id) === vehicle.id
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-base-300 bg-base-100'
                  "
                  @click="form.vehicle_id = String(vehicle.id)"
                >
                  <div class="flex items-start gap-4">

                    <div
                      class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-base-200"
                    >
                      <Icon
                        name="lucide:car-front"
                        class="size-5 text-primary"
                      />
                    </div>

                    <div class="min-w-0 flex-1">

                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="font-semibold">
                            {{ vehicle.make }}
                            {{ vehicle.model }}
                          </p>

                          <p class="mt-1 font-mono text-sm font-medium">
                            {{ vehicle.registration_number }}
                          </p>
                        </div>

                        <div
                          v-if="Number(form.vehicle_id) === vehicle.id"
                          class="badge badge-primary"
                        >
                          Selected
                        </div>
                      </div>

                      <div class="mt-2 flex flex-wrap gap-2 text-xs text-base-content/60">
                        <span v-if="vehicle.variant">
                          {{ vehicle.variant }}
                        </span>

                        <span v-if="vehicle.fuel_type">
                          {{ vehicle.fuel_type }}
                        </span>
                      </div>

                    </div>
                  </div>
                </button>
              </div>

              <!-- No Vehicle -->
              <div
                v-else
                class="rounded-xl border border-warning/30 bg-warning/5 p-5"
              >
                <div class="flex items-start gap-3">
                  <Icon
                    name="lucide:car"
                    class="mt-0.5 size-5 text-warning"
                  />

                  <div>
                    <p class="font-medium">
                      No vehicle registered
                    </p>

                    <p class="mt-1 text-sm text-base-content/60">
                      This customer does not have any vehicle registered yet.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Add Vehicle -->
             <button
                type="button"
                class="btn btn-outline mt-4"
                @click="showVehicleModal = true"
              >
                <Icon name="lucide:plus" class="size-4" />
                Add New Vehicle
              </button>

              <p
                v-if="fieldError('vehicle_id')"
                class="mt-2 text-sm text-error"
              >
                {{ fieldError('vehicle_id') }}
              </p>
            </div>
          </div>
          <!-- Customer & Vehicle Ends -->

          <div class="divider" />

          <!-- Workshop Assignment -->
          <div>
            <h2 class="text-lg font-semibold">
              Workshop Assignment
            </h2>

            <p class="text-sm text-base-content/60">
              Assign the job to a department, bay and advisor.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <!-- Department -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Department
              </legend>

              <select
                v-model="form.department_id"
                class="select select-bordered w-full"
                :class="{
                  'select-error': fieldError('department_id'),
                }"
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

              <p
                v-if="fieldError('department_id')"
                class="label text-error"
              >
                {{ fieldError('department_id') }}
              </p>
            </fieldset>

            <!-- Bay -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Bay
              </legend>

              <select
                v-model="form.bay_id"
                class="select select-bordered w-full"
                :disabled="!form.department_id"
                :class="{
                  'select-error': fieldError('bay_id'),
                }"
              >
                <option value="">
                  {{
                    form.department_id
                      ? 'Select bay'
                      : 'Select department first'
                  }}
                </option>

                <option
                  v-for="bay in departmentBays"
                  :key="bay.id"
                  :value="bay.id"
                >
                  {{ bay.name }}
                  <template v-if="bay.code">
                    ({{ bay.code }})
                  </template>
                </option>
              </select>

              <p class="label text-base-content/50">
                Optional
              </p>

              <p
                v-if="fieldError('bay_id')"
                class="label text-error"
              >
                {{ fieldError('bay_id') }}
              </p>
            </fieldset>

            <!-- Advisor -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Advisor
              </legend>

              <select
                v-model="form.advisor_id"
                class="select select-bordered w-full"
                :disabled="!form.department_id"
                :class="{
                  'select-error': fieldError('advisor_id'),
                }"
              >
                <option value="">
                  {{
                    form.department_id
                      ? 'Select advisor'
                      : 'Select department first'
                  }}
                </option>

                <option
                  v-for="employee in departmentAdvisors"
                  :key="employee.id"
                  :value="employee.id"
                >
                  {{ employeeName(employee) }}
                </option>
              </select>

              <p class="label text-base-content/50">
                Optional
              </p>

              <p
                v-if="fieldError('advisor_id')"
                class="label text-error"
              >
                {{ fieldError('advisor_id') }}
              </p>
            </fieldset>
          </div>

          <div class="divider" />

          <!-- Job Details -->
          <div>
            <h2 class="text-lg font-semibold">
              Job Details
            </h2>

            <p class="text-sm text-base-content/60">
              Record the customer's complaint and estimated job information.
            </p>
          </div>

          <div class="mt-5 space-y-5">
            <!-- Complaint -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Customer Complaint / Requested Work
              </legend>

              <textarea
                v-model="form.complaint"
                class="textarea textarea-bordered min-h-32 w-full"
                :class="{
                  'textarea-error': fieldError('complaint'),
                }"
                placeholder="Describe the customer's complaint or requested work..."
              />

              <p
                v-if="fieldError('complaint')"
                class="label text-error"
              >
                {{ fieldError('complaint') }}
              </p>
            </fieldset>

            <!-- Customer Notes -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Customer Notes
              </legend>

              <textarea
                v-model="form.customer_notes"
                class="textarea textarea-bordered min-h-24 w-full"
                :class="{
                  'textarea-error': fieldError('customer_notes'),
                }"
                placeholder="Additional notes from the customer..."
              />

              <p class="label text-base-content/50">
                Optional
              </p>

              <p
                v-if="fieldError('customer_notes')"
                class="label text-error"
              >
                {{ fieldError('customer_notes') }}
              </p>
            </fieldset>

            <!-- Estimate -->
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <!-- Estimated Cost -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Estimated Cost
                </legend>

                <label class="input input-bordered flex w-full items-center gap-2">
                  <span class="text-base-content/50">
                    ₹
                  </span>

                  <input
                    v-model="form.estimated_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    class="grow"
                    placeholder="0"
                  />
                </label>

                <p class="label text-base-content/50">
                  Optional
                </p>

                <p
                  v-if="fieldError('estimated_cost')"
                  class="label text-error"
                >
                  {{ fieldError('estimated_cost') }}
                </p>
              </fieldset>

              <!-- Estimated Completion -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Estimated Completion
                </legend>

                <input
                  v-model="form.estimated_completion_at"
                  type="datetime-local"
                  class="input input-bordered w-full"
                  :class="{
                    'input-error': fieldError('estimated_completion_at'),
                  }"
                />

                <p class="label text-base-content/50">
                  Optional
                </p>

                <p
                  v-if="fieldError('estimated_completion_at')"
                  class="label text-error"
                >
                  {{ fieldError('estimated_completion_at') }}
                </p>
              </fieldset>
            </div>
          </div>

          <!-- Initial Status -->
          <div class="mt-6 rounded-lg border border-base-300 bg-base-200 p-4">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Icon
                  name="lucide:clock-3"
                  class="size-5"
                />
              </div>

              <div>
                <p class="font-medium">
                  Initial Status
                </p>

                <p class="text-sm text-base-content/60">
                  New job cards are automatically created as
                  <span class="font-medium text-warning">
                    Pending
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex flex-col-reverse gap-3 border-t border-base-300 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="btn btn-ghost"
              :disabled="saving"
              @click="cancel"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="saving"
            >
              <span
                v-if="saving"
                class="loading loading-spinner loading-sm"
              />

              <Icon
                v-else
                name="lucide:clipboard-plus"
                class="size-4"
              />

              {{ saving ? 'Creating...' : 'Create Job Card' }}
            </button>
          </div>
        </div>
      </form>
    </template>

    <!-- App Modal-Create Customer -->
    <AdminCommonAppModal
      v-model="showCustomerModal"
      title="Create Customer"
      width="max-w-xl"
    >
      <AdminCustomerForm
        :initial-phone="customerPhone"
        @saved="handleCustomerCreated"
        @cancel="showCustomerModal = false"
      />
    </AdminCommonAppModal>

    <!-- Add New Vehicle to Customer -->
    <AdminCommonAppModal
      v-model="showVehicleModal"
      title="Add New Vehicle"
      width="max-w-3xl"
    >
      <AdminVehicleForm
        v-if="selectedCustomer"
        :customer-id="selectedCustomer.id"
        @saved="handleVehicleCreated"
        @cancel="showVehicleModal = false"
      />
    </AdminCommonAppModal>

  </div>
</template>
