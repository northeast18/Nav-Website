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

    <form @submit.prevent="$emit('submit', form)" class="space-y-4">
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

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            图标链接
            <span v-if="form.iconUrl" class="text-green-500 text-xs ml-1">已自动获取</span>
          </label>
          <input v-model="form.iconUrl" type="url" class="glass-input" placeholder="留空自动获取">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">内网链接</label>
          <input v-model="form.lanUrl" type="url" class="glass-input" placeholder="（可选）">
        </div>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <input v-model="form.darkIcon" type="checkbox" id="addDarkIcon" class="w-4 h-4 rounded border-gray-300 dark:border-white/10 bg-white dark:bg-gray-900/50 text-green-500 focus:ring-green-500/50">
        <label for="addDarkIcon" class="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">这是一个深色图标（需要反色显示）</label>
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
import { getIconUrl } from '../../utils/icon.js'

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
  }
})
</script>
