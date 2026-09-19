
<script setup lang="ts">
definePageMeta({
    layout: 'dashboard',
    middleware: ['$auth'],
})

const api = useApi()
const { hasPermission } = usePermissions()

interface Category {
    id: number
    name: string
}

interface Part {
    id: number
    name: string
    part_number?: string
    category?: string | null
    selling_price?: string | number
    unit?: string
}

interface TaskPart {
    id: number
    part_id: number
    default_quantity: number
    is_required: boolean
    part: Part
}

interface ServiceTask {
    id: number
    name: string
    slug: string
    part_category_id: number | null
    description: string | null
    instructions: string | null
    is_active: boolean
    category?: Category | null
    task_parts_count?: number
    task_parts?: TaskPart[]
}

interface PartCategory {
    id: number
    name: string
}

const tasks = ref<ServiceTask[]>([])
const categories = ref<PartCategory[]>([])

const loading = ref(false)
const loadingCategories = ref(false)
const error = ref('')
const formError = ref('')

const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(15)

const search = ref('')
const status = ref('')

const showTaskModal = ref(false)
const editingTask = ref<ServiceTask | null>(null)
const saving = ref(false)

const selectedTask = ref<ServiceTask | null>(null)
const loadingTask = ref(false)

const showPartModal = ref(false)
const savingPart = ref(false)
const partError = ref('')

const availableParts = ref<Part[]>([])
const partSearch = ref('')
const selectedPart = ref<Part | null>(null)
const loadingParts = ref(false)

const searchParts = async () => {
  if (!partSearch.value.trim()) {
    availableParts.value = []
    return
  }

  loadingParts.value = true

  try {
    const response = await api('/api/admin/parts/search', {
      params: {
        search: partSearch.value,
      },
    })

    availableParts.value = response.data ?? []
  } catch (error) {
    console.error('Failed to search parts:', error)
  } finally {
    loadingParts.value = false
  }
}

const partForm = ref({
    part_id: '',
    default_quantity: 1,
    is_required: false,
})

const taskForm = ref({
  name: '',
  slug: '',
  description: '',
  instructions: '',
  part_category_id: null as number | null,
  is_active: true,
})

const resetForm = () => {
    taskForm.value = {
        name: '',
        slug: '',
        part_category_id: null,
        description: '',
        instructions: '',
        is_active: true,
    }
}

const fetchCategories = async () => {
    loadingCategories.value = true

    try {
        const response: any = await api('/api/admin/vehicles/catalog/part-categories')

        categories.value = response.data ?? []
    } catch (err: any) {
        console.error(err)
    } finally {
        loadingCategories.value = false
    }
}

const fetchTasks = async () => {
    loading.value = true
    error.value = ''

    try {
        const response: any = await api('/api/admin/service-tasks', {
            query: {
                page: currentPage.value,
                search: search.value || undefined,
                is_active: status.value || undefined,
            },
        })

        // The ServiceTaskController returns a paginator
        // inside the response.data property.
        const paginator = response.data

        tasks.value = paginator.data ?? []
        currentPage.value = paginator.current_page ?? 1
        lastPage.value = paginator.last_page ?? 1
        total.value = paginator.total ?? 0
        perPage.value = paginator.per_page ?? 15
    } catch (err: any) {
        console.error(err)

        error.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to fetch service tasks.'
    } finally {
        loading.value = false
    }
}

const applyFilters = () => {
    currentPage.value = 1
    fetchTasks()
}

const clearFilters = () => {
    search.value = ''
    status.value = ''
    currentPage.value = 1

    fetchTasks()
}

const openCreateModal = () => {
    editingTask.value = null
    resetForm()
    formError.value = ''
    showTaskModal.value = true
}

const openEditModal = (task: ServiceTask) => {
    editingTask.value = task

    taskForm.value = {
        name: task.name,
        slug: task.slug || '',
        part_category_id: task.part_category_id
            ? String(task.part_category_id)
            : '',
        description: task.description || '',
        instructions: task.instructions || '',
        is_active: task.is_active,
    }

    formError.value = ''
    showTaskModal.value = true
}

const closeTaskModal = () => {
    if (saving.value) {
        return
    }

    showTaskModal.value = false
    editingTask.value = null
    formError.value = ''
}

const saveTask = async () => {
    saving.value = true
    formError.value = ''

    try {
        const payload = {
            name: taskForm.value.name,
            slug: taskForm.value.slug || null,
            part_category_id: taskForm.value.part_category_id
                ? Number(taskForm.value.part_category_id)
                : null,
            description: taskForm.value.description || null,
            instructions: taskForm.value.instructions || null,
            is_active: taskForm.value.is_active,
        }

        if (editingTask.value) {
            await api(`/api/admin/service-tasks/${editingTask.value.id}`, {
                method: 'PUT',
                body: payload,
            })
        } else {
            await api('/api/admin/service-tasks', {
                method: 'POST',
                body: payload,
            })
        }

        showTaskModal.value = false
        editingTask.value = null

        await fetchTasks()
    } catch (err: any) {
        console.error(err)

        formError.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to save service task.'
    } finally {
        saving.value = false
    }
}

const changeTaskStatus = async (task: ServiceTask) => {
    const newStatus = !task.is_active

    if (
        !confirm(
            `${newStatus ? 'Activate' : 'Deactivate'} "${task.name}"?`
        )
    ) {
        return
    }

    try {
        await api(`/api/admin/service-tasks/${task.id}/status`, {
            method: 'PATCH',
            body: {
                is_active: newStatus,
            },
        })

        await fetchTasks()

        if (selectedTask.value?.id === task.id) {
            await openTask(task)
        }
    } catch (err: any) {
        console.error(err)

        error.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to update task status.'
    }
}

const openTask = async (task: ServiceTask) => {
    selectedTask.value = null
    loadingTask.value = true
    partError.value = ''

    try {
        const response: any = await api(
            `/api/admin/service-tasks/${task.id}`
        )

        selectedTask.value = response.data
    } catch (err: any) {
        console.error(err)

        error.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to load service task.'
    } finally {
        loadingTask.value = false
    }
}

const closeTaskDetails = () => {
    selectedTask.value = null
    showPartModal.value = false
}

const openAddPartModal = () => {
    partForm.value = {
        part_id: '',
        default_quantity: 1,
        is_required: false,
    }

    partError.value = ''
    showPartModal.value = true
}

const closePartModal = () => {
    if (savingPart.value) {
        return
    }

    showPartModal.value = false
    partError.value = ''
}

const addSuggestedPart = async () => {
    if (!selectedTask.value || !selectedPart.value) {
        return
    }

    savingPart.value = true
    partError.value = ''

    try {
        await api(
            `/api/admin/service-tasks/${selectedTask.value.id}/parts`,
            {
                method: 'POST',
                body: {
                    part_id: Number(selectedPart.value.id),
                    default_quantity: Number(
                        partForm.value.default_quantity
                    ),
                    is_required: partForm.value.is_required,
                },
            }
        )

        showPartModal.value = false

        selectedPart.value = null
        partSearch.value = ''
        availableParts.value = []

        await openTask(selectedTask.value)
        await fetchTasks()
    } catch (err: any) {
        console.error(err)

        partError.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to add suggested part.'
    } finally {
        savingPart.value = false
    }
}

const removeSuggestedPart = async (taskPart: TaskPart) => {
    if (!selectedTask.value) {
        return
    }

    if (
        !confirm(
            `Remove "${taskPart.part.name}" from suggested parts?`
        )
    ) {
        return
    }

    try {
        await api(
            `/api/admin/service-tasks/${selectedTask.value.id}/parts/${taskPart.id}`,
            {
                method: 'DELETE',
            }
        )

        await openTask(selectedTask.value)
        await fetchTasks()
    } catch (err: any) {
        console.error(err)

        partError.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to remove suggested part.'
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
    fetchTasks()
}

const categoryName = (categoryId: number | null) => {
    if (!categoryId) {
        return '—'
    }

    return categories.value.find(
        category => category.id === categoryId
    )?.name || '—'
}

onMounted(() => {
    fetchCategories()
    fetchTasks()
})
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 class="text-2xl font-bold text-base-content">
                    Service Tasks
                </h1>

                <p class="mt-1 text-sm text-base-content/60">
                    Manage predefined workshop tasks and suggested parts.
                </p>
            </div>

            <button
                v-if="hasPermission('job-cards-tasks.create')"
                type="button"
                class="btn btn-primary"
                @click="openCreateModal"
            >
                <span class="text-lg">+</span>
                Add Task
            </button>
        </div>

        <!-- Filters -->
        <div class="card border border-gray-300 bg-gray-100 shadow-sm">
            <div class="card-body p-4">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <label
                        class="input input-bordered flex items-center gap-2"
                    >
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
                            placeholder="Search tasks..."
                            class="grow"
                            @keyup.enter="applyFilters"
                        />
                    </label>

                    <select
                        v-model="status"
                        class="select select-bordered w-full"
                    >
                        <option value="">
                            All Status
                        </option>

                        <option value="true">
                            Active
                        </option>

                        <option value="false">
                            Inactive
                        </option>
                    </select>

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
            class="alert alert-error"
        >
            <span>{{ error }}</span>
        </div>

        <!-- Task List -->
        <div
            class="card overflow-hidden border border-gray-300 bg-gray-100 shadow-sm"
        >
            <div class="overflow-x-auto">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Primary Category</th>
                            <th>Suggested Parts</th>
                            <th>Status</th>
                            <th class="text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        <!-- Loading -->
                        <tr v-if="loading">
                            <td
                                colspan="5"
                                class="py-16 text-center"
                            >
                                <span
                                    class="loading loading-spinner loading-lg"
                                />

                                <p
                                    class="mt-3 text-sm text-base-content/60"
                                >
                                    Loading service tasks...
                                </p>
                            </td>
                        </tr>

                        <!-- Empty -->
                        <tr v-else-if="tasks.length === 0">
                            <td
                                colspan="5"
                                class="py-16 text-center"
                            >
                                <p class="font-medium">
                                    No service tasks found
                                </p>

                                <p
                                    class="mt-1 text-sm text-base-content/60"
                                >
                                    Try changing your search or filters.
                                </p>
                            </td>
                        </tr>

                        <!-- Tasks -->
                        <tr
                            v-for="task in tasks"
                            v-else
                            :key="task.id"
                        >
                            <td>
                                <div class="font-semibold">
                                    {{ task.name }}
                                </div>

                                <div
                                    v-if="task.description"
                                    class="max-w-xs truncate text-xs text-base-content/60"
                                >
                                    {{ task.description }}
                                </div>
                            </td>

                            <td>
                                {{
                                    task.category?.name ||
                                    categoryName(task.part_category_id)
                                }}
                            </td>

                            <td>
                                <span class="badge badge-ghost">
                                    {{ task.task_parts_count ?? 0 }}
                                    parts
                                </span>
                            </td>

                            <td>
                                <span
                                    class="badge"
                                    :class="
                                        task.is_active
                                            ? 'badge-success'
                                            : 'badge-error'
                                    "
                                >
                                    {{
                                        task.is_active
                                            ? 'Active'
                                            : 'Inactive'
                                    }}
                                </span>
                            </td>

                            <td class="text-right">
                                <div
                                    class="flex justify-end gap-1"
                                >
                                    <button
                                        type="button"
                                        class="btn btn-ghost btn-sm"
                                        @click="openTask(task)"
                                    >
                                        Parts
                                    </button>

                                    <button
                                        type="button"
                                        class="btn btn-ghost btn-sm"
                                        @click="openEditModal(task)"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="btn btn-ghost btn-sm"
                                        :class="
                                            task.is_active
                                                ? 'text-error'
                                                : 'text-success'
                                        "
                                        @click="changeTaskStatus(task)"
                                    >
                                        {{
                                            task.is_active
                                                ? 'Deactivate'
                                                : 'Activate'
                                        }}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div
                v-if="total > 0"
                class="flex flex-col gap-4 border-t border-gray-300 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                    tasks
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
                        :disabled="
                            currentPage === lastPage || loading
                        "
                        @click="changePage(currentPage + 1)"
                    >
                        »
                    </button>
                </div>
            </div>
        </div>

        <!-- Task Details / Suggested Parts -->
        <div
            v-if="loadingTask || selectedTask"
            class="card border border-gray-300 bg-gray-100 shadow-sm"
        >
            <div class="card-body">
                <div
                    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                >
                    <div>
                        <h2 class="text-xl font-bold">
                            {{
                                loadingTask
                                    ? 'Loading task...'
                                    : selectedTask?.name
                            }}
                        </h2>

                        <p
                            v-if="selectedTask?.description"
                            class="mt-1 text-sm text-base-content/60"
                        >
                            {{ selectedTask.description }}
                        </p>
                    </div>

                    <div class="flex gap-2">
                        <button
                            type="button"
                            class="btn btn-ghost btn-sm"
                            @click="closeTaskDetails"
                        >
                            Close
                        </button>

                        <button
                            v-if="selectedTask"
                            type="button"
                            class="btn btn-primary btn-sm"
                            @click="openAddPartModal"
                        >
                            + Add Part
                        </button>
                    </div>
                </div>

                <div
                    v-if="loadingTask"
                    class="py-10 text-center"
                >
                    <span
                        class="loading loading-spinner loading-lg"
                    />
                </div>

                <div
                    v-else-if="selectedTask"
                    class="mt-4 overflow-x-auto"
                >
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Part</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Required</th>
                                <th class="text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr
                                v-for="taskPart in selectedTask.task_parts"
                                :key="taskPart.id"
                            >
                                <td>
                                    <div class="font-semibold">
                                        {{ taskPart.part.name }}
                                    </div>

                                    <div
                                        v-if="taskPart.part.part_number"
                                        class="text-xs text-base-content/60"
                                    >
                                        {{ taskPart.part.part_number }}
                                    </div>
                                </td>

                                <td>
                                    {{ taskPart.part.category || '—' }}
                                </td>

                                <td>
                                    {{ taskPart.default_quantity }}
                                    {{ taskPart.part.unit || '' }}
                                </td>

                                <td>
                                    <span
                                        class="badge"
                                        :class="
                                            taskPart.is_required
                                                ? 'badge-warning'
                                                : 'badge-ghost'
                                        "
                                    >
                                        {{
                                            taskPart.is_required
                                                ? 'Required'
                                                : 'Optional'
                                        }}
                                    </span>
                                </td>

                                <td class="text-right">
                                    <button
                                        type="button"
                                        class="btn btn-ghost btn-sm text-error"
                                        @click="removeSuggestedPart(taskPart)"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>

                            <tr
                                v-if="
                                    !selectedTask.task_parts ||
                                    selectedTask.task_parts.length === 0
                                "
                            >
                                <td
                                    colspan="5"
                                    class="py-10 text-center text-base-content/60"
                                >
                                    No suggested parts configured.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    v-if="partError"
                    class="alert alert-error mt-4"
                >
                    <span>{{ partError }}</span>
                </div>
            </div>
        </div>

        <!-- Create/Edit Task Modal -->
        <dialog
            class="modal"
            :class="{ 'modal-open': showTaskModal }"
        >
            <div class="modal-box max-w-2xl">
                <h3 class="text-lg font-bold">
                    {{
                        editingTask
                            ? 'Edit Service Task'
                            : 'Add Service Task'
                    }}
                </h3>

                <p class="mt-1 text-sm text-base-content/60">
                    {{
                        editingTask
                            ? 'Update predefined task information.'
                            : 'Create a reusable task for advisors.'
                    }}
                </p>

                <div
                    v-if="formError"
                    class="alert alert-error mt-4"
                >
                    <span>{{ formError }}</span>
                </div>

                <div class="mt-5 space-y-4">
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Task Name
                        </legend>

                        <input
                            v-model="taskForm.name"
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="Engine Oil Change"
                            :disabled="saving"
                        />
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Slug
                            <span class="font-normal text-base-content/50">
                                Optional
                            </span>
                        </legend>

                        <input
                            v-model="taskForm.slug"
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="engine-oil-change"
                            :disabled="saving"
                        />

                        <p class="text-xs text-base-content/50">
                            Leave blank to generate it automatically.
                        </p>
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Primary Part Category
                        </legend>

                        <select
                            v-model="taskForm.part_category_id"
                            class="select select-bordered w-full"
                            :disabled="saving || loadingCategories"
                        >
                            <option value="">
                                Select category
                            </option>

                            <option
                                v-for="category in categories"
                                :key="category.id"
                                :value="String(category.id)"
                            >
                                {{ category.name }}
                            </option>
                        </select>

                        <p class="text-xs text-base-content/50">
                            This is the main category for the task.
                            Suggested parts can belong to other categories.
                        </p>
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Description
                        </legend>

                        <textarea
                            v-model="taskForm.description"
                            class="textarea textarea-bordered min-h-24 w-full"
                            placeholder="Describe the service task..."
                            :disabled="saving"
                        />
                    </fieldset>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Instructions
                        </legend>

                        <textarea
                            v-model="taskForm.instructions"
                            class="textarea textarea-bordered min-h-24 w-full"
                            placeholder="Instructions for the technician..."
                            :disabled="saving"
                        />
                    </fieldset>

                    <label
                        class="label cursor-pointer justify-start gap-3"
                    >
                        <input
                            v-model="taskForm.is_active"
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            :disabled="saving"
                        />

                        <span>
                            <span class="font-medium">
                                Active
                            </span>

                            <span
                                class="block text-xs text-base-content/60"
                            >
                                Allow advisors to use this task.
                            </span>
                        </span>
                    </label>
                </div>

                <div class="modal-action">
                    <button
                        type="button"
                        class="btn btn-ghost"
                        :disabled="saving"
                        @click="closeTaskModal"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="btn btn-primary"
                        :disabled="saving || !taskForm.name.trim()"
                        @click="saveTask"
                    >
                        <span
                            v-if="saving"
                            class="loading loading-spinner loading-sm"
                        />

                        {{ saving ? 'Updating...' : 'Update Task' }}
                    </button>
                </div>
            </div>

            <form
                method="dialog"
                class="modal-backdrop"
                @submit.prevent="closeTaskModal"
            >
                <button type="button">
                    close
                </button>
            </form>
        </dialog>

        <!-- Add Suggested Part Modal -->
        <dialog
            class="modal"
            :class="{ 'modal-open': showPartModal }"
        >
            <div class="modal-box">
                <h3 class="text-lg font-bold">
                    Add Suggested Part
                </h3>

                <p class="mt-1 text-sm text-base-content/60">
                    Add a part that is normally used for this task.
                </p>

                <div
                    v-if="partError"
                    class="alert alert-error mt-4"
                >
                    <span>{{ partError }}</span>
                </div>

                <div class="mt-5 space-y-4">
                    <!-- Search Parts -->
                     <div class="form-control">
                        <label class="label">
                            <span class="label-text">Search Part</span>
                        </label>

                        <input
                            v-model="partSearch"
                            type="text"
                            placeholder="Search part name or number..."
                            class="input input-bordered w-full"
                            @input="searchParts"
                        />

                        <span
                            v-if="loadingParts"
                            class="loading loading-spinner loading-sm mt-2"
                        ></span>

                        <div
                            v-if="availableParts.length"
                            class="mt-2 max-h-48 overflow-y-auto rounded-lg border border-base-300"
                        >
                            <button
                                v-for="part in availableParts"
                                :key="part.id"
                                type="button"
                                class="block w-full p-3 text-left hover:bg-base-300"
                                @click="selectedPart = part"
                            >
                                <div class="font-medium">
                                    {{ part.name }}
                                </div>

                                <div class="text-xs opacity-60">
                                    {{ part.part_number ?? 'No part number' }}
                                </div>
                            </button>
                        </div>

                        <div
                            v-if="selectedPart"
                            class="mt-2 rounded-lg bg-success/10 p-3 text-sm"
                        >
                            Selected: **{{ selectedPart.name }}**
                        </div>
                    </div>

                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Default Quantity
                        </legend>

                        <input
                            v-model.number="partForm.default_quantity"
                            type="number"
                            min="1"
                            step="1"
                            class="input input-bordered w-full"
                            :disabled="savingPart"
                        />
                    </fieldset>

                    <label
                        class="label cursor-pointer justify-start gap-3"
                    >
                        <input
                            v-model="partForm.is_required"
                            type="checkbox"
                            class="checkbox checkbox-primary"
                            :disabled="savingPart"
                        />

                        <span>
                            <span class="font-medium">
                                Required Part
                            </span>

                            <span
                                class="block text-xs text-base-content/60"
                            >
                                Mark this part as normally required for
                                the task.
                            </span>
                        </span>
                    </label>
                </div>

                <div class="modal-action">
                    <button
                        type="button"
                        class="btn btn-ghost"
                        :disabled="savingPart"
                        @click="closePartModal"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="btn btn-primary"
                        :disabled="
                            savingPart ||
                            !selectedPart ||
                            Number(partForm.default_quantity) < 1
                        "
                        @click="addSuggestedPart"
                    >
                        <span
                            v-if="savingPart"
                            class="loading loading-spinner loading-sm"
                        />

                        {{ savingPart ? 'Adding...' : 'Add Part' }}
                    </button>
                </div>
            </div>

            <form
                method="dialog"
                class="modal-backdrop"
                @submit.prevent="closePartModal"
            >
                <button type="button">
                    close
                </button>
            </form>
        </dialog>
    </div>
</template>