import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import 'video.js/dist/video-js.css'
import 'videojs-markers'
import 'videojs-markers/dist/videojs.markers.css'
import VueVideoPlayer from 'vue-video-player'
import firebase from 'firebase/app'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/element-variables.scss'
import './assets/main.scss'

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(VueVideoPlayer)

firebase.initializeApp({
  apiKey: 'AIzaSyAEVJPo5Kdcpx7av8frZ5la2QgZlWcpWlc',
  authDomain: 'supple-cabinet-263008.firebaseapp.com',
  projectId: 'supple-cabinet-263008',
  storageBucket: 'supple-cabinet-263008.appspot.com',
  messagingSenderId: '325967377789',
  appId: '1:325967377789:web:d739768ec129a310c94814',
  measurementId: 'G-KEM5TEFZCX',
})
firebase.analytics()

new Vue({
  router,
  store,
  beforeCreate() {
    this.$store.dispatch('fetchUser')
  },
  render: h => h(App),
}).$mount('#app')
