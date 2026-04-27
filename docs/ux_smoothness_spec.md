# UI/UX Smoothness & Loading Strategy — Spec

## 1. Overview
Two pain points degrade the perceived quality of Divi:
1. **Tab switching feels choppy**: Tapping between the 3 main tabs (History, Home, Profile) causes visible re-renders and layout shifts as data loads in.
2. **Data fetching is visible**: Upon login, the user lands on the home screen and sees loading spinners or skeleton flickers while Profile and History data lazily arrive from Supabase.

This spec addresses both issues to make the app feel **instantaneous and fluid**.

---

## 2. Problem 1: Choppy Tab Transitions

### Root Cause
Expo Router's `<Tabs>` component does not preserve the render tree of inactive tabs by default. Each time you switch tabs, the destination tab re-mounts from scratch, which causes:
- A visible white flash or layout shift.
- Any async data (e.g., `useEffect` fetching profile) triggers a loading state on *every* switch.
- Scroll position resets to the top.

### Solution: Freeze Inactive Tabs (Keep them mounted)
React Navigation (underlying Expo Router) supports a `lazy` prop and a `freezeOnBlur` optimization.

**Changes to `app/(tabs)/_layout.tsx`:**
```tsx
<Tabs
  screenOptions={{
    headerShown: false,
    lazy: false,           // Mount ALL tabs on first render, not on-demand
    freezeOnBlur: true,    // Freeze inactive tab render trees (React Native Screens optimization)
    tabBarStyle: { ... },
    // ...existing options
  }}
>
```

- `lazy: false` — All 3 tabs mount immediately when the tab navigator loads. No re-mount on switch.
- `freezeOnBlur: true` — When a tab goes inactive, React Native Screens freezes its native view hierarchy (0 CPU cost while hidden). This prevents wasted re-renders.

**Result:** Switching tabs becomes instant. History stays scrolled where you left it. Profile doesn't re-fetch. No white flashes.

### Additional: Smooth Tab Transition Animation
Currently there is no cross-fade between tab content. To add one:
```tsx
<Tabs
  screenOptions={{
    animation: 'fade',        // Cross-fade between tab screens
    animationDuration: 150,   // Keep it snappy (150ms)
    // ...existing options
  }}
>
```

---

## 3. Problem 2: Visible Data Loading (The "Perceived Speed" Trick)

### Current Flow
```
App Opens → Splash animates (2s) → Splash fades → Main screen renders → Data loads (spinner visible)
```

The user sees the main screen *before* data is ready, so they witness loading spinners, placeholder text, or layout shifts.

### Target Flow
```
App Opens → Splash animates (2s) → [Profile + History fetch in parallel, hidden behind splash] → Splash fades → Main screen renders instantly with all data populated
```

The splash screen acts as a **curtain** that hides the data fetching. The user never sees a loading state.

### Implementation

#### Step A: Extend the `appReady` gate in `_layout.tsx`
Currently, `appReady` is `loaded && !isLoading` where `isLoading` only refers to the Supabase Auth session check. We need to also wait for Profile and History:

```tsx
function RootShell({ loaded }: { loaded: boolean }) {
  const { isLoading: sessionLoading } = useSession();
  const { loading: profileLoading } = useProfile();
  const { loading: historyLoading } = useHistory();
  const isDark = useIsDark();
  const [splashComplete, setSplashComplete] = useState(false);

  // App is only "ready" when fonts, auth, profile, AND history are all loaded
  const appReady = loaded && !sessionLoading && !profileLoading && !historyLoading;

  // ...rest stays the same, using appReady for AnimatedSplash
}
```

**Problem:** `ProfileProvider` and `HistoryProvider` are children of `RootShell`, so their loading states aren't accessible at the `RootShell` level.

**Fix:** Restructure the provider tree. Move `ProfileProvider` and `HistoryProvider` above `RootShell`, or create a tiny `<AppReadyGate>` component that lives inside the providers and controls the splash:

```tsx
// In _layout.tsx
export default function RootLayout() {
  const [loaded] = useFonts({ ... });
  if (!loaded) return null;

  return (
    <AppThemeProvider>
      <SessionProvider>
        <HistoryProvider>
          <ProfileProvider>
            <AppReadyGate loaded={loaded} />
          </ProfileProvider>
        </HistoryProvider>
      </SessionProvider>
    </AppThemeProvider>
  );
}

function AppReadyGate({ loaded }: { loaded: boolean }) {
  const { isLoading: sessionLoading } = useSession();
  const { loading: profileLoading } = useProfile();
  const { loading: historyLoading } = useHistory();
  const [splashComplete, setSplashComplete] = useState(false);

  const appReady = loaded && !sessionLoading && !profileLoading && !historyLoading;

  if (!splashComplete) {
    return (
      <AnimatedSplash appReady={appReady} onComplete={() => setSplashComplete(true)} />
    );
  }

  return <RootShell />;
}
```

#### Step B: Add a safety timeout
If Supabase is slow or offline, we don't want the splash to hang forever. Add a 5-second hard timeout:

```tsx
const [timedOut, setTimedOut] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setTimedOut(true), 5000);
  return () => clearTimeout(timer);
}, []);

const appReady = timedOut || (loaded && !sessionLoading && !profileLoading && !historyLoading);
```

After 5 seconds, the splash dismisses regardless, and whatever data has arrived will be shown. Anything still loading will fall back to the existing inline loading states.

#### Step C: Adjust splash minimum display time
Currently `MIN_DISPLAY_MS = 2000` in `AnimatedSplash.tsx`. Since we're now doing real work behind the splash, this can be reduced to `1500` or even `1200`. The splash will naturally stay visible for as long as data takes to load (usually 1-2 seconds), so the minimum is just a floor for fast connections.

---

## 4. Summary of Changes

| File | Change | Impact |
|---|---|---|
| `app/(tabs)/_layout.tsx` | Add `lazy: false`, `freezeOnBlur: true`, and `animation: 'fade'` to Tabs screenOptions | Eliminates choppy tab switching |
| `app/_layout.tsx` | Restructure provider tree; create `AppReadyGate` that blocks splash until Profile + History load | Data appears instantly when splash fades |
| `components/AnimatedSplash.tsx` | Reduce `MIN_DISPLAY_MS` to 1200-1500 | Slightly faster splash for users on fast connections |

---

## 5. Risk Assessment
- **Low Risk:** `lazy: false` is a well-supported React Navigation option. The only tradeoff is slightly higher initial memory usage (all 3 tabs mount at once), which is negligible for 3 screens.
- **Low Risk:** `freezeOnBlur` is a React Native Screens optimization that's been stable since RN 0.70+.
- **Medium Risk:** Restructuring the provider tree requires careful ordering. `HistoryProvider` and `ProfileProvider` both depend on `SessionProvider`, so they must remain nested inside it. This is already the case.
- **Mitigated:** The 5-second timeout ensures the app never gets stuck on the splash screen, even with network issues.
