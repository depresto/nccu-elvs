<template>
  <DefaultLayout>
    <div class="container">
      <div class="row">
        <div class="col-md-4">
          <div v-if="currentRoundChartData" class="px-3 border chart-container">
            <doughnut-chart :chart-data="currentRoundChartData" title="時間分配" />
            <el-button type="primary" class="btn-restart mt-4" @click="onRestart">再次挑戰</el-button>
          </div>
        </div>

        <div class="col-md-8">
          <div v-if="stackedChartData" class="border py-3 px-3">
            <bar-chart :chart-data="stackedChartData" :options="chartOptions" />
          </div>

          <div class="border py-3 px-3 mt-3 rank-table">
            <el-table :data="rankedRounds" style="width: 100%" empty-text="暫無資料">
              <el-table-column type="index" width="50" align="right">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.email === user.email }">{{ scope.$index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="email" width="250" align="right">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.email === user.email }">{{ scope.row.email }}</span>
                </template>
              </el-table-column>
              <el-table-column label="學習分數" align="right">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.email === user.email }">{{
                    Math.round(((scope.row.BUF + scope.row.TDF) / 2) * 100)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="測驗分數" align="right">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.email === user.email }">{{
                    Math.round(scope.row.quizScore * 100)
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="總學習時間" align="right">
                <template slot-scope="scope">
                  <span :class="{ 'current-user': scope.row.email === user.email }">{{
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
import BarChart from '@/components/BarChart'
import { db } from '@/helpers/db'

let loadingInstance = null

export default {
  components: {
    DefaultLayout,
    DoughnutChart,
    BarChart,
  },
  data() {
    return {
      currentRoundChartData: null,
      stackedChartData: null,
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
      isAuthenticating: state => state.isAuthenticating,
      user: state => state.user,
    }),
  },
  watch: {
    isAuthenticating: function () {
      this.fetchRoundData()
    },
  },
  created() {
    loadingInstance = Loading.service({ fullscreen: true })
    const videoId = this.$route.params.videoId
    this.$store.dispatch('video/fetchVideo', { videoId })
    this.fetchRoundData()

    const vm = this
    db.collection(`videos/${videoId}/rounds`)
      .orderBy('totalScore', 'desc')
      .get()
      .then(roundShapshots => {
        loadingInstance?.close()
        const rounds = roundShapshots.docs
          .map(roundShapshot => roundShapshot.data())
          .filter((value, index, self) => {
            return self.findIndex(round => round.user.email === value.user.email) === index
          })
        vm.rankedRounds = rounds.map(round => ({
          email: round.user.email,
          activeTime: round.activeTime,
          totalLearningTime: round.totalLearningTime,
          totalReviewingTime: round.totalReviewingTime,
          remainingTime: round.remainingTime,
          quizScore: round.quizScore,
          totalScore: round.totalScore,
          BUF: round.BUF,
          TDF: round.TDF,
        }))
        const firstRounds = rounds.slice(0, 5)
        vm.stackedChartData = {
          labels: firstRounds.map(round => round.user.email),
          datasets: [
            {
              label: '學習時間',
              data: firstRounds.map(round => ({
                x: Math.round(round.activeTime - round.totalReviewingTime),
                y: { value: round.user.email, major: round.user.email === this.user.email },
              })),
              backgroundColor: '#317cba',
            },
            {
              label: '複習時間',
              data: firstRounds.map(round => ({
                x: Math.round(round.totalReviewingTime),
                y: { value: round.user.email, major: round.user.email === this.user.email },
              })),
              backgroundColor: '#f0794b',
            },
            {
              label: '剩餘時間',
              data: firstRounds.map(round => ({
                x: Math.round(round.remainingTime),
                y: { value: round.user.email, major: round.user.email === this.user.email },
              })),
              backgroundColor: '#81c0e4',
            },
          ],
        }
      })
      .finally(() => {
        loadingInstance?.close()
      })
  },
  methods: {
    fetchRoundData: function () {
      if (!this.isAuthenticating) {
        const vm = this
        this.$store.dispatch('round/fetchLatestRound').then(function () {
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
      }
    },
    onRestart: function () {
      const videoId = this.$route.params.videoId
      this.$store.dispatch('round/roundRestart').then(() => {
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
.btn-restart {
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
