<script setup lang="ts">
import VerticialNav from '@/components/VerticalNav.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="layout">
    <main class="flex">
      <VerticialNav />
      <RouterView class="w-[80%]" />
    </main>
    <footer></footer>
  </div>
</template>
