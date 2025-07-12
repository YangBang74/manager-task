<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LayoutDefault from '@/layouts/default.vue'

const route = useRoute()

const layout = computed(() => {
  return route.meta.layout === 'default' ? LayoutDefault : LayoutDefault
})
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
