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
  email: string | null
  city: string | null
  state: string | null
  is_active: boolean
  vehicles_count: number
}

const api = useApi()
const router = useRouter()

const { hasPermission } = usePermissions()

const customers = ref<Customer[]>([])

const loading = ref(true)
const error = ref('')
const success = ref('')

const statusLoading = ref<number | null>(null)

const search = ref('')

const fetchCustomers = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api('/api/admin/customers')

    customers.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load customers.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

const filteredCustomers = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return customers.value
  }

  return customers.value.filter(customer => {
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.customer_code.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.city?.toLowerCase().includes(query)
    )
  })
})

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

const toggleStatus = async (customer: Customer) => {
  statusLoading.value = customer.id
  error.value = ''
  success.value = ''

  try {
    const response = await api(
      `/api/admin/customers/${customer.id}/status`,
      {
        method: 'PATCH',
        body: {
          is_active: !customer.is_active,
        },
      }
    )

    const updatedCustomer = response.data

    const index = customers.value.findIndex(
      item => item.id === customer.id
    )

    if (index !== -1) {
      customers.value[index] = {
        ...customers.value[index],
        ...updatedCustomer,
      }
    }

    success.value = updatedCustomer.is_active
      ? 'Customer activated successfully.'
      : 'Customer deactivated successfully.'
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to update customer status.'
  } finally {
    statusLoading.value = null
  }
}

/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const createCustomer = () => {
  router.push('/customers/create')
}

const viewCustomer = (customer: Customer) => {
  router.push(`/customers/${customer.id}`)
}

const editCustomer = (customer: Customer) => {
  router.push(`/customers/${customer.id}/edit`)
}

onMounted(() => {
  fetchCustomers()
})
</script>

<template>
  <div>
    <!-- Header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-base-content ">
          Customers
        </h1>

        <p class="mt-1 text-sm">
          Manage workshop customers and their vehicles.
        </p>
      </div>

      <button
        v-if="hasPermission('customers.create')"
        type="button"
        class="btn btn-primary"
        @click="createCustomer"
      >
        <Icon
          name="lucide:user-plus"
          class="size-5"
        />

        Add Customer
      </button>
    </header>

    <!-- Alerts -->
    <div
      v-if="success"
      role="alert"
      class="alert alert-success mt-6"
    >
      <Icon
        name="lucide:circle-check"
        class="size-5"
      />

      <span>{{ success }}</span>
    </div>
    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="alert alert-error mt-6"
    >
      <Icon
        name="lucide:circle-alert"
        class="size-5"
      />

      <span>{{ error }}</span>
    </div>

    <!-- Search -->
    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label class="input input-bordered flex w-full items-center gap-2 sm:max-w-md  ">
        <Icon
          name="lucide:search"
          class="size-4 text-white"
        />

        <input
          v-model="search"
          type="search"
          placeholder="Search customers..."
          class=""
        />
      </label>

      <div class="text-sm">
        {{ filteredCustomers.length }}
        {{ filteredCustomers.length === 1 ? 'customer' : 'customers' }}
      </div>
    </div>

    <!-- Table -->
    <div class="card mt-4 overflow-hidden border border-base-300 bg-base-100 shadow-sm ">
      <div class="overflow-x-auto">
        <table class="table border border-gray-300">
          <thead class="bg-gray-200">
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Vehicles</th>
              <th>Status</th>
              <th class="text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody class="">
            <!-- Loading -->
            <tr v-if="loading">
              <td
                colspan="6"
                class="py-16 text-center"
              >
                <span class="loading loading-spinner loading-lg" />

                <p class="mt-3 text-sm ">
                  Loading customers...
                </p>
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="filteredCustomers.length === 0">
              <td
                colspan="6"
                class="py-16 text-center"
              >
                <Icon
                  name="lucide:users"
                  class="mx-auto size-12 text-base-content/30"
                />

                <p class="mt-3 font-medium">
                  {{
                    search
                      ? 'No customers match your search.'
                      : 'No customers found.'
                  }}
                </p>

                <p
                  v-if="!search"
                  class="mt-1 text-sm "
                >
                  Create your first customer to get started.
                </p>
              </td>
            </tr>

            <!-- Customers -->
            <tr
              v-for="customer in filteredCustomers"
              v-else
              :key="customer.id"
              class=""
            >
              <!-- Customer -->
              <td>
                <div class="flex items-center gap-3">
                  <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon
                      name="lucide:user"
                      class="size-5 text-primary"
                    />
                  </div>

                  <div class="min-w-0">
                    <div class="font-semibold">
                      {{ customer.name }}
                    </div>

                    <div class="text-xs ">
                      {{ customer.customer_code }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Contact -->
              <td>
                <div class="space-y-1">
                  <div class="flex items-center gap-2 text-sm">
                    <Icon
                      name="lucide:phone"
                      class="size-3.5 "
                    />

                    {{ customer.phone }}
                  </div>

                  <div
                    v-if="customer.email"
                    class="flex items-center gap-2 text-xs"
                  >
                    <Icon
                      name="lucide:mail"
                      class="size-3.5 "
                    />

                    {{ customer.email }}
                  </div>
                </div>
              </td>

              <!-- Location -->
              <td>
                <div
                  v-if="customer.city || customer.state"
                  class="flex items-center gap-2"
                >
                  <Icon
                    name="lucide:map-pin"
                    class="size-4 "
                  />

                  <span class="">
                    {{
                      [customer.city, customer.state]
                        .filter(Boolean)
                        .join(', ')
                    }}
                  </span>
                </div>

                <span
                  v-else
                  class="text-base-content/40"
                >
                  —
                </span>
              </td>

              <!-- Vehicles -->
              <td>
                <div class="flex items-center gap-2">
                  <Icon
                    name="lucide:car-front"
                    class="size-4 "
                  />

                  <span class="font-medium">
                    {{ customer.vehicles_count }}
                  </span>
                </div>
              </td>

              <!-- Status -->
              <td>
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
              </td>

              <!-- Actions -->
              <td>
                <div class="flex justify-end gap-1">
                  <!-- View -->
                  <button
                    v-if="hasPermission('customers.view')"
                    type="button"
                    class="btn btn-ghost btn-sm "
                    title="View Customer"
                    @click="viewCustomer(customer)"
                  >
                    <Icon
                      name="lucide:eye"
                      class="size-4"
                    />
                  </button>

                  <!-- Edit -->
                  <button
                    v-if="hasPermission('customers.update')"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    title="Edit Customer"
                    @click="editCustomer(customer)"
                  >
                    <Icon
                      name="lucide:pencil"
                      class="size-4"
                    />
                  </button>

                  <!-- Status -->
                  <button
                    v-if="hasPermission('customers.status.update')"
                    type="button"
                    class="btn btn-ghost btn-sm text-red-600 border bg-red-100 border-red-300"
                    :disabled="statusLoading === customer.id"
                    :title="
                      customer.is_active
                        ? 'Deactivate'
                        : 'Activate'
                    "
                    @click="toggleStatus(customer)"
                  >
                    <span
                      v-if="statusLoading === customer.id"
                      class="loading loading-spinner loading-xs"
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
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>