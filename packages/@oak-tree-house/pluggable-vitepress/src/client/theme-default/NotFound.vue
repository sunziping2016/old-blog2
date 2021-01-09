<template>
  <div class="theme">
    <h1>404</h1>
    <blockquote>{{ getMsg() }}</blockquote>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const msgs = ref([
      `There's nothing here.`,
      `How did we get here?`,
      `That's a Four-Oh-Four.`,
      `Looks like we've got some broken links.`
    ])

    const getMsg = () =>
      msgs.value[Math.floor(Math.random() * msgs.value.length)]

    return {
      msgs,
      getMsg
    }
  }
})
</script>
