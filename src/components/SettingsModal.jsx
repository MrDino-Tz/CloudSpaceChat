import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loadSettings, saveSettings, applyTheme, applyStyleOverrides, DEFAULTS } from "@/lib/settingsService";

import { Shield, MessageCircle, Bell, Database } from "lucide-react";

const TABS = [
  { id: "security", icon: <Shield size={16} />, label: "Security" },
  { id: "chat", icon: <MessageCircle size={16} />, label: "Chat" },
  { id: "notifications", icon: <Bell size={16} />, label: "Notifications" },
  { id: "data", icon: <Database size={16} />, label: "Data" },
];

const THEMES = [
  { id: "light", label: "Light", primary: "#F59B1D", bg: "#fff4e5" },
  { id: "dark", label: "Dark", primary: "#F59B1D", bg: "#1a1a1a" },
  { id: "purple", label: "Purple", primary: "#8b5cf6", bg: "#f5f3ff" },
  { id: "blue", label: "Blue", primary: "#3b82f6", bg: "#eff6ff" },
  { id: "green", label: "Green", primary: "#22c55e", bg: "#f0fdf4" },
];

function useSettingsState() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ ...DEFAULTS });

  useEffect(() => {
    loadSettings(user?.uid).then(setSettings);
  }, [user]);

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);

    if (key === "theme") applyTheme(value);
    if (["bubbleStyle", "fontSize", "fontFamily", "wallpaper", "wallpaperUrl"].includes(key)) applyStyleOverrides(next);
    if (key === "presenceVisible") {
      localStorage.setItem("csc_presence_visible", String(value));
    }
    if (key === "incognito") {
      localStorage.setItem("csc_incognito", String(value));
    }
    saveSettings(user?.uid, next);
  };

  const handleClearCache = () => {
    localStorage.removeItem("csc_settings");
    localStorage.removeItem("csc_theme");
    if (confirm("Clear all local cached data? Page will reload.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return { settings, update, handleClearCache };
}

export function SettingsPanel({ onClose }) {
  const [tab, setTab] = useState("security");
  const { settings, update, handleClearCache } = useSettingsState();

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <button className="settings-panel-back" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="settings-panel-title">Settings</span>
      </div>

      <div className="settings-tabs-inline">
        {TABS.map((t) => (
          <button key={t.id} className={`settings-tab-inline ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span className="settings-tab-icon">{t.icon}</span>
            <span className="settings-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="settings-panel-body">
        {tab === "security" && <SecuritySection settings={settings} update={update} />}
        {tab === "chat" && <ChatSection settings={settings} update={update} />}
        {tab === "notifications" && <NotificationsSection settings={settings} update={update} />}
        {tab === "data" && <DataSection settings={settings} update={update} onClearCache={handleClearCache} />}
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <div className="setting-label">{label}</div>
        {desc && <div className="setting-desc">{desc}</div>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select className="setting-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SecuritySection({ settings, update }) {
  const [customDomains, setCustomDomains] = useState(settings.trustedDomains || "");

  const handleDomainsBlur = () => {
    update("trustedDomains", customDomains);
    localStorage.setItem("csc_trusted_domains", customDomains);
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Link Scanner</h3>
      <div className="settings-card">
        <SettingRow label="Scanning level" desc="How aggressively to check links">
          <Select
            value={settings.linkScanner}
            onChange={(v) => update("linkScanner", v)}
            options={[
              { value: "strict", label: "🔴 Strict — scan all links" },
              { value: "standard", label: "🟡 Standard — unknown/suspicious only" },
              { value: "disabled", label: "⚪ Disabled — open directly" },
            ]}
          />
        </SettingRow>

        <SettingRow label="Trusted domains" desc="Skip scanning for these (comma-separated)">
          <textarea
            className="setting-textarea"
            rows={2}
            value={customDomains}
            onChange={(e) => setCustomDomains(e.target.value)}
            onBlur={handleDomainsBlur}
            placeholder="github.com, google.com"
          />
        </SettingRow>
      </div>

      <h3 className="settings-section-title" style={{ marginTop: 20 }}>Presence</h3>
      <div className="settings-card">
        <SettingRow label="Show active status" desc="Let others see when you're online">
          <Toggle value={settings.presenceVisible} onChange={(v) => update("presenceVisible", v)} />
        </SettingRow>
        <SettingRow label="Incognito mode" desc="Hide read receipts (✓ instead of ✓✓)">
          <Toggle value={settings.incognito} onChange={(v) => update("incognito", v)} />
        </SettingRow>
      </div>
    </div>
  );
}

const PREVIEW_FAMILIES = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  modern: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  rounded: '"Nunito", "Segoe UI", Arial, sans-serif',
  poppins: '"Poppins", "Segoe UI", Arial, sans-serif',
  clean: '"Quicksand", "Segoe UI", Arial, sans-serif',
  handwritten: '"Patrick Hand", "Comic Sans MS", cursive',
  dancing: '"Dancing Script", cursive',
  caveat: '"Caveat", cursive',
  pacifico: '"Pacifico", cursive',
  shadows: '"Shadows Into Light", cursive',
  kalam: '"Kalam", cursive',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"Courier New", Consolas, Menlo, monospace',
};

const PREVIEW_RADII = { blocky: "8px", rounded: "16px", classic: "16px" };
const PREVIEW_FONT_SIZES = { small: "13px", medium: "14px", large: "16px" };

function BubblePreview({ settings }) {
  const bs = settings.bubbleStyle || "rounded";
  const radius = PREVIEW_RADII[bs] || "16px";
  const font = PREVIEW_FONT_SIZES[settings.fontSize] || "14px";
  const family = PREVIEW_FAMILIES[settings.fontFamily] || PREVIEW_FAMILIES.system;
  const classic = bs === "classic";
  const incomingRadius = classic ? `${radius} ${radius} ${radius} 4px` : radius;
  const outgoingRadius = classic ? `${radius} ${radius} 4px ${radius}` : radius;

  return (
    <div className="bubble-preview">
      <div className="bubble-preview-row">
        <div
          className={`bubble-preview-bubble incoming ${classic ? "classic" : ""}`}
          style={{ borderRadius: incomingRadius, fontSize: font, fontFamily: family }}
        >
          Hey, how's it going?
          {classic && <span className="bubble-preview-tail" />}
        </div>
      </div>
      <div className="bubble-preview-row own">
        <div
          className={`bubble-preview-bubble outgoing ${classic ? "classic" : ""}`}
          style={{ borderRadius: outgoingRadius, fontSize: font, fontFamily: family }}
        >
          All good, thanks!
          {classic && <span className="bubble-preview-tail" />}
        </div>
      </div>
    </div>
  );
}

function ChatSection({ settings, update }) {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Theme</h3>
      <div className="settings-card">
        <SettingRow label="App color scheme" desc="Choose how the app looks">
          <div className="theme-mini-grid">
            {THEMES.map((t) => (
              <div key={t.id} className={`theme-mini ${settings.theme === t.id ? "active" : ""}`} onClick={() => update("theme", t.id)}>
                <div className="theme-mini-swatch" style={{ background: t.bg }}>
                  <div className="theme-mini-dot" style={{ background: t.primary }} />
                </div>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </SettingRow>
      </div>

      <h3 className="settings-section-title">Message Bubbles</h3>
      <div className="settings-card">
        <BubblePreview settings={settings} />
        <SettingRow label="Corner style" desc="Shape of message bubbles">
          <Select
            value={settings.bubbleStyle}
            onChange={(v) => update("bubbleStyle", v)}
            options={[
              { value: "blocky", label: "Blocky (8px)" },
              { value: "rounded", label: "Rounded (16px)" },
              { value: "classic", label: "Classic (with tails)" },
            ]}
          />
        </SettingRow>

        <SettingRow label="Font size" desc="Message text size">
          <Select
            value={settings.fontSize}
            onChange={(v) => update("fontSize", v)}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
          />
        </SettingRow>

        <SettingRow label="Font style" desc="Message text typeface">
          <Select
            value={settings.fontFamily || "system"}
            onChange={(v) => update("fontFamily", v)}
            options={[
              { value: "system", label: "System default" },
              { value: "modern", label: "Modern (Inter)" },
              { value: "rounded", label: "Rounded (Nunito)" },
              { value: "poppins", label: "Poppins" },
              { value: "clean", label: "Clean (Quicksand)" },
              { value: "handwritten", label: "Handwritten (Patrick Hand)" },
              { value: "dancing", label: "Dancing Script" },
              { value: "caveat", label: "Caveat" },
              { value: "pacifico", label: "Pacifico" },
              { value: "shadows", label: "Shadows Into Light" },
              { value: "kalam", label: "Kalam" },
              { value: "serif", label: "Serif (Georgia)" },
              { value: "mono", label: "Monospace (Courier)" },
            ]}
          />
        </SettingRow>
      </div>

      <h3 className="settings-section-title" style={{ marginTop: 20 }}>Chat Wallpaper</h3>
      <div className="settings-card">
        <SettingRow label="Background" desc="Change chat area background">
          <Select
            value={settings.wallpaper || "none"}
            onChange={(v) => update("wallpaper", v)}
            options={[
              { value: "none", label: "Default" },
              { value: "#f0f0f0", label: "Light gray" },
              { value: "#e8f5e9", label: "Soft green" },
              { value: "#e3f2fd", label: "Soft blue" },
              { value: "#fce4ec", label: "Soft pink" },
              { value: "custom", label: "Custom image URL..." },
            ]}
          />
        </SettingRow>
        {settings.wallpaper === "custom" && (
          <input
            className="setting-input"
            type="text"
            placeholder="https://example.com/bg.jpg"
            value={settings.wallpaperUrl || ""}
            onChange={(e) => update("wallpaperUrl", e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

function NotificationsSection({ settings, update }) {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Notifications</h3>
      <div className="settings-card">
        <SettingRow label="Desktop notifications" desc="Show browser notifications for new messages">
          <Toggle value={settings.notificationsEnabled} onChange={(v) => update("notificationsEnabled", v)} />
        </SettingRow>
      </div>

      <h3 className="settings-section-title" style={{ marginTop: 20 }}>Sound Effects</h3>
      <div className="settings-card">
        <SettingRow label="Outgoing message" desc="Play sound when sending">
          <Toggle value={settings.soundOutgoing} onChange={(v) => update("soundOutgoing", v)} />
        </SettingRow>
        <SettingRow label="Incoming message" desc="Play sound when receiving">
          <Toggle value={settings.soundIncoming} onChange={(v) => update("soundIncoming", v)} />
        </SettingRow>
        <SettingRow label="Typing indicator" desc="Sound while typing">
          <Toggle value={settings.soundTyping} onChange={(v) => update("soundTyping", v)} />
        </SettingRow>
      </div>

      <h3 className="settings-section-title" style={{ marginTop: 20 }}>Do Not Disturb</h3>
      <div className="settings-card">
        <SettingRow label="Schedule DND" desc="Mute notifications during set hours">
          <Toggle value={settings.dndEnabled} onChange={(v) => update("dndEnabled", v)} />
        </SettingRow>
        {settings.dndEnabled && (
          <div className="dnd-times">
            <label className="dnd-time-group">
              <span className="dnd-time-label">From</span>
              <input type="time" className="setting-input" value={settings.dndStart} onChange={(e) => update("dndStart", e.target.value)} />
            </label>
            <label className="dnd-time-group">
              <span className="dnd-time-label">To</span>
              <input type="time" className="setting-input" value={settings.dndEnd} onChange={(e) => update("dndEnd", e.target.value)} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function DataSection({ settings, update, onClearCache }) {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Auto-Download</h3>
      <div className="settings-card">
        <SettingRow label="Images" desc="Load image attachments automatically">
          <Toggle value={settings.autoDownloadImages} onChange={(v) => update("autoDownloadImages", v)} />
        </SettingRow>
        <SettingRow label="Videos" desc="Load video attachments automatically">
          <Toggle value={settings.autoDownloadVideo} onChange={(v) => update("autoDownloadVideo", v)} />
        </SettingRow>
        <SettingRow label="Audio" desc="Load audio attachments automatically">
          <Toggle value={settings.autoDownloadAudio} onChange={(v) => update("autoDownloadAudio", v)} />
        </SettingRow>
      </div>

      <h3 className="settings-section-title" style={{ marginTop: 20 }}>Storage</h3>
      <div className="settings-card">
        <div className="setting-row" style={{ border: "none", paddingBottom: 0 }}>
          <div className="setting-info">
            <div className="setting-label">Clear local cache</div>
            <div className="setting-desc">Remove cached messages, settings, and attachments — page will reload</div>
          </div>
        </div>
        <button className="settings-btn settings-btn-danger" onClick={onClearCache} style={{ marginTop: 12, width: "100%" }}>
          Clear Cache & Reload
        </button>
      </div>
    </div>
  );
}
