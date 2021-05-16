import { throttle } from 'lodash'
import { db } from '../../helpers/db'

const state = {
  roundId: null,
  isRoundInitialized: false,
  round: null,
  roundIndex: -1,
  startedAt: null,
  endedAt: null,
  remainingTime: null,
  countDownInterval: null,
  cueIndexList: [[]],
  currentCueListIndex: 0,
  lastCueIndex: -1,
}

const mutations = {
  setRoundId(state, roundId) {
    state.roundId = roundId
  },
  setRound(state, round) {
    state.round = round
  },
  setRoundIndex(state, roundIndex) {
    state.roundIndex = roundIndex
  },
  increaseRoundIndex(state) {
    state.roundIndex += 1
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
  setCueIndexList(state, cueIndexList) {
    state.cueIndexList = cueIndexList
    state.currentCueListIndex = cueIndexList.length - 1
  },
  setNewCueIndexList(state) {
    state.currentCueListIndex += 1
    state.cueIndexList.push([])
  },
  setCueIndexListObject(state, index) {
    state.cueIndexList[state.currentCueListIndex].push(index)
  },
  setLastCueIndex(state, index) {
    state.lastCueIndex = index
  },
  setRoundInitialized(state) {
    state.isRoundInitialized = true
  },
}

const actions = {
  fetchLatestRound({ commit, dispatch, rootState }, payload) {
    const videoId = rootState.video?.videoId
    const userId = rootState.user?.uid
    const videoDuration = rootState.video.duration

    return new Promise(function (resolve, reject) {
      if (videoId && userId) {
        db.collection(`users/${userId}/videos/${videoId}/rounds`)
          .orderBy('startedAt', 'desc')
          .get()
          .then(roundSnapshots => {
            let round
            commit('setRoundIndex', roundSnapshots.size)
            if (roundSnapshots.size == 0) {
              // Start new round when has no round data
              if (payload.canStartNewRound) {
                dispatch('startNewRound')
              }
              resolve()
            }
            roundSnapshots.forEach(function (roundSnapshot) {
              if (!round) {
                round = roundSnapshot.data()
                commit('setRemainingTime', round.lastRemainingTime || videoDuration * 2)
                if (round.finishedQuizAt && payload.canStartNewRound) {
                  // Start new round when current round is ended
                  dispatch('startNewRound')
                } else {
                  commit('setRound', roundSnapshot.data())
                  commit('setRoundId', roundSnapshot.id)
                  commit('setRoundInitialized')
                }
              }
              resolve()
            })
          })
          .catch(error => reject(error))
      }
    })
  },
  startNewRound({ commit, rootState }) {
    const startedAt = new Date()
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const videoDuration = rootState.video.duration

    return new Promise(resolve => {
      if (userId && videoId) {
        commit('clearEndedAt')

        db.collection(`users/${userId}/videos/${videoId}/rounds`)
          .add({
            lastPlayingTime: 0,
            lastRemainingTime: videoDuration * 2,
            startedAt,
          })
          .then(roundRef => {
            commit('increaseRoundIndex')
            commit('setStartedAt', startedAt)
            commit('setRound', {
              lastPlayingTime: 0,
              lastRemainingTime: videoDuration * 2,
              startedAt,
            })
            commit('setRoundId', roundRef.id)
            commit('setRemainingTime', videoDuration * 2)
            commit('setRoundInitialized')
          })
          .finally(() => {
            resolve()
          })
      } else {
        resolve()
      }
    })
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

    if (userId && videoId && roundId && remainingTime) {
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

      if (!state.countDownInterval) {
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
    }
  },
  clearCountDownInterval({ state, commit }) {
    if (state.countDownInterval) {
      clearInterval(state.countDownInterval)
      commit('setCountDownInterval', null)
    }
  },
  pushToCueIndexList({ state, commit }, index) {
    if (index >= 0 && index > state.lastCueIndex) {
      commit('setLastCueIndex', index)
      commit('setCueIndexListObject', index)
    }
  },
  setNewCueIndexList({ commit, state, rootState }) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId

    if (state.cueIndexList[state.currentCueListIndex].length > 0 && videoId && userId) {
      db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/textTrackLists`)
        .add({ index: state.cueIndexList[state.currentCueListIndex] })
        .catch(error => {
          console.log(error)
        })
    }
    commit('setNewCueIndexList')
  },
  recordRoundTextTrackLength({ state, rootState, commit }, length) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId

    if (userId && videoId && roundId) {
      if (!state.round.textTrackLength) {
        db.collection(`users/${userId}/videos/${videoId}/rounds`)
          .doc(roundId)
          .update({
            textTrackLength: length,
          })
          .catch(error => {
            console.log(error)
          })
      }
    }
  },
  submitQuizAnswers({ state, rootState }, answers) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId

    return new Promise((resolve, reject) => {
      if (userId && videoId && roundId) {
        const correctCount = answers.filter(answer => answer.isCorrect).length
        const quizScore = correctCount / answers.length
        const totalScore = (state.round.TDF + state.round.BUF) * quizScore

        db.doc(`users/${userId}/videos/${videoId}/rounds/${roundId}`)
          .update({
            answers,
            finishedQuizAt: new Date(),
            correctCount,
            quizScore,
            totalScore,
          })
          .catch(error => {
            console.log(error)
            reject(error)
          })
          .finally(() => {
            resolve()
          })
      } else {
        resolve()
      }
    })
  },
  calculateRoundScore({ state, rootState, commit }) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId
    const videoDuration = rootState.video.duration

    if (userId && videoId && roundId && videoDuration > 0)
      db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/textTrackLists`)
        .get()
        .then(textTrackListSnapshots => {
          const textTracksLength = textTrackListSnapshots.docs.map(textTrackListSnapshot => {
            const textTrackList = textTrackListSnapshot.data()
            if (textTrackList.index) {
              return textTrackList.index.length
            } else {
              return 0
            }
          })
          const maxTextTracksLength = Math.max(textTracksLength)
          const remainingTime = state.remainingTime < 0 ? 0 : state.remainingTime
          const learningTime = videoDuration * 2 - remainingTime

          console.log('Current Round Index:', state.roundIndex)
          console.log('Video Duration:', videoDuration)
          console.log('Max Sentence Count:', maxTextTracksLength)
          console.log('Remaining Time:', remainingTime)
          console.log('Active Time:', learningTime)
          const RD = state.roundIndex / (state.roundIndex + 1) + 1
          console.log('RD = ', RD, '= (', state.roundIndex, '/ (', state.roundIndex, '+ 1)) + 1')
          const TDF = maxTextTracksLength / state.round.textTrackLength
          const BUF = 1 - Math.abs((videoDuration * RD - learningTime) / (videoDuration * RD))
          console.log('TDF =', TDF, '=', maxTextTracksLength, '/', state.round.textTrackLength)
          console.log('BUF =', BUF, '= 1 - |(', videoDuration * RD, '-', learningTime, ')/', videoDuration * RD, '|')
          console.log('Score before Quiz', TDF + BUF)

          db.doc(`users/${userId}/videos/${videoId}/rounds/${roundId}`).update({
            roundIndex: state.roundIndex,
            maxSentenceCount: maxTextTracksLength,
            videoDuration,
            remainingTime,
            learningTime,
            RD,
            TDF,
            BUF,
          })
        })
        .then(() => {
          db.doc(`users/${userId}/videos/${videoId}/rounds/${roundId}`)
            .get()
            .then(roundSnapshot => {
              commit('setRound', roundSnapshot.data())
            })
        })
  },
}

const video = {
  namespaced: true,
  state,
  mutations,
  actions,
}

export default video
