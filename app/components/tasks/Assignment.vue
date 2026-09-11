<script setup lang="ts">
defineProps<{
  bay?: {
    id: number
    name: string
    code: string
    type: string
  } | null

  assignedEmployee?: {
    id: number
    employee_code: string
    user?: {
      id: string
      name: string
    } | null
  } | null
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3 text-sm">
    <div>
      <p class="text-xs text-base-content/50">
        Bay
      </p>

      <p class="font-medium">
        {{ bay?.name || 'Not assigned' }}
      </p>
    </div>

    <div>
      <p class="text-xs text-base-content/50">
        Mechanic
      </p>

      <p class="font-medium">
        {{ assignedEmployee?.user?.name || 'Not assigned' }}
      </p>
    </div>
  </div>
</template>