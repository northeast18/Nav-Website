<template>
  <BaseModal :show="show" title="添加网站" @close="$emit('close')">
    <template #icon>
      <span class="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/50"></span>
    </template>
    
    <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-sm">{{ error }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">网站名称 *</label>
        <input v-model="form.name" type="text" required class="glass-input" placeholder="例如：GitHub">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">网站链接 *</label>
        <div class="relative">
          <input v-model="form.url" @blur="autoFetchIcon" type="url" required class="glass-input pr-10" placeholder="例如：https://github.com">
          <button 
            v-if="form.url && !form.iconUrl" 
            type="button" 
            @click="autoFetchIcon"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-green-500 transition-colors"
            title="自动获取图标"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <span v-if="iconFetching" class="absolute right-2 top-1/2 -translate-y-1/2">
            <svg class="w-5 h-5 animate-spin text-green-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">所属分类 *</label>
        <!-- 分类按钮选择器 -->
        <div class="relative">
          <button
            type="button"
            @click="showCategoryDropdown = !showCategoryDropdown"
            class="w-full px-4 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-black/10 dark:border-white/10 rounded-xl text-left flex items-center justify-between hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span :class="form.category ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'">
              {{ form.category || '请选择分类' }}
            </span>
            <svg class="w-5 h-5 text-gray-400 transition-transform" :class="{ 'rotate-180': showCategoryDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <!-- 分类下拉列表 -->
          <div
            v-if="showCategoryDropdown"
            class="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-black/10 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto"
          >
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              @click="selectCategory(cat)"
              class="w-full px-4 py-2.5 text-left hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors flex items-center gap-2"
              :class="{ 'bg-primary/20 text-primary': form.category === cat }"
            >
              <span class="w-2 h-2 rounded-full bg-primary/60"></span>
              <span class="text-gray-900 dark:text-gray-100">{{ cat }}</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">网站描述</label>
        <input v-model="form.desc" type="text" class="glass-input" placeholder="简单的一句话介绍（可选）">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">内网链接</label>
        <input v-model="form.lanUrl" type="url" class="glass-input" placeholder="（可选）">
      </div>

      <!-- 图标设置选项 -->
      <div class="border-t border-black/5 dark:border-white/5 pt-4 space-y-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">图标配置</label>
        
        <!-- Tab 切换 -->
        <div class="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl">
          <button 
            type="button" 
            @click="iconType = 'image'"
            class="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
            :class="iconType === 'image' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
          >
            图片链接
          </button>
          <button 
            type="button" 
            @click="iconType = 'text'"
            class="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
            :class="iconType === 'text' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
          >
            文字图标
          </button>
        </div>

        <!-- 图片链接配置区 -->
        <div v-show="iconType === 'image'" class="space-y-4">
          <div>
            <div class="relative">
              <input v-model="form.iconUrl" type="url" class="glass-input" placeholder="输入图片 URL 或留空自动获取">
              <button 
                v-if="form.url && !form.iconUrl" 
                type="button" 
                @click="autoFetchIcon"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-green-500 transition-colors"
                title="自动获取图标"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <span v-if="iconFetching" class="absolute right-2 top-1/2 -translate-y-1/2">
                <svg class="w-5 h-5 animate-spin text-green-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="form.darkIcon" type="checkbox" id="addDarkIcon" class="w-4 h-4 rounded border-gray-300 dark:border-white/10 bg-white dark:bg-gray-900/50 text-green-500 focus:ring-green-500/50">
            <label for="addDarkIcon" class="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">这是一个深色图标（需要反色显示）</label>
          </div>
        </div>

        <!-- 文字图标配置区 -->
        <div v-show="iconType === 'text'" class="flex gap-4">
          <!-- 实时预览区 -->
          <div class="flex flex-col items-center justify-center border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-gray-900/30 rounded-xl p-3 w-24 h-24 flex-shrink-0">
            <span class="text-[10px] text-gray-400 dark:text-gray-500 mb-1">预览</span>
            <div 
              class="w-12 h-12 flex items-center justify-center font-bold text-base shadow-md border border-white/5 select-none overflow-hidden"
              :style="{
                color: textIconForm.color,
                backgroundColor: textIconForm.bgColor,
                borderRadius: textIconForm.radius + 'px'
              }"
            >
              {{ textIconForm.text || '文字' }}
            </div>
          </div>

          <!-- 参数编辑区 -->
          <div class="flex-1 space-y-3">
            <!-- 图标文字 -->
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">图标文字 (最多4个字)</label>
              <input 
                v-model="textIconForm.text" 
                type="text" 
                maxlength="4" 
                class="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                placeholder="例如：GG"
              >
            </div>

            <!-- 颜色设置 -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">文字颜色</label>
                <div class="flex items-center gap-1.5">
                  <input v-model="textIconForm.color" type="color" class="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent flex-shrink-0">
                  <input v-model="textIconForm.color" type="text" class="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white" placeholder="#FFFFFF">
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">背景颜色</label>
                <div class="flex items-center gap-1.5">
                  <input v-model="textIconForm.bgColor" type="color" class="w-8 h-8 rounded border-0 cursor-pointer p-0 bg-transparent flex-shrink-0">
                  <input v-model="textIconForm.bgColor" type="text" class="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white" placeholder="#3B82F6">
                </div>
              </div>
            </div>

            <!-- 预设色彩推荐 -->
            <div>
              <label class="block text-[10px] text-gray-400 mb-1">推荐色彩组合</label>
              <div class="flex flex-wrap gap-1.5">
                <button 
                  v-for="preset in colorPresets" 
                  :key="preset.bg"
                  type="button"
                  @click="applyPreset(preset)"
                  class="w-5 h-5 rounded-md border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                  :style="{ backgroundColor: preset.bg }"
                  :title="preset.name"
                >
                  <span class="text-[8px] font-bold" :style="{ color: preset.text }">Aa</span>
                </button>
              </div>
            </div>

            <!-- 圆角滑块 -->
            <div>
              <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>圆角大小</span>
                <span>{{ textIconForm.radius }}px</span>
              </div>
              <input 
                v-model.number="textIconForm.radius" 
                type="range" 
                min="0" 
                max="24" 
                class="w-full accent-primary bg-gray-200 dark:bg-gray-700 h-1 rounded-lg cursor-pointer"
              >
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3 pt-4">
        <button type="button" @click="$emit('close')" class="btn-action-cancel">取消</button>
        <button type="submit" :disabled="loading" class="btn-action bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 disabled:opacity-70 disabled:cursor-not-allowed">
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ loading ? '添加中...' : '确认添加' }}</span>
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch, onMounted, onUnmounted } from 'vue'
import BaseModal from './BaseModal.vue'
import { getIconUrl, buildTextIconString } from '../../utils/icon.js'

const props = defineProps({
  show: Boolean,
  loading: Boolean,
  error: String,
  initialCategory: String,
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  name: '',
  url: '',
  desc: '',
  category: '',
  iconUrl: '',
  lanUrl: '',
  darkIcon: false
})

const iconFetching = ref(false)

const iconType = ref('image') // 'image' | 'text'
const textIconForm = reactive({
  text: '',
  color: '#ffffff',
  bgColor: '#3b82f6',
  radius: 8
})

const colorPresets = [
  { name: '蓝色', bg: '#3b82f6', text: '#ffffff' },
  { name: '绿色', bg: '#10b981', text: '#ffffff' },
  { name: '紫色', bg: '#8b5cf6', text: '#ffffff' },
  { name: '玫瑰', bg: '#f43f5e', text: '#ffffff' },
  { name: '琥珀', bg: '#f59e0b', text: '#ffffff' },
  { name: '靛青', bg: '#6366f1', text: '#ffffff' },
  { name: '青色', bg: '#14b8a6', text: '#ffffff' },
  { name: '深灰', bg: '#374151', text: '#ffffff' },
  { name: '薄荷', bg: '#a7f3d0', text: '#065f46' },
  { name: '樱花', bg: '#fbcfe8', text: '#9d174d' }
]

const applyPreset = (preset) => {
  textIconForm.color = preset.text
  textIconForm.bgColor = preset.bg
}

const handleSubmit = () => {
  const submitData = { ...form }
  if (iconType.value === 'text') {
    submitData.iconUrl = buildTextIconString({
      text: textIconForm.text.trim() || form.name.slice(0, 2).toUpperCase(),
      color: textIconForm.color,
      bgColor: textIconForm.bgColor,
      radius: textIconForm.radius
    })
  }
  emit('submit', submitData)
}

// 自动根据输入的网站名称推荐图标文字
watch(() => form.name, (newName) => {
  if (newName && !textIconForm.text) {
    textIconForm.text = newName.slice(0, 2).toUpperCase()
  }
})

// 自动获取图标
const autoFetchIcon = async () => {
  if (!form.url || form.iconUrl) return
  
  iconFetching.value = true
  try {
    // 使用已有的 getIconUrl 函数
    const iconUrl = getIconUrl(form.url, '')
    if (iconUrl) {
      form.iconUrl = iconUrl
    }
  } catch (e) {
    console.error('自动获取图标失败:', e)
  } finally {
    iconFetching.value = false
  }
}

const showCategoryDropdown = ref(false)

const selectCategory = (cat) => {
  form.category = cat
  showCategoryDropdown.value = false
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (showCategoryDropdown.value && !event.target.closest('.relative')) {
    showCategoryDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    form.name = ''
    form.url = ''
    form.desc = ''
    form.category = props.initialCategory || ''
    form.iconUrl = ''
    form.lanUrl = ''
    form.darkIcon = false
    showCategoryDropdown.value = false
    iconType.value = 'image'
    textIconForm.text = ''
    textIconForm.color = '#ffffff'
    textIconForm.bgColor = '#3b82f6'
    textIconForm.radius = 8
  }
})
</script>
