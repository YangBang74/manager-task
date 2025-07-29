<script setup lang="ts">
import VerticalNav from '@/components/VerticalNav.vue'
</script>

<template>
  <VApp>
    <VLayout>
      <VerticalNav />
      <VMain>
        <RouterView />
      </VMain>
    </VLayout>
  </VApp>
</template>
