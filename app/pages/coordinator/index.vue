<script setup lang="ts">
    const api = useApi()

    const summaryLoading = ref(false)
    const error = ref('')

    const activeTasks = ref<ActiveTask[]>([])
    const activeTasksLoading = ref(false)

    interface ActiveTask {
        id: number
        job_card_id: number
        title: string
        status: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
        estimated_minutes?: number | null
        actual_minutes?: number | null
        started_at?: string | null

        job_card: {
            id: number
            job_card_number: string
            vehicle: {
            registration_number: string
            make: string
            model: string
            variant?: string | null
            }
        }

        department: {
            id: number
            name: string
        }

        bay?: {
            id: number
            name: string
            code: string
            type: string
        } | null

        assigned_employee?: {
            id: number
            employee_code: string
            user?: {
            id: string
            name: string
            } | null
        } | null

        parts?: {
            id: number
            quantity: string | number
            status: 'pending' | 'issued' | 'returned' | 'cancelled'
            part: {
            part_number: string
            name: string
            unit: string
            }
        }[]
    }

    interface TaskSummary {
        pending: number
        assigned: number
        in_progress: number
        on_hold: number
        completed: number
        cancelled: number
    }

    const summary = ref<TaskSummary>({
        pending: 0,
        assigned: 0,
        in_progress: 0,
        on_hold: 0,
        completed: 0,
        cancelled: 0,
    })

    const fetchSummary = async () => {
        summaryLoading.value = true
        error.value = ''

        try {
            const response = await api('/api/admin/coordinator/tasks/summary')

            summary.value = response?.data
        } catch (err: any) {
            console.log('SUMMARY API ERROR:', err)

            error.value =
                err?.data?.message ||
                err?.message ||
                'Unable to load task summary.'
        } finally {
            summaryLoading.value = false
        }
    }

    const fetchActiveTasks = async () => {
        activeTasksLoading.value = true

        try {
            const response = await api(
                '/api/admin/coordinator/tasks?status=assigned,in_progress,on_hold'
            )

            activeTasks.value = Array.isArray(response.data?.data)
                ? [...response.data?.data].sort((a, b) => {
                    const order: Record<string, number> = {
                        on_hold: 1,
                        in_progress: 2,
                        assigned: 3,
                    }

                    return (
                        (order[a.status] ?? 99) -
                        (order[b.status] ?? 99)
                    )
                    })
                : []
        } catch (err: any) {
            console.error('Unable to load active tasks:', err)
        } finally {
            activeTasksLoading.value = false
        }
    }

    const refreshDashboard = async () => {
        await Promise.all([
            fetchSummary(),
            fetchActiveTasks(),
        ])
    }

    onMounted(() => {
        refreshDashboard()
    })
    
</script>
<template>
    <div class="p-6 space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-2xl font-bold">
                Coordinator Dashboard
                </h1>

                <p class="mt-1 text-sm text-base-content/60">
                Workshop task overview
                </p>
            </div>

            <div class="flex items-center justify-center gap-10">
                <NotificationsBell />            

                <button
                    type="button"
                    class="btn btn-sm btn-outline"
                    :disabled="summaryLoading || activeTasksLoading"
                    @click="refreshDashboard"
                >
                    <span
                    v-if="summaryLoading || activeTasksLoading"
                    class="loading loading-spinner loading-xs"
                    ></span>

                    <span v-else>↻</span>

                    Refresh
                </button>
            </div>
        </div>

        <div
            v-if="error"
            class="alert alert-error"
            >
            {{ error }}
        </div>

        <div
            v-if="summaryLoading"
            class="flex justify-center py-10"
        >
            <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div
            v-else
            class="grid grid-cols-2 gap-4 lg:grid-cols-3 *:border *:border-gray-300 *:shadow-lg"
        >
            <NuxtLink
                to="/coordinator/tasks?status=pending"
                class="card border border-gray-300 bg-gray-200 shadow-sm transition hover:shadow-md"
            >
                <div class="card-body">
                    <p class="text-sm text-gray-content/60">
                        Pending
                    </p>

                    <p class="text-3xl font-bold">
                        {{ summary.pending }}
                    </p>
                </div>
            </NuxtLink>

            <NuxtLink
                to="/coordinator/tasks?status=assigned"
                class="card border border-gray-300 bg-gray-200 shadow-sm transition hover:shadow-md"
            >
                <div class="card-body">
                    <p class="text-sm text-gray-content/60">
                        Assigned
                    </p>

                    <p class="text-3xl font-bold">
                        {{ summary.assigned }}
                    </p>
                </div>
            </NuxtLink>

            <NuxtLink
                to="/coordinator/tasks?status=in_progress"
                class="card border border-gray-300 bg-gray-200 shadow-sm transition hover:shadow-md"
            >
                <div class="card-body">
                    <p class="text-sm text-gray-content/60">
                        In Progress
                    </p>

                    <p class="text-3xl font-bold">
                        {{ summary.in_progress }}
                    </p>
                </div>
            </NuxtLink>

            <NuxtLink
                to="/coordinator/tasks?status=on_hold"
                class="card border border-gray-300 bg-gray-200 shadow-sm transition hover:shadow-md"
            >
                <div class="card-body">
                    <p class="text-sm text-gray-content/60">
                        On Hold
                    </p>

                    <p class="text-3xl font-bold">
                        {{ summary.on_hold }}
                    </p>
                </div>
            </NuxtLink>

            <NuxtLink
                to="/coordinator/tasks?status=completed"
                class="card border border-gray-300 bg-gray-200 shadow-sm transition hover:shadow-md"
            >
                <div class="card-body">
                    <p class="text-sm text-gray-content/60">
                        Completed
                    </p>

                    <p class="text-3xl font-bold">
                        {{ summary.completed }}
                    </p>
                </div>
            </NuxtLink>

            <NuxtLink
                to="/coordinator/tasks?status=cancelled"
                class="card border border-gray-300 bg-gray-200 shadow-sm transition hover:shadow-md"
            >
                <div class="card-body">
                    <p class="text-sm text-gray-content/60">
                        Cancelled
                    </p>

                    <p class="text-3xl font-bold">
                        {{ summary.cancelled }}
                    </p>
                </div>
            </NuxtLink>
        </div>
    
        <!-- Active Tasks -->
        <div class="space-y-4">
            <div>
                <h2 class="text-xl font-bold">
                Active Tasks
                </h2>

                <p class="text-sm text-gray-content/60">
                Tasks currently being worked on
                </p>
            </div>

            <div
                v-if="activeTasksLoading"
                class="flex justify-center py-8"
            >
                <span class="loading loading-spinner loading-lg"></span>
            </div>

            <div
                v-else-if="!activeTasks.length"
                class="rounded-box border border-gray-300 bg-gray-200 p-6 text-center text-gray-content/60"
            >
                No active tasks.
            </div>

            <div
                v-else
                class="grid gap-4"
            >
                <TasksCard
                    v-for="task in activeTasks"
                    :key="task.id"
                    :task="task"
                />
            </div>
        </div>

    </div>
</template>