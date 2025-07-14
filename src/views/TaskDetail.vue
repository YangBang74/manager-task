<script setup lang="ts">
import { useTaskStore } from '@/stores/tasks'
import type { TaskItem } from '@/stores/tasks'

import { ref, computed } from 'vue'

const store = useTaskStore()

const taskId = ref(store.tasks[0]?.id || 0)
const currentTask = computed(() => store.tasks.find((t) => t.id === taskId.value))

const newContent = ref('')

function addTextItem() {
  if (!newContent.value.trim() || !currentTask.value) return
  store.addItemToTask(currentTask.value.id, 'text', newContent.value.trim())
  newContent.value = ''
}

function addImageItem(base64: string) {
  if (!currentTask.value) return
  store.addItemToTask(currentTask.value.id, 'image', base64)
}

function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile()
      if (file) readFileAsBase64(file)
    }
  }
}

function readFileAsBase64(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      addImageItem(reader.result)
    }
  }
  reader.readAsDataURL(file)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  Array.from(input.files).forEach((file) => readFileAsBase64(file))
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  if (!e.dataTransfer?.files.length) return
  Array.from(e.dataTransfer.files).forEach((file) => readFileAsBase64(file))
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

const editingId = ref<number | null>(null)
const editContent = ref('')

function startEdit(item: TaskItem) {
  editingId.value = item.id
  editContent.value = item.content
}

function cancelEdit() {
  editingId.value = null
  editContent.value = ''
}

function saveEdit(item: TaskItem) {
  if (!editContent.value.trim()) return
  store.editItemContent(currentTask.value!.id, item.id, editContent.value.trim())
  cancelEdit()
}
</script>

<template>
  <div v-if="store.tasks.length" class="max-w-3xl mx-auto px-4">
    <!-- Выбор задачи -->
    <select v-model="taskId" class="mb-4 px-2 py-1 rounded text-black w-full">
      <option v-for="task in store.tasks" :key="task.id" :value="task.id">
        {{ task.title }}
      </option>
    </select>

    <!-- Заголовок задачи -->
    <h2 class="text-xl font-bold border-b border-white/10 pb-2 mb-4">
      {{ currentTask?.title }}
    </h2>

    <!-- Список сообщений -->
    <div class="space-y-2">
      <div v-for="item in currentTask?.items" :key="item.id" class="flex items-start">
        <!-- Сообщение -->
        <div class="max-w-[70%] bg-white/10 text-white px-3 py-2 rounded-xl relative">
          <div v-if="editingId === item.id">
            <input
              v-model="editContent"
              class="text-black px-2 py-1 rounded w-full"
              @keyup.enter="saveEdit(item)"
            />
            <div class="flex gap-2 mt-1 text-xs">
              <button @click="saveEdit(item)" class="text-green-500">Сохранить</button>
              <button @click="cancelEdit" class="text-red-400">Отмена</button>
            </div>
          </div>

          <template v-else>
            <div v-if="item.type === 'text'">{{ item.content }}</div>
            <div v-else-if="item.type === 'image'">
              <img :src="item.content" class="rounded-lg max-w-full max-h-60" />
            </div>

            <div class="absolute top-1 right-1 flex gap-1">
              <button
                v-if="item.type === 'text'"
                @click="startEdit(item)"
                class="text-xs text-yellow-400 hover:text-yellow-500"
              >
                ✏️
              </button>
              <button
                @click="store.removeItemFromTask(currentTask.id, item.id)"
                class="text-xs text-red-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Форма отправки -->
    <div
      class="mt-4 border border-white/20 rounded p-3 bg-white/5 flex items-end gap-2"
      @paste="onPaste"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <!-- Поле ввода -->
      <textarea
        v-model="newContent"
        placeholder="Введите сообщение"
        class="w-full p-2 rounded bg-white/30 text-black resize-none"
        rows="2"
        @keyup.enter.prevent="addTextItem"
      ></textarea>

      <!-- Кнопка прикрепить файл -->
      <label class="cursor-pointer">
        📎
        <input type="file" accept="image/*" hidden @change="onFileChange" multiple />
      </label>

      <!-- Кнопка отправки -->
      <button
        @click="addTextItem"
        class="px-4 py-1 rounded bg-green-600 hover:bg-green-700 transition"
      >
        ➤
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Можно добавить стили подсветки для drag & drop */
</style>
