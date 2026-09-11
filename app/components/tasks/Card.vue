<script setup lang="ts">
defineProps<{
  task: {
    id: number
    title: string
    description?: string | null
    status:
      | 'pending'
      | 'assigned'
      | 'in_progress'
      | 'on_hold'
      | 'completed'
      | 'cancelled'
    estimated_minutes?: number | null
    started_at?: string | null

    job_card: {
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

    parts?: any[]
  }
}>()

interface TaskCardTask {
  id: number
  title: string
  status:
    | 'pending'
    | 'assigned'
    | 'in_progress'
    | 'on_hold'
    | 'completed'
    | 'cancelled'

  estimated_minutes?: number | null
  started_at?: string | null

  job_card: {
    job_card_number: string

    vehicle: {
      registration_number: string
      make: string
      model: string
      variant?: string | null
    }
  }

  bay?: {
    name: string
  } | null

  assigned_employee?: {
    user?: {
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

</script>

<template>
  <NuxtLink
    :to="`/coordinator/tasks/${task.id}`"
    class="card border border-base-300 bg-base-200 shadow-sm transition hover:shadow-md"
  >
    <div class="card-body shadow-lg border border-gray-300 rounded-xl">

        <!-- Header -->
        <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
                <p class="text-lg font-bold">
                    {{ task.job_card.job_card_number }}
                </p>

                <h3 class="font-semibold">
                    {{ task.title }}
                </h3>
                <p
                  v-if="task.description"
                  class="mt-1 text-sm text-base-content/60"
                >
                  {{ task.description }}
                </p>
            </div>
            <TasksStatusBadge :status="task.status" />
        </div>

        <div class="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <!-- Vehicle -->
            <div>
                <p class="text-sm font-medium">
                  {{ task.job_card.vehicle.registration_number }}
                </p>

                <p class="text-xs text-base-content/50">
                  {{ task.job_card.vehicle.make }}
                  {{ task.job_card.vehicle.model }}
                  <span v-if="task.job_card.vehicle.variant">
                    · {{ task.job_card.vehicle.variant }}
                  </span>
                </p>

                <p class="mt-1 text-xs text-base-content/50">
                  {{ task.department.name }}
                </p>
            </div>

            <!-- Assignment -->
            <TasksAssignment
              :bay="task.bay"
              :assigned-employee="task.assigned_employee"
            />

            <!-- Time -->
            <TasksTime
                :status="task.status"
                :started-at="task.started_at"
                :estimated-minutes="task.estimated_minutes"
            />
        </div>

        <!-- Parts -->
        <TasksParts :parts="task.parts" />

    </div>
  
  </NuxtLink>
</template>