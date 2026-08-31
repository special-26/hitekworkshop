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

const bay = ref<Bay | null>(null)

const loading = ref(true)
const error = ref('')

const statusLoading = ref(false)

const fetchBay = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/bays/${bayId}`
    )

    bay.value = response.data
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
| Status
|--------------------------------------------------------------------------
*/

const toggleStatus = async () => {
  if (!bay.value) {
    return
  }

  statusLoading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/bays/${bay.value.id}/status`,
      {
        method: 'PATCH',
        body: {
          is_active: !bay.value.is_active,
        },
      }
    )

    bay.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update bay status.'
  } finally {
    statusLoading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Edit
|--------------------------------------------------------------------------
*/

const editBay = () => {
  if (!bay.value) {
    return
  }

  router.push(`/bays/${bay.value.id}/edit`)
}

onMounted(() => {
  fetchBay()
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
              to="/bays"
              class="hover:text-primary"
            >
              Bays
            </NuxtLink>
          </li>

          <li>
            Bay Details
          </li>
        </ul>
      </div>

      <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">
            Bay Details
          </h1>

          <p class="mt-1 text-sm text-base-content/60">
            View workshop bay information.
          </p>
        </div>

        <div
          v-if="bay"
          class="flex gap-2"
        >
          <button
            v-if="hasPermission('bays.update')"
            type="button"
            class="btn btn-outline"
            @click="editBay"
          >
            <Icon
              name="lucide:pencil"
              class="size-4"
            />

            Edit
          </button>

          <button
            v-if="hasPermission('bays.status.update')"
            type="button"
            class="btn"
            :class="
              bay.is_active
                ? 'btn-error'
                : 'btn-success'
            "
            :disabled="statusLoading"
            @click="toggleStatus"
          >
            <span
              v-if="statusLoading"
              class="loading loading-spinner loading-sm"
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

            {{
              bay.is_active
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
      class="card border border-base-300 bg-base-100 shadow-sm"
    >
      <div class="card-body flex items-center justify-center py-20">
        <span class="loading loading-spinner loading-lg" />

        <p class="mt-3 text-sm text-base-content/60">
          Loading bay details...
        </p>
      </div>
    </div>

    <!-- Details -->
    <template v-else-if="bay">
      <!-- Main Information -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Bay Identity -->
        <div class="card border border-base-300 bg-base-100 shadow-sm lg:col-span-2">
          <div class="card-body">
            <div class="flex items-start gap-4">
              <div class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon
                  name="lucide:warehouse"
                  class="size-7 text-primary"
                />
              </div>

              <div class="min-w-0">
                <h2 class="text-xl font-bold text-base-content">
                  {{ bay.name }}
                </h2>

                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <code class="rounded bg-base-200 px-2 py-1 text-sm">
                    {{ bay.code }}
                  </code>

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
            </div>

            <div class="divider" />

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <!-- Department -->
              <div>
                <p class="text-sm text-base-content/50">
                  Department
                </p>

                <div class="mt-1 flex items-center gap-2">
                  <Icon
                    name="lucide:building-2"
                    class="size-4 text-base-content/50"
                  />

                  <p class="font-medium">
                    {{ bay.department?.name || '—' }}
                  </p>
                </div>
              </div>

              <!-- Type -->
              <div>
                <p class="text-sm text-base-content/50">
                  Bay Type
                </p>

                <div class="mt-1 flex items-center gap-2">
                  <Icon
                    name="lucide:wrench"
                    class="size-4 text-base-content/50"
                  />

                  <p class="font-medium">
                    {{ bay.type }}
                  </p>
                </div>
              </div>

              <!-- Bay ID -->
              <div>
                <p class="text-sm text-base-content/50">
                  Bay ID
                </p>

                <p class="mt-1 font-medium">
                  #{{ bay.id }}
                </p>
              </div>

              <!-- Department ID -->
              <div>
                <p class="text-sm text-base-content/50">
                  Department ID
                </p>

                <p class="mt-1 font-medium">
                  {{ bay.department_id }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Card -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">
                Current Status
              </h2>

              <Icon
                name="lucide:activity"
                class="size-5 text-base-content/50"
              />
            </div>

            <div class="mt-6 flex flex-col items-center rounded-xl bg-base-200 p-6 text-center">
              <div
                class="flex size-16 items-center justify-center rounded-full"
                :class="
                  bay.is_active
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'
                "
              >
                <Icon
                  :name="
                    bay.is_active
                      ? 'lucide:check-circle-2'
                      : 'lucide:circle-off'
                  "
                  class="size-8"
                />
              </div>

              <h3 class="mt-4 text-lg font-bold">
                {{
                  bay.is_active
                    ? 'Active'
                    : 'Inactive'
                }}
              </h3>

              <p class="mt-1 text-sm text-base-content/60">
                {{
                  bay.is_active
                    ? 'This bay is available for workshop operations.'
                    : 'This bay is currently unavailable.'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Operational Information -->
      <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <div>
            <h2 class="text-lg font-semibold">
              Operational Information
            </h2>

            <p class="text-sm text-base-content/60">
              Basic information used by the workshop system.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="rounded-lg border border-base-300 bg-base-200 p-4">
              <div class="flex items-center gap-3">
                <Icon
                  name="lucide:warehouse"
                  class="size-5 text-primary"
                />

                <div>
                  <p class="text-xs text-base-content/50">
                    Bay
                  </p>

                  <p class="font-semibold">
                    {{ bay.name }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-base-300 bg-base-200 p-4">
              <div class="flex items-center gap-3">
                <Icon
                  name="lucide:hash"
                  class="size-5 text-primary"
                />

                <div>
                  <p class="text-xs text-base-content/50">
                    Code
                  </p>

                  <p class="font-semibold">
                    {{ bay.code }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-base-300 bg-base-200 p-4">
              <div class="flex items-center gap-3">
                <Icon
                  name="lucide:building-2"
                  class="size-5 text-primary"
                />

                <div>
                  <p class="text-xs text-base-content/50">
                    Department
                  </p>

                  <p class="font-semibold">
                    {{ bay.department?.name || '—' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Back -->
      <div class="mt-6">
        <NuxtLink
          to="/bays"
          class="btn btn-ghost"
        >
          <Icon
            name="lucide:arrow-left"
            class="size-4"
          />

          Back to Bays
        </NuxtLink>
      </div>
    </template>
  </div>
</template>