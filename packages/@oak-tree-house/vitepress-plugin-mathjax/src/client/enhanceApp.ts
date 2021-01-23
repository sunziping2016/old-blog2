import { App } from 'vue'
import AsyncMathjax from './AsyncMathjax'

export default function enhanceApps(app: App): void {
  app.component('AsyncMathjax', AsyncMathjax)
}
