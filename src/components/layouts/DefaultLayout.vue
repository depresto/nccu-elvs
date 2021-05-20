<template>
  <el-container :style="{ backgroundColor: backgroundColor }">
    <el-header class="page-header">
      <div class="container">
        <div class="d-flex justify-content-between">
          <div class="d-flex align-items-center">
            <div class="header-brand">EVLS 英文影片學習系統</div>
          </div>
          <el-menu v-if="windowWidth > 992" :default-active="$route.name" class="page-menu" mode="horizontal">
            <el-menu-item index="Learning" @click="$router.push('/')" :disabled="!survey || $route.name === 'Quiz'">
              影片學習
            </el-menu-item>
            <el-menu-item index="Quiz" @click="handleQuiz" :disabled="!survey || $route.name === 'Rank'">
              測驗
            </el-menu-item>
            <el-menu-item index="Rank" :disabled="!survey || $route.name != 'Rank'">排行榜</el-menu-item>
            <el-menu-item v-if="user" @click="handleLogout">登出</el-menu-item>
          </el-menu>

          <el-dropdown class="d-flex align-items-center" v-else>
            <span class="el-dropdown-link"> 選單 <i class="el-icon-caret-bottom"></i> </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-for="routeKey in routeKeys" :key="routeKey.key" :index="routeKey.path">
                <router-link :to="routeKey.path" class="text-decoration-none">{{ routeKey.title }}</router-link>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    <el-main>
      <slot />
    </el-main>

    <auth-dialog />
  </el-container>
</template>

<script>
import firebase from 'firebase/app'
import AuthDialog from '@/components/auth/AuthDialog.vue'
import { showFirebaseError } from '@/helpers'
import { mapState } from 'vuex'
const routes = {
  home: {
    path: '/',
    title: '影片學習',
  },
  quiz: {
    path: '/quiz',
    title: '測驗',
  },
  ranking: {
    path: 'rank',
    title: '排行榜',
  },
}

export default {
  components: { AuthDialog },
  props: ['backgroundColor'],
  data() {
    return {
      activeIndex: 'home',
      windowWidth: window.innerWidth,
      routeKeys: Object.keys(routes).map(key => ({
        key,
        ...routes[key],
      })),
    }
  },
  mounted() {
    window.onresize = () => {
      this.windowWidth = window.innerWidth
    }
  },
  methods: {
    handleQuiz() {
      const round = this.$store.state.round.round
      const videoId = this.$route.params.videoId

      if (!videoId) {
        this.$router.push('/')
      }

      if (this.$route.name === 'Quiz') {
        return
      }

      if (!round.endedAt) {
        this.$confirm('進入測驗後就無法再回學習頁面，確定開始測驗？', '進入測驗', {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            this.$store.dispatch('round/calculateRoundScore')
            this.$store.dispatch('round/endCurrentRound').then(() => {
              this.$router.push(`/quiz/${videoId}`)
            })
          })
          .catch(() => {})
      } else {
        this.$router.push(`/quiz/${videoId}`)
      }
    },
    handleLogout() {
      const vm = this
      firebase
        .auth()
        .signOut()
        .then(() => {
          vm.$message({
            message: '登出成功',
            type: 'success',
          })
        })
        .catch(error => {
          const errorMessage = showFirebaseError(vm, error)
          vm.errorMessage.login = errorMessage
        })
    },
  },
  computed: {
    ...mapState({
      user: state => state.user,
      survey: state => state.survey,
    }),
  },
}
</script>

<style lang="scss" scoped>
.page-header {
  border-bottom: 1px solid #dcdfe6;
  background-color: #fff;
}
.page-menu {
  height: 60px;
  .el-menu-item {
    font-size: 14px;
  }
}
.header-brand {
  height: 60px;
  color: #4b80db;
  text-decoration: none;
  font-weight: bold;
  display: flex;
  align-items: center;
}
.el-menu-item {
  a {
    text-decoration: none;
  }
  &:hover {
    border-bottom: 2px solid transparent;
  }
}
</style>

<style lang="scss">
.el-main {
  padding: 20px 0px !important;
}
.el-menu-item:hover {
  border-bottom: 2px solid #f2784b75 !important;
}
</style>
