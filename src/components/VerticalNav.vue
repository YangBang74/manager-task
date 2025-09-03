<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { useTheme, useDisplay } from 'vuetify'
import ThemeSettingsDialog from './ThemeSettingsDialog.vue'
import MenuContent from './MenuContent.vue' // импорт нового компонента
import type { Project } from '@/types/tasks'

const display = useDisplay()
const router = useRouter()
const store = useTaskStore()
const vuetifyTheme = useTheme()

// Темы
export type Theme = 'light' | 'dark' | 'system'
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
const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', () => {
  if (preference.value === 'system') applyTheme()
})
onMounted(() => applyTheme())

// Меню
const menuIsActive = ref(false)
const settingsModal = ref(false)

function toggleMenu() {
  menuIsActive.value = !menuIsActive.value
}
</script>

<template>
  <!-- Мобильная версия: кнопка меню -->
  <VBtn
    v-if="$vuetify.display.mdAndDown && !menuIsActive"
    icon
    class="mobile-menu-btn"
    @click="toggleMenu"
  >
    <VIcon icon="mdi-menu" size="24" />
  </VBtn>

  <!-- Навигация -->
  <VNavigationDrawer
    v-if="$vuetify.display.mdAndDown"
    v-model="menuIsActive"
    class="flex-no-wrap"
    floating
    elevation="2"
  >
    <MenuContent :menu-is-active="menuIsActive" />
  </VNavigationDrawer>

  <VNavigationDrawer v-else expand-on-hover permanent rail :width="280" :rail-width="60">
    <MenuContent :menu-is-active="true" />
  </VNavigationDrawer>

  <!-- Модалка настроек темы -->
  <ThemeSettingsDialog v-model="settingsModal" :current-theme="theme" @set-theme="theme = $event" />
</template>

<style scoped>
.mobile-menu-btn {
  position: fixed;
  top: 5px;
  left: 5px;
  z-index: 1000;
}
</style>
