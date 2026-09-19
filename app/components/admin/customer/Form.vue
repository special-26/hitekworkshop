<script setup lang="ts">
interface Customer {
  id: number
  customer_code?: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
}

interface Props {
  customer?: Customer | null
  initialPhone?: string
}

const props = withDefaults(defineProps<Props>(), {
  customer: null,
  initialPhone: '',
})

const emit = defineEmits<{
  saved: [customer: Customer]
  cancel: []
}>()

const api = useApi()

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
})

const isEditing = computed(() => !!props.customer)

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

const resetForm = () => {
  form.name = props.customer?.name || ''
  form.phone = props.customer?.phone || props.initialPhone || ''
  form.email = props.customer?.email || ''
  form.address = props.customer?.address || ''
  form.city = props.customer?.city || ''
  form.state = props.customer?.state || ''
}

const submitForm = async () => {
  saving.value = true
  error.value = ''
  validationErrors.value = {}

  try {
    const isEditing = !!props.customer?.id

    const response = await api(
      isEditing
        ? `/api/admin/customers/${props.customer!.id}`
        : '/api/admin/customers',
      {
        method: isEditing ? 'PUT' : 'POST',
        body: {
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, ''),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
        },
      }
    )

    const customer =
      response.data?.data ||
      response.data ||
      response

    console.log('CUSTOMER CREATED:', customer)

    // Send the created customer to the parent component
    emit('saved', customer)

  } catch (err: any) {
    console.error('Customer save error:', err)

    error.value =
      err?.response?.data?.message ||
      'Unable to save customer.'

    validationErrors.value =
      err?.response?.data?.errors || {}

  } finally {
    saving.value = false
  }
}

watch(
  () => props.customer,
  () => {
    resetForm()
  },
  { immediate: true },
)

watch(
  () => props.initialPhone,
  (phone) => {
    if (!props.customer && phone) {
      form.phone = phone
    }
  },
)
</script>

<template>
  <form @submit.prevent="submitForm">
    <div class="space-y-5 p-5">

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

      <!-- Customer Name -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          Customer Name *
        </legend>

        <input
          v-model="form.name"
          type="text"
          class="input input-bordered w-full"
          :class="{
            'input-error': fieldError('name'),
          }"
          placeholder="Enter customer name"
          autocomplete="name"
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
          Mobile Number *
        </legend>

        <label
          class="input input-bordered flex w-full items-center gap-2"
          :class="{
            'input-error': fieldError('phone'),
          }"
        >
          <Icon
            name="lucide:phone"
            class="size-4 text-base-content/50"
          />

          <input
            v-model="form.phone"
            type="tel"
            inputmode="numeric"
            maxlength="10"
            class="grow"
            placeholder="10-digit mobile number"
            autocomplete="tel"
          />
        </label>

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
          autocomplete="email"
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

      <!-- Address -->
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          Address
        </legend>

        <textarea
          v-model="form.address"
          class="textarea textarea-bordered min-h-20 w-full"
          :class="{
            'textarea-error': fieldError('address'),
          }"
          placeholder="Customer address"
        />

        <p class="label text-base-content/50">
          Optional
        </p>
      </fieldset>

      <!-- City / State -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">

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
            placeholder="City"
          />

          <p
            v-if="fieldError('city')"
            class="label text-error"
          >
            {{ fieldError('city') }}
          </p>
        </fieldset>

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
            placeholder="State"
          />

          <p
            v-if="fieldError('state')"
            class="label text-error"
          >
            {{ fieldError('state') }}
          </p>
        </fieldset>

      </div>

    </div>

    <!-- Actions -->
    <div
      class="flex flex-col-reverse gap-3 border-t border-base-300 px-5 py-4 sm:flex-row sm:justify-end"
    >
      <button
        type="button"
        class="btn btn-ghost"
        :disabled="saving"
        @click="emit('cancel')"
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

        <Icon
          v-else
          name="lucide:user-plus"
          class="size-4"
        />

        {{ saving ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer' }}
      </button>
    </div>
  </form>
</template>