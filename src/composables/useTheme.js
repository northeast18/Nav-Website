import { ref, watch, onMounted } from 'vue'

// 预设主题色 (Updated to space-separated RGB for Tailwind opacity support)
const PRESET_COLORS = {
  tech: {
    name: '科技蓝',
    from: '59 130 246',
    to: '14 165 233',
    bg: {
      dark: { from: '2 6 23', to: '15 23 42' },
      light: { from: '239 246 255', to: '203 213 225' }
    }
  },
  minimal: {
    name: '极简白',
    from: '148 163 184',
    to: '226 232 240',
    bg: {
      dark: { from: '2 6 23', to: '15 23 42' },
      light: { from: '241 245 249', to: '226 232 240' }
    }
  },
  purple: {
    name: '梦幻紫',
    from: '147 51 234',
    to: '236 72 153',
    bg: {
      dark: { from: '88 28 135', to: '15 23 42' },
      light: { from: '245 243 255', to: '233 213 255' }
    }
  },
  emerald: {
    name: '清新绿',
    from: '16 185 129',
    to: '52 211 153',
    bg: {
      dark: { from: '6 78 59', to: '15 23 42' },
      light: { from: '232 253 245', to: '219 252 240' }
    }
  },
  orange: {
    name: '活力橙',
    from: '249 115 22',
    to: '251 146 60',
    bg: {
      dark: { from: '67 20 7', to: '15 23 42' },
      light: { from: '254 245 235', to: '252 240 230' }
    }
  },
  dark: {
    name: '暗夜',
    from: '71 85 105',
    to: '30 41 59',
    bg: {
      dark: { from: '2 6 23', to: '0 0 0' },
      light: { from: '241 245 249', to: '203 213 225' }
    }
  }
}

const DEFAULT_SETTINGS = {
  mode: 'dark',
  primaryColor: 'minimal',
  backgroundType: 'none',
  bgImage: '',
  saturation: 100,
  glassEffect: 30,
  blur: 10,
  bgBrightness: 100
}

const settings = ref({ ...DEFAULT_SETTINGS })

const adjustBrightness = (rgbColor, factor, isDark) => {
  const [r, g, b] = rgbColor.split(' ').map(Number)
  let adjustedFactor = factor

  if (isDark) {
    adjustedFactor = Math.min(1.5, factor)
  } else {
    adjustedFactor = Math.max(0.7, factor)
  }

  const newR = Math.min(255, Math.round(r * adjustedFactor))
  const newG = Math.min(255, Math.round(g * adjustedFactor))
  const newB = Math.min(255, Math.round(b * adjustedFactor))

  return `${newR} ${newG} ${newB}`
}

// 应用主题到 DOM
const applyTheme = () => {
  const root = document.documentElement
  const s = settings.value

  // 1. 设置模式 (Dark/Light)
  if (s.mode === 'auto') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  } else {
    if (s.mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // 2. 设置主题色 (CSS Variables)
  let fromColor, toColor
  let bgFrom, bgTo

  const isDark = root.classList.contains('dark')

  if (PRESET_COLORS[s.primaryColor]) {
    const preset = PRESET_COLORS[s.primaryColor]
    fromColor = preset.from
    toColor = preset.to

    const bg = isDark ? preset.bg.dark : preset.bg.light
    const brightnessFactor = s.bgBrightness / 100

    bgFrom = adjustBrightness(bg.from, brightnessFactor, isDark)
    bgTo = adjustBrightness(bg.to, brightnessFactor, isDark)
  } else if (s.primaryColor.startsWith('#')) {
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '59 130 246'
    }
    fromColor = hexToRgb(s.primaryColor)
    toColor = hexToRgb(s.primaryColor)

    const preset = PRESET_COLORS.tech
    const bg = isDark ? preset.bg.dark : preset.bg.light
    const brightnessFactor = s.bgBrightness / 100

    bgFrom = adjustBrightness(bg.from, brightnessFactor, isDark)
    bgTo = adjustBrightness(bg.to, brightnessFactor, isDark)
  } else {
    const preset = PRESET_COLORS.tech
    fromColor = preset.from
    toColor = preset.to
    const bg = isDark ? preset.bg.dark : preset.bg.light
    const brightnessFactor = s.bgBrightness / 100

    bgFrom = adjustBrightness(bg.from, brightnessFactor, isDark)
    bgTo = adjustBrightness(bg.to, brightnessFactor, isDark)
  }

  root.style.setProperty('--primary-from', fromColor)
  root.style.setProperty('--primary-to', toColor)
  root.style.setProperty('--page-bg-from', bgFrom)
  root.style.setProperty('--page-bg-to', bgTo)

  // 3. 设置背景 (Handle in style.css or App.vue via var)
  if (s.backgroundType === 'custom' && s.bgImage) {
    root.style.setProperty('--bg-image', `url('${s.bgImage}')`)
    root.style.setProperty('--bg-opacity', '1')
  } else if (s.backgroundType === 'default') {
    root.style.setProperty('--bg-image', `url('/bg.jpg')`)
    root.style.setProperty('--bg-opacity', '0.4')
  } else {
    root.style.setProperty('--bg-image', 'none')
    root.style.setProperty('--bg-opacity', '0')
  }

  root.style.setProperty('--bg-saturation', `${s.saturation}%`)

  // 4. 设置玻璃效果
  // Map 0-100 range to useful CSS values
  const blurPx = Math.floor((s.glassEffect / 100) * 20) // 0px to 20px
  const bgOpacity = 0.3 + (s.glassEffect / 100) * 0.6   // 0.3 to 0.9

  root.style.setProperty('--glass-blur', `${blurPx}px`)
  root.style.setProperty('--glass-bg-opacity', bgOpacity)
}

// 处理背景上传
const handleBackgroundUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    settings.value.bgImage = e.target.result
    settings.value.backgroundType = 'custom'
  }
  reader.readAsDataURL(file)
}

const resetBackground = () => {
  settings.value.backgroundType = 'none'
  settings.value.bgImage = ''
}

const setDefaultBackground = () => {
  settings.value.backgroundType = 'default'
  settings.value.bgImage = ''
}

export function useTheme() {
  onMounted(() => {
    // 从 localStorage 加载设置
    const saved = localStorage.getItem('themeSettings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        settings.value = { ...DEFAULT_SETTINGS, ...parsed }
      } catch (e) {
        console.error('Failed to parse theme settings', e)
      }
    }
    applyTheme()
  })

  // 监听设置变化并保存
  watch(settings, (newSettings) => {
    localStorage.setItem('themeSettings', JSON.stringify(newSettings))
    applyTheme()
  }, { deep: true })

  // 监听系统主题变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (settings.value.mode === 'auto') {
        applyTheme()
      }
    })
  }

  return {
    settings,
    PRESET_COLORS,
    handleBackgroundUpload,
    resetBackground,
    setDefaultBackground
  }
}
