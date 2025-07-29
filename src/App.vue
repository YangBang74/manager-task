<script setup lang="ts">
import VerticalNav from '@/components/VerticalNav.vue'
</script>

<template>
  <VApp class="!overflow-hidden">
    <VLayout>
      <VerticalNav />
      <VMain>
        <RouterView />
      </VMain>
    </VLayout>
  </VApp>
</template>
