import videojs from 'video.js'
class LabelButton extends videojs.getComponent('Button') {
  constructor(player, options = {}) {
    super(player, options)
    this.addClass('fas')
    this.addClass('fa-tag')
    this.el().title = '新增句子標記'
  }

  handleClick(_e) {
    const player = this.player()
    const currentTime = player.currentTime()
    const timeMarker = { time: currentTime, text: '佩佩豬' }

    player.markers.add([timeMarker])
    player.trigger('addMarker', [timeMarker])
  }
}
videojs.registerComponent('labelButton', LabelButton)
export default LabelButton
