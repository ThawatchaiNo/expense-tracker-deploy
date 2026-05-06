import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import ExpenseList from './views/ExpenseList.vue'
import Categories from './views/Categories.vue'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#6366f1',
          secondary: '#f97316',
          background: '#f8fafc',
          surface: '#ffffff',
          error: '#ef4444',
          success: '#22c55e',
          warning: '#eab308',
          info: '#3b82f6',
        }
      }
    }
  }
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard, meta: { title: 'ภาพรวม' } },
    { path: '/expenses', component: ExpenseList, meta: { title: 'รายการจ่าย' } },
    { path: '/categories', component: Categories, meta: { title: 'หมวดหมู่' } },
  ]
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(vuetify)
app.mount('#app')
