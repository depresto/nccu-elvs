<template>
  <DefaultLayout v-visibility-change="pageVisibilityChange">
    <vue-topprogress ref="topProgress" color="#f2784b" :trickle="false"></vue-topprogress>

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
        <el-button
          type="primary"
          v-if="user && user.group === 1"
          @click="$router.push(`/quiz/${$route.params.videoId}`)"
          >進入測驗</el-button
        >
        <el-button type="primary" v-else @click="onRestartNewRound">進入下回合</el-button>
      </span>
    </el-dialog>

    <div class="container" v-if="!loading">
      <div class="row">
        <div class="col-md-8 px-0 px-md-2">
          <video-player
            v-if="video"
            ref="playerRef"
            :video-src="video.videoUrl"
            :text-track-zh-src="video.textTrackZhUrl"
            :text-track-en-src="video.textTrackEnUrl"
            :onTextTrackLoaded="onTextTrackLoaded"
            :onTextTrackIndexChange="onTextTrackIndexChange"
            :markers="markers"
            :onPlayerMarkerAdd="onMarkerAdd"
            :onVideoDataLoad="onVideoDataLoad"
            :onVideoTimeUpdated="onVideoTimeUpdated"
            :onVideoPlayerPlay="onVideoPlayerPlay"
            :onVideoPlayerPause="onVideoPlayerPause"
            :onVideoPlayerEnded="onVideoPlayerEnded"
            :onReplayLoopChange="onReplayLoopChange"
            :onVideoReady="onVideoReady"
          />

          <div class="mt-3">
            <text-track-list
              v-if="isReplaying || isReplayLoop"
              :textTrackZh="textTracks.zh"
              :textTrackEn="textTracks.en"
              :currentTextTrackIndex="currentTextTrackIndex"
              :onLookup="onLookupTextTrack"
              :onVocabularyAdd="onVocabularyAdd"
            />
          </div>
        </div>

        <div class="col-md-4 mt-3 mt-md-0">
          <div id="timer" class="text-center">
            <div class="title">剩餘時間</div>
            <span class="counter">{{ formattedRemainingTime.minute }} : {{ formattedRemainingTime.second }}</span>

            <div v-if="isQuizEnable">
              <el-button type="primary" @click="handleQuiz">進入測驗</el-button>
            </div>
          </div>

          <div class="mt-3">
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

          <div class="mt-3">
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
    </div>
  </DefaultLayout>
</template>

<style lang="scss" scoped>
#timer {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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
      textTracks: {
        zh: [],
        en: [],
        currentCueIndex: -1,
        currentCueEndTime: -1,
        nextCueStartTime: -1,
        replayCueIndex: -1,
      },
      isVideoPlayerReadied: false,
      currentTextTrackIndex: 0,
      isReviewing: false,
      isReplaying: false,
      isReplayLoop: false,
      timeBeforeReplay: null,
      replayEndTime: null,
      showTimeupDialog: false,
      isQuizEnable: false,
      isBeforeHiddenPlaying: false,
      isLastPlayTimeUpdated: false,
      latestPlayingTimes: [],
      loading: false,
    }
  },
  computed: {
    ...mapState({
      isAuthenticating: state => state.isAuthenticating,
      isRoundInitialized: state => Boolean(state.round.round),
      isVideoInitialized: state => Boolean(state.video.video),

      userId: state => state.userId,
      user: state => state.user,
      roundId: state => state.round.roundId,

      round: state => state.round.round,
      video: state => state.video.video,

      playingTime: state => state.video.playingTime,
      totalLearningTime: state => state.video.video?.duration * 2 || 0,
      remainingTime: state => state.round.remainingTime,

      vocabularies: state => state.round.vocabularies,
      markers: state => state.round.markers,
    }),
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
    loadingInstance = Loading.service({ fullscreen: true })

    if (this.userId) {
      this.fetchRoundData()
    }
  },
  mounted() {
    // this.$refs.topProgress.start()
    this.isReplay = this.isReplayLoop = false
  },
  destroyed() {
    loadingInstance?.close()
    this.$store.dispatch('round/clearCountDownInterval')
  },
  watch: {
    userId: function (userId) {
      if (userId) {
        this.fetchRoundData()
      }
    },
    markers: {
      immediate: true,
      handler(markers) {
        this.$refs.playerRef?.resetMarkers?.(markers)
      },
    },
    remainingTime: function (remainingTime) {
      if (remainingTime < 0) {
        if (!this.$store.state.round.endedAt) {
          this.$store.dispatch('round/calculateRoundScore')
          this.$store.dispatch('round/endCurrentRound')
        }
        if (!process.env.VUE_APP_DISABLE_NEXT_STAGE) {
          this.$refs.playerRef.pauseVideo()
          this.showTimeupDialog = true
        }
      } else if (this.totalLearningTime - remainingTime > 60 && this.user?.group === 1) {
        this.isQuizEnable = true
      }
    },
  },
  methods: {
    fetchRoundData() {
      const vm = this

      const videoId = this.$route.params.videoId
      const userId = this.userId

      this.loading = true
      this.$store.dispatch('round/fetchLatestRound', { canStartNewRound: true, videoId }).then(() => {
        vm.loading = false
        loadingInstance.close()

        const roundIndex = vm.$store.state.round.roundIndex
        console.log('RoundIndex:', roundIndex)

        if (vm.$store.state.round.round?.endedAt) {
          vm.$router.push(`/quiz/${videoId}`)
        } else {
          const roundId = vm.roundId
          vm.$store.dispatch('round/bindVideoRoundVocabularies', {
            userId,
            videoId,
            roundId,
          })
          vm.$store.dispatch('round/bindVideoRoundMarkers', {
            userId,
            videoId,
            roundId,
          })
        }
      })
    },
    handlerClose() {
      this.saveVideoPlayingTime(this.playingTime)
    },
    onVideoDataLoad(player) {
      const duration = player.duration()
      const videoId = this.$route.params.videoId
      if (!this.video.duration) {
        db.collection('videos').doc(videoId).update({
          duration,
        })
      }
    },
    onVideoReady() {
      this.isVideoPlayerReadied = true

      const lastPlayingTime = this.round.lastPlayingTime
      console.log('Last play time:', lastPlayingTime)
      this.$refs.playerRef.playAtTime(lastPlayingTime)
      setTimeout(() => {
        this.isLastPlayTimeUpdated = true
      }, 100)

      const lastRemainingTime = this.round.lastRemainingTime
      console.log('Last remaining time:', lastRemainingTime)
      console.log('Total Learning Time:', this.totalLearningTime)
      if (lastRemainingTime < this.totalLearningTime) {
        this.$store.dispatch('round/startCountDown')
      }

      loadingInstance.close()
    },
    onVideoPlayerPlay() {
      this.$store.dispatch('round/recordBehavior', { behavior: 'playVideo' })
      if (this.remainingTime <= this.totalLearningTime) {
        this.$store.dispatch('round/startCountDown')
      }
    },
    onVideoPlayerPause() {
      let previousPlayingTime
      let playingTime = this.$refs.playerRef?.playingTime
      for (let currentPlayingTime of this.latestPlayingTimes) {
        if (previousPlayingTime && Math.abs(currentPlayingTime - previousPlayingTime) > 1) {
          playingTime = previousPlayingTime
          break
        }
        previousPlayingTime = currentPlayingTime
      }

      this.$store.dispatch('round/recordBehavior', {
        behavior: 'pauseVideo',
        playingTime,
      })
    },
    onVideoPlayerEnded() {
      this.$store.dispatch('round/recordBehavior', { behavior: 'endVideo' })
    },
    onVideoTimeUpdated(playingTime) {
      const textTrack = this.textTracks.zh.find(
        textTrack => playingTime > textTrack.startTime && playingTime < textTrack.endTime,
      )
      this.currentTextTrackIndex = textTrack ? parseInt(textTrack.id) : this.currentTextTrackIndex

      this.latestPlayingTimes.push(playingTime)
      if (this.latestPlayingTimes.length > 5) {
        this.latestPlayingTimes.shift()
      }

      if (this.isReplaying) {
        if (playingTime > this.replayEndTime) {
          this.$store.dispatch('round/recordBehavior', { behavior: 'pauseVideo', playingTime })
          this.$store.dispatch('round/recordBehavior', {
            behavior: 'playVideo',
            endReviewing: true,
            playingTime: this.timeBeforeReplay,
          })
          this.$refs.playerRef.playAtTime(this.timeBeforeReplay)

          this.isReplaying = false
          this.timeBeforeReplay = null
          this.replayEndTime = null
        }
      } else if (this.isReplayLoop && this.textTracks.en.length > 0) {
        if (this.textTracks.replayCueIndex < 0) {
          const currentCueIndex = this.findCueIndexByVideoTime(playingTime)
          this.textTracks.replayCueIndex = currentCueIndex
          this.saveVideoPlayingTime(playingTime)
        } else {
          const replayCueIndex = this.textTracks.replayCueIndex
          const endTime = this.textTracks.en[replayCueIndex].endTime
          const startTime = this.textTracks.en[replayCueIndex].startTime

          if (Math.abs(playingTime - endTime) > endTime - startTime) {
            this.isReplayLoop = false
            this.$refs.playerRef.changeReplay(false)
          }
          if (playingTime > endTime) {
            this.$store.commit('video/setPlayingTime', playingTime)
            this.$refs.playerRef.playAtTime(startTime)
            this.$store.dispatch('round/recordBehavior', { behavior: 'pauseVideo', playingTime })
            this.$store.dispatch('round/recordBehavior', { behavior: 'replayLoop', playingTime: startTime })
          }
        }
      } else {
        this.textTracks.replayCueIndex = -1
        this.$store.commit('video/setPlayingTime', playingTime)

        if (this.isLastPlayTimeUpdated) {
          this.saveVideoPlayingTime(playingTime)
        }

        const currentCueIndex = this.findCueIndexByVideoTime(playingTime)
        if (currentCueIndex >= 0 && currentCueIndex !== this.textTracks.currentCueIndex) {
          this.textTracks.currentCueIndex = currentCueIndex
          const vm = this
          setTimeout(() => {
            vm.$store.dispatch('round/recordNewCaptionListen', currentCueIndex)
          }, 100)
        }
      }
    },
    findCueIndexByVideoTime(playingTime) {
      if (this.textTracks.en.length > 0) {
        return this.textTracks.en.findIndex(cue => playingTime > cue.startTime && playingTime < cue.endTime)
      } else {
        return -1
      }
    },
    saveVideoPlayingTime: throttle(function (playingTime) {
      this.$store.dispatch('round/saveLatestPlayingTime', playingTime)
    }, 1000),
    onLookup(startTime, endTime) {
      this.isReplaying = true
      this.timeBeforeReplay = this.playingTime
      this.$store.commit('video/setPlayingTime', startTime)
      this.replayEndTime = endTime

      this.$refs.playerRef.playAtTime(startTime)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      } else {
        this.$store.dispatch('round/recordBehavior', {
          behavior: 'pauseVideo',
          playingTime: this.$refs.playerRef?.playingTime,
        })
      }
      this.isReviewing = true

      this.$store.dispatch('round/recordBehavior', {
        behavior: 'lookupVocabulary',
        timeout: endTime - startTime,
        playingTime: startTime,
      })
    },
    onTextTrackLoaded(lang, textTracks) {
      this.textTracks[lang] = textTracks
      if (textTracks && !this.video?.textTrackLength) {
        const videoId = this.$route.params.videoId
        db.collection('videos').doc(videoId).update({
          textTrackLength: textTracks.length,
        })
      }
    },
    onTextTrackIndexChange(index) {
      this.currentTextTrackIndex = index
    },
    onLookupTextTrack(text, startTime, endTime) {
      this.$refs.vocabularyRef.$el.scrollIntoView({ behavior: 'smooth' })
      this.$refs.vocabularyRef.onLookupVocabulary(text, startTime, endTime)
    },
    onVocabularyAdd(text, startTime, endTime) {
      this.$refs.vocabularyRef.$el.scrollIntoView({ behavior: 'smooth' })
      const videoId = this.$route.params.videoId
      const userId = this.userId
      const roundId = this.roundId

      db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/vocabularies`).add({
        vocabulary: text,
        startTime,
        endTime,
        videoId,
      })

      this.$store.dispatch('round/recordBehavior', { behavior: 'addVocabulary' })
    },
    onVocabularyDelete(vocabularyId) {
      const videoId = this.$route.params.videoId
      const userId = this.userId
      const roundId = this.roundId

      if (vocabularyId) {
        db.doc(`users/${userId}/videos/${videoId}/rounds/${roundId}/vocabularies/${vocabularyId}`).delete()
      }
      this.$store.dispatch('round/recordBehavior', { behavior: 'deleteVocabulary' })
    },
    onVocabularyPronounce() {
      this.$store.dispatch('round/recordBehavior', { behavior: 'pronounceVocabulary' })
    },
    onMarkerAdd(marker) {
      const videoId = this.$route.params.videoId
      const userId = this.userId
      const roundId = this.roundId

      this.$refs.markerRef.$el.scrollIntoView({ behavior: 'smooth' })

      db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/markers`).add({
        ...marker,
        videoId: this.$route.params.videoId,
      })
      this.$store.dispatch('round/recordBehavior', { behavior: 'addMarker' })
    },
    onMarkerDelete(markerId) {
      const videoId = this.$route.params.videoId
      const userId = this.userId
      const roundId = this.roundId

      if (markerId) {
        db.collection(`users/${userId}/videos/${videoId}/rounds/${roundId}/markers`).doc(markerId).delete()
      }
      this.$store.dispatch('round/recordBehavior', { behavior: 'deleteMarker' })
    },
    onPlayMarker(startTime, endTime) {
      this.isReplaying = true
      this.timeBeforeReplay = this.playingTime
      this.$store.commit('video/setPlayingTime', startTime)
      this.replayEndTime = endTime

      this.$refs.playerRef.playAtTime(startTime)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      } else {
        this.$store.dispatch('round/recordBehavior', {
          behavior: 'pauseVideo',
          playingTime: this.$refs.playerRef?.playingTime,
        })
      }
      this.isReviewing = true
      this.$store.dispatch('round/recordBehavior', {
        behavior: 'playMarker',
        timeout: endTime - startTime,
        playingTime: startTime,
      })
    },
    onReplayMarker(startTime, endTime) {
      this.$store.commit('video/setPlayingTime', startTime)
      this.$refs.playerRef.changeReplay(true)
      this.$refs.playerRef.playAtTime(startTime)
      if (!this.$refs.playerRef.isPlaying) {
        this.$refs.playerRef.playVideo()
      } else {
        this.$store.dispatch('round/recordBehavior', {
          behavior: 'pauseVideo',
          playingTime: this.$refs.playerRef?.playingTime,
        })
      }
      this.isReplayLoop = true
      this.textTracks.replayCueIndex = -1

      this.$store.dispatch('round/recordBehavior', {
        behavior: 'replayMarker',
        timeout: endTime - startTime,
        playingTime: startTime,
      })
    },
    onReplayLoopChange(isReplayLoop) {
      this.isReplayLoop = isReplayLoop
      if (isReplayLoop) {
        this.$store.dispatch('round/recordBehavior', { behavior: 'startReplay' })
      } else {
        this.$store.dispatch('round/recordBehavior', { behavior: 'endReplay' })
      }
    },
    pageVisibilityChange(event, hidden) {
      if (hidden) {
        if (this.$refs.playerRef?.isPlaying) {
          this.isBeforeHiddenPlaying = true
          this.$refs.playerRef.pauseVideo()
          this.$store.dispatch('round/recordBehavior', { behavior: 'pauseVideo' })
        }
      } else {
        if (this.isBeforeHiddenPlaying) {
          this.$refs.playerRef.playVideo()
          this.$store.dispatch('round/recordBehavior', { behavior: 'playVideo' })
        }
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
            this.$refs.playerRef.pauseVideo()
            await this.$store.dispatch('round/calculateRoundScore')
            await this.$store.dispatch('round/endCurrentRound')
            this.$router.push(`/quiz/${videoId}`)
          })
          .catch(() => {})
      } else {
        this.$router.push(`/quiz/${videoId}`)
      }
    },
    async onRestartNewRound() {
      this.$refs.playerRef.pauseVideo()
      await this.$store.dispatch('round/calculateRoundScore')
      await this.$store.dispatch('round/endCurrentRound')
      await this.$store.dispatch('round/startNewRound')
      this.$router.push('/')
    },
  },
}
</script>
