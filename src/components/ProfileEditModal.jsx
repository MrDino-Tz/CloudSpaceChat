import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/userService";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";

export function ProfileEditModal({ onClose }) {
  const { user, profile, setProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [status, setStatus] = useState(profile?.status || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const result = await uploadToCloudinary(file, { folder: `users/${user.uid}/avatars` });
      setAvatar(result.secure_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        status: status.trim(),
        avatar,
      });
      setProfile((prev) => ({
        ...prev,
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        status: status.trim(),
        avatar,
      }));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-brand">Edit Profile</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}

          <form className="profile-edit-form" onSubmit={handleSubmit}>
            <div className="profile-avatar-section">
              <div className="profile-avatar-edit" onClick={() => fileRef.current?.click()}>
                {avatar ? (
                  <img src={avatar} alt="avatar" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-letter">
                    {getAvatarFallback(displayName || profile?.displayName || user?.email)}
                  </div>
                )}
                <div className="profile-avatar-overlay">
                  {uploading ? "..." : "Change"}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">Display Name</label>
              <input id="edit-name" type="text" className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-username">Username</label>
              <input id="edit-username" type="text" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-bio">Bio</label>
              <textarea id="edit-bio" className="form-input form-textarea" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-status">Status</label>
              <input id="edit-status" type="text" className="form-input" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="What's on your mind?" />
            </div>

            <button type="submit" className="auth-btn modal-submit-btn" disabled={saving || uploading}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
