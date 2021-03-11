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
          />
        </div>

        <div class="col-md-4 mt-3 mt-md-0">
          <text-track-list
            :textTrackZh="textTracks.zh"
            :textTrackEn="textTracks.en"
            :currentTextTrackIndex="currentTextTrackIndex"
            :onLookup="onLookupTextTrack"
            :onAddNote="onAddNote"
          />
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-md-8">
          <marker-list
            ref="markerRef"
            :markers="markers"
            :onLookup="onLookupTextTrack"
            :onAddNote="onAddNote"
            :onPlayMarker="onPlayMarker"
          />
        </div>
        <div class="col-md-4 mt-3 mt-md-0">
          <vocabulary-list ref="vocabularyRef" :on-lookup="onLookup" :vocabularies="vocabularies" />
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
const videoId = 'fY2kjeFVQ95Kb9m6NABx'
import { Loading } from 'element-ui'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import VideoPlayer from '@/components/VideoPlayer'
import VocabularyList from '@/components/VocabularyList.vue'
import TextTrackList from '@/components/TextTrackList.vue'
import MarkerList from '@/components/MarkerList.vue'
import db from '../helpers/db'

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

    this.$watch(
      () => {
        return this.$store.state.user
      },
      user => {
        const userId = user && user.uid

        if (userId) {
          const userDoc = db.collection('users').doc(userId)
          userDoc
            .collection('vocabularies')
            .doc(videoId)
            .get()
            .then(vocabularySnapshot => {
              if (vocabularySnapshot.exists) {
                const { data } = vocabularySnapshot.data()
                this.vocabularies = data
              }
            })
          userDoc
            .collection('markers')
            .doc(videoId)
            .get()
            .then(markerSnapshot => {
              if (markerSnapshot.exists) {
                const { data } = markerSnapshot.data()
                this.markers = data
              }
            })
        }
      },
    )

    if (this.$store.state.endedAt) {
      this.$store.dispatch('processNewRound')
    }
  },
  methods: {
    onLookup(time) {
      this.$refs.playerRef.playAtTime(time)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      }
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
    onAddNote(text, time) {
      this.$refs.vocabularyRef.$el.scrollIntoView({ behavior: 'smooth' })
      const vocabularies = this.vocabularies
      vocabularies.push({ vocabulary: text, time, new: true })
      this.vocabularies = vocabularies

      const data = vocabularies.map(vocabulary => ({
        vocabulary: vocabulary.vocabulary,
        time: vocabulary.time,
      }))

      const userId = this.$store.state.user.uid
      if (userId) {
        const userDoc = db.collection('users').doc(userId)
        userDoc.collection('vocabularies').doc(videoId).set({ data }, { merge: true })
      }
    },
    onMarkerAdd(marker) {
      this.$refs.markerRef.$el.scrollIntoView({ behavior: 'smooth' })
      const markers = this.markers
      markers.push(marker)
      this.markers = markers

      const userId = this.$store.state.user.uid
      if (userId) {
        const userDoc = db.collection('users').doc(userId)
        userDoc.collection('markers').doc(videoId).set({ data: markers }, { merge: true })
      }
    },
    onPlayMarker(startTime, endTime) {
      this.$refs.playerRef.playAtTime(startTime)
    },
  },
}
</script>
