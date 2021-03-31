import { App } from 'vue'
import OutboundLink from '@layout/OutboundLink'

export default function enhanceApps(app: App): void {
  app.component('OutboundLink', OutboundLink)
}
