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

const api = useApi()
const router = useRouter()

const { hasPermission } = usePermissions()

const bays = ref<Bay[]>([])

const loading = ref(true)
const error = ref('')

const statusLoading = ref<number | null>(null)

const fetchBays = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api('/api/admin/bays')

    bays.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load bays.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

const toggleStatus = async (bay: Bay) => {
  statusLoading.value = bay.id
  error.value = ''

  try {
    const response = await api(
      `/api/admin/bays/${bay.id}/status`,
      {
        method: 'PATCH',
        body: {
          is_active: !bay.is_active,
        },
      }
    )

    const updatedBay = response.data

    const index = bays.value.findIndex(
      item => item.id === bay.id
    )

    if (index !== -1) {
      bays.value[index] = updatedBay
    }
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update bay status.'
  } finally {
    statusLoading.value = null
  }
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const createBay = () => {
  router.push('/bays/create')
}

const editBay = (bay: Bay) => {
  router.push(`/bays/${bay.id}/edit`)
}

const viewBay = (bay: Bay) => {
  router.push(`/bays/${bay.id}`)
}

onMounted(() => {
  fetchBays()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Bays
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Manage workshop bays and their status.
        </p>
      </div>

      <button
        v-if="hasPermission('bays.create')"
        type="button"
        class="btn btn-primary"
        @click="createBay"
      >
        <Icon
          name="lucide:plus"
          class="size-5"
        />

        Add Bay
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="alert alert-error mt-6"
    >
      <Icon
        name="lucide:circle-alert"
        class="size-5"
      />

      <span>{{ error }}</span>
    </div>

    <!-- Table -->
    <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Bay</th>
                <th>Code</th>
                <th>Department</th>
                <th>Type</th>
                <th>Status</th>
                <th class="text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              <!-- Loading -->
              <tr v-if="loading">
                <td
                  colspan="6"
                  class="py-16 text-center"
                >
                  <span class="loading loading-spinner loading-lg" />

                  <p class="mt-3 text-sm text-base-content/60">
                    Loading bays...
                  </p>
                </td>
              </tr>

              <!-- Empty -->
              <tr v-else-if="bays.length === 0">
                <td
                  colspan="6"
                  class="py-16 text-center"
                >
                  <Icon
                    name="lucide:warehouse"
                    class="mx-auto size-12 text-base-content/30"
                  />

                  <p class="mt-3 font-medium">
                    No bays found
                  </p>

                  <p class="mt-1 text-sm text-base-content/60">
                    Create your first workshop bay.
                  </p>
                </td>
              </tr>

              <!-- Bays -->
              <tr
                v-for="bay in bays"
                v-else
                :key="bay.id"
              >
                <!-- Bay -->
                <td>
                  <div class="flex items-center gap-3">
                    <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon
                        name="lucide:warehouse"
                        class="size-5 text-primary"
                      />
                    </div>

                    <div>
                      <div class="font-semibold">
                        {{ bay.name }}
                      </div>

                      <div class="text-xs text-base-content/50">
                        ID: {{ bay.id }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Code -->
                <td>
                  <code class="rounded bg-base-200 px-2 py-1 text-sm">
                    {{ bay.code }}
                  </code>
                </td>

                <!-- Department -->
                <td>
                  <span v-if="bay.department">
                    {{ bay.department.name }}
                  </span>

                  <span
                    v-else
                    class="text-base-content/40"
                  >
                    —
                  </span>
                </td>

                <!-- Type -->
                <td>
                  {{ bay.type }}
                </td>

                <!-- Status -->
                <td>
                  <span
                    v-if="bay.is_active"
                    class="badge badge-success badge-soft"
                  >
                    Active
                  </span>

                  <span
                    v-else
                    class="badge badge-error badge-soft"
                  >
                    Inactive
                  </span>
                </td>

                <!-- Actions -->
                <td>
                  <div class="flex justify-end gap-1">
                    <!-- View -->
                    <button
                      v-if="hasPermission('bays.view')"
                      type="button"
                      class="btn btn-ghost btn-sm"
                      title="View"
                      @click="viewBay(bay)"
                    >
                      <Icon
                        name="lucide:eye"
                        class="size-4"
                      />
                    </button>

                    <!-- Edit -->
                    <button
                      v-if="hasPermission('bays.update')"
                      type="button"
                      class="btn btn-ghost btn-sm"
                      title="Edit"
                      @click="editBay(bay)"
                    >
                      <Icon
                        name="lucide:pencil"
                        class="size-4"
                      />
                    </button>

                    <!-- Status -->
                    <button
                      v-if="hasPermission('bays.status.update')"
                      type="button"
                      class="btn btn-ghost btn-sm"
                      :disabled="statusLoading === bay.id"
                      :title="
                        bay.is_active
                          ? 'Deactivate'
                          : 'Activate'
                      "
                      @click="toggleStatus(bay)"
                    >
                      <span
                        v-if="statusLoading === bay.id"
                        class="loading loading-spinner loading-xs"
                      />

                      <Icon
                        v-else
                        :name="
                          bay.is_active
                            ? 'lucide:power-off'
                            : 'lucide:power'
                        "
                        class="size-4"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>