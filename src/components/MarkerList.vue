<template>
  <div>
    <el-card>
      <div slot="header" class="clearfix">
        <span><i class="fas fa-tag"></i> 句子標記</span>
      </div>

      <el-table id="marker-list" :show-header="false" :data="markers" style="width: 100%" size="small">
        <div slot="empty">
          <span>暫無句子標記，趕快點擊播放器 <i class="fas fa-tag"></i> 蒐集標記吧</span>
        </div>

        <el-table-column prop="startTime" label="時間" width="45">
          <template slot-scope="scope">
            <span class="marker-time-code">{{ formatTime(scope.row.startTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="text" label="句子">
          <template slot-scope="scope">
            <div class="marker-paragraph">
              <el-popover
                :key="index"
                v-for="(word, index) in scope.row.text.split(' ')"
                placement="top"
                :title="word.replace(/,|\./, '')"
                trigger="click"
              >
                <div>
                  <el-button
                    type="default"
                    size="mini"
                    @click="onLookup(word.replace(/,|\./, ''), scope.row.startTime, scope.row.endTime)"
                    >查詢</el-button
                  >
                  <el-button
                    type="primary"
                    size="mini"
                    @click="onVocabularyAdd(word.replace(/,|\./, ''), scope.row.startTime, scope.row.endTime)"
                  >
                    加入單字筆記
                  </el-button>
                </div>

                <span slot="reference">{{ ` ${word} ` }}</span>
              </el-popover>
            </div>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="90">
          <template slot-scope="scope">
            <el-tooltip class="item" effect="dark" content="播放句子" placement="top">
              <i
                class="el-icon-video-play icon-button play-button cursor-pointer mr-2"
                @click="onPlayMarker(scope.row.startTime, scope.row.endTime)"
              />
            </el-tooltip>
            <el-tooltip class="item" effect="dark" content="重複播放句子" placement="top">
              <i
                class="el-icon-refresh icon-button play-button cursor-pointer mr-2"
                @click="onReplayMarker(scope.row.startTime, scope.row.endTime)"
              />
            </el-tooltip>
            <el-tooltip class="item" effect="dark" content="刪除" placement="top">
              <i class="el-icon-delete icon-button cursor-pointer" @click.prevent="onMarkerDelete(scope.row.id)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  props: {
    markers: {
      type: Array,
    },
    onLookup: {
      type: Function,
    },
    onVocabularyAdd: {
      type: Function,
    },
    onPlayMarker: {
      type: Function,
    },
    onReplayMarker: {
      type: Function,
    },
    onMarkerDelete: {
      type: Function,
    },
  },
  methods: {
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
#marker-list .cell {
  padding-left: 5px;
  padding-right: 5px;
}
</style>

<style lang="scss" scoped>
.marker-time-code,
.play-button {
  color: #f2784b;
}
.icon-button {
  font-size: 150%;
}
.marker-paragraph {
  color: #000;
  span {
    pointer-events: auto;
  }
  span:hover {
    background-color: #f2784b;
    color: white;
    cursor: pointer;
  }
}
</style>
