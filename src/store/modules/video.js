import { db } from '../../helpers/db'

const state = {
  videoId: null,
  videoUrl: null,
  playingTime: 0,
  textTrackEnUrl: null,
  textTrackZhUrl: null,
  vocabularies: [],
  markers: [],
}

const mutations = {
  setVideoId(state, videoId) {
    state.videoId = videoId
  },
  setVideo(state, payload) {
    state.videoUrl = payload.videoUrl
    state.textTrackEnUrl = payload.textTrackEnUrl
    state.textTrackZhUrl = payload.textTrackZhUrl
  },
  setPlayingTime(state, playingTime) {
    state.playingTime = playingTime
  },
}

const actions = {
  fetchVideo({ commit }, payload) {
    commit('setVideoId', payload.videoId)
    db.collection('videos')
      .doc(payload.videoId)
      .get()
      .then(videoSnapshot => {
        const video = videoSnapshot.data()
        commit('setVideo', {
          videoUrl: video.videoUrl,
          textTrackEnUrl: video.textTrackEnUrl,
          textTrackZhUrl: video.textTrackZhUrl,
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
