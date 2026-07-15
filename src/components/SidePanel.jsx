import { useState, useEffect } from "react";
import { getUserProfile, getAllUsers } from "@/lib/userService";
import { fetchSharedMedia, fetchSharedFiles, fetchSharedLinks, fetchMediaCount } from "@/lib/mediaService";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import {
  addMemberToGroup,
  removeMemberFromGroup,
  leaveGroup,
  deleteGroup,
  updateGroupInfo,
  updateConversationFields,
  toggleAdmin,
  sendSystemMessage,
} from "@/lib/chatService";

const FILE_ICONS = {
  docx: { color: "#3b82f6", label: "DOCX" },
  doc: { color: "#3b82f6", label: "DOC" },
  xls: { color: "#22c55e", label: "XLS" },
  xlsx: { color: "#22c55e", label: "XLSX" },
  pdf: { color: "#ef4444", label: "PDF" },
  ppt: { color: "#f97316", label: "PPT" },
  pptx: { color: "#f97316", label: "PPTX" },
  svg: { color: "#8b5cf6", label: "SVG" },
  zip: { color: "#6b7280", label: "ZIP" },
  rar: { color: "#6b7280", label: "RAR" },
};

function getFileIcon(name) {
  const ext = name?.split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] || { color: "#6b7280", label: (ext || "FILE").toUpperCase() };
}

function MemberRow({ member, isAdmin, isSelf, currentUserId, admins, onAction, onSelect }) {
  const [user, setUser] = useState(member);
  const [hover, setHover] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  useEffect(() => { if (member?.uid) getUserProfile(member.uid).then(setUser); }, [member?.uid]);
  const name = user?.displayName || "U";
  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${name}&background=F59B1D&color=fff`;
  return (
    <div
      className="member-row"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onSelect?.(user)}
      onContextMenu={(e) => { e.preventDefault(); setContextOpen(true); }}
      style={{ cursor: onSelect ? "pointer" : undefined }}
    >
      <div className="member-avatar-wrapper">
        <img className="member-avatar" src={avatarUrl} alt="" />
        {isAdmin && <div className="admin-badge" title="Admin">★</div>}
        {isSelf && <div className="self-badge">You</div>}
      </div>
      {contextOpen && onAction && !isSelf && admins?.includes(currentUserId) && (
        <>
          <div className="modal-backdrop" onClick={() => setContextOpen(false)} />
          <div className="member-actions-popup" onClick={(e) => e.stopPropagation()}>
            <div className="member-action-item" onClick={() => { setContextOpen(false); onAction("toggleAdmin", member.uid); }}>
              {isAdmin ? "Remove admin" : "Make admin"}
            </div>
            <div className="member-action-item member-action-danger" onClick={() => { setContextOpen(false); onAction("remove", member.uid); }}>
              Remove from group
            </div>
          </div>
        </>
      )}
      {hover && !isSelf && (
        <div className="member-tooltip">
          <div className="member-tooltip-name">{name}</div>
        </div>
      )}
    </div>
  );
}

function AddMemberModal({ conversationId, currentUserId, onClose, onMembersChanged }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getAllUsers(currentUserId).then(setUsers).catch(() => {});
  }, [currentUserId]);

  const filtered = users.filter(
    (u) =>
      !conversationId?.participants?.includes(u.uid) &&
      (u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())),
  );

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAdd = async (uid) => {
    setAdding(true);
    try {
      await addMemberToGroup(conversationId?.id, uid);
      const addedUser = users.find((u) => u.uid === uid);
      const addedName = addedUser?.displayName || "A user";
      const text = uid === currentUserId ? "You were added to the group" : `${addedName} was added to the group`;
      await sendSystemMessage(conversationId?.id, text);
      onMembersChanged?.();
    } catch (e) {
      console.error("Failed to add member:", e);
    } finally {
      setAdding(false);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="add-member-modal">
        <div className="add-member-header">
          <span>Add Members</span>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <input
          type="text"
          className="add-member-search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="add-member-list">
          {adding ? (
            <div className="add-member-loading">Adding...</div>
          ) : filtered.length === 0 ? (
            <div className="add-member-empty">No users found</div>
          ) : (
            filtered.map((u) => (
              <div key={u.uid} className="add-member-row" onClick={() => handleAdd(u.uid)}>
                {u.avatar ? (
                  <img className="add-member-avatar" src={getAvatarUrl(u)} alt="" />
                ) : (
                  <div className="add-member-letter">{getAvatarFallback(u.displayName)}</div>
                )}
                <div className="add-member-info">
                  <div className="add-member-name">{u.displayName}</div>
                  <div className="add-member-username">@{u.username || "user"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EditGroupModal({ conversation, onClose, onUpdated }) {
  const [name, setName] = useState(conversation?.name || "");
  const [desc, setDesc] = useState(conversation?.description || "");
  const [rules, setRules] = useState(conversation?.rules || "");
  const [avatar, setAvatar] = useState(conversation?.avatar || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      const result = await uploadToCloudinary(file, { folder: `groups/${conversation.id}` });
      setAvatar(result.secure_url);
    } catch (e) {
      console.error("Avatar upload failed:", e);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const changes = [];
      const orig = conversation;
      if (name.trim() !== orig.name) changes.push(`Group name changed to "${name.trim()}"`);
      if (desc.trim() !== (orig.description || "")) changes.push("Group description updated");
      if (rules.trim() !== (orig.rules || "")) changes.push("Group rules updated");
      if ((avatar || "") !== (orig.avatar || "")) changes.push("Group photo updated");

      await updateGroupInfo(conversation.id, {
        name: name.trim(),
        description: desc.trim(),
        rules: rules.trim(),
        avatar: avatar || "",
      });

      for (const msg of changes) {
        await sendSystemMessage(conversation.id, msg);
      }

      onUpdated?.();
      onClose();
    } catch (e) {
      console.error("Failed to update group:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-brand">Edit Group</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group" style={{ textAlign: "center", marginBottom: 16 }}>
            <label className="edit-group-avatar-label">
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
              {uploading ? (
                <div className="edit-group-avatar uploading">Uploading...</div>
              ) : avatar ? (
                <img className="edit-group-avatar" src={avatar} alt="" />
              ) : (
                <div className="edit-group-avatar edit-group-avatar-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
              )}
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Group description..." />
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Rules</label>
            <textarea className="form-input form-textarea" rows={3} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Group rules..." />
          </div>
          <button className="group-create-btn" onClick={handleSave} disabled={saving || uploading || !name.trim()}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SidePanel({ conversation, currentUserId, onClose, onOpenSettings, onConversationUpdated }) {
  const [media, setMedia] = useState([]);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [members, setMembers] = useState([]);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState(null);
  const [memberActions, setMemberActions] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [uploadingWp, setUploadingWp] = useState(false);

  const isGroup = conversation?.type === "group";
  const participants = conversation?.participants || [];
  const admins = conversation?.admins || [];
  const isAdmin = isGroup && admins.includes(currentUserId);

  const handleWallpaperUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversation?.id) return;
    setUploadingWp(true);
    try {
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      const result = await uploadToCloudinary(file, { folder: `wallpapers/${conversation.id}` });
      await updateConversationFields(conversation.id, { wallpaper: result.secure_url });
      onConversationUpdated?.();
    } catch (err) {
      console.error("Wallpaper upload failed:", err);
    } finally {
      setUploadingWp(false);
      e.target.value = "";
    }
  };

  const handleRemoveWallpaper = async () => {
    if (!conversation?.id) return;
    await updateConversationFields(conversation.id, { wallpaper: "" });
    onConversationUpdated?.();
  };

  const loadMembers = () => {
    if (!conversation?.id) return;
    fetchSharedMedia(conversation.id).then(setMedia);
    fetchSharedFiles(conversation.id).then(setFiles);
    fetchSharedLinks(conversation.id).then(setLinks);
    fetchMediaCount(conversation.id).then(setMediaCount);
    const uids = isGroup ? participants : participants.filter((p) => p !== currentUserId);
    Promise.all(uids.map((uid) => getUserProfile(uid))).then((results) =>
      setMembers(results.filter(Boolean)),
    );
  };

  useEffect(() => { loadMembers(); }, [conversation?.id, participants.length]);

  const visibleMembers = showAllMembers ? members : members.slice(0, 5);
  const extraCount = members.length - 5;

  const fileExtStyles = (name) => {
    const info = getFileIcon(name);
    return { background: info.color, label: info.label };
  };

  const handleRemoveMember = async (uid) => {
    try {
      const u = members.find((m) => m.uid === uid);
      await removeMemberFromGroup(conversation.id, uid);
      if (uid !== currentUserId) {
        await sendSystemMessage(conversation.id, `${u?.displayName || "A user"} was removed from the group`);
      }
      setConfirmingAction(null);
      loadMembers();
      onConversationUpdated?.();
    } catch (e) {
      console.error("Failed to remove member:", e);
    }
  };

  const handleToggleAdmin = async (uid) => {
    try {
      await toggleAdmin(conversation.id, uid);
      setMemberActions(null);
      loadMembers();
      onConversationUpdated?.();
    } catch (e) {
      console.error("Failed to toggle admin:", e);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(conversation.id, currentUserId);
      onConversationUpdated?.();
      onClose();
    } catch (e) {
      console.error("Failed to leave group:", e);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(conversation.id);
      onConversationUpdated?.();
      onClose();
    } catch (e) {
      console.error("Failed to delete group:", e);
    }
  };

  return (
    <div className="right-panel-inner">
      {/* User Detail View */}
      {selectedUser ? (
        <div className="user-detail-view">
          <div className="user-detail-back" onClick={() => setSelectedUser(null)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back</span>
          </div>
          <div className="user-detail-avatar">
            {selectedUser.avatar ? (
              <img src={getAvatarUrl(selectedUser)} alt="" />
            ) : (
              <div className="group-avatar-large" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary-color)", color: "#fff", fontSize: 32, fontWeight: 700 }}>
                {getAvatarFallback(selectedUser.displayName || "U")}
              </div>
            )}
          </div>
          <div className="user-detail-name">{selectedUser.displayName || "User"}</div>
          {selectedUser.phoneNumber && <div className="user-detail-info">{selectedUser.phoneNumber}</div>}
          {selectedUser.username && <div className="user-detail-info">@{selectedUser.username}</div>}
          {selectedUser.bio && <div className="user-detail-bio">{selectedUser.bio}</div>}
          {selectedUser.status && <div className="user-detail-status">{selectedUser.status}</div>}
        </div>
      ) : null}

      {/* Group / User Info */}
      {!selectedUser && (
      <div className="group-info">
        {isGroup ? (
          <>
            <div className="group-avatar-row">
              {conversation.avatar ? (
                <img className="group-avatar-large" src={conversation.avatar} alt="" />
              ) : (
                <div className="group-avatar-large" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary-color)", color: "#fff", fontSize: 32, fontWeight: 700 }}>
                  {getAvatarFallback(conversation.name)}
                </div>
              )}
              {isAdmin && (
                <button className="group-edit-btn" onClick={() => setShowEditGroup(true)} title="Edit group">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="group-name">{conversation.name}</div>
            <div className="group-members">{participants.length} members</div>
            {conversation.description && <div className="group-desc">{conversation.description}</div>}
          </>
        ) : conversation ? (
          <>
            {members[0]?.avatar ? (
              <img className="group-avatar-large" src={getAvatarUrl(members[0])} alt="" />
            ) : (
              <div className="group-avatar-large" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary-color)", color: "#fff", fontSize: 32, fontWeight: 700 }}>
                {getAvatarFallback(members[0]?.displayName || "U")}
              </div>
            )}
            <div className="group-name">{members[0]?.displayName || "User"}</div>
            <div className="group-members">@{members[0]?.username || "user"}</div>
            {members[0]?.bio && <div className="group-desc">{members[0].bio}</div>}
            {members[0]?.status && <div className="group-desc" style={{ marginTop: 4, fontStyle: "italic" }}>{members[0].status}</div>}
          </>
        ) : null}
      </div>
      )}

      {!selectedUser && (
      <>
      {/* Shared Media */}
      <div className="panel-section">
        <div className="section-header">
          <span className="section-title">Photos and videos</span>
          {mediaCount > 6 && <span className="see-all">See all</span>}
        </div>
        {media.length > 0 ? (
          <div className="media-grid media-grid-wa">
            {media.slice(0, 6).map((item, i) => (
              <div key={i} className="media-item-container">
                {item.type === "video" ? (
                  <>
                    <img className="media-item" src={item.url?.replace("/upload/", "/upload/w_200,q_auto,f_jpg/")} alt="" />
                    <div className="media-play-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" fill="white"/></svg>
                    </div>
                  </>
                ) : (
                  <img className="media-item" src={item.url} alt="" />
                )}
                {i === 5 && mediaCount > 6 && (
                  <div className="media-overlay">+{mediaCount - 6}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="media-empty">No media yet</div>
        )}
      </div>

      {/* About this group (group only) */}
      {isGroup && (
        <div className="panel-section">
          <div className="section-header">
            <span className="section-title">About this group</span>
          </div>
          <div className="group-about-card">
            <div className="group-about-row">
              <span className="group-about-label">Created by</span>
              <span className="group-about-value">
                {members.find((m) => m.uid === conversation?.createdBy)?.displayName || "Unknown"}
              </span>
            </div>
            <div className="group-about-row">
              <span className="group-about-label">Admins</span>
              <span className="group-about-value">
                {admins.map((a) => members.find((m) => m.uid === a)?.displayName || "Unknown").join(", ")}
              </span>
            </div>
            {conversation?.rules && (
              <div className="group-about-row">
                <span className="group-about-label">Rules</span>
                <span className="group-about-value group-about-rules">{conversation.rules}</span>
              </div>
            )}
            <div className="group-about-row">
              <span className="group-about-label">Admin powers</span>
              <span className="group-about-value group-about-powers">
                Add/remove members, edit group info, promote/demote admins, delete group
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Members (group only) */}
      {isGroup && members.length > 0 && (
        <div className="panel-section">
          <div className="section-header">
            <span className="section-title">Members ({members.length})</span>
            <div className="section-actions">
              {isAdmin && (
                <span className="see-all" onClick={() => setShowAddMember(true)} style={{ marginRight: 8 }}>
                  + Add
                </span>
              )}
              {members.length > 5 && (
                <span className="see-all" onClick={() => setShowAllMembers(!showAllMembers)}>
                  {showAllMembers ? "Show less" : "See all"}
                </span>
              )}
            </div>
          </div>
          <div className="member-rows-list">
            {visibleMembers.map((m) => (
              <MemberRow
                key={m.uid}
                member={m}
                isAdmin={admins.includes(m.uid)}
                isSelf={m.uid === currentUserId}
                currentUserId={currentUserId}
                admins={admins}
                onSelect={setSelectedUser}
                onAction={isAdmin ? (type, uid) => {
                  if (type === "toggleAdmin") handleToggleAdmin(uid);
                  if (type === "remove") setConfirmingAction({ type: "remove", uid });
                } : null}
              />
            ))}
            {!showAllMembers && extraCount > 0 && (
              <div className="more-members-row">+{extraCount} more</div>
            )}
          </div>
        </div>
      )}

      {/* Documents */}
      {files.length > 0 && (
        <div className="panel-section">
          <div className="section-header">
            <span className="section-title">Documents</span>
            <span className="see-all">See all</span>
          </div>
          {files.map((file, i) => {
            const { background, label } = fileExtStyles(file.name);
            return (
              <div key={i} className="file-list-item">
                <div className="file-icon-small" style={{ background }}>{label}</div>
                <div className="file-details">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{file.size ? `${(file.size / 1024 / 1024).toFixed(1)} Mb` : ""}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shared Links */}
      {links.length > 0 && (
        <div className="panel-section">
          <div className="section-header">
            <span className="section-title">Shared links</span>
            <span className="see-all">See all</span>
          </div>
          {links.map((link, i) => (
            <div key={i} className="link-list-item">
              <div className="link-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div className="link-details">
                <div className="link-name">{link.title}</div>
                <div className="link-url">{link.url?.length > 30 ? link.url.slice(0, 30) + "..." : link.url}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group actions */}
      {isGroup && (
        <div className="panel-section">
          <div className="group-actions">
            {isAdmin && (
              <button className="group-action-btn" onClick={() => setShowEditGroup(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Group
              </button>
            )}
            <button className="group-action-btn group-action-danger" onClick={() => setConfirmingAction({ type: "leave" })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Leave Group
            </button>
            {isAdmin && (
              <button className="group-action-btn group-action-danger" onClick={() => setConfirmingAction({ type: "delete" })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete Group
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chat Wallpaper */}
      <div className="panel-section">
        <div className="section-header">
          <span className="section-title">Chat Wallpaper</span>
        </div>
        {conversation?.wallpaper ? (
          <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
            <img src={conversation.wallpaper} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block", borderRadius: 8 }} />
            <button
              onClick={handleRemoveWallpaper}
              style={{
                position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff",
                border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ) : null}
        <label
          className="group-action-btn"
          style={{ width: "100%", justifyContent: "center", cursor: "pointer", opacity: uploadingWp ? 0.5 : 1, pointerEvents: uploadingWp ? "none" : "auto" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
          {uploadingWp ? "Uploading..." : conversation?.wallpaper ? "Change Wallpaper" : "Set Wallpaper"}
          <input type="file" accept="image/*" onChange={handleWallpaperUpload} style={{ display: "none" }} />
        </label>
      </div>

      </>)}
      {/* Actions */}
      <div className="panel-section" style={{ borderTop: "1px solid var(--border-color)" }}>
        <div className="group-actions" style={{ flexDirection: "column", gap: 8 }}>
          {onOpenSettings && (
            <button className="group-action-btn" onClick={onOpenSettings} style={{ width: "100%", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          )}
          <button className="group-action-btn" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
            Close
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal
          conversationId={conversation}
          currentUserId={currentUserId}
          onClose={() => setShowAddMember(false)}
          onMembersChanged={loadMembers}
        />
      )}
      {showEditGroup && (
        <EditGroupModal
          conversation={conversation}
          onClose={() => setShowEditGroup(false)}
          onUpdated={loadMembers}
        />
      )}

      {/* Confirm dialog */}
      {confirmingAction && (
        <div className="modal-backdrop" onClick={() => setConfirmingAction(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-title">
              {confirmingAction.type === "remove" ? "Remove member?" : confirmingAction.type === "leave" ? "Leave group?" : "Delete group?"}
            </div>
            <div className="confirm-dialog-desc">
              {confirmingAction.type === "remove"
                ? "This member will be removed from the group."
                : confirmingAction.type === "leave"
                  ? "You will no longer have access to this group's messages."
                  : "This will permanently delete the group for everyone."}
            </div>
            <div className="confirm-dialog-actions">
              <button className="confirm-btn confirm-btn-cancel" onClick={() => setConfirmingAction(null)}>Cancel</button>
              <button
                className="confirm-btn confirm-btn-danger"
                onClick={() => {
                  if (confirmingAction.type === "remove") handleRemoveMember(confirmingAction.uid);
                  else if (confirmingAction.type === "leave") handleLeaveGroup();
                  else if (confirmingAction.type === "delete") handleDeleteGroup();
                }}
              >
                {confirmingAction.type === "remove" ? "Remove" : confirmingAction.type === "leave" ? "Leave" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
