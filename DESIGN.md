# Design System: ChatApp Aurora
**Design Spec Version:** 1.0.0
**Source Reference:** Modern Curved Messenger (Topographic Canvas & Floating Squircle Glass)

---

## 1. Visual Theme & Atmosphere
The design evokes a refined, modern, high-focus workspace combining:
- **Atmosphere:** Serene, futuristic, premium, soft-focus. High-density usability without clutter.
- **Spatial Concept:** Floating rounded desktop app container (`rounded-3xl` / 28px border-radius) resting on a deep midnight topographic contour canvas.
- **Elevation & Layers:** Flat layered surfaces with crisp visual separation, pastel mist tints, whisper-soft diffused drop shadows, and high-contrast dark accents on the navigation rail.
- **Geometry:** Heavy use of "Squircle" geometry (`rounded-2xl` for avatars, cards, inputs, and message bubbles; `rounded-full` for badges, tags, and micro-controls).

---

## 2. Color Palette & Functional Roles

### Canvas & Navigation (Dark Slate Architecture)
- **Canvas Topography Background (`#15141e` / `#1a1926`):** Deep midnight violet canvas with subtle wavy contour vectors.
- **Navigation Dock Rail (`#1e1d25`):** Solid charcoal obsidian dock providing high contrast and primary application navigation.
- **Active Navigation Pill (`#33323c`):** Muted slate charcoal container for selected navigation tab.
- **Navigation Icon Muted (`#848096`):** Soft lavender slate for idle navigation icons.
- **Navigation Icon Active (`#ffffff`):** Pure white for active navigation iconography.

### Application Frame & Surfaces (Light Aurora Mode)
- **Main Window Background (`#ffffff`):** Pure crisp white for central conversation area and primary panels.
- **Sidebar Surface (`#f4f3fb` / `#f6f5fc`):** Soft cool lavender-gray for room and contact navigation.
- **Search & Input Surface (`#eae8f7` / `#f0eff8`):** Very soft lavender mist container for form controls and search boxes.
- **Border Subtle Stroke (`#e7e5f2`):** Ultra-light divider stroke between panels and cards.

### Brand Accents & Chat Bubbles
- **Primary Accent / Outgoing Bubble (`#5e5ce6` / `#6259e8`):** Electric Periwinkle / Royal Indigo used for outgoing messages, primary actions, and send button.
- **Outgoing Text (`#ffffff`):** Pure crisp white text for high legibility on indigo bubbles.
- **Incoming Message Bubble (`#f0eff7` / `#f3f2fb`):** Soft lavender mist bubble for incoming conversation rows.
- **Author Headline Indigo (`#524785` / `#4f46e5`):** Deep periwinkle purple for sender names in group contexts.
- **Text Primary (`#1e1b29`):** Deep obsidian charcoal for maximum readability.
- **Text Secondary / Muted (`#848096`):** Muted lavender slate for timestamps, previews, and secondary labels.

### Micro-indicators & Badges
- **Unread Notification Badge (`#ff5a43`):** High-visibility coral red for unread count pills.
- **Pinned Indicator (`#7362e3`):** Soft periwinkle purple for pinned room pins.
- **Online Presence Indicator (`#10b981`):** Vivid emerald green dot.
- **Reaction Pill (`#ffffff` / `#eceaf5`):** White floating pill with subtle border and emoji counter.

---

## 3. Typography Rules
- **Font Family:** `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Hierarchy:**
  - **Main Room Header:** Bold 22px-24px (`font-bold text-gray-900 tracking-tight`).
  - **Sidebar Room Title:** Semi-bold 14px-15px (`font-semibold text-gray-900`).
  - **Message Body Text:** Regular 14px (`text-sm leading-relaxed text-gray-800`).
  - **Sender Name:** Medium/Semi-bold 13px (`text-xs font-semibold text-indigo-700`).
  - **Metadata & Timestamps:** Regular 11px (`text-[11px] text-gray-400 font-medium`).
  - **Badge Counter:** Bold 11px (`text-[11px] font-bold text-white`).

---

## 4. Component Stylings

### Navigation Rail (Far Left)
- Vertical rail (~72px width), dark background `#1e1d25`.
- Top logo: Geometric polygon glyph in white.
- Nav items: Vertical stack with label underneath (`All chats`, `Work`, `Friends`, `News`, `Archive chats`).
- Active item encased in a `rounded-2xl` `#33323c` pill.
- Bottom actions: `Profile`, `Edit`, `Log out`.

### Room & Conversation List
- Soft lavender background `#f4f3fb`.
- Pill-shaped search bar with lavender accent.
- List cards: Squircle avatar (`rounded-2xl` / 16px), room name, truncated last message preview, timestamp, pin badge, and unread counter.
- Active room selection: Highlighted with crisp white container and soft lavender shadow.

### Message Bubbles
- **Incoming:** Left-aligned, squircle avatar on the left, author name in deep purple, soft lavender bubble (`rounded-2xl rounded-tl-sm`), reaction chips, view count, timestamp.
- **Outgoing:** Right-aligned, electric periwinkle bubble (`#5e5ce6`), white text, timestamp, view count, squircle avatar on the right.

### Composer
- Floating pill-style container (`rounded-full` or `rounded-2xl` with `#f0eff8` surface).
- Attachment paperclip icon on left.
- Input field with transparent background.
- Right side: Voice microphone icon and circular purple send button with paper plane icon (`#5e5ce6`).

### Right Sidebar (Group Info & Members)
- Clean card with `rounded-3xl` corners, close button `×`.
- File asset statistics (Photos, Videos, Files, Audio, Links, Voice messages) with expandable count rows.
- Member list with squircle avatars, user names, and purple `admin` / `member` role badges.

---

## 5. Responsive Behavior
- **Desktop (>= 1280px):** Full 4-column layout (Nav Rail + Room List + Chat Stream + Info Drawer).
- **Tablet / Medium (768px - 1279px):** 3-column layout (Nav Rail + Room List + Chat Stream), Info Drawer collapsible.
- **Mobile (< 768px):** Single active view (Room List or Chat Stream) with full-screen transitions and back navigation.
