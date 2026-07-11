# Link Security Scanning

When a user clicks a link inside a message, CloudChat intercepts the navigation and shows a **Link Security Check** dialog before opening the URL.

## Auto-detection in message bubbles

Every link in a message is automatically checked by client-side heuristics **as the message renders**. A colored dot appears before each link:

| Dot | Level | Meaning |
|-----|-------|---------|
| 🟢 Green | Safe | HTTPS + known trusted domain |
| 🟡 Yellow | Unknown | HTTPS but not in known domains, no red flags |
| 🔴 Red | Suspicious | HTTP, IP-based URL, suspicious TLD, phishing keywords, URL shortener, or contains `@` |

The check runs instantly — no API call, no external service needed.

## Client-side heuristics

The `checkLinkSafety()` function in `ChatPage.jsx` evaluates URLs against these rules:

| Flag | Why it's flagged |
|------|------------------|
| `no-https` | HTTP connection (unencrypted) |
| `ip-address` | Hostname is a raw IP (e.g. `192.168.1.1`) |
| `contains-@` | URL contains `@` (can hide real destination) |
| `suspicious-tld` | TLD is `.tk`, `.ml`, `.ga`, `.cf`, `.xyz`, `.top`, `.loan`, `.win`, etc. |
| `shortener` | Domain is a known URL shortener (bit.ly, t.co, tinyurl, etc.) |
| `phishing-keyword` | Domain contains `login`, `signin`, `verify`, `secure`, `bank`, `paypal`, etc. |
| `long-domain` | Domain name part is > 30 characters |
| `safe-domain` | Domain or subdomain is in the trusted set |

**Safety level logic:**
- **Suspicious** — if any of: IP address, contains `@`, HTTP, suspicious TLD, phishing keywords
- **Safe** — HTTPS + safe domain, no other flags
- **Unknown** — everything else (HTTPS, not in safe list, but no obvious red flags)

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

- `checkLinkSafety(url)` — utility function in `src/components/ChatPage.jsx`, runs on every render of link-containing messages
- `renderContent(text, onLinkClick)` — renders message text with link detection + colored badge
- `LinkSecurityDialog` — defined inline in `src/components/ChatPage.jsx`, shown on link click
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

- The auto-detection runs **client-side only** — no data is sent to any server
- The free tools listed in the dialog (VirusTotal, URLScan.io, Google Safe Browsing) are external services with their own terms — clicking them does send the URL to those services
- Heuristics are not foolproof — a "safe" link might still be compromised, and a "suspicious" link might be legitimate
- Users should still use caution when visiting unknown links
