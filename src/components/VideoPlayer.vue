<template>
  <div class="main-video">
    <video-player
      ref="videoPlayer"
      class="video-player-box"
      :options="playerOptions"
      :playsinline="true"
      @play="onPlayerPlay($event)"
      @pause="onPlayerPause($event)"
      @loadeddata="onPlayerLoadeddata($event)"
      @timeupdate="onPlayerTimeupdate($event)"
      @canplay="onPlayerCanPlay($event)"
    />

    <div class="d-flex justify-content-between align-items-center mt-3">
      <div class="control-buttons d-flex">
        <div class="mr-3">
          <el-button v-if="!isPlaying" type="primary" icon="el-icon-video-play" @click="playerVideo"> 播放 </el-button>
          <el-button v-else type="primary" icon="el-icon-video-pause" @click="stopVideo"> 暫停 </el-button>
        </div>

        <div class="volume-control d-flex justify-content-between align-items-center">
          <span>音量: {{ playerStatus.volume }}</span>
          <el-slider v-model="playerStatus.volume" class="ml-2" @input="onVolumeChange" />
        </div>
      </div>

      <div>
        影片時間:
        <span>
          <span v-if="playingTime.hour > 0">{{ playingTime.hour }} 時</span> {{ playingTime.minute }} 分
          {{ playingTime.second }} 秒
        </span>
        /
        <span>
          <span v-if="duration.hour > 0">{{ duration.hour }} 時</span> {{ duration.minute }} 分 {{ duration.second }} 秒
        </span>
      </div>
    </div>

    <div class="mt-3 d-flex align-items-center">
      <div class="mr-3"><i class="el-icon-collection-tag"></i> 標籤</div>
      <el-button type="primary" class="mr-2" icon="el-icon-plus" @click="addMarker">新增</el-button>
      <el-select
        v-model="currentPlayerMarker"
        class="mr-2"
        placeholder="選擇時間標籤"
        no-data-text="無資料"
        @change="onPlayerMarkerChnage"
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
export default {
  data() {
    return {
      playerOptions: {
        height: 500,
        controls: true,
        muted: true,
        language: 'zh-TW',
        playbackRates: [0.7, 1.0, 1.5, 2.0],
        sources: [
          {
            type: 'video/mp4',
            src: '/upload/video.mp4',
          },
        ],
      },
      playingTime: {
        second: 0,
        minute: 0,
      },
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
  methods: {
    playerVideo() {
      this.$refs.videoPlayer.player.play()
    },
    stopVideo() {
      this.$refs.videoPlayer.player.pause()
    },
    addMarker() {
      const currentTime = this.$refs.videoPlayer.player.currentTime()
      const timeMarker = { time: currentTime, text: '佩佩豬' }

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
        const nextIndex =
          markerIndex + 1 < this.playerMarkers.length ? markerIndex + 1 : this.playerMarkers.length - 1

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
    onPlayerMarkerChnage(time) {
      this.playAtTime(time)
    },
    onPlayerCanPlay(event) {
      const duration = Math.round(event.duration())
      const minutes = Math.floor(duration / 60)
      this.duration.second = duration % 60
      this.duration.minute = Math.floor(minutes % 60)
      this.duration.hour = Math.floor(minutes / 60)
    },
    onPlayerLoadeddata(player) {
      player.markers({
        markerStyle: {
          width: '7px',
          'border-radius': '30%',
          'background-color': 'red',
        },
        markerTip: {
          display: true,
          text: function (marker) {
            return marker.text
          },
          time: function (marker) {
            return marker.time
          },
        },
        breakOverlay: {
          display: false,
          displayTime: 3,
          style: {
            width: '100%',
            height: '20%',
            'background-color': 'rgba(0,0,0,0.7)',
            color: 'white',
            'font-size': '17px',
          },
          text: function (marker) {
            return 'Break overlay: ' + marker.overlayText
          },
        },
        markers: this.playerMarkers,
      })
    },
    onPlayerPlay() {
      this.isPlaying = true
    },
    onPlayerPause() {
      this.isPlaying = false
    },
    onPlayerTimeupdate(event) {
      const currentTime = Math.round(event.currentTime())
      const minutes = Math.floor(currentTime / 60)
      this.playingTime.second = currentTime % 60
      this.playingTime.minute = Math.floor(minutes % 60)
      this.playingTime.hour = Math.floor(minutes / 60)
    },
    onVolumeChange(value) {
      this.$refs.videoPlayer.player.volume(value / 100)
    },
    formatTime(time) {
      const currentTime = Math.round(time)
      const minutes = Math.floor(currentTime / 60)
      const second = currentTime % 60
      const minute = Math.floor(minutes % 60)
      const hour = Math.floor(minutes / 60)

      if (hour > 0) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second
          .toString()
          .padStart(2, '0')}`
      } else {
        return `${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`
      }
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
</style>
