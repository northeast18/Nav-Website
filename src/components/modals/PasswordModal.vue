<template>
  <BaseModal :show="show" title="验证管理员身份" @close="$emit('close')" :z-index="zIndex">
    <div class="mb-6 relative">
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :type="showPassword ? 'text' : 'password'"
        class="glass-input pr-12"
        placeholder="请输入管理员密码"
        @keyup.enter="$emit('confirm')"
        ref="passwordInputRef"
      >
      <button 
        @click="showPassword = !showPassword"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
        type="button"
      >
        <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </div>

    <div class="flex gap-3">
      <button @click="$emit('close')" class="btn-action-cancel">取消</button>
      <button @click="$emit('confirm')" class="btn-action-primary">确认</button>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BaseModal from './BaseModal.vue'

defineProps({
  show: Boolean,
  modelValue: String,
  zIndex: {
    type: String,
    default: 'z-50'
  }
})

defineEmits(['close', 'confirm', 'update:modelValue'])

const showPassword = ref(false)
const passwordInputRef = ref(null)

onMounted(() => {
  if (passwordInputRef.value) {
    passwordInputRef.value.focus()
  }
})
</script>