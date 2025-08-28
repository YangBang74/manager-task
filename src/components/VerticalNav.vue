<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { useTheme, useDisplay } from 'vuetify'
import { Monitor, Sun, Moon } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const store = useTaskStore()
const vuetifyTheme = useTheme()
const display = useDisplay()

// ——————————————————————————
// Тема
// ——————————————————————————
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

// Слушаем системную тему, если выбрано system
const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', () => {
  if (preference.value === 'system') {
    applyTheme()
  }
})

// Применяем тему сразу при загрузке
onMounted(() => {
  applyTheme()
})

// ——————————————————————————
// Меню и задачи
// ——————————————————————————
const menuIsActive = ref(false)
const showInput = ref(false)
const newTaskTitle = ref('')
const settingsModal = ref(false)

function addTask() {
  if (!newTaskTitle.value.trim()) return
  store.addTask(newTaskTitle.value.trim())
  newTaskTitle.value = ''
  showInput.value = false
}

function goToTask(taskId: number) {
  router.push(`/task/${taskId}`)
  if (display.mdAndDown.value) {
    menuIsActive.value = false // Закрываем меню после выбора задачи на мобильных
  }
}

function toggleMenu() {
  menuIsActive.value = !menuIsActive.value
}
</script>

<template>
  <!-- Иконка меню для мобильной версии -->
  <VBtn
    v-if="$vuetify.display.mdAndDown || !menuIsActive"
    icon
    class="mobile-menu-btn"
    @click="toggleMenu"
  >
    <VIcon icon="mdi-menu" size="24" />
  </VBtn>

  <!-- Боковое меню -->
  <VNavigationDrawer
    v-model="menuIsActive"
    :rail="!menuIsActive"
    class="flex-no-wrap"
    :class="$vuetify.display.mdAndDown ? 'absolute' : 'relative'"
    :permanent="!$vuetify.display.mdAndDown"
    floating
    rail-width="60"
    elevation="2"
  >
    <VListItem
      class="px-2 py-1 ma-2 text-nowrap"
      lines="two"
      rounded="lg"
      title="User"
      subtitle="main@mail.ru"
      style="min-height: auto !important"
      @click.stop
    >
      <template #prepend>
        <VAvatar size="30" color="grey-darken-1">
          <VIcon icon="mdi-account" size="20" />
        </VAvatar>
      </template>
      <template #append>
        <VBtn icon size="35" variant="text" @click.stop="settingsModal = true">
          <VIcon icon="mdi-cog-outline" size="20" />
        </VBtn>
      </template>
    </VListItem>
    <VDivider class="my-2" />
    <VList density="compact" nav>
      <VListItem
        prepend-icon="mdi-plus"
        :title="menuIsActive ? 'Добавить задачу' : ''"
        @click="showInput = !showInput"
        rounded="lg"
        :class="!menuIsActive ? 'justify-center' : ''"
      />
      <VExpandTransition>
        <div v-if="showInput && menuIsActive" class="my-2">
          <VTextField
            v-model="newTaskTitle"
            label="Название задачи"
            variant="outlined"
            density="compact"
            class="text-body-2"
            hide-details
            @keydown.enter="addTask"
          />
        </div>
      </VExpandTransition>
      <VListItem
        v-for="task in store.tasks"
        :key="task.id"
        :active="Number(route.params.id) === task.id"
        @click="goToTask(task.id)"
        :title="menuIsActive ? task.title : ''"
        :color="!task.done ? 'success' : undefined"
        rounded="lg"
        :class="[
          task.done ? 'line-through text-medium-emphasis bg-success' : 'bg-secondary/20',
          !menuIsActive ? 'justify-center' : '',
        ]"
      >
        <template #prepend>
          <VIcon
            size="20"
            :class="menuIsActive ? '' : 'ml-1'"
            :icon="task.done ? 'mdi-check-circle' : 'mdi-circle-outline'"
            @click.stop="store.toggleTask(task.id)"
          />
        </template>
        <template #append>
          <VBtn
            size="x-small"
            icon="mdi-close"
            variant="text"
            @click.stop="store.removeTask(task.id)"
            v-if="menuIsActive"
          />
        </template>
      </VListItem>
    </VList>
    <template #append v-if="!$vuetify.display.mdAndDown">
      <div class="pa-2">
        <VBtn
          block
          variant="tonal"
          @click="toggleMenu"
          class="ma-0"
          :class="menuIsActive ? 'text-center ma-0' : 'text-h6 justify-center'"
          :prepend-icon="menuIsActive ? 'mdi-chevron-left' : 'mdi-chevron-right'"
          :text="menuIsActive ? 'Свернуть' : ''"
        >
        </VBtn>
      </div>
    </template>
  </VNavigationDrawer>

  <!-- Модалка настроек темы -->
  <VDialog v-model="settingsModal" max-width="360">
    <VCard title="Настройки">
      <template #append>
        <VBtn icon="mdi-close" variant="text" @click="settingsModal = false"></VBtn>
      </template>
      <VCardText class="d-flex justify-between gap-4">
        <VCard
          :color="theme === 'system' ? 'primary' : ''"
          width="33.3%"
          @click="theme = 'system'"
          class="d-flex flex-col align-center pa-2 rounded-lg"
        >
          <Monitor width="24" />
          <span class="text-sm">Системная</span>
        </VCard>
        <VCard
          :color="theme === 'light' ? 'primary' : ''"
          width="33.3%"
          @click="theme = 'light'"
          class="d-flex flex-col align-center pa-2 rounded-lg"
        >
          <Sun width="24" />
          <span class="text-sm">Светлая</span>
        </VCard>
        <VCard
          :color="theme === 'dark' ? 'primary' : ''"
          width="33.3%"
          @click="theme = 'dark'"
          class="d-flex flex-col align-center pa-2 rounded-lg"
        >
          <Moon width="24" />
          <span class="text-sm">Тёмная</span>
        </VCard>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.text-decoration-line-through {
  text-decoration: line-through;
}
.pa-4 {
  padding: 1rem !important;
}
.mt-2 {
  margin-top: 0.5rem !important;
}
.justify-center {
  justify-content: center;
}
.mobile-menu-btn {
  position: fixed;
  top: 5px;
  left: 5px;
  z-index: 1000;
}
</style>
