<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="w-full max-w-[400px] min-w-[360px] h-auto flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <h1 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
        Simple Input Translator
      </h1>

      <button
        @click="cycleTheme"
        class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Toggle theme"
      >
        <component :is="themeIcon" :size="16" />
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col p-3 space-y-2.5">
      <!-- Source Language -->
      <div>
        <label class="block text-xs font-medium mb-1">Source Language</label>
        <select
          v-model="settings.sourceLang"
          @change="saveSettings"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      </div>

      <!-- Target Language -->
      <div>
        <label class="block text-xs font-medium mb-1">Target Language</label>
        <select
          v-model="settings.targetLang"
          @change="saveSettings"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <label class="block text-xs font-medium mb-1">Translation Provider</label>
        <select
          v-model="settings.provider"
          @change="onProviderChange"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="google">Google Translate (Free)</option>
          <option value="builtin">Chrome Built-in AI (Free)</option>
          <option value="deepl">DeepL API</option>
          <option value="gemini">Google Gemini API</option>
          <option value="chatgpt">ChatGPT (OpenAI)</option>
          <option value="groq">Groq (Free & Fast)</option>
          <option value="ollama">Ollama (Local)</option>
          <option value="openrouter">OpenRouter</option>
          <option value="custom">Custom OpenAI-compatible</option>
        </select>
      </div>

      <!-- DeepL API Key -->
      <div v-if="settings.provider === 'deepl'" class="space-y-1.5">
        <label class="block text-xs font-medium">DeepL API Key</label>
        <input
          type="password"
          v-model="providerConfigs.deepl.apiKey"
          placeholder="Enter API key"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('deepl')"
          :disabled="!providerConfigs.deepl.apiKey || validationStatus.deepl === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.deepl.apiKey || validationStatus.deepl === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.deepl === 'loading' ? 'Validating...' : 'Validate & Save' }}
        </button>
        <p
          v-if="validationMessage.deepl"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.deepl === 'success',
            'text-red-600': validationStatus.deepl === 'error',
          }"
        >
          {{ validationMessage.deepl }}
        </p>
      </div>

      <!-- Gemini Configuration -->
      <div v-if="settings.provider === 'gemini'" class="space-y-1.5">
        <label class="block text-xs font-medium">Gemini API Key</label>
        <input
          type="password"
          v-model="providerConfigs.gemini.apiKey"
          placeholder="Enter API key"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">Model</label>
        <input
          type="text"
          v-model="providerConfigs.gemini.model"
          placeholder="gemini-1.5-flash"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('gemini')"
          :disabled="!providerConfigs.gemini.apiKey || validationStatus.gemini === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.gemini.apiKey || validationStatus.gemini === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.gemini === 'loading' ? 'Validating...' : 'Validate & Save' }}
        </button>
        <p
          v-if="validationMessage.gemini"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.gemini === 'success',
            'text-red-600': validationStatus.gemini === 'error',
          }"
        >
          {{ validationMessage.gemini }}
        </p>
      </div>

      <!-- ChatGPT Configuration -->
      <div v-if="settings.provider === 'chatgpt'" class="space-y-1.5">
        <label class="block text-xs font-medium">OpenAI API Key</label>
        <input
          type="password"
          v-model="providerConfigs.chatgpt.apiKey"
          placeholder="sk-..."
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">Model</label>
        <input
          type="text"
          v-model="providerConfigs.chatgpt.model"
          placeholder="gpt-4o-mini"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('chatgpt')"
          :disabled="!providerConfigs.chatgpt.apiKey || validationStatus.chatgpt === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.chatgpt.apiKey || validationStatus.chatgpt === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.chatgpt === 'loading' ? 'Validating...' : 'Validate & Save' }}
        </button>
        <p
          v-if="validationMessage.chatgpt"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.chatgpt === 'success',
            'text-red-600': validationStatus.chatgpt === 'error',
          }"
        >
          {{ validationMessage.chatgpt }}
        </p>
      </div>

      <!-- Groq Configuration -->
      <div v-if="settings.provider === 'groq'" class="space-y-1.5">
        <label class="block text-xs font-medium">Groq API Key</label>
        <input
          type="password"
          v-model="providerConfigs.groq.apiKey"
          placeholder="gsk_..."
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">Model</label>
        <input
          type="text"
          v-model="providerConfigs.groq.model"
          placeholder="llama-3.3-70b-versatile"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('groq')"
          :disabled="!providerConfigs.groq.apiKey || validationStatus.groq === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.groq.apiKey || validationStatus.groq === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.groq === 'loading' ? 'Validating...' : 'Validate & Save' }}
        </button>
        <p
          v-if="validationMessage.groq"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.groq === 'success',
            'text-red-600': validationStatus.groq === 'error',
          }"
        >
          {{ validationMessage.groq }}
        </p>
      </div>

      <!-- Ollama Configuration -->
      <div v-if="settings.provider === 'ollama'" class="space-y-1.5">
        <label class="block text-xs font-medium">Base URL</label>
        <input
          type="text"
          v-model="providerConfigs.ollama.baseUrl"
          placeholder="http://localhost:11434/v1"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">Model</label>
        <input
          type="text"
          v-model="providerConfigs.ollama.model"
          placeholder="llama3.2"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('ollama')"
          :disabled="!providerConfigs.ollama.model || validationStatus.ollama === 'loading'"
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.ollama.model || validationStatus.ollama === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.ollama === 'loading' ? 'Validating...' : 'Validate & Save' }}
        </button>
        <p
          v-if="validationMessage.ollama"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.ollama === 'success',
            'text-red-600': validationStatus.ollama === 'error',
          }"
        >
          {{ validationMessage.ollama }}
        </p>
      </div>

      <!-- OpenRouter Configuration -->
      <div v-if="settings.provider === 'openrouter'" class="space-y-1.5">
        <label class="block text-xs font-medium">OpenRouter API Key</label>
        <input
          type="password"
          v-model="providerConfigs.openrouter.apiKey"
          placeholder="sk-or-v1-..."
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">Model</label>
        <input
          type="text"
          v-model="providerConfigs.openrouter.model"
          placeholder="meta-llama/llama-3.3-70b-instruct"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('openrouter')"
          :disabled="
            !providerConfigs.openrouter.apiKey || validationStatus.openrouter === 'loading'
          "
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.openrouter.apiKey || validationStatus.openrouter === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.openrouter === 'loading' ? 'Validating...' : 'Validate & Save' }}
        </button>
        <p
          v-if="validationMessage.openrouter"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.openrouter === 'success',
            'text-red-600': validationStatus.openrouter === 'error',
          }"
        >
          {{ validationMessage.openrouter }}
        </p>
      </div>

      <!-- Custom OpenAI-compatible Configuration -->
      <div v-if="settings.provider === 'custom'" class="space-y-1.5">
        <label class="block text-xs font-medium">Base URL</label>
        <input
          type="text"
          v-model="providerConfigs.custom.baseUrl"
          placeholder="https://api.example.com/v1"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">API Key (Optional)</label>
        <input
          type="password"
          v-model="providerConfigs.custom.apiKey"
          placeholder="Optional"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label class="block text-xs font-medium">Model</label>
        <input
          type="text"
          v-model="providerConfigs.custom.model"
          placeholder="model-name"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          @click="validateProviderConfig('custom')"
          :disabled="
            !providerConfigs.custom.baseUrl ||
            !providerConfigs.custom.model ||
            validationStatus.custom === 'loading'
          "
          class="w-full px-2 py-1.5 text-xs rounded transition-colors"
          :class="
            !providerConfigs.custom.baseUrl ||
            !providerConfigs.custom.model ||
            validationStatus.custom === 'loading'
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          "
        >
          {{ validationStatus.custom === 'loading' ? 'Validating...' : 'Validate & Save' }}
        </button>
        <p
          v-if="validationMessage.custom"
          class="text-[10px]"
          :class="{
            'text-green-600': validationStatus.custom === 'success',
            'text-red-600': validationStatus.custom === 'error',
          }"
        >
          {{ validationMessage.custom }}
        </p>
      </div>

      <!-- Keyboard Shortcut -->
      <div>
        <label class="block text-xs font-medium mb-1">Keyboard Shortcut</label>
        <input
          v-model="settings.keyboardShortcut"
          @blur="validateAndSaveShortcut"
          @keydown="handleShortcutInput"
          placeholder="Alt+T"
          class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
        />
        <p v-if="shortcutError" class="text-[10px] text-red-600 mt-0.5">{{ shortcutError }}</p>
      </div>

      <!-- Usage Instructions -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
        <p class="text-[10px] text-gray-600 dark:text-gray-400">
          Select text or focus an input, then press {{ settings.keyboardShortcut }} to translate
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <p class="text-[10px] text-center text-gray-500 dark:text-gray-400">
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
  provider: 'google' as
    | 'google'
    | 'builtin'
    | 'deepl'
    | 'gemini'
    | 'chatgpt'
    | 'groq'
    | 'ollama'
    | 'openrouter'
    | 'custom',
  keyboardShortcut: 'Alt+T',
})

// Provider configurations
const providerConfigs = ref({
  deepl: {
    apiKey: '',
  },
  gemini: {
    apiKey: '',
    model: 'gemini-1.5-flash',
  },
  chatgpt: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  groq: {
    apiKey: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.2',
  },
  openrouter: {
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct',
  },
  custom: {
    baseUrl: '',
    apiKey: '',
    model: '',
  },
})

// Validation status
const validationStatus = ref({
  deepl: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  gemini: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  chatgpt: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  groq: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  ollama: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  openrouter: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  custom: 'idle' as 'idle' | 'loading' | 'success' | 'error',
})

const validationMessage = ref({
  deepl: '',
  gemini: '',
  chatgpt: '',
  groq: '',
  ollama: '',
  openrouter: '',
  custom: '',
})

const shortcutError = ref('')

// Load settings on mount
onMounted(async () => {
  await loadSettings()
  await loadTheme()
  await loadApiKeys()
  // Check if current provider configuration is complete
  checkProviderConfiguration()
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
      // Load DeepL
      if (result.providerKeys.deeplApiKey) {
        providerConfigs.value.deepl.apiKey = result.providerKeys.deeplApiKey
        validationStatus.value.deepl = 'success'
        validationMessage.value.deepl = '✓ API key configured'
      }

      // Load Gemini
      if (result.providerKeys.geminiConfig) {
        providerConfigs.value.gemini.apiKey = result.providerKeys.geminiConfig.apiKey || ''
        providerConfigs.value.gemini.model =
          result.providerKeys.geminiConfig.model || 'gemini-1.5-flash'
        validationStatus.value.gemini = 'success'
        validationMessage.value.gemini = '✓ Configuration loaded'
      }

      // Load ChatGPT
      if (result.providerKeys.chatgptConfig) {
        providerConfigs.value.chatgpt = {
          ...providerConfigs.value.chatgpt,
          ...result.providerKeys.chatgptConfig,
        }
        validationStatus.value.chatgpt = 'success'
        validationMessage.value.chatgpt = '✓ Configuration loaded'
      }

      // Load Groq
      if (result.providerKeys.groqConfig) {
        providerConfigs.value.groq = {
          ...providerConfigs.value.groq,
          ...result.providerKeys.groqConfig,
        }
        validationStatus.value.groq = 'success'
        validationMessage.value.groq = '✓ Configuration loaded'
      }

      // Load Ollama
      if (result.providerKeys.ollamaConfig) {
        providerConfigs.value.ollama = {
          ...providerConfigs.value.ollama,
          ...result.providerKeys.ollamaConfig,
        }
        validationStatus.value.ollama = 'success'
        validationMessage.value.ollama = '✓ Configuration loaded'
      }

      // Load OpenRouter
      if (result.providerKeys.openrouterConfig) {
        providerConfigs.value.openrouter = {
          ...providerConfigs.value.openrouter,
          ...result.providerKeys.openrouterConfig,
        }
        validationStatus.value.openrouter = 'success'
        validationMessage.value.openrouter = '✓ Configuration loaded'
      }

      // Load Custom
      if (result.providerKeys.customConfig) {
        providerConfigs.value.custom = {
          ...providerConfigs.value.custom,
          ...result.providerKeys.customConfig,
        }
        validationStatus.value.custom = 'success'
        validationMessage.value.custom = '✓ Configuration loaded'
      }
    }
  } catch (error) {
    console.error('Failed to load API keys:', error)
  }
}

async function saveProviderConfig(provider: string) {
  try {
    const result = await chrome.storage.local.get('providerKeys')
    const providerKeys = result.providerKeys || {}

    // Save configuration based on provider type
    switch (provider) {
      case 'deepl':
        providerKeys.deeplApiKey = providerConfigs.value.deepl.apiKey
        break
      case 'gemini':
        providerKeys.geminiConfig = {
          apiKey: providerConfigs.value.gemini.apiKey,
          model: providerConfigs.value.gemini.model,
        }
        break
      case 'chatgpt':
        providerKeys.chatgptConfig = providerConfigs.value.chatgpt
        break
      case 'groq':
        providerKeys.groqConfig = providerConfigs.value.groq
        break
      case 'ollama':
        providerKeys.ollamaConfig = providerConfigs.value.ollama
        break
      case 'openrouter':
        providerKeys.openrouterConfig = providerConfigs.value.openrouter
        break
      case 'custom':
        providerKeys.customConfig = providerConfigs.value.custom
        break
    }

    await chrome.storage.local.set({ providerKeys })
    console.log(`${provider} configuration saved`)
  } catch (error) {
    console.error(`Failed to save ${provider} config:`, error)
    throw error
  }
}

async function validateProviderConfig(provider: string) {
  // Reset validation state
  validationStatus.value[provider as keyof typeof validationStatus.value] = 'loading'
  validationMessage.value[provider as keyof typeof validationMessage.value] = ''

  try {
    let response

    switch (provider) {
      case 'deepl':
        if (!providerConfigs.value.deepl.apiKey) return
        response = await chrome.runtime.sendMessage({
          type: 'VALIDATE_DEEPL_KEY',
          apiKey: providerConfigs.value.deepl.apiKey,
        })
        break

      case 'gemini':
        if (!providerConfigs.value.gemini.apiKey) return
        response = await chrome.runtime.sendMessage({
          type: 'VALIDATE_GEMINI_KEY',
          apiKey: providerConfigs.value.gemini.apiKey,
          model: providerConfigs.value.gemini.model,
        })
        break

      case 'chatgpt':
      case 'groq':
      case 'ollama':
      case 'openrouter':
      case 'custom':
        const config = providerConfigs.value[provider as keyof typeof providerConfigs.value]
        response = await chrome.runtime.sendMessage({
          type: 'VALIDATE_OPENAI_COMPATIBLE',
          config: {
            providerType: provider,
            ...config,
          },
        })
        break

      default:
        throw new Error(`Unknown provider: ${provider}`)
    }

    if (response.success) {
      validationStatus.value[provider as keyof typeof validationStatus.value] = 'success'
      validationMessage.value[provider as keyof typeof validationMessage.value] =
        '✓ Configuration valid'
      await saveProviderConfig(provider)
    } else {
      validationStatus.value[provider as keyof typeof validationStatus.value] = 'error'
      validationMessage.value[provider as keyof typeof validationMessage.value] =
        `✗ ${response.error}`
    }
  } catch (_error) {
    validationStatus.value[provider as keyof typeof validationStatus.value] = 'error'
    validationMessage.value[provider as keyof typeof validationMessage.value] =
      '✗ Validation failed'
  }
}

function onProviderChange() {
  saveSettings()

  // Check if the selected provider has the required configuration
  checkProviderConfiguration()
}

/**
 * Check if the current provider has the required configuration
 * Display an alert if API key or required fields are missing
 */
function checkProviderConfiguration() {
  const provider = settings.value.provider

  // Reset all validation messages first
  Object.keys(validationMessage.value).forEach((key) => {
    validationMessage.value[key as keyof typeof validationMessage.value] = ''
    validationStatus.value[key as keyof typeof validationStatus.value] = 'idle'
  })

  // Providers that don't require API keys
  if (provider === 'google' || provider === 'builtin') {
    return
  }

  // Check provider-specific requirements
  switch (provider) {
    case 'deepl':
      if (!providerConfigs.value.deepl.apiKey) {
        validationStatus.value.deepl = 'error'
        validationMessage.value.deepl = '✗ API key required'
      }
      break

    case 'gemini':
      if (!providerConfigs.value.gemini.apiKey) {
        validationStatus.value.gemini = 'error'
        validationMessage.value.gemini = '✗ API key required'
      }
      break

    case 'chatgpt':
      if (!providerConfigs.value.chatgpt.apiKey) {
        validationStatus.value.chatgpt = 'error'
        validationMessage.value.chatgpt = '✗ API key required'
      }
      break

    case 'groq':
      if (!providerConfigs.value.groq.apiKey) {
        validationStatus.value.groq = 'error'
        validationMessage.value.groq = '✗ API key required'
      }
      break

    case 'ollama':
      if (!providerConfigs.value.ollama.model) {
        validationStatus.value.ollama = 'error'
        validationMessage.value.ollama = '✗ Model name required'
      } else if (!providerConfigs.value.ollama.baseUrl) {
        validationStatus.value.ollama = 'error'
        validationMessage.value.ollama = '✗ Base URL required'
      }
      break

    case 'openrouter':
      if (!providerConfigs.value.openrouter.apiKey) {
        validationStatus.value.openrouter = 'error'
        validationMessage.value.openrouter = '✗ API key required'
      }
      break

    case 'custom':
      if (!providerConfigs.value.custom.baseUrl) {
        validationStatus.value.custom = 'error'
        validationMessage.value.custom = '✗ Base URL required'
      } else if (!providerConfigs.value.custom.model) {
        validationStatus.value.custom = 'error'
        validationMessage.value.custom = '✗ Model name required'
      }
      break
  }
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
