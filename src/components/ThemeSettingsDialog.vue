<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { VDialog, VCard, VCardText, VBtn } from 'vuetify/components'
import { useTheme } from 'vuetify'

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
const vuetifyTheme = useTheme()

type Theme = 'light' | 'dark' | 'system'
const preference = ref<Theme>((localStorage.getItem('theme') as Theme) || 'system')

const theme = computed<Theme>({
  get: () => preference.value,
  set: (val) => {
    preference.value = val
    localStorage.setItem('theme', val)
    applyTheme()
  },
})

function applyTheme() {
  if (preference.value === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    vuetifyTheme.global.name.value = isDark ? 'dark' : 'light'
  } else {
    vuetifyTheme.global.name.value = preference.value
  }
}

onMounted(() => applyTheme())

// Слушаем изменения системной темы
const mq = window.matchMedia('(prefers-color-scheme: dark)')
mq.addEventListener('change', () => {
  if (preference.value === 'system') applyTheme()
})
</script>

<template>
  <VDialog v-model="props.modelValue" max-width="360">
    <VCard title="Настройки темы">
      <template #append>
        <VBtn icon="mdi-close" variant="text" @click="$emit('update:modelValue', modelValue)" />
      </template>

      <VCardText class="d-flex justify-space-between gap-4">
        <VCard
          :color="theme === 'system' ? 'primary' : ''"
          width="33.3%"
          class="d-flex flex-column align-center pa-2 rounded-lg"
          @click="theme = 'system'"
        >
          <Monitor width="24" />
          <span class="text-sm">Системная</span>
        </VCard>

        <VCard
          :color="theme === 'light' ? 'primary' : ''"
          width="33.3%"
          class="d-flex flex-column align-center pa-2 rounded-lg"
          @click="theme = 'light'"
        >
          <Sun width="24" />
          <span class="text-sm">Светлая</span>
        </VCard>

        <VCard
          :color="theme === 'dark' ? 'primary' : ''"
          width="33.3%"
          class="d-flex flex-column align-center pa-2 rounded-lg"
          @click="theme = 'dark'"
        >
          <Moon width="24" />
          <span class="text-sm">Тёмная</span>
        </VCard>
      </VCardText>
    </VCard>
  </VDialog>
</template>
