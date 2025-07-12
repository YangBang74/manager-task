<script setup lang="ts">
import { useTaskStore } from '@/stores/tasks'

const store = useTaskStore()
</script>

<template>
  <pre>{{ store.tasks }}</pre>
</template>
