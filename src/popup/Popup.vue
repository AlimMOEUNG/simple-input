<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="w-full max-w-[400px] min-w-[360px] h-auto flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Simple Input Translator
      </h1>

      <button
        @click="cycleTheme"
        class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Toggle theme"
      >
        <component :is="themeIcon" :size="18" />
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col p-4 space-y-4">
      <!-- Source Language -->
      <div>
        <label class="block text-sm font-medium mb-2">Source Language</label>
        <select
          v-model="settings.sourceLang"
          @change="saveSettings"
          class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="auto">Auto-detect</option>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="nl">Dutch</option>
          <option value="pl">Polish</option>
          <option value="ru">Russian</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
        </select>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Select "Auto-detect" to let the provider detect the source language
        </p>
      </div>

      <!-- Target Language -->
      <div>
        <label class="block text-sm font-medium mb-2">Target Language</label>
        <select
          v-model="settings.targetLang"
          @change="saveSettings"
          class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="nl">Dutch</option>
          <option value="pl">Polish</option>
          <option value="ru">Russian</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
        </select>
      </div>

      <!-- Provider -->
      <div>
        <label class="block text-sm font-medium mb-2">Translation Provider</label>
        <select
          v-model="settings.provider"
          @change="onProviderChange"
          class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="builtin">Chrome Built-in AI (Free)</option>
          <option value="deepl">DeepL API</option>
          <option value="gemini">Google Gemini API</option>
        </select>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span v-if="settings.provider === 'builtin'">Requires Chrome 143+</span>
          <span v-else>Requires API key</span>
        </p>
      </div>

      <!-- DeepL API Key -->
      <div v-if="settings.provider === 'deepl'" class="space-y-2">
        <label class="block text-sm font-medium">DeepL API Key</label>
        <input
          type="password"
          v-model="apiKeys.deeplApiKey"
          placeholder="Enter your DeepL API key"
          class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="flex gap-2">
          <button
            @click="validateDeepLKey"
            :disabled="!apiKeys.deeplApiKey || validationStatus.deepl === 'loading'"
            class="flex-1 px-3 py-1.5 text-sm rounded transition-colors"
            :class="
              !apiKeys.deeplApiKey || validationStatus.deepl === 'loading'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{ validationStatus.deepl === 'loading' ? 'Validating...' : 'Validate & Save' }}
          </button>
        </div>
        <p
          v-if="validationMessage.deepl"
          class="text-xs"
          :class="{
            'text-green-600': validationStatus.deepl === 'success',
            'text-red-600': validationStatus.deepl === 'error',
          }"
        >
          {{ validationMessage.deepl }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Get your API key at
          <a
            href="https://www.deepl.com/pro-api"
            target="_blank"
            class="text-blue-600 hover:underline"
            >deepl.com/pro-api</a
          >
        </p>
      </div>

      <!-- Gemini API Key -->
      <div v-if="settings.provider === 'gemini'" class="space-y-2">
        <label class="block text-sm font-medium">Gemini API Key</label>
        <input
          type="password"
          v-model="apiKeys.geminiApiKey"
          placeholder="Enter your Gemini API key"
          class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="flex gap-2">
          <button
            @click="validateGeminiKey"
            :disabled="!apiKeys.geminiApiKey || validationStatus.gemini === 'loading'"
            class="flex-1 px-3 py-1.5 text-sm rounded transition-colors"
            :class="
              !apiKeys.geminiApiKey || validationStatus.gemini === 'loading'
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{ validationStatus.gemini === 'loading' ? 'Validating...' : 'Validate & Save' }}
          </button>
        </div>
        <p
          v-if="validationMessage.gemini"
          class="text-xs"
          :class="{
            'text-green-600': validationStatus.gemini === 'success',
            'text-red-600': validationStatus.gemini === 'error',
          }"
        >
          {{ validationMessage.gemini }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Get your API key at
          <a href="https://ai.google.dev" target="_blank" class="text-blue-600 hover:underline"
            >ai.google.dev</a
          >
        </p>
      </div>

      <!-- Keyboard Shortcut -->
      <div>
        <label class="block text-sm font-medium mb-2">Keyboard Shortcut</label>
        <input
          v-model="settings.keyboardShortcut"
          @blur="validateAndSaveShortcut"
          @keydown="handleShortcutInput"
          placeholder="Alt+T"
          class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Press the desired keyboard combination (e.g., Alt+T, Ctrl+Shift+T)
        </p>
        <p v-if="shortcutError" class="text-xs text-red-600 mt-1">{{ shortcutError }}</p>
      </div>

      <!-- Usage Instructions -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 class="text-sm font-semibold mb-2">How to use:</h3>
        <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li>Select text and press {{ settings.keyboardShortcut }} to translate it</li>
          <li>
            Focus on an input field and press {{ settings.keyboardShortcut }} to translate the
            content
          </li>
          <li>Works on any website!</li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <p class="text-xs text-center text-gray-500 dark:text-gray-400">
        Simple Input Translator • Built with Vue 3
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'

// Theme management
type Theme = 'auto' | 'light' | 'dark'
const currentTheme = ref<Theme>('auto')

const themeIcon = computed(() => {
  switch (currentTheme.value) {
    case 'light':
      return Sun
    case 'dark':
      return Moon
    default:
      return Monitor
  }
})

// Settings
const settings = ref({
  sourceLang: 'auto',
  targetLang: 'en',
  provider: 'builtin' as 'builtin' | 'deepl' | 'gemini',
  keyboardShortcut: 'Alt+T',
})

// API Keys
const apiKeys = ref({
  deeplApiKey: '',
  geminiApiKey: '',
})

// Validation status
const validationStatus = ref({
  deepl: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  gemini: 'idle' as 'idle' | 'loading' | 'success' | 'error',
})

const validationMessage = ref({
  deepl: '',
  gemini: '',
})

const shortcutError = ref('')

// Load settings on mount
onMounted(async () => {
  await loadSettings()
  await loadTheme()
  await loadApiKeys()
})

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('settings')
    if (result.settings) {
      settings.value = { ...settings.value, ...result.settings }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

async function saveSettings() {
  try {
    await chrome.storage.sync.set({ settings: settings.value })
    console.log('Settings saved')
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

async function loadApiKeys() {
  try {
    const result = await chrome.storage.local.get('providerKeys')
    if (result.providerKeys) {
      apiKeys.value.deeplApiKey = result.providerKeys.deeplApiKey || ''
      apiKeys.value.geminiApiKey = result.providerKeys.geminiApiKey || ''

      // Show success message if keys exist
      if (apiKeys.value.deeplApiKey) {
        validationStatus.value.deepl = 'success'
        validationMessage.value.deepl = '✓ API key configured'
      }
      if (apiKeys.value.geminiApiKey) {
        validationStatus.value.gemini = 'success'
        validationMessage.value.gemini = '✓ API key configured'
      }
    }
  } catch (error) {
    console.error('Failed to load API keys:', error)
  }
}

async function saveApiKeys() {
  try {
    await chrome.storage.local.set({ providerKeys: apiKeys.value })
  } catch (error) {
    console.error('Failed to save API keys:', error)
  }
}

async function validateDeepLKey() {
  if (!apiKeys.value.deeplApiKey) return

  validationStatus.value.deepl = 'loading'
  validationMessage.value.deepl = ''

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'VALIDATE_DEEPL_KEY',
      apiKey: apiKeys.value.deeplApiKey,
    })

    if (response.success) {
      validationStatus.value.deepl = 'success'
      validationMessage.value.deepl = '✓ Valid API key'
      await saveApiKeys()
    } else {
      validationStatus.value.deepl = 'error'
      validationMessage.value.deepl = `✗ ${response.error}`
    }
  } catch (_error) {
    validationStatus.value.deepl = 'error'
    validationMessage.value.deepl = '✗ Validation failed'
  }
}

async function validateGeminiKey() {
  if (!apiKeys.value.geminiApiKey) return

  validationStatus.value.gemini = 'loading'
  validationMessage.value.gemini = ''

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'VALIDATE_GEMINI_KEY',
      apiKey: apiKeys.value.geminiApiKey,
    })

    if (response.success) {
      validationStatus.value.gemini = 'success'
      validationMessage.value.gemini = '✓ Valid API key'
      await saveApiKeys()
    } else {
      validationStatus.value.gemini = 'error'
      validationMessage.value.gemini = `✗ ${response.error}`
    }
  } catch (error) {
    validationStatus.value.gemini = 'error'
    validationMessage.value.gemini = '✗ Validation failed'
  }
}

function onProviderChange() {
  saveSettings()
  // Reset validation messages when switching providers
  validationMessage.value.deepl = ''
  validationMessage.value.gemini = ''
}

function handleShortcutInput(event: KeyboardEvent) {
  if (event.key === 'Backspace' || event.key === 'Delete') {
    return
  }

  event.preventDefault()

  const parts: string[] = []
  if (event.ctrlKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (event.metaKey) parts.push('Meta')

  const key = event.key
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    parts.push(key.toUpperCase())
  }

  if (parts.length > 1) {
    settings.value.keyboardShortcut = parts.join('+')
    validateAndSaveShortcut()
  }
}

function validateAndSaveShortcut() {
  const shortcut = settings.value.keyboardShortcut.trim()

  const validPattern = /^(Ctrl|Alt|Shift|Meta)(\+(Ctrl|Alt|Shift|Meta))*\+[A-Z0-9]$/i

  if (!validPattern.test(shortcut)) {
    shortcutError.value = 'Invalid shortcut format. Use modifiers + key (e.g., Alt+T)'
    return
  }

  shortcutError.value = ''
  saveSettings()
}

// Theme functions
function cycleTheme() {
  const themes: Theme[] = ['auto', 'light', 'dark']
  const currentIndex = themes.indexOf(currentTheme.value)
  currentTheme.value = themes[(currentIndex + 1) % themes.length]
  applyTheme(currentTheme.value)
  saveTheme(currentTheme.value)
}

function applyTheme(theme: Theme) {
  const html = document.documentElement

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.toggle('dark', prefersDark)
  } else {
    html.classList.toggle('dark', theme === 'dark')
  }
}

function saveTheme(theme: Theme) {
  chrome.storage.sync.set({ themeMode: theme })
}

async function loadTheme() {
  const result = await chrome.storage.sync.get('themeMode')
  if (result.themeMode) {
    currentTheme.value = result.themeMode
  }
  applyTheme(currentTheme.value)

  // Watch for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme.value === 'auto') {
      applyTheme('auto')
    }
  })
}
</script>

<style scoped>
/* No additional styles needed - using Tailwind classes */
</style>
