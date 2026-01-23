<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex flex-col">
    
    <!-- ✅ 这里是你的星空背景图 (bg.jpg 必须在 public 文件夹内) -->
    <!-- mix-blend-overlay 让图片和底下的紫色混合，效果更梦幻 -->
    <div class="fixed inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay pointer-events-none"></div>
    
    <!-- 这一层是加深遮罩，防止背景太亮导致文字看不清 -->
    <div class="fixed inset-0 bg-black/10 pointer-events-none"></div>
    
    <div class="relative z-10 flex-1 flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4">
      
      <!-- 1. 顶部导航栏 -->
      <header class="w-full max-w-6xl mb-4 sm:mb-6 z-20 relative">
        <div class="flex justify-between items-center mb-3 px-2">
          <!-- 左侧按钮组 -->
          <div class="flex gap-2">
            <!-- 云同步按钮（仅图标） -->
            <button
              @click="showSyncModal = true"
              class="p-1.5 rounded-full transition-all duration-300 border backdrop-blur-md inline-flex items-center justify-center bg-gradient-to-r from-blue-600/80 to-cyan-600/80 border-blue-500/50 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-110"
              title="云同步"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>

            <!-- 主题设置按钮 -->
            <button
              @click="showThemeModal = true"
              class="p-1.5 rounded-full transition-all duration-300 border backdrop-blur-md inline-flex items-center justify-center bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-purple-500/50 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-110"
              title="主题设置"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>

            <!-- 编辑分类按钮 -->
            <button
              @click="toggleCategoryEditMode"
              class="p-1.5 rounded-full transition-all duration-300 border backdrop-blur-md inline-flex items-center justify-center"
              :class="isCategoryEditModeActive
                ? 'bg-gradient-to-r from-orange-600/80 to-red-600/80 border-orange-500/50 text-white hover:shadow-lg hover:shadow-orange-500/30'
                : 'bg-white/10 border-white/20 text-gray-400 hover:bg-white/20 hover:text-white'"
              :title="isCategoryEditModeActive ? '完成编辑分类' : '编辑分类顺序'"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </button>
          </div>

          <!-- 同步状态指示器 -->
          <div v-if="syncStatus" class="text-[10px] sm:text-xs" :class="syncStatus.type === 'success' ? 'text-green-400' : 'text-red-400'">
            {{ syncStatus.message }}
          </div>
        </div>

        <nav class="flex justify-center px-1">
          <div class="flex flex-wrap justify-center gap-1 sm:gap-1.5 pb-1">
            <!-- 常用按钮 -->
            <button
              @click="activeCategory = 'frequent'"
              class="px-2 sm:px-3 py-1 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 border backdrop-blur-md"
              :class="activeCategory === 'frequent'
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30'"
            >
              常用
            </button>

            <!-- 我的收藏按钮 -->
            <button
              @click="activeCategory = 'favorites'"
              class="px-2 sm:px-3 py-1 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 border backdrop-blur-md flex items-center gap-0.5"
              :class="activeCategory === 'favorites'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30'"
            >
              <svg class="w-3 h-3" :class="activeCategory === 'favorites' ? 'fill-current' : 'fill-none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              我的收藏
            </button>

            <!-- 分类按钮（支持拖拽排序、编辑和删除） -->
            <button
              v-for="(item, index) in sortedNavItems"
              :key="item.category"
              :draggable="isCategoryEditModeActive"
              @dragstart="onCategoryDragStart($event, index)"
              @dragend="onCategoryDragEnd"
              @dragover.prevent="onCategoryDragOver"
              @dragenter="onCategoryDragEnter($event, index)"
              @dragleave="onCategoryDragLeave"
              @drop="onCategoryDrop($event, index)"
              @click="handleCategoryClick(item)"
              class="px-2 sm:px-3 py-1 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 border backdrop-blur-md inline-flex items-center justify-center gap-0.5 whitespace-nowrap relative"
              :style="isCategoryEditModeActive ? 'cursor: grab; transition: all 0.2s;' : ''"
              :class="[
                activeCategory === item.category
                  ? (item.category === '私密' ? 'bg-gradient-to-r from-red-600 to-orange-600 border-red-500' : 'bg-purple-600 border-purple-500')
                  : 'bg-white/5 border-white/10',
                activeCategory === item.category
                  ? 'text-white shadow-lg scale-105 ' + (item.category === '私密' ? 'shadow-red-500/30' : 'shadow-purple-500/30')
                  : 'text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30',
                draggingCategoryIndex === index ? 'opacity-30 scale-95' : ''
              ]"
            >
              <svg v-if="isCategoryEditModeActive" class="w-2.5 h-2.5 mr-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
              <svg v-if="item.category === '私密'" class="w-3 h-3 flex-shrink-0" :class="activeCategory === item.category ? 'fill-current' : 'fill-none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{{ item.category }}</span>

              <!-- 编辑和删除按钮（仅在编辑模式显示） -->
              <template v-if="isCategoryEditModeActive">
                <button
                  @click.stop="editCategory(item.category)"
                  @mousedown.stop
                  class="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
                  title="重命名分类"
                  style="pointer-events: auto; cursor: pointer;"
                >
                  <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click.stop="deleteCategory(item.category)"
                  @mousedown.stop
                  class="ml-0.5 p-0.5 rounded-full hover:bg-red-500/30 transition-colors text-red-400"
                  title="删除分类"
                  style="pointer-events: auto; cursor: pointer;"
                >
                  <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </template>
            </button>

            <!-- 新建分类按钮（仅在编辑模式显示） -->
            <button
              v-if="isCategoryEditModeActive"
              @click="createNewCategory"
              class="px-2 sm:px-3 py-1 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 border backdrop-blur-md inline-flex items-center justify-center gap-0.5 whitespace-nowrap border-dashed border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-500"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>新建</span>
            </button>
          </div>
        </nav>
      </header>

      <!-- 2. 搜索框 -->
      <div class="relative w-full max-w-2xl mx-auto mb-6 sm:mb-8 group z-50 px-2">
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
      <div v-if="draggablesList.length > 0" class="w-full max-w-[64rem] grid grid-cols-4 md:grid-cols-7 xl:grid-cols-9 gap-1.5 px-1 sm:px-2 pb-8 mx-auto">
        <draggable
          v-model="draggablesList"
          item-key="id"
          :disabled="!enableDrag || !isDragModeActive"
          @end="(evt) => onDragEnd(evt, activeCategory)"
          class="contents"
          :animation="300"
          ghost-class="ghost-card"
          drag-class="dragging-card"
          chosen-class="chosen-card"
        >
          <template #item="{ element: item }">
            <NavCard
              :key="item.id || item.url"
              :item="item"
              :on-click="recordClick"
              :is-favorite="isFavorite(item)"
              :last-visit="lastVisitTime(item.url)"
              @toggle-favorite="toggleFavorite"
              @record-visit="recordVisit"
            />
          </template>
        </draggable>
      </div>

      <!-- 拖拽控制按钮（仅在启用拖拽时显示） -->
      <div v-if="enableDrag && draggablesList.length > 0" class="fixed bottom-20 right-4 z-30">
        <button
          @click="toggleDragMode"
          class="p-3 rounded-full transition-all duration-300 border backdrop-blur-md inline-flex items-center justify-center shadow-lg hover:shadow-xl"
          :class="isDragModeActive
            ? 'bg-gradient-to-r from-green-600/90 to-emerald-600/90 border-green-500/50 text-white hover:scale-110'
            : 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 border-purple-500/50 text-white hover:scale-110'"
          :title="isDragModeActive ? '点击完成拖拽' : '点击开始拖拽'"
        >
          <svg v-if="!isDragModeActive" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l4-4" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
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

    <!-- 5. 友情链接弹窗 -->
    <div v-if="showFriendModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showFriendModal = false">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

      <div class="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/10 rounded-3xl shadow-2xl p-5 w-full max-w-md transform transition-all">
        <!-- 光效背景 -->
        <div class="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 rounded-3xl pointer-events-none"></div>

        <div class="relative z-10">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/50"></span>
              友情链接
            </h3>
            <button @click="showFriendModal = false" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="grid grid-cols-3 sm:grid-cols-4 gap-1">
            <a
              v-for="(link, index) in friendLinks"
              :key="index"
              :href="link.url"
              target="_blank"
              class="group relative flex flex-col items-center py-1 px-0.5 rounded-xl bg-gray-700/30 hover:bg-purple-600/20 border border-white/5 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 overflow-hidden"
            >
              <!-- 悬停背景光效 -->
              <div class="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-500"></div>

              <!-- 图标容器 -->
              <div class="relative mb-1">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="relative flex h-10 w-10 items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <img
                    :src="getIconSrc(link)"
                    @error="handleImageError"
                    class="h-full w-full object-contain rounded-xl drop-shadow-md"
                  />
                </div>
              </div>

              <span class="relative z-10 text-[10px] font-medium text-gray-300 group-hover:text-white transition-colors truncate w-full text-center">{{ link.name }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. 密码验证弹窗 -->
    <div v-if="showPasswordModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="cancelPassword">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

      <div class="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/10 rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all">
        <!-- 光效背景 -->
        <div class="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-orange-600/10 rounded-3xl pointer-events-none"></div>

        <div class="relative z-10">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-2xl font-bold text-white flex items-center gap-3">
              <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              密码验证
            </h3>
            <button @click="cancelPassword" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <p class="text-gray-400 text-sm mb-6">请输入密码以访问私密分类</p>

          <div class="space-y-4">
            <input
              v-model="passwordInput"
              @keypress.enter="verifyPassword"
              type="password"
              placeholder="请输入密码"
              class="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-400/50 focus:ring-2 focus:ring-red-400/20 transition-all"
              autofocus
            />

            <p v-if="passwordError" class="text-red-400 text-sm">密码错误，请重试</p>

            <div class="flex gap-3">
              <button
                @click="cancelPassword"
                class="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                @click="verifyPassword"
                class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 font-medium"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 7. 云同步弹窗 -->
    <div v-if="showSyncModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showSyncModal = false">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

      <div class="relative bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-white/10 rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all">
        <!-- 光效背景 -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-600/10 rounded-3xl pointer-events-none"></div>

        <div class="relative z-10">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-2xl font-bold text-white flex items-center gap-3">
              <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              云同步
            </h3>
            <button @click="showSyncModal = false" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <!-- 用户 ID 显示 -->
          <div class="mb-6 p-4 bg-gray-700/30 rounded-xl border border-white/5">
            <div class="flex justify-between items-center mb-2">
              <p class="text-gray-400 text-xs">你的同步 ID</p>
              <button
                v-if="!isEditingId"
                @click="startEditId"
                class="text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                修改
              </button>
            </div>

            <!-- 显示模式 -->
            <div v-if="!isEditingId" class="flex items-center gap-2">
              <code class="flex-1 text-sm text-blue-400 bg-gray-900/50 px-3 py-2 rounded-lg break-all">{{ syncAuthToken }}</code>
              <button
                @click="copyAuthToken"
                class="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="复制"
              >
                <svg class="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <!-- 编辑模式 -->
            <div v-else class="space-y-2">
              <input
                v-model="editingId"
                type="text"
                class="w-full px-3 py-2 text-sm text-blue-400 bg-gray-900/50 border border-blue-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500"
                placeholder="输入新的同步 ID"
                @keyup.enter="saveId"
                @keyup.esc="cancelEditId"
              >
              <div class="flex gap-2">
                <button
                  @click="saveId"
                  class="flex-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  保存
                </button>
                <button
                  @click="cancelEditId"
                  class="flex-1 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>

          <!-- 同步按钮 -->
          <div class="space-y-3">
            <button
              @click="syncToCloud"
              :disabled="isSyncing"
              class="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {{ isSyncing ? '同步中...' : '上传到云端' }}
            </button>

            <button
              @click="syncFromCloud"
              :disabled="isSyncing"
              class="w-full px-4 py-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12" />
              </svg>
              {{ isSyncing ? '下载中...' : '从云端恢复' }}
            </button>
          </div>

          <p class="mt-4 text-center text-gray-500 text-xs">
            使用相同 ID 可在多设备间同步数据
          </p>
        </div>
      </div>
    </div>

    <!-- 8. 主题设置弹窗 -->
    <ThemeModal :show="showThemeModal" @close="showThemeModal = false" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import draggable from 'vuedraggable'
// ✅ 引入搜索引擎和友情链接
import { fetchNavItems, searchEngines, friendLinks } from './data'
import NavCard from './components/NavCard.vue'
import ThemeModal from './components/ThemeModal.vue'
import { useTheme } from './composables/useTheme'

// 初始化主题系统
const { settings: themeSettings } = useTheme()

// === 状态定义 ===
const navItems = ref([])  // 改为响应式数组
const activeCategory = ref('frequent')
const searchQuery = ref('')
const showEngineList = ref(false)
const showFriendModal = ref(false) // 控制友链弹窗
const showPasswordModal = ref(false) // 控制密码弹窗
const showSyncModal = ref(false) // 控制同步弹窗
const showThemeModal = ref(false) // 控制主题弹窗
const passwordInput = ref('') // 密码输入
const passwordError = ref(false) // 密码错误提示
const isPrivateUnlocked = ref(false) // 私密分类是否已解锁
const currentEngine = ref(searchEngines[0])

// === 云同步状态 ===
const API_BASE = import.meta.env.VITE_SYNC_API || '' // 使用相对路径，指向 Pages Functions
const syncAuthToken = ref(localStorage.getItem('syncAuthToken') || generateDeviceId())
const isSyncing = ref(false)
const syncStatus = ref(null)

// === 拖拽模式控制 ===
const isDragModeActive = ref(false) // 拖拽模式是否激活

// === 分类编辑模式 ===
const isCategoryEditModeActive = ref(false) // 分类编辑模式是否激活
const categoryOrder = ref([]) // 分类自定义顺序
const draggingCategoryIndex = ref(-1) // 正在拖拽的分类索引
const draggedCategoryName = ref('') // 正在拖拽的分类名称
const tempCategoryOrder = ref([]) // 拖拽过程中的临时顺序

// 切换分类编辑模式
const toggleCategoryEditMode = () => {
  isCategoryEditModeActive.value = !isCategoryEditModeActive.value
  if (!isCategoryEditModeActive.value) {
    // 退出编辑模式时保存顺序
    saveCategoryOrder()
    // 自动触发云同步（从 localStorage 读取最新值）
    syncToCloud()
  }
}

// 处理分类按钮点击
const handleCategoryClick = (item) => {
  if (isCategoryEditModeActive.value) {
    // 编辑模式下不切换分类
    return
  }

  if (item.category === '私密') {
    showPasswordModal.value = true
  } else {
    activeCategory.value = item.category
  }
}

// 重命名分类
const editCategory = async (oldName) => {
  const newName = prompt(`请输入「${oldName}」的新名称：`, oldName)

  if (!newName || newName === oldName) {
    return
  }

  try {
    const response = await fetch('/api/categories/rename', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prompt('请输入管理员密码：')}`
      },
      body: JSON.stringify({ oldName, newName })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      alert(result.message)
      // 重新加载数据
      location.reload()
    } else {
      alert('重命名失败：' + (result.error || result.message))
    }
  } catch (error) {
    alert('重命名失败：' + error.message)
  }
}

// 删除分类
const deleteCategory = async (categoryName) => {
  const confirmed = confirm(`确定要删除分类「${categoryName}」吗？\n\n注意：这将删除该分类下的所有网站！`)

  if (!confirmed) {
    return
  }

  try {
    const response = await fetch('/api/categories/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prompt('请输入管理员密码：')}`
      },
      body: JSON.stringify({ name: categoryName })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      alert(result.message)
      // 重新加载数据
      location.reload()
    } else {
      alert('删除失败：' + (result.error || result.message))
    }
  } catch (error) {
    alert('删除失败：' + error.message)
  }
}

// 新建分类
const createNewCategory = async () => {
  const name = prompt('请输入新分类的名称：')

  if (!name || !name.trim()) {
    return
  }

  try {
    const response = await fetch('/api/categories/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prompt('请输入管理员密码：')}`
      },
      body: JSON.stringify({ name: name.trim() })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      alert(result.message)
      // 重新加载数据
      location.reload()
    } else {
      alert('创建失败：' + (result.error || result.message))
    }
  } catch (error) {
    alert('创建失败：' + error.message)
  }
}

// 保存分类顺序
const saveCategoryOrder = () => {
  // 优先使用 tempCategoryOrder（确保获取最新的拖拽顺序）
  const orderToSave = tempCategoryOrder.value.length > 0
    ? tempCategoryOrder.value
    : categoryOrder.value

  console.log('保存分类顺序到 localStorage:', orderToSave)

  // 保存到 localStorage
  localStorage.setItem('navCategoryOrder', JSON.stringify(orderToSave))
}

// 按照自定义顺序排序分类
const sortedNavItems = computed(() => {
  // 如果正在拖拽，使用临时顺序
  const order = (isCategoryEditModeActive.value && tempCategoryOrder.value.length > 0)
    ? tempCategoryOrder.value
    : categoryOrder.value

  const items = navItems.value
  if (order.length === 0) {
    return items
  }

  // 创建排序后的数组
  const sorted = []
  const ordered = new Set(order)
  const remaining = []

  // 先按照自定义顺序排列
  order.forEach(cat => {
    const found = items.find(item => item.category === cat)
    if (found) sorted.push(found)
  })

  // 然后添加未排序的分类
  items.forEach(item => {
    if (!ordered.has(item.category)) {
      remaining.push(item)
    }
  })

  return [...sorted, ...remaining]
})

// 分类拖拽开始
const onCategoryDragStart = (event, index) => {
  console.log('拖拽开始:', index, sortedNavItems.value[index]?.category)
  draggingCategoryIndex.value = index
  draggedCategoryName.value = sortedNavItems.value[index].category

  // 创建临时顺序的副本
  tempCategoryOrder.value = sortedNavItems.value.map(item => item.category)

  // 设置拖拽数据
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', index.toString())

  // 添加拖拽视觉反馈
  setTimeout(() => {
    if (event.target) {
      event.target.style.opacity = '0.4'
      event.target.style.transform = 'scale(0.95)'
    }
  }, 0)

  console.log('临时顺序:', tempCategoryOrder.value)
}

// 分类拖拽结束
const onCategoryDragEnd = (event) => {
  console.log('拖拽结束，应用顺序:', tempCategoryOrder.value)

  // 恢复样式
  if (event.target) {
    event.target.style.opacity = ''
    event.target.style.transform = ''
  }

  if (draggingCategoryIndex.value !== -1 && tempCategoryOrder.value.length > 0) {
    // 应用临时顺序
    categoryOrder.value = [...tempCategoryOrder.value]
    console.log('最终保存顺序:', categoryOrder.value)
  }

  draggingCategoryIndex.value = -1
  draggedCategoryName.value = ''
  tempCategoryOrder.value = []
}

// 分类拖拽经过（阻止默认行为以允许 drop）
const onCategoryDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

// 分类拖拽进入（用于视觉反馈）
const onCategoryDragEnter = (event, index) => {
  if (draggingCategoryIndex.value === -1 || draggingCategoryIndex.value === index) {
    return
  }

  // 添加目标位置的视觉反馈
  event.target.style.transform = 'scale(1.05)'
  event.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.5)'
  console.log('拖拽进入目标:', index, '可以将', sortedNavItems.value[draggingCategoryIndex.value]?.category, '移动到', sortedNavItems.value[index]?.category)
}

// 分类拖拽离开
const onCategoryDragLeave = (event) => {
  // 清除视觉反馈
  if (event.target && draggingCategoryIndex.value !== sortedNavItems.value.findIndex(item => item.category === event.target.textContent?.trim())) {
    event.target.style.transform = ''
    event.target.style.boxShadow = ''
  }
}

// 分类放下
const onCategoryDrop = (event, targetIndex) => {
  event.preventDefault()
  event.stopPropagation()

  // 清除目标位置的视觉反馈
  if (event.target) {
    event.target.style.transform = ''
    event.target.style.boxShadow = ''
  }

  console.log('放下到位置:', targetIndex, '从位置:', draggingCategoryIndex.value)

  const fromIndex = draggingCategoryIndex.value
  if (fromIndex === -1 || fromIndex === targetIndex) {
    console.log('无效的拖拽操作')
    return
  }

  // 获取当前临时顺序
  const items = [...tempCategoryOrder.value]
  console.log('当前临时顺序:', items)

  // 移除被拖拽的元素
  const draggedItem = items[fromIndex]
  items.splice(fromIndex, 1)

  // 插入到新位置（全局拖拽 - 可以跨越任意距离）
  items.splice(targetIndex, 0, draggedItem)

  // 更新临时顺序
  tempCategoryOrder.value = items
  draggingCategoryIndex.value = targetIndex

  console.log('更新后的临时顺序:', tempCategoryOrder.value)
  console.log(`✓ 已将「${draggedItem}」从位置 ${fromIndex} 移动到位置 ${targetIndex}`)
}

// 切换拖拽模式
const toggleDragMode = () => {
  isDragModeActive.value = !isDragModeActive.value
  if (!isDragModeActive.value) {
    // 完成拖拽，自动云同步
    syncToCloud()
    // 显示保存提示
    syncStatus.value = { type: 'success', message: '✅ 拖拽排序已保存并同步' }
    setTimeout(() => syncStatus.value = null, 2000)
  }
}

// 生成设备 ID
function generateDeviceId() {
  return 'device_' + Math.random().toString(36).substring(2, 15)
}

// === 点击统计 ===
const DATA_VERSION = '1.0' // 数据版本号
const clickCounts = ref({})
const favorites = ref(new Set())
const visitHistory = ref({})
const customOrder = ref({}) // 自定义排序 {category: [id1, id2, ...]}

// 从 localStorage 加载数据
onMounted(async () => {
  // 加载导航网站数据（从 D1 数据库）
  try {
    navItems.value = await fetchNavItems()
    console.log('✓ 导航数据加载完成')
  } catch (error) {
    console.error('✗ 导航数据加载失败:', error)
  }

  const savedVersion = localStorage.getItem('navDataVersion')
  const saved = localStorage.getItem('navClickCounts')
  const savedFavorites = localStorage.getItem('navFavorites')
  const savedVisits = localStorage.getItem('navVisits')
  const savedOrder = localStorage.getItem('navCustomOrder')
  const savedCategoryOrder = localStorage.getItem('navCategoryOrder')

  // 如果版本不匹配，清理旧数据
  if (savedVersion !== DATA_VERSION) {
    console.log('数据版本已更新，清理旧缓存数据')
    localStorage.removeItem('navClickCounts')
    localStorage.removeItem('navFavorites')
    localStorage.removeItem('navVisits')
    localStorage.removeItem('navCustomOrder')
    localStorage.removeItem('navCategoryOrder')
    localStorage.setItem('navDataVersion', DATA_VERSION)
    clickCounts.value = {}
    favorites.value = new Set()
    visitHistory.value = {}
    customOrder.value = {}
    categoryOrder.value = []
  } else {
    // 加载点击统计
    if (saved) {
      try {
        clickCounts.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse click counts:', e)
        clickCounts.value = {}
      }
    }

    // 加载收藏列表
    if (savedFavorites) {
      try {
        const favArray = JSON.parse(savedFavorites)
        favorites.value = new Set(favArray)
      } catch (e) {
        console.error('Failed to parse favorites:', e)
        favorites.value = new Set()
      }
    }

    // 加载访问历史
    if (savedVisits) {
      try {
        visitHistory.value = JSON.parse(savedVisits)
      } catch (e) {
        console.error('Failed to parse visit history:', e)
        visitHistory.value = {}
      }
    }

    // 加载自定义排序
    if (savedOrder) {
      try {
        customOrder.value = JSON.parse(savedOrder)
      } catch (e) {
        console.error('Failed to parse custom order:', e)
        customOrder.value = {}
      }
    }

    // 加载分类顺序
    if (savedCategoryOrder) {
      try {
        categoryOrder.value = JSON.parse(savedCategoryOrder)
      } catch (e) {
        console.error('Failed to parse category order:', e)
        categoryOrder.value = []
      }
    }
  }
})

// 记录点击
const recordClick = (item) => {
  const key = item.url
  clickCounts.value[key] = (clickCounts.value[key] || 0) + 1
  localStorage.setItem('navClickCounts', JSON.stringify(clickCounts.value))
}

// 记录访问时间
const recordVisit = (item) => {
  const key = item.url
  visitHistory.value[key] = new Date().toISOString()
  localStorage.setItem('navVisits', JSON.stringify(visitHistory.value))
}

// 获取最后访问时间
const lastVisitTime = (url) => {
  return visitHistory.value[url] || null
}

// 判断是否收藏
const isFavorite = (item) => {
  return favorites.value.has(item.url || item.id)
}

// 切换收藏状态
const toggleFavorite = (item) => {
  const key = item.url || item.id
  if (favorites.value.has(key)) {
    favorites.value.delete(key)
  } else {
    favorites.value.add(key)
  }
  // 保存到 localStorage
  localStorage.setItem('navFavorites', JSON.stringify([...favorites.value]))
  // 自动云同步
  syncToCloud()
}

// === 密码验证逻辑 ===
// 验证密码（通过 API）
const verifyPassword = async () => {
  try {
    const response = await fetch('/api/private/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: passwordInput.value })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      isPrivateUnlocked.value = true
      showPasswordModal.value = false
      activeCategory.value = 'private'
      passwordError.value = false
      passwordInput.value = ''
    } else {
      passwordError.value = true
    }
  } catch (error) {
    console.error('密码验证失败:', error)
    passwordError.value = true
  }
}

// 取消密码输入
const cancelPassword = () => {
  showPasswordModal.value = false
  passwordInput.value = ''
  passwordError.value = false
}

// === 云同步功能 ===
// 保存同步 token
watch(syncAuthToken, () => {
  localStorage.setItem('syncAuthToken', syncAuthToken.value)
})

// 复制同步 ID
const copyAuthToken = () => {
  navigator.clipboard.writeText(syncAuthToken.value)
  syncStatus.value = { type: 'success', message: 'ID 已复制' }
  setTimeout(() => syncStatus.value = null, 2000)
}

// 编辑 ID 相关状态
const isEditingId = ref(false)
const editingId = ref('')

// 开始编辑 ID
const startEditId = () => {
  editingId.value = syncAuthToken.value
  isEditingId.value = true
}

// 保存 ID
const saveId = () => {
  const newId = editingId.value.trim()
  if (!newId) {
    syncStatus.value = { type: 'error', message: '❌ ID 不能为空' }
    setTimeout(() => syncStatus.value = null, 2000)
    return
  }
  syncAuthToken.value = newId
  isEditingId.value = false
  syncStatus.value = { type: 'success', message: '✅ ID 已更新' }
  setTimeout(() => syncStatus.value = null, 2000)
}

// 取消编辑 ID
const cancelEditId = () => {
  editingId.value = ''
  isEditingId.value = false
}

// 上传到云端
const syncToCloud = async () => {
  isSyncing.value = true
  try {
    // 从 localStorage 读取最新的分类顺序（确保是最新值）
    const latestCategoryOrder = JSON.parse(localStorage.getItem('navCategoryOrder') || '[]')

    const response = await fetch(`${API_BASE}/api/sync/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${syncAuthToken.value}`
      },
      body: JSON.stringify({
        favorites: [...favorites.value],
        order: customOrder.value,
        categoryOrder: latestCategoryOrder,  // 使用从 localStorage 读取的最新值
        visits: visitHistory.value,
        clicks: clickCounts.value,
        timestamp: Date.now()
      })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      syncStatus.value = { type: 'success', message: '✅ 已同步到云端' }
      setTimeout(() => {
        syncStatus.value = null
        showSyncModal.value = false
      }, 2000)
    } else {
      syncStatus.value = { type: 'error', message: '❌ ' + (result.error || '同步失败') }
    }
  } catch (error) {
    syncStatus.value = { type: 'error', message: '❌ 网络错误: ' + error.message }
  } finally {
    isSyncing.value = false
  }
}

// 从云端恢复
const syncFromCloud = async () => {
  isSyncing.value = true
  try {
    const response = await fetch(`${API_BASE}/api/sync/read?userId=${syncAuthToken.value}`)
    const data = await response.json()

    console.log('📥 从云端读取的数据:', data)
    console.log('📥 云端的 categoryOrder:', data.categoryOrder)

    if (response.ok && data.favorites) {
      // 更新本地数据
      favorites.value = new Set(data.favorites)
      customOrder.value = data.order || {}
      categoryOrder.value = data.categoryOrder || []
      visitHistory.value = data.visits || {}
      clickCounts.value = data.clicks || {}

      console.log('✓ 已应用 categoryOrder 到响应式变量:', categoryOrder.value)

      // 保存到 localStorage
      localStorage.setItem('navFavorites', JSON.stringify(data.favorites))
      localStorage.setItem('navCustomOrder', JSON.stringify(data.order))
      localStorage.setItem('navCategoryOrder', JSON.stringify(data.categoryOrder))
      localStorage.setItem('navVisits', JSON.stringify(data.visits))
      localStorage.setItem('navClickCounts', JSON.stringify(data.clicks))

      // 刷新显示
      draggablesList.value = [...filteredItems.value]

      syncStatus.value = { type: 'success', message: '✅ 已从云端恢复' }
      setTimeout(() => {
        syncStatus.value = null
        showSyncModal.value = false
      }, 2000)
    } else {
      syncStatus.value = { type: 'error', message: '❌ ' + (data.error || '恢复失败') }
    }
  } catch (error) {
    syncStatus.value = { type: 'error', message: '❌ 网络错误: ' + error.message }
  } finally {
    isSyncing.value = false
  }
}


// === 拖拽排序逻辑 ===
// 拖拽列表的响应式数据
const draggablesList = ref([])

// 处理拖拽结束事件
const onDragEnd = (evt, categoryKey) => {
  const { oldIndex, newIndex } = evt

  // 如果位置没有变化，直接返回
  if (oldIndex === newIndex) return

  // vuedraggable 已经自动更新了 draggablesList，我们只需要从中提取新的顺序
  // 这比使用 oldIndex/newIndex 手动更新更可靠
  customOrder.value[categoryKey] = draggablesList.value.map(item => item.id || item.url)

  // 保存到 localStorage
  localStorage.setItem('navCustomOrder', JSON.stringify(customOrder.value))
}

// 根据自定义排序对项目进行排序
const sortItemsByCustomOrder = (items, categoryKey) => {
  const order = customOrder.value[categoryKey]
  if (!order || order.length === 0) return items

  // 创建项目映射
  const itemMap = {}
  items.forEach(item => {
    const key = item.id || item.url
    itemMap[key] = item
  })

  // 按照自定义顺序返回
  const sortedItems = []
  order.forEach(key => {
    if (itemMap[key]) {
      sortedItems.push(itemMap[key])
      delete itemMap[key]
    }
  })

  // 添加新添加的项（不在自定义排序中的）
  Object.values(itemMap).forEach(item => {
    sortedItems.push(item)
  })

  return sortedItems
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
  let categoryKey = activeCategory.value

  if (activeCategory.value === 'frequent') {
    // 常用：显示最常访问的网站
    navItems.value.forEach(category => items = items.concat(category.items))
    // 按点击次数排序，取前 16 个
    items = items
      .sort((a, b) => (clickCounts.value[b.url] || 0) - (clickCounts.value[a.url] || 0))
      .slice(0, 16)
  } else if (activeCategory.value === 'favorites') {
    // 我的收藏：显示所有收藏的项目
    navItems.value.forEach(category => {
      category.items.forEach(item => {
        if (isFavorite(item)) {
          items.push(item)
        }
      })
    })
    // 应用自定义排序
    items = sortItemsByCustomOrder(items, 'favorites')
  } else if (activeCategory.value === 'private') {
    // 私密分类：需要密码验证
    if (!isPrivateUnlocked.value) {
      // 如果未解锁，不显示任何内容
      return []
    }
    // 查找私密分类
    const category = navItems.value.find(c => c.category === '私密')
    if (category) {
      items = category.items
      // 应用自定义排序
      items = sortItemsByCustomOrder(items, '私密')
    }
  } else {
    // 普通分类
    const category = navItems.value.find(c => c.category === activeCategory.value)
    if (category) {
      items = category.items
      // 应用自定义排序
      items = sortItemsByCustomOrder(items, activeCategory.value)
    }
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

// 是否启用拖拽（常用分类不启用拖拽，因为它是动态生成的）
const enableDrag = computed(() => {
  return activeCategory.value !== 'frequent'
})

// 监听 activeCategory 变化，更新拖拽数组
watch(activeCategory, () => {
  draggablesList.value = [...filteredItems.value]
}, { immediate: true })

// 监听搜索查询变化，更新拖拽数组
watch(searchQuery, () => {
  draggablesList.value = [...filteredItems.value]
})
</script>

<style>
/* CSS 变量 */
:root {
  /* 主色调 */
  --primary-from: rgb(147, 51, 234);
  --primary-to: rgb(59, 130, 246);

  /* 背景相关 */
  --bg-image: url('/bg.jpg');
  --bg-saturation: 100%;
  --bg-overlay: rgba(0, 0, 0, 0.1);

  /* 玻璃效果 */
  --glass-blur: 12px;
  --glass-bg-opacity: 0.7;
  --glass-border: rgba(255, 255, 255, 0.1);

  /* 文字颜色 */
  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;
}

/* 浅色模式覆盖 */
.light {
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --glass-bg-opacity: 0.85;
  --bg-overlay: rgba(0, 0, 0, 0.05);
}

/* 拖拽样式 */
.ghost-card {
  opacity: 0.4;
  background: rgba(168, 85, 247, 0.1);
  border: 2px dashed rgba(168, 85, 247, 0.5);
}

.dragging-card {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 20px 40px rgba(168, 85, 247, 0.4);
  z-index: 100;
}

.chosen-card {
  cursor: grabbing !important;
}
</style>