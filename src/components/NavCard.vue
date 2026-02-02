<template>
  <div
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    class="group relative flex flex-col items-center justify-center py-1.5 sm:py-2 px-0 rounded-xl border transition-all duration-500 cursor-pointer h-full overflow-hidden"
    :class="[
      isFavorite ? 'bg-gradient-to-br from-primary/40 to-secondary/40 border-primary/50 shadow-lg shadow-primary/20' : 'bg-white/40 dark:bg-gray-900/60 border-black/5 dark:border-white/10 hover:border-primary/50',
      'hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/30'
    ]"
  >
    <!-- 动态背景光效 -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/0 via-secondary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-secondary/10 group-hover:to-primary/10 transition-all duration-700"></div>

    <!-- 收藏标记 -->
    <button
      @click.stop="toggleFavorite"
      class="absolute top-0.5 right-0.5 z-10 p-0.5 rounded-full transition-all duration-300"
      :class="isFavorite ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-60 group-hover:scale-100 hover:opacity-100'"
    >
      <svg
        class="w-3 h-3 transition-all duration-300"
        :class="isFavorite ? 'fill-primary text-primary scale-110 drop-shadow-[0_0_8px_rgb(var(--primary-from)/0.8)]' : 'fill-none text-gray-400 hover:text-primary'"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </button>

    <!-- 图标容器 -->
    <div class="relative mb-1.5 sm:mb-2">
      <!-- 图标光晕效果 -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-100"></div>

      <div class="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
        <!-- 显示图片 -->
        <img
          v-if="!imageLoadError"
          :src="iconSrc"
          @error="handleImageError"
          class="h-full w-full object-contain rounded-xl drop-shadow-lg transition-all duration-300"
          :class="{ 'invert brightness-0 opacity-90': item.darkIcon }"
          alt="icon"
        />

        <!-- 图片挂了显示这个 SVG 地球 -->
        <div v-else class="h-full w-full flex items-center justify-center rounded-xl bg-gray-100/50 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500 group-hover:text-primary transition-all duration-300 border border-black/5 dark:border-white/5 group-hover:border-primary/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 文字部分 -->
    <div class="text-center w-full px-0 relative z-10">
      <h3 class="text-[10px] sm:text-xs font-semibold text-text-primary tracking-wide transition-colors truncate leading-tight mb-0.5" :class="{ 'text-primary': isFavorite }">
        {{ item.name }}
      </h3>
      <p class="text-[8px] sm:text-[9px] text-text-secondary line-clamp-1 transition-colors leading-tight">
        {{ item.desc }}
      </p>

      <!-- 最后访问时间 -->
      <div v-if="lastVisitTime" class="mt-1 flex items-center justify-center gap-0.5 text-[7px] text-text-secondary/70 group-hover:text-primary/80 transition-colors">
        <svg class="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ lastVisitTime }}</span>
      </div>
    </div>

    <!-- 悬停时的边框光效 -->
    <div class="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/30 transition-all duration-500 pointer-events-none"></div>

    <!-- 弹窗部分 -->
    <div v-if="showModal" class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl" @click.stop>
      <div class="bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/10 rounded-2xl shadow-2xl p-2 transform transition-all" @click.stop>
        <div class="relative z-10 flex items-center gap-1">
          <a
            :href="item.lanUrl"
            target="_blank"
            @click="handleLinkClick"
            class="group/btn flex items-center justify-center p-2 rounded-xl bg-gray-700/40 hover:bg-primary/80 transition-all duration-300 border border-white/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/30"
            title="内网地址"
          >
            <svg class="w-5 h-5 text-primary group-hover/btn:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </a>

          <a
            :href="item.url"
            target="_blank"
            @click="handleLinkClick"
            class="group/btn flex items-center justify-center p-2 rounded-xl bg-gray-700/40 hover:bg-secondary/80 transition-all duration-300 border border-white/5 hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/30"
            title="外网地址"
          >
            <svg class="w-5 h-5 text-secondary group-hover/btn:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  item: Object,
  onClick: Function,
  isFavorite: {
    type: Boolean,
    default: false
  },
  lastVisit: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['toggle-favorite', 'record-visit', 'contextmenu'])

const showModal = ref(false)
const imageLoadError = ref(false)

const handleClick = () => {
  if (props.item.lanUrl) {
    showModal.value = true
  } else {
    // 记录点击并打开链接
    if (props.onClick) {
      props.onClick(props.item)
    }
    emit('record-visit', props.item)
    window.open(props.item.url, '_blank')
  }
}

const handleLinkClick = () => {
  // 记录点击并关闭弹窗
  if (props.onClick) {
    props.onClick(props.item)
  }
  emit('record-visit', props.item)
  showModal.value = false
}

const toggleFavorite = () => {
  emit('toggle-favorite', props.item)
}

const handleContextMenu = (event) => {
  // 发送右键菜单事件到父组件
  emit('contextmenu', { event, item: props.item })
}

const iconSrc = computed(() => {
  // 1. 优先用手动填的链接
  if (props.item.iconUrl) return props.item.iconUrl

  // 2. 自动抓取：尝试使用 unavatar.io
  try {
    let domain = props.item.url
    if (!domain.startsWith('http')) domain = 'https://' + domain
    const hostname = new URL(domain).hostname

    return `https://unavatar.io/${hostname}`
  } catch (e) {
    return ''
  }
})

const lastVisitTime = computed(() => {
  if (!props.lastVisit) return null

  const now = new Date()
  const visit = new Date(props.lastVisit)
  const diff = now - visit

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return null
})

const handleImageError = () => {
  imageLoadError.value = true
}
</script>
