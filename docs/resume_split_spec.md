# Resume In-Progress Split — Spec

## 1. Problem

The split flow (contacts → result → assign → review) is a multi-step process that can
be interrupted. Currently there is no way to leave and return to it: the state lives in
Zustand memory but there is no UI to reconnect. Additionally, starting a new scan while
a split is in progress silently overwrites the previous state with no warning.

---

## 2. Goals

1. **Resume** — a user who navigates away can see their in-progress split and jump back
   to the exact screen they were on.
2. **Discard** — a user who wants to start fresh gets a clear, branded confirmation
   before their progress is lost.
3. **Guard new scans** — the floating + button warns before overwriting an active split.
4. **Zero regression** — screens already completed (contacts selected, items assigned)
   must not be lost or reset on resume.

---

## 3. Split Steps Enum

```
'contacts' → 'result' → 'assign' → 'review' → null (done)
```

Each screen sets its step on mount. `null` means no split is in progress.

---

## 4. Store Changes (`splitStore.ts`)

### New fields
```ts
currentStep: 'contacts' | 'result' | 'assign' | 'review' | null;
resumeContactIndex: number; // persists assign-screen carousel position
```

### New actions
```ts
setCurrentStep(step: 'contacts' | 'result' | 'assign' | 'review' | null): void;
setResumeContactIndex(index: number): void;
```

### Updated actions
- `resetStore` must also set `currentStep: null` and `resumeContactIndex: 0`.

---

## 5. Step Tracking (per screen)

Each screen calls `setCurrentStep` inside a `useEffect(() => { ... }, [])` on mount.

| Screen | Step set on mount | Step cleared on back |
|---|---|---|
| contacts.tsx | `'contacts'` | `null` (back → home resets) |
| result.tsx | `'result'` | — (back → contacts, step stays) |
| assign.tsx | `'assign'` | — |
| review.tsx | `'review'` | — |

`currentContactIndex` changes in `assign.tsx` are synced to `resumeContactIndex` via
`setResumeContactIndex` so that on resume the user lands on the correct contact.

When `resetStore` is called (on successful finish), both `currentStep` and
`resumeContactIndex` are cleared.

---

## 6. Home Tab — "Resume Split" Banner

**When shown:** `currentStep !== null` AND `receiptData.items.length > 0`.

**Placement:** Rendered at the top of the scrollable content in `(tabs)/index.tsx`,
above the stats cards, so it is immediately visible.

**Design:**
- White card, green left border accent (3px), subtle shadow
- Icon: `schedule` (clock) in green
- Title: **"Split in progress"** (bodyBold)
- Subtitle: e.g. *"Tap to pick up where you left off."* (body, gray500)
- Step indicator pill: small gray100 pill showing current step label
  (`"Selecting contacts"` / `"Editing items"` / `"Assigning items"` / `"Reviewing"`)
- Two action buttons in a row:
  - **Resume** — black capsule button (full width flex) → routes to correct screen
  - **Discard** — ghost/outline button → shows `CustomAlert` to confirm discard

**Routing on resume:**
```
'contacts' → router.push('/contacts')
'result'   → router.push('/result')
'assign'   → router.push({ pathname: '/assign', params: { initialIndex: resumeContactIndex } })
'review'   → router.push('/review')
```

---

## 7. Scan Button Guard (`(tabs)/_layout.tsx`)

When the floating `+` button is pressed and `currentStep !== null`:
- Do NOT open the scan modal.
- Show `CustomAlert`:
  - Title: **"Split already in progress"**
  - Message: *"You have an unfinished split. Would you like to resume it or start over?"*
  - Buttons:
    - `{ text: 'Resume', onPress: resumeSplit }` — same routing logic as above
    - `{ text: 'Discard & New Scan', style: 'destructive', onPress: () => { resetStore(); showScanModal(); } }`
    - `{ text: 'Cancel', style: 'cancel' }`

---

## 8. Contacts Back → Home Guard

`contacts.tsx` currently does `router.replace('/(tabs)')` on back. This is the only
back path that abandons an early-stage split (no contacts selected yet, but items exist).
We keep the route as-is but call `setCurrentStep(null)` AND `resetStore()` when the user
presses back from contacts — since going back here means they are choosing not to
continue the scan at all.

Rationale: at the contacts step the user has not invested effort beyond the scan. A
clean slate is the right default. If they want to re-split the same receipt they can use
the History screen's edit flow.

---

## 9. Out of Scope

- **Persistence across app restarts** (AsyncStorage/MMKV). The in-progress state lives
  only in memory. If the app is killed, state is lost. This is acceptable for v1.
- **Zustand devtools / hydration** — no changes to persistence layer.
- **Multiple simultaneous splits** — one split at a time only.

---

## 10. Files Changed

| File | Change |
|---|---|
| `frontend/stores/splitStore.ts` | Add `currentStep`, `resumeContactIndex`, `setCurrentStep`, `setResumeContactIndex`; update `resetStore` |
| `frontend/app/contacts.tsx` | `setCurrentStep('contacts')` on mount; `resetStore()` + `setCurrentStep(null)` on back |
| `frontend/app/result.tsx` | `setCurrentStep('result')` on mount |
| `frontend/app/assign.tsx` | `setCurrentStep('assign')` on mount; sync `currentContactIndex` → `setResumeContactIndex` |
| `frontend/app/review.tsx` | `setCurrentStep('review')` on mount |
| `frontend/app/(tabs)/index.tsx` | Add `ResumeSplitBanner` component |
| `frontend/app/(tabs)/_layout.tsx` | Guard `+` button with in-progress check |
