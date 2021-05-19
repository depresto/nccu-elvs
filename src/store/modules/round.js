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
              if (payload?.canStartNewRound) {
                dispatch('startNewRound')
              }
              resolve()
            }
            roundSnapshots.forEach(function (roundSnapshot) {
              if (!round) {
                round = roundSnapshot.data()
                commit('setRemainingTime', round.lastRemainingTime || videoDuration * 2)
                commit('setFinishedQuizAt', round.finishedQuizAt)
                if (round.finishedQuizAt && payload?.canStartNewRound) {
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

        db.doc(`rounds/${roundId}`).update({ totalScore, correctCount })
        db.doc(`users/${userId}/videos/${videoId}/rounds/${roundId}`)
          .update({
            answers,
            finishedQuizAt,
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

    if (userId && videoId && roundId && videoDuration > 0) {
      db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/behaviors`)
        .orderBy('createdAt', 'asc')
        .get()
        .then(behaviorSnapshots => {
          // Caption user has listened, divide by stop or any interrupting actions
          const captionListenedList = []
          const reviewList = []
          const reviewStack = []
          const replayStack = []
          const actionStack = []
          const playingDuration = []

          let isReviewing = false
          let isReplaying = false
          for (let behaviorSnapshot of behaviorSnapshots.docs) {
            const behavior = behaviorSnapshot.data()

            switch (behavior.name) {
              case 'playVideo':
                if (isReviewing) {
                  if (reviewStack.length > 0) {
                    const reviewStartedAt = reviewStack.pop()
                    reviewList.push(behavior.createdAt - reviewStartedAt)
                  }
                  isReviewing = false
                }
                captionListenedList.push([])
                actionStack.push(behavior.createdAt)
                break
              case 'listenNewCaption':
                if (!captionListenedList[captionListenedList.length - 1].includes(behavior.cueIndex)) {
                  captionListenedList[captionListenedList.length - 1].push(behavior.cueIndex)
                }
                break
              case 'endVideo':
              case 'pauseVideo':
                if (actionStack.length > 0) {
                  const startPlayedAt = actionStack.pop()
                  playingDuration.push({
                    duration: behavior.createdAt - startPlayedAt,
                    createdAt: startPlayedAt,
                  })
                }
                if (isReviewing) {
                  if (reviewStack.length > 0) {
                    const reviewStartedAt = reviewStack.pop()
                    if (reviewStartedAt) {
                      reviewList.push(behavior.createdAt - reviewStartedAt)
                    }
                  }
                  isReviewing = false
                }
                break
              case 'replayLoop':
                if (isReplaying) {
                  const replayStartedAt = replayStack.pop()
                  if (reviewList) {
                    reviewList.push(behavior.createdAt - replayStartedAt)
                  }
                } else {
                  isReplaying = true
                  const startPlayedAt = actionStack.pop()
                  if (startPlayedAt) {
                    playingDuration.push({
                      duration: behavior.createdAt - startPlayedAt,
                      createdAt: startPlayedAt,
                    })
                  }
                }
                replayStack.push(behavior.createdAt)
                break
              case 'endReplay':
                if (replayStack.length > 0) {
                  let replayStartedAt = replayStack.pop()
                  reviewList.push(behavior.createdAt - replayStartedAt)
                }
                isReplaying = false
                break
              case 'playMarker':
              case 'replayMarker':
              case 'lookupVocabulary':
                isReviewing = true
                reviewStack.push(behavior.createdAt)
                break
            }
          }

          playingDuration.sort((a, b) => a.createdAt - b.createdAt)
          const captionListenedLength = captionListenedList.map(captionListened => captionListened.length)
          let totalLearningTime = sum(playingDuration.map(playingItem => playingItem.duration))
          let totalReviewingTime = sum(reviewList)

          let currentLearningTime
          for (let playingItem of playingDuration) {
            const currentSeconds = playingItem.createdAt.seconds + playingItem.duration
            if (currentLearningTime) {
              if (currentLearningTime > playingItem.createdAt.seconds) {
                const reviewingTime = currentLearningTime - playingItem.createdAt.seconds
                totalReviewingTime += reviewingTime
                totalLearningTime -= reviewingTime
              }
              if (currentSeconds > currentLearningTime) {
                currentLearningTime = currentSeconds
              }
            } else {
              currentLearningTime = currentSeconds
            }
          }

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
          const TDF = maxTextTracksLength / state.round.textTrackLength
          const BUF = 1 - Math.abs((videoDuration * RD - activeTime) / (videoDuration * RD))
          console.log('TDF =', TDF, '=', maxTextTracksLength, '/', state.round.textTrackLength)
          console.log('BUF =', BUF, '= 1 - |(', videoDuration * RD, '-', activeTime, ')/', videoDuration * RD, '|')
          console.log('Score before Quiz', TDF + BUF)

          db.doc(`rounds/${roundId}`).set(
            {
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
}

const video = {
  namespaced: true,
  state,
  mutations,
  actions,
}

export default video
