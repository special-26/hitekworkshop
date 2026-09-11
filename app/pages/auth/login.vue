<template>
    <main class="h-full flex flex-col items-center justify-center">
        <div class="py-4 px-4 md:px-8">
            <div class="grid items-center gap-6 max-w-6xl w-full lg:grid-cols-2">
                <div class="border border-slate-300 rounded-lg p-6 max-w-md mx-auto shadow-sm md:p-8 lg:mx-0">

                    <div class="mb-8">
                        <h1 class="text-slate-900 text-3xl font-bold mb-4">Sign in</h1>
                        <p class="text-slate-600 text-base leading-relaxed">Sign in to your account to access
                            your dashboard and manage your projects.</p>
                    </div>

                    <form class="space-y-6" @submit.prevent="submitForm">
                        <div>
                            <label for="email"
                                class="mb-2 text-slate-900 font-medium text-sm inline-block">Email</label>
                            <input type="email" id="email" v-model="form.email" name="email" placeholder="john@readymadeui.com" required
                                class="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600" />
                        </div>
                        <div>
                            <label for="password"
                                class="mb-2 text-slate-900 font-medium text-sm inline-block">Password</label>
                            <input type="password" id="password" v-model="form.password" name="password" placeholder="••••••••" required
                                class="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600" />
                        </div>

                        <!-- <div class="flex items-start flex-wrap gap-2">
                            <label class="flex items-center group has-[input:checked]:text-slate-900">
                                <input id="remember" name="remember" type="checkbox" required class="sr-only" />
                                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded outline-1 outline-slate-300 bg-white group-has-[input:checked]:bg-blue-600 group-has-[input:checked]:outline-blue-600 group-focus-within:outline-2 group-focus-within:outline-blue-600" aria-hidden="true">
                                    <svg class="size-3 text-white opacity-0 group-has-[input:checked]:opacity-100"
                                    viewBox="0 0 12 10" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 5l3 3 7-7" />
                                    </svg>
                                </span>
                                <span class="ml-3 text-sm text-slate-700">
                                    Remember me
                                </span>
                            </label>

                            <a href="#"
                                class="ml-auto text-sm font-medium text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                                Forgot password?
                            </a>
                        </div> -->

                        <button type="submit"
                            class="w-full py-2 px-3.5 text-sm rounded-md font-semibold cursor-pointer tracking-wide text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            Sign in</button>

                        <div class="text-slate-900 text-sm text-center">Don't have an account? <a href="#"
                                class="text-blue-700 hover:underline ml-1 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">Sign
                                up</a>
                        </div>
                    </form>
                </div>

                <div class="aspect-[71/50] max-lg:w-4/5 mx-auto">
                    <img :src="loginImage" class="w-full object-cover"
                    alt="login img" />
                </div>
            </div>
        </div>
        </main>
</template>

<script setup>
    definePageMeta({
        middleware: ['$guest'],
    });
    
    const { login, user } = useSanctum();

    import loginImage from "@/assets/integration-illus.webp";

    const form = ref({
        email: 'admin@hitekautomobiles.com',
        password: 'password'
    });

    const submitForm = async () => {
        try {
            await login(form.value)

            const roles = user.value?.data?.roles || []

            if (roles.includes('Mechanic Coordinator')) {
                await navigateTo('/coordinator')
                return
            }

            if (roles.includes('Mechanic')) {
                await navigateTo('/mechanics/tasks')
                return
            }

            await navigateTo('/auth/dashboard')
        } catch (error) {
            console.error('Login failed:', error)
        }
    }

</script>