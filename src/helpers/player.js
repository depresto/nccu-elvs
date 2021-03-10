export const playerOptions = {
  fluid: true,
  controls: true,
  preload: 'auto',
  language: 'zh-TW',
  playbackRates: [0.7, 1.0, 1.5, 2.0],
  inactivityTimeout: 0,
  controlBar: {
    children: [
      'playToggle',
      'volumePanel',
      'currentTimeDisplay',
      'timeDivider',
      'durationDisplay',
      'progressControl',
      'liveDisplay',
      'seekToLive',
      'remainingTimeDisplay',
      'customControlSpacer',
      'playbackRateMenuButton',
      'chaptersButton',
      'descriptionsButton',
      'subsCapsButton',
    ],
  },
  html5: {
    nativeTextTracks: false,
  },
}

export const playerMarkerSettings = {
  markerStyle: {
    width: '7px',
    'border-radius': '30%',
    'background-color': 'red',
  },
  markerTip: {
    display: true,
    text: function (marker) {
      return marker.text
    },
    time: function (marker) {
      return marker.time
    },
  },
  breakOverlay: {
    display: false,
    displayTime: 3,
    style: {
      width: '100%',
      height: '20%',
      'background-color': 'rgba(0,0,0,0.7)',
      color: 'white',
      'font-size': '17px',
    },
    text: function (marker) {
      return 'Break overlay: ' + marker.overlayText
    },
  },
}
