<script setup lang="ts">
const colorMode = useColorMode()
const user = useCurrentUser();
const { hasPermission } = usePermissions()

const navigation = [
  {
    label: 'Dashboard',
    to: '/auth/dashboard',
    icon: 'i-lucide-layout-dashboard',
    permission: 'dashboard.view'
  },
  {
    label: 'Job Cards',
    to: '/job-cards',
    icon: 'i-lucide-clipboard-list',
    permission: 'job-cards.view'
  },
  {
    label: 'Bays',
    to: '/bays',
    icon: 'i-lucide-warehouse',
    permission: 'bays.view'
  },
  {
    label: 'Customers',
    to: '/customers',
    icon: 'i-lucide-users',
    permission: 'customers.view'
  },
  {
    label: 'Vehicles',
    to: '/vehicles',
    icon: 'i-lucide-car',
    permission: 'vehicles.view'
  },
  {
    label: 'Employees',
    to: '/employees',
    icon: 'i-lucide-user-cog',
    permission: 'employees.view'
  },
  {
    label: 'Departments',
    to: '/departments',
    icon: 'i-lucide-network',
    permission: 'employees.view'
  },
  {
    label: 'Roles',
    to: '/roles',
    icon: 'i-lucide-shield-check',
    permission: 'roles.view'
  },
  {
    label: 'Parts',
    to: '/',
    icon: 'i-lucide-package',
    permission: 'parts.view'
  },
  {
    label: 'Inventory',
    to: '/',
    icon: 'i-lucide-box',
    permission: 'inventory.view'
  }
]

const visibleNavigation = computed(() =>
  navigation.filter(item => hasPermission(item.permission))
)

const isSidebarOpen = ref(false)

const logout = async () => {
  const { logout } = useSanctum()

  await logout()

  await navigateTo('/auth/login')
}
</script>

<template>
  <div class="min-h-screen">

    <!-- Mobile overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="isSidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-300 bg-white transition-transform lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >

      <!-- Logo -->
      <div class="flex h-16 items-center border-b border-gray-300 px-6">
        <NuxtLink
          to="/dashboard"
          class="text-xl font-bold text-gray-900"
        >
          HITEK
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-4 text-gray-900">

        <div class="space-y-1">

          <NuxtLink
            v-for="item in visibleNavigation"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
            active-class="bg-gray-300 text-gray-900 font-bold"
            @click="isSidebarOpen = false"
          >
            <Icon
              :name="item.icon"
              class="size-5"
            />

            <span>
              {{ item.label }}
            </span>
          </NuxtLink>

        </div>

      </nav>


      <!-- User section -->
      <div class="border-t border-gray-300 p-4">


        <div class="mb-3 px-2">
          <p class="truncate text-sm font-medium text-gray-900">
            {{ user?.data?.user?.name }}
          </p>

          <p class="truncate text-xs text-gray-500">
            {{ user?.data?.roles?.join(', ') }}
          </p>
        </div>

        <button
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 bg-red-100 border border-red-300"
          @click="logout"
        >
          <Icon
            name="i-lucide-log-out"
            class="size-5"
          />

          Logout
        </button>

      </div>

    </aside>

    <!-- Main area -->
    <div class="lg:pl-64">

      <!-- Header -->
      <header
        class="sticky top-0 z-30 flex h-16 items-center border-b border-gray-300 bg-white/95 px-4 backdrop-blur sm:px-6"
      >

        <!-- Mobile menu -->
        <button
          class="mr-4 rounded-lg p-2 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          @click="isSidebarOpen = true"
        >
          <Icon
            name="i-lucide-menu"
            class="size-6"
          />
        </button>

        <div class="flex-1">
          <slot name="header" />
        </div>

      </header>

      <!-- Page content -->
      <main class="p-4 sm:p-6 lg:p-8 bg-white min-h-[calc(100vh-64px)]">
        <slot />
      </main>

    </div>

  </div>
</template>