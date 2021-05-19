<template>
  <DefaultLayout>
    <div class="container">
      <div class="row">
        <div class="col-md-4">
          <div v-if="currentRoundChart" class="px-3 border">
            <doughnut-chart :chart-data="currentRoundChart" />

            <el-button type="primary" class="btn-restart mt-4" @click="onRestart">再次挑戰</el-button>
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

export default {
  components: {
    DefaultLayout,
    DoughnutChart,
  },
  data() {
    return {
      currentRoundChart: null,
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
  },
  methods: {
    fetchRoundData: function () {
      if (!this.isAuthenticating) {
        const vm = this
        this.$store.dispatch('round/fetchLatestRound').then(function () {
          const round = vm.$store.state.round.round
          console.log(round)
          if (round) {
            const remainingTime = Math.round(round.remainingTime)
            const totalLearningTime = Math.round(round.totalLearningTime)
            const totalReviewingTime = Math.round(round.totalReviewingTime)
            vm.currentRoundChart = {
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
