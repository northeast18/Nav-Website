<template>
  <div class="flex justify-between items-center mb-3 px-2">
    <!-- 左侧按钮组 -->
    <div class="flex gap-2">
      <!-- 云同步按钮（仅图标） -->
      <button
        @click="$emit('open-sync')"
        class="glass-button-primary"
        title="云同步"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </button>

      <!-- 主题设置按钮 -->
      <button
        @click="$emit('open-theme')"
        class="glass-button-primary"
        title="主题设置"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>

      <!-- 密码与安全管理按钮 -->
      <button
        @click="$emit('open-password-management')"
        class="glass-button-primary"
        title="密码与安全管理"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button>

      <!-- 编辑分类按钮 -->
      <button
        @click="$emit('toggle-edit')"
        class="glass-button"
        :class="isEditMode
          ? 'bg-gradient-to-r from-primary to-primary-to/80 border-primary/50 text-white hover:shadow-lg hover:shadow-primary/30'
          : 'bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white'"
        :title="isEditMode ? '完成编辑分类' : '编辑分类'"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <!-- 导入书签按钮 -->
      <button
        @click="$emit('open-import')"
        class="glass-button-primary"
        title="导入书签"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </button>

      <!-- 自动匹配图标按钮 -->
      <button
        @click="$emit('auto-fill-icons')"
        class="glass-button-primary"
        :class="{ 'animate-pulse': isAutoFilling }"
        title="自动匹配图标"
      >
        <svg v-if="!isAutoFilling" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <svg v-else class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </button>

      <!-- 添加网站按钮 -->
      <button
        @click="$emit('open-add-website')"
        class="p-1.5 rounded-full transition-all duration-300 border backdrop-blur-md inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 text-white hover:shadow-lg hover:shadow-green-500/30 hover:scale-110"
        title="添加网站"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <!-- 同步状态指示器 -->
    <div v-if="syncStatus" class="text-[10px] sm:text-xs" :class="syncStatus.type === 'success' ? 'text-green-400' : 'text-red-400'">
      {{ syncStatus.message }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  isEditMode: {
    type: Boolean,
    default: false
  },
  syncStatus: {
    type: Object,
    default: null
  },
  isAutoFilling: {
    type: Boolean,
    default: false
  }
})

defineEmits(['open-sync', 'open-theme', 'open-password-management', 'toggle-edit', 'open-import', 'open-add-website', 'auto-fill-icons'])
</script>
