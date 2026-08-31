<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

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
}

interface Customer {
  id: number
  customer_code: string
  name: string
  phone: string
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  date_of_birth: string | null
  is_active: boolean
  vehicles: Vehicle[]
}

const route = useRoute()
const router = useRouter()
const api = useApi()

const { hasPermission } = usePermissions()

const customerId = route.params.id as string

const customer = ref<Customer | null>(null)

const loading = ref(true)
const error = ref('')

const statusLoading = ref(false)

const fetchCustomer = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/customers/${customerId}`
    )

    customer.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load customer.'
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
  if (!customer.value) {
    return
  }

  statusLoading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/customers/${customer.value.id}/status`,
      {
        method: 'PATCH',
        body: {
          is_active: !customer.value.is_active,
        },
      }
    )

    customer.value = {
      ...customer.value,
      ...response.data,
    }
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update customer status.'
  } finally {
    statusLoading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const editCustomer = () => {
  if (!customer.value) {
    return
  }

  router.push(
    `/customers/${customer.value.id}/edit`
  )
}

const viewVehicle = (vehicle: Vehicle) => {
  router.push(`/vehicles/${vehicle.id}`)
}

const formatDate = (date: string | null) => {
  if (!date) {
    return '—'
  }

  return new Date(date).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}

const formatOdometer = (value: number | null) => {
  if (value === null || value === undefined) {
    return '—'
  }

  return `${value.toLocaleString('en-IN')} km`
}

onMounted(() => {
  fetchCustomer()
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
              to="/customers"
              class="hover:text-primary"
            >
              Customers
            </NuxtLink>
          </li>

          <li>
            Customer Details
          </li>
        </ul>
      </div>

      <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">
            Customer Details
          </h1>

          <p class="mt-1 text-sm text-base-content/60">
            View customer information and vehicles.
          </p>
        </div>

        <div
          v-if="customer"
          class="flex flex-wrap gap-2"
        >
          <!-- Edit -->
          <button
            v-if="hasPermission('customers.update')"
            type="button"
            class="btn btn-outline"
            @click="editCustomer"
          >
            <Icon
              name="lucide:pencil"
              class="size-4"
            />

            Edit
          </button>

          <!-- Status -->
          <button
            v-if="hasPermission('customers.status.update')"
            type="button"
            class="btn"
            :class="
              customer.is_active
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
                customer.is_active
                  ? 'lucide:power-off'
                  : 'lucide:power'
              "
              class="size-4"
            />

            {{
              customer.is_active
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
          Loading customer details...
        </p>
      </div>
    </div>

    <template v-else-if="customer">
      <!-- Customer Overview -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Profile -->
        <div class="card border border-base-300 bg-base-100 shadow-sm lg:col-span-2">
          <div class="card-body">
            <div class="flex items-start gap-4">
              <div class="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon
                  name="lucide:user"
                  class="size-7 text-primary"
                />
              </div>

              <div class="min-w-0">
                <h2 class="text-xl font-bold">
                  {{ customer.name }}
                </h2>

                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <code class="rounded bg-base-200 px-2 py-1 text-sm">
                    {{ customer.customer_code }}
                  </code>

                  <span
                    class="badge"
                    :class="
                      customer.is_active
                        ? 'badge-success'
                        : 'badge-error'
                    "
                  >
                    {{
                      customer.is_active
                        ? 'Active'
                        : 'Inactive'
                    }}
                  </span>
                </div>
              </div>
            </div>

            <div class="divider" />

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <!-- Phone -->
              <div>
                <p class="text-sm text-base-content/50">
                  Phone
                </p>

                <div class="mt-1 flex items-center gap-2">
                  <Icon
                    name="lucide:phone"
                    class="size-4 text-base-content/50"
                  />

                  <p class="font-medium">
                    {{ customer.phone }}
                  </p>
                </div>
              </div>

              <!-- Email -->
              <div>
                <p class="text-sm text-base-content/50">
                  Email
                </p>

                <div class="mt-1 flex items-center gap-2">
                  <Icon
                    name="lucide:mail"
                    class="size-4 text-base-content/50"
                  />

                  <p class="font-medium">
                    {{ customer.email || '—' }}
                  </p>
                </div>
              </div>

              <!-- Date of Birth -->
              <div>
                <p class="text-sm text-base-content/50">
                  Date of Birth
                </p>

                <div class="mt-1 flex items-center gap-2">
                  <Icon
                    name="lucide:cake"
                    class="size-4 text-base-content/50"
                  />

                  <p class="font-medium">
                    {{ formatDate(customer.date_of_birth) }}
                  </p>
                </div>
              </div>

              <!-- Customer ID -->
              <div>
                <p class="text-sm text-base-content/50">
                  Customer ID
                </p>

                <p class="mt-1 font-medium">
                  #{{ customer.id }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Status -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">
                Customer Status
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
                  customer.is_active
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'
                "
              >
                <Icon
                  :name="
                    customer.is_active
                      ? 'lucide:check-circle-2'
                      : 'lucide:circle-off'
                  "
                  class="size-8"
                />
              </div>

              <h3 class="mt-4 text-lg font-bold">
                {{
                  customer.is_active
                    ? 'Active'
                    : 'Inactive'
                }}
              </h3>

              <p class="mt-1 text-sm text-base-content/60">
                {{
                  customer.is_active
                    ? 'Customer is active in the workshop system.'
                    : 'Customer is currently inactive.'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Address -->
      <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body">
          <div>
            <h2 class="text-lg font-semibold">
              Address
            </h2>

            <p class="text-sm text-base-content/60">
              Customer address information.
            </p>
          </div>

          <div class="mt-4 rounded-lg border border-base-300 bg-base-200 p-4">
            <div class="flex items-start gap-3">
              <Icon
                name="lucide:map-pin"
                class="mt-0.5 size-5 shrink-0 text-primary"
              />

              <div>
                <p class="font-medium">
                  {{ customer.address || 'Address not provided' }}
                </p>

                <p
                  v-if="
                    customer.city ||
                    customer.state ||
                    customer.pincode
                  "
                  class="mt-1 text-sm text-base-content/60"
                >
                  {{
                    [
                      customer.city,
                      customer.state,
                      customer.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vehicles -->
      <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
        <div class="card-body p-0">
          <div class="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold">
                Vehicles
              </h2>

              <p class="text-sm text-base-content/60">
                Vehicles registered under this customer.
              </p>
            </div>

            <div class="badge badge-neutral">
              {{ customer.vehicles.length }}
              {{
                customer.vehicles.length === 1
                  ? 'Vehicle'
                  : 'Vehicles'
              }}
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Registration</th>
                  <th>Fuel</th>
                  <th>Year</th>
                  <th>Odometer</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                <!-- No Vehicles -->
                <tr
                  v-if="customer.vehicles.length === 0"
                >
                  <td
                    colspan="7"
                    class="py-12 text-center"
                  >
                    <Icon
                      name="lucide:car-front"
                      class="mx-auto size-10 text-base-content/30"
                    />

                    <p class="mt-3 font-medium">
                      No vehicles registered
                    </p>

                    <p class="mt-1 text-sm text-base-content/60">
                      Vehicles added for this customer will appear here.
                    </p>
                  </td>
                </tr>

                <!-- Vehicles -->
                <tr
                  v-for="vehicle in customer.vehicles"
                  v-else
                  :key="vehicle.id"
                >
                  <!-- Vehicle -->
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                        <Icon
                          name="lucide:car-front"
                          class="size-4 text-primary"
                        />
                      </div>

                      <div>
                        <p class="font-semibold">
                          {{ vehicle.make }} {{ vehicle.model }}
                        </p>

                        <p
                          v-if="vehicle.variant"
                          class="text-xs text-base-content/50"
                        >
                          {{ vehicle.variant }}
                        </p>
                      </div>
                    </div>
                  </td>

                  <!-- Registration -->
                  <td>
                    <code class="rounded bg-base-200 px-2 py-1 text-sm font-semibold">
                      {{ vehicle.registration_number }}
                    </code>
                  </td>

                  <!-- Fuel -->
                  <td>
                    {{ vehicle.fuel_type || '—' }}
                  </td>

                  <!-- Year -->
                  <td>
                    {{ vehicle.manufacturing_year || '—' }}
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

                  <!-- Action -->
                  <td class="text-right">
                    <button
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
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Back -->
      <div class="mt-6">
        <NuxtLink
          to="/customers"
          class="btn btn-ghost"
        >
          <Icon
            name="lucide:arrow-left"
            class="size-4"
          />

          Back to Customers
        </NuxtLink>
      </div>
    </template>
  </div>
</template>