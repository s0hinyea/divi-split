# Error & Alert Design System — Spec

## 1. Overview
Currently, Divi relies heavily on native OS alerts (`Alert.alert()`). While functional, this breaks immersion, looks unbranded, and relies on generic, disruptive dialog boxes for everything from critical failures to minor inline validations.

This spec defines a new **Custom Error Architecture** designed to seamlessly match the app's aesthetics (colors, fonts, radii) and introduces a hierarchy of error states so users aren't spammed with pop-ups.

---

## 2. The Error Hierarchy

Instead of treating all errors equally, we will categorize them into four distinct UX patterns:

### Level 1: Inline Validation (Sublines)
**Use Case:** Form entry errors, invalid credentials, missing fields.
**Design Pattern:** No pop-ups. A localized red subtext line (`colors.error` or similar) rendered directly below the offending `TextInput`. The `TextInput` border should also shift to the error color. If typing starts again, the error automatically clears.
**Where to apply:**
- **Auth Screen:** "Invalid email or password", "Password must be at least 6 characters".
- **Profile Screen:** "Username is already taken" or "Invalid Venmo handle".

### Level 2: Floating Toasts/Banners (Non-blocking)
**Use Case:** Operations that fail in the background, success confirmations, or state warnings.
**Design Pattern:** A sleek, pill-shaped floating banner that slides down from the top (or up from the bottom), matching Divi's design system (custom shadows, rounded borders). It automatically dismisses after 3 seconds. It does not interrupt the user's flow.
**Where to apply:**
- **Network Issues:** "Cannot connect to server. Please try again."
- **Success:** "Profile updated successfully" or "Receipt saved to history."
- **Clipboards:** "Copied Venmo link to clipboard."

### Level 3: Custom Modals (Interruptive / Blocking)
**Use Case:** Destructive actions, hardware permission failures, or critical flow blockers.
**Design Pattern:** A custom React Native `<Modal>` component with a `BlurView` backdrop. It uses Divi's typography (`fonts.bodyBold`) with styled primary/secondary buttons (e.g., black capsule buttons) instead of the rigid blue Apple system buttons.
**Where to apply:**
- **Destructive:** "Are you sure you want to delete your account? This cannot be undone."
- **Permissions:** "Divi needs camera access to scan receipts. [Go to Settings | Cancel]"
- **Abandonment:** "Discard current receipt? You will lose unsaved changes."

### Level 4: Contextual UI Flags (Informational)
**Use Case:** OCR Confidence issues, Math mismatches, Agentic hints.
**Design Pattern:** Inline yellow/orange badges or warning cards built directly into the screen layout. They don't block the user but draw visual attention to data that requires human review.
**Where to apply:**
- **Math Mismatch:** A warning card permanently resting above the "Grand Total" on the Review screen that says: *"The calculated items don't add up to the scanned receipt total. Please review."*
- **Low Confidence Item:** An item row on the Modify screen glows faintly orange with a small alert icon next to its name if the OCR struggled to read it.

---

## 3. The Implementation Strategy

### A. Reusable Components to Build
To execute this, we will build three core components so we don't repeat code everywhere:
1. `<InputWithFeedback />`: A wrapper around `TextInput` that accepts an `errorText` prop and manages the red sublines and border highlights.
2. `<ToastProvider />`: A global context provider wrapping the app layout, exposing a `showToast(message, type)` function.
3. `<CustomAlert />`: A heavily designed modal component that mimics `Alert.alert` (accepts title, message, and button configurations) but is built entirely with Divi UI components.

### B. Aesthetic Updates to `theme.ts`
We will inject a cohesive semantic color palette into the global theme tokens:
```typescript
const semantic = {
  error: '#EF4444', // Red for invalid creds / destructive actions
  warning: '#F59E0B', // Amber for math mismatches / low confidence
  success: '#10B981', // Green for saved receipts
}
```

### C. Deprecating `Alert.alert`
Once the components are built, we will run a global find-and-replace for `Alert.alert` in the codebase and map them to their correct new tier (Inline, Toast, or Modal). 

### D. Animations
All new alerts (Modals and Toasts) will enter via `LayoutAnimation` or React Native Reanimated spring physics. Nothing should "snap" abruptly onto the screen. Every error appearance should feel fluid and premium.
