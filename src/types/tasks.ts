export interface TaskItem {
  id: number
  type: 'text' | 'image'
  content: string
  createdAt: string
}

interface Base {
  id: number
  title: string
}

export interface Task extends Base {
  type: 'task'
  done: boolean
  items: TaskItem[]
}

export interface Project extends Base {
  type: 'project'
  tasks: Task[]
}
