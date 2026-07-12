# Chat Request & OTP Verification Flow

## Overview

Instead of directly creating a conversation when a user clicks on a found user, a **request-based handshake** is performed. The sender sends a request, the receiver accepts/denies, and a **mutual 6-digit code verification** establishes trust before the chat opens.

---

## Firestore Collections

### `chat_requests/{requestId}`

| Field | Type | Description |
|---|---|---|
| `senderId` | string | UID of requester |
| `receiverId` | string | UID of requested user |
| `status` | string | `"pending"` \| `"accepted"` \| `"denied"` |
| `code` | string | 6-digit random code (generated on accept) |
| `receiverEntered` | boolean | Receiver has typed the code back |
| `codeVerified` | boolean | Sender entered matching code |
| `createdAt` | Timestamp | When request was sent |
| `updatedAt` | Timestamp | Last status change |

### `notifications/{notificationId}`

| Field | Type | Description |
|---|---|---|
| `userId` | string | Who receives this notification |
| `type` | string | `"chat_request"` \| `"request_accepted"` \| `"request_denied"` |
| `title` | string | Short title |
| `body` | string | Descriptive message |
| `data` | map | `{ senderId, receiverId, requestId, senderName, senderAvatar }` |
| `read` | boolean | Has the user seen/dismissed it |
| `createdAt` | Timestamp | When notification was created |

---

## Flow Diagram — Sender Side

```
1. USER clicks a found user in "Find People"
       │
       ▼
2. sendChatRequest(senderId, receiverId)
   → creates chat_requests doc (status: "pending")
   → creates notification doc for receiver
   → opens RequestPopup modal
       │
       ▼
3. Popup shows: "Waiting for <name> to respond..."
   (listens to request doc via onSnapshot)
       │
       ▼
4. Receiver accepts → request.status = "accepted"
       │
       ▼
5. Popup updates: "<name> confirmed. Enter the 6-digit code:"
   Shows: [__][__][__][__][__][__] with auto-focus
       │
       ▼
6. Sender enters the code they received from receiver
       │
       ▼
7. verifyCode(requestId, enteredCode) → matches stored code
   → request.codeVerified = true
   → createPrivateConversation(senderId, receiverId)
   → close popup, set activeConvId, switch to chats view
```

## Flow Diagram — Receiver Side

```
1. Notification appears in the collapsible "Notifications" section
       │
       ▼
2. Receiver sees: "<name> sent you a chat request"
   Buttons: [Accept] [Deny]
       │
       ▼
3a. ACCEPT clicked:
   → acceptRequest(requestId)
   → request.status = "accepted"
   → generates 6-digit code (Math.floor(100000 + random * 900000))
   → stores code in request doc
   → creates notification for sender: "<name> accepted"
   → shows code to receiver in a confirmation view
       │
       ▼
   Receiver sees:
   ┌──────────────────────────┐
   │  Share this code with    │
   │  them:                   │
   │  ┌──────────────────────┐│
   │  │      482913          ││
   │  └──────────────────────┘│
   │                          │
   │  Type the code to confirm│
   │  [__][__][__][__][__][__]│
   │  [Submit] [Regenerate]   │
   └──────────────────────────┘
       │
       ▼
   Receiver types the code → request.receiverEntered = true
   → Sender's popup now shows the code input
   → Both have now verified → conversation is created
   → Receiver gets redirect to new chat

3b. DENY clicked:
   → denyRequest(requestId)
   → request.status = "denied"
   → notification for sender: "<name> declined your request"
```

---

## Data Flow Summary

```
SENDER                    FIRESTORE                    RECEIVER
  │                          │                          │
  │── sendChatRequest() ────→│  chat_requests: pending  │
  │                          │  notifications: ...      │←── onSnapshot ──│
  │                          │                          │── [Accept] ────→│
  │                          │  status: "accepted"      │                 │
  │                          │  code: "482913"          │                 │
  │←── onSnapshot ──────────│                          │                 │
  │                          │                          │── type code ───→│
  │                          │  receiverEntered: true   │                 │
  │←── onSnapshot ──────────│                          │                 │
  │── type code ───────────→│                          │                 │
  │                          │  codeVerified: true      │                 │
  │                          │                          │                 │
  │── createConversation() ─→│  conversations: { ... }  │←── chat opens ──│
  │                          │                          │                 │
```

---

## Code Generation Algorithm

```javascript
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

Produces a uniformly distributed 6-digit string `"100000"` – `"999999"`.

---

## Firestore Security Rules (suggested)

```javascript
match /chat_requests/{requestId} {
  allow create: if request.auth.uid == request.resource.data.senderId;
  allow read: if request.auth.uid in [resource.data.senderId, resource.data.receiverId];
  allow write: if request.auth.uid in [resource.data.senderId, resource.data.receiverId];
}
match /notifications/{notificationId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if request.auth.uid == resource.data.userId;
  allow create: if true;  // allow server/client creation
}
```

---

## Implementation Files

| File | Action | Purpose |
|---|---|---|
| `src/lib/requestService.js` | **Create** | All Firestore operations for requests & notifications |
| `src/components/ChatPage.jsx` | **Modify** | New state, effects, notification section, RequestPopup |
| `src/index.css` | **Modify** | Styles for notifications, popup, OTP boxes |

---

## Component States — RequestPopup

| `popupStep` | What sender sees |
|---|---|
| `"pending"` | ⏳ Waiting for <name> to respond... [Cancel] |
| `"accepted"` | ✅ <name> confirmed. Enter code: [__][__][__][__][__][__] [Submit] |
| `"verified"` | 🎉 Verified! Redirecting to chat... (auto-closes) |
| `"denied"` | ❌ <name> declined your request [Close] |

## Component States — Notification Item

| `type` | What receiver sees | Actions |
|---|---|---|
| `"chat_request"` | <name> sent you a chat request | [Accept] [Deny] |
| `"request_accepted"` | (sender side — not shown to receiver) | — |
| `"request_denied"` | (sender side — not shown to receiver) | — |

---

## Edge Cases

- **Receiver regenerates code**: Old code invalidated, new code stored, sender must re-enter
- **Multiple requests to same user**: Each is independent; user can accept/deny individually
- **Request expires**: No expiry currently; could add `createdAt` cleanup in future
- **Both users send request to each other**: First one accepted proceeds, other auto-denied
- **User logs out during flow**: Popup cleared on unmount; re-query pending requests on login
