<template>
  <div>
    <el-card class="box-card mb-3" v-loading="loading" v-if="currentVocabulary">
      <div slot="header" class="clearfix">
        <span>{{ currentVocabulary.text }}</span>
      </div>
      <div class="text item">
        {{ currentVocabulary.definition }}
      </div>
    </el-card>

    <el-card>
      <div slot="header" class="clearfix">
        <span>單字筆記</span>
      </div>

      <el-table
        id="vocabulary-list"
        :show-header="false"
        :data="vocabularies"
        style="width: 100%"
        empty-text="暫無單字"
        size="small"
      >
        <el-table-column fixed prop="vocabulary" label="單字">
          <template slot-scope="scope">
            <el-tooltip class="item" effect="dark" content="發音" placement="left">
              <img
                class="speak-icon cursor-pointer mr-2"
                src="@/assets/icon/volume.svg"
                @click="onPronounce(scope.row.vocabulary)"
                alt="發音"
              />
            </el-tooltip>
            <span :class="{ new: scope.row.new }">{{ scope.row.vocabulary }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="時間" width="55">
          <template slot-scope="scope">
            <span>{{ formatTime(scope.row.time) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="60">
          <template slot-scope="scope">
            <el-tooltip class="item" effect="dark" content="查詢" placement="top">
              <i
                class="el-icon-search cursor-pointer mr-2"
                @click="onLookupVocabulary(scope.row.vocabulary, vocabularies[scope.$index].time)"
              />
            </el-tooltip>
            <el-tooltip class="item" effect="dark" content="刪除" placement="top">
              <i class="el-icon-delete cursor-pointer" @click.prevent="deleteRow(scope.$index, vocabularies)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.speak-icon {
  height: 16px;
  display: inline-block;
}
</style>

<style lang="scss">
#vocabulary-list {
  .cell {
    display: flex;
    align-items: center;
  }
  span {
    color: #a0a0a0;
    transition: color 0.5s;
    &.new {
      color: #f2784b;
    }
  }
}
</style>

<script>
export default {
  props: {
    onLookup: {
      type: Function,
    },
    vocabularies: {
      type: Array,
      default() {
        return []
      },
    },
  },
  data() {
    return {
      loading: false,
      currentVocabulary: null,
    }
  },
  methods: {
    addVocabulary(text, time) {
      this.vocabularies.push({ vocabulary: text, time, new: true })
    },
    deleteRow(index, rows) {
      rows.splice(index, 1)
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
    onPronounce(vocabulary) {
      try {
        // const audio = new Audio(`/upload/words/${vocabulary.toLowerCase()}.mp3`)
        const audio = new Audio(
          `https://speech.voicetube.com/lang/en-US/pitch/0.00/speakingRate/1.00/${vocabulary.toLowerCase()}.mp3`,
        )
        audio.play()
        // eslint-disable-next-line no-empty
      } catch {}
    },
    async onLookupVocabulary(vocabulary, time) {
      this.onLookup(time)

      this.loading = true
      try {
        this.currentVocabulary = {
          text: '',
          definition: '',
        }
        const response = await fetch(
          `https://dictionary-api-gilt.vercel.app/api/dictionary/${vocabulary.toLowerCase()}`,
        )
        const data = await response.json()
        this.currentVocabulary = {
          text: vocabulary,
          definition: data['vocabulary'] || '查無此字',
        }
      } catch (error) {
        console.log(error)
      }
      this.loading = false
    },
  },
}
</script>
