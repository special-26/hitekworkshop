<script setup>
import heroImage from "@/assets/hero.png";
import CarImage from "@/assets/home.svg";

</script>

<template>
  <main class="grid lg:grid-cols-2 place-items-center pt-16 pb-8 md:pt-12 md:pb-24 md:px-20 px-5">
    <div class="">
      <h1
        class="md:text-5xl text-3xl lg:text-6xl xl:text-7xl font-bold lg:tracking-tight xl:tracking-tighter">
        Empowering Your Drive, Every Shift
      </h1>
      <p class="text-lg mt-4 text-slate-600 max-w-xl hidden md:block">
        Welcome to your central hub for managing schedules, tracking job cards, and accessing workshop resources. Stay connected with your team, streamline daily repairs, and keep our shop moving forward with precision and speed.
      </p>
      <div class="mt-6 grid grid-cols-2 gap-3">
        <NuxtLink
          to="/auth/login"
          class="flex gap-1 items-center justify-center bg-zinc-900 text-white px-3 py-2 rounded-lg"
          rel="noopener">
          Login
        </NuxtLink>
        <a
          href="https://forms.gle/6g7k1Z3v5x2y8J9F9"
          class="flex gap-1 items-center justify-center border px-3 py-2 rounded-lg"
          target="_blank">
          Singup
        </a>
      </div>
    </div>

    <div class="py-6 md:order-1 ">
      <img :src="CarImage" alt="" class="w-full h-full">
    </div>
  </main>
</template>