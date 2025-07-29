import { ref, watchEffect } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const theme = ref<Theme>('system')

function applyTheme(value: Theme) {
  if (value === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', isDark)
  } else {
    document.documentElement.classList.toggle('dark', value === 'dark')
  }
}

watchEffect(() => {
  applyTheme(theme.value)
})

export function useTheme() {
  return { theme, applyTheme }
}
