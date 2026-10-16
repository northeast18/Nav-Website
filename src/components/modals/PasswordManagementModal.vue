<template>
  <BaseModal
    :show="show"
    title="密码管理与安全设置"
    max-width="max-w-lg"
    z-index="z-[60]"
    @close="handleClose"
  >
    <template #icon>
      <div class="p-1.5 rounded-lg bg-primary/10 text-primary">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
    </template>

    <div class="space-y-5">
      <!-- 选项卡切换 -->
      <div class="flex p-1 bg-gray-100 dark:bg-gray-900/60 rounded-xl border border-gray-200/50 dark:border-white/5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          @click="switchTab(tab.id)"
          class="flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
          :class="activeTab === tab.id
            ? 'bg-white dark:bg-gray-800 text-primary shadow-sm font-semibold'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'"
        >
          <component :is="tab.icon" class="w-4 h-4 flex-shrink-0" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- 状态消息提示 -->
      <div
        v-if="statusMessage.text"
        :class="statusMessage.type === 'success'
          ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
          : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'"
        class="p-3 border rounded-xl text-xs sm:text-sm flex items-center gap-2 animate-fadeIn"
      >
        <svg v-if="statusMessage.type === 'success'" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ statusMessage.text }}</span>
      </div>

      <!-- 1. 修改管理员密码 -->
      <form v-if="activeTab === 'admin'" @submit.prevent="submitAdminPassword" class="space-y-4">
        <div class="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="space-y-1">
            <p class="font-semibold">此项为全站站长（全局超级管理员）密码</p>
            <p>仅用于全局公共底座的管理维护。如果您是注册用户要修改自己的登录密码，请点击上方<b>「账号密码」</b>，直接独立修改，无需管理员授权！</p>
          </div>
        </div>

        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">当前旧管理员密码</label>
          <div class="relative">
            <input
              v-model="adminForm.oldPassword"
              :type="showPwd.adminOld ? 'text' : 'password'"
              class="glass-input pr-10"
              placeholder="请输入当前管理员密码"
              required
            />
            <button
              type="button"
              @click="showPwd.adminOld = !showPwd.adminOld"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <EyeIcon :show="showPwd.adminOld" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">新管理员密码</label>
          <div class="relative">
            <input
              v-model="adminForm.newPassword"
              :type="showPwd.adminNew ? 'text' : 'password'"
              class="glass-input pr-10"
              placeholder="至少 4 个字符"
              minlength="4"
              required
            />
            <button
              type="button"
              @click="showPwd.adminNew = !showPwd.adminNew"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <EyeIcon :show="showPwd.adminNew" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">确认新密码</label>
          <div class="relative">
            <input
              v-model="adminForm.confirmPassword"
              :type="showPwd.adminConfirm ? 'text' : 'password'"
              class="glass-input pr-10"
              placeholder="请再次输入新密码"
              minlength="4"
              required
            />
            <button
              type="button"
              @click="showPwd.adminConfirm = !showPwd.adminConfirm"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <EyeIcon :show="showPwd.adminConfirm" />
            </button>
          </div>
        </div>

        <div class="pt-2 flex gap-3">
          <button type="button" @click="handleClose" class="btn-action-cancel">取消</button>
          <button type="submit" :disabled="loading" class="btn-action-primary">
            <span v-if="loading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            <span>{{ loading ? '正在保存...' : '更新管理员密码' }}</span>
          </button>
        </div>
      </form>

      <!-- 2. 修改隐私密码 -->
      <form v-if="activeTab === 'private'" @submit.prevent="submitPrivatePassword" class="space-y-4">
        <!-- 已登录用户的专属提示 -->
        <div v-if="isLoggedIn" class="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            私密空间密码用于解锁您的专属「私密」分类导航卡片。此密码由您自主管理，完全独立，无需管理员授权。
          </div>
        </div>

        <!-- 未登录状态的全局提示 -->
        <div v-else class="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            修改站长全局隐私密码需提供管理员密码进行鉴权。修改后，在首页解锁全局公共「私密」卡片需使用新密码。
          </div>
        </div>

        <!-- 已登录用户：旧私密密码 -->
        <div v-if="isLoggedIn">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">当前旧私密密码（首次设置可留空）</label>
          <div class="relative">
            <input
              v-model="privateForm.oldPassword"
              :type="showPwd.privateOld ? 'text' : 'password'"
              class="glass-input pr-10"
              placeholder="请输入当前私密密码（若尚未设置可留空）"
            />
            <button
              type="button"
              @click="showPwd.privateOld = !showPwd.privateOld"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <EyeIcon :show="showPwd.privateOld" />
            </button>
          </div>
        </div>

        <!-- 未登录站长：验证管理员密码 -->
        <div v-else>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">验证管理员密码</label>
          <div class="relative">
            <input
              v-model="privateForm.adminPassword"
              :type="showPwd.privateAdmin ? 'text' : 'password'"
              class="glass-input pr-10"
              placeholder="请输入管理员密码以验证身份"
              required
            />
            <button
              type="button"
              @click="showPwd.privateAdmin = !showPwd.privateAdmin"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <EyeIcon :show="showPwd.privateAdmin" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">新私密空间密码</label>
          <div class="relative">
            <input
              v-model="privateForm.newPassword"
              :type="showPwd.privateNew ? 'text' : 'password'"
              class="glass-input pr-10"
              placeholder="至少 4 个字符"
              minlength="4"
              required
            />
            <button
              type="button"
              @click="showPwd.privateNew = !showPwd.privateNew"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <EyeIcon :show="showPwd.privateNew" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">确认新密码</label>
          <div class="relative">
            <input
              v-model="privateForm.confirmPassword"
              :type="showPwd.privateConfirm ? 'text' : 'password'"
              class="glass-input pr-10"
              placeholder="请再次输入新密码"
              minlength="4"
              required
            />
            <button
              type="button"
              @click="showPwd.privateConfirm = !showPwd.privateConfirm"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <EyeIcon :show="showPwd.privateConfirm" />
            </button>
          </div>
        </div>

        <div class="pt-2 flex gap-3">
          <button type="button" @click="handleClose" class="btn-action-cancel">取消</button>
          <button type="submit" :disabled="loading" class="btn-action-primary">
            <span v-if="loading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            <span>{{ loading ? '正在保存...' : '更新私密密码' }}</span>
          </button>
        </div>
      </form>

      <!-- 3. 修改账号密码 -->
      <div v-if="activeTab === 'account'">
        <!-- 未登录提醒 -->
        <div v-if="!isLoggedIn" class="p-6 text-center space-y-4">
          <div class="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-1">未登录云同步账号</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">请先登录您的个人账号，再进行账号密码修改。</p>
          </div>
          <button
            type="button"
            @click="$emit('open-sync'); handleClose();"
            class="btn-action-primary inline-flex px-5 py-2 text-xs sm:text-sm"
          >
            前往云同步登录
          </button>
        </div>

        <!-- 已登录表单 -->
        <form v-else @submit.prevent="submitAccountPassword" class="space-y-4">
          <div class="p-3 bg-gradient-to-r from-primary/10 to-primary-to/10 border border-primary/20 rounded-xl flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-to flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {{ currentUser?.username?.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{{ currentUser?.username }}</p>
              <p class="text-[11px] text-green-600 dark:text-green-400 font-medium">个人独立账号 · 修改密码无需管理员授权</p>
            </div>
          </div>

          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">当前原密码</label>
            <div class="relative">
              <input
                v-model="accountForm.oldPassword"
                :type="showPwd.accountOld ? 'text' : 'password'"
                class="glass-input pr-10"
                placeholder="请输入原账号密码"
                required
              />
              <button
                type="button"
                @click="showPwd.accountOld = !showPwd.accountOld"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <EyeIcon :show="showPwd.accountOld" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">新密码（至少 6 个字符）</label>
            <div class="relative">
              <input
                v-model="accountForm.newPassword"
                :type="showPwd.accountNew ? 'text' : 'password'"
                class="glass-input pr-10"
                placeholder="请输入新密码"
                minlength="6"
                required
              />
              <button
                type="button"
                @click="showPwd.accountNew = !showPwd.accountNew"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <EyeIcon :show="showPwd.accountNew" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">确认新密码</label>
            <div class="relative">
              <input
                v-model="accountForm.confirmPassword"
                :type="showPwd.accountConfirm ? 'text' : 'password'"
                class="glass-input pr-10"
                placeholder="请再次输入新密码"
                minlength="6"
                required
              />
              <button
                type="button"
                @click="showPwd.accountConfirm = !showPwd.accountConfirm"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <EyeIcon :show="showPwd.accountConfirm" />
              </button>
            </div>
          </div>

          <div class="pt-2 flex gap-3">
            <button type="button" @click="handleClose" class="btn-action-cancel">取消</button>
            <button type="submit" :disabled="loading" class="btn-action-primary">
              <span v-if="loading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              <span>{{ loading ? '正在修改...' : '更新账号密码' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, h, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  currentUser: {
    type: Object,
    default: null
  },
  userToken: {
    type: String,
    default: ''
  },
  initialTab: {
    type: String,
    default: 'admin'
  }
})

const emit = defineEmits([
  'close',
  'admin-password-changed',
  'private-password-changed',
  'user-password-changed',
  'open-sync'
])

// 选项卡
const activeTab = ref(props.initialTab || (props.isLoggedIn ? 'account' : 'admin'))

watch(() => props.initialTab, (newTab) => {
  if (newTab) activeTab.value = newTab
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    statusMessage.text = ''
    resetForms()
    if (props.initialTab) {
      activeTab.value = props.initialTab
    } else {
      activeTab.value = props.isLoggedIn ? 'account' : 'admin'
    }
  }
})

// 图标组件定义
const ShieldIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' })
])
const LockClosedIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' })
])
const UserKeyIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' })
])

const tabs = computed(() => {
  if (props.isLoggedIn) {
    return [
      { id: 'account', label: '账号密码', icon: UserKeyIcon },
      { id: 'private', label: '私密空间密码', icon: LockClosedIcon },
      { id: 'admin', label: '站长管理员密码', icon: ShieldIcon }
    ]
  }
  return [
    { id: 'admin', label: '站长管理员密码', icon: ShieldIcon },
    { id: 'private', label: '站长隐私密码', icon: LockClosedIcon },
    { id: 'account', label: '账号密码', icon: UserKeyIcon }
  ]
})

// 眼睛小组件
const EyeIcon = ({ show }) => {
  return h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    show
      ? h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' })
      : h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' })
  ])
}

const loading = ref(false)
const statusMessage = reactive({ text: '', type: 'info' })

const showPwd = reactive({
  adminOld: false,
  adminNew: false,
  adminConfirm: false,
  privateOld: false,
  privateAdmin: false,
  privateNew: false,
  privateConfirm: false,
  accountOld: false,
  accountNew: false,
  accountConfirm: false
})

const adminForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const privateForm = reactive({ oldPassword: '', adminPassword: '', newPassword: '', confirmPassword: '' })
const accountForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const switchTab = (tabId) => {
  activeTab.value = tabId
  statusMessage.text = ''
}

const resetForms = () => {
  adminForm.oldPassword = ''
  adminForm.newPassword = ''
  adminForm.confirmPassword = ''
  privateForm.oldPassword = ''
  privateForm.adminPassword = ''
  privateForm.newPassword = ''
  privateForm.confirmPassword = ''
  accountForm.oldPassword = ''
  accountForm.newPassword = ''
  accountForm.confirmPassword = ''
}

const handleClose = () => {
  statusMessage.text = ''
  emit('close')
}

// 提交修改管理员密码
const submitAdminPassword = async () => {
  statusMessage.text = ''
  if (adminForm.newPassword !== adminForm.confirmPassword) {
    statusMessage.text = '两次输入的新密码不一致'
    statusMessage.type = 'error'
    return
  }

  loading.value = true
  try {
    const res = await fetch('/api/auth/change-admin-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: adminForm.oldPassword,
        newPassword: adminForm.newPassword
      })
    })
    const data = await res.json()
    if (res.ok && data.success) {
      statusMessage.text = '✅ 站长管理员密码已成功修改！'
      statusMessage.type = 'success'
      const newPwd = adminForm.newPassword
      resetForms()
      emit('admin-password-changed', newPwd)
    } else {
      statusMessage.text = data.error || '修改失败，请重试'
      statusMessage.type = 'error'
    }
  } catch (err) {
    statusMessage.text = '网络请求失败: ' + err.message
    statusMessage.type = 'error'
  } finally {
    loading.value = false
  }
}

// 提交修改隐私密码
const submitPrivatePassword = async () => {
  statusMessage.text = ''
  if (privateForm.newPassword !== privateForm.confirmPassword) {
    statusMessage.text = '两次输入的新密码不一致'
    statusMessage.type = 'error'
    return
  }

  loading.value = true
  try {
    if (props.isLoggedIn) {
      // 已登录用户：修改个人专属私密空间密码
      const headers = { 'Content-Type': 'application/json' }
      if (props.userToken) {
        headers['Authorization'] = `Bearer ${props.userToken}`
      }
      const res = await fetch('/api/private/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          oldPassword: privateForm.oldPassword,
          newPassword: privateForm.newPassword
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        statusMessage.text = '✅ 个人专属私密密码已成功修改！'
        statusMessage.type = 'success'
        const newPwd = privateForm.newPassword
        resetForms()
        emit('private-password-changed', newPwd)
      } else {
        statusMessage.text = data.error || '修改失败，请重试'
        statusMessage.type = 'error'
      }
    } else {
      // 未登录访客/站长：修改全局隐私密码
      const res = await fetch('/api/auth/change-private-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: privateForm.adminPassword,
          newPassword: privateForm.newPassword
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        statusMessage.text = '✅ 站长全局隐私密码已成功修改！'
        statusMessage.type = 'success'
        const newPwd = privateForm.newPassword
        resetForms()
        emit('private-password-changed', newPwd)
      } else {
        statusMessage.text = data.error || '修改失败，请重试'
        statusMessage.type = 'error'
      }
    }
  } catch (err) {
    statusMessage.text = '网络请求失败: ' + err.message
    statusMessage.type = 'error'
  } finally {
    loading.value = false
  }
}

// 提交修改账号密码
const submitAccountPassword = async () => {
  statusMessage.text = ''
  if (accountForm.newPassword !== accountForm.confirmPassword) {
    statusMessage.text = '两次输入的新密码不一致'
    statusMessage.type = 'error'
    return
  }

  loading.value = true
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.userToken}`
      },
      body: JSON.stringify({
        oldPassword: accountForm.oldPassword,
        newPassword: accountForm.newPassword
      })
    })
    const data = await res.json()
    if (res.ok && data.success) {
      statusMessage.text = '✅ 账号密码已成功修改！'
      statusMessage.type = 'success'
      resetForms()
      emit('user-password-changed', {
        token: data.token,
        userId: data.userId,
        username: data.username
      })
    } else {
      statusMessage.text = data.error || '修改失败，请重试'
      statusMessage.type = 'error'
    }
  } catch (err) {
    statusMessage.text = '网络请求失败: ' + err.message
    statusMessage.type = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
