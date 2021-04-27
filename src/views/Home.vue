<template>
  <DefaultLayout> </DefaultLayout>
</template>

<script>
import { Loading } from 'element-ui'
import DefaultLayout from '@/components/layouts/DefaultLayout'

export default {
  name: 'Home',
  components: {
    DefaultLayout,
  },
  created() {
    const videoId = 'fY2kjeFVQ95Kb9m6NABx'
    const loadingInstance = Loading.service({ fullscreen: true })
    this.$router.push(`/video/${videoId}`).then(() => {
      loadingInstance.close()
    })
  },
}
</script>
