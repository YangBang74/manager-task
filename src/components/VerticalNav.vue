<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { useTheme } from 'vuetify'

const router = useRouter()
const route = useRoute()
const store = useTaskStore()
const vuetifyTheme = useTheme()

const menuIsActive = ref(true)
const showInput = ref(false)
const newTaskTitle = ref('')
const settingsModal = ref(false)

const theme = computed({
  get: () => {
    // Эта логика определяет, какое радио выбрать в UI
    const name = vuetifyTheme.global.name.value
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if ((name === 'dark' && isSystemDark) || (name === 'light' && !isSystemDark)) {
      return 'system'
    }
    return name
  },
  set: (value: 'light' | 'dark' | 'system') => {
    let newTheme = value
    if (value === 'system') {
      newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    vuetifyTheme.global.name.value = newTheme
  },
})

function addTask() {
  if (!newTaskTitle.value.trim()) return
  store.addTask(newTaskTitle.value.trim())
  newTaskTitle.value = ''
  showInput.value = false
}

function goToTask(taskId: number) {
  router.push(`/task/${taskId}`)
}
</script>

<template>
  <VNavigationDrawer :rail="!menuIsActive" permanent floating rail-width="60" class="border-r">
    <VListItem
      class="px-2 py-1 ma-2"
      lines="two"
      rounded="lg"
      title="User"
      subtitle="main@mail.ru"
      @click.stop
    >
      <template #prepend>
        <VAvatar size="30" color="grey-darken-1">
          <VIcon icon="mdi-account" size="20" />
        </VAvatar>
      </template>
      <template #append>
        <VBtn icon="mdi-cog-outline" variant="text" @click.stop="settingsModal = true" />
      </template>
    </VListItem>

    <VDivider class="my-2" />

    <VList density="compact" nav>
      <VListItem
        prepend-icon="mdi-plus"
        title="Добавить задачу"
        @click="showInput = !showInput"
        rounded="lg"
      />
      <v-expand-transition>
        <div v-if="showInput && menuIsActive" class="px-2 my-2">
          <v-text-field
            v-model="newTaskTitle"
            label="Название задачи"
            variant="outlined"
            density="compact"
            hide-details
            @keydown.enter="addTask"
          />
        </div>
      </v-expand-transition>

      <v-list-item
        v-for="task in store.tasks"
        :key="task.id"
        :active="Number(route.params.id) === task.id"
        @click="goToTask(task.id)"
        :title="task.title"
        active-color="primary"
        rounded="lg"
        :class="{ 'line-through text-medium-emphasis': task.done }"
      >
        <template #prepend>
          <v-icon
            :icon="task.done ? 'mdi-check-circle' : 'mdi-circle-outline'"
            @click.stop="store.toggleTask(task.id)"
            :color="task.done ? 'success' : ''"
          />
        </template>
        <template #append>
          <v-btn
            size="x-small"
            icon="mdi-close"
            variant="text"
            @click.stop="store.removeTask(task.id)"
          />
        </template>
      </v-list-item>
    </VList>

    <template #append>
      <div class="pa-2">
        <v-btn
          block
          variant="tonal"
          @click="menuIsActive = !menuIsActive"
          :prepend-icon="menuIsActive ? 'mdi-chevron-left' : 'mdi-chevron-right'"
          :text="menuIsActive ? 'Свернуть' : ''"
        >
        </v-btn>
      </div>
    </template>
  </VNavigationDrawer>

  <v-dialog v-model="settingsModal" max-width="360">
    <v-card title="Настройки">
      <template #append>
        <v-btn icon="mdi-close" variant="text" @click="settingsModal = false"></v-btn>
      </template>

      <v-card-text>
        <v-radio-group v-model="theme" label="Оформление">
          <v-radio value="system" label="Системная">
            <template #prepend><v-icon icon="mdi-monitor" /></template>
          </v-radio>
          <v-radio value="light" label="Светлая">
            <template #prepend><v-icon icon="mdi-weather-sunny" /></template>
          </v-radio>
          <v-radio value="dark" label="Тёмная">
            <template #prepend><v-icon icon="mdi-weather-night" /></template>
          </v-radio>
        </v-radio-group>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Этот стиль все еще нужен для зачеркивания выполненных задач */
.text-decoration-line-through {
  text-decoration: line-through;
}
</style>
