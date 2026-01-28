<!-- Generic Review Prompt Component -->
<template>
  <div
    v-if="showPrompt"
    class="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50"
  >
    <div class="flex items-start justify-between mb-2">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {{ title || 'Enjoying this extension?' }}
      </h3>
      <button
        @click="handleDismiss"
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
    <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
      {{ message || 'Please consider leaving a review on the store. It helps us a lot!' }}
    </p>
    <div class="flex gap-2">
      <button
        @click="handleReview"
        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded"
      >
        {{ reviewButtonText || 'Leave a Review' }}
      </button>
      <button
        @click="handleDismiss"
        class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium px-3 py-2 rounded"
      >
        {{ dismissButtonText || 'Maybe Later' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  shouldPromptForReview,
  markAsReviewed,
  markAsRejected,
  getReviewUrl,
} from '@/services/reviewPromptService'

interface Props {
  minActions?: number
  title?: string
  message?: string
  reviewButtonText?: string
  dismissButtonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  minActions: 5,
})

const showPrompt = ref(false)

onMounted(async () => {
  showPrompt.value = await shouldPromptForReview(props.minActions)
})

async function handleReview() {
  await markAsReviewed()
  showPrompt.value = false
  window.open(getReviewUrl(), '_blank')
}

async function handleDismiss() {
  await markAsRejected()
  showPrompt.value = false
}
</script>
