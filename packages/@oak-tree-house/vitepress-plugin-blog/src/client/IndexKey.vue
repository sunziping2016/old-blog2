<template>
  <div v-if="classifier">
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
import { BlogData } from '@types'

export default defineComponent({
  props: {
    blogId: {
      type: String,
      required: true
    }
  },
  setup(props: { blogId: string }) {
    const { blogId } = toRefs(props)
    const blogData = ref<BlogData>()
    const classifier = computed(
      () => blogData.value && blogData.value[blogId.value]
    )
    // noinspection TypeScriptCheckImport
    import(/* @vite-ignore */ `/@blogData?t=${Date.now()}`).then((data) => {
      blogData.value = data.default
    })
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
