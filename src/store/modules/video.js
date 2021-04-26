import { Loading } from 'element-ui'
import { db } from '../../helpers/db'

const state = {
  videoId: null,
  videoUrl: null,
  textTrackEnUrl: null,
  textTrackZhUrl: null,
  vocabularies: [],
  markers: [],
}

const mutations = {
  setVideo(state, payload) {
    state.videoId = payload.videoId
    state.videoUrl = payload.videoUrl

    state.textTrackEnUrl = payload.textTrackEnUrl
    state.textTrackZhUrl = payload.textTrackZhUrl
  },
}

const actions = {
  fetchVideo({ commit }, payload) {
    db.collection('videos')
      .doc(payload.videoId)
      .get()
      .then(videoSnapshot => {
        const video = videoSnapshot.data()
        commit('setVideo', {
          videoId: payload.videoId,
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
