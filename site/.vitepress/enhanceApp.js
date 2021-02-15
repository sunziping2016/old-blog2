import Bilibili from './components/Bilibili.vue'
import NetEaseCloudMusic from './components/NetEaseCloudMusic.vue'

export default function enhanceApps(app) {
  app.component('Bilibili', Bilibili)
  app.component('NetEaseCloudMusic', NetEaseCloudMusic)
}