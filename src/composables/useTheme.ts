import { ref, watchEffect } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'system')

function applyTheme(value: Theme) {
  if (value === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', isDark)
  } else {
    document.documentElement.classList.toggle('dark', value === 'dark')
  }
  localStorage.setItem('theme', value)
}

// Реакция на изменение системной темы
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', (e) => {
  if (theme.value === 'system') {
    document.documentElement.classList.toggle('dark', e.matches)
  }
})

// Применяем тему при загрузке
watchEffect(() => {
  applyTheme(theme.value)
})

export function useTheme() {
  return { theme, applyTheme }
}
