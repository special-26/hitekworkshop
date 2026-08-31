<template>
<div class="navbar bg-base-100 shadow-lg">
  <div class="flex-1">
    <NuxtLink to="/" class="btn btn-ghost text-xl">Hitek Workshop</NuxtLink>
  </div>
  <div class="flex-none">
    <ul class="menu menu-horizontal px-1">
      <template v-if="!isLoggedIn">
          <li><NuxtLink to="/auth/login">Login</NuxtLink></li>
      </template>
      <template v-else>
        <li><NuxtLink to="/auth/dashboard">Dashboard</NuxtLink></li>
        <li>
          <button @click="handleLogout" class="bg-red-700 text-white rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24"><!-- Icon from Sargam Icons by Abhimanyu Rana - https://github.com/planetabhi/sargam-icons/blob/main/LICENSE.txt --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="m18 15l3-3m0 0l-3-3m3 3H7m7 4v2.6a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 18.6V5.4A2.4 2.4 0 0 1 5.4 3h6.2A2.4 2.4 0 0 1 14 5.4V8"/></svg>
          </button>
        </li>
      </template>
    </ul>
  </div>
</div>
</template>

<script setup>
const { isLoggedIn, logout } = useSanctum()

const handleLogout = async () => {
  await logout();
}

const links = ref([
  {
    name: 'Login',
    path: '/auth/login'
  },
  {
    name: 'Dashboard',
    path: '/auth/dashboard'
  }
]);
</script>