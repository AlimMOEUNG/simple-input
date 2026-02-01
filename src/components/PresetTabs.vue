<template>
  <div class="preset-tabs-container">
    <div class="tabs-header">
      <!-- Tab buttons for each preset -->
      <button
        v-for="preset in presets"
        :key="preset.id"
        @click="$emit('select-preset', preset.id)"
        :class="['tab-button', { active: preset.id === activePresetId }]"
        :title="`${preset.name}: ${preset.keyboardShortcut}`"
      >
        {{ preset.name }}
      </button>

      <!-- Add preset button -->
      <button @click="$emit('add-preset')" class="tab-button add-button" :title="t('addPreset')">
        <Plus :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { TranslationPreset } from '@/types/common'
import { useI18nWrapper } from '@/composables/useI18nWrapper'

const { t } = useI18nWrapper()

interface Props {
  presets: TranslationPreset[]
  activePresetId: string | null
}

defineProps<Props>()

defineEmits<{
  'select-preset': [id: string]
  'add-preset': []
}>()
</script>

<style scoped>
.preset-tabs-container {
  margin-bottom: 1rem;
}

.tabs-header {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid theme('colors.gray.200');
}

:root[data-theme='dark'] .tabs-header {
  border-bottom-color: theme('colors.gray.700');
}

.tab-button {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.375rem 0.375rem 0 0;
  border: 1px solid transparent;
  background-color: transparent;
  color: theme('colors.gray.600');
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

:root[data-theme='dark'] .tab-button {
  color: theme('colors.gray.400');
}

.tab-button:hover {
  background-color: theme('colors.gray.100');
  color: theme('colors.gray.900');
}

:root[data-theme='dark'] .tab-button:hover {
  background-color: theme('colors.gray.800');
  color: theme('colors.gray.100');
}

.tab-button.active {
  background-color: theme('colors.blue.50');
  color: theme('colors.blue.600');
  border-color: theme('colors.blue.200');
  border-bottom-color: transparent;
}

:root[data-theme='dark'] .tab-button.active {
  background-color: theme('colors.blue.950');
  color: theme('colors.blue.400');
  border-color: theme('colors.blue.800');
}

.add-button {
  background-color: theme('colors.green.50');
  color: theme('colors.green.600');
  border-color: theme('colors.green.200');
}

:root[data-theme='dark'] .add-button {
  background-color: theme('colors.green.950');
  color: theme('colors.green.400');
  border-color: theme('colors.green.800');
}

.add-button:hover {
  background-color: theme('colors.green.100');
  color: theme('colors.green.700');
}

:root[data-theme='dark'] .add-button:hover {
  background-color: theme('colors.green.900');
  color: theme('colors.green.300');
}
</style>
