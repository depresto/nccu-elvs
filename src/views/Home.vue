<template>
  <DefaultLayout>
    <div class="container">
      <div class="row">
        <div class="col-md-8">
          <video-player
            ref="playerRef"
            video-src="https://storage.googleapis.com/nccu-evls/video/video.mp4"
            :onTextTrackLoaded="onTextTrackLoaded"
            :onTextTrackIndexChange="onTextTrackIndexChange"
          />
        </div>

        <div class="col-md-4">
          <text-track-list
            :textTrackZh="textTracks.zh"
            :textTrackEn="textTracks.en"
            :currentTextTrackIndex="currentTextTrackIndex"
          />
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-md-8"></div>
        <div class="col-md-4">
          <vocabulary-list :on-lookup="onLookup" :vocabularies="vocabularies" />
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import DefaultLayout from '@/components/layouts/DefaultLayout'
import VideoPlayer from '@/components/VideoPlayer'
import VocabularyList from '@/components/VocabularyList.vue'
import TextTrackList from '@/components/TextTrackList.vue'

export default {
  name: 'Home',
  components: {
    DefaultLayout,
    VideoPlayer,
    VocabularyList,
    TextTrackList,
  },
  data() {
    return {
      vocabularies: [
        { vocabulary: 'Once', time: 24 },
        { vocabulary: 'Pig', time: 40 },
        { vocabulary: 'George', time: 70 },
        { vocabulary: 'playing', time: 90 },
        { vocabulary: 'played', time: 100 },
        { vocabulary: 'meme', time: 150 },
        { vocabulary: 'NCCU', time: 190 },
      ],
      textTracks: {
        zh: [],
        en: [],
      },
      currentTextTrackIndex: 0,
    }
  },
  methods: {
    onLookup(time) {
      this.$refs.playerRef.playAtTime(time)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playerVideo()
      }
    },
    onTextTrackLoaded(lang, textTracks) {
      this.textTracks[lang] = textTracks
    },
    onTextTrackIndexChange(index) {
      this.currentTextTrackIndex = index
    },
  },
}
</script>
