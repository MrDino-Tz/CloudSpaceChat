import { useState, useEffect } from "react";
import { getUserProfile } from "@/lib/userService";
import { fetchSharedMedia, fetchSharedFiles, fetchSharedLinks, fetchMediaCount } from "@/lib/mediaService";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";

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

function MemberAvatar({ uid }) {
  const [user, setUser] = useState(null);
  useEffect(() => { getUserProfile(uid).then(setUser); }, [uid]);
  const name = user?.displayName || "U";
  return (
    <img
      className="member-avatar"
      src={user?.avatar || `https://ui-avatars.com/api/?name=${name}&background=F59B1D&color=fff`}
      alt=""
      title={name}
    />
  );
}

export function SidePanel({ conversation, currentUserId, onClose }) {
  const [media, setMedia] = useState([]);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [members, setMembers] = useState([]);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const isGroup = conversation?.type === "group";
  const participants = conversation?.participants || [];

  useEffect(() => {
    if (!conversation?.id) return;
    fetchSharedMedia(conversation.id).then(setMedia);
    fetchSharedFiles(conversation.id).then(setFiles);
    fetchSharedLinks(conversation.id).then(setLinks);
    fetchMediaCount(conversation.id).then(setMediaCount);
  }, [conversation?.id]);

  useEffect(() => {
    if (participants.length === 0) return;
    const uids = isGroup ? participants : participants.filter((p) => p !== currentUserId);
    Promise.all(uids.map((uid) => getUserProfile(uid))).then((results) =>
      setMembers(results.filter(Boolean)),
    );
  }, [isGroup, participants.length, currentUserId]);

  const visibleMembers = showAllMembers ? members : members.slice(0, 5);
  const extraCount = members.length - 5;

  const fileExtStyles = (name) => {
    const info = getFileIcon(name);
    return { background: info.color, label: info.label };
  };

  return (
    <div className="right-panel-inner">
      {/* Group / User Info */}
      <div className="group-info">
        {isGroup ? (
          <>
            {conversation.avatar ? (
              <img className="group-avatar-large" src={conversation.avatar} alt="" />
            ) : (
              <div className="group-avatar-large" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary-color)", color: "#fff", fontSize: 32, fontWeight: 700 }}>
                {getAvatarFallback(conversation.name)}
              </div>
            )}
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

      {/* Members (group only) */}
      {isGroup && members.length > 0 && (
        <div className="panel-section">
          <div className="section-header">
            <span className="section-title">Members</span>
            {members.length > 5 && (
              <span className="see-all" onClick={() => setShowAllMembers(!showAllMembers)}>
                {showAllMembers ? "Show less" : "See all"}
              </span>
            )}
          </div>
          <div className="members-list" style={{ flexWrap: "wrap" }}>
            {visibleMembers.map((m) => (
              <MemberAvatar key={m.uid} uid={m.uid} />
            ))}
            {!showAllMembers && extraCount > 0 && (
              <div className="more-members">+{extraCount}</div>
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

      {/* Close button */}
      <div style={{ padding: 16, textAlign: "center" }}>
        <span className="see-all" onClick={onClose}>Close</span>
      </div>
    </div>
  );
}
