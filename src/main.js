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
import { db } from './helpers/db'

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(VueVideoPlayer)

new Vue({
  router,
  store,
  beforeCreate() {
    this.$store.dispatch('fetchUser').then(() => {
      const userId = this.$store.state.user?.uid
      if (userId) {
        const userDoc = db.collection('users').doc(userId)
        userDoc.get().then(userRef => {
          const user = userRef.data()
          if (!user.survey && this.$route.path != '/survey') {
            this.$router.push('/survey')
          }
        })
      }
    })
  },
  render: h => h(App),
}).$mount('#app')
