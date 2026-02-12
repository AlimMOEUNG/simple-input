<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="w-full max-w-[400px] min-w-[360px] flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-200 ease-in-out"
    style="height: fit-content; min-height: fit-content"
  >
    <!-- Header: title + language selector + theme toggle -->
    <PopupHeader />

    <!-- Main navigation: Presets / Provider segmented control -->
    <MainNavTabs />

    <!-- Tab content -->
    <div class="flex-1 flex flex-col px-3 pb-3 bg-white dark:bg-gray-900">
      <ProviderTab v-if="currentView === 'provider'" />
      <PresetsTab v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePopupState } from '@/composables/usePopupState'
import PopupHeader from '@/components/PopupHeader.vue'
import MainNavTabs from '@/components/MainNavTabs.vue'
import ProviderTab from '@/components/ProviderTab.vue'
import PresetsTab from '@/components/PresetsTab.vue'

// currentView drives which tab content is rendered
const { currentView } = usePopupState()
</script>
