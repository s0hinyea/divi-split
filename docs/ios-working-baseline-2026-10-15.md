# Divi iOS working baseline — 15 October 2026

This is a record of the first reported working release build after the October 2026 launch-crash investigation. It documents an existing artifact; it is not a backup of the repository, Xcode archive, phone, or Supabase data.

## Confirmed working build

| Item | Evidence |
| --- | --- |
| App | Divi, bundle ID `com.sohi.divi`, version `1.0.0` |
| Installed iPhone build | **67**, read from the paired iPhone with `xcrun devicectl device info apps` on 15 October 2026 |
| Launch result | Owner reports that the Xcode-uploaded build launches and behaves normally in TestFlight. Core feature journeys have not yet been systematically verified. |
| Xcode archive | `~/Library/Developer/Xcode/Archives/2026-10-15/Divi 10-15-26, 12.52 PM.xcarchive` |
| Upload | The archive's `Info.plist` records `uploadedBuildNumber = 67` and a successful upload to Apple at `2026-10-15T16:56:13Z` (12:56 PM EDT). |
| Local native build | Xcode 26.6, iOS SDK 26.5, Expo SDK `~54.0.34`, React Native `0.81.5`, legacy architecture. |
| Repository baseline | Branch `codex/production-baseline`, commit `480a739fdb4ba0296fa234695724a48f76c79c4f` (`fix: isolate RevenueCat launch crash`). This is the closest recorded source state, not a cryptographically proven source manifest for the archive. |

The archive's own app and project file both say build **59**. Xcode changed the number to **67 during distribution**, as recorded in the archive's `Distributions` metadata. The repository still says 59. Future releases must record the uploaded number explicitly; the archive's original number alone is insufficient.

The archive contains an embedded production JavaScript bundle (`main.jsbundle`), so it does not require a Metro development server at launch. Its SHA-256 is `12766a1807cbb59df05dd84e68fc75f11480ef6a035de54adab3ae56e32efe5c`. The downloaded EAS build 66 IPA has the **same JavaScript bundle hash** and the same Hermes framework UUID (`80D5528F-2C78-3B90-B90F-747E89A9F880`). The main native app binaries differ (archive UUID `522E6BA9-D9D1-3A04-B189-58C794224E4C`; EAS 66 UUID `DF28BF87-6526-36C9-B801-778F4D3A638C`). This narrows the launch difference but does not establish its cause; signing, native build output, configuration, and installation state still need controlled comparison if EAS is revisited.

## Known limits of this baseline

- Native RevenueCat is absent from commit `480a739`; purchases and restore show “temporarily unavailable” in installed builds. Subscriptions are a release blocker.
- The temporary startup diagnostic in `frontend/index.js` remains in the source. Remove it only after normal error reporting is verified.
- The repository's shared Xcode scheme currently has an **uncommitted user change** selecting Release for Run. Preserve or resolve that change intentionally; do not silently discard it.
- The Hermes dSYM warning appeared during upload. It affects symbolication of Hermes-native crashes, not whether the upload succeeds or the app launches.
- The README still describes RevenueCat as active, SDK 55 build images, and EAS as the iOS release procedure. Those statements are stale.
- Supabase/OCR, auth, receipt persistence, scan limits, account deletion, purchase flows, and App Store metadata have not been certified by this baseline check.
- Build 67's exact source commit cannot be proven solely from Xcode's archive metadata. Its embedded JavaScript matches EAS build 66 byte-for-byte, which supports but does not fully prove source equivalence.

## Reproduction and next gate

For the next candidate, record the Git commit and working-tree status before building. Use the committed `frontend/ios/Divi.xcworkspace`, select the Divi scheme and Release configuration, create an archive with Xcode, then record the archive path, native UUID, bundled JavaScript hash, and **uploaded** build number. Install that precise number from TestFlight and run the receipt journey on a physical iPhone. Keep this build 67 archive until a newer candidate passes those checks.

The next sprint should reconcile local/Xcode/EAS build numbering and replace the stale iOS release instructions. The following sprint should test the receipt journey end to end, followed by restoring subscriptions as a separate change.
