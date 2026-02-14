<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
  >
    <!-- Left: logo + title -->
    <h1
      class="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200 flex-shrink-0"
    >
      <Zap :size="16" class="text-blue-600 dark:text-blue-400" />
      {{ t('appTitle') }}
    </h1>

    <!-- Center: rotating CTA ticker -->
    <div class="flex-1 flex justify-center px-2 overflow-hidden">
      <div class="relative h-6 w-full max-w-[180px]">
        <transition-group name="ticker" tag="div" class="relative h-full">
          <button
            v-if="currentTickerIndex === 0"
            key="whats-new"
            @click="openWhatsNew"
            class="ticker-btn ticker-blue absolute inset-0 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold overflow-hidden"
          >
            <!-- Progress fill — resets on each index change via :key -->
            <span :key="tickerCycle" class="ticker-fill ticker-fill-blue" aria-hidden="true" />
            <!-- newspaper icon -->
            <svg
              class="w-3 h-3 flex-shrink-0 relative z-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"
              />
              <line x1="16" y1="8" x2="10" y2="8" />
              <line x1="16" y1="12" x2="10" y2="12" />
            </svg>
            <span class="relative z-10">{{ t('tickerWhatsNew') }}</span>
          </button>

          <button
            v-if="currentTickerIndex === 1"
            key="rate"
            @click="openReview"
            class="ticker-btn ticker-yellow absolute inset-0 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold overflow-hidden"
          >
            <!-- Progress fill -->
            <span :key="tickerCycle" class="ticker-fill ticker-fill-yellow" aria-hidden="true" />
            <!-- star icon -->
            <svg
              class="w-3 h-3 flex-shrink-0 fill-yellow-400 stroke-yellow-500 relative z-10"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            <span class="relative z-10">{{ t('tickerRateUs') }}</span>
          </button>

          <button
            v-if="currentTickerIndex === 2"
            key="feedback"
            @click="openFeedback"
            class="ticker-btn ticker-orange absolute inset-0 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold overflow-hidden"
          >
            <!-- Progress fill -->
            <span :key="tickerCycle" class="ticker-fill ticker-fill-orange" aria-hidden="true" />
            <!-- message icon -->
            <svg
              class="w-3 h-3 flex-shrink-0 relative z-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span class="relative z-10">{{ t('tickerFeedback') }}</span>
          </button>
        </transition-group>
      </div>
    </div>

    <!-- Right: language selector + theme toggle -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <select
        v-model="uiLocale"
        class="px-2 py-0.5 text-[10px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option v-for="option in availableLanguages" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <button
        @click="cycleTheme"
        class="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
        :title="t('themeToggle')"
      >
        <component :is="themeIcon" :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Sun, Moon, Monitor, Zap } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useThemeMode } from '@/composables/useThemeMode'
import { isFirefox } from '@/utils/browser-detection'
import type { SupportedLocale } from '@/core/utils/i18n'

const { t, locale, setLocale } = useI18nWrapper()
const { themeMode, cycleTheme } = useThemeMode()

const availableLanguages = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

// Two-way binding for the language <select>
const uiLocale = computed<SupportedLocale>({
  get: () => locale.value,
  set: (value) => setLocale(value),
})

// Icon reflects the current active theme mode
const themeIcon = computed(() => {
  switch (themeMode.value) {
    case 'light':
      return Sun
    case 'dark':
      return Moon
    default:
      return Monitor
  }
})

// ─── Rotating ticker logic ────────────────────────────────────────────────────

// 0 = What's New, 1 = Rate us, 2 = Bug / Feature
const currentTickerIndex = ref(0)
// Increments each time the ticker advances — used as :key on the fill span to restart the CSS animation
const tickerCycle = ref(0)
const TICKER_ITEMS = 3
const TICKER_INTERVAL_MS = 4000
// CSS duration string used by v-bind in the scoped style block
const tickerDuration = `${TICKER_INTERVAL_MS}ms`

let tickerTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  tickerTimer = setInterval(() => {
    currentTickerIndex.value = (currentTickerIndex.value + 1) % TICKER_ITEMS
    tickerCycle.value++
  }, TICKER_INTERVAL_MS)
})

onUnmounted(() => {
  if (tickerTimer) clearInterval(tickerTimer)
})

// Review URL depending on browser
const reviewUrl = isFirefox()
  ? 'https://addons.mozilla.org/firefox/addon/power-input/reviews/'
  : 'https://chromewebstore.google.com/detail/power-input/reviews'

// Opens the What's New page in a new tab
function openWhatsNew() {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/whats-new/whats-new.html') })
}

// Opens the store review page
function openReview() {
  chrome.tabs.create({ url: reviewUrl })
}

// Opens the bug / feature request Tally form
function openFeedback() {
  chrome.tabs.create({ url: 'https://tally.so/r/q4ArEg' })
}
</script>

<style scoped>
/* ── Ticker pill base styles ─────────────────────────────────────────────────── */
.ticker-btn {
  cursor: pointer;
  transition: filter 0.15s ease;
}

.ticker-blue {
  background-color: rgb(239 246 255); /* blue-50 */
  color: rgb(37 99 235); /* blue-600 */
  border: 1px solid rgb(191 219 254); /* blue-200 */
}
.dark .ticker-blue {
  background-color: rgb(30 58 138 / 0.3); /* blue-900/30 */
  color: rgb(96 165 250); /* blue-400 */
  border-color: rgb(29 78 216 / 0.7); /* blue-700 */
}
.ticker-blue:hover {
  filter: brightness(0.96);
}

.ticker-yellow {
  background-color: rgb(254 252 232); /* yellow-50 */
  color: rgb(161 98 7); /* yellow-700 */
  border: 1px solid rgb(253 224 71 / 0.7); /* yellow-200 */
}
.dark .ticker-yellow {
  background-color: rgb(113 63 18 / 0.2); /* yellow-900/20 */
  color: rgb(250 204 21); /* yellow-400 */
  border-color: rgb(161 98 7 / 0.7); /* yellow-700 */
}
.ticker-yellow:hover {
  filter: brightness(0.96);
}

.ticker-orange {
  background-color: rgb(255 247 237); /* orange-50 */
  color: rgb(194 65 12); /* orange-700 */
  border: 1px solid rgb(254 215 170 / 0.7); /* orange-200 */
}
.dark .ticker-orange {
  background-color: rgb(124 45 18 / 0.2); /* orange-900/20 */
  color: rgb(251 146 60); /* orange-400 */
  border-color: rgb(194 65 12 / 0.7); /* orange-700 */
}
.ticker-orange:hover {
  filter: brightness(0.96);
}

/* ── Progress fill ────────────────────────────────────────────────────────────
   Absolutely positioned span that grows from 0 → 100% width over TICKER_INTERVAL_MS.
   Sits behind the text (z-index lower than z-10 on content).
   Each color variant uses a slightly darker shade of its pill background.
   The :key binding on the span forces Vue to remount it (restarting the animation)
   every time tickerCycle increments.
─────────────────────────────────────────────────────────────────────────────── */
.ticker-fill {
  position: absolute;
  inset: 0;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0%;
  border-radius: 9999px;
  animation: ticker-grow v-bind(tickerDuration) linear forwards;
  z-index: 0;
}

.ticker-fill-blue {
  background-color: rgb(219 234 254); /* blue-100 */
}
.dark .ticker-fill-blue {
  background-color: rgb(30 64 175 / 0.35); /* blue-800/35 */
}

.ticker-fill-yellow {
  background-color: rgb(254 249 195); /* yellow-100 */
}
.dark .ticker-fill-yellow {
  background-color: rgb(133 77 14 / 0.35); /* yellow-800/35 */
}

.ticker-fill-orange {
  background-color: rgb(255 237 213); /* orange-100 */
}
.dark .ticker-fill-orange {
  background-color: rgb(154 52 18 / 0.35); /* orange-800/35 */
}

@keyframes ticker-grow {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}

/* ── Fade + slight vertical slide for ticker transitions ─────────────────────── */
.ticker-enter-active,
.ticker-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.ticker-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.ticker-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
