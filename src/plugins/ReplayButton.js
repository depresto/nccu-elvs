import videojs from 'video.js'

class ReplayPlugin extends videojs.getPlugin('plugin') {
  constructor(player, options) {
    super(player, options)
  }

  toggleReplay() {
    const isReplay = this.state.isReplay
    this.setState({ isReplay: !isReplay })
    this.player.trigger({ type: 'changeReplay', value: !isReplay })
    return !isReplay
  }

  setReplay(replay) {
    if (replay !== undefined) {
      this.setState({ isReplay: replay })
      this.player.trigger({ type: 'changeReplay', value: replay })
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
      const isReplay = event.value
      if (isReplay) {
        vm.removeClass('fa-sync')
        vm.addClass('fa-redo')
        vm.el().title = '關閉句子重播循環'
      } else {
        vm.addClass('fa-sync')
        vm.removeClass('fa-redo')
        vm.el().title = '開啟句子重播循環'
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
