import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/app'
import { v4 as uuidV4 } from 'uuid'
import video from './modules/video'
import { db } from '../helpers/db'

Vue.use(Vuex)

const state = {
  isAuthenticating: true,
  user: null,
  survey: null,
  round: null,
  roundId: null,
  startedAt: null,
  endedAt: null,
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
  setRoundId(state, roundId) {
    state.roundId = roundId
  },
  setRound(state, round) {
    state.round = round
  },
  setStartedAt(state, startedAt) {
    state.startedAt = startedAt
  },
  setEndedAt(state) {
    state.endedAt = new Date()
  },
  clearEndedAt(state) {
    state.endedAt = null
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
              const user = userRef.data()
              commit('setSurvey', user.survey)
              commit('setRoundId', user.lastRoundId)
              commit('setIsAuthenticating', false)

              return user.lastRoundId
            })
            .then(roundId => db.collection('rounds').doc(roundId).get())
            .then(roundRef => {
              const round = roundRef.data()
              commit('setRound', round)
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
  processNewRound({ commit, state }, { videoId }) {
    const roundId = uuidV4()
    const startedAt = new Date()
    const userId = state.user.uid

    commit('setRoundId', roundId)
    commit('setStartedAt', startedAt)
    commit('clearEndedAt')
    if (userId) {
      const userDoc = db.collection('users').doc(userId)
      userDoc.set({ lastRoundId: roundId }, { merge: true })

      db.doc(`rounds/${roundId}`).set(
        {
          videoId,
          startedAt,
          userId,
        },
        { merge: true },
      )
      commit('setRound', {
        lastPlayingTime: 0,
        videoId,
        startedAt,
        userId,
      })
    }
  },
  endCurrentRound({ commit }) {
    commit('setEndedAt')
  },
  recordBehavior({ state }, behavior) {
    if (state.user && state.roundId) {
      db.collection(`rounds/${state.roundId}/behaviors`)
        .add({
          name: behavior,
          createdAt: new Date(),
        })
        .catch(error => {
          console.log(error)
        })
    }
  },
}

export default new Vuex.Store({
  state,
  mutations,
  actions,
  modules: {
    video,
  },
})
