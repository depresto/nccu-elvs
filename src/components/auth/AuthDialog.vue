<template>
  <el-dialog
    id="auth-dialog"
    center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    :visible.sync="authDialogVisible"
  >
    <el-tabs :stretch="true" v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="註冊" name="signup">
        <el-form
          :model="authForm"
          ref="signupForm"
          label-position="top"
          class="auth-form"
          :hide-required-asterisk="true"
        >
          <el-alert v-if="errorMessage.signup" :title="errorMessage.signup" class="mb-4" type="error"> </el-alert>

          <el-form-item
            label="信箱"
            prop="email"
            :rules="[
              { required: true, message: '請輸入信箱' },
              { type: 'email', message: '信箱格式錯誤', trigger: ['blur'] },
            ]"
          >
            <el-input type="email" v-model="authForm.email"></el-input>
          </el-form-item>

          <el-form-item label="密碼" prop="password" :rules="[{ required: true, message: '請輸入密碼' }]">
            <el-input type="password" v-model="authForm.password"></el-input>
          </el-form-item>

          <div class="text-center my-3">
            <el-button class="login-button" type="info" @click="handleSignup" :loading="loading">註冊</el-button>
          </div>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="登入" name="login">
        <el-form
          v-if="isForgotPasswordShown"
          :model="forgotPasswordForm"
          ref="forgotPasswordForm"
          label-position="top"
          class="auth-form"
          :hide-required-asterisk="true"
        >
          <el-form-item label="信箱" prop="email" :rules="[{ required: true, message: '請輸入信箱' }]">
            <el-input v-model="forgotPasswordForm.email"></el-input>
          </el-form-item>

          <div class="text-right">
            <el-link class="font-weight-normal" @click="isForgotPasswordShown = false">返回登入頁</el-link>
          </div>

          <div class="text-center my-3">
            <el-button class="login-button" type="info" @click="handleForgotPassword" :loading="loading">
              送出驗證信
            </el-button>
          </div>
        </el-form>

        <el-form
          v-else
          :model="authForm"
          ref="loginForm"
          label-position="top"
          class="auth-form"
          :hide-required-asterisk="true"
        >
          <el-alert v-if="errorMessage.login" :title="errorMessage.login" class="mb-4" type="error"> </el-alert>

          <el-form-item
            label="信箱"
            prop="email"
            :rules="[
              { required: true, message: '請輸入信箱' },
              { type: 'email', message: '信箱格式錯誤', trigger: ['blur'] },
            ]"
          >
            <el-input type="email" v-model="authForm.email"></el-input>
          </el-form-item>

          <el-form-item label="密碼" prop="password" :rules="[{ required: true, message: '請輸入密碼' }]">
            <el-input type="password" v-model="authForm.password"></el-input>
          </el-form-item>

          <div class="text-right">
            <el-link class="font-weight-normal" @click="isForgotPasswordShown = true">忘記密碼？</el-link>
          </div>

          <div class="text-center my-3">
            <el-button class="login-button" type="info" @click="handleLogin" :loading="loading">登入</el-button>
          </div>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <div slot="title" class="dialog-title"></div>
    <div slot="footer" class="dialog-footer"></div>
  </el-dialog>
</template>

<script>
import firebase from 'firebase/app'
import { mapState } from 'vuex'
import { showFirebaseError } from '@/helpers'
import { db } from '../../helpers/db'

export default {
  data() {
    return {
      loading: false,
      activeTab: 'login',
      isForgotPasswordShown: false,
      authForm: {
        email: '',
        password: '',
      },
      forgotPasswordForm: {
        email: '',
      },
      errorMessage: {
        login: null,
        signup: null,
        forgotPassword: null,
      },
    }
  },
  methods: {
    handleTabClick(tab) {
      this.activeTab = tab.name
    },
    handleLogin() {
      const vm = this
      this.$refs.loginForm.validate(valid => {
        if (!valid) {
          return false
        }

        vm.errorMessage.login = null
        vm.loading = true
        vm.$store.commit('setIsAuthenticating', true)
        firebase
          .auth()
          .signInWithEmailAndPassword(vm.authForm.email, vm.authForm.password)
          .then(userCredential => {
            vm.$store.commit('setIsAuthenticating', false)
            vm.$message({
              message: '登入成功',
              type: 'success',
            })

            if (vm.$router.currentRoute.name != 'Learning') vm.$router.push('/')
          })
          .catch(error => {
            const errorMessage = showFirebaseError(vm, error)
            vm.errorMessage.login = errorMessage
          })
          .finally(() => {
            vm.loading = false
          })
      })
    },
    handleSignup() {
      const vm = this
      this.$refs.signupForm.validate(valid => {
        if (!valid) {
          return false
        }

        vm.errorMessage.login = null
        vm.loading = true
        vm.$store.commit('setIsAuthenticating', true)
        firebase
          .auth()
          .createUserWithEmailAndPassword(vm.authForm.email, vm.authForm.password)
          .then(userCredential => {
            // Signed in
            vm.$store.commit('setIsAuthenticating', false)
            vm.$message({
              message: '註冊成功',
              type: 'success',
            })

            this.$router.push('/survey')
          })

          .catch(error => {
            const errorMessage = showFirebaseError(vm, error)
            vm.errorMessage.signup = errorMessage
          })
          .finally(() => {
            vm.loading = false
          })
      })
    },
    handleForgotPassword() {
      const vm = this
      this.$refs.forgotPasswordForm.validate(valid => {
        if (!valid) {
          return false
        }

        vm.errorMessage.forgotPassword = null
        vm.loading = true
        firebase
          .auth()
          .sendPasswordResetEmail(vm.forgotPasswordForm.email)
          .then(function () {
            vm.$message({
              message: '密碼重設信已寄出，請至信箱收信',
              type: 'success',
            })
          })
          .catch(function (error) {
            const errorMessage = showFirebaseError(vm, error)
            vm.errorMessage.forgotPassword = errorMessage
          })
          .finally(() => {
            vm.loading = false
          })
      })
    },
  },
  computed: {
    ...mapState({
      authDialogVisible: state => state.authDialogVisible,
    }),
  },
}
</script>

<style lang="scss">
#auth-dialog {
  .el-dialog {
    border-radius: 20px;
    max-width: 450px;
  }
  .el-dialog__header {
    display: none;
  }
  .el-dialog__body {
    padding: 0;
  }
  .el-tabs__nav-scroll {
    display: flex;
  }
  /* .el-tabs__nav {
    float: none;
    display: block;
    margin: 0 auto;
  } */
  .el-tabs__active-bar {
    height: 3px;
  }
  .el-tabs__item {
    height: 70px;
    line-height: 70px;
    font-size: 18px;
    padding: 0 20px;
    font-weight: bold;
    color: #707070;
    &.is-active {
      font-weight: normal;
      color: #f2784b;
    }
  }
  .el-tabs__nav-wrap::after {
    background-color: #f2e7dd;
    height: 0.8px;
  }
  .el-tab-pane {
    padding: 0 25px;
  }
}
.auth-form {
  padding: 20px 0;
  max-width: 300px;
  margin: 0 auto;
  label {
    padding-bottom: 8px;
    padding-left: 6px;
    padding-top: 0;
    line-height: 1;
    color: #a0a0a0;
    display: block;
  }
  .el-input__inner {
    height: 32px;
    background-color: #f2e7dd;
    border: none;
  }
  .login-button {
    padding: 10px 30px;
  }
  .el-form-item {
    margin-bottom: 12px;
  }
  .el-form-item__error {
    position: relative;
  }
}
</style>
