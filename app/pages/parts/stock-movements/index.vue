<script setup lang="ts">
definePageMeta({
    layout: 'dashboard',
    middleware: ['$auth'],
})

const api = useApi()
const { hasPermission } = usePermissions()

interface Part {
    id: number
    part_number: string
    name: string
    unit: string
    current_stock: string | number
    minimum_stock: string | number
    is_active: boolean
}

interface StockMovement {
    id: number
    part_id: number
    type: 'in' | 'out' | 'return' | 'adjustment'
    quantity: string | number
    previous_stock: string | number
    new_stock: string | number
    unit_cost: string | number | null
    reference: string | null
    notes: string | null
    created_at: string
    part: {
        id: number
        part_number: string
        name: string
        unit: string
    } | null
    created_by: {
        id: string
        name: string
    } | null
}

const parts = ref<Part[]>([])
const movements = ref<StockMovement[]>([])

const loadingParts = ref(false)
const loadingMovements = ref(false)
const error = ref('')

const search = ref('')
const stockFilter = ref('')

const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(20)

const showMovementModal = ref(false)
const movementType = ref<'in' | 'out' | 'return'>('in')
const saving = ref(false)
const formError = ref('')

const form = ref({
    part_id: '',
    quantity: 1,
    unit_cost: 0,
    reference: '',
    notes: '',
})

const fetchParts = async () => {
    loadingParts.value = true

    try {
        const response = await api('/api/admin/parts', {
            query: {
                per_page: 100,
                search: search.value || undefined,
                is_active: true,
            },
        })

        parts.value = response.data.data
    } catch (err: any) {
        console.error(err)

        error.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to fetch parts.'
    } finally {
        loadingParts.value = false
    }
}

const fetchMovements = async () => {
    loadingMovements.value = true
    error.value = ''

    try {
        const response = await api('/api/admin/stock-movements', {
            query: {
                page: currentPage.value,
                per_page: perPage.value,
                type: stockFilter.value || undefined,
            },
        })

        movements.value = response.data.data
        currentPage.value = response.data.current_page
        lastPage.value = response.data.last_page
        total.value = response.data.total
        perPage.value = response.data.per_page
    } catch (err: any) {
        console.error(err)

        error.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to fetch stock movements.'
    } finally {
        loadingMovements.value = false
    }
}

const refreshData = async () => {
    await Promise.all([
        fetchParts(),
        fetchMovements(),
    ])
}

const applyFilters = () => {
    currentPage.value = 1
    refreshData()
}

const clearFilters = () => {
    search.value = ''
    stockFilter.value = ''
    currentPage.value = 1

    refreshData()
}

const openMovementModal = (
    type: 'in' | 'out' | 'return',
) => {
    movementType.value = type

    form.value = {
        part_id: '',
        quantity: 1,
        unit_cost: 0,
        reference: '',
        notes: '',
    }

    formError.value = ''
    showMovementModal.value = true
}

const closeMovementModal = () => {
    if (saving.value) {
        return
    }

    showMovementModal.value = false
    formError.value = ''
}

const selectedPart = computed(() => {
    if (!form.value.part_id) {
        return null
    }

    return parts.value.find(
        part => String(part.id) === String(form.value.part_id),
    ) || null
})

const movementTitle = computed(() => {
    switch (movementType.value) {
        case 'in':
            return 'Stock In'

        case 'out':
            return 'Stock Out'

        case 'return':
            return 'Stock Return'

        default:
            return 'Stock Movement'
    }
})

const movementButtonText = computed(() => {
    if (saving.value) {
        return 'Saving...'
    }

    switch (movementType.value) {
        case 'in':
            return 'Add Stock'

        case 'out':
            return 'Issue Stock'

        case 'return':
            return 'Record Return'

        default:
            return 'Save'
    }
})

const saveMovement = async () => {
    if (!form.value.part_id) {
        formError.value = 'Please select a part.'
        return
    }

    if (Number(form.value.quantity) <= 0) {
        formError.value = 'Quantity must be greater than zero.'
        return
    }

    if (
        movementType.value === 'out' &&
        selectedPart.value &&
        Number(form.value.quantity) > Number(selectedPart.value.current_stock)
    ) {
        formError.value = 'Insufficient stock available.'
        return
    }

    saving.value = true
    formError.value = ''

    try {
        await api('/api/admin/stock-movements', {
            method: 'POST',
            body: {
                part_id: Number(form.value.part_id),
                type: movementType.value,
                quantity: Number(form.value.quantity),
                unit_cost:
                    movementType.value === 'in'
                        ? Number(form.value.unit_cost)
                        : null,
                reference: form.value.reference || null,
                notes: form.value.notes || null,
            },
        })

        showMovementModal.value = false

        await refreshData()
    } catch (err: any) {
        console.error(err)

        formError.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to record stock movement.'
    } finally {
        saving.value = false
    }
}

const changePage = (page: number) => {
    if (
        page < 1 ||
        page > lastPage.value ||
        loadingMovements.value
    ) {
        return
    }

    currentPage.value = page
    fetchMovements()
}

const formatMovementType = (type: string) => {
    switch (type) {
        case 'in':
            return 'Stock In'

        case 'out':
            return 'Stock Out'

        case 'return':
            return 'Return'

        case 'adjustment':
            return 'Adjustment'

        default:
            return type
    }
}

const movementBadgeClass = (type: StockMovement['type']) => {
    switch (type) {
        case 'in':
            return 'badge-success'

        case 'out':
            return 'badge-error'

        case 'return':
            return 'badge-info'

        case 'adjustment':
            return 'badge-warning'

        default:
            return 'badge-ghost'
    }
}

const stockClass = (part: Part) => {
    const current = Number(part.current_stock)
    const minimum = Number(part.minimum_stock)

    if (current <= 0) {
        return 'text-error'
    }

    if (current <= minimum) {
        return 'text-warning'
    }

    return 'text-success'
}

const formatDate = (value: string) => {
    if (!value) {
        return '—'
    }

    return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

onMounted(() => {
    refreshData()
})
</script>

<template>
    <div>
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-2xl font-bold text-base-content">
                    Stock Management
                </h1>

                <p class="mt-1 text-sm text-base-content/60">
                    Manage stock movements and inventory levels.
                </p>
            </div>

            <div class="flex flex-wrap gap-2">
                <button
                    type="button"
                    class="btn btn-success"
                    @click="openMovementModal('in')"
                >
                    + Stock In
                </button>

                <button
                    type="button"
                    class="btn btn-error"
                    @click="openMovementModal('out')"
                >
                    − Stock Out
                </button>

                <button
                    type="button"
                    class="btn btn-info"
                    @click="openMovementModal('return')"
                >
                    ↩ Return
                </button>
            </div>
        </div>

        <!-- Current Stock -->
        <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="card-title">
                            Current Stock
                        </h2>

                        <p class="text-sm text-base-content/60">
                            Active workshop parts
                        </p>
                    </div>

                    <span
                        v-if="loadingParts"
                        class="loading loading-spinner"
                    />
                </div>

                <div class="mt-4 overflow-x-auto">
                    <table class="table">
                        <thead class="bg-gray-300">
                            <tr>
                                <th>Part</th>
                                <th>Category</th>
                                <th>Current Stock</th>
                                <th>Minimum</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr
                                v-for="part in parts"
                                :key="part.id"
                            >
                                <td class="border border-gray-300">
                                    <div class="font-semibold">
                                        {{ part.name }}
                                    </div>

                                    <div class="font-mono text-xs text-base-content/60">
                                        {{ part.part_number }}
                                    </div>
                                </td>

                                <td class="border border-gray-300">
                                    {{ part.category || '—' }}
                                </td>

                                <td class="border border-gray-300">
                                    <span
                                        class="font-bold"
                                        :class="stockClass(part)"
                                    >
                                        {{ Number(part.current_stock) }}
                                        {{ part.unit }}
                                    </span>
                                </td>

                                <td class="border border-gray-300">
                                    {{ Number(part.minimum_stock) }}
                                    {{ part.unit }}
                                </td>

                                <td class="border border-gray-300">
                                    <span
                                        v-if="Number(part.current_stock) <= 0"
                                        class="badge badge-error"
                                    >
                                        Out of Stock
                                    </span>

                                    <span
                                        v-else-if="Number(part.current_stock) <= Number(part.minimum_stock)"
                                        class="badge badge-warning"
                                    >
                                        Low Stock
                                    </span>

                                    <span
                                        v-else
                                        class="badge badge-success"
                                    >
                                        In Stock
                                    </span>
                                </td>
                            </tr>

                            <tr v-if="!loadingParts && parts.length === 0">
                                <td
                                    colspan="5"
                                    class="py-10 text-center text-base-content/60"
                                >
                                    No active parts found.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body p-4">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                            placeholder="Search parts..."
                            class="grow"
                            @keyup.enter="applyFilters"
                        >
                    </label>

                    <select
                        v-model="stockFilter"
                        class="select select-bordered w-full"
                    >
                        <option value="">
                            All Movements
                        </option>

                        <option value="in">
                            Stock In
                        </option>

                        <option value="out">
                            Stock Out
                        </option>

                        <option value="return">
                            Return
                        </option>

                        <option value="adjustment">
                            Adjustment
                        </option>
                    </select>

                    <div class="flex gap-2">
                        <button
                            type="button"
                            class="btn btn-primary"
                            :disabled="loadingMovements"
                            @click="applyFilters"
                        >
                            Search
                        </button>

                        <button
                            type="button"
                            class="btn btn-ghost"
                            :disabled="loadingMovements"
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
            <span>{{ error }}</span>
        </div>

        <!-- Movement History -->
        <div class="card mt-6 overflow-hidden border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body p-0">
                <div class="border-b border-base-300 p-4">
                    <h2 class="card-title">
                        Movement History
                    </h2>

                    <p class="text-sm text-base-content/60">
                        Complete inventory transaction history.
                    </p>
                </div>

                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Part</th>
                                <th>Type</th>
                                <th>Quantity</th>
                                <th>Stock</th>
                                <th>Reference</th>
                                <th>Created By</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-if="loadingMovements">
                                <td
                                    colspan="7"
                                    class="py-16 text-center"
                                >
                                    <span class="loading loading-spinner loading-lg" />

                                    <p class="mt-3 text-sm text-base-content/60">
                                        Loading movements...
                                    </p>
                                </td>
                            </tr>

                            <tr v-else-if="movements.length === 0">
                                <td
                                    colspan="7"
                                    class="py-16 text-center text-base-content/60"
                                >
                                    No stock movements found.
                                </td>
                            </tr>

                            <tr
                                v-for="movement in movements"
                                v-else
                                :key="movement.id"
                            >
                                <td class="whitespace-nowrap text-sm">
                                    {{ formatDate(movement.created_at) }}
                                </td>

                                <td>
                                    <div class="font-semibold">
                                        {{ movement.part?.name || '—' }}
                                    </div>

                                    <div class="font-mono text-xs text-base-content/60">
                                        {{ movement.part?.part_number || '—' }}
                                    </div>
                                </td>

                                <td>
                                    <span
                                        class="badge"
                                        :class="movementBadgeClass(movement.type)"
                                    >
                                        {{ formatMovementType(movement.type) }}
                                    </span>
                                </td>

                                <td>
                                    <span class="font-semibold">
                                        {{ Number(movement.quantity) }}
                                        {{ movement.part?.unit || '' }}
                                    </span>
                                </td>

                                <td>
                                    <span class="text-sm">
                                        {{ Number(movement.previous_stock) }}
                                        →
                                        <strong>
                                            {{ Number(movement.new_stock) }}
                                        </strong>
                                    </span>
                                </td>

                                <td>
                                    {{ movement.reference || '—' }}
                                </td>

                                <td>
                                    {{ movement.created_by?.name || '—' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
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
                        movements
                    </div>

                    <div class="join">
                        <button
                            type="button"
                            class="btn btn-sm join-item"
                            :disabled="currentPage === 1 || loadingMovements"
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
                            :disabled="currentPage === lastPage || loadingMovements"
                            @click="changePage(currentPage + 1)"
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stock Movement Modal -->
        <dialog
            class="modal"
            :class="{ 'modal-open': showMovementModal }"
        >
            <div class="modal-box">
                <h3 class="text-lg font-bold">
                    {{ movementTitle }}
                </h3>

                <p class="mt-1 text-sm text-base-content/60">
                    Record a {{ movementType === 'in'
                        ? 'new stock purchase'
                        : movementType === 'out'
                            ? 'stock issue'
                            : 'returned stock' }}.
                </p>

                <!-- Error -->
                <div
                    v-if="formError"
                    class="alert alert-error mt-4"
                >
                    <span>{{ formError }}</span>
                </div>

                <!-- Part -->
                <fieldset class="fieldset mt-5">
                    <legend class="fieldset-legend">
                        Part
                    </legend>

                    <select
                        v-model="form.part_id"
                        class="select select-bordered w-full"
                        :disabled="saving"
                    >
                        <option value="">
                            Select part
                        </option>

                        <option
                            v-for="part in parts"
                            :key="part.id"
                            :value="String(part.id)"
                        >
                            {{ part.name }} — {{ part.part_number }}
                        </option>
                    </select>
                </fieldset>

                <!-- Current Stock -->
                <div
                    v-if="selectedPart"
                    class="alert mt-4"
                >
                    <div class="flex w-full items-center justify-between">
                        <span class="text-sm">
                            Current Stock
                        </span>

                        <strong>
                            {{ Number(selectedPart.current_stock) }}
                            {{ selectedPart.unit }}
                        </strong>
                    </div>
                </div>

                <!-- Quantity -->
                <fieldset class="fieldset mt-4">
                    <legend class="fieldset-legend">
                        Quantity
                    </legend>

                    <input
                        v-model.number="form.quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        class="input input-bordered w-full"
                        :disabled="saving"
                    >
                </fieldset>

                <!-- Unit Cost -->
                <fieldset
                    v-if="movementType === 'in'"
                    class="fieldset mt-4"
                >
                    <legend class="fieldset-legend">
                        Unit Cost
                    </legend>

                    <label class="input input-bordered flex items-center gap-2">
                        <span class="text-base-content/60">
                            ₹
                        </span>

                        <input
                            v-model.number="form.unit_cost"
                            type="number"
                            min="0"
                            step="0.01"
                            class="grow"
                            :disabled="saving"
                        >
                    </label>
                </fieldset>

                <!-- Reference -->
                <fieldset class="fieldset mt-4">
                    <legend class="fieldset-legend">
                        Reference
                    </legend>

                    <input
                        v-model="form.reference"
                        type="text"
                        class="input input-bordered w-full"
                        placeholder="Purchase invoice / issue reference"
                        :disabled="saving"
                    >
                </fieldset>

                <!-- Notes -->
                <fieldset class="fieldset mt-4">
                    <legend class="fieldset-legend">
                        Notes
                    </legend>

                    <textarea
                        v-model="form.notes"
                        class="textarea textarea-bordered w-full"
                        rows="3"
                        placeholder="Optional notes..."
                        :disabled="saving"
                    />
                </fieldset>

                <div class="modal-action">
                    <button
                        type="button"
                        class="btn btn-ghost"
                        :disabled="saving"
                        @click="closeMovementModal"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="btn btn-primary"
                        :disabled="saving"
                        @click="saveMovement"
                    >
                        <span
                            v-if="saving"
                            class="loading loading-spinner loading-sm"
                        />

                        {{ movementButtonText }}
                    </button>
                </div>
            </div>

            <form
                method="dialog"
                class="modal-backdrop"
                @submit.prevent="closeMovementModal"
            >
                <button type="button">
                    close
                </button>
            </form>
        </dialog>
    </div>
</template>