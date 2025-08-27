import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { vuetify } from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Доступна новая версия приложения. Обновить?')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('Приложение готово к оффлайн-работе')
  },
})

app.mount('#app')
