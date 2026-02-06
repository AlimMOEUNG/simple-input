# Ollama Dynamic Models Feature

## Overview

Unlike other translation providers (Gemini, ChatGPT, etc.) which have fixed model lists, Ollama is a local service where users only have access to models they've downloaded on their machine.

This feature implements dynamic model fetching from the user's local Ollama instance.

## How It Works

### 1. API Integration

The extension now calls Ollama's `/api/tags` endpoint to fetch available models:

```typescript
// src/background/utils/ollamaApi.ts
GET {baseUrl}/api/tags
```

Response example:

```json
{
  "models": [
    {
      "name": "llama3.2:latest",
      "modified_at": "2024-01-15T10:30:00Z",
      "size": 2000000000
    },
    {
      "name": "mistral:latest",
      "modified_at": "2024-01-14T08:20:00Z",
      "size": 4000000000
    }
  ]
}
```

### 2. User Interface

In the Popup when Ollama provider is selected:

- **Base URL field** with a refresh button (↻)
- **Auto-fetch on blur**: Models are fetched when user leaves the URL field
- **Refresh button**: Manual refresh of available models
- **Status indicators**:
  - Loading: `⏳ Fetching available models...`
  - Success: `✓ Found X local model(s)`
  - Error: `⚠️ Error message (using default list)`

### 3. Fallback System

**Critical**: The system uses a smart fallback approach:

1. **Try to fetch** models from Ollama API
2. **On success**: Display fetched models + "Custom Model" option
3. **On failure**: Fall back to static predefined list (in `predefinedModels.ts`)

This ensures the UI is **never broken** even if:

- Ollama is not running
- Base URL is incorrect
- Network error occurs
- User hasn't configured Ollama yet

### 4. Auto-Fetch Triggers

Models are automatically fetched when:

- User selects Ollama provider (if Base URL is configured)
- User changes the Base URL (on blur)
- Extension popup opens with Ollama as active provider
- User clicks the refresh button (↻)

## Files Modified

### New Files

- `src/background/utils/ollamaApi.ts` - Ollama API client

### Modified Files

- `src/background.ts` - Added `FETCH_OLLAMA_MODELS` message handler
- `src/popup/Popup.vue` - Added dynamic UI, fetch logic, and refresh button
- `src/config/predefinedModels.ts` - Now serves as fallback list

## Implementation Details

### State Management

```typescript
// Popup.vue
const ollamaModels = ref<Array<{ value: string; label: string }>>([])
const ollamaModelsLoading = ref(false)
const ollamaModelsError = ref('')

// Computed with fallback
const ollamaModelOptions = computed(() => {
  if (ollamaModels.value.length > 0) {
    return [...ollamaModels.value, { value: 'custom', label: 'Custom Model' }]
  }
  // Fallback to static list
  return PREDEFINED_MODELS.ollama
})
```

### Message Flow

```
Popup.vue
   ↓ sends FETCH_OLLAMA_MODELS
background.ts
   ↓ calls fetchOllamaModels()
ollamaApi.ts
   ↓ GET {baseUrl}/api/tags
Ollama Server
   ↓ returns {models: [...]}
background.ts
   ↓ returns {success: true, data: {models}}
Popup.vue
   ↓ updates ollamaModels ref
   ↓ UI re-renders with dynamic list
```

### Error Handling

All errors are gracefully handled:

- Network errors → fallback to static list
- Invalid URL → error message shown + fallback
- Ollama not running → fallback to static list
- Timeout → error message + fallback

The extension **never crashes** due to Ollama API issues.

## User Experience

### Before (Static List)

- User sees hardcoded list of popular models
- No way to see which models are actually installed
- Must use "Custom Model" option for unlisted models

### After (Dynamic + Fallback)

- User sees their **actual installed models**
- Clear feedback when Ollama is accessible
- Automatic fallback to common models if Ollama unavailable
- Visual indicators for loading/error states
- One-click refresh to update list

## Testing Checklist

- [ ] Fetch works when Ollama is running
- [ ] Fallback works when Ollama is not running
- [ ] Fallback works with invalid Base URL
- [ ] Auto-fetch triggers on provider change
- [ ] Auto-fetch triggers on popup open
- [ ] Refresh button works
- [ ] Loading states display correctly
- [ ] Error messages are clear
- [ ] Model selection persists after fetch
- [ ] Custom model option always available

## Technical Notes

### Why Not Cache Models?

Models are fetched on-demand rather than cached because:

1. Users can install/remove models anytime
2. Ollama API is fast (local)
3. We want fresh data
4. Cache invalidation is complex

### Why Keep Static List?

The static list in `predefinedModels.ts` serves as:

1. **Fallback** when API unavailable
2. **Documentation** of popular models
3. **Default** for new users
4. **Reliability** guarantee

### Base URL Handling

The code properly handles both URL formats:

- `http://localhost:11434` (base URL for `/api/tags`)
- `http://localhost:11434/v1` (OpenAI-compatible for `/chat/completions`)

The fetch logic strips `/v1` suffix before calling `/api/tags`.

## Future Improvements

Possible enhancements:

- [ ] Cache models for 5 minutes to reduce API calls
- [ ] Show model sizes in dropdown
- [ ] Filter out stopped/inactive models
- [ ] Auto-select recommended model on first fetch
- [ ] Persist last fetch timestamp
