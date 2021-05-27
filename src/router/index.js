import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Learning from '../views/Learning.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/video/:videoId',
    name: 'Learning',
    component: Learning,
  },
  {
    path: '/quiz/:videoId',
    name: 'Quiz',
    component: () => import(/* webpackChunkName: "quiz" */ '../views/Quiz.vue'),
  },
  {
    path: '/rank/:videoId',
    name: 'Rank',
    component: () => import(/* webpackChunkName: "rank" */ '../views/Rank.vue'),
  },
  {
    path: '/person/:videoId',
    name: 'Personal',
    component: () => import(/* webpackChunkName: "rank" */ '../views/Personal.vue'),
  },
  {
    path: '/survey',
    name: 'Survey',
    component: () => import(/* webpackChunkName: "survey" */ '../views/Survey.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
