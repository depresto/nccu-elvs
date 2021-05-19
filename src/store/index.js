import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/app'
import video from './modules/video'
import round from './modules/round'
import { db } from '../helpers/db'

Vue.use(Vuex)

const state = {
  isAuthenticating: true,
  user: null,
  survey: null,
  authDialogVisible: false,
}

const mutations = {
  setUser(state, user) {
    state.user = user
  },
  setSurvey(state, survey) {
    state.survey = survey
  },
  setAuthDialogVisible(state, visible) {
    state.authDialogVisible = visible
  },
  setIsAuthenticating(state, isAuthenticating) {
    state.isAuthenticating = isAuthenticating
  },
}

const actions = {
  async fetchUser({ commit }) {
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          commit('setUser', user)
          commit('setAuthDialogVisible', false)

          const userId = user.uid
          const userDoc = db.collection('users').doc(userId)
          userDoc
            .get()
            .then(userRef => {
              const userData = userRef.data()
              if (!userData.email) {
                userDoc.update({ email: user.email })
              }
              commit('setSurvey', userData.survey)
              commit('setIsAuthenticating', false)
            })
            .finally(() => {
              resolve()
            })
        } else {
          commit('setUser', null)
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
