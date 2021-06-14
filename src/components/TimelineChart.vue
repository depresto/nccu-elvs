<template>
  <div>
    <div class="mx-auto legends">
      <div class="legend"><span class="key-dot learning"></span>學習時間</div>
      <div class="legend"><span class="key-dot reviewing"></span>複習時間</div>
      <div class="legend"><span class="key-dot remaining"></span>剩餘時間</div>
    </div>

    <div id="timeline"></div>

    <div class="legend" v-if="showDetail">
      <span :class="['key-dot', detailType]"></span>{{ keyMapping[detailType] }} {{ endTime - startTime }}
    </div>
  </div>
</template>

<script>
import * as timeline from 'd3-timelines'
import * as d3 from 'd3'
export default {
  data() {
    return {
      chart: null,
      svg: null,
      showDetail: false,
      detailType: null,
      startTime: 0,
      endTime: 0,
      keyMapping: {
        learning: '學習時間',
        reviewing: '複習時間',
        remaining: '剩餘時間',
      },
    }
  },
  created() {
    const vm = this
    this.chart = timeline
      .timelines()
      .stack()
      .colorProperty('type')
      .relativeTime()
      .showTimeAxis()
      .margin({ left: 180, right: 30, top: 0, bottom: 0 })
      .mouseover(function (d, i, datum) {
        vm.showDetail = true
        vm.detailType = d.type
        vm.startTime = d.starting_time
        vm.endTime = d.ending_time
      })
      .mouseout(function () {
        vm.showDetail = false
      })
  },
  mounted() {
    const testData = [
      {
        class: 'pA',
        label: 'test1234example@gmail.com',
        times: [
          { color: '#317cba', type: 'learning', starting_time: 0, ending_time: 100 },
          { color: '#f0794b', type: 'reviewing', starting_time: 100, ending_time: 200 },
          { color: '#317cba', type: 'learning', starting_time: 200, ending_time: 400 },
          { color: '#f0794b', type: 'reviewing', starting_time: 400, ending_time: 700 },
          { color: '#81c0e4', type: 'remaining', starting_time: 700, ending_time: 800 },
        ],
      },
      {
        class: 'pB',
        label: 'person b',
        times: [{ type: 'learning', starting_time: 0, ending_time: 300 }],
      },
      {
        class: 'pC',
        label: 'person c',
        times: [{ color: '#81c0e4', type: 'remaining', starting_time: 0, ending_time: 400 }],
      },
    ]
    this.svg = d3
      .select('#timeline')
      .append('svg')
      .style('font-size', '12px')
      .style('fill', '#333')
      .attr('font-weight', 500)
      .attr('width', '100%')
      .datum(testData)
      .call(this.chart)
  },
}
</script>

<style lang="scss" scoped>
.legends {
  display: flex;
  justify-content: center;
}
.legend {
  margin-right: 1rem;
  font-size: 10px;
}
.key-dot {
  display: inline-block;
  height: 10px;
  margin-right: 0.5em;
  width: 35px;
  &.learning {
    background-color: #317cba;
  }
  &.reviewing {
    background-color: #f0794b;
  }
  &.remaining {
    background-color: #81c0e4;
  }
}
</style>
