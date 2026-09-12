<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['$auth'],
})

interface Role {
  uuid: string
  name: string
  permissions?: Permission[]
}

interface Permission {
  uuid: string
  name: string
}

const api = useApi()
const { hasPermission } = usePermissions()

const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])

const loading = ref(true)
const loadingPermissions = ref(true)
const saving = ref(false)

const error = ref('')
const success = ref('')

const showModal = ref(false)
const editingRole = ref<Role | null>(null)

const validationErrors = ref<Record<string, string[]>>({})

const form = reactive({
  name: '',
  permissions: [] as string[],
})

/*
|--------------------------------------------------------------------------
| Fetch Roles
|--------------------------------------------------------------------------
*/

const fetchRoles = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api('/api/admin/roles')

    roles.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load roles.'
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Fetch Permissions
|--------------------------------------------------------------------------
*/

const fetchPermissions = async () => {
  loadingPermissions.value = true

  try {
    const response = await api('/api/admin/permissions')

    permissions.value = response.data
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load permissions.'
  } finally {
    loadingPermissions.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Permission Groups
|--------------------------------------------------------------------------
*/

const permissionGroups = computed(() => {
  const groups: Record<string, Permission[]> = {}

  for (const permission of permissions.value) {
    const parts = permission.name.split('.')

    let group = parts[0]

    if (permission.name.startsWith('job-cards.')) {
      group = 'job-cards'
    }

    if (!groups[group]) {
      groups[group] = []
    }

    groups[group].push(permission)
  }

  return groups
})

const formatGroupName = (name: string) => {
  const labels: Record<string, string> = {
    'job-cards': 'Job Cards',
    employees: 'Employees',
    customers: 'Customers',
    vehicles: 'Vehicles',
    bays: 'Bays',
    parts: 'Auto Parts',
    inventory: 'Inventory',
    owner: 'Owner',
    dashboard: 'Dashboard',
    roles: 'Roles',
  }

  return (
    labels[name] ||
    name
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
  )
}

const formatPermissionName = (permission: string) => {
  const parts = permission.split('.')

  return parts
    .slice(1)
    .join(' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
*/

const openCreateModal = () => {
  editingRole.value = null

  form.name = ''
  form.permissions = []

  validationErrors.value = {}
  error.value = ''

  showModal.value = true
}

const openEditModal = async (role: Role) => {
  editingRole.value = role

  form.name = role.name
  form.permissions = []

  validationErrors.value = {}
  error.value = ''

  showModal.value = true

  try {
    const response = await api(
      `/api/admin/roles/${role.uuid}`
    )

    const roleData = response.data

    form.name = roleData.name

    form.permissions =
      roleData.permissions?.map(
        (permission: Permission) => permission.uuid
      ) || []
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.message ||
      err?.response?._data?.message ||
      'Unable to load role details.'
  }
}

const closeModal = () => {
  if (saving.value) {
    return
  }

  showModal.value = false
  editingRole.value = null
  validationErrors.value = {}
}

/*
|--------------------------------------------------------------------------
| Permission Selection
|--------------------------------------------------------------------------
*/

const isPermissionSelected = (uuid: string) => {
  return form.permissions.includes(uuid)
}

const togglePermission = (uuid: string) => {
  if (isPermissionSelected(uuid)) {
    form.permissions = form.permissions.filter(
      id => id !== uuid
    )
  } else {
    form.permissions.push(uuid)
  }
}

const toggleGroup = (groupPermissions: Permission[]) => {
  const groupIds = groupPermissions.map(
    permission => permission.uuid
  )

  const allSelected = groupIds.every(id =>
    form.permissions.includes(id)
  )

  if (allSelected) {
    form.permissions = form.permissions.filter(
      id => !groupIds.includes(id)
    )
  } else {
    const merged = new Set([
      ...form.permissions,
      ...groupIds,
    ])

    form.permissions = Array.from(merged)
  }
}

const isGroupSelected = (groupPermissions: Permission[]) => {
  return groupPermissions.every(permission =>
    form.permissions.includes(permission.uuid)
  )
}

/*
|--------------------------------------------------------------------------
| Save Role
|--------------------------------------------------------------------------
*/

const saveRole = async () => {
  saving.value = true
  error.value = ''
  success.value = ''
  validationErrors.value = {}

  try {
    if (editingRole.value) {
      await api(
        `/api/admin/roles/${editingRole.value.uuid}`,
        {
          method: 'PUT',
          body: {
            name: form.name,
            permissions: form.permissions,
          },
        }
      )

      success.value = 'Role updated successfully.'
    } else {
      await api('/api/admin/roles', {
        method: 'POST',
        body: {
          name: form.name,
          permissions: form.permissions,
        },
      })

      success.value = 'Role created successfully.'
    }

    closeModal()

    await fetchRoles()
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
      'Unable to save role.'
  } finally {
    saving.value = false
  }
}

const fieldError = (field: string) => {
  return validationErrors.value[field]?.[0] || ''
}

/*
|--------------------------------------------------------------------------
| Initial Load
|--------------------------------------------------------------------------
*/

onMounted(async () => {
  await Promise.all([
    fetchRoles(),
    fetchPermissions(),
  ])
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Roles & Permissions
        </h1>

        <p class="mt-1 text-sm">
          Manage employee roles and their permissions.
        </p>
      </div>

      <button
        v-if="hasPermission('roles.create')"
        type="button"
        class="btn btn-primary"
        @click="openCreateModal"
      >
        <Icon
          name="lucide:plus"
          class="size-5"
        />

        Create Role
      </button>
    </div>

    <!-- Success -->
    <div
      v-if="success"
      class="alert alert-success mt-6"
    >
      <span>{{ success }}</span>
    </div>

    <!-- Error -->
    <div
      v-if="error && !showModal"
      class="alert alert-error mt-6"
    >
      <span>{{ error }}</span>
    </div>

    <!-- Roles -->
    <div class="card mt-6 border border-base-300 bg-base-100  shadow-sm">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead class="shadow-xl">
              <tr>
                <th>Role</th>
                <th>Permissions</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              <!-- Loading -->
              <tr v-if="loading">
                <td
                  colspan="3"
                  class="py-16 text-center"
                >
                  <span class="loading loading-spinner loading-lg" />

                  <p class="mt-3 text-sm text-base-content/60">
                    Loading roles...
                  </p>
                </td>
              </tr>

              <!-- Empty -->
              <tr v-else-if="roles.length === 0">
                <td
                  colspan="3"
                  class="py-16 text-center"
                >
                  <Icon
                    name="lucide:shield"
                    class="mx-auto size-12 text-base-content/30"
                  />

                  <p class="mt-3 font-medium">
                    No roles found
                  </p>
                </td>
              </tr>

              <!-- Roles -->
              <tr
                v-for="role in roles"
                v-else
                :key="role.uuid"
                class="divide-x divide-gray-300"
              >
                <td>
                  <div class="flex items-center gap-3">
                    <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon
                        name="lucide:shield-check"
                        class="size-5 text-primary"
                      />
                    </div>

                    <div>
                      <div class="font-semibold">
                        {{ role.name }}
                      </div>

                      <div class="text-xs text-base-content/50">
                        Role
                      </div>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="badge badge-ghost">
                    Manage permissions
                  </span>
                </td>

                <td class="text-right">
                  <button
                    v-if="hasPermission('roles.update')"
                    type="button"
                    class="btn btn-ghost btn-sm "
                    @click="openEditModal(role)"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <dialog
      class="modal"
      :class="{ 'modal-open': showModal }"
    >
      <div class="modal-box max-w-4xl">
        <h3 class="text-xl font-bold">
          {{ editingRole ? 'Edit Role' : 'Create Role' }}
        </h3>

        <p class="mt-1 text-sm text-base-content/60">
          {{
            editingRole
              ? 'Update the role and its permissions.'
              : 'Create a role and assign permissions.'
          }}
        </p>

        <!-- Modal Error -->
        <div
          v-if="error"
          class="alert alert-error mt-5"
        >
          <span>{{ error }}</span>
        </div>

        <form
          class="mt-6"
          @submit.prevent="saveRole"
        >
          <!-- Role Name -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Role Name
            </legend>

            <input
              v-model="form.name"
              type="text"
              class="input input-bordered w-full"
              :class="{
                'input-error': fieldError('name'),
              }"
              placeholder="Service Advisor"
            />

            <p
              v-if="fieldError('name')"
              class="label text-error"
            >
              {{ fieldError('name') }}
            </p>
          </fieldset>

          <!-- Permissions -->
          <div class="mt-8">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-semibold">
                  Permissions
                </h4>

                <p class="text-sm text-base-content/60">
                  Select what this role can access.
                </p>
              </div>

              <span class="badge badge-primary">
                {{ form.permissions.length }}
                selected
              </span>
            </div>

            <!-- Permission Loading -->
            <div
              v-if="loadingPermissions"
              class="flex justify-center py-12"
            >
              <span class="loading loading-spinner loading-lg" />
            </div>

            <!-- Permission Groups -->
            <div
              v-else
              class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div
                v-for="(
                  groupPermissions,
                  groupName
                ) in permissionGroups"
                :key="groupName"
                class="rounded-xl border border-base-300 bg-base-100"
              >
                <!-- Group Header -->
                <div class="flex items-center justify-between border-b border-base-300 px-4 py-3">
                  <h5 class="font-semibold">
                    {{ formatGroupName(groupName) }}
                  </h5>

                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    @click="toggleGroup(groupPermissions)"
                  >
                    {{
                      isGroupSelected(groupPermissions)
                        ? 'Clear'
                        : 'Select All'
                    }}
                  </button>
                </div>

                <!-- Permissions -->
                <div class="space-y-1 p-3">
                  <label
                    v-for="permission in groupPermissions"
                    :key="permission.uuid"
                    class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-base-200"
                  >
                    <input
                      type="checkbox"
                      class="checkbox checkbox-primary"
                      :checked="
                        isPermissionSelected(
                          permission.uuid
                        )
                      "
                      @change="
                        togglePermission(
                          permission.uuid
                        )
                      "
                    />

                    <span class="text-sm">
                      {{
                        formatPermissionName(
                          permission.name
                        )
                      }}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-action">
            <button
              type="button"
              class="btn btn-ghost"
              :disabled="saving"
              @click="closeModal"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="saving || loadingPermissions"
            >
              <span
                v-if="saving"
                class="loading loading-spinner loading-sm"
              />

              {{
                saving
                  ? 'Saving...'
                  : editingRole
                    ? 'Update Role'
                    : 'Create Role'
              }}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  </div>
</template>