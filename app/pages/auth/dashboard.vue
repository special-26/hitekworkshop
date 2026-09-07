<script setup>
    definePageMeta({
        layout: 'dashboard',
        middleware: ['$auth'],
    });
    const user = useCurrentUser();

    const {
        permissions,
        roles,
        hasPermission,
        hasRole
    } = usePermissions()

    const stats = computed(() => [
    {
        label: "Today's Job Cards",
        value: 0,
        icon: 'i-lucide-clipboard-list',
        permission: 'job-cards.view'
    },
    {
        label: 'Active Job Cards',
        value: 0,
        icon: 'i-lucide-wrench',
        permission: 'job-cards.view'
    },
    {
        label: 'Available Bays',
        value: 0,
        icon: 'i-lucide-warehouse',
        permission: 'bays.view'
    },
    {
        label: 'Pending Tasks',
        value: 0,
        icon: 'i-lucide-list-checks',
        permission: 'job-cards.view'
    }
    ])

    const visibleStats = computed(() =>
        stats.value.filter(stat => hasPermission(stat.permission))
    )
</script>

<template>
    <div class="">

        <!-- Welcome -->
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900 ">
                Dashboard
            </h1>

            <p class="mt-1 text-sm text-gray-500 ">
                Welcome back, {{ user?.data?.user?.name }}.
            </p>
        </div>

        <!-- Statistics -->
        <div
            v-if="visibleStats.length"
            class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
            <div
                v-for="stat in visibleStats"
                :key="stat.label"
                class="rounded-xl border border-gray-300 bg-white p-5 shadow-lg"
            >
                <div class="flex items-center justify-between">

                <div>
                    <p class="text-sm text-gray-500 ">
                    {{ stat.label }}
                    </p>

                    <p class="mt-2 text-3xl font-bold text-gray-900 ">
                    {{ stat.value }}
                    </p>
                </div>

                <div class="rounded-lg bg-gray-100 p-3">
                    <Icon
                    :name="stat.icon"
                    class="size-6 text-gray-600"
                    />
                </div>

                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
            <h2 class="text-lg font-semibold text-gray-900 ">
                Quick Actions
            </h2>

            <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <NuxtLink
                    v-if="hasPermission('job-cards.view')"
                    to="/job-cards"
                    class="rounded-xl border border-gray-300 bg-white p-5 shadow-lg transition hover:border-gray-400 hover:shadow-sm   "
                >
                    <Icon
                        name="i-lucide-clipboard-list"
                        class="size-6"
                    />
                    <h3 class="mt-4 font-semibold">
                        Job Cards
                    </h3>

                    <p class="mt-1 text-sm text-gray-500">
                        View and manage workshop jobs.
                    </p>
                </NuxtLink>

                <NuxtLink
                v-if="hasPermission('bays.view')"
                to="/bays"
                class="rounded-xl border border-gray-300 bg-white p-5 shadow-lg transition hover:border-gray-400 hover:shadow-sm   "
                >
                    <Icon
                        name="i-lucide-warehouse"
                        class="size-6"
                    />

                    <h3 class="mt-4 font-semibold">
                        Bays
                    </h3>

                    <p class="mt-1 text-sm text-gray-500">
                        View workshop bay status.
                    </p>
                </NuxtLink>

                <NuxtLink
                v-if="hasPermission('customers.view')"
                to="/customers"
                class="rounded-xl border border-gray-300 bg-white p-5 shadow-lg transition hover:border-gray-400 hover:shadow-sm   "
                >
                    <Icon
                        name="i-lucide-users"
                        class="size-6"
                    />
                    <h3 class="mt-4 font-semibold">
                        Customers
                    </h3>

                    <p class="mt-1 text-sm text-gray-500">
                        View and manage customers.
                    </p>
                </NuxtLink>

                <NuxtLink
                v-if="hasPermission('employees.view')"
                to="/employees"
                class="rounded-xl border border-gray-300 bg-white p-5 shadow-lg transition hover:border-gray-400 hover:shadow-sm   "
                >
                    <Icon
                        name="i-lucide-user-cog"
                        class="size-6"
                    />

                    <h3 class="mt-4 font-semibold">
                        Employees
                    </h3>

                    <p class="mt-1 text-sm text-gray-500">
                        Manage workshop employees.
                    </p>
                </NuxtLink>

            </div>
        </div>

        <!-- Recent Activity -->
        <div class="mt-8 rounded-xl border border-gray-300 bg-white p-5 shadow-lg ">

        <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 ">
            Recent Activity
            </h2>

            <span class="text-sm text-gray-500">
            Coming soon
            </span>
        </div>

        <div class="py-12 text-center">

            <Icon
            name="i-lucide-activity"
            class="mx-auto size-10 text-gray-400"
            />

            <p class="mt-3 text-sm text-gray-500">
            Workshop activity will appear here.
            </p>

        </div>

        </div>

    </div>
</template>