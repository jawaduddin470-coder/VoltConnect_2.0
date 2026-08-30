# VoltConnect 2.0 Changelog

All notable changes, architectural decisions, database schemas, security rules, and feature updates for VoltConnect 2.0 will be documented in this file in reverse chronological order.

---

## [2026-08-23] — VoltConnect 2.0 Final Logo Sizing Fix Complete

### Category
Responsive Logo Sizing / Visual Hierarchy / Contextual Separation / CSS Refinement

### What Changed
- **Intro Logo Sizing (`src/components/common/VoltConnectLogo.tsx`)**:
  - Reduced intro logo width to `clamp(260px, 25vw, 360px)` (desktop: 280–360px max width; mobile: 240–290px).
  - Placed naturally in screen center with generous negative space.
  - Eliminated white rectangular panels; rendered with transparent background and subtle cyan aura drop-shadow (`drop-shadow-[0_0_20px_rgba(41,182,246,0.45)]`).
  - Restrained entry motion (`opacity: 0 -> 1`, `scale: 0.92 -> 1`, 800ms).
- **Navbar Logo Sizing (`src/components/common/VoltConnectLogo.tsx` & `Navbar.tsx`)**:
  - Increased navbar logo width to `clamp(120px, 10vw, 150px)` (desktop: 145px width; mobile: 115px).
  - Preserved natural aspect ratio without fixed tiny height restrictions.
  - Ensures `VoltConnect 2.0` brand identity is clearly legible and properly balanced in header navigation.
- **Zero Production Errors**: Verified `npm run build` (`65.56 kB` CSS & `1,245.32 kB` JS in 2.51s with 0 errors).

### Why
To fix intro logo oversizing and navbar logo undersizing by establishing separate, contextually appropriate logo styles while preserving the approved official logo artwork.

### Files Affected
- `src/components/common/VoltConnectLogo.tsx`
- `src/components/layout/Navbar.tsx`
- `progress.md`
- `changelog.md`

### Impact
Delivers balanced visual weight across both header navigation and the cinematic introduction.

### Migration Required
No

### Testing Required
Yes (`npm run build` verified: 65.56 kB CSS & 1,245.32 kB JS generated with 0 errors)
