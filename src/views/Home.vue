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
            :onVocabularyAdd="onVocabularyAdd"
          />
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-md-8">
          <marker-list
            ref="markerRef"
            :markers="markers"
            :onLookup="onLookupTextTrack"
            :onVocabularyAdd="onVocabularyAdd"
            :onPlayMarker="onPlayMarker"
            :onMarkerDelete="onMarkerDelete"
          />
        </div>
        <div class="col-md-4 mt-3 mt-md-0">
          <vocabulary-list
            ref="vocabularyRef"
            :on-lookup="onLookup"
            :vocabularies="vocabularies"
            :onVocabularyDelete="onVocabularyDelete"
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
  computed: {
    ...mapState({
      userId: state => state.user && state.user.uid,
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
    if (this.$store.state.user) {
      const userId = this.$store.state.user.uid
      this.getUserData(userId)
    }
  },
  watch: {
    userId: function (userId) {
      if (userId) {
        this.getUserData(userId)
      }
    },
  },
  methods: {
    getUserData(userId) {
      const videoDoc = db.collection('users').doc(userId).collection('videos').doc(videoId)
      videoDoc
        .collection('vocabularies')
        .get()
        .then(vocabulariesSnapshot => {
          vocabulariesSnapshot.forEach(vocabulary => {
            this.vocabularies.push({
              id: vocabulary.id,
              ...vocabulary.data(),
            })
          })
        })
      videoDoc
        .collection('markers')
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
    onVocabularyAdd(text, time) {
      this.$refs.vocabularyRef.$el.scrollIntoView({ behavior: 'smooth' })
      this.vocabularies.push({ vocabulary: text, time, new: true })

      if (this.userId) {
        const videoDoc = db.collection('users').doc(this.userId).collection('videos').doc(videoId)
        videoDoc.collection('vocabularies').add({ vocabulary: text, time })
      }
    },
    onVocabularyDelete(vocabularyId) {
      if (vocabularyId && this.userId) {
        const videoDoc = db.collection('users').doc(this.userId).collection('videos').doc(videoId)
        videoDoc.collection('vocabularies').doc(vocabularyId).delete()
      }
    },
    onMarkerAdd(marker) {
      this.$refs.markerRef.$el.scrollIntoView({ behavior: 'smooth' })

      if (this.userId) {
        const videoDoc = db.collection('users').doc(this.userId).collection('videos').doc(videoId)
        videoDoc
          .collection('markers')
          .add(marker)
          .then(markerRef => {
            this.markers.push({
              id: markerRef.id,
              ...marker,
            })
          })
      }
    },
    onMarkerDelete(markerId) {
      this.markers = this.markers.filter(marker => marker.id !== markerId)
      if (markerId && this.userId) {
        const videoDoc = db.collection('users').doc(this.userId).collection('videos').doc(videoId)
        videoDoc.collection('markers').doc(markerId).delete()
      }
    },
    onPlayMarker(startTime, endTime) {
      this.$refs.playerRef.playAtTime(startTime)
    },
  },
}
</script>
