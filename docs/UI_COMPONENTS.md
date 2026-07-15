# UI Component Patterns

Reference for all reusable UI patterns, component conventions, spacing, colors, and responsive behavior in CloudSpaceChat.

---

## Design Tokens (CSS Variables)

All colors reference CSS variables. Never use hardcoded hex values in new components — always use the token system.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary-color` | `#F59B1D` | `#F59B1D` | Buttons, accents, active states, badges |
| `--bg-main` | `#f8f9fa` | `#000000` | Chat list background |
| `--bg-white` | `#ffffff` | `#000000` | Cards, modals, panels |
| `--text-main` | `#1a1a1a` | `#f5f5f5` | Primary text |
| `--text-secondary` | `#8a8d91` | `#a3a3a3` | Muted text, labels, timestamps |
| `--border-color` | `#e5e7eb` | `#262626` | Borders, dividers |
| `--hover-bg` | `#f3f4f6` | `#111111` | Hover states, card backgrounds, incoming messages |
| `--msg-incoming` | `#f3f4f6` | `#111111` | Incoming message bubble |
| `--msg-outgoing` | `#1a1a1a` | `#1a1a1a` | Outgoing message bubble |
| `--icon-color` | `#6b7280` | `#a3a3a3` | Icons, muted interactive elements |

**Danger color:** `#dc2626` (hardcoded — used for destructive actions)  
**Success color:** `#22c55e` (hardcoded — used for online status, safe links)

---

## Layout Architecture

```
┌──────────┬─────────────────────┬────────────┐
│ Sidebar  │ Chat List Panel     │ Right      │
│ 80px     │ 340px               │ Panel      │
│          │                     │ 300px      │
│ [nav]    │ [search] [chats]    │ [info]     │
│          │                     │ [members]  │
│          │          Main Chat  │ [media]    │
│          │          (flex: 1)  │            │
│          │ [header]            │            │
│          │ [messages]          │            │
│          │ [input]             │            │
└──────────┴─────────────────────┴────────────┘
```

- `.app-window` — flex row, full viewport
- `.sidebar` — 80px fixed, nav icons
- `.chat-list-panel` — 340px fixed, conversation list (hidden when settings active)
- `.main-chat` — flex-grow, messages + input
- `.right-panel` — 300px fixed, slides in/out with `width` transition

---

## Button Patterns

### Primary Button (Action)
```css
background: var(--primary-color);
color: #fff;
border-radius: 8px;
font-size: 14px;
font-weight: 600;
transition: opacity 0.15s;
/* hover: opacity: 0.85 */
/* disabled: opacity: 0.5, cursor: not-allowed */
```
Used by: Send, Verify, Group Create, Settings Save, Request Send, File Preview Send

### Secondary Button
```css
background: var(--hover-bg);
color: var(--text-main);
border-radius: 8px;
/* hover: opacity: 0.85 */
```
Used by: Cancel, Settings Secondary, Edit Cancel

### Danger Button
```css
background: #dc2626; /* or #fef2f2 with red text */
color: #fff;
border-radius: 8px;
```
Used by: Confirm Dialog Danger, Group Action Danger, Member Action Danger

### Icon Button (Small)
```css
width: 34px; height: 34px; /* or 32px */
border-radius: 8px; /* or 50% for circle */
border: none;
background: var(--hover-bg);
color: var(--text-main); /* or var(--icon-color) */
display: flex; align-items: center; justify-content: center;
transition: background 0.15s;
/* hover: background: var(--border-color) */
```
Used by: New Chat, Modal Close, Reply Cancel, Settings Panel Back

---

## Input Patterns

### Search Input
```css
padding: 12px 40px 12px 16px;
border: none;
border-radius: 8px;
background: var(--hover-bg);
color: var(--text-main);
font-size: 14px;
/* placeholder: var(--text-secondary) */
```

### Form Input
```css
padding: 10px 12px;
border: 1px solid var(--border-color);
border-radius: 8px;
font-size: 14px;
background: var(--bg-white);
color: var(--text-main);
/* focus: border-color: var(--primary-color) */
```

### Settings Input
```css
padding: 8px 12px;
border: 1px solid var(--border-color);
border-radius: 8px;
font-size: 13px;
background: var(--bg-white);
color: var(--text-main);
/* focus: border-color: var(--primary-color) */
```

### Message Input
```css
border: none;
background: transparent;
padding: 8px 0;
font-size: 14px;
color: var(--text-main);
/* wrapped in .input-container: flex, bg: var(--hover-bg), radius: 8px, padding: 8px 8px 8px 20px */
```

### Textarea
```css
/* inherits form-input styles */
resize: vertical;
min-height: 60px;
font-family: inherit;
```

### OTP Box
```css
width: 44px; height: 52px;
text-align: center;
font-size: 22px; font-weight: 700;
border: 2px solid var(--border-color);
border-radius: 10px;
background: transparent;
color: var(--text-main);
/* focus: border-color: var(--primary-color) */
```

---

## Modal Patterns

### Standard Modal
```html
<div class="modal-backdrop">           <!-- fixed inset, bg: rgba(0,0,0,0.45), z-index: 2000 -->
  <div class="modal-box">             <!-- bg: var(--bg-white), radius: 12px, max-width: 440px -->
    <div class="modal-header">        <!-- flex, padding: 20px 24px 0 -->
      <div class="modal-title-row">
        <div class="modal-brand">Title</div>
      </div>
      <button class="modal-close-btn">×</button>
    </div>
    <div class="modal-body">          <!-- padding: 20px 24px 24px, overflow-y: auto -->
      ...content...
    </div>
  </div>
</div>
```

### Confirm Dialog
```html
<div class="modal-backdrop">
  <div class="confirm-dialog">        <!-- max-width: 360px, padding: 24px -->
    <div class="confirm-dialog-title">Are you sure?</div>
    <div class="confirm-dialog-desc">Description text</div>
    <div class="confirm-dialog-actions">  <!-- flex, gap: 8px -->
      <button class="confirm-btn confirm-btn-cancel">Cancel</button>
      <button class="confirm-btn confirm-btn-danger">Delete</button>
    </div>
  </div>
</div>
```

### Request Popup
```html
<div class="request-popup-overlay">    <!-- fixed inset, bg: rgba(0,0,0,0.6), backdrop-filter: blur(4px) -->
  <div class="request-popup">         <!-- max-width: 400px, padding: 32px, radius: 16px -->
    <div class="request-popup-content"><!-- flex col, align center, gap: 12px -->
      <div class="request-icon">...</div>
      <h3>Title</h3>
      <p>Description</p>
    </div>
    <div class="request-popup-actions"><!-- flex, gap: 10px -->
      <button>Cancel</button>
      <button>Confirm</button>
    </div>
  </div>
</div>
```

---

## Card & Panel Patterns

### Settings Card
```css
background: var(--hover-bg);
border-radius: 12px;
padding: 2px 16px;
```

### Panel Section
```css
padding: 20px;
border-bottom: 1px solid var(--border-color);
```

### Section Header
```css
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 16px;
```

### Section Title
```css
font-size: 14px;
font-weight: 600;
color: var(--text-main);
```

### Settings Section Title (label)
```css
font-size: 12px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.5px;
color: var(--text-secondary);
margin-bottom: 10px;
```

### Group About Card
```css
background: var(--hover-bg);
border-radius: 10px;
padding: 12px 16px;
```

---

## Avatar Patterns

All avatars use `border-radius: 8px` for square-rounded style, or `50%` for circles.

| Pattern | Size | Radius | Background | Font |
|---------|------|--------|------------|------|
| `.chat-avatar` | 48px | 8px | image | — |
| `.chat-avatar-letter` | 48px | 8px | `var(--primary-color)` | 18px bold white |
| `.msg-avatar` | 32px | 8px | image | — |
| `.msg-avatar-letter-sm` | 32px | 8px | `var(--primary-color)` | 14px bold white |
| `.profile-avatar` | 44px | 8px | image | — |
| `.profile-avatar-letter-lg` | 44px | 8px | `var(--primary-color)` | 20px bold white |
| `.group-avatar-large` | 80px | 8px | image | — |
| `.member-avatar` | 36px | 8px | image | — |
| `.add-member-avatar` | 38px | 50% | image | — |
| `.add-member-letter` | 38px | 50% | `var(--primary-color)` | 14px bold white |
| `.group-row-avatar` | 36px | 50% | image | — |
| `.group-row-letter` | 36px | 50% | `var(--primary-color)` | 14px bold white |

**Fallback pattern:** Render `<img>` when URL exists, otherwise render colored `<div>` with initials via `getAvatarFallback(name)`.

---

## Badge Patterns

| Pattern | Style | Purpose |
|---------|-------|---------|
| `.admin-badge` | 16px circle, `var(--primary-color)`, 9px white star | Positioned on avatar corner |
| `.self-badge` | Pill, `var(--bg-white)`, bordered | "You" label under avatar |
| `.unread-badge` | Pill, `var(--primary-color)`, 11px white | Conversation unread count |
| `.nav-unread-badge` | 16px pill, `var(--primary-color)`, 9px white | Total unread on nav icon |
| `.notif-badge` | 18px pill, `var(--primary-color)`, 11px white | Notification count |
| `.msg-info-badge` | Pill, `var(--primary-color)`, 11px uppercase | Message status (SENT/DELIVERED/READ) |
| `.date-badge` | Pill, `var(--hover-bg)`, 12px `var(--text-secondary)` | Timestamp separator |

---

## Status Dots

```css
.status-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  border: 2px solid var(--bg-white);
  position: absolute; bottom: 0; right: 0;
}
.status-online  { background: #22c55e; }
.status-offline { background: var(--border-color); }
.status-group   { background: var(--border-color); }
```

---

## Tooltip & Popup Patterns

### Member Tooltip (hover)
```css
position: absolute;
top: calc(100% + 4px);
left: 50%; transform: translateX(-50%);
background: var(--bg-white);
border: 1px solid var(--border-color);
border-radius: 6px;
padding: 4px 10px;
box-shadow: 0 2px 8px rgba(0,0,0,0.12);
z-index: 200;
pointer-events: none;
```

### Context Menu (right-click)
```css
background: var(--bg-white);
border: 1px solid var(--border-color);
border-radius: 12px;
box-shadow: 0 8px 32px rgba(0,0,0,0.18);
min-width: 200px;
padding: 6px;
animation: ctx-pop 0.12s ease;
```
Items: `.msg-context-item` — padding 9px 12px, radius 8px, hover `var(--hover-bg)`  
Danger items: `.msg-context-item.danger` — color `#dc2626`, hover `#fef2f2`

### Dropdown Menu
```css
position: absolute;
background: var(--bg-white);
border: 1px solid var(--border-color);
border-radius: 12px;
box-shadow: 0 8px 24px rgba(0,0,0,0.12);
overflow: hidden;
```
Items: `.new-chat-option` — padding 12px 16px, hover `var(--hover-bg)`

### Attach Menu
```css
position: absolute;
bottom: calc(100% + 8px);
background: var(--bg-white);
border: 1px solid var(--border-color);
border-radius: 8px;
box-shadow: 0 4px 20px rgba(0,0,0,0.12);
padding: 6px;
```
Icons use colored backgrounds: `.attach-menu-icon-image` = `#dbeafe`/`#2563eb`, etc.

---

## Link Security Badges

```css
.link-badge-dot.link-safe      { background: #22c55e; box-shadow: 0 0 4px rgba(34,197,94,0.5); }
.link-badge-dot.link-unknown   { background: #eab308; box-shadow: 0 0 4px rgba(234,179,8,0.5); }
.link-badge-dot.link-suspicious{ background: #ef4444; box-shadow: 0 0 4px rgba(239,68,68,0.5); }
```

---

## Message Bubble Patterns

```css
.message-wrapper { display: flex; max-width: 70%; }
.message-wrapper.incoming { align-self: flex-start; }
.message-wrapper.outgoing { align-self: flex-end; flex-direction: row-reverse; }

.message-bubble {
  padding: 8px 12px;
  border-radius: var(--bubble-radius, 16px);
  font-size: var(--msg-font-size, 14px);
  position: relative;
  min-width: 80px;
}
.incoming .message-bubble { background: var(--msg-incoming); color: var(--text-main); }
.outgoing .message-bubble { background: var(--msg-outgoing); color: white; }
```

---

## Settings Panel Patterns

### Setting Row
```css
display: flex;
align-items: center;
justify-content: space-between;
padding: 12px 0;
border-bottom: 1px solid var(--border-color);
```
Label: `.setting-label` — 14px, font-weight 500  
Description: `.setting-desc` — 12px, `var(--text-secondary)`

### Theme Mini Grid
```css
.theme-mini-grid { display: flex; gap: 6px; }
.theme-mini {
  flex-direction: column; align-items: center; gap: 4px;
  padding: 6px 8px;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 11px; font-weight: 500;
  color: var(--text-secondary);
  transition: border-color 0.15s;
}
.theme-mini.active { border-color: var(--primary-color); background: var(--hover-bg); }
.theme-mini-swatch { width: 32px; height: 24px; border-radius: 6px; }
.theme-mini-dot { width: 10px; height: 10px; border-radius: 50%; }
```

---

## Spacing Reference

### Padding
| Value | Usage |
|-------|-------|
| `20px 24px` | Input area, messages container |
| `20px` | Panel sections, search container |
| `16px 20px` | Chat items, chat list header |
| `12px 16px` | Date badges, system messages |
| `8px 12px` | Message bubbles, file attachments |
| `24px` | Modal body, confirm dialog |
| `32px` | Request popup |
| `10px 14px` | Group action buttons, member action items |

### Gap
| Value | Usage |
|-------|-------|
| `20px` | Between messages |
| `16px` | Chat actions, request popup actions |
| `12px` | Setting rows, group info children |
| `10px` | Context menu items, attach menu items |
| `8px` | Confirm dialog actions, section headers, settings panel header |
| `6px` | Context menu padding, settings tabs, member chips |
| `4px` | Nav items, typing dots |

### Border Radius
| Value | Usage |
|-------|-------|
| `16px` | Modals, message bubbles, request popup |
| `12px` | Context menus, settings cards, date badges, system messages |
| `10px` | Group about cards, OTP boxes |
| `8px` | **Most common** — inputs, buttons, avatars, file attachments |
| `6px` | Tooltips, edit inputs, settings back button |
| `50%` | Circles — status dots, close buttons, member avatars |

---

## Transitions

| Pattern | Duration | Usage |
|---------|----------|-------|
| `opacity 0.15s` | All buttons | Hover feedback |
| `background 0.15s` | Icon buttons, cards | Hover state |
| `background 0.1s` | Context menu items | Quick hover |
| `background 0.12s` | Message context items | Quick hover |
| `color 0.15s` | Nav items, chat actions | Active state |
| `border-color 0.15s` | Theme cards, OTP boxes | Selection |
| `transform 0.2s` | Toggles, chevrons | State change |
| `width 0.3s cubic-bezier(0.4,0,0.2,1)` | Right panel | Slide in/out |
| `transform 0.3s ease` | Sidebar (mobile) | Slide menu |

---

## Animations

### Context Menu Pop
```css
@keyframes ctx-pop {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
```

### Typing Bounce
```css
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
```

### Loading Dots
```css
@keyframes dots {
  0%   { content: ""; }
  25%  { content: "."; }
  50%  { content: ".."; }
  75%  { content: "..."; }
  100% { content: ""; }
}
```

---

## Responsive Behavior

Single breakpoint: `@media (max-width: 768px)`

### Mobile Changes
| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar | 80px fixed | Off-screen left, slides in via hamburger |
| Chat list panel | 340px fixed | Full width |
| Main chat | Flex-grow | Hidden until chat selected |
| Right panel | 300px fixed | Fixed overlay, slides from right |
| Back button | Hidden | Shows in chat header |
| Hamburger button | Hidden | Shows in chat header |
| Settings panel | Full width of main area | Adjusted padding (12px 16px) |
| Setting rows | Horizontal flex | Column layout, full-width controls |
| Theme grid | Single row | Wrapped |

### Mobile Trigger
```css
.app-window.mobile-chat-active .chat-list-panel { display: none; }
.app-window.mobile-chat-active .main-chat { display: flex; }
/* Triggered when: activeConvId || view === "settings" */
```

---

## Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Modal brand/title | 18px | 700 | `var(--text-main)` |
| Chat title | 16px | 700 | `var(--text-main)` |
| Section title | 14px | 600 | `var(--text-main)` |
| Setting label | 14px | 500 | `var(--text-main)` |
| Message text | 14px (configurable) | 400 | `var(--text-main)` / `#fff` |
| Setting description | 12px | 400 | `var(--text-secondary)` |
| Setting section label | 12px | 700 uppercase | `var(--text-secondary)` |
| Date badge | 12px | 500 | `var(--text-secondary)` |
| Badge text | 11px | 700 | `#fff` |
| Theme mini label | 11px | 500 | `var(--text-secondary)` |

---

## Component Conventions

### Naming
- CSS classes: `kebab-case` (`.chat-avatar`, `.msg-input`, `.settings-card`)
- React components: `PascalCase` (`MessageInput`, `SettingsPanel`, `SidePanel`)
- State variables: `camelCase` with descriptive names (`showSidePanel`, `pendingConfirmUser`)

### Props Pattern
- Child-to-parent communication: callback props prefixed with `on` (`onClose`, `onMessageSent`)
- Boolean toggles: `show` prefix (`showSidePanel`, `showMobileMenu`)
- Active state: `active` prefix or `activeConvId`

### State Management
- Local component state for UI toggles
- `useSettingsState()` hook for settings (auto-saves to Firestore)
- Real-time Firestore listeners for messages, conversations, notifications
- `useRef` for timers, DOM refs, and mutable values that don't trigger re-renders

### File Organization
- `ChatPage.jsx` — orchestrates everything, contains view system + inline components
- `SettingsModal.jsx` — settings hook + panel (reusable exports)
- `SidePanel.jsx` — right panel with info, members, wallpaper
- `chatService.js` — all Firestore CRUD operations
- `settingsService.js` — theme application logic
- `index.css` — all styles (no CSS modules, no styled-components)
