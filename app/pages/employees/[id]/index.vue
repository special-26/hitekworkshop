<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth']
})

const route = useRoute()
const router = useRouter()
const api = useApi()

const employee = ref<any>(null)
const loading = ref(true)
const error = ref('')

const fetchEmployee = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api(
      `/api/admin/employees/${route.params.id}`
    )

    employee.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load employee.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/employees')
}

onMounted(() => {
  fetchEmployee()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="breadcrumbs text-sm">
        <ul>
            <li>
                <NuxtLink to="/employees">
                Employees
                </NuxtLink>
            </li>
            <li>
                Employee Details
            </li>
        </ul>
        </div>

        <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h1 class="text-2xl font-bold text-base-content">
                Employee Details
            </h1>

            <p class="mt-1 text-sm text-base-content/60">
                View employee profile and account information.
            </p>
            </div>

            <div class="flex gap-2">
            <button
                type="button"
                class="btn btn-ghost"
                @click="goBack"
            >
                Back
            </button>

            <NuxtLink
                v-if="employee"
                :to="`/employees/${employee.id}/edit`"
                class="btn btn-primary"
            >
                Edit Employee
            </NuxtLink>
            </div>
        </div>
        </div>

        <!-- Loading -->
        <div
            v-if="loading"
            class="flex justify-center py-16"
        >
            <span class="loading loading-spinner loading-lg"></span>
        </div>

        <!-- Error -->
        <div
            v-else-if="error"
            class="alert alert-error"
        >
            <span>{{ error }}</span>
        </div>

        <!-- Employee -->
        <div
            v-else-if="employee"
            class="space-y-6"
        >
        <!-- Profile -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
            <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div class="avatar placeholder">
                    <div class="w-20 rounded-full bg-primary text-primary-content flex items-center justify-center">
                        <span class="text-5xl font-semibold">
                            {{ employee.user?.name?.charAt(0)?.toUpperCase() }}
                        </span>
                    </div>
                </div>

                <div class="flex-1">
                <h2 class="text-2xl font-bold">
                    {{ employee.user?.name }}
                </h2>

                <p class="mt-1 text-base-content/60">
                    {{ employee.designation || 'No designation' }}
                </p>

                <div class="mt-3 flex flex-wrap gap-2">
                    <span
                    class="badge"
                    :class="
                        employee.status === 'active'
                        ? 'badge-success'
                        : employee.status === 'inactive'
                            ? 'badge-warning'
                            : 'badge-error'
                    "
                    >
                    {{ employee.status }}
                    </span>

                    <span class="badge badge-outline">
                    {{ employee.employee_code }}
                    </span>
                </div>
                </div>
            </div>
            </div>
        </div>

        <!-- Account Information -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
            <h2 class="card-title">
                Account Information
            </h2>

            <div class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                <p class="text-sm text-base-content/60">
                    Name
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.user?.name || '-' }}
                </p>
                </div>

                <div>
                <p class="text-sm text-base-content/60">
                    Email
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.user?.email || '-' }}
                </p>
                </div>

                <div>
                <p class="text-sm text-base-content/60">
                    Account Status
                </p>

                <p class="mt-1">
                    <span
                    class="badge"
                    :class="
                        employee.user?.is_active
                        ? 'badge-success'
                        : 'badge-error'
                    "
                    >
                    {{ employee.user?.is_active ? 'Active' : 'Inactive' }}
                    </span>
                </p>
                </div>

                <div>
                <p class="text-sm text-base-content/60">
                    Role
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.user?.roles?.[0]?.name || '—' }}
                </p>
                </div>
            </div>
            </div>
        </div>

        <!-- Employee Information -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
            <h2 class="card-title">
                Employee Information
            </h2>

            <div class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                <p class="text-sm text-base-content/60">
                    Employee Code
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.employee_code || '-' }}
                </p>
                </div>

                <div>
                <p class="text-sm text-base-content/60">
                    Department
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.department?.name || '-' }}
                </p>
                </div>

                <div>
                <p class="text-sm text-base-content/60">
                    Designation
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.designation || '-' }}
                </p>
                </div>

                <div>
                <p class="text-sm text-base-content/60">
                    Phone
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.phone || '-' }}
                </p>
                </div>

                <div>
                <p class="text-sm text-base-content/60">
                    Joining Date
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.joining_date || '-' }}
                </p>
                </div>

                <div>
                <p class="text-sm text-base-content/60">
                    Employee Status
                </p>

                <p class="mt-1">
                    <span
                    class="badge"
                    :class="
                        employee.status === 'active'
                        ? 'badge-success'
                        : employee.status === 'on_leave'
                            ? 'badge-warning'
                            : 'badge-error'
                    "
                    >
                    {{ employee.status }}
                    </span>
                </p>
                </div>
            </div>
            </div>
        </div>

        <!-- Timestamps -->
        <div class="card border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
            <h2 class="card-title">
                Record Information
            </h2>

            <div class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                <p class="text-sm text-base-content/60">
                    Created
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.created_at || '-' }}
                </p>
                </div>

                <div>
                <p class="text-sm text-base-content/60">
                    Last Updated
                </p>

                <p class="mt-1 font-medium">
                    {{ employee.updated_at || '-' }}
                </p>
                </div>
            </div>
            </div>
        </div>
        </div>

  </div>
</template>
