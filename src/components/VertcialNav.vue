<script setup lang="ts">
import { Settings, UserRound } from 'lucide-vue-next'
</script>

<template>
  <aside class="relative top-0 left-0 h-screen border-r border-white/20">
    <div class="flex flex-col items-start space-y-2 py-4 px-2">
      <div
        class="flex items-center justify-between w-45 gap-3 bg-white/10 pl-4 pr-4 py-2 rounded-sm"
      >
        <div class="flex gap-3 items-center">
          <button type="button" class="border rounded-full">
            <UserRound />
          </button>
          <div class="flex flex-col gap-0 text-[0.625rem]">
            <span>User</span>
            <span>main@mail.ru</span>
          </div>
        </div>
        <button type="button">
          <Settings :size="20" />
        </button>
      </div>
    </div>
  </aside>
</template>
