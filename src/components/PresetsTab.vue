<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="space-y-2">
    <!-- Preset tab bar with add button -->
    <PresetTabs
      :presets="presetsSettings.presets as TranslationPreset[]"
      :active-preset-id="presetsSettings.activePresetId"
      @select-preset="selectPreset"
      @add-preset="addPreset"
    />

    <!-- Active preset editor -->
    <PresetEditor
      v-if="activePreset"
      :preset="activePreset"
      :all-presets="presetsSettings.presets"
      :can-delete="presetsSettings.presets.length > 1"
      :global-provider="presetsSettings.provider"
      :is-pinned="presetsSettings.pinnedPresetId === activePreset.id"
      @update-preset="updatePreset"
      @delete-preset="deletePreset"
      @set-pinned="setPinnedPreset"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePresetsSettings } from '@/composables/usePresetsSettings'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import PresetTabs from '@/components/PresetTabs.vue'
import PresetEditor from '@/components/PresetEditor.vue'
import type { Preset, TranslationPreset } from '@/types/common'

const { t } = useI18nWrapper()

const {
  presetsSettings,
  addPreset: addPresetHelper,
  updatePreset: updatePresetHelper,
  deletePreset: deletePresetHelper,
  setActivePreset,
  getActivePreset,
  setPinnedPreset,
  canAddPreset,
  maxPresets,
} = usePresetsSettings()

// Derived active preset from the current activePresetId
const activePreset = computed(() => getActivePreset())

function selectPreset(id: string) {
  setActivePreset(id)
}

function addPreset() {
  if (!canAddPreset()) {
    alert(`Maximum limit of ${maxPresets} presets reached`)
    return
  }
  const newPreset = addPresetHelper()
  if (!newPreset) {
    alert(`Maximum limit of ${maxPresets} presets reached`)
  }
}

function updatePreset(updatedPreset: Preset) {
  updatePresetHelper(updatedPreset)
}

function deletePreset(id: string) {
  if (presetsSettings.value.presets.length <= 1) {
    alert(t('cannotDeleteLastPreset'))
    return
  }
  deletePresetHelper(id)
}

</script>
