import videojs from 'video.js'

class ReplayPlugin extends videojs.getPlugin('plugin') {
  super(player, options) {
    this.super(player, options)
    player.setAttribute('isReplay', 'false')
  }

  toggleReplay(replay) {
    if (replay) {
      this.player.setAttribute('isReplay', replay)
      this.player.trigger({ type: 'changeReplay', value: replay })
      return replay
    } else {
      const isReplay = this.player.getAttribute('isReplay') !== 'false'
      this.player.setAttribute('isReplay', !isReplay)
      this.player.trigger({ type: 'changeReplay', value: !isReplay })
      return !isReplay
    }
  }
}
videojs.registerPlugin('replay', ReplayPlugin)

class ReplayButton extends videojs.getComponent('Button') {
  constructor(player, options = {}) {
    super(player, options)
    this.addClass('fas')
    this.addClass('fa-sync')
    this.el().title = '開啟句子重播循環'

    const vm = this
    player.on('changeReplay', function (event) {
      vm.toggleClass('fa-sync')
      vm.toggleClass('fa-redo')
      const isReplay = event.value
      if (isReplay) {
        vm.el().title = '開啟句子重播循環'
      } else {
        vm.el().title = '關閉句子重播循環'
      }
    })
  }

  handleClick(_e) {
    const player = this.player()
    player.replay().toggleReplay()
  }
}
videojs.registerComponent('replayButton', ReplayButton)
export default ReplayButton
