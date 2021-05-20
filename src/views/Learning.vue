<template>
  <DefaultLayout>
    <vue-topprogress ref="topProgress" color="#f2784b" :trickle="false"></vue-topprogress>
    <div id="timer" class="text-center">
      <div class="title">剩餘時間</div>
      <hr />
      <span class="counter">{{ formattedRemainingTime.minute }} : {{ formattedRemainingTime.second }}</span>

      <div class="mt-3" v-if="isQuizEnable">
        <el-button type="primary" @click="handleQuiz">進入測驗</el-button>
      </div>
    </div>

    <el-dialog
      :visible.sync="showTimeupDialog"
      :show-close="false"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      width="30%"
      center
    >
      <div class="d-flex flex-column align-items-center">
        <img src="@/assets/icon/material-timer.svg" style="width: 60px" class="mb-3" alt="" />
        <h1>學習時間結束</h1>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="$router.push(`/quiz/${$route.params.videoId}`)">進入測驗</el-button>
      </span>
    </el-dialog>

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
            :onReplayLoopChange="onReplayLoopChange"
          />
        </div>

        <div class="col-md-4 mt-3 mt-md-0">
          <marker-list
            ref="markerRef"
            :markers="markers"
            :onLookup="onLookupTextTrack"
            :onVocabularyAdd="onVocabularyAdd"
            :onPlayMarker="onPlayMarker"
            :onReplayMarker="onReplayMarker"
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

<style lang="scss" scoped>
#timer {
  position: fixed;
  top: 90px;
  right: 20px;
  box-shadow: 2px 4px 7px 2px rgba(0, 0, 0, 0.2);
  padding: 10px 15px;
  border-radius: 5px;
  .title {
    letter-spacing: 2px;
    margin-bottom: 5px;
  }
  .counter {
    color: #f2784b;
    font-weight: 700;
    font-size: 30px;
  }
}
</style>

<style lang="scss">
.el-dialog {
  min-width: 300px;
}
</style>

<script>
import { Loading } from 'element-ui'
import { mapState } from 'vuex'
import { throttle } from 'lodash'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import VideoPlayer from '@/components/VideoPlayer'
import VocabularyList from '@/components/VocabularyList.vue'
import TextTrackList from '@/components/TextTrackList.vue'
import MarkerList from '@/components/MarkerList.vue'
import { db } from '../helpers/db'

let loadingInstance = null

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
        currentCueIndex: -1,
        currentCueEndTime: -1,
        nextCueStartTime: -1,
        replayCueIndex: -1,
      },
      currentTextTrackIndex: 0,
      isReviewing: false,
      isReplaying: false,
      isReplayLoop: false,
      timeBeforeReplay: null,
      replayEndTime: null,
      isFetchingData: true,
      showTimeupDialog: false,
      isQuizEnable: false,
    }
  },
  computed: {
    ...mapState({
      isAuthenticating: state => state.isAuthenticating,
      userId: state => state.user && state.user.uid,
      roundId: state => state.round.roundId,
      isRoundInitialized: state => state.round.isRoundInitialized,
      round: state => state.round.round,
      videoUrl: state => state.video.videoUrl,
      playingTime: state => state.video.playingTime,
      textTrackEnUrl: state => state.video.textTrackEnUrl,
      textTrackZhUrl: state => state.video.textTrackZhUrl,
      totalLearningTime: state => state.video.duration * 2,
      isVideoInitialized: state => state.video.isVideoInitialized,
      remainingTime: state => state.round.remainingTime,
    }),
    isPreRoundReady() {
      // Pre-round = user ready + video initialized
      return this.isVideoInitialized && !this.isAuthenticating && !this.isRoundInitialized
    },
    isRoundReady() {
      return this.isVideoInitialized && !this.isAuthenticating && this.isRoundInitialized
    },
    formattedRemainingTime() {
      const minute = parseInt(this.remainingTime / 60)
      const second = parseInt(this.remainingTime % 60)
      return {
        minute: minute.toString().padStart(2, 0),
        second: (second > 0 ? second : 0).toString().padStart(2, 0),
      }
    },
  },
  created() {
    const videoId = this.$route.params.videoId
    this.$store.dispatch('video/fetchVideo', { videoId })
    loadingInstance = Loading.service({ fullscreen: true })
  },
  mounted() {
    this.$refs.topProgress.start()

    this.$watch(
      () => {
        return this.$refs.playerRef?.playingTime || 0
      },
      time => {
        const textTrack = this.textTracks.zh.find(textTrack => time > textTrack.startTime && time < textTrack.endTime)
        this.currentTextTrackIndex = textTrack ? parseInt(textTrack.id) : this.currentTextTrackIndex
      },
    )

    this.fetchRoundData()
    this.getUserVideoData()
    this.onRoundDataInitialized()
  },
  destroyed() {
    loadingInstance?.close()
    this.saveVideoPlayingTime(this.playingTime)
    this.$store.dispatch('round/clearCountDownInterval')
  },
  watch: {
    isAuthenticating: function () {
      this.getUserVideoData()
    },
    isPreRoundReady: function () {
      this.fetchRoundData()
    },
    isRoundReady: function () {
      this.onRoundDataInitialized()
    },
    remainingTime: function (remainingTime) {
      const percentage = 1 - remainingTime / this.totalLearningTime
      this.$refs.topProgress.set(percentage * 100)

      if (remainingTime < 0) {
        if (!this.$store.state.round.endedAt) {
          this.$store.dispatch('round/calculateRoundScore')
          this.$store.dispatch('round/endCurrentRound')
        }
        if (!process.env.VUE_APP_DISABLE_NEXT_STAGE) {
          this.showTimeupDialog = true
        }
      } else if (this.totalLearningTime - remainingTime > 60) {
        this.isQuizEnable = true
      }
    },
  },
  methods: {
    fetchRoundData() {
      if (this.isPreRoundReady) {
        const videoId = this.$route.params.videoId
        this.$store.dispatch('round/fetchLatestRound', { canStartNewRound: true }).then(() => {
          if (this.$store.state.round.round?.endedAt && !process.env.VUE_APP_DISABLE_NEXT_STAGE) {
            this.$router.push(`/quiz/${videoId}`)
          }
        })
      }
    },
    getUserVideoData() {
      const videoId = this.$route.params.videoId
      const userId = this.userId

      if (userId && this.isFetchingData) {
        this.isFetchingData = false

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
    onRoundDataInitialized() {
      if (this.isRoundReady) {
        loadingInstance?.close()

        if (this.round.endedAt) {
          const videoId = this.$route.params.videoId
          this.$router.push(`/quiz/${videoId}`)
        }

        const lastPlayingTime = this.round.lastPlayingTime
        console.log('Last play time:', lastPlayingTime)
        this.$refs.playerRef.playAtTime(lastPlayingTime)

        const lastRemainingTime = this.round.lastRemainingTime
        console.log('Last remaining time:', lastRemainingTime)
        const percentage = 1 - lastRemainingTime / this.totalLearningTime
        this.$refs.topProgress.set(percentage * 100)

        console.log('Total Learning Time:', this.totalLearningTime)
        if (lastRemainingTime < this.totalLearningTime) {
          this.$store.dispatch('round/startCountDown')
        }
      }
    },
    handlerClose() {
      this.saveVideoPlayingTime(this.playingTime)
    },
    onVideoDataLoad(player) {
      const duration = player.duration()
      this.$store.commit('video/setVideoDuration', duration)
      this.$store.commit('video/setVideoInitialized')
    },
    onVideoCanPlay() {},
    onVideoPlayerPlay() {
      this.$store.dispatch('round/recordBehavior', 'playVideo')
      if (this.remainingTime <= this.totalLearningTime) {
        this.$store.dispatch('round/startCountDown')
      }
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
      } else if (this.isReplayLoop && this.textTracks.en.length > 0) {
        if (this.textTracks.replayCueIndex < 0) {
          const currentCueIndex = this.textTracks.en.findIndex(
            cue => playingTime > cue.startTime && playingTime < cue.endTime,
          )
          this.textTracks.replayCueIndex = currentCueIndex
          this.saveVideoPlayingTime(playingTime)
        } else {
          const replayCueIndex = this.textTracks.replayCueIndex
          const endTime = this.textTracks.en[replayCueIndex].endTime
          const startTime = this.textTracks.en[replayCueIndex].startTime
          if (playingTime > endTime) {
            this.$store.dispatch('round/recordBehavior', 'replayLoop')
            this.$store.commit('video/setPlayingTime', playingTime)
            this.$refs.playerRef.playAtTime(startTime)
          }
        }
      } else {
        this.textTracks.replayCueIndex = -1
        this.$store.commit('video/setPlayingTime', playingTime)
        this.saveVideoPlayingTime(playingTime)

        if (
          this.textTracks.en.length > 0 &&
          playingTime > this.textTracks.currentCueEndTime &&
          playingTime > this.textTracks.nextCueStartTime
        ) {
          const currentCueIndex = this.textTracks.en.findIndex(
            cue => playingTime > cue.startTime && playingTime < cue.endTime,
          )
          if (currentCueIndex >= 0) {
            this.textTracks.currentCueIndex = currentCueIndex
            this.textTracks.currentCueEndTime = this.textTracks.en[currentCueIndex].endTime
            this.textTracks.nextCueStartTime = this.textTracks.en[currentCueIndex + 1]?.startTime
            const vm = this
            setTimeout(() => {
              vm.$store.dispatch('round/recordNewCaptionListen', currentCueIndex)
            }, 100)
          }
        }
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
      if (textTracks) {
        this.$store.dispatch('round/recordRoundTextTrackLength', textTracks.length)
      }
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
          videoId: this.$route.params.videoId,
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
            videoId: this.$route.params.videoId,
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
    onReplayMarker(startTime, endTime) {
      this.$store.commit('video/setPlayingTime', startTime)
      this.$refs.playerRef.changeReplay(true)
      this.$refs.playerRef.playAtTime(startTime)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      }
      this.isReplayLoop = true

      this.$store.dispatch('round/recordBehavior', 'replayMarker')
    },
    onReplayLoopChange(isReplayLoop) {
      this.isReplayLoop = isReplayLoop
      if (isReplayLoop) {
        this.$store.dispatch('round/recordBehavior', 'startReplay')
      } else {
        this.$store.dispatch('round/recordBehavior', 'endReplay')
      }
    },
    handleQuiz() {
      const round = this.$store.state.round.round
      const videoId = this.$route.params.videoId

      if (!videoId) {
        this.$router.push('/')
      }

      if (!round.endedAt) {
        this.$confirm('進入測驗後就無法再回學習頁面，確定開始測驗？', '進入測驗', {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(async () => {
            await this.$store.dispatch('round/calculateRoundScore')
            await this.$store.dispatch('round/endCurrentRound')
            this.$router.push(`/quiz/${videoId}`)
          })
          .catch(() => {})
      } else {
        this.$router.push(`/quiz/${videoId}`)
      }
    },
  },
}
</script>
