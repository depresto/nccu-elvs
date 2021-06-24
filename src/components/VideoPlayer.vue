<template>
  <div class="main-video">
    <video-player
      v-if="videoSrc"
      ref="videoPlayer"
      class="video-player-box vjs-16-9 vjs-control vjs-button vjs-big-play-centered"
      :options="{
        ...playerOptions,
        sources: [
          {
            type: 'video/mp4',
            src: videoSrc,
          },
        ],
      }"
      :playsinline="true"
      @ready="onPlayerReadied"
      @play="onPlayerPlay"
      @pause="onPlayerPause"
      @loadeddata="onPlayerLoadeddata($event)"
      @timeupdate="onPlayerTimeupdate($event)"
      @canplay="onPlayerCanplay($event)"
      @ended="onPlayerEnded($event)"
    />
  </div>
</template>

<script>
import 'videojs-markers'
import { WebVTT } from 'videojs-vtt.js'
import Axios from 'axios'
import '../plugins/LabelButton'
import '../plugins/ReplayButton'
import { formatTime } from '../helpers'
import { playerOptions, playerMarkerSettings } from '../helpers/player'
export default {
  props: {
    videoSrc: {
      type: String,
    },
    textTrackZhSrc: {
      type: String,
    },
    textTrackEnSrc: {
      type: String,
    },
    onTextTrackLoaded: {
      type: Function,
    },
    onTextTrackIndexChange: {
      type: Function,
    },
    onPlayerMarkerAdd: {
      type: Function,
    },
    onVideoPlayerPlay: {
      type: Function,
    },
    onVideoPlayerPause: {
      type: Function,
    },
    onVideoPlayerEnded: {
      type: Function,
    },
    onVideoTimeUpdated: {
      type: Function,
    },
    onVideoCanPlay: {
      type: Function,
    },
    onVideoDataLoad: {
      type: Function,
    },
    onVideoReady: {
      type: Function,
    },
    onReplayLoopChange: {
      type: Function,
    },
    markers: {
      type: Array,
      default() {
        return []
      },
    },
  },
  data() {
    return {
      playerOptions,
      textTracks: {
        zh: [],
        en: [],
      },
      playingTime: 0,
      playerStatus: {
        volume: 100,
      },
      isPlaying: false,
      duration: 0,
    }
  },
  created() {
    const vm = this
    if (this.textTrackZhSrc) {
      Axios.get(this.textTrackZhSrc).then(({ data }) => {
        const textTracks = this.parseVtt(data)
        this.textTracks.zh = textTracks
        vm.onTextTrackLoaded('zh', textTracks)
      })
    }
    if (this.textTrackEnSrc) {
      Axios.get(this.textTrackEnSrc).then(({ data }) => {
        const textTracks = this.parseVtt(data)
        this.textTracks.en = textTracks
        vm.onTextTrackLoaded('en', textTracks)
      })
    }
  },
  methods: {
    onPlayerReadied(player) {
      const vm = this
      player.getChild('controlBar').addChild('labelButton', {}, 1)
      player.getChild('controlBar').addChild('replayButton', {}, 2)
      player.on('addMarker', function () {
        vm.addMarker()
      })
      player.on('changeReplay', function (event) {
        const isReplayLoop = event.value
        vm.onReplayLoopChange?.(isReplayLoop)
      })
      this.onVideoReady?.()
    },
    playVideo() {
      this.$refs.videoPlayer.player.play()
    },
    pauseVideo() {
      this.$refs.videoPlayer.player.pause()
    },
    addMarker() {
      const currentTime = this.$refs.videoPlayer.player.currentTime()
      const textTrack = this.textTracks.en.find(
        textTrack => currentTime > textTrack.startTime && currentTime < textTrack.endTime,
      )
      const timeMarker = {
        startTime: textTrack ? textTrack.startTime : currentTime,
        endTime: textTrack ? textTrack.endTime : currentTime,
        text: textTrack ? textTrack.text : '(無內容)',
      }

      this.onPlayerMarkerAdd?.(timeMarker)
    },
    resetMarkers(markers) {
      this.$refs.videoPlayer.player?.markers?.reset?.(
        markers.map(marker => ({
          text: marker.text,
          time: marker.startTime,
        })),
      )
    },
    playAtTime(time) {
      this.$refs.videoPlayer?.player?.currentTime(time)
    },
    changeReplay(isReplay) {
      this.$refs.videoPlayer.player?.replay()?.setReplay?.(isReplay)
    },
    onPlayerPlay() {
      this.isPlaying = true
      this.onVideoPlayerPlay?.()
    },
    onPlayerPause() {
      this.isPlaying = false
      this.onVideoPlayerPause?.()
    },
    onPlayerEnded() {
      this.onVideoPlayerEnded?.()
    },
    onPlayerTimeupdate(event) {
      const playingTime = event.currentTime()
      this.playingTime = playingTime
      this.onVideoTimeUpdated(playingTime)
    },
    onVolumeChange(value) {
      this.$refs.videoPlayer.player.volume(value / 100)
    },
    onPlayerCanplay() {
      this.onVideoCanPlay?.()
    },
    onPlayerLoadeddata(player) {
      const duration = player.duration()
      this.onVideoDataLoad(player)
      this.duration = duration

      const markers = this.markers.map(marker => ({
        text: marker.text,
        time: marker.startTime,
      }))

      player.markers(playerMarkerSettings)
      player.markers.reset(markers)

      const vm = this
      if (this.textTrackZhSrc)
        player
          .addRemoteTextTrack(
            {
              src: this.textTrackZhSrc,
              srclang: 'zh',
              label: '中文',
              kind: 'caption',
            },
            false,
          )
          .addEventListener('load', function () {
            const cues = this.track.cues
            const textTracks = []
            for (let index = 0; index < cues.length; index++) {
              textTracks.push(cues[index])
            }
            if (vm.textTracks.zh.length === 0 && vm.onTextTrackLoaded) {
              vm.textTracks.zh = textTracks
              vm.onTextTrackLoaded('zh', textTracks)
            }
          })

      if (this.textTrackEnSrc)
        player
          .addRemoteTextTrack(
            {
              src: this.textTrackEnSrc,
              srclang: 'en',
              label: 'English',
              kind: 'caption',
            },
            false,
          )
          .addEventListener('load', function () {
            const cues = this.track.cues
            const textTracks = []
            for (let index = 0; index < cues.length; index++) {
              textTracks.push(cues[index])
            }
            if (vm.textTracks.en.length === 0 && vm.onTextTrackLoaded) {
              vm.textTracks.en = textTracks
              vm.onTextTrackLoaded('en', textTracks)
            }
          })
    },
    formatTime: formatTime,
    parseVtt(vttContent) {
      const cues = []
      try {
        const parser = new WebVTT.Parser(window, WebVTT.StringDecoder())
        parser.oncue = function (cue) {
          cues.push(cue)
        }
        parser.parse(vttContent)
        parser.flush()
      } catch (err) {}

      return cues
    },
  },
}
</script>

<style lang="scss">
.main-video {
  .video-player {
    .video-js {
      width: 100%;
    }
  }
}
.volume-control {
  .el-slider {
    min-width: 120px;
  }
}
.video-js .vjs-play-progress:before {
  top: -0.4em;
  font-size: 1.3em;
  box-shadow: 1px 1px 5px 0px rgba(0, 0, 0, 0.2);
  border-radius: 50%;
}
.vjs-control-bar {
  background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.3)) !important;
}
:not(.vjs-has-started) .vjs-control-bar {
  display: flex;
}
</style>
