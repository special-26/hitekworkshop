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
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  date_of_birth: string | null
  is_active: boolean
}

const route = useRoute()
const router = useRouter()
const api = useApi()

const { hasPermission } = usePermissions()

const customerId = route.params.id as string

const customer = ref<Customer | null>(null)

const loading = ref(true)
const saving = ref(false)

const error = ref('')
const validationErrors = ref<Record<string, string[]>>({})

const form = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  date_of_birth: '',
})

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

/*
|--------------------------------------------------------------------------
| Fetch Customer
|--------------------------------------------------------------------------
*/

const fetchCustomer = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/customers/${customerId}`
    )

    customer.value = response.data

    form.name = response.data.name || ''
    form.phone = response.data.phone || ''
    form.email = response.data.email || ''
    form.address = response.data.address || ''
    form.city = response.data.city || ''
    form.state = response.data.state || ''
    form.pincode = response.data.pincode || ''

    form.date_of_birth = response.data.date_of_birth
      ? String(response.data.date_of_birth).substring(0, 10)
      : ''
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
| Update Customer
|--------------------------------------------------------------------------
*/

const submit = async () => {
  saving.value = true
  error.value = ''
  validationErrors.value = {}

  try {
    await api(
      `/api/admin/customers/${customerId}`,
      {
        method: 'PUT',

        body: {
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          pincode: form.pincode || null,
          date_of_birth: form.date_of_birth || null,
        },
      }
    )

    await router.push('/customers')
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
      'Unable to update customer.'
  } finally {
    saving.value = false
  }
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
            Edit Customer
          </li>
        </ul>
      </div>

      <div class="mt-3">
        <h1 class="text-2xl font-bold text-base-content">
          Edit Customer
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Update customer information.
        </p>
      </div>
    </div>

    <!-- Permission -->
    <div
      v-if="!hasPermission('customers.update')"
      class="alert alert-error"
    >
      <Icon
        name="lucide:shield-alert"
        class="size-5"
      />

      <span>
        You do not have permission to update customers.
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
            Loading customer...
          </p>
        </div>
      </div>

      <!-- Form -->
      <form
        v-else-if="customer"
        class="card border border-base-300 bg-base-100 shadow-sm"
        @submit.prevent="submit"
      >
        <div class="card-body">
          <!-- Customer Information -->
          <div>
            <div class="flex flex-wrap items-center gap-3">
              <h2 class="text-lg font-semibold">
                Customer Information
              </h2>

              <code class="rounded bg-base-200 px-2 py-1 text-xs">
                {{ customer.customer_code }}
              </code>
            </div>

            <p class="text-sm text-base-content/60">
              Update the customer's contact information.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- Name -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Full Name
              </legend>

              <input
                v-model="form.name"
                type="text"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('name'),
                }"
                placeholder="Customer name"
              />

              <p
                v-if="fieldError('name')"
                class="label text-error"
              >
                {{ fieldError('name') }}
              </p>
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
                :class="{
                  'input-error': fieldError('phone'),
                }"
                placeholder="9876543210"
              />

              <p
                v-if="fieldError('phone')"
                class="label text-error"
              >
                {{ fieldError('phone') }}
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
                :class="{
                  'input-error': fieldError('email'),
                }"
                placeholder="customer@example.com"
              />

              <p class="label text-base-content/50">
                Optional
              </p>

              <p
                v-if="fieldError('email')"
                class="label text-error"
              >
                {{ fieldError('email') }}
              </p>
            </fieldset>

            <!-- Date of Birth -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Date of Birth
              </legend>

              <input
                v-model="form.date_of_birth"
                type="date"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('date_of_birth'),
                }"
              />

              <p
                v-if="fieldError('date_of_birth')"
                class="label text-error"
              >
                {{ fieldError('date_of_birth') }}
              </p>
            </fieldset>
          </div>

          <div class="divider" />

          <!-- Address -->
          <div>
            <h2 class="text-lg font-semibold">
              Address Information
            </h2>

            <p class="text-sm text-base-content/60">
              Update customer address and location details.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- Address -->
            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend">
                Address
              </legend>

              <textarea
                v-model="form.address"
                class="textarea textarea-bordered min-h-24 w-full"
                :class="{
                  'textarea-error': fieldError('address'),
                }"
                placeholder="House / Street / Area"
              />

              <p
                v-if="fieldError('address')"
                class="label text-error"
              >
                {{ fieldError('address') }}
              </p>
            </fieldset>

            <!-- City -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                City
              </legend>

              <input
                v-model="form.city"
                type="text"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('city'),
                }"
                placeholder="Chandigarh"
              />

              <p
                v-if="fieldError('city')"
                class="label text-error"
              >
                {{ fieldError('city') }}
              </p>
            </fieldset>

            <!-- State -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                State
              </legend>

              <input
                v-model="form.state"
                type="text"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('state'),
                }"
                placeholder="Punjab"
              />

              <p
                v-if="fieldError('state')"
                class="label text-error"
              >
                {{ fieldError('state') }}
              </p>
            </fieldset>

            <!-- Pincode -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Pincode
              </legend>

              <input
                v-model="form.pincode"
                type="text"
                inputmode="numeric"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('pincode'),
                }"
                placeholder="160017"
              />

              <p
                v-if="fieldError('pincode')"
                class="label text-error"
              >
                {{ fieldError('pincode') }}
              </p>
            </fieldset>
          </div>

          <!-- Status Information -->
          <div class="mt-6 rounded-lg border border-base-300 bg-base-200 p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-medium">
                  Customer Status
                </p>

                <p class="text-sm text-base-content/60">
                  Customer activation is managed separately.
                </p>
              </div>

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

          <!-- Actions -->
          <div class="mt-8 flex flex-col-reverse gap-3 border-t border-base-300 pt-6 sm:flex-row sm:justify-end">
            <NuxtLink
              to="/customers"
              class="btn btn-ghost"
            >
              Cancel
            </NuxtLink>

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="saving"
            >
              <span
                v-if="saving"
                class="loading loading-spinner loading-sm"
              />

              {{ saving ? 'Updating...' : 'Update Customer' }}
            </button>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>