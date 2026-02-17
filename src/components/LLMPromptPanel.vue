<template>
  <div class="space-y-1.5">
    <!-- Prompt label + expand button -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1">
        <span class="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
          {{ t('llmPromptLabel') }}
        </span>
        <span :title="t('llmPromptHint')" class="cursor-help leading-none">
          <Info :size="12" class="text-gray-400 dark:text-gray-500" />
        </span>
        <button
          type="button"
          :title="t('expandPrompt')"
          @click="showPromptModal = true"
          class="flex items-center px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-800 transition-colors"
        >
          <Maximize2 :size="10" />
        </button>
      </div>

      <!-- Compact prompt textarea (3 rows) -->
      <textarea
        :value="prompt"
        @input="(e) => emit('update:prompt', (e.target as HTMLTextAreaElement).value)"
        :placeholder="t('llmPromptHint')"
        rows="3"
        class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
      />
    </div>

    <!-- Provider selector -->
    <div class="flex items-center gap-2">
      <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 w-24 shrink-0">
        {{ t('llmPromptProviderLabel') }}
      </label>
      <select
        :value="llmProvider"
        @change="handleProviderChange(($event.target as HTMLSelectElement).value as LLMProvider)"
        class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option v-for="p in LLM_PROVIDERS" :key="p.value" :value="p.value">
          {{ p.label }}
        </option>
      </select>
    </div>

    <!-- Shared provider config: base URL, API key, model selector (same component as global settings) -->
    <ProviderConfigForm
      :provider="llmProvider"
      :config="{
        apiKey: llmApiKeyDraft,
        baseUrl: llmBaseUrlDraft,
        model: llmModelSelection,
        customModel: llmCustomModelInput,
      }"
      @update:config="handleConfigUpdate"
    />

    <!-- Expanded prompt modal — full-height overlay with template selector -->
    <Teleport to="body">
      <div
        v-if="showPromptModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showPromptModal = false"
      >
        <div
          class="w-[360px] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col overflow-hidden"
          style="height: calc(100vh - 24px); max-height: calc(100vh - 24px)"
        >
          <!-- Modal header -->
          <div
            class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0"
          >
            <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {{ t('llmPromptLabel') }}
            </span>
            <button
              type="button"
              @click="showPromptModal = false"
              class="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X :size="14" />
            </button>
          </div>

          <!-- Modal body -->
          <div class="p-3 flex flex-col gap-2 flex-1 overflow-hidden">
            <!-- Template picker — resets to placeholder after selection -->
            <select
              v-model="selectedTemplateId"
              @change="onTemplateSelected"
              class="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500 dark:text-gray-400 shrink-0"
            >
              <option value="" disabled>{{ t('llmPromptTemplatesPlaceholder') }}</option>
              <option v-for="tpl in PROMPT_TEMPLATES" :key="tpl.id" :value="tpl.id">
                {{ tpl.icon }} {{ tpl.name }}
              </option>
            </select>

            <!-- Full-height textarea — ref used for native execCommand (Ctrl+Z support) -->
            <textarea
              ref="modalPromptTextarea"
              :value="prompt"
              @input="(e) => emit('update:prompt', (e.target as HTMLTextAreaElement).value)"
              :placeholder="t('llmPromptPlaceholder')"
              class="w-full flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              autofocus
            />

            <p class="text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
              {{ t('llmPromptHint') }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Info, Maximize2, X } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useSettings, type ProviderConfigs } from '@/composables/useSettings'
import { getLLMProviders } from '@/config/providers'
import { PREDEFINED_MODELS } from '@/config/predefinedModels'
import { PROMPT_TEMPLATES } from '@/config/promptTemplates'
import type { LLMProvider } from '@/types/common'
import ProviderConfigForm from './ProviderConfigForm.vue'

const { t } = useI18nWrapper()
const { providerConfigs } = useSettings()

const LLM_PROVIDERS = getLLMProviders()

defineProps<{
  prompt: string
  llmProvider: LLMProvider
  llmModelSelection: string
  llmCustomModelInput: string
  llmApiKeyDraft: string
  llmBaseUrlDraft: string
}>()

const emit = defineEmits<{
  'update:prompt': [value: string]
  'update:llmProvider': [value: LLMProvider]
  'update:llmModelSelection': [value: string]
  'update:llmCustomModelInput': [value: string]
  'update:llmApiKeyDraft': [value: string]
  'update:llmBaseUrlDraft': [value: string]
  /**
   * Fired when the user changes provider.
   * Carries the full cascade so parent can update all LLM-related refs atomically.
   */
  'provider-change': [
    provider: LLMProvider,
    modelSelection: string,
    customModelInput: string,
    apiKeyDraft: string,
    baseUrlDraft: string,
  ]
}>()

// Modal and template picker state — entirely local to this panel
const showPromptModal = ref(false)
const selectedTemplateId = ref('')
const modalPromptTextarea = ref<HTMLTextAreaElement | null>(null)

/**
 * Maps ProviderConfigForm's unified update:config emit back to the individual
 * LLMPromptPanel emits so the parent's state stays in sync.
 */
function handleConfigUpdate(partial: Partial<{ apiKey: string; baseUrl: string; model: string; customModel: string }>) {
  if (partial.apiKey !== undefined) emit('update:llmApiKeyDraft', partial.apiKey)
  if (partial.baseUrl !== undefined) emit('update:llmBaseUrlDraft', partial.baseUrl)
  if (partial.model !== undefined) emit('update:llmModelSelection', partial.model)
  if (partial.customModel !== undefined) emit('update:llmCustomModelInput', partial.customModel)
}

/**
 * Called when the user picks a different LLM provider from the dropdown.
 * Emits update:llmProvider plus provider-change with all cascade values so the
 * parent can atomically reset model selection and credential drafts.
 */
function handleProviderChange(newProvider: LLMProvider) {
  emit('update:llmProvider', newProvider)

  // Compute the default model for the new provider
  const models =
    (PREDEFINED_MODELS as Record<string, { value: string; isCustom?: boolean }[]>)[newProvider] ||
    []
  // Prefer first non-custom model; fall back to first entry (e.g. 'custom' for Ollama)
  const defaultModel = models.find((m) => !m.isCustom)?.value || models[0]?.value || ''

  // Read current stored credentials for the new provider from global config
  const cfg = providerConfigs.value[newProvider as keyof ProviderConfigs] as
    | { apiKey?: string; baseUrl?: string }
    | undefined

  emit('provider-change', newProvider, defaultModel, '', cfg?.apiKey ?? '', cfg?.baseUrl ?? '')
}

/**
 * Called on template selector @change.
 * Applies the selected template then resets the dropdown to its placeholder.
 */
function onTemplateSelected() {
  const id = selectedTemplateId.value
  applyPromptTemplate(id)
  // Reset after Vue processes the current render cycle so the placeholder is shown
  nextTick(() => {
    selectedTemplateId.value = ''
  })
}

/**
 * Inserts the template text into the modal textarea using execCommand('insertText')
 * so the browser registers the change in its native undo stack — Ctrl+Z restores
 * the previous prompt. Vue v-model syncs automatically via the fired 'input' event.
 * Falls back to a direct emit when execCommand is unavailable.
 */
function applyPromptTemplate(templateId: string) {
  if (!templateId) return
  const template = PROMPT_TEMPLATES.find((tpl) => tpl.id === templateId)
  if (!template) return

  const textarea = modalPromptTextarea.value
  if (textarea) {
    textarea.focus()
    textarea.select()
    // execCommand is deprecated but universally supported; pushes to native undo stack
    const success = document.execCommand('insertText', false, template.prompt)
    if (!success) {
      emit('update:prompt', template.prompt)
    }
  } else {
    emit('update:prompt', template.prompt)
  }
}
</script>
