import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/app'
import { v4 as uuidV4 } from 'uuid'
import { db } from '../helpers/db'

Vue.use(Vuex)

const state = {
  user: null,
  roundId: null,
  startedAt: null,
  endedAt: null,
  authDialogVisible: false,
}

const mutations = {
  setUser(state, user) {
    state.user = user
  },
  setAuthDialogVisible(state, visible) {
    state.authDialogVisible = visible
  },
  setRoundId(state) {
    state.roundId = uuidV4()
  },
  setStartedAt(state) {
    state.startedAt = new Date()
  },
  setEndedAt(state) {
    state.endedAt = new Date()
  },
  clearEndedAt(state) {
    state.endedAt = null
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
  processNewRound({ commit }) {
    commit('setRoundId')
    commit('setStartedAt')
    commit('clearEndedAt')
  },
  endCurrentRound({ commit }) {
    commit('setEndedAt')
  },
}

export default new Vuex.Store({
  state,
  mutations,
  actions,
  modules: {},
})
