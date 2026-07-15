# CloudSpaceChat — Documentation Index

## Platform Overview

CloudSpaceChat is a real-time chat application built with React 19, Vite 8, Firebase (Firestore + Auth), and Tailwind CSS. It supports private messaging, group chats, media sharing, and a fully customizable UI theme system.

**Live:** https://MrDino-Tz.github.io/CloudSpaceChat/  
**Repo:** https://github.com/MrDino-Tz/CloudSpaceChat

---

## Documentation

### Features & Architecture

| Document | Scope |
|----------|-------|
| [UX Improvements](./UX_IMPROVEMENTS.md) | Confirmation popups, inline settings panel, per-chat wallpapers, dark mode fixes, chat search, typing indicator |
| [Color Branding & Theming](./COLOR_BRANDING.md) | CSS variable system, theme presets, dark mode, bubble styles, wallpapers, runtime overrides |
| [UI Component Patterns](./UI_COMPONENTS.md) | Reusable component conventions, spacing, colors, typography, responsive behavior |

### Existing Feature Docs

| Document | Scope |
|----------|-------|
| [Chat Encryption Timestamps](./chat-encryption-timestamps.md) | Encryption banner and message timestamps |
| [Chat Request OTP Flow](./chat-request-otp-flow.md) | Friend request system with OTP verification |
| [Group Chat Features](./group-chat-features.md) | Group creation, admin controls, member management |
| [Link Security Scanning](./link-security-scanning.md) | URL safety scanning and trusted domains |
| [Firestore Security Rules](./Firestore-Security-Rules.md) | Backend security rules |
| [Complete Project Documentation](./CloudChat-Platform-Complete-Project-Documentation.md) | Full platform overview |

---

## Project Structure

```
src/
├── components/
│   ├── ChatPage.jsx          # Main chat view, message list, input, view system
│   ├── SettingsModal.jsx     # Settings panel + useSettingsState hook
│   ├── SidePanel.jsx         # Right-side panel (info, members, wallpaper, settings)
│   ├── GroupCreateModal.jsx  # Group creation UI
│   ├── MessageBubble.jsx     # Individual message rendering (inline in ChatPage)
│   └── ui/                   # Reusable primitives (AuthPage, particles, button)
├── contexts/
│   └── AuthContext.jsx       # Firebase auth context + useAuth hook
├── hooks/
│   ├── useMessages.js        # Message listener hook
│   └── usePresence.js        # Online presence tracking
├── lib/
│   ├── chatService.js        # Conversation/message CRUD, typing indicators
│   ├── requestService.js     # Friend requests, OTP, notifications
│   ├── settingsService.js    # Theme application, settings persistence
│   ├── mediaService.js       # Cloudinary upload integration
│   ├── firebase.js           # Firebase config + initialization
│   ├── avatar.js             # Avatar fallback/URL helpers
│   └── time.js               # Timestamp formatting utilities
└── index.css                 # All CSS (3800+ lines, CSS variables, dark mode)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8 |
| Styling | CSS custom properties, Tailwind CSS (minimal) |
| Backend | Firebase Firestore (real-time), Firebase Auth |
| Media | Cloudinary (images, video, audio, files) |
| Linting | Oxlint |
| Hosting | GitHub Pages |

---

## Quick Reference — Settings System

The settings system lives in three layers:

1. **`DEFAULTS`** in `settingsService.js` — default values for all settings
2. **`useSettingsState()`** in `SettingsModal.jsx` — React hook that loads/saves settings and auto-applies on toggle
3. **`applyTheme()` + `applyStyleOverrides()`** in `settingsService.js` — writes CSS variables to `document.documentElement.style`

Settings are persisted per-user in Firestore (`users/{uid}.settings`) with localStorage fallback for presence/incognito.

---

## Development

```bash
npm install
npm run dev        # Vite dev server
npm run build      # Production build
cmd /c "npm run lint"   # Oxlint (PowerShell requires cmd wrapper)
```
