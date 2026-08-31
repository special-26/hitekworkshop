
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
  vin: string | null
  engine_number: string | null
  current_odometer: number | null
  is_active: boolean
  customer?: Customer
}

const route = useRoute()
const router = useRouter()
const api = useApi()

const { hasPermission } = usePermissions()

const vehicleId = route.params.id as string

const vehicle = ref<Vehicle | null>(null)

const loading = ref(true)
const error = ref('')

const statusLoading = ref(false)

/*
|--------------------------------------------------------------------------
| Fetch Vehicle
|--------------------------------------------------------------------------
*/

const fetchVehicle = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/vehicles/${vehicleId}`
    )

    vehicle.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load vehicle.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Toggle Status
|--------------------------------------------------------------------------
*/

const toggleStatus = async () => {
  if (!vehicle.value) {
    return
  }

  statusLoading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/vehicles/${vehicle.value.id}/status`,
      {
        method: 'PATCH',

        body: {
          is_active: !vehicle.value.is_active,
        },
      }
    )

    vehicle.value = {
      ...vehicle.value,
      ...response.data,
    }
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update vehicle status.'
  } finally {
    statusLoading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const editVehicle = () => {
  if (!vehicle.value) {
    return
  }

  router.push(
    `/vehicles/${vehicle.value.id}/edit`
  )
}

const viewCustomer = () => {
  if (!vehicle.value?.customer) {
    return
  }

  router.push(
    `/customers/${vehicle.value.customer.id}`
  )
}

/*
|--------------------------------------------------------------------------
| Formatting
|--------------------------------------------------------------------------
*/

const formatOdometer = (
  value: number | null
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return '—'
  }

  return `${value.toLocaleString('en-IN')} km`
}

onMounted(() => {
  fetchVehicle()
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
              to="/vehicles"
              class="hover:text-primary"
            >
              Vehicles
            </NuxtLink>
          </li>

          <li>
            Vehicle Details
          </li>
        </ul>
      </div>

      <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">
            Vehicle Details
          </h1>

          <p class="mt-1 text-sm text-base-content/60">
            View vehicle and customer information.
          </p>
        </div>

        <div
          v-if="vehicle"
          class="flex flex-wrap gap-2"
        >
          <!-- Edit -->
          <button
            v-if="hasPermission('vehicles.update')"
            type="button"
            class="btn btn-outline"
            @click="editVehicle"
          >
            <Icon
              name="lucide:pencil"
              class="size-4"
            />

            Edit
          </button>

          <!-- Status -->
          <button
            v-if="hasPermission('vehicles.status.update')"
            type="button"
            class="btn"
            :class="
              vehicle.is_active
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
                vehicle.is_active
                  ? 'lucide:power-off'
                  : 'lucide:power'
              "
              class="size-4"
            />

            {{
              vehicle.is_active
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
          Loading vehicle details...
        </p>
      </div>
    </div>

    <!-- Vehicle -->
    <template v-else-if="vehicle">
      <!-- Overview -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Vehicle Information -->
        <div class="card border border-base-300 bg-base-100 shadow-sm lg:col-span-2">
          <div class="card-body">
            <!-- Vehicle Header -->
            <div class="flex items-start gap-4">
              <div class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon
                  name="lucide:car-front"
                  class="size-7 text-primary"
                />
              </div>

              <div class="min-w-0">
                <h2 class="text-xl font-bold">
                  {{ vehicle.make }} {{ vehicle.model }}
                </h2>

                <p
                  v-if="vehicle.variant"
                  class="mt-1 text-sm text-base-content/60"
                >
                  {{ vehicle.variant }}
                </p>

                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <code class="rounded bg-base-200 px-3 py-1 text-sm font-semibold">
                    {{ vehicle.registration_number }}
                  </code>

                  <span
                    class="badge"
                    :class="
                      vehicle.is_active
                        ? 'badge-success'
                        : 'badge-error'
                    "
                  >
                    {{
                      vehicle.is_active
                        ? 'Active'
                        : 'Inactive'
                    }}
                  </span>
                </div>
              </div>
            </div>

            <div class="divider" />

            <!-- Details -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p class="text-sm text-base-content/50">
                  Make
                </p>

                <p class="mt-1 font-medium">
                  {{ vehicle.make }}
                </p>
              </div>

              <div>
                <p class="text-sm text-base-content/50">
                  Model
                </p>

                <p class="mt-1 font-medium">
                  {{ vehicle.model }}
                </p>
              </div>

              <div>
                <p class="text-sm text-base-content/50">
                  Variant
                </p>

                <p class="mt-1 font-medium">
                  {{ vehicle.variant || '—' }}
                </p>
              </div>

              <div>
                <p class="text-sm text-base-content/50">
                  Fuel Type
                </p>

                <p class="mt-1 font-medium">
                  {{ vehicle.fuel_type || '—' }}
                </p>
              </div>

              <div>
                <p class="text-sm text-base-content/50">
                  Manufacturing Year
                </p>

                <p class="mt-1 font-medium">
                  {{ vehicle.manufacturing_year || '—' }}
                </p>
              </div>

              <div>
                <p class="text-sm text-base-content/50">
                  Color
                </p>

                <p class="mt-1 font-medium">
                  {{ vehicle.color || '—' }}
                </p>
              </div>

              <div>
                <p class="text-sm text-base-content/50">
                  Current Odometer
                </p>

                <p class="mt-1 flex items-center gap-2 font-medium">
                  <Icon
                    name="lucide:gauge"
                    class="size-4 text-base-content/50"
                  />

                  {{ formatOdometer(vehicle.current_odometer) }}
                </p>
              </div>

              <div>
                <p class="text-sm text-base-content/50">
                  Vehicle ID
                </p>

                <p class="mt-1 font-medium">
                  #{{ vehicle.id }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">
                Vehicle Status
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
                  vehicle.is_active
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'
                "
              >
                <Icon
                  :name="
                    vehicle.is_active
                      ? 'lucide:check-circle-2'
                      : 'lucide:circle-off'
                  "
                  class="size-8"
                />
              </div>

              <h3 class="mt-4 text-lg font-bold">
                {{
                  vehicle.is_active
                    ? 'Active'
                    : 'Inactive'
                }}
              </h3>

              <p class="mt-1 text-sm text-base-content/60">
                {{
                  vehicle.is_active
                    ? 'This vehicle is active in the workshop system.'
                    : 'This vehicle is currently inactive.'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Identification -->
      <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <div>
            <h2 class="text-lg font-semibold">
              Vehicle Identification
            </h2>

            <p class="text-sm text-base-content/60">
              Vehicle identification and registration information.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- VIN -->
            <div class="rounded-lg border border-base-300 bg-base-200 p-4">
              <p class="text-xs text-base-content/50">
                VIN / Chassis Number
              </p>

              <p class="mt-1 break-all font-mono text-sm">
                {{ vehicle.vin || 'Not provided' }}
              </p>
            </div>

            <!-- Engine Number -->
            <div class="rounded-lg border border-base-300 bg-base-200 p-4">
              <p class="text-xs text-base-content/50">
                Engine Number
              </p>

              <p class="mt-1 break-all font-mono text-sm">
                {{ vehicle.engine_number || 'Not provided' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer -->
      <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold">
                Customer
              </h2>

              <p class="text-sm text-base-content/60">
                Owner of this vehicle.
              </p>
            </div>

            <button
              v-if="vehicle.customer"
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
            v-if="vehicle.customer"
            class="mt-5 rounded-lg border border-base-300 bg-base-200 p-5"
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
                  {{ vehicle.customer.name }}
                </p>

                <div class="mt-1 flex flex-wrap items-center gap-3 text-sm text-base-content/60">
                  <span>
                    {{ vehicle.customer.customer_code }}
                  </span>

                  <span>
                    {{ vehicle.customer.phone }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="mt-5 rounded-lg border border-base-300 bg-base-200 p-5 text-sm text-base-content/60"
          >
            Customer information is not available.
          </div>
        </div>
      </div>

      <!-- Back -->
      <div class="mt-6">
        <NuxtLink
          to="/vehicles"
          class="btn btn-ghost"
        >
          <Icon
            name="lucide:arrow-left"
            class="size-4"
          />

          Back to Vehicles
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
