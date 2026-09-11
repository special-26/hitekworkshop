<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

const api = useApi()
const router = useRouter()

const { hasPermission } = usePermissions()

const loading = ref(false)
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

const submit = async () => {
  loading.value = true
  error.value = ''
  validationErrors.value = {}

  try {
    await api('/api/admin/customers', {
      method: 'POST',
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
    })

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
      'Unable to create customer.'
  } finally {
    loading.value = false
  }
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]
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
            Create Customer
          </li>
        </ul>
      </div>

      <div class="mt-3">
        <h1 class="text-2xl font-bold text-base-content">
          Create Customer
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Add a new customer to the workshop system.
        </p>
      </div>
    </div>

    <!-- Permission -->
    <div
      v-if="!hasPermission('customers.create')"
      class="alert alert-error"
    >
      <Icon
        name="lucide:shield-alert"
        class="size-5"
      />

      <span>
        You do not have permission to create customers.
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
          <!-- Customer Information -->
          <div>
            <h2 class="text-lg font-semibold">
              Customer Information
            </h2>

            <p class="text-sm text-base-content/60">
              Basic contact information for the customer.
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

              <p
                v-if="fieldError('email')"
                class="label text-base-content/50"
              >
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
              Customer address and location details.
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

            <!-- State -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                State
              </legend>

              <select 
                class="select w-full"
                v-model="form.state"
              >
                <option disabled selected>-- Choose a State/UT --</option>
                <option v-for="state in indianStates" :key="state" :value="state">
                  {{ state }}
                </option>
              </select>

              <p
                v-if="fieldError('state')"
                class="label text-error"
              >
                {{ fieldError('state') }}
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

          <!-- Information -->
          <div class="alert mt-6 bg-base-200">
            <Icon
              name="lucide:info"
              class="size-5"
            />

            <span class="text-sm">
              Customer code will be generated automatically after creation.
            </span>
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
              :disabled="loading"
            >
              <span
                v-if="loading"
                class="loading loading-spinner loading-sm"
              />

              {{ loading ? 'Creating...' : 'Create Customer' }}
            </button>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>