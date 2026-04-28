# Divi iOS EAS Build History — Build 20 to 28

## Context

Divi is an Expo SDK 54 / React Native 0.81.4 bill-splitting app. We are trying to get a working TestFlight build via `eas build -p ios --profile production --auto-submit`. The app works fine in Expo Go locally but has been failing on EAS Build due to a cascade of configuration issues.

**Key files:**
- `frontend/app.json` — Expo config
- `frontend/eas.json` — EAS build profiles
- `frontend/.easignore` — Controls what files are uploaded to EAS servers
- `frontend/.gitignore` — Has `ios/` and `android/` listed
- Root `.gitignore` — Does NOT have `ios/` or `android/` listed

**Apple credentials (stored on Expo servers):**
- Bundle ID: `com.sohi.divi`
- Apple Team: `7KK4AZ4AUY`
- Provisioning Profile: `*[expo] com.sohi.divi AppStore 2026-04-11T02:52:39.824Z`

---

## Build 20 (d17564b6) — ❌ ERRORED

**Error:** `Could not find target 'Divi' in project.pbxproj`

**Root cause:** An old, stale `ios/` directory was being tracked in git from a previous `npx expo run:ios` command. This `ios/` directory was uploaded to EAS, making it a "bare" workflow. But the stale `project.pbxproj` inside had a mismatched or missing target. EAS's config-plugins tried to find a target named `'Divi'` (from `app.json` `name` field) and couldn't find it.

**Fix attempted:** Deleted `ios/` and `android/` from git, added them to `.gitignore`.

---

## Build 21 — ❌ ERRORED (never submitted — same commit as 20)

**Same error:** `Could not find target 'Divi' in project.pbxproj`

**Root cause:** Even though `ios/` was removed from git, it was recreated locally by running `npx expo prebuild`. The `eas build` CLI uploads from the **local filesystem**, not from git. Since a local `ios/` directory existed, EAS treated it as bare workflow again.

**Fix attempted:** Created `.easignore` file with `ios/` and `android/` entries to prevent uploading native dirs. Also `rm -rf ios/`.

---

## Build 22 (9382d079) — ❌ ERRORED

**Error:** `Could not find target 'Divi' in project.pbxproj`

**Root cause:** The `.easignore` was created but the `ios/` directory was recreated again by a debug `npx expo prebuild` command. Despite `.easignore`, the timing or caching caused the same issue.

**Fix attempted:** Changed `app.json` `"name"` from `"Divi"` to `"divi"` (lowercase) to match `package.json` `"name": "divi"`. Theory was that EAS generates the Xcode target name from the app name, and the case mismatch was the issue.

---

## Build 24 (after build 23 skipped) — ❌ ERRORED

**Error:** `Provisioning profile "*[expo] com.sohi.divi AppStore..." has app ID "com.sohi.divi", which does not match the bundle ID "com.anonymous.divi". (in target 'divi' from project 'divi')`

**Root cause:** The lowercase name `"divi"` change fixed the target lookup issue (target was now `divi`, found successfully). However, in **managed workflow** (no `ios/` dir uploaded), when EAS ran `npx expo prebuild` on their server, it generated the bundle identifier as `com.anonymous.divi` instead of respecting `ios.bundleIdentifier: "com.sohi.divi"` from `app.json`. The `com.anonymous` prefix is Expo's default when the `owner` field is not set in `app.json`.

**Fix attempted:** Removed `appVersionSource: "remote"` from `eas.json`, set it to `"local"`.

---

## Build 26 — ❌ ERRORED

**Same error:** `bundle ID "com.anonymous.divi"` mismatch with provisioning profile `com.sohi.divi`

**Root cause:** The `appVersionSource` change didn't affect bundle ID generation. The fundamental issue remained: EAS server prebuild was generating `com.anonymous.divi`.

**Fix attempted:** Reverted `name` back to `"Divi"` (uppercase), generated `ios/` directory locally with `npx expo prebuild --platform ios --clean`, verified locally that `PRODUCT_BUNDLE_IDENTIFIER = "com.sohi.divi"` was correct in the generated `project.pbxproj`. Updated `.easignore` to NOT exclude `ios/` so the verified local native code would be uploaded to EAS instead of EAS regenerating it.

---

## Build 27 (71856ef5) — ❌ ERRORED

**Error:** `Unknown error. See logs of the Install pods build phase for more information.`

**Root cause:** The local `ios/` directory was included in the upload (bare workflow), fixing the bundle ID issue. However, the local `ios/` dir was incomplete — it had no `Podfile.lock` or `Pods/` directory because CocoaPods failed to install locally due to a Ruby encoding error (`UnicodeNormalize.normalize: Unicode Normalization not appropriate for ASCII-8BIT`). EAS tried to run `pod install` on their server with this incomplete directory and failed.

**Fix attempted:** Added `"owner": "s0hinyea123"` to `app.json` to prevent `com.anonymous` fallback. Reverted `.easignore` to exclude `ios/` and `android/` again (back to managed workflow). Theory: the `owner` field would fix the bundle ID generation on EAS servers.

---

## Build 28 — ⏳ PENDING (latest)

**Changes for this build:**
- `app.json`: `"name": "Divi"`, `"owner": "s0hinyea123"`, `ios.bundleIdentifier: "com.sohi.divi"`
- `.easignore`: excludes `ios/` and `android/` (managed workflow)
- `eas.json`: `appVersionSource: "local"`, `autoIncrement: true`
- No local `ios/` directory exists
- EAS CLI confirmed `Bundle Identifier: com.sohi.divi` in credential check before upload

**Status:** Building on EAS servers. If this fails with `com.anonymous.divi` again, the `owner` field approach didn't fix it.

---

## Summary of What We Know

| Issue | Status |
|-------|--------|
| Target name mismatch (`Divi` vs `divi`) | ✅ Fixed — reverted to `"name": "Divi"` |
| Stale `ios/` dir in git | ✅ Fixed — removed from git, added to `.gitignore` |
| Local `ios/` dir getting uploaded | ✅ Fixed — `.easignore` excludes it |
| `com.anonymous.divi` bundle ID in managed mode | ❓ Possibly fixed by adding `"owner"` field |
| CocoaPods install failure (bare workflow) | Not relevant if managed workflow works |

## Current `app.json` (Build 28)

```json
{
  "expo": {
    "name": "Divi",
    "slug": "divi",
    "owner": "s0hinyea123",
    "version": "1.0.0",
    "scheme": "divi",
    "newArchEnabled": false,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sohi.divi",
      "buildNumber": "28",
      ...
    },
    ...
  }
}
```

## Current `eas.json`

```json
{
  "cli": {
    "version": ">= 12.5.0",
    "appVersionSource": "local"
  },
  "build": {
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "itzkrisp9000@gmail.com",
        "ascAppId": "6762031093",
        "appleTeamId": "7KK4AZ4AUY"
      }
    }
  }
}
```

## Current `.easignore`

```
ios/
android/
```

## If Build 28 Also Fails

If `com.anonymous.divi` persists, the next approach should be:
1. **Use `app.config.js`** instead of `app.json` to programmatically force config values during prebuild
2. Or **include the `ios/` directory** (bare workflow) but first fix CocoaPods locally — the Ruby 4.0 encoding issue needs `LANG=en_US.UTF-8` or downgrading Ruby
3. Or create a custom **EAS Build hook** (`eas-build-pre-install`) that patches the `project.pbxproj` bundle ID after prebuild runs on the server

## Key Dependency Note

`react-native-document-scanner-plugin` (v2.0.4) is incompatible with the New Architecture on iOS. That's why `newArchEnabled: false` is set. Without this, the app crashes on startup silently.
