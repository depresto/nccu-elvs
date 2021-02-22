<template>
  <DefaultLayout>
    <div class="container">
      <div class="row">
        <div class="col-md-9">
          <video-player ref="playerRef" />
        </div>
        <div class="col-md-3">
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

export default {
  name: 'Home',
  components: {
    DefaultLayout,
    VideoPlayer,
    VocabularyList,
  },
  data() {
    return {
      vocabularies: [{ vocabulary: 'Once', time: 24 }],
    }
  },
  methods: {
    onLookup(time) {
      this.$refs.playerRef.playAtTime(time)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playerVideo()
      }
    },
  },
}
</script>
