import { ComponentOptions, defineComponent, h, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const Content: ComponentOptions = defineComponent({
  name: 'Content',
  setup() {
    const route = useRoute()
    const content = route.meta.content
    return () =>
      typeof content === 'string'
        ? h(defineAsyncComponent(() => import(/* @vite-ignore */ content)))
        : h('h3', "This page doesn't contain any content.")
  }
})

export default Content
