<template>
  <div>
    <div>{{ classifier.title }}</div>
    <div>
      <span v-for="(value, key) of classifier.values" :key="key">
        <router-link :to="`/${blogId}/${key}`">
          {{ key }}({{ value.totalItems }})
        </router-link>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs, ref } from 'vue'
import initialBlogData from '@blogData'

export default defineComponent({
  props: {
    blogId: {
      type: String,
      required: true
    }
  },
  setup(props: { blogId: string }) {
    const { blogId } = toRefs(props)
    const blogData = ref(initialBlogData)
    const classifier = computed(() => blogData.value[blogId.value])
    if (import.meta.hot) {
      import.meta.hot?.on(
        'plugin-blog:blogData',
        ({ blogData: newBlogData }) => {
          blogData.value = newBlogData
        }
      )
    }
    return {
      classifier
    }
  }
})
</script>
