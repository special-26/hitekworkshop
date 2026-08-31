<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

const api = useApi()
const router = useRouter()

const { hasPermission } = usePermissions()

const loading = ref(false)
const loadingDepartments = ref(true)

const error = ref('')
const validationErrors = ref<Record<string, string[]>>({})

const departments = ref<any[]>([])

const form = reactive({
  name: '',
  code: '',
  department_id: '',
  type: '',
})

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

const fetchDepartments = async () => {
  loadingDepartments.value = true
  error.value = ''

  try {
    const response = await api('/api/admin/departments')

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

const submit = async () => {
  loading.value = true
  error.value = ''
  validationErrors.value = {}

  try {
    await api('/api/admin/bays', {
      method: 'POST',

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
      'Unable to create bay.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDepartments()
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
            Create Bay
          </li>
        </ul>
      </div>

      <div class="mt-3">
        <h1 class="text-2xl font-bold">
          Create Bay
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Add a new working bay to the workshop.
        </p>
      </div>
    </div>

    <!-- Permission -->
    <div
      v-if="!hasPermission('bays.create')"
      class="alert alert-error"
    >
      <span>
        You do not have permission to create bays.
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

      <!-- Form -->
      <form
        class="card border border-base-300 bg-base-100 shadow-sm"
        @submit.prevent="submit"
      >
        <div class="card-body">
          <div>
            <h2 class="text-lg font-semibold">
              Bay Information
            </h2>

            <p class="text-sm text-base-content/60">
              Define the bay name, code, department and work type.
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

          <!-- Info -->
          <div class="alert mt-6">
            <Icon
              name="lucide:info"
              class="size-5"
            />

            <span class="text-sm">
              New bays are automatically created as active.
            </span>
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
                loading ||
                loadingDepartments
              "
            >
              <span
                v-if="loading"
                class="loading loading-spinner loading-sm"
              />

              {{
                loading
                  ? 'Creating...'
                  : 'Create Bay'
              }}
            </button>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>