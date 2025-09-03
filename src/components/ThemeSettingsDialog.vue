<script setup lang="ts">
import { Sun, Moon, Monitor } from 'lucide-vue-next'

defineProps<{
  modelValue: boolean
  currentTheme: 'light' | 'dark' | 'system'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'set-theme', value: 'light' | 'dark' | 'system'): void
}>()
</script>

<template>
  <VDialog :model-value="modelValue" max-width="360" @update:model-value="emit('update:modelValue', $event)">
    <VCard title="Настройки">
      <template #append>
        <VBtn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)"></VBtn>
      </template>
      <VCardText class="d-flex justify-space-between gap-4">
        <VCard
          :color="currentTheme === 'system' ? 'primary' : ''"
          width="33.3%"
          @click="emit('set-theme', 'system')"
          class="d-flex flex-column align-center pa-2 rounded-lg"
        >
          <Monitor width="24" />
          <span class="text-sm">Системная</span>
        </VCard>
        <VCard
          :color="currentTheme === 'light' ? 'primary' : ''"
          width="33.3%"
          @click="emit('set-theme', 'light')"
          class="d-flex flex-column align-center pa-2 rounded-lg"
        >
          <Sun width="24" />
          <span class="text-sm">Светлая</span>
        </VCard>
        <VCard
          :color="currentTheme === 'dark' ? 'primary' : ''"
          width="33.3%"
          @click="emit('set-theme', 'dark')"
          class="d-flex flex-column align-center pa-2 rounded-lg"
        >
          <Moon width="24" />
          <span class="text-sm">Тёмная</span>
        </VCard>
      </VCardText>
    </VCard>
  </VDialog>
</template>