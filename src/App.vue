<script setup lang="ts">
import VerticalNav from '@/components/VerticalNav.vue'
</script>

<template>
  <VApp class="!overflow-hidden">
    <VLayout>
      <VMain>
        <VerticalNav />
        <RouterView />
      </VMain>
    </VLayout>
  </VApp>
</template>
