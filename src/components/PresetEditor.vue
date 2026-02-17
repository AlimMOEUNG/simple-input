<template>
  <div class="preset-editor space-y-2 relative">
    <!-- Preset name input + inline save / undo buttons -->
    <div class="flex gap-1 items-center">
      <input
        v-model="localPreset.name"
        :placeholder="t('presetNamePlaceholder')"
        class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <template v-if="hasUnsavedChanges">
        <button
          @click="undoChanges"
          :disabled="isSaving"
          class="px-2 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="t('undoChanges')"
        >
          <RotateCcw :size="12" />
        </button>
        <button
          @click="savePreset"
          :disabled="isSaving"
          class="px-2 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="t('saveChanges')"
        >
          <Check v-if="!isSaving" :size="12" />
          <span v-else class="text-[10px]">...</span>
        </button>
      </template>
    </div>

    <!-- Mode selector (always visible) -->
    <div class="flex items-center gap-2 pt-1">
      <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {{ t('presetModeLabel') }}
      </label>
      <select
        :value="localPreset.type"
        @change="
          (e) => {
            const value = (e.target as HTMLSelectElement).value
            if (isValidPresetType(value)) handleModeChange(value)
          }
        "
        class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option v-for="mode in PRESET_MODES" :key="mode.type" :value="mode.type">
          {{ t(mode.i18nKey) }}
        </option>
      </select>
    </div>

    <!-- Mode-specific panel (delegated to extracted components) -->
    <div class="space-y-1.5">
      <!-- Translation panel -->
      <TranslationPanel
        v-if="localPreset.type === 'translation'"
        :sourceLang="localPreset.sourceLang"
        @update:sourceLang="localPreset.sourceLang = $event"
        :targetLang="localPreset.targetLang"
        @update:targetLang="localPreset.targetLang = $event"
        :useCustomProvider="localPreset.useCustomProvider ?? false"
        @update:useCustomProvider="localPreset.useCustomProvider = $event"
        :customProvider="localPreset.customProvider ?? ''"
        @update:customProvider="localPreset.customProvider = $event as TranslationProvider"
        :presetConfig="presetConfig"
        @update:presetConfig="presetConfig = $event"
        @provider-change="onTranslationProviderChange"
      />

      <!-- Transformation panel -->
      <TransformationPanel
        v-else-if="localPreset.type === 'transformation'"
        :transformationStyle="localPreset.transformationStyle"
        @update:transformationStyle="localPreset.transformationStyle = $event as TransformationStyle"
        :customExampleText="customExampleText"
        @update:customExampleText="customExampleText = $event"
      />

      <!-- Custom transform panel -->
      <CustomTransformPanel
        v-else-if="localPreset.type === 'custom-transform'"
        :customTransformId="localPreset.customTransformId"
        @update:customTransformId="localPreset.customTransformId = $event"
        :customExampleText="customExampleText"
        @update:customExampleText="customExampleText = $event"
      />

      <!-- LLM prompt panel -->
      <LLMPromptPanel
        v-else-if="localPreset.type === 'llm-prompt'"
        :prompt="localPreset.prompt"
        @update:prompt="localPreset.prompt = $event"
        :llmProvider="localPreset.llmProvider"
        @update:llmProvider="localPreset.llmProvider = $event"
        :llmModelSelection="llmModelSelection"
        @update:llmModelSelection="llmModelSelection = $event"
        :llmCustomModelInput="llmCustomModelInput"
        @update:llmCustomModelInput="llmCustomModelInput = $event"
        :llmApiKeyDraft="llmApiKeyDraft"
        @update:llmApiKeyDraft="llmApiKeyDraft = $event"
        :llmBaseUrlDraft="llmBaseUrlDraft"
        @update:llmBaseUrlDraft="llmBaseUrlDraft = $event"
        @provider-change="onLLMProviderChange"
      />
    </div>

    <!-- Keyboard shortcut -->
    <div class="pt-1">
      <div class="flex items-center gap-2">
        <label class="text-[10px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
          {{ t('keyboardShortcut') }}
        </label>
        <input
          v-model="localPreset.keyboardShortcut"
          @keydown="handleShortcutInput"
          @keyup="handleShortcutKeyUp"
          placeholder="Ctrl+Alt+T, Ctrl+Alt+2"
          class="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
        />
        <div class="relative group">
          <Info :size="14" class="text-gray-400 dark:text-gray-500 cursor-help" />
          <div class="absolute bottom-full right-0 mb-1 hidden group-hover:block z-10 w-56">
            <div class="bg-gray-900 dark:bg-gray-700 text-white text-[10px] p-2 rounded shadow-lg">
              {{ t('shortcutHelp') }}
            </div>
          </div>
        </div>
      </div>
      <p v-if="shortcutError" class="text-[10px] text-red-600 mt-0.5">
        {{ shortcutError }}
      </p>

      <!-- Pinned preset checkbox (disabled when already pinned) -->
      <div class="flex items-center gap-2 mt-1">
        <input
          type="checkbox"
          :id="`pinned-preset-${localPreset.id}`"
          :checked="isPinned"
          :disabled="isPinned"
          @change="handlePinChange"
          class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <label
          :for="`pinned-preset-${localPreset.id}`"
          class="text-[10px] text-gray-600 dark:text-gray-400"
          :class="isPinned ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'"
        >
          {{ t('pinnedPresetLabel') }}
        </label>
      </div>
    </div>

    <!-- Unsaved changes banner -->
    <div
      v-if="hasUnsavedChanges"
      class="flex items-center justify-between gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded"
    >
      <span class="text-[10px] text-yellow-800 dark:text-yellow-200">
        {{ t('unsavedChanges') }}
      </span>
      <div class="flex gap-2">
        <button
          @click="undoChanges"
          :disabled="isSaving"
          class="px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ t('undo') }}
        </button>
        <button
          @click="savePreset"
          :disabled="isSaving"
          class="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSaving ? '...' : t('saveChanges') }}
        </button>
      </div>
    </div>

    <!-- Delete button -->
    <button
      v-if="canDelete"
      @click="showDeleteDialog = true"
      class="w-full px-2 py-1.5 text-xs rounded bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
    >
      {{ t('deletePreset') }}
    </button>

    <!-- Delete confirmation dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :title="t('presetDeleteTitle')"
      :message="t('presetDeleteMessage', { params: { name: localPreset.name } })"
      :confirm-text="t('deletePreset')"
      :cancel-text="t('cancel')"
      variant="danger"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteDialog = false"
    />

    <!-- Validation error dialog -->
    <ConfirmDialog
      :show="showValidationDialog"
      :title="validationDialogTitle"
      :message="validationDialogMessage"
      :confirm-text="t('ok') || 'OK'"
      :cancel-text="t('cancel')"
      variant="warning"
      @confirm="showValidationDialog = false"
      @cancel="showValidationDialog = false"
    />

    <!-- Locked overlay (Pro feature gate) -->
    <div
      v-if="isPresetLocked(presetIndex)"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/90 dark:bg-gray-900/90 rounded-lg backdrop-blur-sm"
    >
      <Lock :size="20" class="text-amber-500" />
      <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center px-4">
        {{ t('presetLockedMessage') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Check, RotateCcw, Info, Lock } from 'lucide-vue-next'
import { useI18nWrapper } from '@/composables/useI18nWrapper'
import { useDraftPreset, type DraftPresetState } from '@/composables/useDraftPreset'
import { usePro } from '@/composables/usePro'
import { useSettings, type ProviderConfigs } from '@/composables/useSettings'
import {
  buildShortcutFromEvent,
  normalizeShortcut,
  KeyboardSequenceDetector,
} from '@/core/utils/keyboardUtils'
import type {
  Preset,
  TranslationProvider,
  LLMProvider,
  LLMPromptPreset,
  TransformationStyle,
  PresetProviderConfig,
} from '@/types/common'
import { getEffectiveModel, isCustomModel, getDefaultModel, PREDEFINED_MODELS } from '@/config/predefinedModels'
import { getProviderConfig } from '@/config/providers'
import { validateProviderCredentials } from '@/utils/providerValidation'
import ConfirmDialog from './ConfirmDialog.vue'
import TranslationPanel from './TranslationPanel.vue'
import TransformationPanel from './TransformationPanel.vue'
import CustomTransformPanel from './CustomTransformPanel.vue'
import LLMPromptPanel from './LLMPromptPanel.vue'

const { t } = useI18nWrapper()
const { providerConfigs } = useSettings()
const { loadDraft, saveDraft, clearDraft } = useDraftPreset()

// Debounce timer for draft auto-save
let draftSaveTimer: ReturnType<typeof setTimeout> | null = null

// In-memory mirror of the persisted draft (no async flash on preset-switch)
const memoryCachedDraft = ref<DraftPresetState | null>(null)

// Sequence detector for multi-key shortcut capture
const sequenceDetector = new KeyboardSequenceDetector()

// Mode definitions driving the mode selector
const PRESET_MODES = [
  { type: 'translation' as const, i18nKey: 'presetModeTranslator' as const },
  { type: 'transformation' as const, i18nKey: 'presetModeTransformer' as const },
  { type: 'custom-transform' as const, i18nKey: 'presetModeCustomTransform' as const },
  { type: 'llm-prompt' as const, i18nKey: 'presetModeLLMPrompt' as const },
] as const

// Maps global TranslationProvider to LLMProvider when both share the same key
const PROVIDER_TO_LLM: Record<string, string> = {
  gemini: 'gemini',
  chatgpt: 'chatgpt',
  groq: 'groq',
  ollama: 'ollama',
  openrouter: 'openrouter',
  custom: 'custom',
}

interface Props {
  preset: Preset
  allPresets: Preset[]
  canDelete: boolean
  globalProvider?: TranslationProvider
  isPinned?: boolean
  /** Index of this preset in the array — used for the Pro feature lock check */
  presetIndex: number
}

const props = defineProps<Props>()
const { isPresetLocked } = usePro()

const emit = defineEmits<{
  'update-preset': [preset: Preset]
  'delete-preset': [id: string]
  'set-pinned': [id: string]
}>()

// ─── Local editor state ──────────────────────────────────────────

const localPreset = ref<Preset>({ ...props.preset })
const shortcutError = ref('')
const showDeleteDialog = ref(false)
const showValidationDialog = ref(false)
const isSaving = ref(false)
const validationDialogTitle = ref('')
const validationDialogMessage = ref('')

// Shared preview example text used by TransformationPanel and CustomTransformPanel
const customExampleText = ref('Type to preview...')

// Per-preset custom provider config (translation mode only)
const presetConfig = ref<PresetProviderConfig>({})

// LLM model selection state — separate from localPreset.llmModel (which stores the resolved value)
const llmModelSelection = ref('')
const llmCustomModelInput = ref('')

// Drafts for global provider credentials — written to providerConfigs only on save
const llmApiKeyDraft = ref('')
const llmBaseUrlDraft = ref('')

// ─── LLM model helpers ────────────────────────────────────────────

/**
 * Initialise llmModelSelection / llmCustomModelInput from a stored (resolved) model name.
 */
function initLLMModelState(provider: LLMProvider, storedModel: string) {
  const models =
    (PREDEFINED_MODELS as Record<string, { value: string; isCustom?: boolean }[]>)[provider] || []
  const predefinedValues = models.filter((m) => !m.isCustom).map((m) => m.value)

  if (predefinedValues.length === 0) {
    llmModelSelection.value = storedModel
    llmCustomModelInput.value = ''
  } else if (predefinedValues.includes(storedModel)) {
    llmModelSelection.value = storedModel
    llmCustomModelInput.value = ''
  } else {
    llmModelSelection.value = 'custom'
    llmCustomModelInput.value = storedModel
  }
}

/**
 * Initialise llmApiKeyDraft / llmBaseUrlDraft from the saved global providerConfigs.
 */
function initLLMCredentialDrafts(provider: LLMProvider) {
  const cfg = providerConfigs.value[provider as keyof ProviderConfigs] as
    | { apiKey?: string; baseUrl?: string }
    | undefined
  llmApiKeyDraft.value = cfg?.apiKey ?? ''
  llmBaseUrlDraft.value = cfg?.baseUrl ?? ''
}

// ─── Panel event handlers ─────────────────────────────────────────

/**
 * Called when TranslationPanel fires provider-change.
 * Resets presetConfig to the new provider's defaults (no credential carry-over).
 */
function onTranslationProviderChange(_newProvider: string, defaultConfig: PresetProviderConfig) {
  presetConfig.value = defaultConfig
}

/**
 * Called when LLMPromptPanel fires provider-change.
 * Updates all LLM-related refs atomically so draft-save and dirty-check stay consistent.
 */
function onLLMProviderChange(
  _provider: LLMProvider,
  modelSelection: string,
  customModelInput: string,
  apiKeyDraft: string,
  baseUrlDraft: string
) {
  llmModelSelection.value = modelSelection
  llmCustomModelInput.value = customModelInput
  llmApiKeyDraft.value = apiKeyDraft
  llmBaseUrlDraft.value = baseUrlDraft
}

// ─── Draft persistence ────────────────────────────────────────────

function scheduleDraftSave() {
  if (draftSaveTimer) clearTimeout(draftSaveTimer)
  draftSaveTimer = setTimeout(async () => {
    if (!hasUnsavedChanges.value) return
    const state: DraftPresetState = {
      presetId: props.preset.id,
      localPreset: JSON.parse(JSON.stringify(localPreset.value)),
      presetConfig: { ...presetConfig.value },
      llmModelSelection: llmModelSelection.value,
      llmCustomModelInput: llmCustomModelInput.value,
      llmApiKeyDraft: llmApiKeyDraft.value,
      llmBaseUrlDraft: llmBaseUrlDraft.value,
      customExampleText: customExampleText.value,
      savedAt: Date.now(),
    }
    memoryCachedDraft.value = state
    await saveDraft(state)
  }, 400)
}

function applyDraft(draft: DraftPresetState) {
  localPreset.value = draft.localPreset
  if (draft.localPreset.type === 'translation') {
    presetConfig.value = draft.presetConfig || {}
  }
  if (draft.localPreset.type === 'llm-prompt') {
    llmModelSelection.value = draft.llmModelSelection || ''
    llmCustomModelInput.value = draft.llmCustomModelInput || ''
    if (draft.llmApiKeyDraft !== undefined) llmApiKeyDraft.value = draft.llmApiKeyDraft
    if (draft.llmBaseUrlDraft !== undefined) llmBaseUrlDraft.value = draft.llmBaseUrlDraft
  }
  if (
    draft.localPreset.type === 'transformation' ||
    draft.localPreset.type === 'custom-transform'
  ) {
    if (draft.customExampleText) customExampleText.value = draft.customExampleText
  }
}

async function restoreDraftIfValid() {
  try {
    const draft = await loadDraft()
    if (!draft) return
    if (draft.presetId !== props.preset.id) return
    if (!draft.localPreset || typeof draft.localPreset.type !== 'string') {
      await clearDraft()
      return
    }
    memoryCachedDraft.value = draft
    applyDraft(draft)
  } catch (e) {
    console.error('[PresetEditor] Failed to restore draft:', e)
  }
}

function restoreDraftFromCache(presetId: string) {
  const draft = memoryCachedDraft.value
  if (!draft || draft.presetId !== presetId) return
  if (!draft.localPreset || typeof draft.localPreset.type !== 'string') {
    memoryCachedDraft.value = null
    clearDraft().catch((e) =>
      console.error('[PresetEditor] Failed to clear invalid cached draft:', e)
    )
    return
  }
  applyDraft(draft)
}

// ─── Lifecycle ────────────────────────────────────────────────────

onMounted(async () => {
  if (localPreset.value.type === 'translation' && localPreset.value.customProviderConfig) {
    presetConfig.value = { ...localPreset.value.customProviderConfig }
  }
  if (localPreset.value.type === 'llm-prompt') {
    const llmPreset = localPreset.value as LLMPromptPreset
    initLLMModelState(llmPreset.llmProvider, llmPreset.llmModel)
    initLLMCredentialDrafts(llmPreset.llmProvider)
  }
  await restoreDraftIfValid()
})

// ─── Computed ─────────────────────────────────────────────────────

// Resolved model name (never 'custom') — used for save and dirty-check
const resolvedLLMModel = computed(() =>
  isCustomModel(llmModelSelection.value) ? llmCustomModelInput.value : llmModelSelection.value
)

// Originals computed from global providerConfigs — never go stale like refs would
const llmApiKeyOriginal = computed(() => {
  if (localPreset.value.type !== 'llm-prompt') return ''
  const provider = (localPreset.value as LLMPromptPreset).llmProvider
  const cfg = providerConfigs.value[provider as keyof ProviderConfigs] as { apiKey?: string }
  return cfg?.apiKey ?? ''
})
const llmBaseUrlOriginal = computed(() => {
  if (localPreset.value.type !== 'llm-prompt') return ''
  const provider = (localPreset.value as LLMPromptPreset).llmProvider
  const cfg = providerConfigs.value[provider as keyof ProviderConfigs] as { baseUrl?: string }
  return cfg?.baseUrl ?? ''
})

// Per-type dirty check
const hasUnsavedChanges = computed(() => {
  if (localPreset.value.type !== props.preset.type) return true

  if (localPreset.value.type === 'translation' && props.preset.type === 'translation') {
    const baseChanged =
      localPreset.value.name !== props.preset.name ||
      localPreset.value.sourceLang !== props.preset.sourceLang ||
      localPreset.value.targetLang !== props.preset.targetLang ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut ||
      localPreset.value.useCustomProvider !== props.preset.useCustomProvider ||
      localPreset.value.customProvider !== props.preset.customProvider
    if (baseChanged) return true
    if (localPreset.value.useCustomProvider && localPreset.value.customProvider) {
      return (
        JSON.stringify(presetConfig.value) !==
        JSON.stringify(props.preset.customProviderConfig || {})
      )
    }
    return false
  }

  if (localPreset.value.type === 'transformation' && props.preset.type === 'transformation') {
    return (
      localPreset.value.name !== props.preset.name ||
      localPreset.value.transformationStyle !== props.preset.transformationStyle ||
      localPreset.value.exampleText !== props.preset.exampleText ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut
    )
  }

  if (
    localPreset.value.type === 'custom-transform' &&
    props.preset.type === 'custom-transform'
  ) {
    return (
      localPreset.value.name !== props.preset.name ||
      localPreset.value.customTransformId !== props.preset.customTransformId ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut
    )
  }

  if (localPreset.value.type === 'llm-prompt' && props.preset.type === 'llm-prompt') {
    return (
      localPreset.value.name !== props.preset.name ||
      localPreset.value.prompt !== props.preset.prompt ||
      localPreset.value.llmProvider !== props.preset.llmProvider ||
      resolvedLLMModel.value !== props.preset.llmModel ||
      localPreset.value.keyboardShortcut !== props.preset.keyboardShortcut ||
      llmApiKeyDraft.value !== llmApiKeyOriginal.value ||
      llmBaseUrlDraft.value !== llmBaseUrlOriginal.value
    )
  }

  return true
})

// ─── Watchers ─────────────────────────────────────────────────────

watch(localPreset, scheduleDraftSave, { deep: true })
watch(presetConfig, scheduleDraftSave, { deep: true })
watch(llmModelSelection, scheduleDraftSave)
watch(llmCustomModelInput, scheduleDraftSave)
watch(customExampleText, scheduleDraftSave)
watch(llmApiKeyDraft, scheduleDraftSave)
watch(llmBaseUrlDraft, scheduleDraftSave)

// Sync local state when parent switches the active preset tab
watch(
  () => props.preset,
  (newPreset) => {
    localPreset.value = { ...newPreset }
    shortcutError.value = ''
    if (newPreset.type === 'transformation' && newPreset.exampleText) {
      customExampleText.value = newPreset.exampleText
    }
    if (newPreset.type === 'translation' && newPreset.customProviderConfig) {
      presetConfig.value = { ...newPreset.customProviderConfig }
    } else {
      presetConfig.value = {}
    }
    if (newPreset.type === 'llm-prompt') {
      const llmPreset = newPreset as LLMPromptPreset
      initLLMModelState(llmPreset.llmProvider, llmPreset.llmModel)
      initLLMCredentialDrafts(llmPreset.llmProvider)
    } else {
      llmModelSelection.value = ''
      llmCustomModelInput.value = ''
    }
    restoreDraftFromCache(newPreset.id)
  },
  { deep: true }
)

// ─── Mode switching ──────────────────────────────────────────────

function isValidPresetType(
  value: unknown
): value is 'translation' | 'transformation' | 'custom-transform' | 'llm-prompt' {
  return ['translation', 'transformation', 'custom-transform', 'llm-prompt'].includes(
    value as string
  )
}

function handleModeChange(
  newType: 'translation' | 'transformation' | 'custom-transform' | 'llm-prompt'
) {
  const base = {
    id: localPreset.value.id,
    name: localPreset.value.name,
    keyboardShortcut: localPreset.value.keyboardShortcut,
    createdAt: localPreset.value.createdAt,
  }

  switch (newType) {
    case 'translation':
      localPreset.value = { ...base, type: 'translation', sourceLang: 'auto', targetLang: 'en' }
      break
    case 'transformation':
      localPreset.value = {
        ...base,
        type: 'transformation',
        transformationStyle: 'strikethrough',
        exampleText: customExampleText.value,
      }
      break
    case 'custom-transform':
      localPreset.value = { ...base, type: 'custom-transform', customTransformId: '' }
      break
    case 'llm-prompt': {
      const suggestedProvider = (
        props.globalProvider && PROVIDER_TO_LLM[props.globalProvider]
          ? PROVIDER_TO_LLM[props.globalProvider]
          : 'gemini'
      ) as LLMProvider
      const globalCfg = providerConfigs.value[
        suggestedProvider as keyof ProviderConfigs
      ] as { model?: string } | undefined
      const defaultModel =
        globalCfg?.model ||
        getDefaultModel(suggestedProvider as keyof typeof PREDEFINED_MODELS) ||
        ''
      localPreset.value = {
        ...base,
        type: 'llm-prompt',
        prompt: '',
        llmProvider: suggestedProvider,
        llmModel: defaultModel,
      }
      initLLMModelState(suggestedProvider, defaultModel)
      initLLMCredentialDrafts(suggestedProvider)
      break
    }
  }
  console.log('[PresetEditor] Mode changed to:', newType)
}

// ─── Pin ─────────────────────────────────────────────────────────

function handlePinChange() {
  emit('set-pinned', props.preset.id)
}

// ─── Undo ────────────────────────────────────────────────────────

function undoChanges() {
  localPreset.value = { ...props.preset }
  shortcutError.value = ''
  if (props.preset.type === 'transformation' && props.preset.exampleText) {
    customExampleText.value = props.preset.exampleText
  }
  if (props.preset.type === 'translation' && props.preset.customProviderConfig) {
    presetConfig.value = { ...props.preset.customProviderConfig }
  } else {
    presetConfig.value = {}
  }
  if (props.preset.type === 'llm-prompt') {
    initLLMModelState(
      (props.preset as LLMPromptPreset).llmProvider,
      (props.preset as LLMPromptPreset).llmModel
    )
    initLLMCredentialDrafts((props.preset as LLMPromptPreset).llmProvider)
  }
  memoryCachedDraft.value = null
  clearDraft().catch((e) => console.error('[PresetEditor] Failed to clear draft on undo:', e))
}

// ─── Shortcut input ──────────────────────────────────────────────

function handleShortcutInput(event: KeyboardEvent) {
  if (event.key === 'Backspace' || event.key === 'Delete') {
    sequenceDetector.reset()
    return
  }
  event.preventDefault()
  const sequenceShortcut = sequenceDetector.processKeyDown(event)
  const simpleShortcut = buildShortcutFromEvent(event)
  const shortcut = sequenceShortcut || simpleShortcut
  if (shortcut) {
    localPreset.value.keyboardShortcut = shortcut
    validateShortcut()
  }
}

function handleShortcutKeyUp(event: KeyboardEvent) {
  sequenceDetector.processKeyUp(event)
}

// ─── Validation ──────────────────────────────────────────────────

function showValidationError(title: string, message: string) {
  validationDialogTitle.value = title
  validationDialogMessage.value = message
  showValidationDialog.value = true
}

function validateShortcut(): boolean {
  const shortcut = localPreset.value.keyboardShortcut.trim()

  if (!shortcut) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  const validPattern = /^(Ctrl|Alt|Shift|Meta)(\+(Ctrl|Alt|Shift|Meta|[A-Z0-9]))*$/i
  if (!validPattern.test(shortcut)) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  const tokens = shortcut.split('+').map((tok) => tok.trim())
  const modifiers = ['ctrl', 'alt', 'shift', 'meta', 'control', 'cmd', 'command', 'super']
  const keys = tokens.filter((token) => !modifiers.includes(token.toLowerCase()))

  if (keys.length === 0) {
    shortcutError.value =
      t('shortcutModifierOnly') || 'Modifier-only shortcuts (Alt, Ctrl, etc.) are not allowed'
    return false
  }
  if (keys.length > 2) {
    shortcutError.value = t('shortcutTooManyKeys')
    return false
  }

  const normalizedShortcut = normalizeShortcut(shortcut)
  if (!normalizedShortcut) {
    shortcutError.value = t('shortcutInvalidFormat')
    return false
  }

  const duplicate = props.allPresets.find(
    (p) => p.id !== props.preset.id && normalizeShortcut(p.keyboardShortcut) === normalizedShortcut
  )
  if (duplicate) {
    shortcutError.value = t('shortcutDuplicate', { params: { name: duplicate.name } })
    return false
  }

  for (const preset of props.allPresets) {
    if (preset.id === props.preset.id) continue
    const existingNormalized = normalizeShortcut(preset.keyboardShortcut)
    if (existingNormalized.startsWith(normalizedShortcut + '+')) {
      shortcutError.value = `Conflict: "${normalizedShortcut}" is a prefix of "${existingNormalized}" (${preset.name})`
      showValidationError(
        t('shortcutConflictTitle') || 'Shortcut Conflict',
        `The shortcut "${normalizedShortcut}" conflicts with "${existingNormalized}" used by "${preset.name}".\n\nWhen you press "${normalizedShortcut}", it will be triggered immediately and you won't be able to use "${existingNormalized}".\n\nPlease remove or modify "${preset.name}" first, or choose a different shortcut.`
      )
      return false
    }
    if (normalizedShortcut.startsWith(existingNormalized + '+')) {
      shortcutError.value = `Conflict: "${existingNormalized}" (${preset.name}) is a prefix of "${normalizedShortcut}"`
      showValidationError(
        t('shortcutConflictTitle') || 'Shortcut Conflict',
        `The shortcut "${normalizedShortcut}" conflicts with "${existingNormalized}" used by "${preset.name}".\n\nWhen you press "${existingNormalized}", it will be triggered immediately and you won't be able to use "${normalizedShortcut}".\n\nPlease remove or modify "${preset.name}" first, or choose a different shortcut.`
      )
      return false
    }
  }

  shortcutError.value = ''
  return true
}

async function validateCredentials(
  provider: string,
  apiKey: string,
  baseUrl?: string
): Promise<boolean> {
  isSaving.value = true
  try {
    const result = await validateProviderCredentials(provider, apiKey, baseUrl)
    if (!result.success) {
      showValidationError(
        t('validationError') || 'Validation Error',
        `✗ ${result.error || t('apiKeyRequired')}`
      )
      return false
    }
    return true
  } finally {
    isSaving.value = false
  }
}

// ─── Save / Delete ───────────────────────────────────────────────

async function savePreset() {
  if (isSaving.value) return
  if (!validateShortcut()) return

  if (localPreset.value.type === 'transformation') {
    if (!localPreset.value.transformationStyle) {
      console.error('[PresetEditor] Transformation style required')
      return
    }
    if (customExampleText.value !== localPreset.value.exampleText) {
      localPreset.value.exampleText = customExampleText.value
    }
  } else if (localPreset.value.type === 'translation') {
    if (!localPreset.value.sourceLang || !localPreset.value.targetLang) {
      console.error('[PresetEditor] Source and target languages required')
      return
    }
    if (localPreset.value.useCustomProvider) {
      if (!localPreset.value.customProvider) {
        showValidationError(
          t('validationError') || 'Validation Error',
          t('validationCustomProviderRequired')
        )
        return
      }
      const config = getProviderConfig(localPreset.value.customProvider)
      if (config.requiresApiKey && !presetConfig.value.apiKey) {
        showValidationError(
          t('validationError') || 'Validation Error',
          'API key is required for this provider'
        )
        return
      }
      if (config.requiresBaseUrl && !presetConfig.value.baseUrl) {
        showValidationError(
          t('validationError') || 'Validation Error',
          'Base URL is required for this provider'
        )
        return
      }
      if (config.availableModels.length > 0) {
        const effectiveModel = getEffectiveModel(
          presetConfig.value.model || '',
          presetConfig.value.customModel
        )
        if (!effectiveModel) {
          showValidationError(
            t('validationError') || 'Validation Error',
            'Model is required for this provider'
          )
          return
        }
      } else if (localPreset.value.customProvider === 'custom' && !presetConfig.value.model) {
        showValidationError(
          t('validationError') || 'Validation Error',
          'Model is required for custom provider'
        )
        return
      }
      const savedConfig =
        props.preset.type === 'translation' ? props.preset.customProviderConfig : undefined
      const credentialsChanged =
        presetConfig.value.apiKey !== savedConfig?.apiKey ||
        presetConfig.value.baseUrl !== savedConfig?.baseUrl
      if (credentialsChanged) {
        const ok = await validateCredentials(
          localPreset.value.customProvider,
          presetConfig.value.apiKey ?? '',
          presetConfig.value.baseUrl
        )
        if (!ok) return
      }
      localPreset.value.customProviderConfig = { ...presetConfig.value }
    }
  } else if (localPreset.value.type === 'custom-transform') {
    if (!localPreset.value.customTransformId) {
      showValidationError(
        t('validationError') || 'Validation Error',
        t('validationCustomTransformRequired')
      )
      return
    }
  } else if (localPreset.value.type === 'llm-prompt') {
    if (!localPreset.value.prompt) {
      showValidationError(
        t('validationError') || 'Validation Error',
        t('validationLLMPromptRequired')
      )
      return
    }
    if (!localPreset.value.llmProvider) {
      showValidationError(
        t('validationError') || 'Validation Error',
        t('validationLLMProviderRequired')
      )
      return
    }
    const effectiveModel = resolvedLLMModel.value
    if (!effectiveModel) {
      showValidationError(
        t('validationError') || 'Validation Error',
        t('validationLLMModelRequired')
      )
      return
    }
    localPreset.value.llmModel = effectiveModel

    const credentialsChanged =
      llmApiKeyDraft.value !== llmApiKeyOriginal.value ||
      llmBaseUrlDraft.value !== llmBaseUrlOriginal.value
    if (credentialsChanged) {
      const ok = await validateCredentials(
        localPreset.value.llmProvider,
        llmApiKeyDraft.value,
        llmBaseUrlDraft.value || undefined
      )
      if (!ok) return
    }

    // Flush credential drafts to global providerConfigs
    const provider = localPreset.value.llmProvider
    const cfg = providerConfigs.value[provider as keyof ProviderConfigs] as {
      apiKey?: string
      baseUrl?: string
    }
    if (cfg) {
      if ('apiKey' in cfg) cfg.apiKey = llmApiKeyDraft.value
      if ('baseUrl' in cfg) cfg.baseUrl = llmBaseUrlDraft.value
    }
  }

  emit('update-preset', { ...localPreset.value })
  memoryCachedDraft.value = null
  clearDraft().catch((e) => console.error('[PresetEditor] Failed to clear draft on save:', e))
  console.log('[PresetEditor] Preset saved:', localPreset.value)
}

function handleDeleteConfirm() {
  showDeleteDialog.value = false
  emit('delete-preset', props.preset.id)
}
</script>

<style scoped>
.preset-editor {
  padding-bottom: 0.5rem;
}
</style>
