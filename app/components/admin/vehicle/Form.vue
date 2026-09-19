
<script setup lang="ts">
interface Vehicle {
  id: number
  customer_id: number
  registration_number: string
  make: string
  model: string
  variant: string | null
  fuel_type: string | null
  manufacturing_year?: number | null
  color?: string | null
  vin?: string | null
  engine_number?: string | null
  current_odometer?: number | null
}

interface Props {
  customerId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  saved: [vehicle: Vehicle]
  cancel: []
}>()

const api = useApi()

const loading = ref(false)
const error = ref('')
const validationErrors = ref<Record<string, string[]>>({})

const form = reactive({
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
| Submit
|--------------------------------------------------------------------------
*/

const submit = async () => {
  loading.value = true
  error.value = ''
  validationErrors.value = {}

  try {
    const response = await api('/api/admin/vehicles', {
      method: 'POST',

      body: {
        customer_id: props.customerId,

        registration_number: form.registration_number
          ? form.registration_number.toUpperCase()
          : '',

        make: form.make,

        model: form.model,

        variant: form.variant || null,

        fuel_type: form.fuel_type || null,

        manufacturing_year: form.manufacturing_year
          ? Number(form.manufacturing_year)
          : null,

        color: form.color || null,

        vin: form.vin
          ? form.vin.toUpperCase()
          : null,

        engine_number: form.engine_number
          ? form.engine_number.toUpperCase()
          : null,

        current_odometer: form.current_odometer
          ? Number(form.current_odometer)
          : null,
      },
    })

    const vehicle = response.data?.data || response.data

    emit('saved', vehicle)
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
      'Unable to create vehicle.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="p-5">
    <div class="space-y-6">
      <!-- Error -->
      <div
        v-if="error"
        class="alert alert-error"
      >
        <Icon
          name="lucide:circle-alert"
          class="size-5"
        />

        <span>{{ error }}</span>
      </div>

      <!-- Vehicle Information -->
      <section>
        <div>
          <h2 class="text-lg font-semibold">
            Vehicle Information
          </h2>

          <p class="mt-1 text-sm text-base-content/60">
            Enter the basic details of the vehicle.
          </p>
        </div>

        <div
          class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <!-- Registration Number -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Registration Number *
            </legend>

            <input
              v-model="form.registration_number"
              type="text"
              class="input input-bordered w-full uppercase"
              :class="{
                'input-error': fieldError('registration_number'),
              }"
              placeholder="CH01AB1234"
              required
              @input="
                form.registration_number =
                  form.registration_number.toUpperCase()
              "
            />

            <p class="label text-base-content/50">
              Example: CH01AB1234
            </p>

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
              Make *
            </legend>

            <input
              v-model="form.make"
              type="text"
              class="input input-bordered w-full"
              :class="{
                'input-error': fieldError('make'),
              }"
              placeholder="Hyundai"
              required
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
              Model *
            </legend>

            <input
              v-model="form.model"
              type="text"
              class="input input-bordered w-full"
              :class="{
                'input-error': fieldError('model'),
              }"
              placeholder="i20"
              required
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
      </section>

      <div class="divider"></div>

      <!-- Vehicle Identification -->
      <section>
        <div>
          <h2 class="text-lg font-semibold">
            Vehicle Identification
          </h2>

          <p class="mt-1 text-sm text-base-content/60">
            Enter identification and odometer details.
          </p>
        </div>

        <div
          class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
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
                form.vin = form.vin.toUpperCase()
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

            <label
              class="input input-bordered flex w-full items-center gap-2"
              :class="{
                'input-error': fieldError('current_odometer'),
              }"
            >
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
      </section>

      <!-- Actions -->
      <div
        class="flex flex-col-reverse gap-3 border-t border-base-300 pt-5 sm:flex-row sm:justify-end"
      >
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="loading"
          @click="emit('cancel')"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading"
        >
          <span
            v-if="loading"
            class="loading loading-spinner loading-sm"
          ></span>

          {{ loading ? 'Creating...' : 'Create Vehicle' }}
        </button>
      </div>
    </div>
  </form>
</template>