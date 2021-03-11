import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import 'video.js/dist/video-js.css'
import 'videojs-markers'
import 'videojs-markers/dist/videojs.markers.css'
import VueVideoPlayer from 'vue-video-player'
import './helpers/db'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/element-variables.scss'
import './assets/main.scss'

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(VueVideoPlayer)

new Vue({
  router,
  store,
  beforeCreate() {
    this.$store.dispatch('fetchUser')
    this.$store.dispatch('processNewRound')
  },
  render: h => h(App),
}).$mount('#app')
