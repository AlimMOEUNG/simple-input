<template>
  <Transition name="modal-fade">
    <div
      v-if="isVisible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="close"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />

      <!-- Modal card -->
      <Transition name="modal-scale">
        <div
          v-if="isVisible"
          class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          <!-- Gradient header -->
          <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 px-8 py-6">
            <div class="flex items-center gap-4">
              <!-- Animated icon -->
              <div class="flex-shrink-0 w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  class="w-7 h-7 text-white animate-pulse"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>

              <div class="flex-1 text-white">
                <h2 class="text-xl font-bold mb-2">{{ t('updateModalTitle') }}</h2>
                <!-- Version badge: vOLD → vNEW -->
                <div class="flex items-center gap-2 text-sm">
                  <span class="px-3 py-1 bg-white/25 rounded-full font-semibold">
                    v{{ oldVersion }}
                  </span>
                  <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                  <span class="px-3 py-1 bg-white/40 rounded-full font-bold text-base">
                    v{{ newVersion }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="px-8 py-6 space-y-4">
            <!-- First use since update -->
            <p class="text-base text-gray-800 dark:text-gray-200 font-semibold">
              {{ t('updateModalFirstUse') }}
            </p>

            <!-- Purpose of this page -->
            <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ t('updateModalPurpose') }}
            </p>

            <!-- Reassurance box -->
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-5 py-4 flex items-start gap-3">
              <svg
                class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ t('updateModalReassurance') }}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-8 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
            <button
              @click="close"
              class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
            >
              {{ t('updateModalGotIt') }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18nWrapper } from '../composables/useI18nWrapper'

interface Props {
  oldVersion: string
  newVersion: string
}

defineProps<Props>()
const emit = defineEmits<{ closed: [] }>()

const { t } = useI18nWrapper()
const isVisible = ref(false)

onMounted(() => {
  // Small delay so the page renders before the modal appears
  setTimeout(() => {
    isVisible.value = true
  }, 350)
})

function close() {
  isVisible.value = false
  // Wait for the fade-out transition to complete before notifying parent to scroll
  setTimeout(() => emit('closed'), 350)
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.3s ease;
}
.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(-16px);
}
</style>
