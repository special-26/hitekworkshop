<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  width?: string
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: 'max-w-lg',
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const close = () => {
  emit('update:modelValue', false)
}

const handleBackdrop = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('keydown', handleKeydown)
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <!-- 
      todo: make close at click outside by adding 
      * @click.self="handleBackdrop"
    -->
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <!-- Modal -->
      <div
        class="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-gray-300 bg-gray-100 shadow-2xl"
        :class="width"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div
          v-if="title || $slots.header"
          class="flex shrink-0 items-center justify-between border-b border-gray-300 px-5 py-4"
        >
          <slot name="header">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ title }}
            </h3>
          </slot>

          <button
            type="button"
            class="btn btn-ghost btn-sm btn-circle"
            aria-label="Close"
            @click="close"
          >
            <Icon
              name="lucide:x"
              class="size-5"
            />
          </button>
        </div>

        <!-- Body -->
        <div class="min-h-0 overflow-y-auto">
          <slot />
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="shrink-0 border-t border-gray-300 px-5 py-4"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>