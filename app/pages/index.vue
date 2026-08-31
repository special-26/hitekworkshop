<script setup>
import heroImage from "@/assets/hero.png";

</script>

<template>
  <main class="grid lg:grid-cols-2 place-items-center pt-16 pb-8 md:pt-12 md:pb-24 px-20">
    <div class="py-6 md:order-1 hidden md:block">
      <img :src="heroImage" alt="" class="w-full h-full">
    </div>
    <div>
      <h1
        class="text-5xl lg:text-6xl xl:text-7xl font-bold lg:tracking-tight xl:tracking-tighter">
        Marketing website done with Astro
      </h1>
      <p class="text-lg mt-4 text-slate-600 max-w-xl">
        Astroship is a starter template for startups, marketing websites & landing
        pages.<wbr /> Built with Astro.build and TailwindCSS. You can quickly create
        any website with this starter.
      </p>
      <div class="mt-6 flex flex-col sm:flex-row gap-3">
        <a
          href="#"
          target="_blank"
          class="flex gap-1 items-center justify-center bg-zinc-900 text-white px-3 py-2 rounded-lg"
          rel="noopener">
          Download for Free
        </a>
        <a
          size="lg"
          style="outline"
          rel="noopener"
          href="https://github.com/surjithctly/astroship"
          class="flex gap-1 items-center justify-center border px-3 py-2 rounded-lg"
          target="_blank">
          GitHub Repo
        </a>
      </div>
    </div>
  </main>
</template>