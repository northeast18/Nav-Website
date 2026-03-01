<template>
  <div class="w-full max-w-2xl mx-auto px-4 relative z-40 mb-4 sm:mb-6 flex gap-2 sm:gap-4 items-center">
    <div class="relative flex-1">
      <div 
        @click="$emit('open-engine-list')"
        class="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 p-1 sm:p-1.5 rounded-lg hover:bg-white/10 cursor-pointer flex items-center gap-1 transition-colors z-20"
      >
        <img :src="currentEngine.icon" class="w-4 h-4 sm:w-5 sm:h-5 rounded-sm transition-all" :class="{'dark:invert brightness-0 dark:brightness-200': currentEngine.name === 'GitHub'}" :alt="currentEngine.name" />
        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div class="relative flex-1">
        <input
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          @keypress.enter="$emit('search')"
          type="text"
          :placeholder="`在 ${currentEngine.name} 中搜索...`"
          class="w-full bg-white/10 dark:bg-gray-900/40 border border-white/20 dark:border-white/10 rounded-xl text-white placeholder-gray-400 px-14 sm:px-20 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-inner backdrop-blur-md text-sm sm:text-base"
          ref="searchInputRef"
        />
        <!-- 清除搜索按钮 -->
        <button
          v-if="modelValue"
          @click="clearSearch"
          class="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          aria-label="清除搜索"
          type="button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- 搜索引擎选择列表 -->
      <div v-if="showEngineList" class="absolute top-full left-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 transform origin-top-left transition-all">
        <div class="py-1">
          <button
            v-for="engine in searchEngines"
            :key="engine.name"
            @click="selectEngine(engine)"
            class="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            :class="{ 'bg-primary/10 dark:bg-primary/20': currentEngine.name === engine.name }"
          >
            <img :src="engine.icon" class="w-5 h-5 rounded-sm transition-all" :class="{'dark:invert brightness-0 dark:brightness-200': engine.name === 'GitHub'}" :alt="engine.name" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ engine.name }}</span>
            <svg v-if="currentEngine.name === engine.name" class="w-4 h-4 text-primary ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <button
      @click="$emit('search')"
      class="hidden sm:flex px-6 py-2.5 bg-gradient-to-r from-primary to-primary-to hover:from-primary/90 hover:to-primary-to/90 text-white rounded-xl transition-all font-medium items-center gap-2 shadow-lg shadow-primary/30 text-sm"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      搜索
    </button>
  </div>
  <div v-if="showEngineList" @click="$emit('close-engine-list')" class="fixed inset-0 z-30 bg-transparent cursor-default"></div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  currentEngine: {
    type: Object,
    required: true
  },
  searchEngines: {
    type: Array,
    required: true
  },
  showEngineList: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'open-engine-list', 'close-engine-list', 'select-engine'])

const searchInputRef = ref(null)

const clearSearch = () => {
  emit('update:modelValue', '')
  nextTick(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus()
    }
  })
}

const selectEngine = (engine) => {
  emit('select-engine', engine)
  emit('close-engine-list')
  nextTick(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus()
    }
  })
}
</script>