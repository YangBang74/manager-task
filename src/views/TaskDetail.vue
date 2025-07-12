<script setup lang="ts">
import { useTaskStore } from '@/stores/tasks'
import { ref } from 'vue'

const store = useTaskStore()

// Берём первую задачу для примера
const taskId = store.tasks[0]?.id || 0

const selectedType = ref<'text' | 'image'>('text')
const newContent = ref('')

function addTextItem() {
  if (!newContent.value.trim()) return
  store.addItemToTask(taskId, 'text', newContent.value.trim())
  newContent.value = ''
}

function addImageItem(base64: string) {
  store.addItemToTask(taskId, 'image', base64)
}

// Обработчик вставки из буфера
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

// Обработчик выбора файла input[type=file]
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  Array.from(input.files).forEach((file) => readFileAsBase64(file))
}

// Обработчик drag & drop
function onDrop(e: DragEvent) {
  e.preventDefault()
  if (!e.dataTransfer?.files.length) return
  Array.from(e.dataTransfer.files).forEach((file) => readFileAsBase64(file))
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}
</script>

<template>
  <div v-if="taskId">
    <!-- Заголовок задачи -->
    <h2 class="text-xl font-bold border-b border-white/10 pb-2">
      {{ store.tasks.find((t) => t.id === taskId)?.title }}
    </h2>

    <!-- Список блоков -->
    <div
      v-for="item in store.tasks.find((t) => t.id === taskId)?.items"
      :key="item.id"
      class="bg-white/10 p-2 rounded"
    >
      <div v-if="item.type === 'text'">{{ item.content }}</div>
      <div v-else-if="item.type === 'image'">
        <img :src="item.content" class="w-full rounded" />
      </div>
    </div>

    <!-- Форма добавления -->
    <div
      class="p-4 border border-white/20 rounded"
      @paste="onPaste"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <!-- Выбор типа -->
      <select
        v-model="selectedType"
        class="bg-transparent border border-white/30 rounded px-2 py-1 mb-2 w-full text-black"
      >
        <option value="text">Текст</option>
        <option value="image">Изображение</option>
      </select>

      <!-- Ввод текста -->
      <textarea
        v-if="selectedType === 'text'"
        v-model="newContent"
        placeholder="Введите текст"
        class="w-full p-2 rounded bg-white/30 text-black resize-none"
        rows="3"
        @keyup.enter.prevent="addTextItem"
      ></textarea>

      <!-- Кнопка загрузки изображения -->
      <div v-if="selectedType === 'image'" class="flex flex-col gap-2">
        <input type="file" accept="image/*" multiple @change="onFileChange" class="text-black" />
        <p class="text-xs text-white/50">
          Или вставьте картинку из буфера (Ctrl+V) или перетащите сюда
        </p>
      </div>

      <button
        v-if="selectedType === 'text'"
        @click="addTextItem"
        class="mt-2 px-4 py-1 rounded bg-green-600 hover:bg-green-700 transition"
      >
        Добавить текстовый блок
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Можно добавить стили подсветки для drag & drop */
</style>
