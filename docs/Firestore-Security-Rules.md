# Firestore Security Rules

## Quick Start (permissive — for development)

Paste this in **Firebase Console > Firestore > Rules** and click **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows any authenticated user to read/write all collections. Use this to get the app working, then switch to the granular rules below.

## Granular Rules (production)

Once everything works, deploy these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isUser(userId) {
      return request.auth.uid == userId;
    }

    // ── Users ────────────────────────────────────────────────────────────
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isUser(userId);
      allow update: if isUser(userId);
      allow delete: if false;
    }

    // ── Conversations ────────────────────────────────────────────────────
    match /conversations/{conversationId} {
      allow read: if isAuthenticated()
        && request.auth.uid in resource.data.participants;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated()
        && request.auth.uid in resource.data.participants;
      allow delete: if false;
    }

    // ── Messages ─────────────────────────────────────────────────────────
    match /messages/{messageId} {
      allow read: if isAuthenticated()
        && request.auth.uid in
          get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participants;
      allow create: if isAuthenticated()
        && request.auth.uid in
          get(/databases/$(database)/documents/conversations/$(request.resource.data.conversationId)).data.participants;
      allow update: if isAuthenticated()
        && resource.data.senderId == request.auth.uid
        && request.auth.uid in
          get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participants;
      allow delete: if isAuthenticated()
        && resource.data.senderId == request.auth.uid;
    }
  }
}
```

**Key difference**: For conversations, use `resource.data.participants` (the document being accessed) instead of `get()` to avoid recursive security rule evaluation issues.

## Required Indexes

Create these from **Firebase Console > Firestore > Indexes**:

| Collection | Fields | Used by |
|---|---|---|
| `conversations` | `participants` (Array), `updatedAt` (Descending) | Chat list sidebar |
| `messages` | `conversationId` (Ascending), `timestamp` (Ascending) | Message list per conversation |
