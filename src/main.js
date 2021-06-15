import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import 'video.js/dist/video-js.css'
import 'videojs-markers'
import 'videojs-markers/dist/videojs.markers.css'
import VueVideoPlayer from 'vue-video-player'
import vueTopprogress from 'vue-top-progress'
import visibility from 'vue-visibility-change'
import './helpers/db'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/element-variables.scss'
import './assets/main.scss'

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(VueVideoPlayer)
Vue.use(vueTopprogress)
Vue.use(visibility)

new Vue({
  router,
  store,
  beforeCreate() {
    this.$store.dispatch('fetchUser').then(() => {
      const user = this.$store.state.user
      if (user?.id && !user?.survey && this.$route.path != '/survey') {
        this.$router.push('/survey')
      }
    })
  },
  render: h => h(App),
}).$mount('#app')
