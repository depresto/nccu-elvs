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
            <bar-chart :chart-data="stackedChartData" title="排行榜" />
          </div>

          <div class="border py-3 px-3 mt-3">
            <el-table :data="[]" style="width: 100%">
              <el-table-column prop="date" width="180"> </el-table-column>
              <el-table-column prop="date" width="180"> </el-table-column>
              <el-table-column prop="date" label="學習分數" width="180"> </el-table-column>
              <el-table-column prop="name" label="測驗分數" width="180"> </el-table-column>
              <el-table-column prop="address" label="學習時間"> </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { mapState } from 'vuex'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import DoughnutChart from '@/components/DoughnutChart'
import BarChart from '@/components/BarChart'
import { db } from '@/helpers/db'

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
    }
  },
  computed: {
    ...mapState({
      isAuthenticating: state => state.isAuthenticating,
    }),
  },
  watch: {
    isAuthenticating: function () {
      this.fetchRoundData()
    },
  },
  created() {
    const videoId = this.$route.params.videoId
    this.$store.dispatch('video/fetchVideo', { videoId })
    this.fetchRoundData()

    const vm = this
    db.collection('rounds')
      .orderBy('totalScore', 'desc')
      .get()
      .then(roundShapshots => {
        const rounds = roundShapshots.docs.map(roundShapshot => roundShapshot.data())
        vm.rankedRounds = rounds
        vm.stackedChartData = {
          labels: rounds.map(round => round.user.email),
          datasets: [
            {
              label: '學習時間',
              data: rounds.map(round => Math.round(round.totalLearningTime)),
              backgroundColor: '#317cba',
            },
            {
              label: '複習時間',
              data: rounds.map(round => Math.round(round.totalReviewingTime)),
              backgroundColor: '#f0794b',
            },
            {
              label: '剩餘時間',
              data: rounds.map(round => Math.round(round.remainingTime)),
              backgroundColor: '#81c0e4',
            },
          ],
        }
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
            const totalLearningTime = Math.round(round.totalLearningTime)
            const totalReviewingTime = Math.round(round.totalReviewingTime)
            vm.currentRoundChartData = {
              labels: ['學習時間', '複習時間', '剩餘時間'],
              datasets: [
                {
                  label: '學習時間分佈',
                  data: [totalLearningTime, totalReviewingTime, remainingTime],
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
      this.$router.push(`/video/${videoId}`)
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
