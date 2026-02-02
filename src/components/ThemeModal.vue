<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="$emit('close')"></div>

      <div class="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/10 rounded-3xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <!-- 光效背景 -->
        <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary-to/10 rounded-3xl pointer-events-none"></div>

        <div class="relative z-10">
          <!-- 标题 -->
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              主题设置
            </h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 1. 模式选择 -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-300 mb-3">主题模式</h4>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="mode in modes" :key="mode.value"
              @click="settings.mode = mode.value"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border"
              :class="settings.mode === mode.value
                ? 'bg-primary/80 border-primary/50 text-white shadow-lg shadow-primary/30'
                : 'bg-gray-700/40 border-white/5 text-gray-400 hover:bg-gray-700/60 hover:text-gray-300'"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>

        <!-- 2. 主题色选择 -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-300 mb-3">主题颜色</h4>
          <!-- 预设颜色 -->
          <div class="flex items-center gap-2 mb-3">
            <button
              v-for="(color, key) in PRESET_COLORS" :key="key"
              @click="settings.primaryColor = key"
              class="w-8 h-8 rounded-full border-2 transition-all duration-300 hover:scale-110"
              :class="settings.primaryColor === key ? 'border-white scale-110 shadow-lg' : 'border-white/20'"
              :style="{ background: `linear-gradient(135deg, rgb(${color.from}), rgb(${color.to}))` }"
              :title="color.name"
            ></button>
          </div>
          <!-- 自定义颜色 -->
          <div class="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg border border-white/5">
            <input
              v-model="customColor"
              type="color"
              class="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              @input="settings.primaryColor = customColor"
            >
            <span class="text-sm text-gray-400">自定义颜色</span>
          </div>
        </div>

        <!-- 3. 背景设置 -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-300 mb-3">背景图片</h4>
          <div class="space-y-3">
            <!-- 背景类型选择 -->
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="setDefaultBackground"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border"
                :class="settings.backgroundType === 'default'
                  ? 'bg-primary/80 border-primary/50 text-white'
                  : 'bg-gray-700/40 border-white/5 text-gray-400'"
              >
                默认背景
              </button>
              <label class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border text-center cursor-pointer"
                     :class="settings.backgroundType === 'custom'
                      ? 'bg-primary/80 border-primary/50 text-white'
                      : 'bg-gray-700/40 border-white/5 text-gray-400'">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  @change="handleFileChange"
                >
                自定义上传
              </label>
            </div>
            <!-- 背景饱和度 -->
            <div class="p-3 bg-gray-700/30 rounded-lg border border-white/5">
              <div class="flex justify-between text-xs text-gray-400 mb-2">
                <span>背景饱和度</span>
                <span>{{ settings.saturation }}%</span>
              </div>
              <input
                v-model.number="settings.saturation"
                type="range"
                min="0"
                max="200"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              >
            </div>
          </div>
        </div>

        <!-- 4. 玻璃效果 -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-300 mb-3">玻璃效果强度</h4>
          <div class="grid grid-cols-4 gap-2 mb-3">
            <button
              v-for="level in glassLevels" :key="level.value"
              @click="settings.glassEffect = level.value"
              class="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 border"
              :class="Math.abs(settings.glassEffect - level.value) < 10
                ? 'bg-primary/80 border-primary/50 text-white'
                : 'bg-gray-700/40 border-white/5 text-gray-400'"
            >
              {{ level.label }}
            </button>
          </div>
          <div class="p-3 bg-gray-700/30 rounded-lg border border-white/5">
            <div class="flex justify-between text-xs text-gray-400 mb-2">
              <span>微调</span>
              <span>{{ settings.glassEffect }}%</span>
            </div>
            <input
              v-model.number="settings.glassEffect"
              type="range"
              min="0"
              max="100"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            >
          </div>
        </div>

        <!-- 5. 背景亮度 -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-300 mb-3">背景亮度</h4>
          <div class="p-3 bg-gray-700/30 rounded-lg border border-white/5">
            <div class="flex justify-between text-xs text-gray-400 mb-2">
              <span>亮度调节</span>
              <span>{{ settings.bgBrightness }}%</span>
            </div>
            <input
              v-model.number="settings.bgBrightness"
              type="range"
              min="70"
              max="130"
              step="1"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-2">
              <span>暗</span>
              <span>默认</span>
              <span>亮</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useTheme } from '../composables/useTheme'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const { settings, PRESET_COLORS, handleBackgroundUpload, resetBackground, setDefaultBackground } = useTheme()
const customColor = ref('#9333ea')

// 监听设置变化，同步自定义颜色选择器
watch(() => settings.value.primaryColor, (newVal) => {
  if (newVal.startsWith('#')) {
    customColor.value = newVal
  }
})

// 处理文件选择
const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    handleBackgroundUpload(file)
  }
}

// 主题模式选项
const modes = [
  { value: 'auto', label: '自动' },
  { value: 'dark', label: '深色' },
  { value: 'light', label: '浅色' }
]

// 玻璃效果预设级别
const glassLevels = [
  { value: 0, label: '无' },
  { value: 35, label: '低' },
  { value: 65, label: '中' },
  { value: 100, label: '高' }
]
</script>
