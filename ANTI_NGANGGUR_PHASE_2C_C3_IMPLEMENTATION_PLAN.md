# Phase 2C-C — Gate C3 Mobile Tab Bar Polish Implementation Plan

**Gate:** Phase 2C-C Gate C3 Implementation Plan Gate (Revised)
**Date:** 2026-09-17
**Status:** PROPOSED (Strict Planning Mode — Unimplemented)
**Baseline Git Commit:** `08c6249fd8af2873f3d57752478b774147851e4a` (`fix(phase-2c): add mobile kanban toolbar spacing`)
**Synchronization:** `HEAD == origin/main == 08c6249` (Branch: `main`)

---

## 1. Executive Summary

This implementation plan defines the minimal, surgical adjustments required to execute **Gate C3: Mobile Tab Bar Polish & Visual Refinement** for the `ApplicationDetail` modal dialog component.

Gate C3 addresses four concrete issues validated during the C3 forensic audit and accessibility review:

1. **Mobile Safe-Area Handling:** Adding safe-area padding to the mobile tab bar container (`pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 px-2`) to clear the physical home indicator on modern mobile devices (e.g., iPhones).
2. **WCAG-AA Compliant Active State:** Upgrading the active tab state with `font-semibold` contrast, a restrained top accent indicator (`w-6 h-[2px] rounded-full bg-amber-700 dark:bg-amber-400`), and WCAG-compliant color tokens (**`amber-700` in light mode**, **`amber-400` in dark mode**), replacing non-compliant `amber-600`.
3. **SVG Accessibility Attributes:** Adding `aria-hidden="true"` to decorative Lucide icons.
4. **Label Robustness:** Adding `truncate whitespace-nowrap max-w-full` guardrails to tab labels to prevent line wrapping across narrow mobile viewports.

The plan strictly preserves the frozen Gate C2 architecture: single-column layout on `< 1280px`, two-column sidebar layout on `>= 1280px`, and Timeline strictly rendered as a tab inside `MainPanel`.

---

## 2. Baseline

- **Git Commit:** `08c6249fd8af2873f3d57752478b774147851e4a`
- **Remote Synchronization:** `HEAD == origin/main == 08c6249`
- **Branch:** `main`
- **Working Tree State:** Clean of tracked modifications.
- **Rules:** No git reset, no amend, no rebase, no force push.

---

## 3. Current Architecture

```
ApplicationDetail.tsx (Dialog Shell, max-h-[90vh] / max-sm:bottom-0 max-sm:max-h-[92vh])
  └─ ApplicationDetailLayout.tsx (flex flex-col h-full)
       ├─ Drag Handle (sm:hidden, shrink-0)
       ├─ Header (shrink-0, border-b)
       ├─ Basin (flex flex-1 min-h-0 overflow-hidden)
       │    ├─ Desktop Sidebar (hidden xl:block w-60 border-r)
       │    │    └─ TabNavigation (variant="sidebar")
       │    └─ Main Content Basin (flex-1 min-w-0 overflow-y-auto)
       │         └─ MainPanel (JobDescription | CompanyInfo | Documents | Timeline)
       └─ Mobile Bottom Tab Bar (xl:hidden shrink-0 border-t)
            └─ TabNavigation (variant="bottom-bar")
```

- **< 1280px:** Single-column layout. Main content scrolls vertically above the bottom tab bar.
- **>= 1280px:** Desktop 2-column layout. Sidebar navigation active; bottom tab bar is hidden (`xl:hidden`).
- **Timeline:** Renders strictly inside `MainPanel`; never restores a persistent right panel.

---

## 4. Exact C3 Scope

Only these **2 production source files** and **1 test file** are authorized for modification:

1. `src/components/applications/ApplicationDetail/components/LeftPanel/TabNavigation.tsx`
   - Refine `variant === 'bottom-bar'` button active indicator, typography weight, WCAG-compliant color tokens (`amber-700` light / `amber-400` dark), icon accessibility, and label robustness.
2. `src/components/applications/ApplicationDetail/components/ApplicationDetailLayout.tsx`
   - Update `xl:hidden` bottom tab bar container padding to include safe-area bottom handling (`pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 px-2`).
3. `src/components/applications/__tests__/ApplicationDetail.test.tsx`
   - Add regression tests verifying the safe-area padding class, icon `aria-hidden="true"`, active font-weight and WCAG color distinctions, and label nowrap attributes.

**No other file may be modified.**

---

## 5. Safe-Area Decision

The approved safe-area strategy is frozen:

- **Selected Strategy:** `pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 px-2`
- **Technical Rationale:**
  1. `pt-1.5` (6px) and `max(0.375rem, ...)` (6px fallback) provide **exact vertical symmetry** on devices with zero inset.
  2. On devices with non-zero safe-area insets (e.g., iPhone home indicator with 20px or 34px), the value automatically resolves to the device's physical inset (`max(6px, 34px) = 34px`).
  3. Prevents inflating the bottom navigation bar on desktop browsers, Android navigation-bar devices, or iPads where the inset is 0px.

---

## 6. Bottom Bar Height Calculation

| Dimension Component                                            | Zero Inset (0px)     | iPhone SE / Notch (20px) | iPhone Pro / Home Bar (34px) |
| -------------------------------------------------------------- | -------------------- | ------------------------ | ---------------------------- |
| Outer Container Top Padding (`pt-1.5`)                         | 6px                  | 6px                      | 6px                          |
| Nav Internal Padding (`p-1`)                                   | 4px top + 4px bottom | 4px top + 4px bottom     | 4px top + 4px bottom         |
| Tab Button Height (`min-h-[48px]`)                             | 48px                 | 48px                     | 48px                         |
| Outer Container Bottom Padding (`pb-[max(0.375rem,env(...))]`) | **6px**              | **20px**                 | **34px**                     |
| **Total Computed Bar Height**                                  | **68px**             | **82px**                 | **96px**                     |

- **Zero Inset Devices (68px):** Extremely compact, balanced, and comfortable (~68px total).
- **Home Indicator Devices (96px):** Exactly 34px safe clear area at the bottom, leaving the 48px interactive button completely above the physical home swipe indicator.
- **MainPanel Available Height:** Since the modal shell on mobile has `max-h-[92vh]`, an 82–96px tab bar leaves >80% of viewport height available for content scrolling.

---

## 7. Active State Design & WCAG Contrast Forensics

### A. WCAG 2.1 AA Contrast Ratios (Mathematical Verification)

Calculated using standard relative luminance formula $L = 0.2126R + 0.7152G + 0.0722B$ (sRGB to linear conversion):

1. **Light Active Text (`amber-700`: `#b45309` / rgb 180, 83, 9) vs Effective Active Background:**
   - Base Surface: `--modal-header` = `#ffffff` (rgb 255, 255, 255).
   - Active Tint: `amber-500/10` = `rgba(245, 158, 11, 0.10)`.
   - Effective Composited Background: $0.10 \times (245, 158, 11) + 0.90 \times (255, 255, 255) = (254, 245, 231)$ (`#fef5e7`).
   - Luminance: $L_{\text{amber-700}} = 0.1621$, $L_{\text{bg}} = 0.9181$.
   - **Contrast Ratio:** $(0.9181 + 0.05) / (0.1621 + 0.05) =$ **`4.65:1`** (Exceeds WCAG AA normal text threshold of 4.5:1).
   - _(Note: On pure white `#ffffff`, contrast ratio is **`5.02:1`**)._
   - _(Contrast Defect in Previous Proposal: Standard `amber-600` `#d97706` has a ratio of only `3.19:1`, which FAILS WCAG AA for normal text. `amber-700` is strictly required)._

2. **Light Active Indicator (`amber-700`: `#b45309`) vs Effective Active Background:**
   - **Contrast Ratio:** **`4.65:1`** (Exceeds WCAG 2.1 AA non-text UI component requirement of 3.0:1).

3. **Dark Active Text (`amber-400`: `#fbbf24` / rgb 251, 191, 36) vs Effective Dark Active Background:**
   - Base Surface: `--modal-header` = `#0f0f11` (rgb 15, 15, 17).
   - Active Tint: `amber-500/15` = `rgba(245, 158, 11, 0.15)`.
   - Effective Composited Background: $0.15 \times (245, 158, 11) + 0.85 \times (15, 15, 17) = (50, 36, 16)$ (`#322410`).
   - Luminance: $L_{\text{amber-400}} = 0.5841$, $L_{\text{dark-bg}} = 0.0204$.
   - **Contrast Ratio:** $(0.5841 + 0.05) / (0.0204 + 0.05) =$ **`9.01:1`** (Exceeds WCAG AAA requirement of 7.0:1).
   - _(Note: On pure dark header `#0f0f11`, contrast ratio is **`11.47:1`**)._

4. **Dark Active Indicator (`amber-400`: `#fbbf24`) vs Effective Dark Active Background:**
   - **Contrast Ratio:** **`9.01:1`** (Exceeds WCAG 2.1 AA non-text UI component requirement of 3.0:1).

5. **Inactive Text on Light Surface (`--text-secondary`: `#64748b` / Slate 500 on `#ffffff`):**
   - **Contrast Ratio:** **`4.76:1`** (Exceeds WCAG AA normal text threshold of 4.5:1).

6. **Inactive Text on Dark Surface (`--text-secondary`: `#a1a1aa` / Zinc 400 on `#0f0f11`):**
   - **Contrast Ratio:** **`7.47:1`** (Exceeds WCAG AAA requirement of 7.0:1).

### B. Specification & Geometry

- **Indicator Element:** A subtle, centered horizontal top accent pill inside each active tab button:
  ```tsx
  {
    isActive && (
      <span
        className="absolute top-1 w-6 h-[2px] rounded-full bg-amber-700 dark:bg-amber-400 transition-all duration-150"
        aria-hidden="true"
      />
    )
  }
  ```
- **Geometry & Invariants:**
  - `location`: `absolute top-1` (centered horizontally via parent flex centering).
  - `height`: `2px` (`h-[2px]`).
  - `width`: `24px` (`w-6`).
  - `radius`: `rounded-full`.
  - `color`: `bg-amber-700 dark:bg-amber-400` (WCAG-compliant accent match).
  - `layout impact`: `absolute` positioning guarantees zero layout shift.
  - `clipping safety`: Button has `relative`; top-1 sits 4px below button edge, 10px below container border-top. No clipping or conflict with `border-t`.
- **Button Styling:**
  - **Active Button:**
    - Background: `bg-amber-500/10 dark:bg-amber-500/15`
    - Text / Icon: `text-amber-700 dark:text-amber-400`
    - Typography: `font-semibold`
  - **Inactive Button:**
    - Background: Transparent (Hover: `hover:bg-[var(--surface-recessed)]`)
    - Text: `text-[var(--text-secondary)] hover:text-[var(--text-primary)]`
    - Icon: `text-[var(--text-muted)]`
    - Typography: `font-medium`

---

## 8. Icon Accessibility

- **Change:** Add `aria-hidden="true"` to the decorative Lucide icon inside the button:
  ```tsx
  <Icon
    className={cn(
      'w-[18px] h-[18px] flex-shrink-0 transition-colors mb-0.5',
      isActive ? 'text-amber-700 dark:text-amber-400' : 'text-[var(--text-muted)]'
    )}
    aria-hidden="true"
  />
  ```
- **Verification:**
  - The button retains its accessible text name from `<span ...>{tab.label}</span>`.
  - Screen readers will announce the tab name without reading decorative SVG nodes.
  - `role="tab"`, `aria-selected`, and `aria-controls` remain fully intact.

---

## 9. Label Overflow Strategy

- **Classes:**
  ```tsx
  className={cn(
    'text-[11px] sm:text-xs leading-none truncate whitespace-nowrap max-w-full',
    isActive ? 'font-semibold text-amber-700 dark:text-amber-400' : 'font-medium'
  )}
  ```
- **Rationale:**
  - `whitespace-nowrap`: Prevents words from breaking onto two lines.
  - `truncate max-w-full`: Guarantees text truncates with ellipsis if rendered on narrow devices (sub-360px), preserving vertical button height across all 4 tabs.

---

## 10. Touch Target Analysis

- **Height:** Kept at `min-h-[48px]`.
- **Width:** Distributed evenly across 4 columns in `grid grid-cols-4`:
  - 360px screen: ~85px width.
  - 375px screen: ~89px width.
  - 390px screen: ~93px width.
  - 430px screen: ~103px width.
- **Result:** Clickable touch target area is at least 85px × 48px, exceeding the 44px × 44px (Apple HIG) and 48px × 48px (Google Material) standards.

---

## 11. Light/Dark Theme Strategy

- Uses existing semantic tokens:
  - Container: `bg-[var(--modal-header)] border-[var(--modal-divider)]`
  - Inactive Hover: `hover:bg-[var(--surface-recessed)]`
  - Inactive Text: `text-[var(--text-secondary)]`
  - Inactive Icon: `text-[var(--text-muted)]`
  - Active Accent: `text-amber-700 dark:text-amber-400`, `bg-amber-700 dark:bg-amber-400`, `bg-amber-500/10 dark:bg-amber-500/15`
- No changes to `globals.css`, `legacy-shadcn.css`, or `semantic-colors.css`.
- 100% solid, opaque surface architecture preserved.

---

## 12. Desktop Isolation

- All changes in `TabNavigation.tsx` are strictly enclosed in `if (variant === 'bottom-bar') { ... }`.
- Desktop sidebar uses `variant === 'sidebar'` (unmodified).
- In `ApplicationDetailLayout.tsx`, changes are restricted to the `<div className="xl:hidden ...">` container.
- At `>= 1280px`, `xl:hidden` applies `display: none`.
- Desktop layout is 100% isolated.

---

## 13. Test Plan

Add tests to `src/components/applications/__tests__/ApplicationDetail.test.tsx` under `describe('Phase 2C-C — Mobile Navigation Architecture', ...)`:

1. **Safe-Area Padding Assertion:**
   - Render `ApplicationDetailLayout` or `ApplicationDetail`.
   - Verify the bottom-bar container has class `pb-[max(0.375rem,env(safe-area-inset-bottom))]`.
2. **Icon Accessibility Assertion:**
   - In `TabNavigation` with `variant="bottom-bar"`, query the SVG icons and assert `aria-hidden="true"`.
3. **Active/Inactive State Distinction:**
   - Verify active tab label has `font-semibold` and `text-amber-700 dark:text-amber-400`.
   - Verify inactive tab label has `font-medium`.
   - Verify active tab button contains the top indicator accent element (`bg-amber-700 dark:bg-amber-400`).
4. **Label Robustness:**
   - Verify tab label has `truncate` and `whitespace-nowrap`.
5. **Dynamic Test Reporting:**
   - Full test suite must pass with zero failures; report the actual test/file counts produced by the repository at implementation time without assuming hardcoded counts.

_Note: JSDOM does not compute physical device safe-area insets. Class-level assertion is the standard and correct approach in Vitest._

---

## 14. Runtime Verification Limitations

- **Headless Environment:** Playwright, Puppeteer, and Cypress are not installed.
- **Verification Division:**
  - Automated Static Verification: Lint, TypeScript, Vitest unit tests, Next.js production build, CSS bytecode inspection.
  - Physical Runtime Verification: **UNVERIFIED** (marked explicitly as requiring manual device verification on physical iOS/Android hardware).

---

## 15. Regression Analysis

- **MainPanel Available Height:** The 68px–96px tab bar does not encroach on scrolling content because `MainPanel` occupies `flex-1 min-h-0 overflow-y-auto` above the tab bar.
- **Scroll Behavior:** Unchanged. `MainPanel` scrolls independently; bottom bar remains docked at `shrink-0`.
- **Edit Mode:** In edit mode, `ApplicationForm` renders in place of `ApplicationDetailLayout`; bottom bar is unmounted, avoiding keyboard conflict.
- **Desktop Sidebar:** Completely isolated; zero regression risk.

---

## 16. Exact Diff Specification

### File 1: `src/components/applications/ApplicationDetail/components/ApplicationDetailLayout.tsx`

```diff
@@ -175,3 +175,3 @@
       {/* Mobile & Tablet Bottom Tab Bar (< 1280px) */}
-      <div className="xl:hidden shrink-0 border-t border-[var(--modal-divider)] bg-[var(--modal-header)] py-1 px-1.5">
+      <div className="xl:hidden shrink-0 border-t border-[var(--modal-divider)] bg-[var(--modal-header)] pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] px-2 shadow-xs">
         <TabNavigation
```

### File 2: `src/components/applications/ApplicationDetail/components/LeftPanel/TabNavigation.tsx`

```diff
@@ -86,8 +86,8 @@
               className={cn(
-                'flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-150',
+                'relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150',
                 'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
                 'min-h-[48px]',
                 isActive
-                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15'
+                  ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15'
                   : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-recessed)]',
                 disabled && 'opacity-50 cursor-not-allowed'
               )}
             >
+              {isActive && (
+                <span
+                  className="absolute top-1 w-6 h-[2px] rounded-full bg-amber-700 dark:bg-amber-400"
+                  aria-hidden="true"
+                />
+              )}
               <Icon
                 className={cn(
                   'w-[18px] h-[18px] flex-shrink-0 transition-colors mb-0.5',
-                  isActive ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)]'
+                  isActive ? 'text-amber-700 dark:text-amber-400' : 'text-[var(--text-muted)]'
                 )}
+                aria-hidden="true"
               />
               <span
                 className={cn(
-                  'text-[11px] sm:text-xs font-medium leading-none',
-                  isActive ? 'text-amber-600 dark:text-amber-400' : ''
+                  'text-[11px] sm:text-xs leading-none truncate whitespace-nowrap max-w-full',
+                  isActive
+                    ? 'font-semibold text-amber-700 dark:text-amber-400'
+                    : 'font-medium'
                 )}
               >
                 {tab.label}
               </span>
```

### File 3: `src/components/applications/__tests__/ApplicationDetail.test.tsx`

- Add test asserting:
  - Icons in bottom-bar have `aria-hidden="true"`.
  - Active tab has `font-semibold` and `text-amber-700 dark:text-amber-400`.
  - Inactive tabs have `font-medium`.
  - Bottom bar container has `pb-[max(0.375rem,env(safe-area-inset-bottom))]`.

---

## 17. Verification Commands

1. Check formatting / whitespace:
   ```bash
   git diff --check
   ```
2. Lint check:
   ```bash
   npm run lint
   ```
3. Type check:
   ```bash
   npx tsc --noEmit
   ```
4. Targeted test:
   ```bash
   npm test src/components/applications/__tests__/ApplicationDetail.test.tsx -- --run
   ```
5. Full test suite:
   ```bash
   npm test -- --run
   ```
6. Production build (ensure dev server stopped):
   ```bash
   npx next build
   ```
7. Diff scope check:
   ```bash
   git diff --name-only
   ```
   Must output strictly:
   ```text
   src/components/applications/ApplicationDetail/components/ApplicationDetailLayout.tsx
   src/components/applications/ApplicationDetail/components/LeftPanel/TabNavigation.tsx
   src/components/applications/__tests__/ApplicationDetail.test.tsx
   ```

---

## 18. Scope Lock

The following files and components are **FROZEN & OUT OF SCOPE**:

- `KanbanBoardV3.tsx`
- `ApplicationsToolbar.tsx`
- `use-horizontal-scroll.ts`
- `ApplicationDetail.tsx`
- `ActionButtons.tsx`
- `MainPanel.tsx`
- `JobDescription.tsx`, `CompanyInfo.tsx`, `Documents.tsx`, `ApplicationTimeline.tsx`
- `globals.css`, `legacy-shadcn.css`, `semantic-colors.css`
- All Server Actions, Supabase client, and database schemas

---

## 19. Definition of Done

1. Bottom bar container has `pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] px-2 shadow-xs`.
2. Active tab has `font-semibold`, top accent indicator pill (`w-6 h-[2px] rounded-full bg-amber-700 dark:bg-amber-400`), and WCAG-compliant amber text/icon (`text-amber-700 dark:text-amber-400`).
3. Inactive tab has `font-medium`, muted icon, and secondary text.
4. Lucide icons have `aria-hidden="true"`.
5. Tab labels have `truncate whitespace-nowrap max-w-full`.
6. Full test suite must pass with zero failures; report the actual test/file counts produced by the repository at implementation time.
7. TypeScript, ESLint, and Next.js production build pass cleanly.
8. Exactly 3 files modified in git diff.

---

## 20. Risks & Mitigations

| Risk                                                         | Mitigation                                                                                           |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Safe-area padding causes oversized bottom bar on 0px devices | `max(0.375rem, ...)` restricts padding to 6px on 0px devices, keeping total bar height to ~68px.     |
| Top indicator clips or overflows button                      | Positioned at `absolute top-1` with `h-[2px]`, well within the 48px button boundary.                 |
| WCAG contrast failure on light mode                          | Explicitly resolved by using `amber-700` (`4.65:1`), replacing non-compliant `amber-600` (`3.19:1`). |
| Desktop sidebar regression                                   | Changes isolated to `variant === 'bottom-bar'` and `xl:hidden` container.                            |

---

## 21. Rollback Strategy

If any quality gate fails or regression occurs during implementation:

1. Discard working tree changes using `git checkout -- <file>`.
2. Confirm git status is restored to clean baseline `08c6249`.

---

## 22. Final Verdict

**READY FOR C3 IMPLEMENTATION**
