<template>
  <div class="main-video">
    <video-player
      ref="videoPlayer"
      class="video-player-box vjs-16-9 vjs-control vjs-button vjs-big-play-centered"
      :options="playerOptions"
      :playsinline="true"
      @ready="onPlayerReadied"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @loadeddata="onPlayerLoadeddata($event)"
      @timeupdate="onPlayerTimeupdate($event)"
      @canplay="onPlayerCanPlay($event)"
    />

    <div class="mt-3 d-flex align-items-center">
      <div class="mr-3"><i class="el-icon-collection-tag"></i> 標籤</div>
      <el-button type="primary" class="mr-2" icon="el-icon-plus" @click="addMarker">新增</el-button>
      <el-select
        v-model="currentPlayerMarker"
        class="mr-2"
        placeholder="選擇時間標籤"
        no-data-text="無資料"
        @change="onPlayerMarkerChange"
      >
        <el-option
          v-for="item in playerMarkers"
          :key="item.time"
          :label="`${item.text} (${formatTime(item.time)})`"
          :value="item.time"
        >
        </el-option>
      </el-select>
      <el-button type="primary" plain icon="el-icon-video-play" @click="playMarker">播放</el-button>
      <el-button type="primary" plain icon="el-icon-back" @click="previousMarker">上一個</el-button>
      <el-button type="primary" plain icon="el-icon-right" @click="nextMarker">下一個</el-button>
    </div>
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
  },
  data() {
    return {
      playerOptions: {
        ...playerOptions,
        sources: [
          {
            type: 'video/mp4',
            src: this.videoSrc,
          },
        ],
      },
      textTracks: {
        zh: [],
        en: [],
      },
      playingTime: 0,
      duration: {
        second: 0,
        minute: 0,
      },
      playerStatus: {
        volume: 100,
      },
      playerMarkers: [],
      currentPlayerMarker: '',
      isPlaying: false,
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
        const markers = this.player().markers.getMarkers()
        vm.playerMarkers.push(...markers)
        vm.currentPlayerMarker = markers[markers.length - 1].time
      })
    },
    playerVideo() {
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
      const timeMarker = { time: currentTime, text: textTrack ? textTrack.text : '(無段落)' }

      this.playerMarkers.push(timeMarker)
      this.$refs.videoPlayer.player.markers.add([timeMarker])

      this.currentPlayerMarker = currentTime
    },
    previousMarker() {
      this.$refs.videoPlayer.player.markers?.prev()

      const currentMarkerTime = this.currentPlayerMarker
      if (currentMarkerTime) {
        const markerIndex = this.playerMarkers.findIndex(marker => marker.time === currentMarkerTime)
        const previousIndex = markerIndex - 1 >= 0 ? markerIndex - 1 : 0

        const time = this.playerMarkers[previousIndex].time
        this.currentPlayerMarker = time
        this.playAtTime(time)
      }
    },
    nextMarker() {
      this.$refs.videoPlayer.player.markers?.next()

      const currentMarkerTime = this.currentPlayerMarker
      if (currentMarkerTime) {
        const markerIndex = this.playerMarkers.findIndex(marker => marker.time === currentMarkerTime)
        const nextIndex = markerIndex + 1 < this.playerMarkers.length ? markerIndex + 1 : this.playerMarkers.length - 1

        const time = this.playerMarkers[nextIndex].time
        this.currentPlayerMarker = time
        this.playAtTime(time)
      }
    },
    playMarker() {
      this.playAtTime(this.currentPlayerMarker)
    },
    playAtTime(time) {
      this.$refs.videoPlayer.player.currentTime(time)
    },
    onPlayerMarkerChange(time) {
      this.playAtTime(time)
    },
    onPlayerCanPlay(event) {
      const duration = Math.round(event.duration())
      const minutes = Math.floor(duration / 60)
      this.duration.second = duration % 60
      this.duration.minute = Math.floor(minutes % 60)
      this.duration.hour = Math.floor(minutes / 60)
    },
    onPlayerTimeupdate(event) {
      this.playingTime = event.currentTime()
    },
    onVolumeChange(value) {
      this.$refs.videoPlayer.player.volume(value / 100)
    },
    onPlayerLoadeddata(player) {
      player.markers({
        ...playerMarkerSettings,
        markers: this.playerMarkers,
      })

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
      } catch (err) {
        console.log(err)
      }

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
