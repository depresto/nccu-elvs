<template>
  <el-container>
    <el-header class="page-header">
      <div class="container">
        <div class="d-flex justify-content-between">
          <div>
            <router-link
              class="header-brand"
              to="/"
            >
              影片學習系統
            </router-link>
          </div>
          <el-menu
            :default-active="activeIndex"
            class="page-menu"
            mode="horizontal"
            @select="handleSelect"
          >
            <el-menu-item
              v-for="routeKey in routeKeys"
              :key="routeKey.key"
              :index="routeKey.key"
            >
              {{ routeKey.title }}
            </el-menu-item>
          </el-menu>
        </div>
      </div>
    </el-header>
    <el-main>
      <slot />
    </el-main>
  </el-container>
</template>

<script>
const routes = {
  home: {
    path: '/',
    title: '首頁',
  },
  quiz: {
    path: '/quiz',
    title: '測驗',
  },
  ranking: {
    path: 'ranking',
    title: '排行',
  },
}

export default {
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
    handleSelect: function (key, keyPath) {
      console.log(key, keyPath)
    },
  },
}
</script>

<style lang="scss" scoped>
.page-header {
  border-bottom: 1px solid #dcdfe6;
  line-height: 80px;
  height: 80px !important;
}
.page-menu {
  .el-menu-item {
    line-height: 79px;
    height: 79px;
    font-size: 16px;
  }
}
.header-brand {
  color: #303133;
  text-decoration: none;
}
</style>
