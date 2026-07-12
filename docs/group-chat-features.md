# Group Chat Features

## ✅ Done

| Feature | Details | Location |
|---------|---------|----------|
| **Group Creation** | Modal with group name field + searchable user list for member selection. Creator auto-set as admin. Shows user-facing errors on failure. | `GroupCreateModal.jsx`, `createGroupConversation()` in `chatService.js` |
| **Group Display in Chat List** | Shows group name + avatar (if set) or letter fallback in sidebar conversation list. Gray status dot (no online indicator for groups). | `ChatPage.jsx:28-42` |
| **Group Header** | Shows group name, avatar (if set), member count | `ChatPage.jsx` |
| **Send Messages in Group** | Works identically to private chats — `sendMessage` is conversation-type-agnostic | `chatService.js:81` |
| **Receive Messages in Group** | `listenToMessages` filters by `conversationId` only, no type distinction | `chatService.js:106` |
| **Sender Display per Message** | MessageBubble shows sender avatar + display name for all incoming messages | `ChatPage.jsx` |
| **Member List in Side Panel** | Shows member avatars with "See all" toggle. Admin badge (★) on admin avatars. "You" badge on current user. | `SidePanel.jsx:139-178` |
| **Add Members** | Modal with searchable user list, adds via `addMemberToGroup()`, sends system message | `SidePanel.jsx`, `chatService.js` |
| **Remove Members** | Right-click/context menu on member avatar → "Remove from group". Only admins can remove others. Confirmation dialog. | `SidePanel.jsx` |
| **Make/Remove Admin** | Right-click context menu on member avatar → "Make admin" / "Remove admin". Only admins can toggle. | `SidePanel.jsx`, `toggleAdmin()` in `chatService.js` |
| **Leave Group** | Button in group actions section. Confirmation dialog. Calls `leaveGroup()`. | `SidePanel.jsx`, `chatService.js` |
| **Delete Group** | Admin-only button in group actions. Confirmation dialog. Calls `deleteGroup()` (soft-delete with `isDeleted` flag). | `SidePanel.jsx`, `chatService.js` |
| **Edit Group Info** | Admin-only modal to edit group name and description. Calls `updateGroupInfo()`. | `SidePanel.jsx`, `EditGroupModal` |
| **Group Description** | Displayed in Side Panel when `conversation.description` exists | `SidePanel.jsx:88` |
| **Group Avatar** | Displayed in chat header, side panel, and sidebar list when set on the conversation doc | `ChatPage.jsx`, `SidePanel.jsx` |
| **System / Event Messages** | System messages (e.g. "X was added", "X was removed") rendered as centered pill-shaped muted messages. Skipped in sender lookup. | `sendSystemMessage()` in `chatService.js`, `MessageBubble` in `ChatPage.jsx` |
| **Shared Media/Files/Links** | SidePanel shows shared media, files, and links — works for both group and private | `SidePanel.jsx` |
| **Admins Field** | `admins` array set to `[createdBy]` on creation. Read for admin badge and admin-only UI. | `chatService.js:37`, `SidePanel.jsx` |

## ❌ Not Done / Missing

| Feature | Notes |
|---------|-------|
| **Typing Indicators** | `typing: {}` stored in conversation doc but never updated or displayed. |
| **Read Receipts for Groups** | `CheckTicks` shows "read" when `readBy.length > 1` — no "read by X of Y" or "read by all" distinction. |
| **Mute / Archive / Pin** | Fields exist in conversation doc (`mutedBy`, `archivedBy`, `pinnedBy`) but never used in UI or service. |
| **Unread Counts** | `unreadCount: {}` stored but never populated or displayed. |
| **Group Avatar Upload During Creation** | No avatar upload UI in GroupCreateModal (`avatar` field left empty). |
| **Group Description During Creation** | Not included in creation form (only editable after via EditGroupModal). |
| **Search Within Members List** | No search/filter for the members list in SidePanel. |
| **Message Info for Groups** | "Read by" / "Delivered to" in MessageInfoModal shows UIDs but never contextualized as group-specific. |
| **Online Presence per Member** | No per-member online status indicators in the group member list. |

## Key files

| File | Role |
|------|------|
| `src/components/GroupCreateModal.jsx` | Group creation UI |
| `src/components/SidePanel.jsx` | Group info, member list (with admin badges, context menus), add/edit/leave/delete actions |
| `src/components/ChatPage.jsx` | Message rendering, conversation list with group avatars, chat header, system message handling |
| `src/lib/chatService.js` | All CRUD operations: `createGroupConversation`, `addMemberToGroup`, `removeMemberFromGroup`, `leaveGroup`, `deleteGroup`, `updateGroupInfo`, `toggleAdmin`, `sendSystemMessage` |
