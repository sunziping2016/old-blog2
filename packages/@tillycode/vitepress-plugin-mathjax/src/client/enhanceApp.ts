import { App } from 'vue'
import AsyncMathjax from './AsyncMathjax'

export default function enhanceApps(app: App): void {
  if (import.meta.env.DEV) {
    app.component('AsyncMathjax', AsyncMathjax)
  }
}
