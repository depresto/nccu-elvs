import { db } from '../../helpers/db'

const state = {
  videoId: null,
  isVideoInitialized: false,
  videoUrl: null,
  duration: 0,
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
  setVideoDuration(state, duration) {
    state.duration = duration
  },
  setPlayingTime(state, playingTime) {
    state.playingTime = playingTime
  },
  setVideoInitialized(state) {
    state.isVideoInitialized = true
  },
}

const actions = {
  fetchVideo({ commit, state }, payload) {
    commit('setVideoId', payload.videoId)

    if (!state.videoUrl) {
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
