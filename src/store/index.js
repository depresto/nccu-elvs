import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/app'
import { vuexfireMutations, firestoreAction } from 'vuexfire'
import video from './modules/video'
import round from './modules/round'
import { db } from '../helpers/db'
import router from '../router'

Vue.use(Vuex)

const state = {
  user: null,
  isAuthenticating: true,
  authDialogVisible: false,
}

const mutations = {
  setAuthDialogVisible(state, visible) {
    state.authDialogVisible = visible
  },
  setIsAuthenticating(state, isAuthenticating) {
    state.isAuthenticating = isAuthenticating
  },
  ...vuexfireMutations,
}

const actions = {
  bindUser: firestoreAction(({ bindFirestoreRef }, payload) => {
    return bindFirestoreRef('user', db.collection('users').doc(payload.userId))
  }),
  async fetchUser({ state, commit, dispatch }) {
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged(function (user) {
        console.log(user)
        if (user) {
          commit('setAuthDialogVisible', false)

          const userId = user.uid
          dispatch('bindUser', { userId })
            .then(() => {
              commit('setIsAuthenticating', false)
              if (!state.user.email) {
                db.collection('users').doc(userId).update({ email: user.email })
              }
              if (user?.id && !user?.survey && router.currentRoute.path != '/survey') {
                router.push('/survey')
              }
            })
            .finally(() => {
              resolve()
            })
        } else {
          // show auth dialog when not login
          commit('setAuthDialogVisible', true)
          commit('setIsAuthenticating', false)
          resolve()
        }
      })
    })
  },
}

export default new Vuex.Store({
  state,
  mutations,
  actions,
  modules: {
    video,
    round,
  },
})
