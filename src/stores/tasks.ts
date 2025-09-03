import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task, Project } from '@/types/tasks'
export const useTaskStore = defineStore('task', () => {
  const items = ref<(Task | Project)[]>([])

  function addItem(type: 'task' | 'project', title: string) {
    const base = {
      id: Date.now(),
      title,
      type,
    }
    const newItem =
      type === 'task'
        ? ({ ...base, done: false, items: [] } as Task)
        : ({ ...base, tasks: [] } as Project)
    items.value.push(newItem)
    saveToLocalStorage()
  }

  function addTaskToProject(projectId: number, title: string) {
    const project = items.value.find((i) => i.type === 'project' && i.id === projectId) as
      | Project
      | undefined
    if (project) {
      const newTask: Task = {
        id: Date.now(),
        type: 'task',
        title,
        done: false,
        items: [],
      }
      project.tasks.push(newTask)
      saveToLocalStorage()
    }
  }

  function findTask(id: number): { task: Task; parentProject?: Project } | undefined {
    for (const item of items.value) {
      if (item.type === 'task' && item.id === id) {
        return { task: item as Task }
      }
      if (item.type === 'project') {
        const task = item.tasks.find((t) => t.id === id)
        if (task) {
          return { task, parentProject: item }
        }
      }
    }
  }

  function toggleTask(id: number) {
    const found = findTask(id)
    if (found) {
      found.task.done = !found.task.done
      saveToLocalStorage()
    }
  }

  function removeTask(id: number) {
    const found = findTask(id)
    if (found) {
      if (found.parentProject) {
        found.parentProject.tasks = found.parentProject.tasks.filter((t) => t.id !== id)
      } else {
        items.value = items.value.filter((i) => i.id !== id)
      }
      saveToLocalStorage()
    }
  }

  function removeById(id: number) {
    const found = findTask(id)
    if (found) {
      removeTask(id)
      return
    }
    items.value = items.value.filter((i) => i.id !== id)
    saveToLocalStorage()
  }

  function addItemToTask(taskId: number, type: 'text' | 'image', content: string) {
    const found = findTask(taskId)
    const task = found?.task
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
    const found = findTask(taskId)
    const task = found?.task
    if (task) {
      task.items = task.items.filter((item) => item.id !== itemId)
      saveToLocalStorage()
    }
  }

  function editItemContent(taskId: number, itemId: number, newContent: string) {
    const found = findTask(taskId)
    const task = found?.task
    const item = task?.items.find((i) => i.id === itemId)
    if (item && item.type === 'text') {
      item.content = newContent
      saveToLocalStorage()
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem('tasks', JSON.stringify(items.value))
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error)
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('tasks')
      if (saved) {
        items.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error)
    }
  }

  loadFromLocalStorage()

  return {
    items,
    addItem,
    addTaskToProject,
    removeById,
    toggleTask,
    addItemToTask,
    removeItemFromTask,
    editItemContent,
    removeTask,
  }
})
