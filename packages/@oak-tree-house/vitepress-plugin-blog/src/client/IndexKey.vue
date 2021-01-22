<template>
  <div v-if="classifier">
    <div>
      {{ classifier.title }}({{ Object.keys(classifier.values).length }})
    </div>
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
import { defineComponent, toRefs } from 'vue'
import { useIndexKey } from './index'

export default defineComponent({
  props: {
    blogId: {
      type: String,
      required: true
    }
  },
  setup(props: { blogId: string }) {
    const { blogId } = toRefs(props)
    return useIndexKey(blogId)
  }
})
</script>
