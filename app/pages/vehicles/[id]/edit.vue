
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

const customers = ref<Customer[]>([])

const loading = ref(true)
const saving = ref(false)
const loadingCustomers = ref(true)

const error = ref('')
const validationErrors = ref<Record<string, string[]>>({})

const form = reactive({
  customer_id: '',
  registration_number: '',
  make: '',
  model: '',
  variant: '',
  fuel_type: '',
  manufacturing_year: '',
  color: '',
  vin: '',
  engine_number: '',
  current_odometer: '',
})

/*
|--------------------------------------------------------------------------
| Validation Error
|--------------------------------------------------------------------------
*/

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

/*
|--------------------------------------------------------------------------
| Fetch Customers
|--------------------------------------------------------------------------
*/

const fetchCustomers = async () => {
  loadingCustomers.value = true

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
    loadingCustomers.value = false
  }
}

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

    form.customer_id = String(
      response.data.customer_id ?? ''
    )

    form.registration_number =
      response.data.registration_number ?? ''

    form.make =
      response.data.make ?? ''

    form.model =
      response.data.model ?? ''

    form.variant =
      response.data.variant ?? ''

    form.fuel_type =
      response.data.fuel_type ?? ''

    form.manufacturing_year =
      response.data.manufacturing_year
        ? String(response.data.manufacturing_year)
        : ''

    form.color =
      response.data.color ?? ''

    form.vin =
      response.data.vin ?? ''

    form.engine_number =
      response.data.engine_number ?? ''

    form.current_odometer =
      response.data.current_odometer !== null &&
      response.data.current_odometer !== undefined
        ? String(response.data.current_odometer)
        : ''
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
| Submit
|--------------------------------------------------------------------------
*/

const submit = async () => {
  saving.value = true
  error.value = ''
  validationErrors.value = {}

  try {
    await api(
      `/api/admin/vehicles/${vehicleId}`,
      {
        method: 'PUT',

        body: {
          customer_id: form.customer_id
            ? Number(form.customer_id)
            : null,

          registration_number:
            form.registration_number
              ? form.registration_number.toUpperCase()
              : '',

          make: form.make,

          model: form.model,

          variant:
            form.variant || null,

          fuel_type:
            form.fuel_type || null,

          manufacturing_year:
            form.manufacturing_year
              ? Number(form.manufacturing_year)
              : null,

          color:
            form.color || null,

          vin:
            form.vin
              ? form.vin.toUpperCase()
              : null,

          engine_number:
            form.engine_number
              ? form.engine_number.toUpperCase()
              : null,

          current_odometer:
            form.current_odometer
              ? Number(form.current_odometer)
              : null,
        },
      }
    )

    await router.push(`/vehicles/${vehicleId}`)
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
      'Unable to update vehicle.'
  } finally {
    saving.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Cancel
|--------------------------------------------------------------------------
*/

const cancel = () => {
  router.push(`/vehicles/${vehicleId}`)
}

onMounted(async () => {
  await Promise.all([
    fetchVehicle(),
    fetchCustomers(),
  ])
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
            <NuxtLink
              :to="`/vehicles/${vehicleId}`"
              class="hover:text-primary"
            >
              Vehicle Details
            </NuxtLink>
          </li>

          <li>
            Edit Vehicle
          </li>
        </ul>
      </div>

      <div class="mt-3">
        <h1 class="text-2xl font-bold text-base-content">
          Edit Vehicle
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Update vehicle and customer information.
        </p>
      </div>
    </div>

    <!-- Permission -->
    <div
      v-if="!hasPermission('vehicles.update')"
      class="alert alert-error"
    >
      <Icon
        name="lucide:shield-alert"
        class="size-5"
      />

      <span>
        You do not have permission to update vehicles.
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
        v-if="loading || loadingCustomers"
        class="card border border-base-300 bg-base-100 shadow-sm"
      >
        <div class="card-body flex items-center justify-center py-20">
          <span class="loading loading-spinner loading-lg" />

          <p class="mt-3 text-sm text-base-content/60">
            Loading vehicle...
          </p>
        </div>
      </div>

      <!-- Form -->
      <form
        v-else-if="vehicle"
        class="card border border-base-300 bg-base-100 shadow-sm"
        @submit.prevent="submit"
      >
        <div class="card-body">
          <!-- Customer -->
          <div>
            <h2 class="text-lg font-semibold">
              Customer
            </h2>

            <p class="text-sm text-base-content/60">
              Select the customer who owns this vehicle.
            </p>
          </div>

          <div class="mt-5">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Customer
              </legend>

              <select
                v-model="form.customer_id"
                class="select select-bordered w-full"
                :class="{
                  'select-error': fieldError('customer_id'),
                }"
              >
                <option
                  value=""
                  disabled
                >
                  Select customer
                </option>

                <option
                  v-for="customer in customers"
                  :key="customer.id"
                  :value="customer.id"
                >
                  {{ customer.customer_code }} -
                  {{ customer.name }}
                  ({{ customer.phone }})
                </option>
              </select>

              <p
                v-if="fieldError('customer_id')"
                class="label text-error"
              >
                {{ fieldError('customer_id') }}
              </p>
            </fieldset>
          </div>

          <div class="divider" />

          <!-- Vehicle Information -->
          <div>
            <h2 class="text-lg font-semibold">
              Vehicle Information
            </h2>

            <p class="text-sm text-base-content/60">
              Update registration and vehicle details.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- Registration -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Registration Number
              </legend>

              <input
                v-model="form.registration_number"
                type="text"
                class="input input-bordered w-full uppercase"
                :class="{
                  'input-error': fieldError('registration_number'),
                }"
                placeholder="CH01AB1234"
                @input="
                  form.registration_number =
                    form.registration_number.toUpperCase()
                "
              />

              <p
                v-if="fieldError('registration_number')"
                class="label text-error"
              >
                {{ fieldError('registration_number') }}
              </p>
            </fieldset>

            <!-- Make -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Make
              </legend>

              <input
                v-model="form.make"
                type="text"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('make'),
                }"
                placeholder="Hyundai"
              />

              <p
                v-if="fieldError('make')"
                class="label text-error"
              >
                {{ fieldError('make') }}
              </p>
            </fieldset>

            <!-- Model -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Model
              </legend>

              <input
                v-model="form.model"
                type="text"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('model'),
                }"
                placeholder="i20"
              />

              <p
                v-if="fieldError('model')"
                class="label text-error"
              >
                {{ fieldError('model') }}
              </p>
            </fieldset>

            <!-- Variant -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Variant
              </legend>

              <input
                v-model="form.variant"
                type="text"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('variant'),
                }"
                placeholder="Sportz"
              />

              <p class="label text-base-content/50">
                Optional
              </p>

              <p
                v-if="fieldError('variant')"
                class="label text-error"
              >
                {{ fieldError('variant') }}
              </p>
            </fieldset>

            <!-- Fuel Type -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Fuel Type
              </legend>

              <select
                v-model="form.fuel_type"
                class="select select-bordered w-full"
                :class="{
                  'select-error': fieldError('fuel_type'),
                }"
              >
                <option value="">
                  Select fuel type
                </option>

                <option value="Petrol">
                  Petrol
                </option>

                <option value="Diesel">
                  Diesel
                </option>

                <option value="CNG">
                  CNG
                </option>

                <option value="Electric">
                  Electric
                </option>

                <option value="Hybrid">
                  Hybrid
                </option>
              </select>

              <p
                v-if="fieldError('fuel_type')"
                class="label text-error"
              >
                {{ fieldError('fuel_type') }}
              </p>
            </fieldset>

            <!-- Manufacturing Year -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Manufacturing Year
              </legend>

              <input
                v-model="form.manufacturing_year"
                type="number"
                min="1900"
                :max="new Date().getFullYear() + 1"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('manufacturing_year'),
                }"
                placeholder="2024"
              />

              <p
                v-if="fieldError('manufacturing_year')"
                class="label text-error"
              >
                {{ fieldError('manufacturing_year') }}
              </p>
            </fieldset>

            <!-- Color -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Color
              </legend>

              <input
                v-model="form.color"
                type="text"
                class="input input-bordered w-full"
                :class="{
                  'input-error': fieldError('color'),
                }"
                placeholder="White"
              />

              <p class="label text-base-content/50">
                Optional
              </p>

              <p
                v-if="fieldError('color')"
                class="label text-error"
              >
                {{ fieldError('color') }}
              </p>
            </fieldset>
          </div>

          <div class="divider" />

          <!-- Identification -->
          <div>
            <h2 class="text-lg font-semibold">
              Vehicle Identification
            </h2>

            <p class="text-sm text-base-content/60">
              Update VIN and engine identification details.
            </p>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- VIN -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                VIN / Chassis Number
              </legend>

              <input
                v-model="form.vin"
                type="text"
                class="input input-bordered w-full uppercase"
                :class="{
                  'input-error': fieldError('vin'),
                }"
                placeholder="VIN number"
                @input="
                  form.vin =
                    form.vin.toUpperCase()
                "
              />

              <p class="label text-base-content/50">
                Optional
              </p>

              <p
                v-if="fieldError('vin')"
                class="label text-error"
              >
                {{ fieldError('vin') }}
              </p>
            </fieldset>

            <!-- Engine Number -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Engine Number
              </legend>

              <input
                v-model="form.engine_number"
                type="text"
                class="input input-bordered w-full uppercase"
                :class="{
                  'input-error': fieldError('engine_number'),
                }"
                placeholder="Engine number"
                @input="
                  form.engine_number =
                    form.engine_number.toUpperCase()
                "
              />

              <p class="label text-base-content/50">
                Optional
              </p>

              <p
                v-if="fieldError('engine_number')"
                class="label text-error"
              >
                {{ fieldError('engine_number') }}
              </p>
            </fieldset>

            <!-- Odometer -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Current Odometer
              </legend>

              <label class="input input-bordered flex w-full items-center gap-2">
                <input
                  v-model="form.current_odometer"
                  type="number"
                  min="0"
                  class="grow"
                  placeholder="45000"
                />

                <span class="text-sm text-base-content/50">
                  km
                </span>
              </label>

              <p class="label text-base-content/50">
                Optional
              </p>

              <p
                v-if="fieldError('current_odometer')"
                class="label text-error"
              >
                {{ fieldError('current_odometer') }}
              </p>
            </fieldset>
          </div>

          <!-- Status -->
          <div class="mt-6 rounded-lg border border-base-300 bg-base-200 p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-medium">
                  Vehicle Status
                </p>

                <p class="text-sm text-base-content/60">
                  Vehicle activation is managed separately.
                </p>
              </div>

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

          <!-- Actions -->
          <div class="mt-8 flex flex-col-reverse gap-3 border-t border-base-300 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="btn btn-ghost"
              @click="cancel"
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

              {{ saving ? 'Updating...' : 'Update Vehicle' }}
            </button>
          </div>
        </div>
      </form>
    </template>
  </div>
</template>
