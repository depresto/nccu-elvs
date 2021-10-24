<template>
  <DefaultLayout>
    <div class="container" v-if="!loading">
      <div class="row">
        <div class="col-md-4">
          <div v-if="currentRoundChartData" class="px-3 border chart-container">
            <doughnut-chart :chart-data="currentRoundChartData" title="時間分配" />
            <el-button type="primary" class="btn-block mt-4" @click="onRestart">再次挑戰</el-button>
            <el-button class="btn-block mt-4" @click="$router.push(`/rank/${$route.params.videoId}`)">
              排行榜
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
              <el-table-column
                prop="roundIndex"
                label="回合"
                width="80"
                align="center"
                sortable
                :sort-by="['roundIndex']"
              >
                <template slot-scope="scope">
                  {{ scope.row.roundIndex }}
                </template>
              </el-table-column>
              <el-table-column prop="id" width="230" align="right"> </el-table-column>
              <el-table-column label="學習分數" align="right" sortable :sort-by="['learningScore']">
                <template slot-scope="scope">
                  {{ Math.round(scope.row.learningScore * 100) }}
                </template>
              </el-table-column>
              <el-table-column label="測驗分數" align="right" sortable :sort-by="['quizScore']">
                <template slot-scope="scope">
                  {{ Math.round(scope.row.quizScore * 100) }}
                </template>
              </el-table-column>
              <el-table-column label="總學習時間" align="right" sortable :sort-by="['activeTime']">
                <template slot-scope="scope">
                  {{ formattedTime(scope.row.activeTime) }}
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
import { db } from '@/helpers/db'

let loadingInstance = null

export default {
  components: {
    DefaultLayout,
    DoughnutChart,
    TimelineChart,
  },
  data() {
    return {
      loading: false,
      currentRoundChartData: null,
      rankedBehaviorData: null,
      rankedRounds: [],
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: '個人排行',
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
      user: state => state.user,
    }),
  },
  watch: {
    user: function (user) {
      if (user.id) {
        this.fetchRoundData()
      }
    },
  },
  created() {
    loadingInstance = Loading.service({ fullscreen: true })
    this.loading = true
    if (this.user.id) {
      this.fetchRoundData()
    }
  },
  methods: {
    fetchRoundData: function () {
      const videoId = this.$route.params.videoId
      const vm = this

      db.collection(`videos/${videoId}/rounds`)
        .where('user.userId', '==', this.user.id)
        .get()
        .then(roundShapshots => {
          loadingInstance?.close()
          const rounds = roundShapshots.docs.map(roundShapshot => roundShapshot.data())
          rounds.sort((a, b) => b.totalScore - a.totalScore)
          vm.rankedRounds = rounds.map(round => ({
            id: round.user.userId,
            roundIndex: round.roundIndex,
            activeTime: round.activeTime,
            totalLearningTime: round.totalLearningTime,
            totalReviewingTime: round.totalReviewingTime,
            remainingTime: round.remainingTime,
            quizScore: round.quizScore,
            totalScore: round.totalScore,
            learningScore: round.learningScore,
            BUF: round.BUF,
            TDF: round.TDF,
          }))
          const firstRounds = rounds.slice(0, 5)
          vm.rankedBehaviorData = firstRounds.map((round, index) => {
            let accumulatdTime = 0
            return {
              class: index,
              label: `${round.roundIndex}-${round.user.userId}`,
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
      this.$store.dispatch('round/fetchLatestRound', { videoId }).then(function () {
        const round = vm.$store.state.round.round
        vm.loading = false
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
