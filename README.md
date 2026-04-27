# Divi — AI-Powered Bill Splitting

> Split dinner, not friendships.

Divi is a mobile-first bill splitting application for iOS that uses AI and computer vision to make splitting restaurant receipts with friends frictionless. Point your phone at a receipt, let the AI parse it, assign items to each person via voice or tap, and send everyone their total via SMS — all in under 60 seconds.

---

## Features

### Core Flow
- **Receipt Scanning** — Snap a photo or pick from your gallery. A custom Supabase Edge Function runs OCR via GPT-4o Vision and extracts all line items, tax, and tip in structured JSON.
- **Manual + AI-Assisted Assignment** — Assign items to contacts by tapping or use the voice agent to say *"give Sarah the salmon and the cocktail."* The agent processes natural language commands and performs the assignment live.
- **Smart Math** — Tax and tip are pro-rated proportionally across each person's items. Grand total always reconciles.
- **SMS Dispatch** — One tap sends each person a personalized text with their itemized total and your Venmo/Cash App/Zelle payment links.
- **Receipt History** — Every split is persisted to Supabase. Tap any past receipt to review the breakdown, resend the SMS, or re-edit the split.

### AI & Agent Layer
- **OCR Edge Function** (`ocr-vision`) — Deno-based Supabase Edge Function. Receives a base64 image, calls GPT-4o Vision with a structured output schema, returns validated line items.
- **Voice Transcription** (`voice-transcribe`) — Transcribes audio recordings to text via Whisper.
- **Assign Agent** (`agent-chat`) — NLP agent that parses voice commands and maps them to store mutations (assign, unassign, split across people).
- **Review Agent** (`review-agent`) — Handles review-screen voice commands (rename receipt, change date, move items between contacts).
- **Result Agent** (`result-agent`) — Manages item-level editing on the result screen via voice.

### UX Polish
- Animated custom splash screen (Divi logo animation) that holds until auth + profile + history are all preloaded
- Smooth tab transitions (`lazy: false`, `freezeOnBlur`, crossfade animation)
- Custom-branded modals, toasts, and inline validation (replacing all native `Alert.alert()` calls)
- Dark / light mode via system preference
- Offline detection banner with `@react-native-community/netinfo`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81 + Expo SDK 54 |
| **Navigation** | Expo Router v6 (file-based, stack + tabs) |
| **State** | Zustand 5 (`splitStore.ts`) |
| **Backend** | Supabase (PostgreSQL + RLS + Auth) |
| **AI / OCR** | OpenAI GPT-4o Vision (via Supabase Edge Functions) |
| **Voice** | OpenAI Whisper (via `expo-audio`) |
| **Styling** | Custom design system (`styles/theme.ts`) — Inter font family |
| **Animations** | React Native Reanimated 4 + Animated API |
| **Build** | EAS Build (production profile, New Architecture enabled) |

---

## Architecture

```
divi-split/
├── frontend/                   # React Native / Expo app
│   ├── app/                    # Expo Router pages
│   │   ├── (tabs)/             # Bottom tab screens (Home, History, Profile)
│   │   ├── receipt/[id].tsx    # Receipt detail / history view
│   │   ├── scan.tsx            # Camera scanner
│   │   ├── review.tsx          # Edit extracted items & totals
│   │   ├── assign.tsx          # Assign items to contacts
│   │   ├── result.tsx          # Final breakdown before SMS
│   │   └── auth.tsx            # Supabase email/password auth
│   ├── components/             # Reusable UI components
│   ├── stores/
│   │   └── splitStore.ts       # Central Zustand store (receipt + contacts state)
│   ├── utils/                  # Contexts, hooks, math utilities
│   └── styles/
│       └── theme.ts            # Design tokens (colors, fonts, spacing, radii)
├── supabase/
│   └── functions/              # Deno Edge Functions
│       ├── ocr-vision/         # GPT-4o Vision OCR
│       ├── voice-transcribe/   # Whisper transcription
│       ├── agent-chat/         # Assign screen NLP agent
│       ├── review-agent/       # Review screen NLP agent
│       └── result-agent/       # Result screen NLP agent
└── docs/                       # Feature specs
    ├── voice_ai_spec.md
    ├── item_categorization_spec.md
    ├── error_handling_spec.md
    └── ux_smoothness_spec.md
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- Xcode 15+ (for iOS simulator / device)

### Setup

```bash
# 1. Install frontend dependencies
cd frontend
npm install

# 2. Set environment variables
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# 3. Run on iOS simulator
npx expo run:ios

# 4. Or start the Expo dev server
npx expo start
```

### Supabase Edge Functions (local)

```bash
supabase start
supabase functions serve ocr-vision --env-file ./supabase/.env.local
```

---

## Building for TestFlight

```bash
# Production EAS build
eas build -p ios --profile production

# Submit to TestFlight (fill in eas.json submit profile first)
eas submit -p ios --latest
```

The `eas.json` `submit.production.ios` block requires:
- `appleId` — your Apple ID email
- `ascAppId` — App Store Connect App ID (found in App Information)
- `appleTeamId` — `7KK4AZ4AUY`

---

## Database Schema (Supabase)

| Table | Purpose |
|---|---|
| `profiles` | User profile, payment handles (Venmo, Cash App, Zelle) |
| `receipts` | Top-level receipt (name, total, tax, tip, date) |
| `receipt_items` | Line items belonging to a receipt |
| `contacts` | People added to a split (name + phone number) |
| `assignments` | Maps `receipt_items` → `contacts` |

All tables are protected by Row-Level Security (RLS). Users can only read/write their own data.

---

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `OPENAI_API_KEY` | Set as a Supabase secret for Edge Functions |

---

## Design System

The app uses a custom token-based design system defined in `frontend/styles/theme.ts`:

- **Font:** Inter (Regular, Medium, SemiBold, Bold)
- **Primary color:** `#00C37F` (Divi Green)
- **Semantic colors:** `error`, `warning`, `success`
- **Spacing scale:** `xs → xxxl`
- **Border radii:** `sm, md, lg, xl, full`
