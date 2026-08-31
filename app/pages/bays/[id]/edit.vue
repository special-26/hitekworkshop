<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

interface Department {
  id: number
  name: string
}

interface Bay {
  id: number
  name: string
  code: string
  department_id: number
  type: string
  is_active: boolean
  department?: Department
}

const route = useRoute()
const router = useRouter()
const api = useApi()

const { hasPermission } = usePermissions()

const bayId = route.params.id as string

const loading = ref(true)
const saving = ref(false)
const loadingDepartments = ref(true)

const error = ref('')
const validationErrors = ref<Record<string, string[]>>({})

const bay = ref<Bay | null>(null)
const departments = ref<Department[]>([])

const form = reactive({
  name: '',
  code: '',
  department_id: '',
  type: '',
})

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

/*
|--------------------------------------------------------------------------
| Fetch Bay
|--------------------------------------------------------------------------
*/

const fetchBay = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/bays/${bayId}`
    )

    bay.value = response.data

    form.name = response.data.name
    form.code = response.data.code
    form.department_id = String(
      response.data.department_id
    )
    form.type = response.data.type
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load bay.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Fetch Departments
|--------------------------------------------------------------------------
*/

const fetchDepartments = async () => {
  loadingDepartments.value = true

  try {
    const response = await api(
      '/api/admin/departments'
    )

    departments.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load departments.'
  } finally {
    loadingDepartments.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Update Bay
|--------------------------------------------------------------------------
*/

const submit = async () => {
  saving.value = true
  error.value = ''
  validationErrors.value = {}

  try {
    await api(`/api/admin/bays/${bayId}`, {
      method: 'PUT',

      body: {
        name: form.name,
        code: form.code,
        department_id: form.department_id
          ? Number(form.department_id)
          : null,
        type: form.type,
      },
    })

    await router.push('/bays')
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
      'Unable to update bay.'
  } finally {
    saving.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Initial Load
|--------------------------------------------------------------------------
*/

onMounted(async () => {
  await Promise.all([
    fetchBay(),
    fetchDepartments(),
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
            <NuxtLink to="/bays">
              Bays
            </NuxtLink>
          </li>

          <li>
            Edit Bay
          </li>
        </ul>
      </div>

      <div class="mt-3">
        <h1 class="text-2xl font-bold text-base-content">
          Edit Bay
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Update workshop bay information.
        </p>
      </div>
    </div>

    <!-- Permission -->
    <div
      v-if="!hasPermission('bays.update')"
      class="alert alert-error"
    >
      <Icon
        name="lucide:shield-alert"
        class="size-5"
      />

      <span>
        You do not have permission to update bays.
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
            Loading bay...
          </p>
        </div>
      </div>

      <!-- Form -->
      <form
        v-else-if="bay"
        class="card border border-base-300 bg-base-100 shadow-sm"
        @submit.prevent="submit"
      >
        <div class="card-body">
          <!-- Section -->
          <div>
            <h2 class="text-lg font-semibold text-base-content">
              Bay Information
            </h2>

            <p class="text-sm text-base-content/60">
              Update the bay name, code, department and work type.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- Name -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Bay Name
              </legend>

              <input
                v-model="form.name"
                type="text"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('name'),
                }"
                placeholder="General Service Bay 1"
              />

              <p
                v-if="fieldError('name')"
                class="label text-error"
              >
                {{ fieldError('name') }}
              </p>
            </fieldset>

            <!-- Code -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Bay Code
              </legend>

              <input
                v-model="form.code"
                type="text"
                class="input input-bordered w-full uppercase"
                :class="{
                  'input-error': fieldError('code'),
                }"
                placeholder="GS-01"
              />

              <p class="label text-base-content/50">
                The code will be stored in uppercase.
              </p>

              <p
                v-if="fieldError('code')"
                class="label text-error"
              >
                {{ fieldError('code') }}
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
                :disabled="loadingDepartments"
              >
                <option
                  value=""
                  disabled
                >
                  {{
                    loadingDepartments
                      ? 'Loading departments...'
                      : 'Select department'
                  }}
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

            <!-- Type -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Bay Type
              </legend>

              <input
                v-model="form.type"
                type="text"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('type'),
                }"
                placeholder="General Service"
              />

              <p
                v-if="fieldError('type')"
                class="label text-error"
              >
                {{ fieldError('type') }}
              </p>
            </fieldset>
          </div>

          <!-- Current Status -->
          <div class="mt-6 rounded-lg border border-base-300 bg-base-200 p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-medium">
                  Current Status
                </p>

                <p class="text-sm text-base-content/60">
                  Bay activation is managed separately.
                </p>
              </div>

              <span
                class="badge"
                :class="
                  bay.is_active
                    ? 'badge-success'
                    : 'badge-error'
                "
              >
                {{ bay.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex flex-col-reverse gap-3 border-t border-base-300 pt-6 sm:flex-row sm:justify-end">
            <NuxtLink
              to="/bays"
              class="btn btn-ghost"
            >
              Cancel
            </NuxtLink>

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="
                saving ||
                loadingDepartments
              "
            >
              <span
                v-if="saving"
                class="loading loading-spinner loading-sm"
              />

              {{
                saving
                  ? 'Updating...'
                  : 'Update Bay'
              }}
            </button>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>