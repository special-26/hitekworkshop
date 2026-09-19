<script setup lang="ts">
interface User {
  name: string;
}

const user = useCurrentUser<User>();

interface Customer {
  id: number
  customer_code: string
  name: string
  phone: string
}

interface Vehicle {
  id: number
  customer_id: number
  registration_number: string
  make: string
  model: string
  variant?: string | null
}

interface JobCard {
  id: number
  job_card_number: string
  customer: Customer
  vehicle: Vehicle
  complaint?: string | null
}

interface Department {
  id: number
  name: string
}

interface Bay {
  id: number
  name: string
  code: string
  type: string
}

interface JobCardPart {
  id: number
  part_id: number
  quantity: string | number
  status: 'pending' | 'issued' | 'returned' | 'cancelled'
  part: {
    id: number
    part_number: string
    name: string
    category?: string | null
    brand?: string | null
    unit: string
  }
}

interface MechanicTask {
  id: number
  job_card_id: number
  department_id: number
  bay_id?: number | null
  assigned_to: number
  title: string
  description?: string | null
  status: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  estimated_minutes?: number | null
  actual_minutes?: number | null
  labour_cost?: string | number | null
  started_at?: string | null
  completed_at?: string | null
  notes?: string | null

  job_card: JobCard
  department: Department
  bay?: Bay | null
  parts?: JobCardPart[]
}

const api = useApi()

const tasks = ref<MechanicTask[]>([])
const loading = ref(true)
const error = ref('')

const fetchTasks = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api('/api/admin/mechanic/tasks')

    console.log(response)

    const data = response.data

    tasks.value = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : []
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load your tasks.'
  } finally {
    loading.value = false
  }
}

const statusClass = (status: MechanicTask['status']) => {
  switch (status) {
    case 'assigned':
      return 'badge-info'

    case 'in_progress':
      return 'badge-success'

    case 'on_hold':
      return 'badge-warning'

    case 'completed':
      return 'badge-success'

    case 'cancelled':
      return 'badge-error'

    default:
      return 'badge-ghost'
  }
}

const statusLabel = (status: MechanicTask['status']) => {
  return status.replace('_', ' ')
}

onMounted(fetchTasks)
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Dashboard
          {{ user?.data?.user?.name ? `- ${user.data.user.name}` : '' }} 
        </h1>

        <p class="text-sm text-base-content/60">
          Tasks assigned to you
        </p>

      </div>

      <div class="flex items-center justify-center gap-10">
        <NotificationsBell />   
        
        <button
          class="btn btn-outline btn-sm"
          :disabled="loading"
          @click="fetchTasks"
        >
          Refresh
        </button>
      </div>
      
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="alert alert-error mb-6"
    >
      <span>{{ error }}</span>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex justify-center py-12"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="tasks.length === 0"
      class="card border border-base-300 bg-base-200"
    >
      <div class="card-body items-center py-12 text-center">
        <h2 class="text-lg font-semibold">
          No tasks assigned
        </h2>

        <p class="text-sm text-base-content/60">
          You currently don't have any tasks assigned to you.
        </p>
      </div>
    </div>

    <!-- Tasks -->
    <div
      v-else
      class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <div
        v-for="task in tasks"
        :key="task.id"
        class="card border border-base-300 bg-base-200 shadow-sm"
      >
        <div class="card-body">
          <!-- Job card -->
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-xs text-base-content/50">
                Job Card
              </div>

              <div class="font-semibold">
                {{ task.job_card.job_card_number }}
              </div>
            </div>

            <span
              class="badge badge-sm capitalize"
              :class="statusClass(task.status)"
            >
              {{ statusLabel(task.status) }}
            </span>
          </div>

          <!-- Vehicle -->
          <div class="mt-2">
            <div class="font-medium">
              {{ task.job_card.vehicle.registration_number }}
            </div>

            <div class="text-sm text-base-content/60">
              {{ task.job_card.vehicle.make }}
              {{ task.job_card.vehicle.model }}
              <span v-if="task.job_card.vehicle.variant">
                · {{ task.job_card.vehicle.variant }}
              </span>
            </div>
          </div>

          <div class="divider my-1" />

          <!-- Task -->
          <div>
            <div class="font-semibold">
              {{ task.title }}
            </div>

            <p
              v-if="task.description"
              class="mt-1 line-clamp-2 text-sm text-base-content/60"
            >
              {{ task.description }}
            </p>
          </div>

          <!-- Assignment -->
          <div class="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-xs text-base-content/50">
                Department
              </div>

              <div>
                {{ task.department?.name || '—' }}
              </div>
            </div>

            <div>
              <div class="text-xs text-base-content/50">
                Bay
              </div>

              <div>
                {{ task.bay?.name || 'Not assigned' }}
              </div>
            </div>
          </div>

          <!-- Time -->
          <div
            v-if="task.estimated_minutes"
            class="mt-2 text-sm text-base-content/60"
          >
            Estimated:
            <span class="font-medium text-base-content">
              {{ task.estimated_minutes }} min
            </span>
          </div>

          <!-- Parts -->
          <div
            v-if="task.parts?.length"
            class="mt-3 rounded-lg bg-base-300 p-3"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium">
                Parts
              </span>

              <span class="badge badge-sm">
                {{ task.parts.length }}
              </span>
            </div>

            <div class="space-y-2">
              <div
                v-for="part in task.parts"
                :key="part.id"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <div class="min-w-0">
                  <div class="truncate font-medium">
                    {{ part.part.name }}
                  </div>

                  <div class="text-xs text-base-content/50">
                    {{ part.part.part_number }}
                  </div>
                </div>

                <div class="shrink-0 text-right">
                  <div class="font-medium">
                    {{ part.quantity }} {{ part.part.unit }}
                  </div>

                  <div
                    class="text-xs capitalize"
                    :class="
                      part.status === 'issued'
                        ? 'text-success'
                        : part.status === 'returned'
                          ? 'text-warning'
                          : part.status === 'cancelled'
                            ? 'text-error'
                            : 'text-base-content/50'
                    "
                  >
                    {{ part.status }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action -->
          <div class="card-actions mt-4">
            <NuxtLink
              :to="`/mechanics/tasks/${task.id}`"
              class="btn btn-primary btn-sm w-full"
            >
              View Task
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>