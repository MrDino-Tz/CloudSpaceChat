# Link Security Scanning

When a user clicks a link inside a message, CloudChat intercepts the navigation and shows a **Link Security Check** dialog before opening the URL.

## How it works

1. **Interception** — any `https://` or `http://` URL in message text is detected by regex (`/(https?:\/\/[^\s]+)/g`) and rendered as a bold green, clickable `<span>` (not an `<a>` tag).

2. **Dialog trigger** — clicking the link calls `onLinkClick(url)` which sets `pendingLink` state in ChatPage.

3. **Security check** — `LinkSecurityDialog` parses the URL and displays:
   - **Connection**: whether the link uses HTTPS (encrypted) or HTTP (not encrypted)
   - **Domain**: the extracted hostname
   - **Safety**: known safe domains (Google, GitHub, YouTube, etc.) show a green "Known safe domain" badge

4. **Free scanning tools** — the dialog offers three external services to scan the link:
   - [VirusTotal](https://www.virustotal.com/) — scans URLs against 70+ antivirus engines
   - [URLScan.io](https://urlscan.io/) — takes a screenshot and analyzes the website
   - [Google Safe Browsing](https://transparencyreport.google.com/safe-browsing/) — checks against Google's threat database

5. **User decision** — the user can either:
   - **Cancel** — close the dialog without opening the link
   - **Visit link** — open the URL in a new browser tab (`window.open` with `noopener,noreferrer`)

## Component location

- `LinkSecurityDialog` — defined inline in `src/components/ChatPage.jsx`
- Triggered from `MessageBubble` via `onLinkClick` prop
- State managed in `ChatPage` as `pendingLink`

## Trusted domains

The following domains are flagged as "known safe":

```
google.com, youtube.com, github.com, facebook.com,
twitter.com, x.com, linkedin.com, instagram.com,
whatsapp.com, cloudinary.com, firebase.google.com
```

Subdomains of `*.google.com` are also treated as safe.

## Security notes

- The dialog does **not** actually scan the URL content — it only checks protocol and domain
- Users should still use caution when visiting unknown links
- The free tools listed are external services and require their own separate usage
