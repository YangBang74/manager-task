import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Task {
  id: number
  title: string
  done: boolean
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])

  function addTask(title: string) {
    const newTask: Task = {
      id: Date.now(),
      title,
      done: false,
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

  function clearCompleted() {
    tasks.value = tasks.value.filter((task) => !task.done)
    saveToLocalStorage()
  }

  function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks.value))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('tasks')
    if (saved) {
      try {
        tasks.value = JSON.parse(saved)
      } catch (e) {
        console.error('Ошибка при загрузке задач из localStorage:', e)
      }
    }
  }

  loadFromLocalStorage()

  return {
    tasks,
    addTask,
    removeTask,
    toggleTask,
    clearCompleted,
  }
})
