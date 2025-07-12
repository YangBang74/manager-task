<script setup lang="ts">
import VertcialNav from '@/components/VertcialNav.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="layout">
    <main class="flex gap-4">
      <VertcialNav />
      <RouterView />
    </main>
    <footer></footer>
  </div>
</template>
