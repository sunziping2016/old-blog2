<template>
  <iframe
    marginwidth="0"
    marginheight="0"
    :width="small ? 298 : 330"
    :height="small ? 52 : 86"
    :src="`//music.163.com/outchain/player?type=2&id=${id}&auto=${autoplay ? 1 : 0}&height=${small ? 32 : 66}`"
    style="border:none;"
  />
</template>

<script setup>
import { defineProps, toRefs } from 'vue'

const props = defineProps({
  small: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    required: true
  },
  autoplay: {
    type: Boolean,
    default: false
  }
});

const { small, id, autoplay } = toRefs(props)
</script>
