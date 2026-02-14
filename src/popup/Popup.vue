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

    <!-- Cross-promo banner (all Subtiltee extensions) -->
    <AllExtensionsBanner />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePopupState } from '@/composables/usePopupState'
import PopupHeader from '@/components/PopupHeader.vue'
import MainNavTabs from '@/components/MainNavTabs.vue'
import ProviderTab from '@/components/ProviderTab.vue'
import PresetsTab from '@/components/PresetsTab.vue'
import AllExtensionsBanner from '@/components/AllExtensionsBanner.vue'
import { isMajorOrMinorRelease, hasMajorOrMinorDiff } from '@/utils/version-utils'

// currentView drives which tab content is rendered
const { currentView } = usePopupState()

// Check whether the extension was updated since the last popup open.
// If a significant update (major or minor) is detected, open the What's New page
// with URL params so the page can show a contextual modal.
async function checkForUpdate(): Promise<void> {
  try {
    const currentVersion = chrome.runtime.getManifest().version
    const result = await chrome.storage.sync.get(['currentVersion'])
    const storedVersion = result.currentVersion as string | undefined

    if (!storedVersion || storedVersion !== currentVersion) {
      // Persist the new version immediately so the modal only shows once
      await chrome.storage.sync.set({ currentVersion })

      const isSignificant =
        isMajorOrMinorRelease(currentVersion) ||
        hasMajorOrMinorDiff(storedVersion, currentVersion)

      if (isSignificant) {
        const params = new URLSearchParams({
          fromUpdate: 'true',
          oldVersion: storedVersion ?? 'unknown',
          newVersion: currentVersion,
        })
        const url = chrome.runtime.getURL(`src/whats-new/whats-new.html?${params.toString()}`)
        chrome.tabs.create({ url })
      }
    }
  } catch {
    // Non-critical — silently ignore errors
  }
}

onMounted(() => {
  checkForUpdate()
})
</script>
