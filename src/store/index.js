import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase'

Vue.use(Vuex)

const state = {
  user: null,
  authDialogVisible: false,
}

const mutations = {
  setUser(state, user) {
    state.user = user
  },
  setAuthDialogVisible(state, visible) {
    state.authDialogVisible = visible
  },
}

const actions = {
  async fetchUser({ commit }) {
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          commit('setUser', user)
          commit('setAuthDialogVisible', false)
        } else {
          commit('setUser', null)
          // show auth dialog when not login
          commit('setAuthDialogVisible', true)
        }
        resolve()
      })
    })
  },
}

export default new Vuex.Store({
  state,
  mutations,
  actions,
  modules: {},
})
