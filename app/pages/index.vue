<script setup>
import landing from "@/assets/landing.webp";

</script>

<template>
  <main class="relative">
    <div class="">
      <img :src="landing" alt="" class="w-full min-h-[calc(100vh-64px)] h-full object-cover md:object-left object-right">
    </div>
    <div class="absolute flex items-center justify-center left-0 right-0 bottom-20">
      <NuxtLink 
        to="/auth/login" 
        class="box-border relative z-30 inline-flex items-center justify-center w-auto px-8 py-3 overflow-hidden font-bold text-white transition-all duration-300 bg-gray-600 rounded-md cursor-pointer group ring-offset-2 ring-1 ring-gray-300 ring-offset-gray-200 hover:ring-offset-gray-500 ease focus:outline-none">
        <span class="absolute bottom-0 right-0 w-8 h-20 -mb-8 -mr-5 transition-all duration-300 ease-out transform rotate-45 translate-x-1 bg-white opacity-10 group-hover:translate-x-0"></span>
        <span class="absolute top-0 left-0 w-20 h-8 -mt-1 -ml-12 transition-all duration-300 ease-out transform -rotate-45 -translate-x-1 bg-white opacity-10 group-hover:translate-x-0"></span>
        <span class="relative z-20 flex items-center text-xl">
            <svg class="relative w-8 h-8 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Login Now
        </span>
      </NuxtLink>
    </div>
  </main>
</template>