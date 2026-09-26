import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { queryClient } from './queries/queryClient'
import { createAppRouter } from './router'
import { resetFlowApi } from './api/flowApi'
import { seed } from './data/seed'
import './app.css'

resetFlowApi(seed)

const app = createApp(App)
app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })
app.use(createAppRouter())
app.mount('#app')
