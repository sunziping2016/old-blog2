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

<script setup lang="ts">
import { defineProps, toRefs } from 'vue'
import { useIndexKey } from './index'

const props = defineProps<{
  blogId: string
}>()

const { blogId } = toRefs(props)

const { classifier } = useIndexKey(blogId)
</script>
