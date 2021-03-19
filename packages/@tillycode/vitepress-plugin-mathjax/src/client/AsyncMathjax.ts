import { defineComponent, toRefs, h, ref, watch } from 'vue'

export default defineComponent({
  props: {
    src: {
      type: String,
      required: true
    },
    inline: {
      type: Boolean,
      required: true
    },
    formula: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const { inline, src } = toRefs(props)
    // return () => h(inline.value ? 'span' : 'div', formula.value)
    const content = ref<string>()
    const load = () => {
      fetch(src.value)
        .then((r) => r.text())
        .then((svg) => {
          content.value = svg
        })
    }
    watch(src, load)
    load()
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props: Record<string, any> = {}
      if (content.value !== undefined) {
        props.innerHTML = content.value
      }
      return h(inline.value ? 'span' : 'p', {
        class: [
          'mathjax ',
          inline.value ? 'mathjax-inline' : 'mathjax-display'
        ],
        ...props
      })
    }
  }
})
