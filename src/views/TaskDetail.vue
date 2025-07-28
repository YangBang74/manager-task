<script setup lang="ts">
import { useTaskStore } from '@/stores/tasks'
import type { TaskItem } from '@/stores/tasks'
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Paperclip, Send, Pencil, X, Copy, Move } from 'lucide-vue-next'

const store = useTaskStore()
const route = useRoute()
const router = useRouter()

const taskId = ref(Number(route.params.id) || store.tasks[0]?.id || 0)
const currentTask = computed(() => store.tasks.find((t) => t.id === taskId.value))
const newContent = ref<string>('')
const editingItem = ref<TaskItem | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const contextMenu = ref({ visible: false, x: 0, y: 0, item: null as TaskItem | null })
const showImageModal = ref(false)
const selectedImage = ref('')
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, distance: 0 })
const isPanMode = ref(true)

watch(
  () => route.params.id,
  (newId) => {
    const parsedId = Number(newId)
    if (!isNaN(parsedId) && store.tasks.some((t) => t.id === parsedId)) {
      taskId.value = parsedId
      scrollToBottom()
    } else if (store.tasks.length > 0) {
      router.push(`/task/${store.tasks[0].id}`)
    }
  },
)

function scrollToBottom() {
  nextTick(() => {
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  })
}

function showContextMenu(event: MouseEvent, item: TaskItem) {
  event.preventDefault()
  contextMenu.value = { visible: true, x: event.clientX, y: event.clientY, item }
}

function hideContextMenu() {
  contextMenu.value.visible = false
  contextMenu.value.item = null
}

function onClickOutside(event: MouseEvent) {
  if (contextMenu.value.visible && !(event.target as HTMLElement).closest('.context-menu')) {
    hideContextMenu()
  }
}

function copyItem(item: TaskItem) {
  navigator.clipboard
    .writeText(item.content)
    .then(() => console.log('Copied'))
    .catch(console.error)
  hideContextMenu()
}

function addTextItem() {
  if (!newContent.value.trim() || !currentTask.value) return
  if (editingItem.value) {
    store.editItemContent(currentTask.value.id, editingItem.value.id, newContent.value.trim())
    cancelEdit()
  } else {
    store.addItemToTask(currentTask.value.id, 'text', newContent.value.trim())
  }
  newContent.value = ''
  scrollToBottom()
}

function addImageItem(base64: string) {
  if (!currentTask.value) return
  store.addItemToTask(currentTask.value.id, 'image', base64)
  scrollToBottom()
}

function readFileAsBase64(file: File) {
  if (!file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = () => typeof reader.result === 'string' && addImageItem(reader.result)
  reader.readAsDataURL(file)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  ;[...input.files].forEach(readFileAsBase64)
}

function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.includes('image')) {
      const file = item.getAsFile()
      file && readFileAsBase64(file)
    }
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  if (!e.dataTransfer?.files.length) return
  ;[...e.dataTransfer.files].forEach(readFileAsBase64)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function startEdit(item: TaskItem) {
  if (item.type !== 'text') return
  editingItem.value = item
  newContent.value = item.content
  hideContextMenu()
  nextTick(() => document.querySelector('textarea')?.focus())
}

function cancelEdit() {
  editingItem.value = null
  newContent.value = ''
}

function deleteItem(item: TaskItem) {
  currentTask.value && store.removeItemFromTask(currentTask.value.id, item.id)
  hideContextMenu()
}

function openImageModal(src: string) {
  selectedImage.value = src
  showImageModal.value = true
  resetTransform()
}

function closeImageModal() {
  showImageModal.value = false
  selectedImage.value = ''
  resetTransform()
}

function resetTransform() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  dragStart.value.distance = 0
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.ctrlKey) {
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    scale.value = Math.min(5, Math.max(0.5, scale.value + delta))
  }
}

function startDrag(e: MouseEvent | TouchEvent) {
  if (!showImageModal.value || !isPanMode.value) return
  isDragging.value = true
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  dragStart.value.x = clientX - translateX.value
  dragStart.value.y = clientY - translateY.value
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  translateX.value = clientX - dragStart.value.x
  translateY.value = clientY - dragStart.value.y
}

function endDrag() {
  isDragging.value = false
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    e.preventDefault()
    const [t1, t2] = e.touches
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    if (!dragStart.value.distance) dragStart.value.distance = dist
    const newScale = scale.value * (dist / dragStart.value.distance)
    scale.value = Math.max(0.5, Math.min(5, newScale))
    dragStart.value.distance = dist
  } else if (e.touches.length === 1 && isPanMode.value) {
    onDrag(e)
  }
}

function formatTimestamp(timestamp: string | Date): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  if (!currentTask.value) console.warn('No task for ID:', taskId.value)
  document.addEventListener('click', onClickOutside)
  scrollToBottom()
})
</script>
<template>
  <div class="h-screen flex w-full flex-col text-white font-sans overflow-hidden">
    <!-- Заголовок задачи -->
    <header class="py-4 px-8 border-b border-white/10 flex items-center h-16">
      <h2 class="text-lg font-semibold truncate flex-1">
        {{ currentTask?.title || 'Задача не найдена' }}
      </h2>
    </header>

    <!-- Сообщения -->
    <main
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-px scroll-smooth"
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
        class="flex justify-start items-end min-h-[48px] mb-2"
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
          <div class="text-xs text-white/60 mt-1">
            {{ formatTimestamp(item.createdAt) }}
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
        @click="copyItem(contextMenu.item)"
        class="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 w-full text-left text-sm"
      >
        <Copy class="w-4 h-4" /> Копировать
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
      @wheel="onWheel"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="endDrag"
      @touchstart="startDrag"
      @touchmove="onTouchMove"
      @touchend="endDrag"
    >
      <div class="relative max-w-[90vw] max-h-[90vh] p-4 overflow-hidden">
        <img
          :src="selectedImage"
          class="rounded-lg object-contain"
          :class="{ 'cursor-move': isPanMode, 'cursor-default': !isPanMode }"
          :style="{
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }"
          alt="Full-size image"
        />
        <button
          @click="closeImageModal"
          class="absolute top-2 right-2 p-2 bg-gray-900/80 rounded-full text-white hover:bg-gray-700 transition"
        >
          <X class="w-6 h-6" />
        </button>
        <button
          @click="resetTransform"
          class="absolute top-2 right-12 p-2 bg-gray-900/80 rounded-full text-white hover:bg-gray-700 transition"
          title="Сбросить масштаб"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            ></path>
          </svg>
        </button>
        <button
          @click="isPanMode = !isPanMode"
          class="absolute top-2 right-22 p-2 bg-gray-900/80 rounded-full text-white hover:bg-gray-700 transition"
          :title="isPanMode ? 'Отключить режим руки' : 'Включить режим руки'"
        >
          <Move class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Поле ввода -->
    <footer class="border-t border-white/10 px-2 py-1">
      <div class="flex items-center gap-3 w-full max-w-4xl mx-auto h-12">
        <div class="flex items-center w-full gap-3">
          <textarea
            v-model="newContent"
            :placeholder="editingItem ? 'Редактировать сообщение' : 'Введите сообщение'"
            class="w-full px-4 py-2 rounded-xl bg-white/10 text-white resize-none focus:outline-none transition text-sm"
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
textarea {
  line-height: 1.5;
  overflow: hidden;
  resize: none;
  max-height: 120px;
}
textarea::-webkit-scrollbar {
  display: none;
}

main::-webkit-scrollbar {
  width: 5px;
}
main::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}
main::-webkit-scrollbar-track {
  background: transparent;
}
</style>
