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

const api = useApi()
const router = useRouter()

const { hasPermission } = usePermissions()

const vehicles = ref<Vehicle[]>([])

const loading = ref(true)
const error = ref('')
const success = ref('')

const statusLoading = ref<number | null>(null)

const search = ref('')

/*
|--------------------------------------------------------------------------
| Status Confirmation
|--------------------------------------------------------------------------
*/

const showStatusModal = ref(false)
const selectedVehicle = ref<Vehicle | null>(null)

/*
|--------------------------------------------------------------------------
| Fetch Vehicles
|--------------------------------------------------------------------------
*/

const fetchVehicles = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api('/api/admin/vehicles')

    vehicles.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load vehicles.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

const filteredVehicles = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return vehicles.value
  }

  return vehicles.value.filter(vehicle => {
    return (
      vehicle.registration_number
        .toLowerCase()
        .includes(query) ||

      vehicle.make
        .toLowerCase()
        .includes(query) ||

      vehicle.model
        .toLowerCase()
        .includes(query) ||

      vehicle.variant
        ?.toLowerCase()
        .includes(query) ||

      vehicle.customer?.name
        ?.toLowerCase()
        .includes(query) ||

      vehicle.customer?.customer_code
        ?.toLowerCase()
        .includes(query) ||

      vehicle.customer?.phone
        ?.toLowerCase()
        .includes(query)
    )
  })
})

/*
|--------------------------------------------------------------------------
| Open Status Confirmation
|--------------------------------------------------------------------------
*/

const confirmStatusChange = (vehicle: Vehicle) => {
  selectedVehicle.value = vehicle
  showStatusModal.value = true
}

/*
|--------------------------------------------------------------------------
| Close Status Confirmation
|--------------------------------------------------------------------------
*/

const closeStatusModal = () => {
  if (statusLoading.value !== null) {
    return
  }

  showStatusModal.value = false
  selectedVehicle.value = null
}

/*
|--------------------------------------------------------------------------
| Update Status
|--------------------------------------------------------------------------
*/

const toggleStatus = async () => {
  if (!selectedVehicle.value) {
    return
  }

  const vehicle = selectedVehicle.value

  statusLoading.value = vehicle.id
  error.value = ''
  success.value = ''

  try {
    const response = await api(
      `/api/admin/vehicles/${vehicle.id}/status`,
      {
        method: 'PATCH',

        body: {
          is_active: !vehicle.is_active,
        },
      }
    )

    const updatedVehicle = response.data

    const index = vehicles.value.findIndex(
      item => item.id === vehicle.id
    )

    if (index !== -1) {
      vehicles.value[index] = {
        ...vehicles.value[index],
        ...updatedVehicle,
      }
    }

    success.value = updatedVehicle.is_active
      ? 'Vehicle activated successfully.'
      : 'Vehicle deactivated successfully.'

    showStatusModal.value = false
    selectedVehicle.value = null
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update vehicle status.'
  } finally {
    statusLoading.value = null
  }
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const createVehicle = () => {
  router.push('/vehicles/create')
}

const viewVehicle = (vehicle: Vehicle) => {
  router.push(`/vehicles/${vehicle.id}`)
}

const editVehicle = (vehicle: Vehicle) => {
  router.push(`/vehicles/${vehicle.id}/edit`)
}

/*
|--------------------------------------------------------------------------
| Format
|--------------------------------------------------------------------------
*/

const formatOdometer = (value: number | null) => {
  if (value === null || value === undefined) {
    return '—'
  }

  return `${value.toLocaleString('en-IN')} km`
}

onMounted(() => {
  fetchVehicles()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-base-content">
          Vehicles
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Manage customer vehicles and vehicle information.
        </p>
      </div>

      <button
        v-if="hasPermission('vehicles.create')"
        type="button"
        class="btn btn-primary"
        @click="createVehicle"
      >
        <Icon
          name="lucide:car-front"
          class="size-5"
        />

        Add Vehicle
      </button>
    </div>

    <!-- Success -->
    <div
      v-if="success"
      class="alert alert-success mt-6"
    >
      <Icon
        name="lucide:circle-check"
        class="size-5"
      />

      <span>{{ success }}</span>

      <button
        type="button"
        class="btn btn-ghost btn-xs ml-auto"
        @click="success = ''"
      >
        <Icon
          name="lucide:x"
          class="size-4"
        />
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

      <button
        type="button"
        class="btn btn-ghost btn-xs ml-auto"
        @click="error = ''"
      >
        <Icon
          name="lucide:x"
          class="size-4"
        />
      </button>
    </div>

    <!-- Search -->
    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label class="input input-bordered flex w-full items-center gap-2 sm:max-w-md">
        <Icon
          name="lucide:search"
          class="size-4 text-base-content/50"
        />

        <input
          v-model="search"
          type="search"
          placeholder="Search registration, car, customer..."
        />

        <button
          v-if="search"
          type="button"
          class="btn btn-ghost btn-xs"
          @click="search = ''"
        >
          <Icon
            name="lucide:x"
            class="size-4"
          />
        </button>
      </label>

      <div class="text-sm text-base-content/50">
        {{ filteredVehicles.length }}

        {{
          filteredVehicles.length === 1
            ? 'vehicle'
            : 'vehicles'
        }}
      </div>
    </div>

    <!-- Table -->
    <div class="card mt-4 overflow-hidden border border-base-300 bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Registration</th>
              <th>Customer</th>
              <th>Fuel</th>
              <th>Odometer</th>
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
                colspan="7"
                class="py-16 text-center"
              >
                <span class="loading loading-spinner loading-lg" />

                <p class="mt-3 text-sm text-base-content/60">
                  Loading vehicles...
                </p>
              </td>
            </tr>

            <!-- Empty -->
            <tr
              v-else-if="filteredVehicles.length === 0"
            >
              <td
                colspan="7"
                class="py-16 text-center"
              >
                <Icon
                  name="lucide:car-front"
                  class="mx-auto size-12 text-base-content/30"
                />

                <p class="mt-3 font-medium">
                  {{
                    search
                      ? 'No vehicles match your search.'
                      : 'No vehicles found.'
                  }}
                </p>

                <p
                  v-if="!search"
                  class="mt-1 text-sm text-base-content/60"
                >
                  Add your first vehicle to get started.
                </p>
              </td>
            </tr>

            <!-- Vehicles -->
            <tr
              v-for="vehicle in filteredVehicles"
              v-else
              :key="vehicle.id"
            >
              <!-- Vehicle -->
              <td>
                <div class="flex items-center gap-3">
                  <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon
                      name="lucide:car-front"
                      class="size-5 text-primary"
                    />
                  </div>

                  <div class="min-w-0">
                    <div class="font-semibold">
                      {{ vehicle.make }} {{ vehicle.model }}
                    </div>

                    <div
                      v-if="vehicle.variant"
                      class="text-xs text-base-content/50"
                    >
                      {{ vehicle.variant }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Registration -->
              <td>
                <code class="rounded bg-base-200 px-2 py-1 text-sm font-semibold">
                  {{ vehicle.registration_number }}
                </code>
              </td>

              <!-- Customer -->
              <td>
                <div
                  v-if="vehicle.customer"
                  class="min-w-32"
                >
                  <p class="font-medium">
                    {{ vehicle.customer.name }}
                  </p>

                  <p class="text-xs text-base-content/50">
                    {{ vehicle.customer.customer_code }}
                  </p>
                </div>

                <span
                  v-else
                  class="text-base-content/40"
                >
                  —
                </span>
              </td>

              <!-- Fuel -->
              <td>
                {{ vehicle.fuel_type || '—' }}
              </td>

              <!-- Odometer -->
              <td>
                {{ formatOdometer(vehicle.current_odometer) }}
              </td>

              <!-- Status -->
              <td>
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
              </td>

              <!-- Actions -->
              <td>
                <div class="flex justify-end gap-1">
                  <!-- View -->
                  <button
                    v-if="hasPermission('vehicles.view')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    title="View Vehicle"
                    @click="viewVehicle(vehicle)"
                  >
                    <Icon
                      name="lucide:eye"
                      class="size-4"
                    />
                  </button>

                  <!-- Edit -->
                  <button
                    v-if="hasPermission('vehicles.update')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    title="Edit Vehicle"
                    @click="editVehicle(vehicle)"
                  >
                    <Icon
                      name="lucide:pencil"
                      class="size-4"
                    />
                  </button>

                  <!-- Status -->
                  <button
                    v-if="hasPermission('vehicles.status.update')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    :title="
                      vehicle.is_active
                        ? 'Deactivate'
                        : 'Activate'
                    "
                    @click="confirmStatusChange(vehicle)"
                  >
                    <Icon
                      :name="
                        vehicle.is_active
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

    <!-- Status Confirmation Modal -->
    <dialog
      class="modal"
      :class="{ 'modal-open': showStatusModal }"
    >
      <div class="modal-box border border-base-300 bg-base-100">
        <div class="flex items-start gap-4">
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-full"
            :class="
              selectedVehicle?.is_active
                ? 'bg-error/10 text-error'
                : 'bg-success/10 text-success'
            "
          >
            <Icon
              :name="
                selectedVehicle?.is_active
                  ? 'lucide:power-off'
                  : 'lucide:power'
              "
              class="size-6"
            />
          </div>

          <div>
            <h3 class="text-lg font-bold">
              {{
                selectedVehicle?.is_active
                  ? 'Deactivate Vehicle'
                  : 'Activate Vehicle'
              }}
            </h3>

            <p class="mt-2 text-sm text-base-content/60">
              Are you sure you want to
              {{
                selectedVehicle?.is_active
                  ? 'deactivate'
                  : 'activate'
              }}
              this vehicle?
            </p>
          </div>
        </div>

        <!-- Vehicle Info -->
        <div
          v-if="selectedVehicle"
          class="mt-5 rounded-lg border border-base-300 bg-base-200 p-4"
        >
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon
                name="lucide:car-front"
                class="size-5 text-primary"
              />
            </div>

            <div>
              <p class="font-semibold">
                {{ selectedVehicle.make }}
                {{ selectedVehicle.model }}
              </p>

              <code class="text-sm text-base-content/60">
                {{ selectedVehicle.registration_number }}
              </code>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="statusLoading !== null"
            @click="closeStatusModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn"
            :class="
              selectedVehicle?.is_active
                ? 'btn-error'
                : 'btn-success'
            "
            :disabled="statusLoading !== null"
            @click="toggleStatus"
          >
            <span
              v-if="statusLoading !== null"
              class="loading loading-spinner loading-sm"
            />

            <Icon
              v-else
              :name="
                selectedVehicle?.is_active
                  ? 'lucide:power-off'
                  : 'lucide:power'
              "
              class="size-4"
            />

            {{
              selectedVehicle?.is_active
                ? 'Deactivate'
                : 'Activate'
            }}
          </button>
        </div>
      </div>

      <!-- Modal backdrop -->
      <form
        method="dialog"
        class="modal-backdrop"
        @click="closeStatusModal"
      >
        <button type="button">
          close
        </button>
      </form>
    </dialog>
  </div>
</template>
