import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'

export type Theme = 'light' | 'dark' | 'system'

const vuetifyTheme = useTheme()
const preference = ref<Theme>((localStorage.getItem('theme') as Theme) || 'system')

const theme = computed<'light' | 'dark' | 'system'>({
  get: () => preference.value,
  set: (val) => {
    preference.value = val
    localStorage.setItem('theme', val)
    applyTheme()
  },
})

function applyTheme() {
  if (preference.value === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    vuetifyTheme.global.name.value = isDark ? 'dark' : 'light'
  } else {
    vuetifyTheme.global.name.value = preference.value
  }
}

// слушаем системную тему
const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', () => {
  if (preference.value === 'system') {
    applyTheme()
  }
})

// при загрузке применяем тему
onMounted(() => {
  applyTheme()
})
