<script setup lang="ts">
interface Props {
  status:
    | 'pending'
    | 'assigned'
    | 'in_progress'
    | 'on_hold'
    | 'completed'
    | 'cancelled'
}

defineProps<Props>()
</script>

<template>
  <span
    class="badge"
    :class="{
      'badge-neutral': status === 'pending',
      'badge-primary': status === 'assigned',
      'badge-info': status === 'in_progress',
      'badge-warning': status === 'on_hold',
      'badge-success': status === 'completed',
      'badge-error': status === 'cancelled',
    }"
  >
    {{
      status === 'in_progress'
        ? 'In Progress'
        : status === 'on_hold'
          ? 'On Hold'
          : status.charAt(0).toUpperCase() + status.slice(1)
    }}
  </span>
</template>