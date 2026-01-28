import { ref } from 'vue'

export type SupportedLocale = 'en' | 'fr' | 'es' | 'de' | 'zh' | 'ja'

export const supportedLocales: Array<{ value: SupportedLocale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

type TranslationValue = string
type TranslationMap = Record<TranslationKey, TranslationValue>

const enTranslations = {
  // App
  appTitle: 'Simple Input Translator',

  // Provider
  providerLabel: 'Provider',
  providerBuiltin: 'Chrome Built-in AI',
  providerDeepL: 'DeepL API',
  providerGemini: 'Gemini API',

  // API Keys
  apiKeyValidate: 'Validate & Save',
  apiKeyValidating: 'Validating...',
  apiKeyValid: 'Valid API key',
  apiKeyValidCached: 'API key configured',

  // Languages
  sourceLanguage: 'Source Language',
  sourceLanguageDescription: 'Select "Auto-detect" to let the provider detect the source language',
  targetLanguage: 'Target Language',
  autoDetect: 'Auto-detect',

  // Keyboard Shortcut
  keyboardShortcut: 'Keyboard Shortcut',
  keyboardShortcutDescription: 'Press the desired keyboard combination (e.g., Alt+T, Ctrl+Shift+T)',

  // Usage
  howToUse: 'How to use:',
  usageSelect: 'Select text and press {shortcut} to translate it',
  usageInput: 'Focus on an input field and press {shortcut} to translate the content',
  usageWorks: 'Works on any website!',

  // Footer
  footerText: 'Simple Input Translator • Built with Vue 3',

  // Theme
  themeToggle: 'Toggle theme',
} as const

export type TranslationKey = keyof typeof enTranslations

const frTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: 'Fournisseur',
  providerBuiltin: 'IA intégrée Chrome',
  providerDeepL: 'API DeepL',
  providerGemini: 'API Gemini',
  apiKeyValidate: 'Valider & Sauvegarder',
  apiKeyValidating: 'Validation...',
  apiKeyValid: 'Clé API valide',
  apiKeyValidCached: 'Clé API configurée',
  sourceLanguage: 'Langue source',
  sourceLanguageDescription:
    'Sélectionner "Détection auto" pour laisser le fournisseur détecter la langue source',
  targetLanguage: 'Langue cible',
  autoDetect: 'Détection auto',
  keyboardShortcut: 'Raccourci clavier',
  keyboardShortcutDescription:
    'Appuyez sur la combinaison de touches souhaitée (ex: Alt+T, Ctrl+Shift+T)',
  howToUse: 'Comment utiliser :',
  usageSelect: 'Sélectionnez du texte et appuyez sur {shortcut} pour le traduire',
  usageInput:
    'Concentrez-vous sur un champ de saisie et appuyez sur {shortcut} pour traduire le contenu',
  usageWorks: 'Fonctionne sur tous les sites web !',
  footerText: 'Simple Input Translator • Créé avec Vue 3',
  themeToggle: 'Changer de thème',
}

const esTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: 'Proveedor',
  providerBuiltin: 'IA integrada de Chrome',
  providerDeepL: 'API DeepL',
  providerGemini: 'API Gemini',
  apiKeyValidate: 'Validar y Guardar',
  apiKeyValidating: 'Validando...',
  apiKeyValid: 'Clave API válida',
  apiKeyValidCached: 'Clave API configurada',
  sourceLanguage: 'Idioma de origen',
  sourceLanguageDescription:
    'Seleccione "Detección automática" para que el proveedor detecte el idioma de origen',
  targetLanguage: 'Idioma de destino',
  autoDetect: 'Detección automática',
  keyboardShortcut: 'Atajo de teclado',
  keyboardShortcutDescription:
    'Presione la combinación de teclas deseada (ej: Alt+T, Ctrl+Shift+T)',
  howToUse: 'Cómo usar:',
  usageSelect: 'Seleccione texto y presione {shortcut} para traducirlo',
  usageInput: 'Enfóquese en un campo de entrada y presione {shortcut} para traducir el contenido',
  usageWorks: '¡Funciona en cualquier sitio web!',
  footerText: 'Simple Input Translator • Creado con Vue 3',
  themeToggle: 'Cambiar tema',
}

const deTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: 'Anbieter',
  providerBuiltin: 'Chrome integrierte KI',
  providerDeepL: 'DeepL API',
  providerGemini: 'Gemini API',
  apiKeyValidate: 'Validieren & Speichern',
  apiKeyValidating: 'Validierung...',
  apiKeyValid: 'Gültiger API-Schlüssel',
  apiKeyValidCached: 'API-Schlüssel konfiguriert',
  sourceLanguage: 'Quellsprache',
  sourceLanguageDescription:
    'Wählen Sie "Automatische Erkennung", damit der Anbieter die Quellsprache erkennt',
  targetLanguage: 'Zielsprache',
  autoDetect: 'Automatische Erkennung',
  keyboardShortcut: 'Tastenkombination',
  keyboardShortcutDescription:
    'Drücken Sie die gewünschte Tastenkombination (z.B. Alt+T, Ctrl+Shift+T)',
  howToUse: 'Verwendung:',
  usageSelect: 'Wählen Sie Text aus und drücken Sie {shortcut}, um ihn zu übersetzen',
  usageInput:
    'Fokussieren Sie ein Eingabefeld und drücken Sie {shortcut}, um den Inhalt zu übersetzen',
  usageWorks: 'Funktioniert auf jeder Website!',
  footerText: 'Simple Input Translator • Erstellt mit Vue 3',
  themeToggle: 'Thema wechseln',
}

const zhTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: '提供商',
  providerBuiltin: 'Chrome 内置 AI',
  providerDeepL: 'DeepL API',
  providerGemini: 'Gemini API',
  apiKeyValidate: '验证并保存',
  apiKeyValidating: '验证中...',
  apiKeyValid: '有效的 API 密钥',
  apiKeyValidCached: 'API 密钥已配置',
  sourceLanguage: '源语言',
  sourceLanguageDescription: '选择"自动检测"让提供商检测源语言',
  targetLanguage: '目标语言',
  autoDetect: '自动检测',
  keyboardShortcut: '键盘快捷键',
  keyboardShortcutDescription: '按下所需的键盘组合（例如：Alt+T, Ctrl+Shift+T）',
  howToUse: '如何使用：',
  usageSelect: '选择文本并按 {shortcut} 翻译',
  usageInput: '聚焦输入字段并按 {shortcut} 翻译内容',
  usageWorks: '适用于任何网站！',
  footerText: 'Simple Input Translator • 使用 Vue 3 构建',
  themeToggle: '切换主题',
}

const jaTranslations: TranslationMap = {
  appTitle: 'Simple Input Translator',
  providerLabel: 'プロバイダー',
  providerBuiltin: 'Chrome 内蔵 AI',
  providerDeepL: 'DeepL API',
  providerGemini: 'Gemini API',
  apiKeyValidate: '検証して保存',
  apiKeyValidating: '検証中...',
  apiKeyValid: '有効な API キー',
  apiKeyValidCached: 'API キー設定済み',
  sourceLanguage: 'ソース言語',
  sourceLanguageDescription: 'プロバイダーにソース言語を検出させるには「自動検出」を選択',
  targetLanguage: 'ターゲット言語',
  autoDetect: '自動検出',
  keyboardShortcut: 'キーボードショートカット',
  keyboardShortcutDescription:
    '希望のキーボード組み合わせを押してください（例：Alt+T, Ctrl+Shift+T）',
  howToUse: '使い方：',
  usageSelect: 'テキストを選択して {shortcut} を押して翻訳',
  usageInput: '入力フィールドにフォーカスして {shortcut} を押してコンテンツを翻訳',
  usageWorks: 'すべてのウェブサイトで動作します！',
  footerText: 'Simple Input Translator • Vue 3 で構築',
  themeToggle: 'テーマを切り替え',
}

const translations: Record<SupportedLocale, TranslationMap> = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
  de: deTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

const localeMap: Record<string, SupportedLocale> = {
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  fr: 'fr',
  'fr-fr': 'fr',
  es: 'es',
  'es-es': 'es',
  'es-mx': 'es',
  de: 'de',
  'de-de': 'de',
  zh: 'zh',
  'zh-cn': 'zh',
  'zh-tw': 'zh',
  ja: 'ja',
  'ja-jp': 'ja',
}

const fallbackLocale: SupportedLocale = 'en'
const activeLocale = ref<SupportedLocale>(detectLocale())
const localeSet = new Set(supportedLocales.map((item) => item.value))

function detectLocale(): SupportedLocale {
  const chromeLang =
    typeof chrome !== 'undefined' && chrome?.i18n?.getUILanguage ? chrome.i18n.getUILanguage() : ''
  const language = (
    chromeLang ||
    navigator.language ||
    navigator.languages?.[0] ||
    ''
  ).toLowerCase()

  if (language && localeMap[language]) {
    return localeMap[language]
  }

  const prefix = language.split('-')[0]
  if (prefix && localeMap[prefix]) {
    return localeMap[prefix]
  }

  return fallbackLocale
}

function formatMessage(message: string, params?: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!params || params[key] === undefined) {
      return `{${key}}`
    }
    return String(params[key])
  })
}

export function translate(
  key: TranslationKey,
  options?: { params?: Record<string, string | number> }
): string {
  const locale = activeLocale.value
  const messages = translations[locale] || translations[fallbackLocale]
  const value = messages[key] ?? translations[fallbackLocale][key]

  return formatMessage(value, options?.params)
}

export function useI18n() {
  return {
    t: translate,
    locale: activeLocale,
    setLocale,
    supportedLocales,
  }
}

export function setLocale(locale: SupportedLocale): void {
  if (!localeSet.has(locale)) {
    activeLocale.value = fallbackLocale
    return
  }
  activeLocale.value = locale
}
