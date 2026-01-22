<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex flex-col">
    
    <!-- ✅ 这里是你的星空背景图 (bg.jpg 必须在 public 文件夹内) -->
    <!-- mix-blend-overlay 让图片和底下的紫色混合，效果更梦幻 -->
    <div class="fixed inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay pointer-events-none"></div>
    
    <!-- 这一层是加深遮罩，防止背景太亮导致文字看不清 -->
    <div class="fixed inset-0 bg-black/10 pointer-events-none"></div>
    
    <div class="relative z-10 flex-1 flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4">
      
      <!-- 1. 顶部导航栏 -->
      <header class="w-full max-w-6xl mb-6 sm:mb-8 z-20 relative">
        <nav class="flex justify-center">
          <div class="flex flex-wrap justify-center gap-2 sm:gap-3 pb-2">
            <button
              @click="activeCategory = 'frequent'"
              class="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border backdrop-blur-md"
              :class="activeCategory === 'frequent'
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30'"
            >
              常用
            </button>
            <button
              v-for="(item, index) in navItems"
              :key="index"
              @click="activeCategory = item.category"
              class="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border backdrop-blur-md"
              :class="activeCategory === item.category
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30'"
            >
              {{ item.category }}
            </button>
          </div>
        </nav>
      </header>

      <!-- 2. 搜索框 -->
      <div class="relative w-full max-w-2xl mx-auto mb-8 sm:mb-10 group z-50 px-2">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl opacity-30 blur transition duration-1000 group-hover:opacity-75 group-hover:duration-200"></div>
        <div class="relative flex items-center bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 transition-colors focus-within:bg-gray-800/90 focus-within:border-white/20">
          <div class="relative">
            <button
              @click.stop="showEngineList = !showEngineList"
              class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg sm:rounded-xl transition-all"
            >
              <span class="font-bold text-purple-400 text-xs sm:text-sm">{{ currentEngine.name }}</span>
              <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div v-if="showEngineList" class="absolute top-full left-0 mt-2 w-32 bg-gray-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
              <div
                v-for="(engine, index) in searchEngines"
                :key="index"
                @click="switchEngine(engine)"
                class="px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-purple-600 hover:text-white text-gray-400 text-xs sm:text-sm transition-colors"
                :class="{'text-white bg-white/10': currentEngine.name === engine.name}"
              >
                {{ engine.name }}
              </div>
            </div>
          </div>
          <input
            v-model="searchQuery"
            @keypress.enter="handleSearch"
            type="text"
            :placeholder="`在 ${currentEngine.name} 中搜索...`"
            class="flex-1 w-full bg-transparent text-white placeholder-gray-500 px-2 sm:px-4 py-1.5 sm:py-2 focus:outline-none text-sm sm:text-base"
          />
          <button
            @click="handleSearch"
            class="hidden sm:flex px-4 sm:px-6 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all font-medium items-center gap-2 shadow-lg shadow-purple-900/20 text-sm"
          >
            搜索
          </button>
        </div>
      </div>
      <div v-if="showEngineList" @click="showEngineList = false" class="fixed inset-0 z-40 bg-transparent cursor-default"></div>

      <!-- 3. 内容网格 -->
      <div v-if="filteredItems.length > 0" class="w-full max-w-[72rem] grid grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-2 px-4 pb-10 mx-auto">
        <NavCard
          v-for="item in filteredItems"
          :key="item.id || item.url"
          :item="item"
          :on-click="recordClick"
        />
      </div>
    </div>

    <!-- 4. 底部 Footer (修改了这里) -->
    <footer class="relative z-10 w-full py-6 text-center">
      <div class="flex items-center justify-center gap-4 text-sm text-gray-500">
        <!-- 友情链接按钮 -->
        <button 
          @click="showFriendModal = true"
          class="flex items-center gap-1 hover:text-purple-400 transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
          友情链接
        </button>
        
        <span class="opacity-30">|</span>
        
        <!-- 版权文字 (改成了你的私人导航) -->
        <span>Copyright © 2025 <span class="text-gray-300">我的私人导航</span></span>
      </div>
    </footer>

    <!-- 5. 友情链接弹窗 (新增) -->
    <div v-if="showFriendModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showFriendModal = false">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div class="relative bg-gray-800/90 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-2xl transform transition-all animate-in fade-in zoom-in duration-200">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="w-1 h-6 bg-purple-500 rounded-full"></span>
            友情链接
          </h3>
          <button @click="showFriendModal = false" class="text-gray-400 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <a 
            v-for="(link, index) in friendLinks" 
            :key="index"
            :href="link.url"
            target="_blank"
            class="flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all group"
          >
            <img 
              :src="getIconSrc(link)" 
              @error="handleImageError"
              class="w-10 h-10 rounded-lg mb-2 object-contain"
            />
            <span class="text-sm text-gray-300 group-hover:text-white">{{ link.name }}</span>
          </a>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// ✅ 引入 friendLinks
import { navItems, searchEngines, friendLinks } from './data'
import NavCard from './components/NavCard.vue'

// === 状态定义 ===
const activeCategory = ref('frequent')
const searchQuery = ref('')
const showEngineList = ref(false)
const showFriendModal = ref(false) // 控制友链弹窗
const currentEngine = ref(searchEngines[0])

// === 点击统计 ===
const DATA_VERSION = '1.0' // 数据版本号
const clickCounts = ref({})

// 从 localStorage 加载点击统计
onMounted(() => {
  const savedVersion = localStorage.getItem('navDataVersion')
  const saved = localStorage.getItem('navClickCounts')

  // 如果版本不匹配，清理旧数据
  if (savedVersion !== DATA_VERSION) {
    console.log('数据版本已更新，清理旧缓存数据')
    localStorage.removeItem('navClickCounts')
    localStorage.setItem('navDataVersion', DATA_VERSION)
    clickCounts.value = {}
  } else if (saved) {
    try {
      clickCounts.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse click counts:', e)
      clickCounts.value = {}
    }
  }
})

// 记录点击
const recordClick = (item) => {
  const key = item.url
  clickCounts.value[key] = (clickCounts.value[key] || 0) + 1
  localStorage.setItem('navClickCounts', JSON.stringify(clickCounts.value))
}

// === 逻辑函数 ===
const switchEngine = (engine) => {
  currentEngine.value = engine
  showEngineList.value = false
}

const handleSearch = () => {
  if (!searchQuery.value) return
  window.open(currentEngine.value.url + encodeURIComponent(searchQuery.value), '_blank')
}

const getIconSrc = (item) => {
  if (item.iconUrl) return item.iconUrl
  try {
    let domain = item.url
    if (!domain.startsWith('http')) domain = 'https://' + domain
    const hostname = new URL(domain).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
  } catch (e) {
    return 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f310.png'
  }
}

const handleImageError = (e) => {
  e.target.src = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f310.png'
}

// 筛选逻辑
const filteredItems = computed(() => {
  let items = []

  if (activeCategory.value === 'frequent') {
    // 常用：显示最常访问的网站
    navItems.forEach(category => items = items.concat(category.items))
    // 按点击次数排序，取前 16 个
    items = items
      .sort((a, b) => (clickCounts.value[b.url] || 0) - (clickCounts.value[a.url] || 0))
      .slice(0, 16)
  } else {
    const category = navItems.find(c => c.category === activeCategory.value)
    if (category) items = category.items
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.desc && item.desc.toLowerCase().includes(query))
    )
  }
  return items
})
</script>