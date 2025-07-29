<script setup lang="ts">
import { ArrowRight, Settings, UserRound, CheckCircle, Circle, Plus, X } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/tasks'
import { useTheme } from '@/composables/useTheme'
import { Monitor, Sun, Moon } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const store = useTaskStore()

const menuIsActive = ref(true)
const showInput = ref(false)
const newTaskTitle = ref('')
const settingsModal = ref(false)
const { theme } = useTheme()

function addTask() {
  if (!newTaskTitle.value.trim()) return
  store.addTask(newTaskTitle.value.trim())
  newTaskTitle.value = ''
  showInput.value = false
}

function goToTask(taskId: number) {
  router.push(`/task/${taskId}`)
}
const menuWidth = computed(() => (menuIsActive.value ? 'w-60' : 'w-19'))
</script>

<template>
  <aside
    class="relative top-0 left-0 h-screen border-r border-white/20 transition-all duration-300 bg-white/4 text-white"
    :class="menuWidth"
  >
    <!-- Toggle button -->
    <button
      type="button"
      class="bg-gray-700 p-1 rounded-full absolute -right-4 top-4 z-10 shadow-md"
      @click="menuIsActive = !menuIsActive"
    >
      <ArrowRight
        :class="menuIsActive ? 'rotate-0' : 'rotate-180'"
        class="transition-transform duration-300"
      />
    </button>

    <div class="flex flex-col items-start py-4 px-3 space-y-4 mt-10">
      <!-- User block -->
      <div class="flex items-center justify-between gap-3 w-full bg-white/10 px-2 py-2 rounded-sm">
        <div class="flex gap-3 items-center w-full">
          <button type="button" class="border rounded-full p-1 bg-white/10">
            <UserRound />
          </button>
          <Transition name="fade">
            <div v-if="menuIsActive" class="flex flex-col gap-0 text-[0.625rem]">
              <span>User</span>
              <span>main@mail.ru</span>
            </div>
          </Transition>
        </div>
        <Transition name="fade">
          <button
            type="button"
            class="hover:bg-white/20 p-2 rounded-xl"
            v-if="menuIsActive"
            @click="settingsModal = true"
          >
            <Settings :size="20" />
          </button>
        </Transition>
      </div>

      <!-- Add task button -->
      <button
        type="button"
        class="flex items-center gap-2 bg-white/10 text-xs hover:bg-white/20 px-2 py-1 rounded transition w-full justify-center"
        @click="showInput = !showInput"
      >
        <Plus :size="16" />
        <Transition name="fade">
          <span v-if="menuIsActive" class="whitespace-nowrap">Добавить задачу</span>
        </Transition>
      </button>

      <!-- Task input -->
      <Transition name="fade">
        <input
          v-if="showInput && menuIsActive"
          v-model="newTaskTitle"
          @keyup.enter="addTask"
          type="text"
          class="w-full bg-white/10 px-2 py-1 rounded text-sm outline-none"
          placeholder="Название задачи"
        />
      </Transition>

      <!-- Task list -->
      <div class="flex flex-col gap-2 w-full mt-2">
        <div
          v-for="task in store.tasks"
          :key="task.id"
          class="flex items-center bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-xs transition group"
          :class="{
            '!bg-green-600/20': Number(route.params.id) === task.id,
            'justify-center': !menuIsActive,
          }"
        >
          <!-- Done toggle -->
          <button
            @click="store.toggleTask(task.id)"
            class="text-white hover:text-green-400 transition"
          >
            <component :is="task.done ? CheckCircle : Circle" :size="16" />
          </button>

          <!-- Task title (when menu open) -->
          <Transition name="fade">
            <span
              v-if="menuIsActive"
              @click="goToTask(task.id)"
              class="ml-2 truncate flex-1 cursor-pointer hover:underline"
              :class="{ 'line-through text-white/40': task.done }"
            >
              {{ task.title }}
            </span>
          </Transition>

          <!-- Delete button -->
          <Transition name="fade">
            <button
              v-if="menuIsActive"
              @click="store.removeTask(task.id)"
              class="ml-2 text-white/50 hover:text-red-500 transition"
            >
              <X :size="14" />
            </button>
          </Transition>
        </div>
      </div>
    </div>
  </aside>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="settingsModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="settingsModal = false"
      >
        <div class="bg-zinc-800 text-white p-6 rounded-xl w-[300px] space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Настройки</h3>
            <button @click="settingsModal = false" class="text-white hover:text-red-400">
              <X />
            </button>
          </div>
          <div class="space-y-2">
            <p class="text-sm text-white/70">Тема:</p>
            <div class="flex flex-col gap-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="system" v-model="theme" class="accent-white" />
                <Monitor :size="18" />
                <span>Системная</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="light" v-model="theme" class="accent-white" />
                <Sun :size="18" />
                <span>Светлая</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="dark" v-model="theme" class="accent-white" />
                <Moon :size="18" />
                <span>Тёмная</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
