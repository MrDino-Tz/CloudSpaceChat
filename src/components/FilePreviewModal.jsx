import { useState, useRef, useEffect } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { sendMessage } from "@/lib/chatService";

const FILE_TYPES = {
  image: { icon: "🖼️" },
  video: { icon: "🎬" },
};

export function FilePreviewModal({ data, conversationId, senderId, onClose }) {
  const { file, type, previewUrl } = data;
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (uploading) return;
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => setProgress((p) => Math.min(p + 10, 90)), 300);

    try {
      const result = await uploadToCloudinary(file);
      clearInterval(interval);
      setProgress(100);

      await sendMessage(conversationId, senderId, {
        content: caption.trim() || (type === "image" ? "📷 Photo" : type === "video" ? "🎥 Video" : "📎 File"),
        type,
        attachments: [{ url: result.secure_url, type, name: file.name, size: file.size }],
      });

      setTimeout(onClose, 200);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      setError(err.message.includes("Upload preset")
        ? "Upload preset 'cloudchat_preset' not found — check Cloudinary settings"
        : err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="file-preview-backdrop" onClick={onClose}>
      <div className="file-preview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="file-preview-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="file-preview-body">
          {type === "image" ? (
            <img src={previewUrl} alt="preview" className="file-preview-media" />
          ) : type === "video" ? (
            <video src={previewUrl} controls autoPlay className="file-preview-media" />
          ) : (
            <div className="file-preview-file">
              <div className="file-preview-file-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div className="file-preview-file-name">{file.name}</div>
              <div className="file-preview-file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
            </div>
          )}
        </div>

        <div className="file-preview-footer">
          <div className="file-preview-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="file-preview-input"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={uploading}
            />
          </div>
          <button
            className={`file-preview-send ${uploading ? "uploading" : ""}`}
            onClick={handleSend}
            disabled={uploading}
          >
            {uploading ? (
              <span className="file-preview-send-progress">{progress}%</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>

        {uploading && (
          <div className="file-preview-progress-bar">
            <div className="file-preview-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {error && <div className="file-preview-error">{error}</div>}
      </div>
    </div>
  );
}
