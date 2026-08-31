<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

interface Department {
  id: number
  name: string
  is_active: boolean
}

const api = useApi()
const { hasPermission } = usePermissions()

const departments = ref<Department[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const showFormModal = ref(false)
const showStatusModal = ref(false)

const editingDepartment = ref<Department | null>(null)
const selectedDepartment = ref<Department | null>(null)

const saving = ref(false)
const updatingStatus = ref(false)

const validationErrors = ref<Record<string, string[]>>({})

const form = reactive({
  name: '',
})

const fetchDepartments = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api('/api/admin/departments', {
      query: {
        all: 1,
      },
    })

    departments.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to fetch departments.'
  } finally {
    loading.value = false
  }
}

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

const openCreateModal = () => {
  editingDepartment.value = null

  form.name = ''

  validationErrors.value = {}
  error.value = ''

  showFormModal.value = true
}

const openEditModal = (department: Department) => {
  editingDepartment.value = department

  form.name = department.name

  validationErrors.value = {}
  error.value = ''

  showFormModal.value = true
}

const closeFormModal = () => {
  if (saving.value) {
    return
  }

  showFormModal.value = false
  editingDepartment.value = null
  validationErrors.value = {}
}

const saveDepartment = async () => {
  saving.value = true
  validationErrors.value = {}
  error.value = ''
  success.value = ''

  try {
    if (editingDepartment.value) {
      await api(
        `/api/admin/departments/${editingDepartment.value.id}`,
        {
          method: 'PUT',
          body: {
            name: form.name,
          },
        }
      )

      success.value = 'Department updated successfully.'
    } else {
      await api('/api/admin/departments', {
        method: 'POST',
        body: {
          name: form.name,
        },
      })

      success.value = 'Department created successfully.'
    }

    showFormModal.value = false
    editingDepartment.value = null

    await fetchDepartments()
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
      'Unable to save department.'
  } finally {
    saving.value = false
  }
}

const openStatusModal = (department: Department) => {
  selectedDepartment.value = department
  error.value = ''
  showStatusModal.value = true
}

const closeStatusModal = () => {
  if (updatingStatus.value) {
    return
  }

  showStatusModal.value = false
  selectedDepartment.value = null
}

const updateDepartmentStatus = async () => {
  if (!selectedDepartment.value) {
    return
  }

  updatingStatus.value = true
  error.value = ''
  success.value = ''

  try {
    const newStatus = !selectedDepartment.value.is_active

    await api(
      `/api/admin/departments/${selectedDepartment.value.id}/status`,
      {
        method: 'PATCH',
        body: {
          is_active: newStatus,
        },
      }
    )

    success.value = newStatus
      ? 'Department activated successfully.'
      : 'Department deactivated successfully.'

    showStatusModal.value = false
    selectedDepartment.value = null

    await fetchDepartments()
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update department status.'
  } finally {
    updatingStatus.value = false
  }
}

onMounted(() => {
  fetchDepartments()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-base-content">
          Departments
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Manage workshop departments.
        </p>
      </div>

      <button
        v-if="hasPermission('employees.create')"
        type="button"
        class="btn btn-primary"
        @click="openCreateModal"
      >
        <Icon
          name="lucide:plus"
          class="size-5"
        />

        Add Department
      </button>
    </div>

    <!-- Success -->
    <div
      v-if="success"
      class="alert alert-success mt-6"
    >
      <span>{{ success }}</span>
    </div>

    <!-- Error -->
    <div
      v-if="error && !showFormModal && !showStatusModal"
      class="alert alert-error mt-6"
    >
      <span>{{ error }}</span>
    </div>

    <!-- Departments Table -->
    <div class="card mt-6 overflow-hidden border border-base-300 bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>
                Department
              </th>

              <th>
                Status
              </th>

              <th class="text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading -->
            <tr v-if="loading">
              <td
                colspan="3"
                class="py-16 text-center"
              >
                <span class="loading loading-spinner loading-lg" />

                <p class="mt-3 text-sm text-base-content/60">
                  Loading departments...
                </p>
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="departments.length === 0">
              <td
                colspan="3"
                class="py-16 text-center"
              >
                <Icon
                  name="lucide:building-2"
                  class="mx-auto size-12 text-base-content/30"
                />

                <p class="mt-3 font-medium">
                  No departments found
                </p>
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-for="department in departments"
              v-else
              :key="department.id"
            >
              <td>
                <div class="flex items-center gap-3">
                  <div class="flex size-10 items-center justify-center rounded-lg bg-base-200">
                    <Icon
                      name="lucide:building-2"
                      class="size-5"
                    />
                  </div>

                  <div>
                    <div class="font-semibold">
                      {{ department.name }}
                    </div>

                    <div class="text-sm text-base-content/50">
                      Department #{{ department.id }}
                    </div>
                  </div>
                </div>
              </td>

              <td>
                <span
                  class="badge"
                  :class="
                    department.is_active
                      ? 'badge-success'
                      : 'badge-error'
                  "
                >
                  {{ department.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button
                    v-if="hasPermission('employees.update')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    @click="openEditModal(department)"
                  >
                    Edit
                  </button>

                  <button
                    v-if="hasPermission('employees.update')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    @click="openStatusModal(department)"
                  >
                    {{ department.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <dialog
      class="modal"
      :class="{ 'modal-open': showFormModal }"
    >
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{
            editingDepartment
              ? 'Edit Department'
              : 'Create Department'
          }}
        </h3>

        <p class="mt-1 text-sm text-base-content/60">
          {{
            editingDepartment
              ? 'Update the department name.'
              : 'Create a new workshop department.'
          }}
        </p>

        <div
          v-if="error"
          class="alert alert-error mt-4"
        >
          <span>{{ error }}</span>
        </div>

        <form
          class="mt-5"
          @submit.prevent="saveDepartment"
        >
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Department Name
            </legend>

            <input
              v-model="form.name"
              type="text"
              class="input input-bordered w-full"
              :class="{
                'input-error': fieldError('name'),
              }"
              placeholder="General Service"
            />

            <p
              v-if="fieldError('name')"
              class="label text-error"
            >
              {{ fieldError('name') }}
            </p>
          </fieldset>

          <div class="modal-action">
            <button
              type="button"
              class="btn btn-ghost"
              :disabled="saving"
              @click="closeFormModal"
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

              {{
                saving
                  ? 'Saving...'
                  : editingDepartment
                    ? 'Update Department'
                    : 'Create Department'
              }}
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Status Modal -->
    <dialog
      class="modal"
      :class="{ 'modal-open': showStatusModal }"
    >
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{
            selectedDepartment?.is_active
              ? 'Deactivate Department'
              : 'Activate Department'
          }}
        </h3>

        <p class="mt-3 text-base-content/70">
          Are you sure you want to
          <strong>
            {{
              selectedDepartment?.is_active
                ? 'deactivate'
                : 'activate'
            }}
          </strong>
          <strong>{{ selectedDepartment?.name }}</strong>?
        </p>

        <div
          v-if="selectedDepartment?.is_active"
          class="alert alert-warning mt-5"
        >
          <span class="text-sm">
            Inactive departments will no longer appear in employee create/edit department dropdowns.
          </span>
        </div>

        <div
          v-if="error"
          class="alert alert-error mt-4"
        >
          <span>{{ error }}</span>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="updatingStatus"
            @click="closeStatusModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn"
            :class="
              selectedDepartment?.is_active
                ? 'btn-error'
                : 'btn-success'
            "
            :disabled="updatingStatus"
            @click="updateDepartmentStatus"
          >
            <span
              v-if="updatingStatus"
              class="loading loading-spinner loading-sm"
            />

            {{
              updatingStatus
                ? 'Updating...'
                : selectedDepartment?.is_active
                  ? 'Deactivate'
                  : 'Activate'
            }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>