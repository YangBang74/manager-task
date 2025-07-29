<script setup lang="ts">
import { useTaskStore } from '@/stores/tasks'
import type { TaskItem } from '@/stores/tasks'
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const store = useTaskStore()
const route = useRoute()
const router = useRouter()

const taskId = ref(Number(route.params.id) || store.tasks[0]?.id || 0)
const currentTask = computed(() => store.tasks.find((t) => t.id === taskId.value))
const newContent = ref<string>('')
const editingItem = ref<TaskItem | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)

// Для контекстного меню v-menu достаточно просто boolean флага
const contextMenu = ref({ visible: false, item: null as TaskItem | null })

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

function openContextMenu(item: TaskItem) {
  contextMenu.value = { visible: true, item: item }
}

function copyItem(item: TaskItem) {
  if (!item) return
  navigator.clipboard.writeText(item.content)
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
  nextTick(() => document.querySelector('textarea')?.focus())
}

function cancelEdit() {
  editingItem.value = null
  newContent.value = ''
}

function deleteItem(item: TaskItem) {
  currentTask.value && store.removeItemFromTask(currentTask.value.id, item.id)
}

function openImageModal(src: string) {
  selectedImage.value = src
  showImageModal.value = true
  resetTransform()
}

function closeImageModal() {
  showImageModal.value = false
  selectedImage.value = ''
}

// ... остальная логика для image modal (без изменений) ...
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
  scrollToBottom()
})
</script>

<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-app-bar density="compact" flat>
      <v-toolbar-title class="text-h6">
        {{ currentTask?.title || 'Задача не найдена' }}
      </v-toolbar-title>
    </v-app-bar>

    <main
      ref="messagesContainer"
      class="flex-1-1 overflow-y-auto pa-4"
      @paste="onPaste"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <div v-if="!currentTask" class="text-center text-disabled py-8">
        Выберите задачу из бокового меню
      </div>
      <div v-else-if="!currentTask.items.length" class="text-center text-disabled py-8">
        Добавьте данные задачи!
      </div>

      <div
        v-for="item in currentTask?.items"
        :key="item.id"
        class="d-flex justify-start align-end my-2"
      >
        <v-menu activator="parent" v-model="contextMenu.visible" :close-on-content-click="true">
          <v-list density="compact">
            <v-list-item
              v-if="contextMenu.item?.type === 'text'"
              @click="startEdit(contextMenu.item!)"
            >
              <template #prepend><v-icon icon="mdi-pencil"></v-icon></template>
              <v-list-item-title>Изменить</v-list-item-title>
            </v-list-item>
            <v-list-item @click="copyItem(contextMenu.item!)">
              <template #prepend><v-icon icon="mdi-content-copy"></v-icon></template>
              <v-list-item-title>Копировать</v-list-item-title>
            </v-list-item>
            <v-list-item @click="deleteItem(contextMenu.item!)">
              <template #prepend><v-icon icon="mdi-delete"></v-icon></template>
              <v-list-item-title>Удалить</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <div
          class="bg-green-darken-1 pa-2 rounded-lg elevation-2"
          style="max-width: 75%"
          @contextmenu.prevent="openContextMenu(item)"
        >
          <div
            v-if="item.type === 'text'"
            class="text-body-2"
            style="white-space: pre-wrap; word-break: break-word"
          >
            {{ item.content }}
          </div>
          <div v-else-if="item.type === 'image'">
            <v-img
              :src="item.content"
              class="rounded-lg"
              max-height="240"
              alt="Attached image"
              @click="openImageModal(item.content)"
              style="cursor: pointer"
            />
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ formatTimestamp(item.createdAt) }}
          </div>
        </div>
      </div>
    </main>

    <v-dialog
      v-model="showImageModal"
      fullscreen
      :scrim="false"
      transition="dialog-bottom-transition"
    >
      <v-card
        @wheel="onWheel"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @touchstart="startDrag"
        @touchmove="onTouchMove"
        @touchend="endDrag"
      >
        <v-toolbar dark color="primary">
          <v-btn icon dark @click="closeImageModal"><v-icon>mdi-close</v-icon></v-btn>
          <v-spacer></v-spacer>
          <v-btn icon dark @click="isPanMode = !isPanMode" :color="isPanMode ? 'white' : 'grey'"
            ><v-icon>mdi-pan</v-icon></v-btn
          >
          <v-btn icon dark @click="resetTransform"><v-icon>mdi-refresh</v-icon></v-btn>
        </v-toolbar>
        <div class="d-flex justify-center align-center h-100 w-100 overflow-hidden">
          <v-img
            :src="selectedImage"
            :style="{
              transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              cursor: isPanMode ? 'move' : 'default',
            }"
            max-width="90vw"
            max-height="90vh"
            alt="Full-size image"
          ></v-img>
        </div>
      </v-card>
    </v-dialog>

    <footer class="pa-2">
      <v-textarea
        v-model="newContent"
        :label="editingItem ? 'Редактировать сообщение' : 'Введите сообщение'"
        variant="solo-filled"
        rows="1"
        max-rows="5"
        auto-grow
        hide-details
        @keydown.enter.prevent="addTextItem"
      >
        <template v-slot:prepend-inner>
          <label for="file-input" style="cursor: pointer">
            <v-icon icon="mdi-paperclip"></v-icon>
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            hidden
            @change="onFileChange"
            multiple
          />
        </template>

        <template v-slot:append-inner>
          <v-btn
            v-if="editingItem"
            icon="mdi-close-circle"
            variant="text"
            size="small"
            @click="cancelEdit"
            class="mr-2"
          ></v-btn>
          <v-btn
            icon
            @click="addTextItem"
            :disabled="!newContent || !newContent.trim() || !currentTask"
            color="primary"
            elevation="2"
          >
            <v-icon :icon="editingItem ? 'mdi-pencil-circle' : 'mdi-send'"></v-icon>
          </v-btn>
        </template>
      </v-textarea>
    </footer>
  </div>
</template>

<style scoped>
/* Убрал большинство стилей, так как Vuetify управляет ими.
   Можно оставить только те, что абсолютно необходимы. */
main {
  scrollbar-width: thin;
  scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
}
main::-webkit-scrollbar {
  width: 8px;
}
main::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 4px;
}
</style>
