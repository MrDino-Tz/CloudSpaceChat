# Presence & Notifications — WhatsApp-like behavior (web + Android)

This document describes how online presence and notifications are implemented on both
clients and what the backend expects, so the two platforms stay in parity.

## Presence

| Aspect | Web (`CloudSpaceChat`) | Android (`OpenSpaceChat`) |
|---|---|---|
| Online write | `usePresence` → `setUserOnline` (`isOnline: true` + `lastSeen: serverTimestamp()`) | `PresenceManager` → `UserRepo.setOnline` (same shape) |
| Offline write | `setUserOffline` (`isOnline: false` + `lastSeen`) | `PresenceManager` → `UserRepo.setOffline` |
| Triggers | `visibilitychange`, `focus`, `blur`, `online`, `offline`, `pagehide`, heartbeat, presence-setting change, unmount/offline writes | `App` lifecycle callbacks (resume/pause), `ConnectivityManager` network callback, heartbeat, sign-in/out |
| Heartbeat | 45 s interval while visible + online | 45 s interval while foreground + network available |
| Freshness filter | `isUserOnline(profile)` — `lastSeen` within `PRESENCE_STALE_MS` (2 min) | `UserProfile.onlineNow()` — same 2 min window |
| Stale `isOnline` handling | Crashed/killed tabs expire via heartbeat freshness check | Online-user listeners re-filter and re-emit every 60 s (plus on snapshots) |
| Privacy | `presenceVisible` setting (web local toggle + Firestore write; Android settings → `PresenceManager.refresh()`) | Same flag via `csc_settings` / `settings/{uid}` |

Online status must never rely on a one-shot `isOnline` flag alone: crashed processes may
skip the offline write. Both clients therefore combine the flag with a heartbeat-driven
`lastSeen` freshness check.

## Notifications

| Aspect | Web | Android |
|---|---|---|
| Delivery path | Service worker (`public/sw.js`) → `registration.showNotification()`; safe fallback to `new Notification()` wrapped in try/catch (mobile Chrome rejects the constructor) | FCM data push → `FcmService` |
| Tab state | In-app toast while `document.visibilityState === "visible"`; system notification only when hidden; per-conversation `tag` dedupe; in-app sound; DND respected | In-app banner while app foregrounded; system notification only when backgrounded/closed; active-conversation pushes dropped |
| Permission | Requested on first user gesture (`pointerdown`), not on mount | Requested at runtime after login/first relevant action |
| Settings source | `settings/{uid}` (`notificationsEnabled`, DND window) | `csc_settings` local mirror + `settings/{uid}` sync; same checks |
| Multi-device | Backend fans out across `fcmTokens` array | Backend fans out across `fcmTokens` array |

### Backend (`functions/`)

- `onMessageCreated` reads recipient prefs from `settings/{uid}.notificationsEnabled` (falls
  back to the legacy user-doc flag) and sends to every token in the user's `fcmTokens` array
  (legacy single `fcmToken` still supported).
- Stale registration tokens (`messaging/invalid-registration-token` / `...-not-registered`) are
  cleaned up from the array.

### Known limitations

- True closed-tab web push (service-worker push from a server) is not implemented yet; current
  web support covers in-app + notifications while the tab is open/backgrounded, exactly like a
  WhatsApp web session.
- Android has no device-emulator connectivity in the dev environment, so runtime behavior
  (heartbeat, foreground gating) should be verified on a real device or emulator before release.
