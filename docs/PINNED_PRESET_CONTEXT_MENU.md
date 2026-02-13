# Pinned Preset & Right-Click Context Menu

## Overview

One preset can be **pinned**. The pinned preset is the one triggered when the user right-clicks on selected text and chooses the extension's context menu item. There is always exactly one pinned preset at any time.

## User Experience

1. Select text on any web page.
2. Right-click → the context menu shows an item labelled with the pinned preset's name.
3. Click the item → the text is translated/transformed exactly as if the keyboard shortcut had been pressed.

To change the pinned preset, open the extension popup, go to the **Presets** tab, select the desired preset, and check **"Use for right-click menu"**. The context menu title updates immediately.

## Data Structure

`pinnedPresetId` is stored alongside the other presets settings:

```typescript
interface PresetsSettings {
  presets: Preset[]
  activePresetId: string | null
  provider: TranslationProvider
  selectionModifier?: SelectionModifier
  pinnedPresetId: string | null  // ID of the preset used for the right-click context menu
}
```

## Architecture

### Data flow — changing the pinned preset

```
User checks "Use for right-click menu" in PresetEditor
  → emit('set-pinned', id)
  → PresetsTab calls setPinnedPreset(id)         [usePresetsSettings.ts]
  → presetsSettings.pinnedPresetId = id
  → debounced saveToStorage() → chrome.storage.sync
  → background.ts: storage.onChanged listener
  → updateContextMenuTitle()                      [chrome.contextMenus.update]
```

### Data flow — triggering via context menu

```
User right-clicks selected text → clicks menu item
  → background.ts: contextMenus.onClicked
  → chrome.tabs.sendMessage({ type: 'TRIGGER_PINNED_PRESET' })
  → content-script.ts: runtime.onMessage listener
  → settings.getPinnedPreset()                   [SettingsManager]
  → keyboardHandler.triggerPreset(preset)         [KeyboardShortcutHandler]
  → same logic as keyboard shortcut → text replaced
```

## Files Changed

| File | Change |
|---|---|
| `src/types/common.ts` | Added `pinnedPresetId: string \| null` to `PresetsSettings` |
| `src/core/utils/i18n.ts` | Added `pinnedPresetLabel`, `contextMenuTitle` keys |
| `src/composables/usePresetsSettings.ts` | Default value, migration backfill, `deletePreset` pin transfer, `setPinnedPreset`, `getPinnedPreset` |
| `src/core/storage/SettingsManager.ts` | `getPinnedPresetId()`, `getPinnedPreset()` methods |
| `src/background.ts` | `setupContextMenu()`, `updateContextMenuTitle()`, storage listener, `contextMenus.onClicked` listener |
| `src/content-script.ts` | `TRIGGER_PINNED_PRESET` message handler |
| `src/core/handlers/KeyboardShortcutHandler.ts` | Public `triggerPreset(preset)` method |
| `src/components/PresetEditor.vue` | `isPinned` prop, `set-pinned` emit, checkbox UI |
| `src/components/PresetsTab.vue` | Pass `:is-pinned`, handle `@set-pinned` |
| `manifests/manifest.chrome.json` | Added `contextMenus` permission |
| `manifests/manifest.firefox.json` | Added `contextMenus` permission |

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Delete the pinned preset | Pin transfers to `presets[0]`, saved immediately, context menu title updated |
| Last preset (cannot be deleted) | Existing guard `length <= 1` prevents deletion |
| Click checkbox on already-pinned preset | No-op (cannot unpin without pinning another) |
| MV3 service worker restart | `setupContextMenu()` at module level recreates the menu item |
| First install (no storage yet) | Generic fallback title `"Translate"` until first save |
| `TRIGGER_PINNED_PRESET` before content script init | Guard returns error response, no crash |
| Tab without content script (e.g. `chrome://`) | `sendMessage` fails silently (caught in background) |

## Migration

Existing users who upgrade from a version without `pinnedPresetId` are handled in `loadFromStorage()`:

```typescript
// If pinnedPresetId is absent, backfill with the first preset's ID and force a save
if (presetsSettings.value.pinnedPresetId === undefined || presetsSettings.value.pinnedPresetId === null) {
  presetsSettings.value.pinnedPresetId = presetsSettings.value.presets[0].id
  needsSave = true
}
```

`SettingsManager.getPinnedPreset()` also has a runtime fallback to `presets[0]` if the stored ID is stale.
