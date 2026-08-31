<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" :class="zIndex" @click.self="closeModal">
    <div class="fixed inset-0 bg-black/70 backdrop-blur-md pointer-events-none"></div>
    
    <div class="glass-modal my-auto max-h-[90dvh] sm:max-h-[85dvh] flex flex-col" :class="maxWidthClass">
      <!-- 光效背景 -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-to/5 rounded-2xl sm:rounded-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col max-h-full min-h-0">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">
          <h3 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <slot name="icon">
              <span class="w-1 h-6 bg-gradient-to-b from-primary to-primary-to rounded-full shadow-lg shadow-primary/50"></span>
            </slot>
            {{ title }}
          </h3>
          <button @click="closeModal" class="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto flex-1 min-h-0 pr-1 -mr-1 custom-scrollbar">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  maxWidth: {
    type: String,
    default: 'max-w-md' // e.g. max-w-sm, max-w-md, max-w-lg
  },
  zIndex: {
    type: String,
    default: 'z-50'
  }
})

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}

const maxWidthClass = computed(() => {
  return props.maxWidth
})
</script>