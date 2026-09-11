<script setup lang="ts">
    definePageMeta({
        layout: 'dashboard',
        middleware: ['$auth'],
    })

    const api = useApi()
    
    const { hasPermission } = usePermissions()

    interface Employee {
        id: number
        user_id: string
        department_id: number | null
        employee_code: string
        phone: string | null
        designation: string | null
        joining_date: string | null
        status: 'active' | 'inactive' | 'terminated' | 'on_leave'
        user: {
            id: string
            name: string
            email: string
            is_active: boolean
        } | null
        department: {
            id: number
            name: string
        } | null
    }

    const employees = ref<Employee[]>([])
    const loading = ref(false)
    const error = ref('')

    const currentPage = ref(1)
    const lastPage = ref(1)
    const total = ref(0)
    const perPage = ref(20)

    const search = ref('')

    const role = ref('')
    const roles = ref<{ uuid: string; name: string }[]>([])

    const status = ref('')
    const showStatusModal = ref(false)
    const selectedEmployee = ref<Employee | null>(null)
    const selectedStatus = ref<Employee['status']>('active')
    const updatingStatus = ref(false)
    const statusError = ref('')

    const fetchEmployees = async () => {
      loading.value = true
      error.value = ''

      try {
          const response = await api('/api/admin/employees', {
              query: {
                  page: currentPage.value,
                  search: search.value || undefined,
                  status: status.value || undefined,
                  role: role.value || undefined,
              }
          })

          employees.value = response.data.data
          currentPage.value = response.data.current_page
          lastPage.value = response.data.last_page
          total.value = response.data.total
          perPage.value = response.data.per_page
      } catch (err: any) {
          console.error(err)

          error.value =
          err?.data?.message ||
          'Unable to fetch employees.'
      } finally {
          loading.value = false
      }
    }

    const fetchRoles = async () => {
      try {
        const response = await api('/api/admin/roles')
        console.log('Roles API Response:', response)
        roles.value = response.data
      } catch (err) {
        console.error('Unable to fetch roles:', err)
      }
    }

    const applyFilters = () => {
        currentPage.value = 1
        fetchEmployees()
    }

    const clearFilters = () => {
        search.value = ''
        role.value = ''
        status.value = ''
        currentPage.value = 1

        fetchEmployees()
    }

    // Update Employee Status
    const openStatusModal = (employee: Employee) => {
      selectedEmployee.value = employee
      selectedStatus.value = employee.status
      statusError.value = ''
      showStatusModal.value = true
    }

    const closeStatusModal = () => {
      if (updatingStatus.value) {
        return
      }

      showStatusModal.value = false
      selectedEmployee.value = null
      statusError.value = ''
    }

    const updateEmployeeStatus = async () => {
      if (!selectedEmployee.value) {
        return
      }

      updatingStatus.value = true
      statusError.value = ''

      try {
        await api(
          `/api/admin/employees/${selectedEmployee.value.id}/status`,
          {
            method: 'PATCH',
            body: {
              status: selectedStatus.value,
            },
          }
        )

        showStatusModal.value = false

        selectedEmployee.value = null

        await fetchEmployees()
      } catch (err: any) {
        console.error(err)

        statusError.value =
          err?.data?.message ||
          err?.response?._data?.message ||
          'Unable to update employee status.'
      } finally {
        updatingStatus.value = false
      }
    }

    const changePage = (page: number) => {
        if (
            page < 1 ||
            page > lastPage.value ||
            loading.value
        ) {
            return
        }

        currentPage.value = page
        fetchEmployees()    
    }

    const formatStatus = (value: string) => {
        return value
            .replace('_', ' ')
            .replace(/\b\w/g, char => char.toUpperCase())
    }

    const statusBadgeClass = (value: Employee['status']) => {
        switch (value) {
            case 'active':
            return 'badge-success'

            case 'inactive':
            return 'badge-warning'

            case 'on_leave':
            return 'badge-info'

            case 'terminated':
            return 'badge-error'

            default:
            return 'badge-ghost'
        }
    }

    const loginStatusBadgeClass = (isActive: boolean) => {
        return isActive
            ? 'badge-success'
            : 'badge-error'
    }

    onMounted(() => {
      fetchEmployees()
      fetchRoles()
    })
    
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

      <div>
        <h1 class="text-2xl font-bold text-base-content">
          Employees
        </h1>

        <p class="mt-1 text-sm text-base-content/60">
          Manage workshop employees and their accounts.
        </p>
      </div>

      <NuxtLink
        v-if="hasPermission('employees.create')"
        to="/employees/create"
        class="btn btn-primary"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="size-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>

        Add Employee
      </NuxtLink>

    </div>

    <!-- Filters -->
    <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">

      <div class="card-body p-4">

        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">

          <!-- Search -->
          <label class="input input-bordered flex items-center gap-2">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="size-5 opacity-60"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-4.3-4.3m2.05-5.2a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0Z"
              />
            </svg>

            <input
              v-model="search"
              type="text"
              placeholder="Search employees..."
              class="grow"
              @keyup.enter="applyFilters"
            >

          </label>

          <!-- Role -->
          <select
              v-model="role"
              class="select select-bordered w-full"
          >
              <option value="">
                  All Roles
              </option>

              <option
                  v-for="item in roles"
                  :key="item.uuid"
                  :value="item.name"
              >
                  {{ item.name }}
              </option>
          </select>

          <!-- Status -->
          <select
            v-model="status"
            class="select select-bordered w-full"
          >
            <option value="">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="on_leave">
              On Leave
            </option>

            <option value="terminated">
              Terminated
            </option>
          </select>

          <!-- Filter buttons -->
          <div class="flex gap-2">

            <button
              type="button"
              class="btn btn-primary"
              :disabled="loading"
              @click="applyFilters"
            >
              Search
            </button>

            <button
              type="button"
              class="btn btn-ghost"
              :disabled="loading"
              @click="clearFilters"
            >
              Clear
            </button>

          </div>

        </div>

      </div>

    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="alert alert-error mt-6"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        class="size-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v3.75m0 3.75h.007M10.29 3.86 2.82 17.25A1.5 1.5 0 0 0 4.12 19.5h15.76a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.95 1.95 0 0 0-3.42 0Z"
        />
      </svg>

      <span>{{ error }}</span>
    </div>

    <!-- Employee Table -->
    <div class="card mt-6 overflow-hidden border border-base-300 bg-base-100 shadow-sm">

      <div class="overflow-x-auto">

        <table class="table">

          <!-- Table Header -->
          <thead>
            <tr>

              <th>
                Employee
              </th>

              <th>
                Code
              </th>

              <th>
                Department
              </th>

              <th>
                Designation
              </th>

              <th>
                Phone
              </th>

              <th>
                Status
              </th>

              <th>
                Login
              </th>

              <th class="text-right">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            <!-- Loading -->
            <tr v-if="loading">

              <td
                colspan="8"
                class="py-16 text-center"
              >

                <span class="loading loading-spinner loading-lg" />

                <p class="mt-3 text-sm text-base-content/60">
                  Loading employees...
                </p>

              </td>

            </tr>

            <!-- Empty -->
            <tr v-else-if="employees.length === 0">

              <td
                colspan="8"
                class="py-16 text-center"
              >

                <div class="flex flex-col items-center">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-12 text-base-content/30"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 3.375-.62 9.75 9.75 0 0 0-9.375-6.91c-4.258 0-7.96 2.73-9.375 6.91a9.337 9.337 0 0 0 3.375.62 9.38 9.38 0 0 0 2.625-.372m6.75-11.25a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z"
                    />
                  </svg>

                  <p class="mt-3 font-medium">
                    No employees found
                  </p>

                  <p class="mt-1 text-sm text-base-content/60">
                    Try changing your search or filters.
                  </p>

                </div>

              </td>

            </tr>

            <!-- Employees -->
            <tr
              v-for="employee in employees"
              v-else
              :key="employee.id"
            >

              <!-- Employee -->
              <td>

                <div class="flex items-center gap-3">

                  <div class="avatar placeholder">

                    <div class="flex size-10 items-center justify-center rounded-full bg-neutral text-neutral-content">
                      <span class="text-sm">
                        {{ employee.user?.name?.charAt(0)?.toUpperCase() || '?' }}
                      </span>
                    </div>

                  </div>

                  <div>

                    <div class="font-semibold">
                      {{ employee.user?.name || '—' }}
                    </div>

                    <div class="text-sm text-base-content/60">
                      {{ employee.user?.email || '—' }}
                    </div>

                  </div>

                </div>

              </td>

              <!-- Code -->
              <td>
                <span class="font-mono text-sm">
                  {{ employee.employee_code }}
                </span>
              </td>

              <!-- Department -->
              <td>
                {{ employee.department?.name || 'Not assigned' }}
              </td>

              <!-- Designation -->
              <td>
                {{ employee.designation || '—' }}
              </td>

              <!-- Phone -->
              <td>
                {{ employee.phone || '—' }}
              </td>

              <!-- Employee Status -->
              <td>

                <span
                  class="badge"
                  :class="statusBadgeClass(employee.status)"
                >
                  {{ formatStatus(employee.status) }}
                </span>

              </td>

              <!-- Login Status -->
              <td>

                <span
                  class="badge badge-sm"
                  :class="loginStatusBadgeClass(employee.user?.is_active ?? false)"
                >
                  {{ employee.user?.is_active ? 'Enabled' : 'Disabled' }}
                </span>

              </td>

              <!-- Actions -->
              <td class="text-right">
                <!-- View -->
                <NuxtLink
                  :to="`/employees/${employee.id}`"
                  class="btn btn-ghost btn-sm"
                >
                  View
                </NuxtLink>
                <!-- Edit -->
                <NuxtLink
                  v-if="hasPermission('employees.update')"
                  :to="`/employees/${employee.id}/edit`"
                  class="btn btn-ghost btn-sm"
                >
                  Edit
                </NuxtLink>
                <!-- Status -->
                <button
                  v-if="hasPermission('employees.status.update')"
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="openStatusModal(employee)"
                >
                  Status
                </button>
              </td>

            </tr>

          </tbody>

        </table>

      </div>

      <!-- Footer / Pagination -->
      <div
        v-if="total > 0"
        class="flex flex-col gap-4 border-t border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between"
      >

        <div class="text-sm text-base-content/60">
          Showing
          <span class="font-medium text-base-content">
            {{ (currentPage - 1) * perPage + 1 }}
          </span>
          –
          <span class="font-medium text-base-content">
            {{ Math.min(currentPage * perPage, total) }}
          </span>
          of
          <span class="font-medium text-base-content">
            {{ total }}
          </span>
          employees
        </div>

        <div class="join">

          <button
            type="button"
            class="btn btn-sm join-item"
            :disabled="currentPage === 1 || loading"
            @click="changePage(currentPage - 1)"
          >
            «
          </button>

          <button
            type="button"
            class="btn btn-sm join-item"
          >
            Page {{ currentPage }} / {{ lastPage }}
          </button>

          <button
            type="button"
            class="btn btn-sm join-item"
            :disabled="currentPage === lastPage || loading"
            @click="changePage(currentPage + 1)"
          >
            »
          </button>

        </div>

      </div>

    </div>

    <!-- Status Modal -->
    <dialog
      class="modal"
      :class="{ 'modal-open': showStatusModal }"
    >
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          Update Employee Status
        </h3>

        <p class="mt-2 text-sm text-base-content/60">
          Update the employment status for
          <span class="font-semibold text-base-content">
            {{ selectedEmployee?.user?.name }}
          </span>.
        </p>

        <!-- Error -->
        <div
          v-if="statusError"
          class="alert alert-error mt-4"
        >
          <span>{{ statusError }}</span>
        </div>

        <!-- Status -->
        <fieldset class="fieldset mt-5">
          <legend class="fieldset-legend">
            Employee Status
          </legend>

          <select
            v-model="selectedStatus"
            class="select select-bordered w-full"
            :disabled="updatingStatus"
          >
            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="on_leave">
              On Leave
            </option>

            <option value="terminated">
              Terminated
            </option>
          </select>
        </fieldset>

        <!-- Warning -->
        <div
          v-if="selectedStatus !== 'active'"
          class="alert alert-warning mt-5"
        >
          <span class="text-sm">
            {{
              selectedStatus === 'terminated'
                ? 'This employee will be marked as terminated and will no longer be able to log in.'
                : selectedStatus === 'on_leave'
                  ? 'This employee will remain in the system but their login will be disabled.'
                  : 'This employee will no longer be able to log in.'
            }}
          </span>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="updatingStatus"
            @click="closeStatusModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="updatingStatus"
            @click="updateEmployeeStatus"
          >
            <span
              v-if="updatingStatus"
              class="loading loading-spinner loading-sm"
            />

            {{
              updatingStatus
                ? 'Updating...'
                : 'Update Status'
            }}
          </button>
        </div>
      </div>

      <!-- Click outside -->
      <form
        method="dialog"
        class="modal-backdrop"
        @submit.prevent="closeStatusModal"
      >
        <button type="button">
          close
        </button>
      </form>
    </dialog>
  </div>
</template>