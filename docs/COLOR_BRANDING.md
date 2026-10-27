# Color Branding & Theming System

Complete reference for CloudSpaceChat's theming architecture, CSS variables, theme presets, and style customization.

---

## Architecture

The theming system operates in three layers:

```
1. CSS :root variables     →  Base light-mode palette (index.css)
2. html[data-theme="dark"] →  Dark mode overrides (index.css)
3. JS runtime overrides    →  applyTheme() + applyStyleOverrides() (settingsService.js)
```

Layer 3 (JS) overrides Layers 1-2 (CSS) via inline styles on `document.documentElement.style`. Each color theme sets `--primary-color` (fills) and `--primary-accent` (text/icons); the two diverge in dark mode. Dark/light mode is controlled by the presence or absence of `data-theme="dark"` on the `<html>` element.

---

## Color Decisions (recorded 2026-10-28)

| Decision | Value | Why |
|---|---|---|
| Brand primary (replaces the old orange `#F59B1D`) | `#111827` | User-selected brand navy for the whole platform |
| Brand accent defaults | `--primary-accent: #111827` | Accent text/icons/links in light mode |
| Dark-mode accent | `--primary-accent: #e5e7eb` | The navy is ~1.1:1 against black, so accent text/icons/fills invert in dark mode |
| Filled brand surfaces | `--primary-color: #111827` | Buttons, badges, avatars keep the navy (white content stays readable) |
| Dark filled brand elements | `--primary-accent` background + `#111827` content | Small fills use the light accent in dark mode so they remain visible |
| Neutral page frame | `#f3f4f6` light · `#000000` dark | Replaced the old `#fff4e5` orange frame |
| Outgoing bubble | `#1a1a1a` | Unchanged near-black bubble, consistent with the navy direction |
| Avatar fallback background | `#111827` | Same brand navy behind the white initial |
| Accent themes | purple `#8b5cf6`, blue `#3b82f6`, green `#22c55e` | Unchanged — already readable on dark |
| Unrelated semantic accent | `#f97316` (`.icon-orange`) | Deliberately kept out of the brand palette |

### Auth provider buttons (`.auth-btn`)

| Property | Value |
|---|---|
| Background | `var(--brand-dark)` = `#111827` |
| Text / icon | `#FFFFFF` (`currentColor`) |
| Shape | 8px radius, no border |
| Padding / gap | `12px 20px` / `8px` |
| Text | 14px, weight 500 |
| Hover | `opacity: 0.85` |
| “Last used” badge | `rgba(255,255,255,0.15)` bg, 4px radius, 10px/600 uppercase |
| Divider line | `#e5e7eb` light · `#262626` dark |
| Divider text | `#8a8d91` light · `#a3a3a3` dark |

---

## CSS Variables Reference

### Base Variables (`:root`)

| Variable | Value | Purpose |
|----------|-------|---------|
| `--primary-color` | `#111827` | Brand navy — filled buttons, bubbles, badges |
| `--primary-accent` | `#111827` | Accent text, icons, links, focus borders |
| `--bg-main` | `#f8f9fa` | Light gray background for chat list panel |
| `--bg-white` | `#ffffff` | White backgrounds (modals, cards) |
| `--text-main` | `#1a1a1a` | Primary text color |
| `--text-secondary` | `#8a8d91` | Muted/secondary text |
| `--border-color` | `#e5e7eb` | Borders and dividers |
| `--hover-bg` | `#f3f4f6` | Hover states, card backgrounds, incoming messages |
| `--msg-incoming` | `#f3f4f6` | Incoming message bubble background |
| `--msg-outgoing` | `#1a1a1a` | Outgoing message bubble background (black) |
| `--icon-color` | `#6b7280` | Icon stroke/fill color |
| `--bubble-radius` | `16px` | Message bubble border-radius |
| `--bubble-tail` | `0` | Classic tail visibility (0 = off, 1 = on) |
| `--msg-font-size` | `14px` | Message text font size |
| `--chat-bg` | `none` | Chat area wallpaper (color or `url(...)`) |
| `--chat-bg-size` | `auto` | Wallpaper sizing (`auto` or `cover`) |
| `--brand-dark` | `#111827` | Dark brand color (used in AuthPage) |

### Dark Mode Overrides (`html[data-theme="dark"]`)

| Variable | Light | Dark |
|----------|-------|------|
| `--bg-main` | `#f8f9fa` | `#000000` |
| `--bg-white` | `#ffffff` | `#000000` |
| `--text-main` | `#1a1a1a` | `#f5f5f5` |
| `--text-secondary` | `#8a8d91` | `#a3a3a3` |
| `--border-color` | `#e5e7eb` | `#262626` |
| `--hover-bg` | `#f3f4f6` | `#111111` |
| `--msg-incoming` | `#f3f4f6` | `#111111` |
| `--icon-color` | `#6b7280` | `#a3a3a3` |
| `--primary-accent` | `#111827` | `#e5e7eb` |
| body `background` | `#f3f4f6` | `#000000` |
| scrollbar thumb | `var(--border-color)` | `#2e2e2e` |
| modal border | `var(--border-color)` | `#2a2a2a` |

### Additional Dark Mode (AuthPage.css)

| Selector | Override |
|----------|----------|
| `.form-error` | `background: #3b1111; color: #fca5a5` |
| `.auth-glow-1` | Reduced opacity radial gradient |
| `.auth-glow-2`, `.auth-glow-3` | Subtle white radial gradient |
| `.auth-particles canvas` | `opacity: 0.4; filter: invert(1)` |
| `.form-input:-webkit-autofill` | Matches dark background |

---

## Theme Presets

### Available Themes

| ID | Label | `--primary-color` | Dark Mode? | Swatch BG |
|----|-------|--------------------|------------|-----------|
| `light` | Light | `#111827` (navy) | No | `#f3f4f6` |
| `dark` | Dark | `#111827` (navy, accent `#e5e7eb`) | Yes | `#1a1a1a` |
| `purple` | Purple | `#8b5cf6` | No | `#f5f3ff` |
| `blue` | Blue | `#3b82f6` | No | `#eff6ff` |
| `green` | Green | `#22c55e` | No | `#f0fdf4` |

**Note:** The `bg` values in the picker are only for the swatch preview — they are not applied as CSS variables. The theme sets both `--primary-color` (fills) and `--primary-accent` (text/icons), which diverge in dark mode so the navy stays readable. The `dark` theme is the only one that sets `data-theme="dark"`.

### Default Theme

```js
theme: "dark"  // DEFAULTS.theme in settingsService.js
```

### How `applyTheme()` Works

```js
// settingsService.js:38-54
export function applyTheme(themeId) {
  const THEMES = {
    light: { primary: "#111827", accent: "#111827" },
    dark:  { primary: "#111827", accent: "#e5e7eb" },
    purple: { primary: "#8b5cf6", accent: "#8b5cf6" },
    blue:   { primary: "#3b82f6", accent: "#3b82f6" },
    green:  { primary: "#22c55e", accent: "#22c55e" },
  };
  const t = THEMES[themeId];
  if (t) {
    document.documentElement.style.setProperty("--primary-color", t.primary);
    document.documentElement.style.setProperty("--primary-accent", t.accent);
  }

  if (themeId === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}
```

---

## Bubble Styles

### Options

| Style | `--bubble-radius` | `--bubble-tail` | Visual |
|-------|--------------------|-----------------|--------|
| `blocky` | `8px` | `0` | Square-ish corners, no tail |
| `rounded` | `16px` | `0` | Round corners, no tail (default) |
| `classic` | `16px` | `1` | Round corners + triangular CSS tail |

### Mapping

```js
// settingsService.js:63-65
const radii = { blocky: "8px", rounded: "16px", classic: "16px" };
root.style.setProperty("--bubble-radius", radii[settings.bubbleStyle] || "16px");
root.style.setProperty("--bubble-tail", settings.bubbleStyle === "classic" ? "1" : "0");
```

### Tail CSS Implementation

Classic tails are drawn using `::before` pseudo-elements with CSS borders:

```css
/* Incoming tail (bottom-left) */
.message-wrapper.incoming .message-bubble[data-tail="1"]::before {
  content: "";
  position: absolute;
  left: -8px;
  bottom: 0;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-right-color: var(--msg-incoming);
  border-bottom-color: var(--msg-incoming);
}

/* Outgoing tail (bottom-right) */
.message-wrapper.outgoing .message-bubble[data-tail="1"]::before {
  content: "";
  position: absolute;
  right: -8px;
  bottom: 0;
  width: 0;
  height: 0;
  border: 8px solid transparent;
  border-left-color: var(--msg-outgoing);
  border-bottom-color: var(--msg-outgoing);
}
```

The `data-tail` attribute is set on `.message-bubble` based on `settings.bubbleStyle === "classic"`.

---

## Wallpaper System

### Global Wallpaper (Settings)

| Value | `--chat-bg` | `--chat-bg-size` | Effect |
|-------|-------------|-------------------|--------|
| `"none"` | `none` | — | No wallpaper |
| `#f0f0f0` | `#f0f0f0` | `auto` | Light gray |
| `#e8f5e9` | `#e8f5e9` | `auto` | Soft green |
| `#e3f2fd` | `#e3f2fd` | `auto` | Soft blue |
| `#fce4ec` | `#fce4ec` | `auto` | Soft pink |
| `"custom"` + URL | `url(https://...)` | `cover` | Background image |

### Resolution Logic

```js
// settingsService.js:72-79
const wp = settings.wallpaper === "custom" ? (settings.wallpaperUrl || "none") : settings.wallpaper;
if (wp && wp !== "none") {
  const isUrl = wp.startsWith("http") || wp.startsWith("/");
  root.style.setProperty("--chat-bg", isUrl ? `url(${wp})` : wp);
  root.style.setProperty("--chat-bg-size", isUrl ? "cover" : "auto");
} else {
  root.style.setProperty("--chat-bg", "none");
}
```

### Per-Chat Wallpaper

- Stored as `conversation.wallpaper` in Firestore
- Uploaded to Cloudinary: `wallpapers/{conversationId}/{filename}`
- Applied via inline style on `.messages-container` in `ChatPage.jsx`
- Managed from the SidePanel's "Chat Wallpaper" section

```jsx
// ChatPage.jsx:1496
<div className="messages-container"
  style={activeConv?.wallpaper
    ? { backgroundImage: `url(${activeConv.wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined}>
```

---

## Settings That Trigger Style Overrides

The `useSettingsState()` hook calls `applyStyleOverrides()` when these keys change:

| Key | What it affects |
|-----|-----------------|
| `theme` | Calls `applyTheme()` directly — changes `--primary-color` and dark mode |
| `bubbleStyle` | Changes `--bubble-radius` and `--bubble-tail` |
| `fontSize` | Changes `--msg-font-size` |
| `fontFamily` | Changes `--msg-font-family` |
| `wallpaper` | Changes `--chat-bg` and `--chat-bg-size` |
| `wallpaperUrl` | Changes `--chat-bg` and `--chat-bg-size` (when `wallpaper === "custom"`) |

```js
// SettingsModal.jsx:35
if (key === "theme") applyTheme(value);
if (["bubbleStyle", "fontSize", "fontFamily", "wallpaper", "wallpaperUrl"].includes(key)) {
  applyStyleOverrides(next);
}
```

`applyStyleOverrides()` maps `fontFamily` to `--msg-font-family`.

---

## Font Size Options

| Value | `--msg-font-size` |
|-------|--------------------|
| `small` | `13px` |
| `medium` | `14px` (default) |
| `large` | `16px` |

---

## Font Style Options

Fonts are loaded from Google Fonts via `@import` at the top of `src/index.css` (Inter, Nunito, Poppins, Quicksand, Patrick Hand, Dancing Script, Caveat, Pacifico, Shadows Into Light, Kalam).

| Value | `--msg-font-family` (source) |
|-------|-------------------------------|
| `system` (default) | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| `modern` | Inter, Segoe UI, Helvetica Neue, Arial, sans-serif |
| `rounded` | Nunito, Segoe UI, Arial, sans-serif |
| `poppins` | Poppins, Segoe UI, Arial, sans-serif |
| `clean` | Quicksand, Segoe UI, Arial, sans-serif |
| `handwritten` | Patrick Hand, Comic Sans MS, cursive |
| `dancing` | Dancing Script, cursive |
| `caveat` | Caveat, cursive |
| `pacifico` | Pacifico, cursive |
| `shadows` | Shadows Into Light, cursive |
| `kalam` | Kalam, cursive |
| `serif` | Georgia, Times New Roman, serif |
| `mono` | Courier New, Consolas, Menlo, monospace |

Applied to message bubbles via `font-family: var(--msg-font-family)` on `.message-bubble`.
Live preview in Settings (Message Bubbles) uses the same stacks.

---

## Adding a New Theme

To add a new color theme:

1. Add entry to `THEMES` in `applyTheme()` (`settingsService.js:39-46`):
   ```js
   red: { primary: "#ef4444", accent: "#ef4444" },
   ```
   For a dark brand color, give the theme a lighter `accent` (see the `dark` entry).

2. Add entry to `THEMES` array in `SettingsPanel` (`SettingsModal.jsx:14-20`):
   ```js
   { id: "red", label: "Red", primary: "#ef4444", bg: "#fef2f2" },
   ```

No CSS changes needed — the system is fully runtime-driven via `--primary-color`.

---

## Adding a New CSS Variable

1. Define default in `:root` (`index.css:1-23`)
2. Add dark override in `html[data-theme="dark"]` (`index.css:25-34`)
3. Add runtime override in `applyStyleOverrides()` (`settingsService.js:56-80`) if it needs to be user-configurable
4. Add to the trigger list in `useSettingsState().update()` (`SettingsModal.jsx:42-46`) if it should auto-save

---

## Key Files

| File | Role |
|------|------|
| `src/index.css` | All CSS variables, dark mode overrides, bubble tail pseudo-elements, typing animation |
| `src/lib/settingsService.js` | `applyTheme()`, `applyStyleOverrides()`, `DEFAULTS`, theme presets |
| `src/components/SettingsModal.jsx` | `useSettingsState()` hook, `SettingsPanel` component, theme picker UI |
| `src/components/ui/AuthPage.css` | Additional dark mode overrides for auth pages |
