import { mixins, HorizontalBar } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: HorizontalBar,
  mixins: [reactiveProp],
  props: ['title'],
  data: function () {
    return {
      options: {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: this.title,
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
  mounted() {
    this.renderChart(this.chartData, this.options)
  },
}
