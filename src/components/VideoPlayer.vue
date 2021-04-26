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
import LabelButton from '../plugins/LabelButton'
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

      const labelButton = new LabelButton(player)
      player.controlBar.el().insertBefore(labelButton.el(), player.controlBar.volumePanel.el())
      player.on('addMarker', function () {
        vm.addMarker()
      })
    },
    playVideo() {
      this.$refs.videoPlayer.player.play()
    },
    stopVideo() {
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
        text: textTrack ? textTrack.text : '(無段落)',
      }

      this.onPlayerMarkerAdd?.(timeMarker)
    },
    playAtTime(time) {
      this.$refs.videoPlayer?.player?.currentTime(time)
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
      this.onVideoDataLoad()
      this.duration = duration
      this.$store.commit('video/setVideoDuration', duration * 2)

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
:not(.vjs-has-started) .vjs-control-bar {
  display: flex;
}
</style>
