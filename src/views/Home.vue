<template>
  <DefaultLayout>
    <div class="container">
      <div class="row">
        <div class="col-md-8 px-0 px-md-2">
          <video-player
            ref="playerRef"
            :video-src="videoUrl"
            :text-track-zh-src="textTrackZhUrl"
            :text-track-en-src="textTrackEnUrl"
            :onTextTrackLoaded="onTextTrackLoaded"
            :onTextTrackIndexChange="onTextTrackIndexChange"
            :markers="markers"
            :onPlayerMarkerAdd="onMarkerAdd"
            :onVideoDataLoad="onVideoDataLoad"
            :onVideoTimeUpdated="onVideoTimeUpdated"
            :onVideoPlayerPlay="onVideoPlayerPlay"
            :onVideoPlayerPause="onVideoPlayerPause"
            :onVideoPlayerEnded="onVideoPlayerEnded"
            :onVideoCanPlay="onVideoCanPlay"
          />
        </div>

        <div class="col-md-4 mt-3 mt-md-0">
          <marker-list
            ref="markerRef"
            :markers="markers"
            :onLookup="onLookupTextTrack"
            :onVocabularyAdd="onVocabularyAdd"
            :onPlayMarker="onPlayMarker"
            :onMarkerDelete="onMarkerDelete"
          />
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-md-8">
          <text-track-list
            v-if="isReviewing"
            :textTrackZh="textTracks.zh"
            :textTrackEn="textTracks.en"
            :currentTextTrackIndex="currentTextTrackIndex"
            :onLookup="onLookupTextTrack"
            :onVocabularyAdd="onVocabularyAdd"
          />
        </div>
        <div class="col-md-4 mt-3 mt-md-0">
          <vocabulary-list
            ref="vocabularyRef"
            :on-lookup="onLookup"
            :vocabularies="vocabularies"
            :onVocabularyDelete="onVocabularyDelete"
            :onVocabularyPronounce="onVocabularyPronounce"
          />
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
const videoId = 'fY2kjeFVQ95Kb9m6NABx'
import { Loading } from 'element-ui'
import { mapState } from 'vuex'
import { throttle } from 'lodash'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import VideoPlayer from '@/components/VideoPlayer'
import VocabularyList from '@/components/VocabularyList.vue'
import TextTrackList from '@/components/TextTrackList.vue'
import MarkerList from '@/components/MarkerList.vue'
import { db } from '../helpers/db'

let loadingInstance = Loading.service({ fullscreen: true })

export default {
  name: 'Home',
  components: {
    DefaultLayout,
    VideoPlayer,
    VocabularyList,
    TextTrackList,
    MarkerList,
  },
  data() {
    return {
      vocabularies: [],
      markers: [],
      textTracks: {
        zh: [],
        en: [],
      },
      currentTextTrackIndex: 0,
      isReviewing: false,
      isVideoReady: false,
      isReplaying: false,
      timeBeforeReplay: null,
      replayEndTime: null,
      isFetchingData: true,
    }
  },
  computed: {
    ...mapState({
      isAuthenticating: state => state.isAuthenticating,
      userId: state => state.user && state.user.uid,
      roundId: state => state.round.roundId,
      round: state => state.round.round,
      videoUrl: state => state.video.videoUrl,
      playingTime: state => state.video.playingTime,
      textTrackEnUrl: state => state.video.textTrackEnUrl,
      textTrackZhUrl: state => state.video.textTrackZhUrl,
    }),
    isDataReady() {
      return this.isVideoReady && !this.isAuthenticating && this.roundId
    },
  },
  created() {
    this.$store.dispatch('video/fetchVideo', { videoId })
    document.addEventListener('beforeunload', this.handlerClose)
  },
  mounted() {
    this.$watch(
      () => {
        return this.$refs.playerRef?.playingTime || 0
      },
      time => {
        const textTrack = this.textTracks.zh.find(textTrack => time > textTrack.startTime && time < textTrack.endTime)
        this.currentTextTrackIndex = textTrack ? parseInt(textTrack.id) : this.currentTextTrackIndex
      },
    )

    this.getUserData(this.userId)
    if (this.$store.state.endedAt) {
      this.$store.dispatch('round/startNewRound', { videoId })
    }
  },
  destroyed() {
    this.saveVideoPlayingTime(this.playingTime)
  },
  watch: {
    userId: function (userId) {
      this.getUserData(userId)
    },
    isDataReady: function (isDataReady) {
      if (!isDataReady) {
        return
      }
      loadingInstance.close()

      if (this.round) {
        const lastPlayingTime = this.round.lastPlayingTime
        console.log(lastPlayingTime)
        this.$refs.playerRef.playAtTime(lastPlayingTime)
      }
    },
  },
  methods: {
    getUserData(userId) {
      if (userId && this.isFetchingData) {
        this.isFetchingData = false
        this.$store.dispatch('round/fetchLatestRound')

        db.collection(`users/${userId}/vocabularies`)
          .where('videoId', '==', videoId)
          .get()
          .then(vocabulariesSnapshot => {
            vocabulariesSnapshot.forEach(vocabulary => {
              this.vocabularies.push({
                id: vocabulary.id,
                ...vocabulary.data(),
              })
            })
          })

        db.collection(`users/${userId}/markers`)
          .where('videoId', '==', videoId)
          .get()
          .then(markersSnapshot => {
            markersSnapshot.forEach(marker => {
              this.markers.push({
                id: marker.id,
                ...marker.data(),
              })
            })
          })
      }
    },
    handlerClose() {
      this.saveVideoPlayingTime(this.playingTime)
    },
    onVideoDataLoad() {},
    onVideoCanPlay() {
      this.isVideoReady = true
    },
    onVideoPlayerPlay() {
      this.$store.dispatch('round/recordBehavior', 'playVideo')
    },
    onVideoPlayerPause() {
      this.$store.dispatch('round/recordBehavior', 'pauseVideo')
    },
    onVideoPlayerEnded() {
      this.$store.dispatch('round/recordBehavior', 'endVideo')
    },
    onVideoTimeUpdated(playingTime) {
      if (this.isReplaying) {
        if (playingTime > this.replayEndTime) {
          this.$refs.playerRef.playAtTime(this.timeBeforeReplay)
          this.isReplaying = false
          this.timeBeforeReplay = null
          this.replayEndTime = null
          this.$store.dispatch('round/recordBehavior', 'playVideo')
        }
      } else {
        this.$store.commit('video/setPlayingTime', playingTime)
        this.saveVideoPlayingTime(playingTime)
      }
    },
    saveVideoPlayingTime: throttle(function (playingTime) {
      this.$store.dispatch('round/saveLatestPlayingTime', playingTime)
    }, 1000),
    onLookup(time) {
      this.isReplaying = true
      this.timeBeforeReplay = this.playingTime
      this.$store.commit('video/setPlayingTime', time)
      this.replayEndTime = time + 1.5

      this.$refs.playerRef.playAtTime(time)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      }
      this.isReviewing = true

      this.$store.dispatch('round/recordBehavior', 'lookupVocabulary')
    },
    onTextTrackLoaded(lang, textTracks) {
      this.textTracks[lang] = textTracks
    },
    onTextTrackIndexChange(index) {
      this.currentTextTrackIndex = index
    },
    onLookupTextTrack(text, time) {
      this.$refs.vocabularyRef.$el.scrollIntoView({ behavior: 'smooth' })
      this.$refs.vocabularyRef.onLookupVocabulary(text, time)
    },
    onVocabularyAdd(text, time) {
      this.$refs.vocabularyRef.$el.scrollIntoView({ behavior: 'smooth' })
      this.vocabularies.push({ vocabulary: text, time, new: true })

      if (this.userId) {
        db.collection(`users/${this.userId}/vocabularies`).add({
          vocabulary: text,
          time,
          videoId,
        })
      }
      this.$store.dispatch('round/recordBehavior', 'addVocabulary')
    },
    onVocabularyDelete(vocabularyId) {
      if (vocabularyId && this.userId) {
        db.doc(`users/${this.userId}/vocabularies/${vocabularyId}`).delete()
      }
      this.$store.dispatch('round/recordBehavior', 'deleteVocabulary')
    },
    onVocabularyPronounce() {
      this.$store.dispatch('round/recordBehavior', 'pronounceVocabulary')
    },
    onMarkerAdd(marker) {
      this.$refs.markerRef.$el.scrollIntoView({ behavior: 'smooth' })

      if (this.userId) {
        db.collection(`users/${this.userId}/markers`)
          .add({
            ...marker,
            videoId,
          })
          .then(markerRef => {
            this.markers.push({
              id: markerRef.id,
              ...marker,
            })
          })
      }
      this.$store.dispatch('round/recordBehavior', 'addMarker')
    },
    onMarkerDelete(markerId) {
      this.markers = this.markers.filter(marker => marker.id !== markerId)

      if (markerId && this.userId) {
        db.collection(`users/${this.userId}/markers`).doc(markerId).delete()
      }
      this.$store.dispatch('round/recordBehavior', 'deleteMarker')
    },
    onPlayMarker(startTime, endTime) {
      this.isReplaying = true
      this.timeBeforeReplay = this.playingTime
      this.$store.commit('video/setPlayingTime', startTime)
      this.replayEndTime = endTime

      this.$refs.playerRef.playAtTime(startTime)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      }
      this.isReviewing = true
      this.$store.dispatch('round/recordBehavior', 'playMarker')
    },
  },
}
</script>
