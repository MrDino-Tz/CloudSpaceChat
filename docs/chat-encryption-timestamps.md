# Chat Privacy & Timestamps

## End-to-End Encryption Indicator

A banner is shown at the top of every conversation:

```
🔒 Messages are end-to-end encrypted. No one outside of this chat can read them.
```

- Displayed inside the `.messages-container`, above the first message
- Includes a lock icon (SVG) colored with `--primary-color`
- Purely visual — the app uses standard Firebase Firestore for message storage (encrypted in transit via TLS, stored encrypted at rest by Firebase). The banner reflects the stated privacy model of the platform.

**Location:** `ChatPage.jsx` — rendered inside the `.messages-container` div as the first child.

## Smart Timestamps

### Message Bubbles
Each message shows its time using `formatMsgTime()` from `src/lib/time.js`:

| Scenario | Format | Example |
|----------|--------|---------|
| Today | Time only | `2:34 PM` |
| Yesterday | Word | `Yesterday` |
| This week (within 6 days) | Day name | `Monday` |
| This year | Month + day | `Jan 15` |
| Older years | Full date | `Jan 15, 2023` |

### Conversation List
Each conversation shows its last activity time using `formatConvTime()` from `src/lib/time.js`:

| Scenario | Format | Example |
|----------|--------|---------|
| Today | Time only | `2:34 PM` |
| Yesterday | Word | `Yesterday` |
| Older | Month + day | `Jan 15` |

### Date Separators
Between messages from different days, a centered pill separator is inserted:

```
[ Today ]
[ Yesterday ]
[ Monday, January 15, 2024 ]
```

- Uses `formatDateSeparator()` which returns "Today", "Yesterday", or the full date
- Added by comparing `getDateKey()` (YYYY-M-D) of consecutive messages in the messages array

**Location:** All timestamp logic in `src/lib/time.js`, consumed in `ChatPage.jsx`.

## System Messages (Group Events)

When group membership changes, a system message is automatically posted:

| Event | Example message |
|-------|----------------|
| Group created | `Group created` |
| Member added by admin | `John was added to the group` |
| Self added by admin | `You were added to the group` |
| Member removed | `John was removed from the group` |

System messages are rendered as centered pill-shaped muted text (different from regular user messages). They skip sender avatar/name lookup.

**Key files:**
- `src/lib/time.js` — all timestamp formatting functions
- `src/components/ChatPage.jsx` — `MessageBubble` component, message rendering with date separators, encryption banner
- `src/components/SidePanel.jsx` — `AddMemberModal` sends system messages on member add/remove
- `src/components/GroupCreateModal.jsx` — sends `"Group created"` system message
- `src/lib/chatService.js` — `sendSystemMessage()` function
