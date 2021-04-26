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
            v-if="isRepeated"
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
      playingTime: 0,
      isRepeated: false,
      isVideoReady: false,
      isReplaying: false,
      timeBeforeReplay: null,
      replayEndTime: null,
    }
  },
  computed: {
    ...mapState({
      isAuthenticating: state => state.isAuthenticating,
      userId: state => state.user && state.user.uid,
      roundId: state => state.roundId,
      round: state => state.round,
      videoUrl: state => state.video.videoUrl,
      textTrackEnUrl: state => state.video.textTrackEnUrl,
      textTrackZhUrl: state => state.video.textTrackZhUrl,
    }),
    isDataReady() {
      return this.isVideoReady && !this.isAuthenticating && this.round
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

    if (this.$store.state.endedAt) {
      this.$store.dispatch('processNewRound', { videoId })
    }
  },
  destroyed() {
    this.savePlayingTime()
  },
  watch: {
    userId: function (userId) {
      if (userId) {
        this.getUserData(userId)
      }
    },
    isDataReady: function (isDataReady) {
      if (!isDataReady) {
        return
      }
      loadingInstance.close()

      if (!this.roundId) {
        this.$store.dispatch('processNewRound', { videoId })
      }
      if (this.round) {
        const lastPlayingTime = this.round.lastPlayingTime
        console.log(lastPlayingTime)
        this.$refs.playerRef.playAtTime(lastPlayingTime)
      }
    },
  },
  methods: {
    getUserData(userId) {
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
    },
    handlerClose() {
      this.savePlayingTime()
    },
    onVideoDataLoad() {},
    onVideoCanPlay() {
      console.log('canplay')
      this.isVideoReady = true
    },
    onVideoPlayerPlay() {
      const playTime = this.$refs.playerRef?.playingTime || 0
      this.$store.dispatch('recordBehavior', 'playVideo')
    },
    onVideoPlayerPause() {
      this.$store.dispatch('recordBehavior', 'pauseVideo')
    },
    onVideoTimeUpdated(playingTime) {
      if (this.isReplaying) {
        if (playingTime > this.replayEndTime) {
          this.$refs.playerRef.playAtTime(this.timeBeforeReplay)
          this.isReplaying = false
          this.timeBeforeReplay = null
          this.replayEndTime = null
        }
      } else {
        this.playingTime = playingTime
        this.saveVideoPlayingTime(playingTime)
      }
    },
    savePlayingTime() {
      if (this.round) {
        db.collection('rounds').doc(this.roundId).set({ lastPlayingTime: this.playingTime }, { merge: true })
      }
    },
    saveVideoPlayingTime: throttle(function (playingTime) {
      db.collection('rounds').doc(this.roundId).set({ lastPlayingTime: playingTime }, { merge: true })
    }, 1000),
    onLookup(time) {
      this.isReplaying = true
      this.timeBeforeReplay = this.playingTime
      this.playingTime = time
      this.replayEndTime = time + 1.5

      this.$refs.playerRef.playAtTime(time)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      }
      this.isRepeated = true

      this.$store.dispatch('recordBehavior', 'lookupVocabulary')
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
      this.$store.dispatch('recordBehavior', 'addVocabulary')
    },
    onVocabularyDelete(vocabularyId) {
      if (vocabularyId && this.userId) {
        db.doc(`users/${this.userId}/vocabularies/${vocabularyId}`).delete()
      }
      this.$store.dispatch('recordBehavior', 'deleteVocabulary')
    },
    onVocabularyPronounce() {
      this.$store.dispatch('recordBehavior', 'pronounceVocabulary')
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
      this.$store.dispatch('recordBehavior', 'addMarker')
    },
    onMarkerDelete(markerId) {
      this.markers = this.markers.filter(marker => marker.id !== markerId)

      if (markerId && this.userId) {
        db.collection(`users/${this.userId}/markers`).doc(markerId).delete()
      }
      this.$store.dispatch('recordBehavior', 'deleteMarker')
    },
    onPlayMarker(startTime, endTime) {
      this.isReplaying = true
      this.timeBeforeReplay = this.playingTime
      this.playingTime = startTime
      this.replayEndTime = endTime

      this.$refs.playerRef.playAtTime(startTime)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      }
      this.isRepeated = true
      this.$store.dispatch('recordBehavior', 'playMarker')
    },
  },
}
</script>
