<template>
  <DefaultLayout>
    <div class="container">
      <div class="row">
        <div class="col-md-8 px-0 px-md-2">
          <video-player
            ref="playerRef"
            video-src="https://storage.googleapis.com/nccu-evls/video/video.mp4"
            text-track-zh-src="https://firebasestorage.googleapis.com/v0/b/supple-cabinet-263008.appspot.com/o/subtitle%2Fpeppa_pig_ch_sub.vtt?alt=media&token=f096b394-f2fc-46f5-9f9c-ac2f00fc6df6"
            text-track-en-src="https://firebasestorage.googleapis.com/v0/b/supple-cabinet-263008.appspot.com/o/subtitle%2Fpeppa_pig_eng_sub.vtt?alt=media&token=af2f43c8-735e-4493-8d02-6b364fc7ae1e"
            :onTextTrackLoaded="onTextTrackLoaded"
            :onTextTrackIndexChange="onTextTrackIndexChange"
          />
        </div>

        <div class="col-md-4">
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
        <div class="col-md-8"></div>
        <div class="col-md-4">
          <vocabulary-list ref="vocabularyRef" :on-lookup="onLookup" :vocabularies="vocabularies" />
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
      vocabularies: [],
      textTracks: {
        zh: [],
        en: [],
      },
      currentTextTrackIndex: 0,
    }
  },
  mounted() {
    this.$watch(
      () => {
        return this.$refs.playerRef.playingTime
      },
      time => {
        const textTrack = this.textTracks.zh.find(textTrack => time > textTrack.startTime && time < textTrack.endTime)
        this.currentTextTrackIndex = textTrack ? parseInt(textTrack.id) : 0
      },
    )
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
    onLookupTextTrack(text, cue) {
      this.$refs.vocabularyRef.$el.scrollIntoView({ behavior: 'smooth' })
      this.$refs.vocabularyRef.onLookupVocabulary(text, cue.startTime)
    },
    onAddNote(text, cue) {
      this.$refs.vocabularyRef.$el.scrollIntoView({ behavior: 'smooth' })
      this.$refs.vocabularyRef.addVocabulary(text, cue.startTime)
    },
  },
}
</script>
