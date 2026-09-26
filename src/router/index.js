import { createRouter, createWebHistory } from 'vue-router'
import FlowView from '../views/FlowView.vue'

export const routes = [
  { path: '/', name: 'canvas', component: FlowView },
  { path: '/nodes/:nodeId', name: 'node', component: FlowView },
]

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
  })
}
