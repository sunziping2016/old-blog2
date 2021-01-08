import { defineComponent, resolveComponent, h } from 'vue'

export const Content = defineComponent({
  name: 'OakContent',
  setup() {
    const routerView = resolveComponent('RouterView')
    return () => h(routerView)
  }
})
