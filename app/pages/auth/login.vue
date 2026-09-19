<template>
    <main class="h-full w-full flex flex-col items-center justify-center bg-linear-to-r from-orange-400 to-cyan-700">
        <div class="grid items-center max-w-6xl min-h-[calc(100vh-65px)] h-full w-full lg:grid-cols-2">
            <div class="border border-slate-300 rounded-lg p-6 max-w-md mx-auto shadow-sm md:p-8 lg:mx-0 bg-white">

                <div class="mb-8">
                    <h1 class="text-slate-900 text-3xl font-bold mb-4">Sign in</h1>
                    <p class="text-slate-600 text-base leading-relaxed">Sign in to your account to access
                        your dashboard and manage your projects.</p>
                </div>

                <form class="space-y-6" @submit.prevent="submitForm">
                    <div class="flex items-center">
                        <button class="btn text-sm bg-gray-200 border border-gray-300">Login As</button>
                        <select class="select" v-model="form.email">
                            <option disabled selected>Login email</option>
                            <option v-for="email in emails"
                                :value="email.mail">{{ email.name }}</option>
                        </select>
                    </div>
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

            <div class="h-full w-full">
                <img :src="loginImage" class="w-full object-cover h-full"
                alt="login img" />
            </div>
        </div>
    </main>
</template>

<script setup>
    definePageMeta({
        middleware: ['$guest'],
    });
    
    const { login, user } = useSanctum();

    import loginImage from "@/assets/login.avif";

    const form = ref({
        email: 'admin@hitekautomobiles.com',
        password: 'password'
    });

    const emails = ref([
        {'mail': 'admin@hitekautomobiles.com', 'name': 'Admin'},
        {'mail': 'advisor@gmail.com', 'name': 'Advisor'},
        {'mail': 'cordinator@gmail.com', 'name': 'Cordinator'},
        {'mail': 'mechanic@gmail.com', 'name': 'Mechanic'},
        {'mail': 'store@gmail.com', 'name': 'Store Manager'}
    ])

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