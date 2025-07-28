<script setup lang="ts">
import { useTaskStore } from '@/stores/tasks'
import type { TaskItem } from '@/stores/tasks'
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Paperclip, Send, Pencil, X } from 'lucide-vue-next'

const store = useTaskStore()
const route = useRoute()

// Инициализация taskId из параметров маршрута
const taskId = ref(Number(route.params.id) || store.tasks[0]?.id || 0)
const currentTask = computed(() => store.tasks.find((t) => t.id === taskId.value))
const newContent = ref<string>('') // Явно указываем тип string
const editingItem = ref<TaskItem | null>(null) // Track the item being edited
const messagesContainer = ref<HTMLElement | null>(null)
const contextMenu = ref<{ visible: boolean; x: number; y: number; item: TaskItem | null }>({
  visible: false,
  x: 0,
  y: 0,
  item: null,
})
// Modal state for image preview
const showImageModal = ref(false)
const selectedImage = ref<string>('')

// Показать контекстное меню при правом клике
function showContextMenu(event: MouseEvent, item: TaskItem) {
  event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    item,
  }
}

// Скрыть контекстное меню
function hideContextMenu() {
  contextMenu.value.visible = false
  contextMenu.value.item = null
}

// Обработчик клика вне меню
function onClickOutside(event: MouseEvent) {
  if (contextMenu.value.visible && !(event.target as HTMLElement).closest('.context-menu')) {
    hideContextMenu()
  }
}

// Добавить или отредактировать текстовое сообщение
function addTextItem() {
  if (
    !newContent.value ||
    typeof newContent.value !== 'string' ||
    !newContent.value.trim() ||
    !currentTask.value
  ) {
    console.warn('Cannot add/edit text item: invalid content or task', {
      newContent: newContent.value,
      currentTask: currentTask.value,
    })
    return
  }
  if (editingItem.value) {
    // Save edited item
    store.editItemContent(currentTask.value.id, editingItem.value.id, newContent.value.trim())
    cancelEdit()
  } else {
    // Add new item
    store.addItemToTask(currentTask.value.id, 'text', newContent.value.trim())
  }
  newContent.value = ''
  scrollToBottom()
}

// Добавить изображение
function addImageItem(base64: string) {
  if (!currentTask.value) {
    console.warn('No current task to add image to')
    return
  }
  store.addItemToTask(currentTask.value.id, 'image', base64)
  scrollToBottom()
}

// Чтение файла как base64
function readFileAsBase64(file: File) {
  if (!file.type.startsWith('image/')) {
    console.warn('Only image files are supported:', file.type)
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      addImageItem(reader.result)
    } else {
      console.warn('FileReader result is not a string')
    }
  }
  reader.onerror = () => console.error('Failed to read file:', file.name)
  reader.readAsDataURL(file)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  Array.from(input.files).forEach((file) => readFileAsBase64(file))
}

function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.includes('image')) {
      const file = item.getAsFile()
      if (file) readFileAsBase64(file)
    }
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  if (!e.dataTransfer?.files.length) return
  Array.from(e.dataTransfer.files).forEach((file) => readFileAsBase64(file))
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

// Начать редактирование
function startEdit(item: TaskItem) {
  if (item.type !== 'text') return // Only text items can be edited
  editingItem.value = item
  newContent.value = item.content
  hideContextMenu()
  nextTick(() => {
    const textarea = document.querySelector('textarea')
    if (textarea) textarea.focus()
  })
}

// Отменить редактирование
function cancelEdit() {
  editingItem.value = null
  newContent.value = ''
}

// Удалить сообщение
function deleteItem(item: TaskItem) {
  if (!currentTask.value) return
  store.removeItemFromTask(currentTask.value.id, item.id)
  hideContextMenu()
}

// Прокрутка вниз
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: 'smooth',
      })
    }
  })
}

// Открыть модальное окно с изображением
function openImageModal(src: string) {
  selectedImage.value = src
  showImageModal.value = true
}

// Закрыть модальное окно
function closeImageModal() {
  showImageModal.value = false
  selectedImage.value = ''
}

onMounted(() => {
  if (!currentTask.value) {
    console.warn('No task found for ID:', taskId.value)
  }
  if (newContent.value === undefined) {
    console.error('newContent is undefined on mount, resetting to empty string')
    newContent.value = ''
  }
  document.addEventListener('click', onClickOutside)
  scrollToBottom()
})
</script>

<template>
  <div class="h-screen flex w-full flex-col text-white bg-white/4 font-sans overflow-hidden">
    <!-- Заголовок задачи -->
    <header class="p-4 border-b border-white/10 flex items-center h-16">
      <h2 class="text-lg font-semibold truncate flex-1">
        {{ currentTask?.title || 'Задача не найдена' }}
      </h2>
    </header>

    <!-- Сообщения -->
    <main
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      @paste="onPaste"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <div v-if="!currentTask" class="text-center text-white/50 py-8">
        Выберите задачу из бокового меню
      </div>
      <div v-else-if="!currentTask.items.length" class="text-center text-white/50 py-8">
        Добавьте данные задачи!
      </div>
      <div
        v-for="item in currentTask?.items"
        :key="item.id"
        class="flex justify-start items-center min-h-[48px]"
        @contextmenu="showContextMenu($event, item)"
      >
        <div
          class="bg-green-600/80 py-2 px-3 rounded-2xl max-w-[75%] relative shadow-md transition-all hover:bg-green-600/90"
        >
          <div v-if="item.type === 'text'" class="break-words whitespace-pre-wrap text-sm">
            {{ item.content }}
          </div>
          <div v-else-if="item.type === 'image'">
            <img
              :src="item.content"
              class="rounded-xl max-w-full max-h-60 object-contain cursor-pointer"
              alt="Attached image"
              @click="openImageModal(item.content)"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- Контекстное меню -->
    <div
      v-if="contextMenu.visible && contextMenu.item"
      class="context-menu fixed border border-white/10 bg-gray-900/50 rounded-lg shadow-lg py-2 z-50"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
    >
      <button
        v-if="contextMenu.item.type === 'text'"
        @click="startEdit(contextMenu.item)"
        class="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 w-full text-left text-sm"
      >
        <Pencil class="w-4 h-4" /> Изменить
      </button>
      <button
        @click="deleteItem(contextMenu.item)"
        class="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 w-full text-left text-sm"
      >
        <X class="w-4 h-4" /> Удалить
      </button>
    </div>

    <!-- Модальное окно для просмотра изображения -->
    <div
      v-if="showImageModal"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      @click.self="closeImageModal"
    >
      <div class="relative max-w-[90vw] max-h-[90vh] p-4">
        <img
          :src="selectedImage"
          class="max-w-full max-h-[80vh] object-contain rounded-lg"
          alt="Full-size image"
        />
        <button
          @click="closeImageModal"
          class="absolute top-2 right-2 p-2 bg-gray-900/80 rounded-full text-white hover:bg-gray-700 transition"
        >
          <X class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Поле ввода -->
    <footer class="border-t border-white/10 p-4">
      <div class="flex items-center gap-3 w-full max-w-4xl mx-auto h-12">
        <div class="flex items-center w-full gap-3">
          <textarea
            v-model="newContent"
            :placeholder="editingItem ? 'Редактировать сообщение' : 'Введите сообщение'"
            class="w-full px-4 py-2 rounded-xl bg-white/10 text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
            rows="1"
            @keyup.enter.prevent="addTextItem"
          ></textarea>
          <label class="cursor-pointer flex items-center">
            <Paperclip class="w-5 h-5 text-white/70 hover:text-green-400 transition" />
            <input type="file" accept="image/*" hidden @change="onFileChange" multiple />
          </label>
          <button
            v-if="editingItem"
            @click="cancelEdit"
            class="p-2 rounded-xl bg-red-600 hover:bg-red-700 transition flex items-center"
            title="Отменить редактирование"
          >
            <X class="w-5 h-5" />
          </button>
          <button
            @click="addTextItem"
            class="p-2 rounded-xl bg-green-600 hover:bg-green-700 transition flex items-center"
            :disabled="!newContent || !newContent.trim() || !currentTask"
          >
            <Send v-if="!editingItem" class="w-5 h-5" />
            <Pencil v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>
<style scoped>
main::-webkit-scrollbar {
  width: 8px;
}
main::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
main::-webkit-scrollbar-track {
  background: transparent;
}

/* Плавные анимации для сообщений */
main > div {
  transition: all 0.2s ease-in-out;
}

/* Улучшение стиля textarea */
textarea {
  line-height: 1.5;
}

/* Стили для кнопок в футере */
footer button,
footer label {
  height: 100%;
  display: flex;
  align-items: center;
}

/* Стили для контекстного меню */
.context-menu {
  min-width: 150px;
}
</style>
