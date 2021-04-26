import { throttle } from 'lodash'
import { db } from '../../helpers/db'

const state = {
  roundId: null,
  round: null,
  startedAt: null,
  endedAt: null,
  remainingTime: 0,
  countDownInterval: null,
}

const mutations = {
  setRoundId(state, roundId) {
    state.roundId = roundId
  },
  setRound(state, round) {
    state.round = round
  },
  setStartedAt(state, startedAt) {
    state.startedAt = startedAt
  },
  setEndedAt(state, endedAt) {
    state.endedAt = endedAt
  },
  clearEndedAt(state) {
    state.endedAt = null
  },
  setRemainingTime(state, remainingTime) {
    state.remainingTime = remainingTime
  },
  setCountDownInterval(state, countDownInterval) {
    state.countDownInterval = countDownInterval
  },
}

const actions = {
  fetchLatestRound({ commit, dispatch, rootState }) {
    const videoId = rootState.video?.videoId
    const userId = rootState.user?.uid
    const videoDuration = rootState.video.duration

    if (videoId && userId) {
      db.collection(`users/${userId}/videos/${videoId}/rounds`)
        .orderBy('startedAt', 'desc')
        .limit(1)
        .get()
        .then(roundSnapshots => {
          if (roundSnapshots.size == 0) {
            // Start new round when has no round data
            dispatch('startNewRound')
          }
          roundSnapshots.forEach(function (roundSnapshot) {
            const round = roundSnapshot.data()
            commit('setRemainingTime', round.lastRemainingTime || videoDuration)
            if (round.endedAt) {
              // Start new round when current round is ended
              dispatch('startNewRound')
            } else {
              commit('setRoundId', roundSnapshot.id)
              commit('setRound', roundSnapshot.data())
            }
          })
        })
    }
  },
  startNewRound({ commit, state, rootState }) {
    const startedAt = new Date()
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const videoDuration = rootState.video.duration

    if (userId && videoId) {
      commit('clearEndedAt')

      db.collection(`users/${userId}/videos/${videoId}/rounds`)
        .add({
          lastPlayingTime: 0,
          startedAt,
        })
        .then(roundRef => {
          commit('setStartedAt', startedAt)
          commit('setRoundId', roundRef.id)
          commit('setRound', {
            lastPlayingTime: 0,
            lastRemainingTime: videoDuration,
            startedAt,
          })
        })
    }
  },
  endCurrentRound({ commit, rootState, state }) {
    const endedAt = new Date()
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId

    if (userId && videoId && roundId) {
      db.collection(`users/${userId}/videos/${videoId}/rounds`)
        .doc(roundId)
        .update({
          endedAt,
        })
        .then(() => {
          commit('setEndedAt', endedAt)
        })
    }
  },
  recordBehavior({ state, rootState }, behavior) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const playingTime = rootState.video.playingTime
    const roundId = state.roundId

    if (userId && videoId && roundId) {
      const createdAt = new Date()
      console.log(behavior, playingTime, createdAt)
      db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/behaviors`)
        .add({
          name: behavior,
          playingTime,
          createdAt,
        })
        .catch(error => {
          console.log(error)
        })
    }
  },
  saveLatestPlayingTime({ state, rootState }, playingTime) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId

    if (userId && videoId && roundId) {
      db.collection(`users/${userId}/videos/${videoId}/rounds`).doc(roundId).update({
        lastPlayingTime: playingTime,
      })
    }
  },
  saveLastRemainingTime({ state, rootState }, remainingTime) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId

    if (userId && videoId && roundId) {
      db.collection(`users/${userId}/videos/${videoId}/rounds`).doc(roundId).update({
        lastRemainingTime: remainingTime,
      })
    }
  },
  startCountDown({ state, commit, rootState }) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId

    if (rootState.video.duration > 0) {
      if (state.remainingTime === 0) {
        commit('setRemainingTime', rootState.video.duration)
      }
      const saveRemainingTime = throttle(function (remainingTime) {
        db.collection(`users/${userId}/videos/${videoId}/rounds`).doc(roundId).update({
          lastRemainingTime: remainingTime,
        })
      }, 1000)
      const countDownInterval = setInterval(() => {
        let remainingTime = state.remainingTime
        remainingTime -= 0.1

        commit('setRemainingTime', remainingTime)
        saveRemainingTime(remainingTime)
        if (remainingTime <= 0) {
          clearInterval(countDownInterval)
        }
      }, 100)
      commit('setCountDownInterval', countDownInterval)
    }
  },
  clearCountDownInterval({ state, commit }) {
    if (state.countDownInterval) {
      clearInterval(state.countDownInterval)
      commit('setCountDownInterval', null)
    }
  },
}

const video = {
  namespaced: true,
  state,
  mutations,
  actions,
}

export default video
