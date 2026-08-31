<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

interface Employee {
  id: number
  user_id: string
  department_id: number | null
  employee_code: string
  phone: string | null
  designation: string | null
  joining_date: string | null
  status: 'active' | 'inactive' | 'terminated' | 'on_leave'
  user: {
    id: string
    name: string
    email: string
    is_active: boolean
    roles?: {
      uuid: string
      name: string
    }[]
  } | null
  department: {
    id: number
    name: string
  } | null
}

const api = useApi()
const router = useRouter()
const route = useRoute()

const { hasPermission } = usePermissions()

const loading = ref(false)
const loadingEmployee = ref(true)
const loadingOptions = ref(true)

const error = ref('')
const validationErrors = ref<Record<string, string[]>>({})

const employee = ref<Employee | null>(null)

const departments = ref<any[]>([])
const roles = ref<any[]>([])

const form = reactive({
  name: '',
  email: '',
  employee_code: '',
  department_id: '',
  designation: '',
  phone: '',
  joining_date: '',
  role: '',
})

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

const fetchEmployee = async () => {
  loadingEmployee.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/employees/${route.params.id}`
    )

    employee.value = response.data

    const data = response.data

    form.name = data.user?.name || ''
    form.email = data.user?.email || ''
    form.employee_code = data.employee_code || ''
    form.department_id = data.department_id
      ? String(data.department_id)
      : ''
    form.designation = data.designation || ''
    form.phone = data.phone || ''
    form.joining_date = data.joining_date
      ? data.joining_date.substring(0, 10)
      : ''

    form.role = data.user?.roles?.[0]?.name || ''
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to fetch employee.'
  } finally {
    loadingEmployee.value = false
  }
}

const fetchOptions = async () => {
  loadingOptions.value = true

  try {
    const [departmentResponse, roleResponse] = await Promise.all([
      api('/api/admin/departments'),
      api('/api/admin/roles'),
    ])

    departments.value = departmentResponse.data
    roles.value = roleResponse.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load departments and roles.'
  } finally {
    loadingOptions.value = false
  }
}

const submit = async () => {
  loading.value = true
  error.value = ''
  validationErrors.value = {}

  try {
    await api(
      `/api/admin/employees/${route.params.id}`,
      {
        method: 'PUT',

        body: {
          name: form.name,
          email: form.email,
          employee_code: form.employee_code,
          department_id: form.department_id
            ? Number(form.department_id)
            : null,
          designation: form.designation || null,
          phone: form.phone || null,
          joining_date: form.joining_date || null,
          role: form.role,
        },
      }
    )

    await router.push('/employees')
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
      'Unable to update employee.'
  } finally {
    loading.value = false
  }
}

const formatStatus = (value: string) => {
  return value
    .replace('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const statusBadgeClass = (value: Employee['status']) => {
  switch (value) {
    case 'active':
      return 'badge-success'

    case 'inactive':
      return 'badge-warning'

    case 'on_leave':
      return 'badge-info'

    case 'terminated':
      return 'badge-error'

    default:
      return 'badge-ghost'
  }
}

onMounted(async () => {
  await Promise.all([
    fetchEmployee(),
    fetchOptions(),
  ])
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="breadcrumbs text-sm">
        <ul>
          <li>
            <NuxtLink to="/employees">
              Employees
            </NuxtLink>
          </li>

          <li>
            Edit Employee
          </li>
        </ul>
      </div>

      <div class="mt-3">
        <h1 class="text-2xl font-bold text-base-content">
          Edit Employee
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Update employee profile and account information.
        </p>
      </div>
    </div>

    <!-- Permission -->
    <div
      v-if="!hasPermission('employees.update')"
      class="alert alert-error"
    >
      <span>
        You do not have permission to update employees.
      </span>
    </div>

    <template v-else>
      <!-- Loading -->
      <div
        v-if="loadingEmployee"
        class="flex justify-center py-20"
      >
        <span class="loading loading-spinner loading-lg" />
      </div>

      <template v-else>
        <!-- Error -->
        <div
          v-if="error"
          class="alert alert-error mb-6"
        >
          <span>{{ error }}</span>
        </div>

        <!-- Form -->
        <form
          v-if="employee"
          class="card border border-base-300 bg-base-100 shadow-sm"
          @submit.prevent="submit"
        >
          <div class="card-body">
            <!-- Account Information -->
            <div>
              <h2 class="text-lg font-semibold">
                Account Information
              </h2>

              <p class="text-sm text-base-content/60">
                Login information for the employee.
              </p>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              <!-- Name -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Name
                </legend>

                <input
                  v-model="form.name"
                  type="text"
                  class="input input-bordered w-full"
                  :class="{
                    'input-error': fieldError('name'),
                  }"
                  placeholder="Employee name"
                />

                <p
                  v-if="fieldError('name')"
                  class="label text-error"
                >
                  {{ fieldError('name') }}
                </p>
              </fieldset>

              <!-- Email -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Email
                </legend>

                <input
                  v-model="form.email"
                  type="email"
                  class="input input-bordered w-full"
                  :class="{
                    'input-error': fieldError('email'),
                  }"
                  placeholder="employee@example.com"
                />

                <p
                  v-if="fieldError('email')"
                  class="label text-error"
                >
                  {{ fieldError('email') }}
                </p>
              </fieldset>

              <!-- Role -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Role
                </legend>

                <select
                  v-model="form.role"
                  class="select select-bordered w-full"
                  :class="{
                    'select-error': fieldError('role'),
                  }"
                  :disabled="loadingOptions"
                >
                  <option
                    value=""
                    disabled
                  >
                    Select role
                  </option>

                  <option
                    v-for="role in roles"
                    :key="role.uuid"
                    :value="role.name"
                  >
                    {{ role.name }}
                  </option>
                </select>

                <p
                  v-if="fieldError('role')"
                  class="label text-error"
                >
                  {{ fieldError('role') }}
                </p>
              </fieldset>

              <!-- Login Status -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Login Status
                </legend>

                <div class="flex h-10 items-center">
                  <span
                    class="badge"
                    :class="
                      employee.user?.is_active
                        ? 'badge-success'
                        : 'badge-error'
                    "
                  >
                    {{
                      employee.user?.is_active
                        ? 'Enabled'
                        : 'Disabled'
                    }}
                  </span>
                </div>
              </fieldset>
            </div>

            <div class="divider">
              Employee Information
            </div>

            <!-- Employee Information -->
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <!-- Employee Code -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Employee Code
                </legend>

                <input
                  v-model="form.employee_code"
                  type="text"
                  class="input input-bordered w-full"
                  :class="{
                    'input-error': fieldError('employee_code'),
                  }"
                  placeholder="EMP-000001"
                />

                <p
                  v-if="fieldError('employee_code')"
                  class="label text-error"
                >
                  {{ fieldError('employee_code') }}
                </p>
              </fieldset>

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
                  :disabled="loadingOptions"
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

              <!-- Designation -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Designation
                </legend>

                <input
                  v-model="form.designation"
                  type="text"
                  class="input input-bordered w-full"
                  :class="{
                    'input-error': fieldError('designation'),
                  }"
                  placeholder="Service Advisor"
                />

                <p
                  v-if="fieldError('designation')"
                  class="label text-error"
                >
                  {{ fieldError('designation') }}
                </p>
              </fieldset>

              <!-- Phone -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Phone
                </legend>

                <input
                  v-model="form.phone"
                  type="tel"
                  class="input input-bordered w-full"
                  :class="{
                    'input-error': fieldError('phone'),
                  }"
                  placeholder="9876543210"
                />

                <p
                  v-if="fieldError('phone')"
                  class="label text-error"
                >
                  {{ fieldError('phone') }}
                </p>
              </fieldset>

              <!-- Joining Date -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Joining Date
                </legend>

                <input
                  v-model="form.joining_date"
                  type="date"
                  class="input input-bordered w-full"
                  :class="{
                    'input-error': fieldError('joining_date'),
                  }"
                />

                <p
                  v-if="fieldError('joining_date')"
                  class="label text-error"
                >
                  {{ fieldError('joining_date') }}
                </p>
              </fieldset>

              <!-- Current Status -->
              <fieldset class="fieldset">
                <legend class="fieldset-legend">
                  Employee Status
                </legend>

                <div class="flex h-10 items-center">
                  <span
                    class="badge"
                    :class="statusBadgeClass(employee.status)"
                  >
                    {{ formatStatus(employee.status) }}
                  </span>
                </div>
              </fieldset>
            </div>

            <!-- Notice -->
            <div class="alert mt-6">
              <span class="text-sm">
                Password is not changed from this page.
                Use the password reset action separately when
                we implement it.
              </span>
            </div>

            <!-- Actions -->
            <div
              class="mt-8 flex flex-col-reverse gap-3 border-t border-base-300 pt-6 sm:flex-row sm:justify-end"
            >
              <NuxtLink
                to="/employees"
                class="btn btn-ghost"
              >
                Cancel
              </NuxtLink>

              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading || loadingOptions"
              >
                <span
                  v-if="loading"
                  class="loading loading-spinner loading-sm"
                />

                {{
                  loading
                    ? 'Updating...'
                    : 'Update Employee'
                }}
              </button>
            </div>
          </div>
        </form>
      </template>
    </template>
  </div>
</template>