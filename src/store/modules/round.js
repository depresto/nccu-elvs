import { throttle, sum } from 'lodash'
import { db } from '../../helpers/db'

const state = {
  roundId: null,
  isRoundInitialized: false,
  round: null,
  roundIndex: -1,
  startedAt: null,
  endedAt: null,
  finishedQuizAt: null,
  remainingTime: null,
  countDownInterval: null,
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
  setFinishedQuizAt(state, finishedQuizAt) {
    state.finishedQuizAt = finishedQuizAt
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
  setRoundInitialized(state, isRoundInitialized) {
    if (isRoundInitialized !== undefined) {
      state.isRoundInitialized = isRoundInitialized
    } else {
      state.isRoundInitialized = true
    }
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
              if (payload?.canStartNewRound) {
                dispatch('startNewRound').then(() => resolve())
              } else {
                resolve()
              }
            }
            roundSnapshots.forEach(function (roundSnapshot) {
              if (!round) {
                round = roundSnapshot.data()
                commit('setRemainingTime', round.lastRemainingTime || videoDuration * 2)
                commit('setFinishedQuizAt', round.finishedQuizAt)
                if (round.finishedQuizAt && payload?.canStartNewRound) {
                  // Start new round when current round is ended
                  dispatch('startNewRound').then(() => resolve())
                } else {
                  commit('setRound', round)
                  commit('setRoundId', roundSnapshot.id)
                  commit('setRoundInitialized')

                  if (round.updatedAt && !round.endedAt) {
                    const timeGapSeconds = (new Date() - round.updatedAt.toDate()) / 1000
                    if (timeGapSeconds > 1) {
                      dispatch('recordBehavior', {
                        behavior: 'disruptVideo',
                        playingTime: round.lastPlayingTime,
                        createdAt: round.updatedAt.toDate(),
                      })
                    }
                  }
                  resolve()
                }
              }
            })
          })
          .catch(error => reject(error))
      } else {
        resolve()
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
        commit('setRemainingTime', null)
        commit('setStartedAt', null)
        commit('setEndedAt', null)
        commit('setFinishedQuizAt', null)

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
  recordBehavior({ state, rootState }, payload) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId

    if (userId && videoId && roundId) {
      const createdAt = payload.createdAt ? payload.createdAt : new Date()
      const playingTime = payload.playingTime ? payload.playingTime : rootState.video.playingTime
      console.log(payload.behavior, playingTime, createdAt)
      db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/behaviors`)
        .add({
          name: payload.behavior,
          playingTime,
          createdAt,
          timeout: payload.options?.timeout,
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
        updatedAt: new Date(),
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
  recordNewCaptionListen({ state, rootState }, index) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const playingTime = rootState.video.playingTime
    const roundId = state.roundId

    if (userId && videoId && roundId) {
      const createdAt = new Date()
      console.log('listenNewCaption', playingTime, createdAt)
      db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/behaviors`)
        .add({
          name: 'listenNewCaption',
          playingTime,
          cueIndex: index,
          createdAt,
        })
        .catch(error => {
          console.log(error)
        })
    }
  },
  submitQuizAnswers({ state, rootState, commit }, answers) {
    const userId = rootState.user?.uid
    const videoId = rootState.video?.videoId
    const roundId = state.roundId

    return new Promise((resolve, reject) => {
      if (userId && videoId && roundId) {
        const correctCount = answers.filter(answer => answer.isCorrect).length
        const quizScore = correctCount / answers.length
        const totalScore = (state.round.TDF + state.round.BUF) * quizScore

        const finishedQuizAt = new Date()
        commit('setFinishedQuizAt', finishedQuizAt)

        db.doc(`videos/${videoId}/rounds/${roundId}`).set({ totalScore, correctCount, quizScore }, { merge: true })
        db.doc(`users/${userId}/videos/${videoId}/rounds/${roundId}`)
          .update({
            answers,
            finishedQuizAt,
            correctCount,
            quizScore,
            totalScore,
          })
          .then(() => {
            db.doc(`users/${userId}/videos/${videoId}/rounds/${roundId}`)
              .get()
              .then(roundSnapshot => {
                commit('setRound', roundSnapshot.data())
              })
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

    if (userId && videoId && roundId && videoDuration > 0) {
      db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/behaviors`)
        .orderBy('createdAt', 'asc')
        .get()
        .then(behaviorSnapshots => {
          // Caption user has listened, divide by stop or any interrupting actions
          const captionListenedList = []
          const actionStack = []

          let isReviewing = false
          let previousTime = null

          // Action unit: name, from, to
          const actionPeriodList = []
          const addActionUnit = (duration, startVideoTime, endVideoTime, createdAt, type) => {
            console.log(duration, startVideoTime, endVideoTime, createdAt, type)
            if (duration > 0) {
              if (typeof startVideoTime === 'number') {
                actionPeriodList.push({
                  type,
                  startVideoTime,
                  endVideoTime,
                  duration,
                  createdAt,
                })
              } else {
                actionPeriodList.push({
                  type,
                  duration,
                  createdAt,
                })
              }
            }
          }

          for (let behaviorSnapshot of behaviorSnapshots.docs) {
            const behavior = behaviorSnapshot.data()
            let isActionAdded = false
            let currentIsReviewing = isReviewing

            if (behavior.name !== 'listenNewCaption')
              console.log(`[${behavior.createdAt.toDate().toISOString()}]`, behavior.name, 'at:', behavior.playingTime)

            switch (behavior.name) {
              case 'playVideo':
                actionStack.push(behavior)
                captionListenedList.push([])
                break
              case 'listenNewCaption':
                if (typeof captionListenedList[captionListenedList.length - 1] === 'undefined') {
                  captionListenedList[captionListenedList.length - 1] = []
                }
                if (!captionListenedList[captionListenedList.length - 1].includes(behavior.cueIndex)) {
                  captionListenedList[captionListenedList.length - 1].push(behavior.cueIndex)
                }
                break
              case 'endVideo':
              case 'pauseVideo':
              case 'disruptVideo':
                if (actionStack.length > 0) {
                  const lastBehavior = actionStack.pop()
                  const duration = behavior.createdAt - lastBehavior.createdAt

                  addActionUnit(
                    duration,
                    lastBehavior.playingTime,
                    behavior.playingTime,
                    behavior.createdAt,
                    isReviewing ? 'reviewing' : 'learning',
                  )
                  isActionAdded = true
                }
                isReviewing = false
                break
              case 'replayLoop':
                isReviewing = true
                actionStack.push(behavior)
                break
              case 'endReplay':
                isReviewing = false
                break
              case 'playMarker':
              case 'replayMarker':
              case 'lookupVocabulary':
                isReviewing = true
                actionStack.push(behavior)
                break
            }

            if (behavior.name !== 'listenNewCaption') {
              if (!isActionAdded && previousTime) {
                const duration = behavior.createdAt - previousTime
                addActionUnit(duration, null, null, behavior.createdAt, currentIsReviewing ? 'reviewing' : 'learning')
              }
              previousTime = behavior.createdAt
            }
          }

          console.log(actionPeriodList)
          const learningList = actionPeriodList.filter(actionItem => actionItem.type === 'learning')
          const reviewingList = actionPeriodList.filter(actionItem => actionItem.type === 'reviewing')

          const notOverlapLearningList = []
          const overlapLearningList = []
          while (learningList.length > 0) {
            const currentActionItem = learningList.shift()
            let isOverlap = false
            for (let actionItem of notOverlapLearningList) {
              if (typeof actionItem.startVideoTime !== 'number') {
                continue
              }
              if (typeof currentActionItem.startVideoTime !== 'number') {
                break
              }

              if (
                /*
                  |------------action item -----------------|
                      |---current action item---|
                */
                actionItem.startVideoTime < currentActionItem.startVideoTime &&
                actionItem.endVideoTime > currentActionItem.endVideoTime
              ) {
                overlapLearningList.push({
                  ...currentActionItem,
                  type: 'reviewing',
                })
                isOverlap = true
                break
              } else if (
                /*
                    |--------action item ----------|
                  |--------current action item---------|
                */
                actionItem.startVideoTime > currentActionItem.startVideoTime &&
                actionItem.endVideoTime < currentActionItem.endVideoTime
              ) {
                notOverlapLearningList.push({
                  ...currentActionItem,
                  startVideoTime: currentActionItem.startVideoTime,
                  endVideoTime: actionItem.startVideoTime,
                  duration: actionItem.startVideoTime - currentActionItem.startVideoTime,
                })
                overlapLearningList.push({
                  ...currentActionItem,
                  startVideoTime: actionItem.startVideoTime,
                  endVideoTime: actionItem.endVideoTime,
                  duration: actionItem.endVideoTime - actionItem.startVideoTime,
                  type: 'reviewing',
                })
                notOverlapLearningList.push({
                  ...currentActionItem,
                  startVideoTime: actionItem.endVideoTime,
                  endVideoTime: currentActionItem.endVideoTime,
                  duration: currentActionItem.endVideoTime - actionItem.endVideoTime,
                })
                isOverlap = true
                break
              } else if (
                /*
                  |----action item ---|
                      |---current action item---|
                */
                actionItem.startVideoTime < currentActionItem.startVideoTime &&
                actionItem.endVideoTime > currentActionItem.startVideoTime
              ) {
                notOverlapLearningList.push({
                  ...currentActionItem,
                  startVideoTime: actionItem.startVideoTime,
                  endVideoTime: currentActionItem.endVideoTime,
                  duration: currentActionItem.endVideoTime - actionItem.startVideoTime,
                })
                overlapLearningList.push({
                  ...currentActionItem,
                  startVideoTime: currentActionItem.startVideoTime,
                  endVideoTime: actionItem.endVideoTime,
                  duration: actionItem.endVideoTime - currentActionItem.startVideoTime,
                  type: 'reviewing',
                })
                isOverlap = true
                break
              } else if (
                /*
                      |------action item --------|
                  |---current action item---|
                */
                actionItem.endVideoTime > currentActionItem.endVideoTime &&
                actionItem.startVideoTime < currentActionItem.endVideoTime
              ) {
                notOverlapLearningList.push({
                  ...currentActionItem,
                  startVideoTime: currentActionItem.startVideoTime,
                  endVideoTime: actionItem.endVideoTime,
                  duration: actionItem.endVideoTime - currentActionItem.startVideoTime,
                })
                overlapLearningList.push({
                  ...currentActionItem,
                  startVideoTime: actionItem.startVideoTime,
                  endVideoTime: currentActionItem.endVideoTime,
                  duration: currentActionItem.endVideoTime - actionItem.startVideoTime,
                  type: 'reviewing',
                })
                isOverlap = true
                break
              }
            }

            if (!isOverlap) {
              notOverlapLearningList.push(currentActionItem)
            }
          }

          const captionListenedLength = captionListenedList.map(captionListened => captionListened.length)
          let totalLearningTime = notOverlapLearningList.reduce((sum, action) => sum + action.duration, 0)
          let totalReviewingTime =
            reviewingList.reduce((sum, action) => sum + action.duration, 0) +
            overlapLearningList.reduce((sum, action) => sum + action.duration, 0)

          const modifiedActionList = [...notOverlapLearningList, ...overlapLearningList, ...reviewingList]
          modifiedActionList.sort((a, b) => a.createdAt - b.createdAt)
          console.log(modifiedActionList)

          const maxTextTracksLength = Math.max(...captionListenedLength)
          const remainingTime = state.remainingTime < 0 ? 0 : state.remainingTime
          const activeTime = videoDuration * 2 - remainingTime

          console.log('Current Round Index:', state.roundIndex)
          console.log('Video Duration:', videoDuration)
          console.log('Max Sentence Count:', maxTextTracksLength)
          console.log('Total Learning Time:', totalLearningTime)
          console.log('Total Reviewing Time:', totalReviewingTime)
          console.log('Remaining Time:', remainingTime)
          console.log('Active Time:', activeTime)
          const RD = state.roundIndex / (state.roundIndex + 1) + 1
          console.log('RD = ', RD, '= (', state.roundIndex, '/ (', state.roundIndex, '+ 1)) + 1')
          const TDF = maxTextTracksLength / rootState.video.textTrackLength
          const BUF = 1 - Math.abs((videoDuration * RD - activeTime) / (videoDuration * RD))
          console.log('TDF =', TDF, '=', maxTextTracksLength, '/', rootState.video.textTrackLength)
          console.log('BUF =', BUF, '= 1 - |(', videoDuration * RD, '-', activeTime, ')/', videoDuration * RD, '|')
          console.log('Score before Quiz', TDF + BUF)

          const batch = db.batch()
          db.doc(`videos/${videoId}/rounds/${roundId}`).set(
            {
              roundIndex: state.roundIndex,
              user: {
                userId,
                email: rootState.user.email,
              },
              videoId,
              totalLearningTime,
              totalReviewingTime,
              remainingTime,
              activeTime,
              RD,
              TDF,
              BUF,
            },
            { merge: true },
          )
          for (let actionItem of modifiedActionList) {
            db.collection(`videos/${videoId}/rounds/${roundId}/behaviors`).add({
              ...actionItem,
            })
          }
          db.doc(`users/${userId}/videos/${videoId}/rounds/${roundId}`).update({
            roundIndex: state.roundIndex,
            maxSentenceCount: maxTextTracksLength,
            videoDuration,
            totalLearningTime,
            totalReviewingTime,
            remainingTime,
            activeTime,
            RD,
            TDF,
            BUF,
          })
          batch.commit()
        })
        .then(() => {
          db.doc(`users/${userId}/videos/${videoId}/rounds/${roundId}`)
            .get()
            .then(roundSnapshot => {
              commit('setRound', roundSnapshot.data())
            })
        })
    }
  },
  roundRestart({ commit }) {
    return new Promise((resolve, reject) => {
      commit('setRoundInitialized', false)
      commit('setRoundId', null)
      commit('setRemainingTime', null)
      commit('setStartedAt', null)
      commit('setEndedAt', null)
      commit('setFinishedQuizAt', null)
      resolve()
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
