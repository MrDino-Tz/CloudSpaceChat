import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUsers } from "@/lib/userService";
import { createGroupConversation, sendSystemMessage } from "@/lib/chatService";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";

export function GroupCreateModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    getAllUsers(user.uid).then(setUsers).catch(() => setError("Failed to load users"));
    inputRef.current?.focus();
  }, [user.uid]);

  const filtered = users.filter(
    (u) =>
      !selected.find((s) => s.uid === u.uid) &&
      (u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())),
  );

  const toggle = (u) => {
    setSelected((prev) =>
      prev.find((s) => s.uid === u.uid)
        ? prev.filter((s) => s.uid !== u.uid)
        : [...prev, u],
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0 || creating) return;
    setCreating(true);
    try {
      const convId = await createGroupConversation({
        name: name.trim(),
        participants: [user.uid, ...selected.map((u) => u.uid)],
        createdBy: user.uid,
      });
      await sendSystemMessage(convId, "Group created");
      onCreated(convId);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-brand">New Group</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              ref={inputRef}
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name..."
            />
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Add Members ({selected.length} selected)</label>
            <input
              type="text"
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              style={{ marginBottom: 8 }}
            />
          </div>

          <div className="group-member-list">
            {selected.map((u) => (
              <div key={u.uid} className="group-member-chip" onClick={() => toggle(u)}>
                {u.avatar ? (
                  <img src={getAvatarUrl(u)} alt="" className="group-chip-avatar" />
                ) : (
                  <div className="group-chip-letter">{getAvatarFallback(u.displayName)}</div>
                )}
                <span>{u.displayName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            ))}
          </div>

          <div className="group-user-list">
            {filtered.map((u) => (
              <div key={u.uid} className="group-user-row" onClick={() => toggle(u)}>
                {u.avatar ? (
                  <img src={getAvatarUrl(u)} alt="" className="group-row-avatar" />
                ) : (
                  <div className="group-row-letter">{getAvatarFallback(u.displayName)}</div>
                )}
                <div className="group-row-info">
                  <div className="group-row-name">{u.displayName}</div>
                  <div className="group-row-username">@{u.username || "user"}</div>
                </div>
                <div className={`group-row-check ${selected.find((s) => s.uid === u.uid) ? "checked" : ""}`}>
                  {selected.find((s) => s.uid === u.uid) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && search && (
              <div style={{ padding: 16, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
                No users found
              </div>
            )}
          </div>

          <button
            className="group-create-btn"
            onClick={handleCreate}
            disabled={creating || !name.trim() || selected.length === 0}
            style={{ marginTop: 12 }}
          >
            {creating ? "Creating..." : `Create Group (${selected.length + 1} members)`}
          </button>
        </div>
      </div>
    </div>
  );
}
