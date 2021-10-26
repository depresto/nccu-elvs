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
  userId: null,
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
  setUserId(state, userId) {
    state.userId = userId
  },
  ...vuexfireMutations,
}

const actions = {
  bindUser: firestoreAction(({ bindFirestoreRef }, payload) => {
    return bindFirestoreRef('user', db.collection('users').doc(payload.userId))
  }),
  async initializeUser({ commit, dispatch }, payload) {
    const userId = payload.userId
    commit('setUserId', userId)
    const doc = await db.collection('users').doc(userId).get()

    if (!doc.exists) {
      await db.collection('users').doc(userId).set({}, { merge: true })
    }
    await dispatch('bindUser', { userId })
  },
  fetchUser({ state, commit, dispatch }) {
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged(async function (user) {
        if (user) {
          commit('setAuthDialogVisible', false)

          const userId = user.email
          await dispatch('initializeUser', { userId })
          commit('setIsAuthenticating', false)
          if (user?.id && !user?.survey && router.currentRoute.path != '/survey') {
            router.push('/survey')
          }

          resolve()
        } else {
          router.push('/login')
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
