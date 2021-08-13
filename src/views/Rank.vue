<template>
  <DefaultLayout>
    <div class="container">
      <div class="row">
        <div class="col-md-4">
          <div v-if="currentRoundChartData" class="px-3 border chart-container">
            <doughnut-chart :chart-data="currentRoundChartData" title="時間分配" />
            <el-button type="primary" class="btn-block mt-4" @click="onRestart">再次挑戰</el-button>
            <el-button class="btn-block mt-4" @click="$router.push(`/person/${$route.params.videoId}`)">
              個人紀錄
            </el-button>
          </div>
        </div>

        <div class="col-md-8">
          <div v-if="rankedBehaviorData" class="border py-3 px-3">
            <p class="text-center mb-4">排行榜</p>
            <timeline-chart :chart-data="rankedBehaviorData" />
          </div>

          <div class="border py-3 px-3 mt-3 rank-table">
            <el-table :data="rankedRounds" style="width: 100%" empty-text="暫無資料">
              <el-table-column type="index" width="50" align="right">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.user.email === userEmail }">{{ scope.$index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="email" width="250" align="right">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.user.email === userEmail }">
                    {{ scope.row.user.email }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="學習分數" align="right" sortable :sort-by="['learningScore']">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.user.email === userEmail }">{{
                    Math.round(scope.row.learningScore * 100)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="測驗分數" align="right" sortable :sort-by="['quizScore']">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.user.email === userEmail }">{{
                    Math.round(scope.row.quizScore * 100)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="總學習時間" align="right" sortable :sort-by="['activeTime']">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.user.email === userEmail }">{{
                    formattedTime(scope.row.activeTime)
                  }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { Loading } from 'element-ui'
import { mapState } from 'vuex'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import DoughnutChart from '@/components/DoughnutChart'
import TimelineChart from '@/components/TimelineChart.vue'

let loadingInstance = null

export default {
  components: {
    DefaultLayout,
    DoughnutChart,
    TimelineChart,
  },
  data() {
    return {
      currentRoundChartData: null,
      rankedBehaviorData: null,
      rankedRounds: [],
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: '排行榜',
        },
        indexAxis: 'y',
        scales: {
          yAxes: [
            {
              stacked: true,
              maxBarThickness: 20,
            },
          ],
          xAxes: [
            {
              stacked: true,
            },
          ],
        },
      },
    }
  },
  computed: {
    ...mapState({
      userId: state => state.userId,
      user: state => state.user,
      videoRounds: state => state.video.rounds,
    }),
    userEmail: function () {
      return this.user?.email
    },
  },
  watch: {
    userId: function (userId) {
      if (userId) {
        this.fetchRoundData()
      }
    },
  },
  created() {
    loadingInstance = Loading.service({ fullscreen: true })
    const vm = this

    const videoId = this.$route.params.videoId
    if (this.userId) {
      this.fetchRoundData()
    }
    this.$store
      .dispatch('video/bindVideoRounds', { videoId })
      .then(() => {
        loadingInstance?.close()
        console.log(vm.videoRounds)
        const rounds = vm.videoRounds
          .filter(round => round.user)
          .filter((value, index, self) => {
            return self.findIndex(round => round.user.email === value.user.email) === index
          })
        vm.rankedRounds = rounds

        const firstRounds = rounds.slice(0, 5)
        vm.rankedBehaviorData = firstRounds.map((round, index) => {
          let accumulatdTime = 0
          return {
            class: index,
            label: round.user.email,
            times: [
              ...round.behaviors.map(behavior => {
                const startTime = accumulatdTime
                const endTime = accumulatdTime + behavior.duration
                accumulatdTime = endTime
                return {
                  color: behavior.type === 'learning' ? '#317cba' : '#f0794b',
                  type: behavior.type,
                  starting_time: startTime,
                  ending_time: endTime,
                }
              }),
              {
                color: '#81c0e4',
                type: 'remaining',
                starting_time: accumulatdTime,
                ending_time: accumulatdTime + round.remainingTime,
              },
            ],
          }
        })
      })
      .finally(() => {
        loadingInstance?.close()
      })
  },
  methods: {
    fetchRoundData: function () {
      const vm = this
      const videoId = this.$route.params.videoId
      this.$store.dispatch('round/fetchLatestRound', { videoId }).then(function () {
        const round = vm.$store.state.round.round
        if (round) {
          const remainingTime = Math.round(round.remainingTime)
          const activeTime = Math.round(round.activeTime)
          const totalReviewingTime = Math.round(round.totalReviewingTime)
          vm.currentRoundChartData = {
            labels: ['學習時間', '複習時間', '剩餘時間'],
            datasets: [
              {
                label: '學習時間分佈',
                data: [activeTime - totalReviewingTime, totalReviewingTime, remainingTime],
                backgroundColor: ['#317cba', '#f0794b', '#81c0e4'],
              },
            ],
          }
        }
      })
    },
    onRestart: function () {
      const videoId = this.$route.params.videoId
      this.$store.dispatch('round/startNewRound').then(() => {
        this.$router.push(`/video/${videoId}`)
      })
    },
    formattedTime(time) {
      const minute = parseInt(time / 60)
      const second = parseInt(time % 60)

      return `${minute.toString().padStart(2, 0)}:${(second > 0 ? second : 0).toString().padStart(2, 0)}`
    },
  },
}
</script>

<style lang="scss" scoped>
.border {
  border-radius: 10px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
}
.chart-container {
  padding-top: 100px;
  padding-bottom: 150px;
}
.btn-block {
  width: 90%;
  margin: 0 auto;
  margin-left: 5%;
  text-align: center;
}
</style>

<style lang="scss">
.rank-table {
  .current-user {
    color: #f2784b;
    font-weight: bold;
  }
}
</style>
