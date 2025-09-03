<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { useTheme } from 'vuetify'
import ThemeSettingsDialog from './ThemeSettingsDialog.vue'
import type { Project } from '@/types/tasks'
import { useDisplay } from 'vuetify'

const display = useDisplay()
const router = useRouter()
const store = useTaskStore()
const vuetifyTheme = useTheme()

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
  if (preference.value === 'system') {
    applyTheme()
  }
})
onMounted(() => {
  applyTheme()
})

const menuIsActive = ref(false)
const showInput = ref(false)
const newTaskTitle = ref('')
const settingsModal = ref(false)
const currentProject = ref<null | Project>(null)
const addMode = ref<'task' | 'project'>('task')

function startAdd(mode: 'task' | 'project') {
  addMode.value = mode
  showInput.value = true
}

function add() {
  if (!newTaskTitle.value.trim()) return
  const title = newTaskTitle.value.trim()
  if (addMode.value === 'project') {
    if (!currentProject.value) store.addItem('project', title)
  } else {
    if (currentProject.value) {
      store.addTaskToProject(currentProject.value.id, title)
    } else {
      store.addItem('task', title)
    }
  }
  newTaskTitle.value = ''
  showInput.value = false
}

function selectProject(projectId: number) {
  const project = store.items.find((i) => i.type === 'project' && i.id === projectId) as
    | Project
    | undefined
  if (project) {
    currentProject.value = project
  }
}

function goBack() {
  currentProject.value = null
}

function toggleMenu() {
  menuIsActive.value = !menuIsActive.value
}

function goToTask(id: number) {
  router.push({ name: 'task-detail', params: { id } })
}

const railBool = computed(() => {
  return !menuIsActive.value && display.mdAndUp
})
</script>

<template>
  <!-- Иконка меню для мобильной версии -->
  <VBtn v-if="display.mdAndDown && !menuIsActive" icon class="mobile-menu-btn" @click="toggleMenu">
    <VIcon icon="mdi-menu" size="24" />
  </VBtn>

  <!-- Боковое меню -->
  <VNavigationDrawer
    :v-model="display.mdAndDown ? menuIsActive : true"
    :rail-width="60"
    :width="menuIsActive ? 280 : 60"
    class="flex-no-wrap"
    :permanent="!display.mdAndDown"
    floating
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
        v-if="currentProject"
        prepend-icon="mdi-arrow-left"
        :title="menuIsActive ? 'Назад' : ''"
        @click="goBack"
        rounded="lg"
        :class="!menuIsActive ? 'justify-center' : ''"
      />
      <VListItem
        v-if="!currentProject"
        prepend-icon="mdi-folder-plus"
        :title="menuIsActive ? 'Добавить проект' : ''"
        @click="startAdd('project')"
        rounded="lg"
        :class="!menuIsActive ? 'justify-center' : ''"
      />
      <VListItem
        prepend-icon="mdi-plus"
        :title="menuIsActive ? 'Добавить задачу' : ''"
        @click="startAdd('task')"
        rounded="lg"
        :class="!menuIsActive ? 'justify-center' : ''"
      />

      <VExpandTransition>
        <div v-if="showInput && menuIsActive" class="my-2">
          <VTextField
            v-model="newTaskTitle"
            :label="addMode === 'project' ? 'Название проекта' : 'Название задачи'"
            variant="outlined"
            density="compact"
            class="text-body-2"
            hide-details
            @keydown.enter="add"
          />
        </div>
      </VExpandTransition>

      <template v-if="currentProject">
        <VListItem
          v-for="task in currentProject.tasks"
          :key="task.id"
          rounded="lg"
          :class="[
            task.done ? 'line-through text-medium-emphasis bg-success' : 'bg-secondary/20',
            !menuIsActive ? 'justify-center' : '',
          ]"
          @click="goToTask(task.id)"
        >
          <template #title>
            <span v-if="menuIsActive">{{ task.title }}</span>
          </template>
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
      </template>

      <template v-else>
        <VListItem
          v-for="item in store.items"
          :key="item.id"
          rounded="lg"
          :class="!menuIsActive ? 'justify-center' : ''"
          @click="item.type === 'project' ? selectProject(item.id) : goToTask(item.id)"
        >
          <template #title>
            <span v-if="menuIsActive">{{ item.title }}</span>
          </template>
          <template #prepend>
            <VIcon
              v-if="item.type === 'project'"
              size="20"
              :class="menuIsActive ? '' : 'ml-1'"
              icon="mdi-folder"
            />
            <VIcon
              v-else
              size="20"
              :class="menuIsActive ? '' : 'ml-1'"
              :icon="item.done ? 'mdi-check-circle' : 'mdi-circle-outline'"
              @click.stop="store.toggleTask(item.id)"
            />
          </template>
          <template #append>
            <VBtn
              size="x-small"
              icon="mdi-close"
              variant="text"
              @click.stop="store.removeById(item.id)"
              v-if="menuIsActive"
            />
          </template>
        </VListItem>
      </template>
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
        />
      </div>
    </template>
  </VNavigationDrawer>

  <!-- Модалка настроек темы -->
  <ThemeSettingsDialog v-model="settingsModal" :current-theme="theme" @set-theme="theme = $event" />
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
