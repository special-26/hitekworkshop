```vue
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
  if (!form.department_id) {
    return []
  }

  return employees.value.filter(employee => {
    if (employee.is_active === false) {
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

/*
|--------------------------------------------------------------------------
| Fetch Customers
|--------------------------------------------------------------------------
*/

const fetchCustomers = async () => {
  const response = await api(
    '/api/admin/customers'
  )

  customers.value = response.data
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
  const response = await api(
    '/api/admin/employees'
  )

  employees.value = response.data
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
            <h2 class="text-lg font-semibold">
              Customer & Vehicle
            </h2>

            <p class="text-sm text-base-content/60">
              Select the customer and vehicle for this job.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- Customer -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Customer
              </legend>

              <select
                v-model="form.customer_id"
                class="select select-bordered w-full"
                :class="{
                  'select-error': fieldError('customer_id'),
                }"
              >
                <option
                  value=""
                  disabled
                >
                  Select customer
                </option>

                <option
                  v-for="customer in customers"
                  :key="customer.id"
                  :value="customer.id"
                >
                  {{ customer.customer_code }} -
                  {{ customer.name }}
                  ({{ customer.phone }})
                </option>
              </select>

              <p
                v-if="fieldError('customer_id')"
                class="label text-error"
              >
                {{ fieldError('customer_id') }}
              </p>
            </fieldset>

            <!-- Vehicle -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Vehicle
              </legend>

              <select
                v-model="form.vehicle_id"
                class="select select-bordered w-full"
                :disabled="!form.customer_id"
                :class="{
                  'select-error': fieldError('vehicle_id'),
                }"
              >
                <option
                  value=""
                  disabled
                >
                  {{
                    form.customer_id
                      ? 'Select vehicle'
                      : 'Select customer first'
                  }}
                </option>

                <option
                  v-for="vehicle in customerVehicles"
                  :key="vehicle.id"
                  :value="vehicle.id"
                >
                  {{ vehicle.registration_number }}
                  -
                  {{ vehicle.make }}
                  {{ vehicle.model }}
                  <template v-if="vehicle.variant">
                    ({{ vehicle.variant }})
                  </template>
                </option>
              </select>

              <p
                v-if="form.customer_id && customerVehicles.length === 0"
                class="label text-warning"
              >
                No vehicles found for this customer.
              </p>

              <p
                v-if="fieldError('vehicle_id')"
                class="label text-error"
              >
                {{ fieldError('vehicle_id') }}
              </p>
            </fieldset>
          </div>

          <!-- Selected Vehicle Preview -->
          <div
            v-if="selectedCustomer && selectedVehicle"
            class="mt-5 rounded-xl border border-base-300 bg-base-200 p-5"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon
                  name="lucide:car-front"
                  class="size-6 text-primary"
                />
              </div>

              <div class="min-w-0">
                <p class="font-semibold">
                  {{ selectedVehicle.make }}
                  {{ selectedVehicle.model }}
                </p>

                <div class="mt-1 flex flex-wrap gap-3 text-sm text-base-content/60">
                  <span>
                    {{ selectedVehicle.registration_number }}
                  </span>

                  <span>
                    {{ selectedCustomer.name }}
                  </span>

                  <span>
                    {{ selectedCustomer.phone }}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
  </div>
</template>
```
