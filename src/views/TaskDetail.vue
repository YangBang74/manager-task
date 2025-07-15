<script setup lang="ts">
import { useTaskStore } from '@/stores/tasks'
import type { TaskItem } from '@/stores/tasks'
import { ref, computed, onMounted, nextTick } from 'vue'
import { Paperclip } from 'lucide-vue-next'

const store = useTaskStore()

const taskId = ref(store.tasks[0]?.id || 0)
const currentTask = computed(() => store.tasks.find((t) => t.id === taskId.value))
const newContent = ref('')
const editingId = ref<number | null>(null)
const editContent = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

function addTextItem() {
  if (!newContent.value.trim() || !currentTask.value) return
  store.addItemToTask(currentTask.value.id, 'text', newContent.value.trim())
  newContent.value = ''
  scrollToBottom()
}

function addImageItem(base64: string) {
  if (!currentTask.value) return
  store.addItemToTask(currentTask.value.id, 'image', base64)
  scrollToBottom()
}

function readFileAsBase64(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') addImageItem(reader.result)
  }
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
    if (item.type.indexOf('image') !== -1) {
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

// Редактирование
function startEdit(item: TaskItem) {
  editingId.value = item.id
  editContent.value = item.content
}

function cancelEdit() {
  editingId.value = null
  editContent.value = ''
}

function saveEdit(item: TaskItem) {
  if (!editContent.value.trim() || !currentTask.value) return
  store.editItemContent(currentTask.value.id, item.id, editContent.value.trim())
  cancelEdit()
}

// Прокрутка вниз
function scrollToBottom() {
  nextTick(() => {
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  })
}

onMounted(() => scrollToBottom())
</script>

<template>
  <div class="h-screen flex flex-col w-full text-white overflow-hidden">
    <!-- Сообщения -->
    <main
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
      @paste="onPaste"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <div v-for="item in currentTask?.items" :key="item.id" class="flex">
        <div class="bg-white/10 p-3 rounded-2xl max-w-[75%] relative">
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
            <div v-if="item.type === 'text'" class="break-words whitespace-pre-wrap">
              {{ item.content }}
            </div>
            <div v-else-if="item.type === 'image'">
              <img :src="item.content" class="rounded-xl max-w-full max-h-60" />
            </div>

            <div class="absolute top-1 right-2 flex gap-1 text-xs">
              <button
                v-if="item.type === 'text'"
                @click="startEdit(item)"
                class="text-yellow-400 hover:text-yellow-300"
              >
                ✏️
              </button>
              <button
                @click="store.removeItemFromTask(currentTask.id, item.id)"
                class="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </template>
        </div>
      </div>
    </main>

    <!-- Поле ввода -->
    <footer class="border-t border-white/10 p-3 bg-gray-800/40">
      <div class="flex items-end gap-2 w-full max-w-150 mx-auto">
        <textarea
          v-model="newContent"
          placeholder="Введите сообщение"
          class="w-full p-2 rounded-xl bg-white/20 text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          rows="2"
          @keyup.enter.prevent="addTextItem"
        ></textarea>

        <label class="cursor-pointer">
          <Paperclip class="w-6 h-6 text-white" />
          <input type="file" accept="image/*" hidden @change="onFileChange" multiple />
        </label>

        <button
          @click="addTextItem"
          class="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition"
        >
          ➤
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
main::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
