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
  <VNavigationDrawer
    :rail="!menuIsActive"
    class="flex-no-wrap"
    permanent
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
        title="Добавить задачу"
        @click="showInput = !showInput"
        rounded="lg"
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
        :active-color="{ primary: !task.done }"
        rounded="lg"
        :class="[
          task.done ? 'line-through text-medium-emphasis bg-success' : 'bg-secondary/20',
          !menuIsActive ? 'task-icon-centered' : '',
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

    <template #append>
      <div class="pa-2">
        <VBtn
          block
          variant="tonal"
          @click="menuIsActive = !menuIsActive"
          class="ma-0"
          :class="menuIsActive ? 'text-center ma-0' : 'text-h6'"
          :prepend-icon="menuIsActive ? 'mdi-chevron-left' : 'mdi-chevron-right'"
          :text="menuIsActive ? 'Свернуть' : ''"
        >
        </VBtn>
      </div>
    </template>
  </VNavigationDrawer>

  <VDialog v-model="settingsModal" max-width="360">
    <VCard title="Настройки">
      <template #append>
        <VBtn icon="mdi-close" variant="text" @click="settingsModal = false"></VBtn>
      </template>

      <VCardText>
        <VRadioGroup v-model="theme" label="Оформление">
          <VRadio value="system" label="Системная">
            <template #prepend><v-icon icon="mdi-monitor" /></template>
          </VRadio>
          <VRadio value="light" label="Светлая">
            <template #prepend><v-icon icon="mdi-weather-sunny" /></template>
          </VRadio>
          <VRadio value="dark" label="Тёмная">
            <template #prepend><v-icon icon="mdi-weather-night" /></template>
          </VRadio>
        </VRadioGroup>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
/* Этот стиль все еще нужен для зачеркивания выполненных задач */
.text-decoration-line-through {
  text-decoration: line-through;
}

::v-deep(.v-btn__prepend) {
  margin-inline: 0 !important;
}
</style>
