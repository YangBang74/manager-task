<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import type { TaskItem, Task } from '@/stores/tasks'
import { Paperclip, Pencil, X, Copy } from 'lucide-vue-next'

const store = useTaskStore()
const route = useRoute()

const taskId = ref(Number(route.params.id) || 0)
const currentTask = computed<Task | null>(() => {
  // ищем задачу среди обычных задач
  const found = store.items.find((i) => i.type === 'task' && i.id === taskId.value)
  if (found && found.type === 'task') return found as Task
  // ищем задачу внутри проектов
  for (const item of store.items) {
    if (item.type === 'project') {
      const task = item.tasks.find((t) => t.id === taskId.value)
      if (task) return task
    }
  }
  return null
})

const newContent = ref('')
const editingItem = ref<TaskItem | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const contextMenu = ref({ visible: false, x: 0, y: 0, item: null as TaskItem | null })
const showImageModal = ref(false)
const selectedImage = ref('')
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const dragStart = ref({ x: 0, y: 0, distance: 0 })

watch(
  () => route.params.id,
  (newId) => {
    const parsedId = Number(newId)
    if (!isNaN(parsedId)) {
      taskId.value = parsedId
      scrollToBottom()
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
  navigator.clipboard.writeText(item.content).catch(console.error)
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
  if (!currentTask.value) return
  store.removeItemFromTask(currentTask.value.id, item.id)
  hideContextMenu()
}

function openImageModal(src: string) {
  selectedImage.value = src
  showImageModal.value = true
  resetTransform()
}

function resetTransform() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  dragStart.value.distance = 0
}

function formatTimestamp(timestamp: string | Date): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function triggerFileInput() {
  fileInput.value?.click()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  scrollToBottom()
})
</script>

<template>
  <div class="w-full flex flex-col overflow-hidden h-full" style="max-height: 82vh">
    <VAppBar elevation="0" height="64" class="border-b" app>
      <VToolbarTitle class="text-truncate">
        {{ currentTask?.title || 'Задача не найдена' }}
      </VToolbarTitle>
    </VAppBar>

    <main
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-px scroll-smooth"
      @paste="onPaste"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <div v-if="!currentTask" class="text-center py-8">Выберите задачу</div>

      <div
        v-else-if="currentTask?.type === 'task' && !currentTask.items.length"
        class="text-center py-8"
      >
        Добавьте данные задачи!
      </div>

      <div
        v-for="item in currentTask?.type === 'task' ? currentTask.items : []"
        :key="item.id"
        class="flex justify-start items-end min-h-[48px] my-2 mx-5"
        @contextmenu="showContextMenu($event, item)"
      >
        <div
          class="bg-green-600/80 py-2 px-3 rounded-lg max-w-[75%] relative shadow-md transition-all hover:bg-green-600/90"
        >
          <div
            v-if="item.type === 'text'"
            class="break-words text-white whitespace-pre-wrap text-sm"
          >
            {{ item.content }}
          </div>
          <div v-else-if="item.type === 'image'">
            <img
              :src="item.content"
              class="max-w-full max-h-60 object-contain cursor-pointer"
              @click="openImageModal(item.content)"
            />
          </div>
          <div class="text-xs text-gray-200 mt-1">
            {{ formatTimestamp(item.createdAt) }}
          </div>
        </div>
      </div>
    </main>

    <div
      v-if="contextMenu.visible && contextMenu.item"
      class="context-menu fixed border border-white/10 bg-gray-900/50 rounded-lg shadow-lg py-2 z-50"
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
    >
      <button
        v-if="contextMenu.item.type === 'text'"
        @click="startEdit(contextMenu.item)"
        class="flex items-center gap-2 px-4 py-2 hover:text-secondary hover:bg-white/10 w-full text-left text-sm"
      >
        <Pencil class="w-4 h-4" /> Изменить
      </button>
      <button
        @click="copyItem(contextMenu.item)"
        class="flex items-center gap-2 px-4 py-2 hover:bg-white/10 w-full text-left text-sm"
      >
        <Copy class="w-4 h-4" /> Копировать
      </button>
      <button
        @click="deleteItem(contextMenu.item)"
        class="flex items-center gap-2 px-4 py-2 hover:bg-white/10 w-full text-left text-sm"
      >
        <X class="w-4 h-4" /> Удалить
      </button>
    </div>

    <VFooter class="pa-2 border-t" app>
      <VContainer class="d-flex align-center pa-0 gap-3" max-width="800">
        <VTextarea
          v-model="newContent"
          :placeholder="editingItem ? 'Редактировать сообщение' : 'Введите сообщение'"
          auto-grow
          rows="1"
          class="flex-grow-1 rounded-xl bg-opacity-10"
          hide-details
          variant="outlined"
          color="secondary"
          density="compact"
          @keydown.enter.prevent="addTextItem"
        />

        <VBtn icon @click="triggerFileInput">
          <VIcon size="20"><Paperclip /></VIcon>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            hidden
            multiple
            @change="onFileChange"
          />
        </VBtn>

        <VBtn icon v-if="editingItem" color="red" @click="cancelEdit">
          <VIcon size="20"><X /></VIcon>
        </VBtn>

        <VBtn icon color="info" @click="addTextItem" :disabled="!newContent.trim() || !currentTask">
          <VIcon size="20">{{ editingItem ? 'mdi-check' : 'mdi-send' }}</VIcon>
        </VBtn>
      </VContainer>
    </VFooter>
  </div>
</template>

<style scoped>
textarea {
  line-height: 1.5;
  overflow-y: auto;
  resize: none;
  max-height: 120px;
}
textarea::-webkit-scrollbar {
  width: 6px;
}
textarea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}
main::-webkit-scrollbar {
  width: 8px;
}
main::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}
</style>
