import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TaskItem {
  id: number
  type: 'text' | 'image'
  content: string
  createdAt: string
}

export interface Task {
  id: number
  title: string
  done: boolean
  items: TaskItem[]
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])

  function addTask(title: string) {
    const newTask: Task = {
      id: Date.now(),
      title,
      done: false,
      items: [],
    }
    tasks.value.push(newTask)
    saveToLocalStorage()
  }

  function removeTask(id: number) {
    tasks.value = tasks.value.filter((task) => task.id !== id)
    saveToLocalStorage()
  }

  function toggleTask(id: number) {
    const task = tasks.value.find((t) => t.id === id)
    if (task) {
      task.done = !task.done
      saveToLocalStorage()
    }
  }

  function addItemToTask(taskId: number, type: 'text' | 'image', content: string) {
    const task = tasks.value.find((t) => t.id === taskId)
    if (task) {
      task.items.push({
        id: Date.now(),
        type,
        content,
        createdAt: new Date().toISOString(),
      })
      saveToLocalStorage()
    }
  }

  function removeItemFromTask(taskId: number, itemId: number) {
    const task = tasks.value.find((t) => t.id === taskId)
    if (task) {
      task.items = task.items.filter((item) => item.id !== itemId)
      saveToLocalStorage()
    }
  }

  function editItemContent(taskId: number, itemId: number, newContent: string) {
    const task = tasks.value.find((t) => t.id === taskId)
    const item = task?.items.find((i) => i.id === itemId)
    if (item && item.type === 'text') {
      item.content = newContent
      saveToLocalStorage()
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks.value))
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error)
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('tasks')
      if (saved) {
        tasks.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error)
    }
  }

  loadFromLocalStorage()

  return {
    tasks,
    addTask,
    removeTask,
    toggleTask,
    addItemToTask,
    removeItemFromTask,
    editItemContent,
  }
})
