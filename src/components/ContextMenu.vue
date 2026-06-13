<template>
  <teleport to="body">
    <div
      v-if="visible"
      ref="mainMenuRef"
      :style="{ 
        left: adjustedX + 'px', 
        top: adjustedY + 'px',
        visibility: isPositioned ? 'visible' : 'hidden'
      }"
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
          class="menu-item flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-primary/80 hover:text-white cursor-pointer transition-colors text-sm"
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
            ref="submenuRef"
            :style="submenuStyles"
            class="submenu absolute bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px]"
            @mouseenter="keepSubmenu(index)"
            @mouseleave="hideSubmenu"
          >
            <div
              v-for="(subItem, subIndex) in item.submenu"
              :key="subIndex"
              class="submenu-item px-3 py-2 text-gray-300 hover:bg-primary/80 hover:text-white cursor-pointer transition-colors text-sm whitespace-nowrap"
              @click="handleAction(subItem.action)"
            >
              {{ subItem.label }}
            </div>
          </div>
        </div>

        <!-- 普通菜单项 -->
        <div
          v-else
          class="menu-item flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-primary/80 hover:text-white cursor-pointer transition-colors text-sm"
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
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  visible: Boolean,
  x: Number,
  y: Number,
  items: Array
})

const emit = defineEmits(['close'])

const activeSubmenu = ref(-1)
let submenuTimeout = null

// 主菜单定位相关
const mainMenuRef = ref(null)
const isPositioned = ref(false)
const adjustedX = ref(0)
const adjustedY = ref(0)

// 子菜单定位和样式相关
const submenuRef = ref(null)
const submenuStyles = ref({})

// 调整主菜单位置，防止溢出屏幕
const adjustMainMenuPosition = async () => {
  if (!props.visible) {
    isPositioned.value = false
    activeSubmenu.value = -1
    return
  }

  adjustedX.value = props.x
  adjustedY.value = props.y

  await nextTick()

  if (mainMenuRef.value) {
    const rect = mainMenuRef.value.getBoundingClientRect()
    const winWidth = window.innerWidth
    const winHeight = window.innerHeight

    // 如果右侧溢出
    if (props.x + rect.width > winWidth) {
      adjustedX.value = Math.max(10, winWidth - rect.width - 10)
    }

    // 如果底部溢出
    if (props.y + rect.height > winHeight) {
      adjustedY.value = Math.max(10, winHeight - rect.height - 10)
    }

    isPositioned.value = true
  }
}

// 监听菜单显示状态和坐标变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    adjustMainMenuPosition()
    // 添加全局点击监听，点击外部关闭菜单
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('contextmenu', handleClickOutside)
    }, 0)
  } else {
    isPositioned.value = false
    activeSubmenu.value = -1
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('contextmenu', handleClickOutside)
  }
})

watch(() => [props.x, props.y], () => {
  if (props.visible) {
    adjustMainMenuPosition()
  }
})

// 监听子菜单展示并计算位置
watch(activeSubmenu, async (newIndex) => {
  if (newIndex === -1) {
    submenuStyles.value = {}
    return
  }

  // 初始默认样式：向右展开，顶部对齐，限制最大高度，允许滚动
  submenuStyles.value = {
    left: '100%',
    right: 'auto',
    top: '0px',
    marginLeft: '4px',
    marginRight: '0px',
    maxHeight: 'min(380px, calc(100vh - 40px))',
    overflowY: 'auto'
  }

  await nextTick()

  const el = Array.isArray(submenuRef.value) ? submenuRef.value[0] : submenuRef.value

  if (el) {
    const rect = el.getBoundingClientRect()
    const winWidth = window.innerWidth
    const winHeight = window.innerHeight

    let newStyles = { ...submenuStyles.value }

    // 1. 水平防溢出：如果子菜单右侧溢出屏幕，则改为向左展开
    if (rect.right > winWidth) {
      newStyles.left = 'auto'
      newStyles.right = '100%'
      newStyles.marginLeft = '0px'
      newStyles.marginRight = '4px'
    }

    // 2. 垂直防溢出：如果子菜单底部溢出屏幕，则向上平移
    if (rect.bottom > winHeight) {
      const overflow = rect.bottom - winHeight
      const parentRect = el.parentElement.getBoundingClientRect()
      const maxMoveUp = parentRect.top - 10 // 距离屏幕顶部保留10px
      const moveUp = Math.max(0, Math.min(overflow + 10, maxMoveUp))

      newStyles.top = `-${moveUp}px`
    }

    submenuStyles.value = newStyles
  }
})

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

/* 自定义子菜单滚动条样式 */
.submenu::-webkit-scrollbar {
  width: 5px;
}
.submenu::-webkit-scrollbar-track {
  background: transparent;
}
.submenu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 99px;
}
.submenu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
