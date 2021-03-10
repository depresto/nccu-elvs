<template>
  <el-container>
    <el-header class="page-header">
      <div class="container">
        <div class="d-flex justify-content-between">
          <div class="d-flex align-items-center">
            <div class="header-brand">EVLS 英文影片學習系統</div>
          </div>
          <el-menu :default-active="$route.path" class="page-menu" mode="horizontal" router>
            <el-menu-item v-for="routeKey in routeKeys" :key="routeKey.key" :index="routeKey.path">
              {{ routeKey.title }}
            </el-menu-item>
            <el-menu-item v-if="user" @click="handleLogout">登出</el-menu-item>
          </el-menu>
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
  data() {
    return {
      activeIndex: 'home',
      routeKeys: Object.keys(routes).map(key => ({
        key,
        ...routes[key],
      })),
    }
  },
  methods: {
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
    }),
  },
}
</script>

<style lang="scss" scoped>
.page-header {
  border-bottom: 1px solid #dcdfe6;
}
.page-menu {
  .el-menu-item {
    font-size: 14px;
  }
}
.header-brand {
  color: #4b80db;
  text-decoration: none;
  font-weight: bold;
}
.el-menu-item {
  a {
    text-decoration: none;
  }
}
</style>

<style lang="scss">
.el-main {
  padding: 20px 0px !important;
}
</style>
