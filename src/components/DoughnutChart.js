import { Doughnut, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: Doughnut,
  mixins: [reactiveProp],
  props: ['title'],
  data: function () {
    return {
      options: {
        title: {
          display: true,
          text: this.title,
        },
        percentageInnerCutout: 80,
      },
    }
  },
  mounted() {
    this.renderChart(this.chartData, this.options)
  },
}
