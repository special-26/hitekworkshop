<script setup lang="ts">
const props = defineProps<{
  status?: string | null
  startedAt?: string | null
  estimatedMinutes?: number | null
}>()

const currentTime = ref(Date.now())

let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = Date.now()
  }, 60000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const elapsedTime = computed(() => {
  if (!props.startedAt) {
    return 'Not started'
  }

  const started = new Date(props.startedAt).getTime()
  const minutes = Math.max(
    0,
    Math.floor((currentTime.value - started) / 60000)
  )

  if (minutes < 1) {
    return 'Just started'
  }

  if (minutes < 60) {
    return `${minutes} min running`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes
    ? `${hours}h ${remainingMinutes}m running`
    : `${hours}h running`
})

const isOverdue = computed(() => {
  if (
    props.status !== 'in_progress' ||
    !props.startedAt ||
    !props.estimatedMinutes
  ) {
    return false
  }

  const started = new Date(props.startedAt).getTime()

  const elapsedMinutes = Math.floor(
    (currentTime.value - started) / 60000
  )

  return elapsedMinutes > props.estimatedMinutes
})
</script>

<template>
  <div>
    <p class="text-xs text-base-content/50">
      Time
    </p>

    <p
      class="font-medium"
      :class="{
        'text-error': isOverdue,
      }"
    >
      {{ elapsedTime }}
    </p>

    <p
      v-if="estimatedMinutes"
      class="text-xs"
      :class="
        isOverdue
          ? 'text-error'
          : 'text-base-content/50'
      "
    >
      Est. {{ estimatedMinutes }} min
    </p>

    <p
      v-if="isOverdue"
      class="text-xs font-semibold text-error"
    >
      Overdue
    </p>
  </div>
</template>