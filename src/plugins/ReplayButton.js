import videojs from 'video.js'
class ReplayButton extends videojs.getComponent('Button') {
  constructor(player, options = {}) {
    super(player, options)
    this.addClass('fas')
    this.addClass('fa-sync')
    this.el().title = '開啟句子重播循環'
    this.setAttribute('isReplay', 'false')
  }

  handleClick(_e) {
    this.toggleClass('fa-sync')
    this.toggleClass('fa-redo')
    const isReplay = this.getAttribute('isReplay') !== 'false'
    if (isReplay) {
      this.el().title = '開啟句子重播循環'
    } else {
      this.el().title = '關閉句子重播循環'
    }
    this.setAttribute('isReplay', !isReplay)
    const player = this.player()
    player.trigger({ type: 'changeReplay', value: !isReplay })
  }
}
videojs.registerComponent('replayButton', ReplayButton)
export default ReplayButton
