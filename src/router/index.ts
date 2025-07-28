import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/HomePage.vue'
import TaskDetail from '@/views/TaskDetail.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { layout: 'default' },
    },
    {
      path: '/task/:id',
      name: 'task-detail',
      component: TaskDetail,
    },
  ],
})

export default router