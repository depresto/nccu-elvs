<template>
  <el-card class="text-track-card">
    <div slot="header" class="clearfix">
      <div class="d-flex justify-content-between">
        <span>字幕列表</span>
        <div>
          <el-checkbox class="mr-3" v-model="zhEnabled">中文</el-checkbox>
          <el-checkbox v-model="enEnabled">EN</el-checkbox>
        </div>
      </div>
    </div>

    <div class="text-track-section text-center">
      <div v-if="currentTextTrackIndex - 2 < 0">
        <div :key="index" v-for="index in 2 - currentTextTrackIndex">
          <p>{{ '\xA0' }}</p>
          <p>{{ '\xA0' }}</p>
        </div>
      </div>

      <div
        :key="index"
        v-for="index in textTrackZh.length"
        :class="[
          {
            active: currentTextTrackIndex == index,
            hide: index - currentTextTrackIndex > 2 || index - currentTextTrackIndex < -1,
          },
          'pb-1',
        ]"
      >
        <p v-if="textTrackEn[index - 1] && enEnabled">
          <el-popover
            :key="textIndex"
            v-for="(text, textIndex) in textTrackEn[index - 1].text.split(' ')"
            placement="top"
            :title="text.replace(/,|\./, '')"
            trigger="click"
          >
            <div>
              <el-button
                type="default"
                size="mini"
                @click="onLookup(text.replace(/,|\./, ''), textTrackEn[index - 1].startTime)"
              >
                查詢
              </el-button>
              <el-button
                type="primary"
                size="mini"
                @click="onVocabularyAdd(text.replace(/,|\./, ''), textTrackEn[index - 1].startTime)"
              >
                加入單字筆記
              </el-button>
            </div>

            <span slot="reference">{{ ` ${text} ` }}</span>
          </el-popover>
        </p>
        <p v-if="zhEnabled">{{ textTrackZh[index - 1].text }}</p>
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  props: {
    textTrackZh: {
      type: Array,
    },
    textTrackEn: {
      type: Array,
    },
    currentTextTrackIndex: {
      type: Number,
      default() {
        return 1
      },
    },
    onLookup: {
      type: Function,
    },
    onVocabularyAdd: {
      type: Function,
    },
  },
  data() {
    return {
      zhEnabled: true,
      enEnabled: true,
    }
  },
}
</script>

<style lang="scss" scoped>
.text-track-card {
  height: 100%;
}
.text-track-section {
  font-size: 16px;
  line-height: 1.2;
  color: #707070;
  .active {
    font-weight: bold;
    font-size: 110%;
  }
  .hide {
    display: none;
  }
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
