<script setup lang="ts">
definePageMeta({
    layout: 'dashboard',
    middleware: ['$auth'],
})

const api = useApi()
const router = useRouter()

const loading = ref(false)
const loadingOptions = ref(true)
const error = ref('')
const validationErrors = ref<Record<string, string[]>>({})

const departments = ref<any[]>([])
const roles = ref<any[]>([])

const form = reactive({
  name: '',
  email: '',
  password: '',
  employee_code: '',
  department_id: '',
  designation: '',
  phone: '',
  joining_date: '',
  role: ''
})

const fetchOptions = async () => {
  loadingOptions.value = true

  try {
    const [departmentResponse, roleResponse] = await Promise.all([
      api('/api/admin/departments'),
      api('/api/admin/roles')
    ])

    departments.value = departmentResponse.data
    roles.value = roleResponse.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
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
    // Make sure Laravel has issued the CSRF cookie
    await api('/sanctum/csrf-cookie')

    // Create employee
    await api('/api/admin/employees', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        password: form.password,
        employee_code: form.employee_code,
        department_id: form.department_id
          ? Number(form.department_id)
          : null,
        designation: form.designation || null,
        phone: form.phone || null,
        joining_date: form.joining_date || null,
        role: form.role
      }
    })

    await router.push('/employees')
  } catch (err: any) {
    console.error(err)

    if (err?.status === 422 || err?.response?.status === 422) {
      validationErrors.value =
        err?.data?.errors ||
        err?.response?._data?.errors ||
        {}
    }

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to create employee.'
  } finally {
    loading.value = false
  }
}

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

onMounted(() => {
  fetchOptions()
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
            Create Employee
          </li>
        </ul>
      </div>

      <div class="mt-3">
        <h1 class="text-2xl font-bold text-base-content">
          Create Employee
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Create an employee profile and login account.
        </p>
      </div>

    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="alert alert-error mb-6"
    >
      <span>{{ error }}</span>
    </div>

    <!-- Form -->
    <form
      class="card border border-base-300 bg-base-100 shadow-sm"
      @submit.prevent="submit"
    >

      <div class="card-body">

        <!-- Account -->
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
              :class="{ 'input-error': fieldError('name') }"
              placeholder="Employee name"
            >

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
              :class="{ 'input-error': fieldError('email') }"
              placeholder="employee@example.com"
            >

            <p
              v-if="fieldError('email')"
              class="label text-error"
            >
              {{ fieldError('email') }}
            </p>

          </fieldset>

          <!-- Password -->
          <fieldset class="fieldset">

            <legend class="fieldset-legend">
              Password
            </legend>

            <input
              v-model="form.password"
              type="password"
              class="input input-bordered w-full"
              :class="{ 'input-error': fieldError('password') }"
              placeholder="Minimum 8 characters"
            >

            <p
              v-if="fieldError('password')"
              class="label text-error"
            >
              {{ fieldError('password') }}
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
              :class="{ 'select-error': fieldError('role') }"
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

        </div>

        <div class="divider" />

        <!-- Employee Information -->
        <div>
          <h2 class="text-lg font-semibold">
            Employee Information
          </h2>

          <p class="text-sm text-base-content/60">
            Workshop employee details.
          </p>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">

          <!-- Employee Code -->
          <fieldset class="fieldset">

            <legend class="fieldset-legend">
              Employee Code
            </legend>

            <input
              v-model="form.employee_code"
              type="text"
              class="input input-bordered w-full"
              :class="{ 'input-error': fieldError('employee_code') }"
              placeholder="EMP-000001"
            >

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
              :class="{ 'select-error': fieldError('department_id') }"
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
              placeholder="Service Advisor"
            >

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
              placeholder="9876543210"
            >

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
            >

          </fieldset>

        </div>

        <!-- Actions -->
        <div class="mt-8 flex flex-col-reverse gap-3 border-t border-base-300 pt-6 sm:flex-row sm:justify-end">

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

            {{ loading ? 'Creating...' : 'Create Employee' }}

          </button>

        </div>

      </div>

    </form>

  </div>
</template>