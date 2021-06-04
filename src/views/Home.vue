<template>
  <DefaultLayout> </DefaultLayout>
</template>

<script>
import { Loading } from 'element-ui'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { db } from '@/helpers/db'

export default {
  name: 'Home',
  components: {
    DefaultLayout,
  },
  created() {
    const vm = this
    const loadingInstance = Loading.service({ fullscreen: true })
    db.collection('videos')
      .where('default', '==', true)
      .limit(1)
      .get()
      .then(videoSnapshots => {
        videoSnapshots.forEach(videoSnapshot => {
          const videoId = videoSnapshot.id
          vm.$router.push(`/video/${videoId}`).then(() => {
            loadingInstance.close()
          })
        })
      })
  },
}
</script>
