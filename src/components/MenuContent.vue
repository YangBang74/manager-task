<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore } from '@/stores/tasks'
import { useRouter } from 'vue-router'
import type { Project } from '@/types/tasks'
import ThemeSettingsDialog from './ThemeSettingsDialog.vue'

const props = defineProps<{ menuIsActive: boolean }>()
const store = useTaskStore()
const router = useRouter()
const showInput = ref(false)
const newTaskTitle = ref('')
const currentProject = ref<null | Project>(null)
const addMode = ref<'task' | 'project'>('task')
const settingsModal = ref<boolean>(false)

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
    if (currentProject.value) store.addTaskToProject(currentProject.value.id, title)
    else store.addItem('task', title)
  }
  newTaskTitle.value = ''
  showInput.value = false
}

function selectProject(projectId: number) {
  const project = store.items.find((i) => i.type === 'project' && i.id === projectId) as
    | Project
    | undefined
  if (project) currentProject.value = project
}

function goBack() {
  currentProject.value = null
}

function goToTask(id: number) {
  router.push({ name: 'task-detail', params: { id } })
}

function toggleTaskDone(id: number) {
  store.toggleTask(id)
}

function removeTask(id: number) {
  store.removeTask(id)
}

function removeItem(id: number) {
  store.removeById(id)
}
</script>

<template>
  <VListItem
    class="px-2 py-1 ma-2 text-nowrap"
    lines="two"
    rounded="lg"
    title="User"
    subtitle="main@mail.ru"
    style="min-height: auto !important"
  >
    <template #prepend>
      <VAvatar size="30" color="grey-darken-1">
        <VIcon icon="mdi-account" size="20" />
      </VAvatar>
    </template>
    <template #append>
      <VBtn icon size="35" variant="text" @click="settingsModal = true">
        <VIcon icon="mdi-cog-outline" size="20" />
      </VBtn>
    </template>
  </VListItem>

  <VDivider class="my-2" />

  <VList density="compact" nav>
    <VListItem
      v-if="currentProject"
      prepend-icon="mdi-arrow-left"
      :title="props.menuIsActive ? 'Назад' : ''"
      @click="goBack"
      rounded="lg"
      :class="!props.menuIsActive ? 'justify-center' : ''"
    />

    <VListItem
      v-if="!currentProject"
      prepend-icon="mdi-folder-plus"
      :title="props.menuIsActive ? 'Добавить проект' : ''"
      @click="startAdd('project')"
      rounded="lg"
      :class="!props.menuIsActive ? 'justify-center' : ''"
    />

    <VListItem
      prepend-icon="mdi-plus"
      :title="props.menuIsActive ? 'Добавить задачу' : ''"
      @click="startAdd('task')"
      rounded="lg"
      :class="!props.menuIsActive ? 'justify-center' : ''"
    />

    <VExpandTransition>
      <div v-if="showInput && props.menuIsActive" class="my-2">
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
          !props.menuIsActive ? 'justify-center' : '',
        ]"
        @click="goToTask(task.id)"
      >
        <template #title>
          <span v-if="props.menuIsActive">{{ task.title }}</span>
        </template>
        <template #prepend>
          <VIcon
            size="20"
            :class="props.menuIsActive ? '' : 'ml-1'"
            :icon="task.done ? 'mdi-check-circle' : 'mdi-circle-outline'"
            @click.stop="toggleTaskDone(task.id)"
          />
        </template>
        <template #append>
          <VBtn
            size="x-small"
            icon="mdi-close"
            variant="text"
            @click.stop="removeTask(task.id)"
            v-if="props.menuIsActive"
          />
        </template>
      </VListItem>
    </template>

    <template v-else>
      <VListItem
        v-for="item in store.items"
        :key="item.id"
        rounded="lg"
        :class="[
          item.type === 'task' && item.done
            ? 'line-through text-medium-emphasis bg-success'
            : 'bg-secondary/20',
          !props.menuIsActive ? 'justify-center' : '',
        ]"
        @click="item.type === 'project' ? selectProject(item.id) : goToTask(item.id)"
      >
        <template #title>
          <span v-if="props.menuIsActive">{{ item.title }}</span>
        </template>
        <template #prepend>
          <VIcon
            v-if="item.type === 'project'"
            size="20"
            :class="props.menuIsActive ? '' : 'ml-1'"
            icon="mdi-folder"
          />
          <VIcon
            v-else
            size="20"
            :class="props.menuIsActive ? '' : 'ml-1'"
            :icon="item.done ? 'mdi-check-circle' : 'mdi-circle-outline'"
            @click.stop="toggleTaskDone(item.id)"
          />
        </template>
        <template #append>
          <VBtn
            size="x-small"
            icon="mdi-close"
            variant="text"
            @click.stop="removeItem(item.id)"
            v-if="props.menuIsActive"
          />
        </template>
      </VListItem>
    </template>
  </VList>
  <!-- Модалка настроек темы -->
  <ThemeSettingsDialog v-model="settingsModal" @update:model-value="settingsModal = false" />
</template>

<style scoped>
.text-decoration-line-through {
  text-decoration: line-through;
}
.justify-center {
  justify-content: center;
}
</style>
