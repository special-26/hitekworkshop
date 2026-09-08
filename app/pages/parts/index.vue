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
    category: string | null
    brand: string | null
    unit: string
    cost_price: string | number
    selling_price: string | number
    current_stock: string | number
    minimum_stock: string | number
    is_active: boolean
    created_at: string
    updated_at: string
}

const parts = ref<Part[]>([])
const loading = ref(false)
const error = ref('')

const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(20)

const search = ref('')
const category = ref('')
const status = ref('')

const showPartModal = ref(false)
const editingPart = ref<Part | null>(null)
const saving = ref(false)
const formError = ref('')

const form = ref({
    part_number: '',
    name: '',
    category: '',
    brand: '',
    unit: 'pcs',
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    minimum_stock: 0,
    is_active: true,
})

const fetchParts = async () => {
    loading.value = true
    error.value = ''

    try {
        const response = await api('/api/admin/parts', {
            query: {
                page: currentPage.value,
                search: search.value || undefined,
                category: category.value || undefined,
                is_active: status.value || undefined,
            },
        })

        parts.value = response.data.data
        currentPage.value = response.data.current_page
        lastPage.value = response.data.last_page
        total.value = response.data.total
        perPage.value = response.data.per_page
    } catch (err: any) {
        console.error(err)

        error.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to fetch parts.'
    } finally {
        loading.value = false
    }
}

const applyFilters = () => {
    currentPage.value = 1
    fetchParts()
}

const clearFilters = () => {
    search.value = ''
    category.value = ''
    status.value = ''
    currentPage.value = 1

    fetchParts()
}

const openCreateModal = () => {
    editingPart.value = null

    form.value = {
        part_number: '',
        name: '',
        category: '',
        brand: '',
        unit: 'pcs',
        cost_price: 0,
        selling_price: 0,
        current_stock: 0,
        minimum_stock: 0,
        is_active: true,
    }

    formError.value = ''
    showPartModal.value = true
}

const openEditModal = (part: Part) => {
    editingPart.value = part

    form.value = {
        part_number: part.part_number,
        name: part.name,
        category: part.category || '',
        brand: part.brand || '',
        unit: part.unit,
        cost_price: Number(part.cost_price),
        selling_price: Number(part.selling_price),
        current_stock: Number(part.current_stock),
        minimum_stock: Number(part.minimum_stock),
        is_active: part.is_active,
    }

    formError.value = ''
    showPartModal.value = true
}

const closePartModal = () => {
    if (saving.value) {
        return
    }

    showPartModal.value = false
    editingPart.value = null
    formError.value = ''
}

const savePart = async () => {
    saving.value = true
    formError.value = ''

    try {
        const payload = {
            part_number: form.value.part_number,
            name: form.value.name,
            category: form.value.category || null,
            brand: form.value.brand || null,
            unit: form.value.unit,
            cost_price: Number(form.value.cost_price),
            selling_price: Number(form.value.selling_price),
            current_stock: Number(form.value.current_stock),
            minimum_stock: Number(form.value.minimum_stock),
            is_active: form.value.is_active,
        }

        if (editingPart.value) {
            await api(`/api/admin/parts/${editingPart.value.id}`, {
                method: 'PUT',
                body: payload,
            })
        } else {
            await api('/api/admin/parts', {
                method: 'POST',
                body: payload,
            })
        }

        showPartModal.value = false
        editingPart.value = null

        await fetchParts()
    } catch (err: any) {
        console.error(err)

        formError.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to save part.'
    } finally {
        saving.value = false
    }
}

const deactivatePart = async (part: Part) => {
    if (!confirm(`Deactivate "${part.name}"?`)) {
        return
    }

    try {
        await api(`/api/admin/parts/${part.id}`, {
            method: 'DELETE',
        })

        await fetchParts()
    } catch (err: any) {
        console.error(err)

        error.value =
            err?.data?.message ||
            err?.response?._data?.message ||
            'Unable to deactivate part.'
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
    fetchParts()
}

const isLowStock = (part: Part) => {
    return Number(part.current_stock) <= Number(part.minimum_stock)
}

const stockClass = (part: Part) => {
    if (Number(part.current_stock) <= 0) {
        return 'text-error'
    }

    if (isLowStock(part)) {
        return 'text-warning'
    }

    return 'text-success'
}

onMounted(() => {
    fetchParts()
})
</script>

<template>
    <div>
        <!-- Header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 class="text-2xl font-bold text-base-content">
                    Parts
                </h1>

                <p class="mt-1 text-sm text-base-content/60">
                    Manage workshop parts and inventory items.
                </p>
            </div>

            <button
                v-if="hasPermission('job-cards-tasks.create')"
                type="button"
                class="btn btn-primary"
                @click="openCreateModal"
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

                Add Part
            </button>
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
                            placeholder="Search parts..."
                            class="grow"
                            @keyup.enter="applyFilters"
                        >
                    </label>

                    <!-- Category -->
                    <input
                        v-model="category"
                        type="text"
                        placeholder="Category"
                        class="input input-bordered w-full"
                        @keyup.enter="applyFilters"
                    >

                    <!-- Status -->
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

                    <!-- Buttons -->
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
            <span>{{ error }}</span>
        </div>

        <!-- Parts Table -->
        <div class="card mt-6 overflow-hidden border border-base-300 bg-base-100 shadow-sm">
            <div class="overflow-x-auto">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Part</th>
                            <th>Category</th>
                            <th>Brand</th>
                            <th>Unit</th>
                            <th>Cost</th>
                            <th>Selling</th>
                            <th>Stock</th>
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
                                colspan="9"
                                class="py-16 text-center"
                            >
                                <span class="loading loading-spinner loading-lg" />

                                <p class="mt-3 text-sm text-base-content/60">
                                    Loading parts...
                                </p>
                            </td>
                        </tr>

                        <!-- Empty -->
                        <tr v-else-if="parts.length === 0">
                            <td
                                colspan="9"
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
                                            d="M20.25 7.5l-8.25-4.5-8.25 4.5m16.5 0v9l-8.25 4.5m8.25-13.5L12 12m0 0L3.75 7.5M12 12v9"
                                        />
                                    </svg>

                                    <p class="mt-3 font-medium">
                                        No parts found
                                    </p>

                                    <p class="mt-1 text-sm text-base-content/60">
                                        Try changing your search or filters.
                                    </p>
                                </div>
                            </td>
                        </tr>

                        <!-- Parts -->
                        <tr
                            v-for="part in parts"
                            v-else
                            :key="part.id"
                        >
                            <!-- Part -->
                            <td>
                                <div class="font-semibold">
                                    {{ part.name }}
                                </div>

                                <div class="font-mono text-xs text-base-content/60">
                                    {{ part.part_number }}
                                </div>
                            </td>

                            <!-- Category -->
                            <td>
                                {{ part.category || '—' }}
                            </td>

                            <!-- Brand -->
                            <td>
                                {{ part.brand || '—' }}
                            </td>

                            <!-- Unit -->
                            <td>
                                {{ part.unit }}
                            </td>

                            <!-- Cost -->
                            <td>
                                ₹{{ Number(part.cost_price).toFixed(2) }}
                            </td>

                            <!-- Selling -->
                            <td>
                                ₹{{ Number(part.selling_price).toFixed(2) }}
                            </td>

                            <!-- Stock -->
                            <td>
                                <div
                                    class="font-semibold"
                                    :class="stockClass(part)"
                                >
                                    {{ Number(part.current_stock) }}
                                    {{ part.unit }}
                                </div>

                                <div
                                    v-if="isLowStock(part)"
                                    class="text-xs text-warning"
                                >
                                    Low stock
                                </div>
                            </td>

                            <!-- Status -->
                            <td>
                                <span
                                    class="badge"
                                    :class="part.is_active ? 'badge-success' : 'badge-error'"
                                >
                                    {{ part.is_active ? 'Active' : 'Inactive' }}
                                </span>
                            </td>

                            <!-- Actions -->
                            <td class="text-right">
                                <button
                                    type="button"
                                    class="btn btn-ghost btn-sm"
                                    @click="openEditModal(part)"
                                >
                                    Edit
                                </button>

                                <button
                                    v-if="part.is_active"
                                    type="button"
                                    class="btn btn-ghost btn-sm text-error"
                                    @click="deactivatePart(part)"
                                >
                                    Deactivate
                                </button>
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
                    parts
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

        <!-- Add/Edit Modal -->
        <dialog
            class="modal"
            :class="{ 'modal-open': showPartModal }"
        >
            <div class="modal-box max-w-2xl">
                <h3 class="text-lg font-bold">
                    {{ editingPart ? 'Edit Part' : 'Add Part' }}
                </h3>

                <p class="mt-1 text-sm text-base-content/60">
                    {{ editingPart
                        ? 'Update part information.'
                        : 'Add a new part to the workshop catalogue.'
                    }}
                </p>

                <!-- Error -->
                <div
                    v-if="formError"
                    class="alert alert-error mt-4"
                >
                    <span>{{ formError }}</span>
                </div>

                <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <!-- Part Number -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Part Number
                        </legend>

                        <input
                            v-model="form.part_number"
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="e.g. OIL-5W30-001"
                            :disabled="saving"
                        >
                    </fieldset>

                    <!-- Name -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Part Name
                        </legend>

                        <input
                            v-model="form.name"
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="Engine Oil 5W-30"
                            :disabled="saving"
                        >
                    </fieldset>

                    <!-- Category -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Category
                        </legend>

                        <input
                            v-model="form.category"
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="Engine Oil"
                            :disabled="saving"
                        >
                    </fieldset>

                    <!-- Brand -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Brand
                        </legend>

                        <input
                            v-model="form.brand"
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="Castrol"
                            :disabled="saving"
                        >
                    </fieldset>

                    <!-- Unit -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Unit
                        </legend>

                        <select
                            v-model="form.unit"
                            class="select select-bordered w-full"
                            :disabled="saving"
                        >
                            <option value="pcs">
                                Pieces
                            </option>

                            <option value="litre">
                                Litre
                            </option>

                            <option value="kg">
                                Kg
                            </option>

                            <option value="set">
                                Set
                            </option>
                        </select>
                    </fieldset>

                    <!-- Cost -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Cost Price
                        </legend>

                        <label class="input input-bordered flex items-center gap-2">
                            <span class="text-base-content/60">₹</span>

                            <input
                                v-model.number="form.cost_price"
                                type="number"
                                min="0"
                                step="0.01"
                                class="grow"
                                :disabled="saving"
                            >
                        </label>
                    </fieldset>

                    <!-- Selling -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Selling Price
                        </legend>

                        <label class="input input-bordered flex items-center gap-2">
                            <span class="text-base-content/60">₹</span>

                            <input
                                v-model.number="form.selling_price"
                                type="number"
                                min="0"
                                step="0.01"
                                class="grow"
                                :disabled="saving"
                            >
                        </label>
                    </fieldset>

                    <!-- Current Stock -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Current Stock
                        </legend>

                        <input
                            v-model.number="form.current_stock"
                            type="number"
                            min="0"
                            step="0.01"
                            class="input input-bordered w-full"
                            :disabled="saving || !!editingPart"
                        >

                        <p
                            v-if="editingPart"
                            class="text-xs text-base-content/50"
                        >
                            Stock will be managed through stock movements.
                        </p>
                    </fieldset>

                    <!-- Minimum Stock -->
                    <fieldset class="fieldset">
                        <legend class="fieldset-legend">
                            Minimum Stock
                        </legend>

                        <input
                            v-model.number="form.minimum_stock"
                            type="number"
                            min="0"
                            step="0.01"
                            class="input input-bordered w-full"
                            :disabled="saving"
                        >
                    </fieldset>

                    <!-- Active -->
                    <fieldset class="fieldset sm:col-span-2">
                        <label class="label cursor-pointer justify-start gap-3">
                            <input
                                v-model="form.is_active"
                                type="checkbox"
                                class="checkbox checkbox-primary"
                                :disabled="saving"
                            >

                            <span>
                                <span class="font-medium">
                                    Active
                                </span>

                                <span class="block text-xs text-base-content/60">
                                    Allow this part to be used in the workshop.
                                </span>
                            </span>
                        </label>
                    </fieldset>
                </div>

                <div class="modal-action">
                    <button
                        type="button"
                        class="btn btn-ghost"
                        :disabled="saving"
                        @click="closePartModal"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="btn btn-primary"
                        :disabled="saving"
                        @click="savePart"
                    >
                        <span
                            v-if="saving"
                            class="loading loading-spinner loading-sm"
                        />

                        {{ saving ? 'Saving...' : 'Save Part' }}
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