# JIAYOU — Dashboard Visual Acceptance Report (Restored Baseline & Corner Palace)
## Owner Visual Corrections Acceptance & Verification

### 1. Branch & Commit Status
- **Base commit**: `acfd49e7de6bf0daf7983bfa1c66abc5b73e0e85`
- **Working branch**: `feat/high-fidelity-dashboard` (Preserved for review, not merged to `main`)
- **Target environment**: React 19 + Tailwind v4 + Vite

---

### 2. Implementation Summary

| Requirement | Owner Visual Direction | Implementation Details | Status |
|---|---|---|---|
| **1. Revert to Approved Baseline** | Revert all unwarranted changes from V5 that stripped floral overlays, shifted lanterns, modified bottom scenery, or added boxed overlays. | Restored full approved V4 baseline: ambient lighting, floating lanterns, SVG cherry blossoms, bottom mountainscape, and `.hsk-pill` styling. | **DONE** |
| **2. Transparent Jiayou Wordmark** | Restore Jiayou brand logo to transparent, integrated look sitting naturally on sidebar surface; remove solid background box. | Removed `bg-brand-surface p-1` from [`BrandLogo.tsx`](file:///d:/GitHub/jiayou/frontend/src/components/BrandLogo.tsx); logo now sits with 100% transparent background directly on sidebar. | **DONE** |
| **3. Smaller, Corner Palace** | Reduce displayed size noticeably, anchor in upper-right corner, ensure soft blending with NO rectangular pasted image feel. | Container tuned to `w-[540px] max-w-[48vw] h-[300px] max-h-[35vh]` (~37% smaller than V4); mask feathers smoothly to transparent by 92% radius with 0% opacity at all boundaries. | **DONE** |
| **4. Content Preservation** | No other unrelated UI redesign. Preserve cards, companion, streak, roadmap, typography, and dark warm palette. | 100% preserved identical to approved version. | **DONE** |

---

### 3. Visual Verification Evidence (Actual Chromium Browser Captures)

#### A. Authenticated Desktop (1672×941 Reference Viewport)
- Screenshot: [`docs/Design/screenshots/v3-auth-desktop-1672.png`](file:///d:/GitHub/jiayou/docs/Design/screenshots/v3-auth-desktop-1672.png)
- Verified: Transparent Jiayou brand logo in sidebar; refined corner palace with soft radial vignette and no hard rectangular boundaries; full approved atmosphere with cherry blossoms and lanterns.

#### B. Authenticated Desktop (1440×900 Viewport)
- Screenshot: [`docs/Design/screenshots/v3-auth-desktop-1440.png`](file:///d:/GitHub/jiayou/docs/Design/screenshots/v3-auth-desktop-1440.png)
- Verified: Clean composition; transparent logo; palace neatly framed in corner; balanced mountain horizon.

#### C. Authenticated Tablet (768×1024 Viewport)
- Screenshot: [`docs/Design/screenshots/v3-auth-tablet-768.png`](file:///d:/GitHub/jiayou/docs/Design/screenshots/v3-auth-tablet-768.png)
- Verified: Transparent logo on topbar; responsive stacking of cards; decor unobtrusively frames the screen.

#### D. Authenticated Mobile (390×844 Viewport)
- Screenshot: [`docs/Design/screenshots/v3-auth-mobile-390.png`](file:///d:/GitHub/jiayou/docs/Design/screenshots/v3-auth-mobile-390.png)
- Verified: Transparent BrandLogo in mobile header; clean responsive greeting; zero horizontal overflow.

#### E. Guest Desktop (1672×941 Reference Viewport)
- Screenshot: [`docs/Design/screenshots/v3-guest-desktop-1672.png`](file:///d:/GitHub/jiayou/docs/Design/screenshots/v3-guest-desktop-1672.png)
- Verified: Transparent brand logo; greeting `Chào mừng đến với Jiayou! 👋`; single bottom `[🐼 Đăng nhập]` control; intentional curriculum preview with zero fabricated metrics.

---

### 4. Automated Verification & Quality Gates
- **TypeScript & Vite Build**: Passed (`tsc -b && vite build`) — 0 errors.
- **Linter**: Passed (`oxlint`) — 0 warnings, 0 errors across 139 files.
- **Node Legacy Tests**: Passed (9 / 9 tests).
- **Vitest Unit Suite**: Passed (312 / 312 tests across 39 test files).
- **WCAG 2.1 Contrast**: Passed (all dark and light theme tokens exceed 4.5:1 ratio).
