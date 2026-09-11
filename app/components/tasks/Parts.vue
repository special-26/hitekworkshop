<script setup lang="ts">
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

defineProps<{
  parts?: JobCardPart[]
}>()
</script>

<template>
  <div
    v-if="parts?.length"
    class="border-t border-base-300 pt-3"
  >
    <p class="mb-2 text-xs text-base-content/50">
      Parts
    </p>

    <div class="flex flex-wrap gap-2">
      <span
        v-for="part in parts"
        :key="part.id"
        class="badge badge-outline"
      >
        {{ part.part.name }}
        × {{ part.quantity }}
      </span>
    </div>
  </div>
</template>