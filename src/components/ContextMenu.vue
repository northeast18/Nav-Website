<template>
  <teleport to="body">
    <div
      v-if="visible"
      :style="{ left: x + 'px', top: y + 'px' }"
      class="context-menu fixed z-50 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px]"
      @click.stop
    >
      <!-- 主菜单项 -->
      <div
        v-for="(item, index) in items"
        :key="index"
        class="relative"
      >
        <!-- 有子菜单的项 -->
        <div
          v-if="item.submenu"
          class="menu-item flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-purple-600/80 hover:text-white cursor-pointer transition-colors text-sm"
          @mouseenter="showSubmenu(item, index)"
          @mouseleave="hideSubmenu"
        >
          <div class="flex items-center gap-2">
            <component v-if="item.icon" :is="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </div>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>

          <!-- 子菜单 -->
          <div
            v-if="activeSubmenu === index"
            class="submenu absolute left-full top-0 ml-1 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px]"
            @mouseenter="keepSubmenu(index)"
            @mouseleave="hideSubmenu"
          >
            <div
              v-for="(subItem, subIndex) in item.submenu"
              :key="subIndex"
              class="submenu-item px-3 py-2 text-gray-300 hover:bg-purple-600/80 hover:text-white cursor-pointer transition-colors text-sm whitespace-nowrap"
              @click="handleAction(subItem.action)"
            >
              {{ subItem.label }}
            </div>
          </div>
        </div>

        <!-- 普通菜单项 -->
        <div
          v-else
          class="menu-item flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-purple-600/80 hover:text-white cursor-pointer transition-colors text-sm"
          @click="handleAction(item.action)"
        >
          <component v-if="item.icon" :is="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: Boolean,
  x: Number,
  y: Number,
  items: Array
})

const emit = defineEmits(['close'])

const activeSubmenu = ref(-1)
let submenuTimeout = null

// 显示子菜单
const showSubmenu = (item, index) => {
  if (item.submenu) {
    clearTimeout(submenuTimeout)
    activeSubmenu.value = index
  }
}

// 保持子菜单显示
const keepSubmenu = (index) => {
  clearTimeout(submenuTimeout)
  activeSubmenu.value = index
}

// 隐藏子菜单
const hideSubmenu = () => {
  submenuTimeout = setTimeout(() => {
    activeSubmenu.value = -1
  }, 100)
}

// 执行菜单项操作
const handleAction = (action) => {
  if (action && typeof action === 'function') {
    action()
  }
  emit('close')
}

// 监听 visible 变化，添加/移除全局点击监听
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 添加全局点击监听，点击外部关闭菜单
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('contextmenu', handleClickOutside)
    }, 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('contextmenu', handleClickOutside)
  }
})

// 点击外部关闭菜单
const handleClickOutside = () => {
  emit('close')
}

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutside)
})
</script>

<style scoped>
.context-menu {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-item:hover,
.submenu-item:hover {
  animation: none;
}
</style>
