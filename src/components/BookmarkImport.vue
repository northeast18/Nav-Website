<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

    <div class="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all flex flex-col">
      <!-- 光效背景 -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col h-full">
        <!-- 头部 -->
        <div class="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h3 class="text-2xl font-bold text-white flex items-center gap-3">
              <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              导入浏览器书签
            </h3>
            <p class="text-gray-400 text-sm mt-1">支持 Chrome、Firefox、Edge、Safari 浏览器导出的书签文件</p>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- 阶段 1: 文件上传 -->
          <div v-if="stage === 1" class="text-center py-12">
            <div class="border-2 border-dashed border-white/20 rounded-2xl p-12 hover:border-primary/50 transition-colors">
              <svg class="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-gray-300 text-lg mb-2">拖拽书签文件到这里，或点击选择文件</p>
              <p class="text-gray-500 text-sm mb-6">支持 .html 格式的书签文件</p>
              <input
                ref="fileInput"
                type="file"
                accept=".html"
                @change="handleFileSelect"
                class="hidden"
              />
              <button
                @click="$refs.fileInput?.click()"
                class="px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 font-medium"
              >
                选择书签文件
              </button>
            </div>
          </div>

          <!-- 阶段 2: 预览和选择 -->
          <div v-if="stage === 2">
            <div class="mb-6">
              <h4 class="text-lg font-semibold text-white mb-2">选择要导入的书签</h4>
              <p class="text-gray-400 text-sm">共解析出 {{ parsedBookmarks.length }} 个书签</p>
            </div>

            <!-- 批量操作 -->
            <div class="flex gap-3 mb-4">
              <button
                @click="selectAll"
                class="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors text-sm font-medium"
              >
                全选
              </button>
              <button
                @click="deselectAll"
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
              >
                取消全选
              </button>
              <span class="text-gray-400 text-sm flex items-center ml-auto">
                已选择 {{ selectedBookmarks.length }} 个
              </span>
            </div>

            <!-- 书签列表 -->
            <div class="space-y-2 max-h-[400px] overflow-y-auto">
              <div
                v-for="bookmark in parsedBookmarks"
                :key="bookmark.url"
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                :class="{ 'bg-primary/10 border border-primary/30': selectedBookmarks.includes(bookmark) }"
              >
                <input
                  type="checkbox"
                  :id="`bookmark-${bookmark.url}`"
                  v-model="selectedBookmarks"
                  :value="bookmark"
                  class="w-4 h-4 rounded border-white/20 bg-gray-900/50 text-primary focus:ring-primary/50"
                />
                <label :for="`bookmark-${bookmark.url}`" class="flex-1 cursor-pointer">
                  <div class="flex items-center gap-3">
                    <img
                      :src="getIconUrl(bookmark.url)"
                      @error="handleImageError"
                      class="w-6 h-6 rounded"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="text-white font-medium truncate">{{ bookmark.name }}</div>
                      <div class="text-gray-500 text-sm truncate">{{ bookmark.url }}</div>
                    </div>
                    <div class="text-gray-500 text-xs bg-gray-800 px-2 py-1 rounded">
                      {{ bookmark.folder }}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- 阶段 3: 分配分类 -->
          <div v-if="stage === 3">
            <div class="mb-6">
              <h4 class="text-lg font-semibold text-white mb-2">选择目标分类</h4>
              <p class="text-gray-400 text-sm">将 {{ selectedBookmarks.length }} 个书签导入到以下分类</p>
            </div>

            <div class="space-y-4">
              <!-- 分类选择 -->
              <div>
                <label class="block text-gray-400 text-sm mb-2">目标分类</label>
                <select
                  v-model="targetCategory"
                  class="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                >
                  <option value="">请选择分类</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>

              <!-- 预览 -->
              <div>
                <label class="block text-gray-400 text-sm mb-2">预览（前 5 个）</label>
                <div class="bg-gray-900/30 border border-white/10 rounded-xl p-4 space-y-2">
                  <div
                    v-for="bookmark in selectedBookmarks.slice(0, 5)"
                    :key="bookmark.url"
                    class="flex items-center gap-2 text-sm"
                  >
                    <svg class="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span class="text-gray-300 truncate">{{ bookmark.name }}</span>
                  </div>
                  <div v-if="selectedBookmarks.length > 5" class="text-gray-500 text-sm">
                    ... 还有 {{ selectedBookmarks.length - 5 }} 个
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 阶段 4: 导入结果 -->
          <div v-if="stage === 4">
            <div class="text-center py-12">
              <div v-if="importResult.success" class="text-green-400 mb-4">
                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 class="text-xl font-semibold mb-2">导入完成！</h4>
                <p class="text-gray-400">
                  成功导入 {{ importResult.imported }} 个书签
                  <span v-if="importResult.failed > 0">
                    ，失败 {{ importResult.failed }} 个
                  </span>
                </p>
              </div>
              <div v-else class="text-red-400">
                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 class="text-xl font-semibold mb-2">导入失败</h4>
                <p class="text-gray-400">{{ importResult.message || '请重试' }}</p>
              </div>

              <!-- 错误列表 -->
              <div v-if="importResult.errors && importResult.errors.length > 0" class="mt-6 text-left">
                <h5 class="text-white font-medium mb-2">失败的项：</h5>
                <div class="bg-gray-900/50 rounded-xl p-4 max-h-[200px] overflow-y-auto">
                  <div
                    v-for="(error, index) in importResult.errors"
                    :key="index"
                    class="text-red-400 text-sm mb-1"
                  >
                    • {{ error.name }}: {{ error.error }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div v-if="stage !== 4" class="flex gap-3 p-6 border-t border-white/10">
          <button
            v-if="stage > 1"
            @click="prevStage"
            class="px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
          >
            上一步
          </button>
          <div class="flex-1"></div>
          <button
            v-if="stage === 2"
            @click="nextStage"
            :disabled="selectedBookmarks.length === 0"
            class="px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一步 ({{ selectedBookmarks.length }})
          </button>
          <button
            v-if="stage === 3"
            @click="importBookmarks"
            :disabled="!targetCategory || isImporting"
            class="px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="isImporting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isImporting ? '导入中...' : '开始导入' }}
          </button>
        </div>

        <!-- 完成按钮 -->
        <div v-if="stage === 4" class="flex gap-3 p-6 border-t border-white/10">
          <button
            @click="closeAndRefresh"
            class="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-white rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 font-medium"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  categories: Array
})

const emit = defineEmits(['close', 'refresh'])

const stage = ref(1)
const parsedBookmarks = ref([])
const selectedBookmarks = ref([])
const targetCategory = ref('')
const isImporting = ref(false)
const importResult = ref({})

const fileInput = ref(null)

// 选择文件
const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const text = await file.text()
    parseBookmarks(text)
    stage.value = 2
  } catch (error) {
    alert('解析书签文件失败：' + error.message)
  }
}

// 解析书签
const parseBookmarks = (html) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const bookmarks = []
  const links = doc.querySelectorAll('a')

  links.forEach(link => {
    const name = link.textContent.trim()
    const url = link.href
    const folder = link.closest('dl')?.previousElementSibling?.textContent?.trim() || '未分类'

    if (name && url && url.startsWith('http')) {
      bookmarks.push({ name, url, folder })
    }
  })

  parsedBookmarks.value = bookmarks
}

// 获取图标 URL
const getIconUrl = (url) => {
  try {
    const hostname = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
  } catch {
    return 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f310.png'
  }
}

// 图片加载错误处理
const handleImageError = (e) => {
  e.target.src = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f310.png'
}

// 全选
const selectAll = () => {
  selectedBookmarks.value = [...parsedBookmarks.value]
}

// 取消全选
const deselectAll = () => {
  selectedBookmarks.value = []
}

// 上一步
const prevStage = () => {
  if (stage.value > 1) {
    stage.value--
  }
}

// 下一步
const nextStage = () => {
  if (selectedBookmarks.value.length === 0) {
    alert('请至少选择一个书签')
    return
  }
  stage.value++
}

// 导入书签
const importBookmarks = async () => {
  if (!targetCategory.value) {
    alert('请选择目标分类')
    return
  }

  isImporting.value = true

  try {
    const response = await fetch('/api/websites/batch-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        websites: selectedBookmarks.value.map(b => ({
          name: b.name,
          url: b.url,
          category: targetCategory.value,
          desc: `从 ${b.folder} 导入`,
          iconUrl: '',
          lanUrl: '',
          darkIcon: false
        }))
      })
    })

    const result = await response.json()
    importResult.value = result
    stage.value = 4
  } catch (error) {
    alert('导入失败：' + error.message)
  } finally {
    isImporting.value = false
  }
}

// 关闭并刷新
const closeAndRefresh = () => {
  emit('refresh')
  emit('close')
}
</script>
