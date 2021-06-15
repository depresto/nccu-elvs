import { db } from '../../helpers/db'
import { vuexfireMutations, firestoreAction } from 'vuexfire'

const state = {
  video: null,
  videoId: null,
  playingTime: 0,
  vocabularies: [],
  markers: [],
}

const mutations = {
  setVideoId(state, videoId) {
    state.videoId = videoId
  },
  setPlayingTime(state, playingTime) {
    state.playingTime = playingTime
  },
  ...vuexfireMutations,
}

const actions = {
  bindVideo: firestoreAction(({ bindFirestoreRef, commit }, payload) => {
    commit('setVideoId', payload.videoId)
    return bindFirestoreRef('video', db.collection('videos').doc(payload.videoId))
  }),
  bindVideoRounds: firestoreAction(({ bindFirestoreRef }, payload) => {
    return bindFirestoreRef('rounds', db.collection(`videos/${payload.videoId}/rounds`).orderBy('totalScore', 'desc'))
  }),
  bindVideoVocabularies: firestoreAction(({ bindFirestoreRef }, payload) => {
    return bindFirestoreRef(
      'vocabularies',
      db.collection(`users/${payload.userId}/vocabularies`).where('videoId', '==', payload.videoId),
    )
  }),
  bindVideoMarkers: firestoreAction(({ bindFirestoreRef }, payload) => {
    return bindFirestoreRef(
      'markers',
      db.collection(`users/${payload.userId}/markers`).where('videoId', '==', payload.videoId),
    )
  }),
}
const video = {
  namespaced: true,
  state,
  mutations,
  actions,
}

export default video
