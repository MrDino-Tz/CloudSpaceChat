# UX Improvements

All recent UX enhancements to CloudSpaceChat — confirmation flows, settings panel, wallpapers, dark mode polish, chat search, and typing indicator.

---

## Summary

| Feature | Status | Files |
|---------|--------|-------|
| Chat request confirmation popup | Done | `ChatPage.jsx` |
| Logout confirmation popup | Done | `ChatPage.jsx` |
| Accepted notifications auto-dismiss | Done | `ChatPage.jsx` |
| Clear All notifications | Done | `ChatPage.jsx` |
| Chat request OTP verification | Done | `requestService.js`, `ChatPage.jsx` |
| Settings modal → inline side panel | Done | `SettingsModal.jsx`, `ChatPage.jsx` |
| Settings full-width in main area | Done | `ChatPage.jsx`, `index.css` |
| Per-chat wallpaper (upload/remove) | Done | `SidePanel.jsx`, `chatService.js` |
| Dark mode fixes (hardcoded colors) | Done | `index.css` |
| Chat search (filter by name/message) | Done | `ChatPage.jsx` |
| Typing indicator | Done | `chatService.js`, `ChatPage.jsx`, `index.css` |
| Extended file types (code, executables, audio, docs) | Done | `ChatPage.jsx`, `SidePanel.jsx` |
| Voice messages (hold-to-record + audio player) | Done | `ChatPage.jsx`, `cloudinary.js`, `index.css` |
| Media previews / auto-download (data-saver) | Done | `ChatPage.jsx`, `index.css` |
| Message bubble preview in settings | Done | `SettingsModal.jsx`, `index.css` |

---

## 1. Chat Request Confirmation Popup

**Purpose:** Prevent accidental friend requests by showing a preview before sending.

**Behavior:**
- Clicking "Message" on a search result opens a popup showing the user's avatar, display name, bio, and mutual info
- User must click "Send Request" to confirm, or "Cancel" to dismiss
- State: `pendingConfirmUser` holds the target user object; `showRequestPopup` controls visibility

**Implementation:**
- `UserSearchResult` calls `onStartChat(user)` instead of directly sending
- `ChatPage` receives this as `setPendingConfirmUser`
- `RequestPopup` component renders when `pendingConfirmUser` is set

**Location:** `ChatPage.jsx` — `pendingConfirmUser` state, `RequestPopup` rendering

---

## 2. Logout Confirmation Popup

**Purpose:** Prevent accidental logouts.

**Behavior:**
- Clicking the logout button opens a centered modal with "Are you sure?" and two buttons: Cancel / Logout
- State: `showLogoutConfirm` boolean

**Location:** `ChatPage.jsx` — `showLogoutConfirm` state, modal rendering near the logout button

---

## 3. Accepted Notifications Auto-Dismiss

**Purpose:** When a friend request is accepted, the notification disappears immediately instead of lingering.

**Behavior:**
- When a `request_accepted` notification is detected, `deleteNotification(n.id)` is called immediately
- No user action required

**Location:** `ChatPage.jsx` — inside the notification listener effect

---

## 4. Clear All Notifications

**Purpose:** Bulk-dismiss all notifications at once.

**Behavior:**
- "Clear all" button in the notification dropdown
- Calls `deleteNotification` on every notification via `Promise.all`
- Button shows a loading state while clearing

**Location:** `ChatPage.jsx` — notification dropdown rendering

---

## 5. Settings Panel (Inline Side Panel)

**Purpose:** Replace the modal-based settings with an inline panel that occupies the main chat area.

**Architecture:**

### View System
The left panel (`chat-list-panel`) supports multiple views via `view` state:
- `"chats"` — default conversation list (default)
- `"find-people"` — user search
- `"notifications"` — notification list
- `"settings"` — settings panel (rendered in `main-chat` area, not left panel)

### Component Extraction
- `useSettingsState()` hook — loads settings from Firestore, provides `settings` + `update(key, value)`, auto-saves on every toggle
- `SettingsPanel` export — the full settings UI (Security, Appearance, Notifications, Chat, Privacy tabs)
- No save/cancel buttons — every toggle saves immediately

### Settings Button
- Accessible from the notification dropdown header (gear icon next to "Notifications")
- Sets `view` to `"settings"`, which hides the chat list panel and shows the settings panel in the main area

**Location:**
- `SettingsModal.jsx` — `useSettingsState()` hook (lines 26-67), `SettingsPanel` component (lines 69-268)
- `ChatPage.jsx` — view system rendering (lines 1444-1446)

---

## 6. Settings Full-Width Layout

**Purpose:** When settings are active, the chat list panel is hidden and settings span the full width.

**Behavior:**
- Settings panel renders in `main-chat` area (not inside `chat-list-panel`)
- CSS class `.hidden-settings` applied to `chat-list-panel` when `view === "settings"` hides the sidebar
- On mobile: `mobile-chat-active` class triggers on `(activeConvId || view === "settings")`

**CSS:**
```css
.hidden-settings { display: none; }
.settings-panel-header { /* full-width header with tabs */ }
.settings-tabs-inline { /* horizontal tab bar */ }
.settings-tab-inline { /* individual tab button */ }
.settings-panel-body { /* scrollable content area */ }
```

**Location:**
- `ChatPage.jsx` — `.hidden-settings` class application
- `index.css` — responsive styles for `.settings-panel-*` classes

---

## 7. Per-Chat Wallpaper

**Purpose:** Each conversation can have its own custom wallpaper, independent of the global setting.

**Behavior:**
- "Chat Wallpaper" section in the SidePanel (below group description)
- Upload button opens file picker (accepts images)
- Upload goes to Cloudinary: `wallpapers/{conversationId}/{filename}`
- Preview shows current wallpaper with remove button
- Applies as inline `backgroundImage` on `.messages-container`
- Stored as `conversation.wallpaper` field in Firestore

**Implementation:**
- `updateConversationFields(conversationId, fields)` in `chatService.js` — generic field updater
- SidePanel reads `conversation.wallpaper` for preview, sets it on upload
- `ChatPage.jsx` applies wallpaper via inline style on `.messages-container`

**Location:**
- `chatService.js:217-229` — `updateConversationFields()`
- `SidePanel.jsx` — Chat Wallpaper upload section
- `ChatPage.jsx:1496` — wallpaper inline style on messages container

---

## 8. Dark Mode Fixes

**Purpose:** Eliminate hardcoded colors that broke in dark mode.

**Changes:**

| Element | Before | After |
|---------|--------|-------|
| `status-offline` dot | `background: #8a8d91` | `background: var(--border-color)` |
| Empty state text (3 instances) | `color: #8a8d91` | `color: var(--text-secondary)` |
| Action error banner | Hardcoded background | `background: var(--hover-bg); color: var(--text-main); border: 1px solid var(--border-color)` |
| Generic file badge | Hardcoded background | `background: var(--hover-bg); color: var(--text-secondary)` |
| Search input text | No explicit color | `color: var(--text-main)` added |

**Location:** `index.css` — dark mode section and component styles

---

## 9. Chat Search (Filter Conversations)

**Purpose:** Search/filter the conversation list by group name, last message content, or contact name.

**Behavior:**
- Search input at the top of the chat list panel
- Filters conversations in real-time as the user types
- Matches against:
  - Group name (`conv.name`)
  - Last message content (`conv.lastMessage`)
  - Contact display name (for private chats, resolved via `convNameMap`)
- Shows "No chats matching '{term}'" when filtered list is empty
- `convNameMap` state caches resolved private chat participant names
- `fetchedNamesRef` tracks which names have been fetched to avoid redundant lookups

**Location:** `ChatPage.jsx` — `convNameMap` state, `fetchedNamesRef`, filtered conversation list rendering

---

## 10. Typing Indicator

**Purpose:** Show when another user is typing in the current conversation.

**Architecture:**

### Data Flow
1. **User types** → `MessageInput.handleInput` fires `setTyping(convId, userId)` (debounced 1s)
2. **Firestore** → `typing.{userId}` set to `serverTimestamp()` on the conversation doc
3. **Real-time listener** → `listenToConversations` onSnapshot propagates the update
4. **ChatPage** → reads `activeConv.typing`, computes which users are typing
5. **UI** → shows "typing..." or "N people typing..." in chat header subtitle
6. **User sends** → `clearTyping(convId, userId)` fires, removes the field via `deleteField()`

### Expiry
- Client-side: entries older than 5 seconds are ignored (stale typing detection)
- `markConversationLastMessage` in `sendMessage` sets `typing: {}` which wipes all typing state on send

### Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `setTyping(conversationId, userId)` | `chatService.js:243` | Writes `typing.{userId}: serverTimestamp()` |
| `clearTyping(conversationId, userId)` | `chatService.js:252` | Removes `typing.{userId}` via `deleteField()` |

### CSS Animation
```css
.typing-indicator-header { display: inline-flex; align-items: center; gap: 4px; }
.typing-dots span { animation: typingBounce 1.2s ease-in-out infinite; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
```

Three dots bounce vertically with staggered timing.

**Location:**
- `chatService.js:243-261` — `setTyping`, `clearTyping`
- `ChatPage.jsx:1181-1195` — `typingUsers` computation, `typingText` display
- `ChatPage.jsx:755-780` — MessageInput typing event handling
- `index.css:3837-3874` — `.typing-indicator-header`, `.typing-dots`, `@keyframes typingBounce`

---

## 11. Extended File Types

**Purpose:** Broaden the file picker beyond generic documents so most attachments get a recognizable badge + icon color.

**Behavior:**
- `accept` string on the file input: PDF, Office docs, archives, executables (apk/exe/msi/bat/sh), audio (mp3/wav/ogg/m4a/webm), source/code (js/ts/py/html/css/json/java/cpp/csv/xml/md), design (psd/ai), and more
- The picker filter is cosmetic — there is no hard server-side type validation

**Implementation:**
- `FILE_EXT_COLORS` in `ChatPage.jsx` — extension → badge background color (used by `FileExtBadge`)
- `FILE_ICONS` in `SidePanel.jsx` — same extensions rendered in the side panel attachment list

**Location:** `ChatPage.jsx` (accept string, `FILE_EXT_COLORS`), `SidePanel.jsx` (`FILE_ICONS`)

---

## 12. Voice Messages (Hold-to-Record)

**Purpose:** Let users send short voice notes directly from the message input.

**Behavior:**
- Mic button appears when the text field is empty; Send button appears when text is entered (swapped with `btn-pop` animation)
- **Press and hold** the mic to record; release to stop and send (also stops on `pointerup` anywhere / scrolling away)
- A recording bar shows a pulsing red dot + elapsed timer
- Audio is recorded via `MediaRecorder` (`audio/webm`), uploaded to Cloudinary as `voice-note.webm` (`resourceType: "video"` so browsers can play it)
- Sent as a regular message with `content: "🎤 Voice note"`, `type: "audio"`, and `attachments: [{ url, type: "audio", name, size, duration }]`
- Received/played back with an inline audio player (play/pause + animated waveform bars)
- Avatars are not shown in voice-note bubbles
- "🎤 Voice note" is excluded from the bubble text render list (it still shows in the chat-list preview)

**Implementation:**
- `uploadToCloudinary(file, { resourceType })` in `cloudinary.js` — supports overriding the resource type (default `"auto"`)
- `AudioAttachment` in `ChatPage.jsx` — `<audio>` element + 32 stable waveform bars that animate while playing
- `MessageInput` — hold-to-record handlers on the mic button

**Location:** `ChatPage.jsx` (recording state, AudioAttachment, input), `cloudinary.js`, `index.css` (`.recording-bar`, `.mic-btn-recording`, waveform keyframes)

---

## 13. Media Previews / Auto-Download (Data-Saver)

**Purpose:** Avoid downloading large media over metered connections unless the user wants it.

**Behavior:**
- New settings tab "Data & Storage" ▶ "Auto-Download": Images (default on), Videos (off), Audio (off)
- `MessageBubble.shouldAutoLoad(type)` checks the matching setting:
  - **Image** and auto-load off → blurred thumbnail (Cloudinary `w_240,q_auto,f_auto`) with an eye icon overlay
  - **Video** and auto-load off → first frame (`preload="metadata"`, blurred) with a play overlay
  - **Audio** and auto-load off → small circular play button only
- Tapping the preview loads the full media inline (`loadMedia`)
- "Clear Cache & Reload" (Storage section) clears `localStorage` settings and reloads the page

**Implementation:**
- `MediaPreviewPlaceholder` in `ChatPage.jsx`
- `autoDownloadImages` / `autoDownloadVideo` / `autoDownloadAudio` in `settingsService.js` DEFAULTS

**Location:** `ChatPage.jsx`, `settingsService.js`, `SettingsModal.jsx` (Data tab), `index.css` (`.media-preview-*`)

---

## 14. Message Bubble Preview in Settings

**Purpose:** Show how message bubbles will look as the user changes Corner style / Font size / Font style.

**Behavior:**
- `BubblePreview` renders an incoming + outgoing bubble at the top of the "Message Bubbles" card
- Corner style → radius + classic triangle tails
- Font size and font style → applied live to the preview text
- Font styles loaded from Google Fonts (`@import` in `index.css`): Inter, Nunito, Poppins, Quicksand, Patrick Hand, Dancing Script, Caveat, Pacifico, Shadows Into Light, Kalam

**Location:** `SettingsModal.jsx` (`BubblePreview`, `PREVIEW_FAMILIES`), `index.css` (`.bubble-preview-*`)

---

## Key Files Reference

| File | What it contains |
|------|------------------|
| `src/components/ChatPage.jsx` | View system, all popup states, settings panel, typing indicator computation, message input with typing events, voice recording, media previews |
| `src/components/SettingsModal.jsx` | `useSettingsState()` hook, `SettingsPanel` component, theme/wallpaper/bubble settings UI, bubble preview |
| `src/components/SidePanel.jsx` | Chat wallpaper upload, group info, member list, file icons |
| `src/lib/chatService.js` | `setTyping`, `clearTyping`, `updateConversationFields`, `sendMessage`, `markConversationLastMessage` |
| `src/lib/cloudinary.js` | `uploadToCloudinary` with `resourceType` option |
| `src/lib/settingsService.js` | `applyTheme`, `applyStyleOverrides`, `DEFAULTS` (incl. font styles + auto-download) |
| `src/index.css` | All CSS variables, dark mode overrides, typing animation, recording bar, media previews, bubble preview, responsive settings styles |
