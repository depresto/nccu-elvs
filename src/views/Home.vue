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
            :onVideoPlayerPlay="onVideoPlayerPlay"
            :onVideoPlayerPause="onVideoPlayerPause"
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
import { mapState } from 'vuex'
import { Loading } from 'element-ui'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import VideoPlayer from '@/components/VideoPlayer'
import VocabularyList from '@/components/VocabularyList.vue'
import TextTrackList from '@/components/TextTrackList.vue'
import MarkerList from '@/components/MarkerList.vue'
import { db } from '../helpers/db'

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
      videoUrl: null,
      textTrackEnUrl: null,
      textTrackZhUrl: null,
    }
  },
  computed: {
    ...mapState({
      userId: state => state.user && state.user.uid,
      roundId: state => state.roundId,
    }),
  },
  created() {
    let loadingInstance = Loading.service({ fullscreen: true })

    const vm = this
    db.collection('videos')
      .doc(videoId)
      .get()
      .then(videoSnapshot => {
        const video = videoSnapshot.data()
        vm.videoUrl = video.videoUrl
        vm.textTrackEnUrl = video.textTrackEnUrl
        vm.textTrackZhUrl = video.textTrackZhUrl

        loadingInstance.close()
      })
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
      this.$store.dispatch('processNewRound')
    }
    if (this.userId) {
      this.getUserData(this.userId)
    }
  },
  destroyed() {},
  watch: {
    userId: function (userId) {
      if (userId) {
        this.getUserData(userId)
      }
    },
  },
  methods: {
    getUserData(userId) {
      db.collection(`users/${userId}/vocabularies`)
        .where('video', '==', db.doc(`videos/${videoId}`))
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
        .where('video', '==', db.doc(`videos/${videoId}`))
        .get()
        .then(markersSnapshot => {
          markersSnapshot.forEach(marker => {
            this.markers.push({
              id: marker.id,
              ...marker.data(),
            })
          })
        })

      db.collection(`users/${this.userId}/rounds`)
        .orderBy('startedAt', 'desc')
        .limit(1)
        .get()
        .then(previousRound => {
          if (previousRound.docs.length > 0) {
            const { startedAt } = previousRound.docs[0].data()
            console.log(this.$refs.playerRef.duration)
          } else {
            this.$store.dispatch('processNewRound')
            this.recordRoundData()
          }
        })
    },
    onVideoDataLoad() {},
    recordRoundData() {
      db.doc(`users/${this.userId}/rounds/${this.roundId}`).set(
        {
          video: db.doc(`videos/${videoId}`),
          startedAt: this.$store.state.startedAt,
        },
        { merge: true },
      )
    },
    onVideoPlayerPlay() {
      const playTime = this.$refs.playerRef?.playingTime || 0
      this.recordBehavior('playVideo')
    },
    onVideoPlayerPause() {
      this.recordBehavior('pauseVideo')
    },
    onLookup(time) {
      this.$refs.playerRef.playAtTime(time)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      }
      this.recordBehavior('lookupVocabulary')
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
          video: db.doc(`videos/${videoId}`),
        })
      }
      this.recordBehavior('addVocabulary')
    },
    onVocabularyDelete(vocabularyId) {
      if (vocabularyId && this.userId) {
        db.doc(`users/${this.userId}/vocabularies/${vocabularyId}`).delete()
      }
      this.recordBehavior('deleteVocabulary')
    },
    onVocabularyPronounce() {
      this.recordBehavior('pronounceVocabulary')
    },
    onMarkerAdd(marker) {
      this.$refs.markerRef.$el.scrollIntoView({ behavior: 'smooth' })

      if (this.userId) {
        db.collection(`users/${this.userId}/markers`)
          .add({
            ...marker,
            video: db.doc(`videos/${videoId}`),
          })
          .then(markerRef => {
            this.markers.push({
              id: markerRef.id,
              ...marker,
            })
          })
      }
      this.recordBehavior('addMarker')
    },
    onMarkerDelete(markerId) {
      this.markers = this.markers.filter(marker => marker.id !== markerId)

      if (markerId && this.userId) {
        db.collection(`users/${this.userId}/markers`).doc(markerId).delete()
      }
      this.recordBehavior('deleteMarker')
    },
    onPlayMarker(startTime, endTime) {
      this.$refs.playerRef.playAtTime(startTime)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      }
      this.recordBehavior('playMarker')
    },
    recordBehavior(behavior) {
      if (this.userId && this.roundId) {
        db.collection(`users/${this.userId}/rounds/${this.roundId}/behaviors`)
          .add({
            name: behavior,
            createdAt: new Date(),
          })
          .catch(error => {
            console.log(error)
          })
      }
    },
  },
}
</script>
